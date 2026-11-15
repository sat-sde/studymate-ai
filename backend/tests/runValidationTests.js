/**
 * runValidationTests.js
 * ─────────────────────────────────────────────────────────────
 * Runs all validation test cases and prints a clear report.
 * No external test framework needed — pure Node.js.
 *
 * Run with:  node tests/runValidationTests.js
 * ─────────────────────────────────────────────────────────────
 */

const { validateStudyMaterial } = require('../utils/validateStudyMaterial')
const {
  VALID_STUDY_MATERIAL,
  INVALID_NULL,
  INVALID_WRONG_TYPE,
  INVALID_MISSING_TITLE,
  INVALID_EMPTY_TITLE,
  INVALID_TOO_FEW_FLASHCARDS,
  INVALID_FLASHCARD_MISSING_ANSWER,
  INVALID_DUPLICATE_FLASHCARD_ID,
  INVALID_TOO_FEW_QUIZ,
  INVALID_QUIZ_WRONG_OPTIONS_COUNT,
  INVALID_CORRECT_ANSWER_OUT_OF_RANGE,
  INVALID_CORRECT_ANSWER_WRONG_TYPE,
  INVALID_MISSING_EXPLANATION,
  INVALID_DUPLICATE_QUIZ_ID,
} = require('./testData')

// ── ANSI colour helpers ───────────────────────────────────────
const GREEN  = (s) => `\x1b[32m${s}\x1b[0m`
const RED    = (s) => `\x1b[31m${s}\x1b[0m`
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`
const BOLD   = (s) => `\x1b[1m${s}\x1b[0m`
const DIM    = (s) => `\x1b[2m${s}\x1b[0m`

// ── Test case definitions ─────────────────────────────────────
// Each test has:
//   label       — human-readable name
//   data        — the value to validate
//   expectValid — true if we expect it to pass, false if it should fail
//   expectErrors — optional keywords we expect in the error messages
const TEST_CASES = [
  // ✅ Valid case
  {
    label: 'Valid complete study material',
    data: VALID_STUDY_MATERIAL,
    expectValid: true,
  },

  // ❌ Invalid cases
  {
    label: 'Null data',
    data: INVALID_NULL,
    expectValid: false,
    expectErrors: ['null'],
  },
  {
    label: 'Wrong type (string instead of object)',
    data: INVALID_WRONG_TYPE,
    expectValid: false,
    expectErrors: ['object'],
  },
  {
    label: 'Missing title field',
    data: INVALID_MISSING_TITLE,
    expectValid: false,
    expectErrors: ['title'],
  },
  {
    label: 'Title is a blank/whitespace string',
    data: INVALID_EMPTY_TITLE,
    expectValid: false,
    expectErrors: ['title'],
  },
  {
    label: 'Only 3 flashcards (need exactly 5)',
    data: INVALID_TOO_FEW_FLASHCARDS,
    expectValid: false,
    expectErrors: ['flashcards', '5'],
  },
  {
    label: 'Flashcard missing answer field',
    data: INVALID_FLASHCARD_MISSING_ANSWER,
    expectValid: false,
    expectErrors: ['answer'],
  },
  {
    label: 'Duplicate flashcard IDs',
    data: INVALID_DUPLICATE_FLASHCARD_ID,
    expectValid: false,
    expectErrors: ['unique'],
  },
  {
    label: 'Only 2 quiz questions (need exactly 5)',
    data: INVALID_TOO_FEW_QUIZ,
    expectValid: false,
    expectErrors: ['quiz', '5'],
  },
  {
    label: 'Quiz question with only 3 options (need exactly 4)',
    data: INVALID_QUIZ_WRONG_OPTIONS_COUNT,
    expectValid: false,
    expectErrors: ['options', '4'],
  },
  {
    label: 'correctAnswer out of range (value: 5)',
    data: INVALID_CORRECT_ANSWER_OUT_OF_RANGE,
    expectValid: false,
    expectErrors: ['correctAnswer', '0', '3'],
  },
  {
    label: 'correctAnswer is a string instead of number',
    data: INVALID_CORRECT_ANSWER_WRONG_TYPE,
    expectValid: false,
    expectErrors: ['correctAnswer'],
  },
  {
    label: 'Quiz item missing explanation',
    data: INVALID_MISSING_EXPLANATION,
    expectValid: false,
    expectErrors: ['explanation'],
  },
  {
    label: 'Duplicate quiz IDs',
    data: INVALID_DUPLICATE_QUIZ_ID,
    expectValid: false,
    expectErrors: ['unique'],
  },
]

// ── Runner ───────────────────────────────────────────────────
let passed = 0
let failed = 0

console.log(BOLD('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
console.log(BOLD('  StudyMate AI — Validation Function Test Suite'))
console.log(BOLD('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

TEST_CASES.forEach(({ label, data, expectValid, expectErrors = [] }, index) => {
  const result = validateStudyMaterial(data)
  const num = String(index + 1).padStart(2, ' ')

  // Did the valid/invalid expectation match?
  const validityMatch = result.valid === expectValid

  // Did all expected error keywords appear in the error messages?
  const errorsText = result.errors.join(' ').toLowerCase()
  const keywordsMatch = expectErrors.every((kw) =>
    errorsText.includes(kw.toLowerCase())
  )

  const testPassed = validityMatch && keywordsMatch

  if (testPassed) {
    passed++
    console.log(`  ${GREEN('✓')} ${num}. ${label}`)
  } else {
    failed++
    console.log(`  ${RED('✗')} ${num}. ${label}`)
    if (!validityMatch) {
      console.log(
        DIM(`       Expected valid=${expectValid}, got valid=${result.valid}`)
      )
    }
    if (!keywordsMatch) {
      const missing = expectErrors.filter(
        (kw) => !errorsText.includes(kw.toLowerCase())
      )
      console.log(
        DIM(`       Missing keywords in errors: ${missing.join(', ')}`)
      )
    }
    if (result.errors.length > 0) {
      result.errors.forEach((e) => {
        console.log(DIM(`       → ${e}`))
      })
    }
  }
})

// ── Summary ──────────────────────────────────────────────────
const total = TEST_CASES.length
console.log(BOLD('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
console.log(
  `  Results: ${GREEN(`${passed} passed`)}  ${failed > 0 ? RED(`${failed} failed`) : ''}  ${DIM(`/ ${total} total`)}`
)
console.log(BOLD('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

// Exit with non-zero code if any test failed (useful for CI)
if (failed > 0) process.exit(1)

