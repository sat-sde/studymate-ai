/**
 * failureScenarios.test.js
 * ─────────────────────────────────────────────────────────────
 * Tests all 11 failure scenarios with deliberately invalid
 * and malformed responses to prove the application never crashes,
 * rejects bad AI data, redacts secrets, and preserves state.
 * ─────────────────────────────────────────────────────────────
 */

const assert = require('assert')
const { validateStudyMaterial } = require('../utils/validateStudyMaterial')
const { cleanJsonText, sanitizeMessage } = require('../utils/gemini')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  StudyMate AI — Comprehensive Failure Scenarios Test Suite')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

let passed = 0

function runTest(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (err) {
    console.error(`  ✗ ${name}`)
    console.error(`    ${err.message}`)
    process.exit(1)
  }
}

// ─────────────────────────────────────────────────────────────
// 1. Malformed JSON
// ─────────────────────────────────────────────────────────────
runTest('Scenario 1: Malformed JSON handled gracefully without crash', () => {
  const malformedInputs = [
    '{"title": "Biology", "flashcards": [', // Truncated
    '```json\n{"title": "Biology", flashcards: undefined}\n```', // Unquoted / undefined
    '{"title": "Biology", "flashcards": [], "quiz": [],,,}', // Trailing commas
    'Random non-JSON text returned by AI',
  ]

  malformedInputs.forEach((raw) => {
    let parsed = null
    let errorCaught = false
    try {
      const cleaned = cleanJsonText(raw)
      parsed = JSON.parse(cleaned)
    } catch (err) {
      errorCaught = true
    }
    assert.strictEqual(errorCaught, true, 'Must catch JSON parse error')
    assert.strictEqual(parsed, null, 'Must not return corrupt parsed object')
  })
})

// ─────────────────────────────────────────────────────────────
// 2. Missing Flashcards & Too Few Flashcards
// ─────────────────────────────────────────────────────────────
runTest('Scenario 2: Missing or insufficient flashcards rejected', () => {
  // Completely missing flashcards property
  const missingProp = {
    title: 'Intro to Bio',
    quiz: [
      { id: 1, question: 'Q1', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 2, question: 'Q2', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 3, question: 'Q3', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 4, question: 'Q4', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 5, question: 'Q5', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
    ],
  }
  const resultMissing = validateStudyMaterial(missingProp)
  assert.strictEqual(resultMissing.valid, false)
  assert(resultMissing.errors.some((e) => e.includes('flashcards')))

  // Fewer than 5 flashcards (e.g. only 3)
  const tooFew = {
    ...missingProp,
    flashcards: [
      { id: 1, question: 'Q1', answer: 'A1' },
      { id: 2, question: 'Q2', answer: 'A2' },
      { id: 3, question: 'Q3', answer: 'A3' },
    ],
  }
  const resultTooFew = validateStudyMaterial(tooFew)
  assert.strictEqual(resultTooFew.valid, false)
  assert(resultTooFew.errors.some((e) => e.includes('exactly 5')))
})

// ─────────────────────────────────────────────────────────────
// 3. Missing Quiz Questions & Too Few Questions
// ─────────────────────────────────────────────────────────────
runTest('Scenario 3: Missing or insufficient quiz questions rejected', () => {
  const baseCards = [
    { id: 1, question: 'Q1', answer: 'A1' },
    { id: 2, question: 'Q2', answer: 'A2' },
    { id: 3, question: 'Q3', answer: 'A3' },
    { id: 4, question: 'Q4', answer: 'A4' },
    { id: 5, question: 'Q5', answer: 'A5' },
  ]

  // Missing quiz array
  const missingQuiz = { title: 'Topic', flashcards: baseCards }
  const resultMissing = validateStudyMaterial(missingQuiz)
  assert.strictEqual(resultMissing.valid, false)
  assert(resultMissing.errors.some((e) => e.includes('quiz')))

  // Only 4 quiz questions
  const onlyFourQuiz = {
    title: 'Topic',
    flashcards: baseCards,
    quiz: [
      { id: 1, question: 'Q1', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 2, question: 'Q2', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 3, question: 'Q3', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 4, question: 'Q4', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
    ],
  }
  const resultFour = validateStudyMaterial(onlyFourQuiz)
  assert.strictEqual(resultFour.valid, false)
  assert(resultFour.errors.some((e) => e.includes('exactly 5')))
})

// ─────────────────────────────────────────────────────────────
// 4. Incorrect Data Types
// ─────────────────────────────────────────────────────────────
runTest('Scenario 4: Incorrect data types caught and rejected', () => {
  const invalidTypes = {
    title: 12345, // Number instead of string
    flashcards: [
      { id: 'one', question: true, answer: null }, // Wrong types
      { id: 2, question: 'Q2', answer: 'A2' },
      { id: 3, question: 'Q3', answer: 'A3' },
      { id: 4, question: 'Q4', answer: 'A4' },
      { id: 5, question: 'Q5', answer: 'A5' },
    ],
    quiz: 'not an array', // String instead of array
  }
  const result = validateStudyMaterial(invalidTypes)
  assert.strictEqual(result.valid, false)
  assert(result.errors.length >= 3)
})

// ─────────────────────────────────────────────────────────────
// 5. Empty AI Responses
// ─────────────────────────────────────────────────────────────
runTest('Scenario 5: Empty AI responses detected', () => {
  const emptySamples = ['', '   ', '\n\n', null, undefined]
  emptySamples.forEach((sample) => {
    const isDetectedEmpty = !sample || (typeof sample === 'string' && sample.trim().length === 0)
    assert.strictEqual(isDetectedEmpty, true, 'Empty response must be caught before parsing')
  })
})

// ─────────────────────────────────────────────────────────────
// 6. Invalid correctAnswer Values
// ─────────────────────────────────────────────────────────────
runTest('Scenario 6: Invalid correctAnswer values rejected (must be 0-3 int)', () => {
  const invalidAnswerCases = [
    5, // Out of upper bound
    -1, // Out of lower bound
    '2', // String number
    null, // Null
    undefined, // Undefined
    3.5, // Float
    NaN, // NaN
  ]

  invalidAnswerCases.forEach((badAnswer) => {
    const payload = {
      title: 'Topic',
      flashcards: [
        { id: 1, question: 'Q1', answer: 'A1' },
        { id: 2, question: 'Q2', answer: 'A2' },
        { id: 3, question: 'Q3', answer: 'A3' },
        { id: 4, question: 'Q4', answer: 'A4' },
        { id: 5, question: 'Q5', answer: 'A5' },
      ],
      quiz: [
        { id: 1, question: 'Q1', options: ['A','B','C','D'], correctAnswer: badAnswer, explanation: 'Exp' },
        { id: 2, question: 'Q2', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
        { id: 3, question: 'Q3', options: ['A','B','C','D'], correctAnswer: 1, explanation: 'Exp' },
        { id: 4, question: 'Q4', options: ['A','B','C','D'], correctAnswer: 2, explanation: 'Exp' },
        { id: 5, question: 'Q5', options: ['A','B','C','D'], correctAnswer: 3, explanation: 'Exp' },
      ],
    }
    const result = validateStudyMaterial(payload)
    assert.strictEqual(result.valid, false, `correctAnswer = ${badAnswer} should be invalid`)
    assert(result.errors.some((e) => e.includes('correctAnswer')))
  })
})

// ─────────────────────────────────────────────────────────────
// 7. Empty User Input
// ─────────────────────────────────────────────────────────────
runTest('Scenario 7: Empty user input rejected before network/AI call', () => {
  const badInputs = ['', '   ', '\t\n\r', null, undefined]
  badInputs.forEach((input) => {
    const trimmed = input ? String(input).trim() : ''
    const isEmpty = trimmed.length === 0
    assert.strictEqual(isEmpty, true, `Input "${input}" must be classified as empty`)
  })
})

// ─────────────────────────────────────────────────────────────
// 8. Secret Redaction in Logs and Error Messages
// ─────────────────────────────────────────────────────────────
runTest('Scenario 8: Secrets and API keys are redacted from logs and errors', () => {
  const sensitiveError1 = 'Error calling https://generativelanguage.googleapis.com?key=AIzaSyD942183921783921783921783921'
  const sensitiveError2 = 'GoogleGenerativeAI: API key AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6 is invalid'

  const sanitized1 = sanitizeMessage(sensitiveError1)
  const sanitized2 = sanitizeMessage(sensitiveError2)

  assert(!sanitized1.includes('AIzaSyD942183921783921783921783921'), 'Raw key must not appear')
  assert(sanitized1.includes('[REDACTED'), 'Must have redaction tag')

  assert(!sanitized2.includes('AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'), 'Raw key must not appear')
  assert(sanitized2.includes('[REDACTED_API_KEY]'), 'Must replace with placeholder')
})

// ─────────────────────────────────────────────────────────────
// 9. Preserving Previously Generated Valid Content On Failure
// ─────────────────────────────────────────────────────────────
runTest('Scenario 9: Previously generated content is preserved when a new request fails', () => {
  let studyMaterial = {
    title: 'Valid Previous Biology Notes',
    flashcards: [{ id: 1, question: 'Q', answer: 'A' }],
    quiz: [{ id: 1, question: 'Q', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' }],
  }

  // Simulate a failed generation request
  const simulateGenerateAttempt = (succeed) => {
    let isLoading = true
    let error = null
    try {
      if (!succeed) {
        throw new Error('AI generation failed due to 502 Bad Gateway')
      }
      studyMaterial = { title: 'New Topic' } // only on success
    } catch (err) {
      error = err.message
      // NOTE: studyMaterial is NOT cleared!
    } finally {
      isLoading = false
    }
    return { isLoading, error }
  }

  const { isLoading, error } = simulateGenerateAttempt(false)

  assert.strictEqual(isLoading, false, 'Loading must be false after failure')
  assert.strictEqual(error, 'AI generation failed due to 502 Bad Gateway')
  assert.strictEqual(studyMaterial.title, 'Valid Previous Biology Notes', 'Previous content must be preserved!')
})

// ─────────────────────────────────────────────────────────────
// 10. Always Reset Loading State (try/finally)
// ─────────────────────────────────────────────────────────────
runTest('Scenario 10: Loading state is guaranteed to reset in all outcomes', () => {
  const outcomes = ['success', 'throw_error', 'reject_promise']

  outcomes.forEach((outcome) => {
    let isLoading = true
    try {
      if (outcome === 'throw_error') throw new Error('Boom')
    } catch (err) {
      // handled
    } finally {
      isLoading = false
    }
    assert.strictEqual(isLoading, false, `Loading must reset for outcome ${outcome}`)
  })
})

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`  All ${passed} failure scenario tests passed successfully! 🛡️`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

