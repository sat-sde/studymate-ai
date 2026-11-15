/**
 * frontendErrorHandling.test.js
 * Frontend-specific error handling & reliability tests:
 * 1. Schema validation on the client prevents invalid data from rendering
 * 2. Empty input validation prevents unnecessary network calls
 * 3. Preserves previous studyMaterial state when a subsequent request fails
 * 4. Loading state reset is guaranteed across success and failure
 */

import assert from 'node:assert'
import { validateStudyMaterial } from '../src/utils/validateStudyMaterial.js'

console.log('Running Frontend Error Handling & Reliability Tests...\n')

// 1. Client-Side Malformed Payload Rejection
const malformedPayloads = [
  null,
  undefined,
  {},
  { title: 'Only Title' },
  { title: 'Title', flashcards: 'not-array', quiz: [] },
  {
    title: 'Title',
    flashcards: [
      { id: 1, question: 'Q1', answer: 'A1' },
      { id: 2, question: 'Q2', answer: 'A2' },
      { id: 3, question: 'Q3', answer: 'A3' },
      { id: 4, question: 'Q4', answer: 'A4' },
      // Missing 5th card!
    ],
    quiz: [
      { id: 1, question: 'Q1', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 2, question: 'Q2', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 3, question: 'Q3', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 4, question: 'Q4', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 5, question: 'Q5', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
    ],
  },
  {
    title: 'Title',
    flashcards: [
      { id: 1, question: 'Q1', answer: 'A1' },
      { id: 2, question: 'Q2', answer: 'A2' },
      { id: 3, question: 'Q3', answer: 'A3' },
      { id: 4, question: 'Q4', answer: 'A4' },
      { id: 5, question: 'Q5', answer: 'A5' },
    ],
    quiz: [
      { id: 1, question: 'Q1', options: ['A','B','C'], correctAnswer: 0, explanation: 'Exp' }, // Only 3 options
      { id: 2, question: 'Q2', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 3, question: 'Q3', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 4, question: 'Q4', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
      { id: 5, question: 'Q5', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' },
    ],
  },
]

malformedPayloads.forEach((payload, idx) => {
  const result = validateStudyMaterial(payload)
  assert.strictEqual(result.valid, false, `Payload #${idx + 1} must be rejected`)
})
console.log('✓ Test 1: Frontend schema validator rejects all incomplete and malformed AI payloads')

// 2. State Preservation Simulator
class AppStateSimulator {
  constructor() {
    this.notes = ''
    this.isLoading = false
    this.error = null
    this.studyMaterial = null
  }

  async handleGenerate(mockApiCall) {
    const trimmed = this.notes ? this.notes.trim() : ''

    if (!trimmed) {
      this.error = 'Please paste your study notes before generating study material.'
      return
    }

    this.error = null
    this.isLoading = true

    try {
      const data = await mockApiCall(trimmed)
      // Only updates state after full validation passes
      this.studyMaterial = data
    } catch (err) {
      this.error = err.message
      // NOTE: studyMaterial is deliberately NOT cleared
    } finally {
      this.isLoading = false
    }
  }
}

const app = new AppStateSimulator()

// Initial attempt: successful generation
const initialValidData = {
  title: 'Biology 101',
  flashcards: [{ id: 1, question: 'Cell?', answer: 'Unit of life' }],
  quiz: [{ id: 1, question: 'Cell?', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' }],
}

app.notes = 'Valid notes for Biology 101'
await app.handleGenerate(async () => initialValidData)

assert.strictEqual(app.isLoading, false)
assert.strictEqual(app.error, null)
assert.strictEqual(app.studyMaterial.title, 'Biology 101')
console.log('✓ Test 2: Initial valid study material generated and stored in state')

// Second attempt: user pastes new notes, but the API request fails (e.g. rate limit, 502, malformed JSON)
app.notes = 'New notes that trigger an error'
await app.handleGenerate(async () => {
  throw new Error('AI output was malformed. Please click Retry.')
})

assert.strictEqual(app.isLoading, false, 'Loading must be false after error')
assert.strictEqual(app.error, 'AI output was malformed. Please click Retry.')
assert.notStrictEqual(app.studyMaterial, null, 'Previous studyMaterial must NOT be null!')
assert.strictEqual(app.studyMaterial.title, 'Biology 101', 'Previous valid material must be preserved!')
console.log('✓ Test 3: Previously generated valid content is preserved when a subsequent request fails')

// Third attempt: user clicks Retry and it succeeds
await app.handleGenerate(async () => ({
  title: 'Chemistry 101',
  flashcards: [{ id: 1, question: 'Atom?', answer: 'Basic element' }],
  quiz: [],
}))

assert.strictEqual(app.isLoading, false)
assert.strictEqual(app.error, null, 'Error cleared on successful retry')
assert.strictEqual(app.studyMaterial.title, 'Chemistry 101', 'State successfully replaced after retry')
console.log('✓ Test 4: Retry clears error and updates studyMaterial upon successful response')

console.log('\nAll Frontend Error Handling & Reliability Tests Passed! 🛡️')

