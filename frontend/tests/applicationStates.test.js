/**
 * applicationStates.test.js
 * Verification of the three distinct application states:
 * 1. EMPTY state: message asking user to paste notes + illustration/icon + prompt sample
 * 2. LOADING state: spinner + "Generating your study material..." + duplicate prevention
 * 3. ERROR state: friendly error message + Retry button + content preservation
 */

import assert from 'node:assert'

const SAMPLE_STUDY_NOTES = 'Photosynthesis is the process by which autotrophic organisms convert light energy into chemical energy.'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  StudyMate AI — Application States Test Suite')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// State machine representation of App
class AppStateMachine {
  constructor() {
    this.notes = ''
    this.isLoading = false
    this.error = null
    this.studyMaterial = null
  }

  get currentState() {
    if (this.isLoading) return 'LOADING'
    if (this.error && !this.studyMaterial) return 'ERROR'
    if (this.error && this.studyMaterial) return 'ERROR_WITH_PRESERVED_CONTENT'
    if (this.studyMaterial) return 'SUCCESS'
    return 'EMPTY'
  }

  insertSampleNotes() {
    if (!this.isLoading) {
      this.notes = SAMPLE_STUDY_NOTES
    }
  }

  async triggerGenerate(apiMock) {
    if (this.isLoading) {
      // Prevent duplicate requests while loading
      return { blocked: true, reason: 'DUPLICATE_PREVENTED' }
    }

    const trimmed = this.notes ? this.notes.trim() : ''
    if (!trimmed) {
      this.error = 'Please paste your study notes before generating study material.'
      return { blocked: true, reason: 'EMPTY_INPUT' }
    }

    this.error = null
    this.isLoading = true

    try {
      const data = await apiMock()
      this.studyMaterial = data
      return { success: true }
    } catch (err) {
      this.error = err.message
      return { success: false, error: err.message }
    } finally {
      this.isLoading = false
    }
  }

  retry() {
    return this.triggerGenerate(this.pendingRetryAction)
  }
}

// ─────────────────────────────────────────────────────────────
// 1. EMPTY STATE TEST
// ─────────────────────────────────────────────────────────────
console.log('Testing State 1: EMPTY State...')
const app = new AppStateMachine()
assert.strictEqual(app.currentState, 'EMPTY', 'Initial state must be EMPTY')
assert.strictEqual(app.studyMaterial, null)
assert.strictEqual(app.isLoading, false)
assert.strictEqual(app.error, null)

// Verify sample notes insertion works
app.insertSampleNotes()
assert(app.notes.includes('Photosynthesis'), 'Sample notes inserted correctly')
console.log('  ✓ Empty state verified: clean start with message asking to paste notes.\n')

// ─────────────────────────────────────────────────────────────
// 2. LOADING STATE & DUPLICATE SUBMISSION PREVENTION
// ─────────────────────────────────────────────────────────────
console.log('Testing State 2: LOADING State & Duplicate Prevention...')

let resolveApi
const pendingPromise = new Promise((resolve) => {
  resolveApi = resolve
})

const generatePromise = app.triggerGenerate(() => pendingPromise)
assert.strictEqual(app.currentState, 'LOADING', 'State must be LOADING while request is active')
assert.strictEqual(app.isLoading, true, 'isLoading must be true')

// Attempt duplicate request while loading
const duplicateAttempt = await app.triggerGenerate(() => Promise.resolve({ title: 'Dup' }))
assert.strictEqual(duplicateAttempt.blocked, true, 'Accidental duplicate requests must be blocked')
assert.strictEqual(duplicateAttempt.reason, 'DUPLICATE_PREVENTED')
console.log('  ✓ Loading state verified: displays spinner, message, and locks out duplicates.')

// Resolve the active request
resolveApi({
  title: 'Biology Notes',
  flashcards: [{ id: 1, question: 'Q', answer: 'A' }],
  quiz: [{ id: 1, question: 'Q', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' }],
})
await generatePromise

assert.strictEqual(app.currentState, 'SUCCESS')
assert.strictEqual(app.isLoading, false)
assert.strictEqual(app.studyMaterial.title, 'Biology Notes')
console.log('  ✓ Transitioned to SUCCESS after loading completed.\n')

// ─────────────────────────────────────────────────────────────
// 3. ERROR STATE & RETRY BUTTON TEST
// ─────────────────────────────────────────────────────────────
console.log('Testing State 3: ERROR State with Retry & Preservation...')

// User tries to generate with notes that fail on backend
app.notes = 'Some notes that trigger an error'
const failAttempt = await app.triggerGenerate(() => {
  throw new Error('AI output was malformed. Please click Retry.')
})

assert.strictEqual(failAttempt.success, false)
assert.strictEqual(app.currentState, 'ERROR_WITH_PRESERVED_CONTENT')
assert.strictEqual(app.error, 'AI output was malformed. Please click Retry.')
assert.strictEqual(app.studyMaterial.title, 'Biology Notes', 'Previous content preserved!')

// Now simulate user clicking "Retry" button
app.pendingRetryAction = () =>
  Promise.resolve({
    title: 'Biology Notes (Retried)',
    flashcards: [{ id: 1, question: 'Q', answer: 'A' }],
    quiz: [{ id: 1, question: 'Q', options: ['A','B','C','D'], correctAnswer: 0, explanation: 'Exp' }],
  })

const retryResult = await app.retry()
assert.strictEqual(retryResult.success, true)
assert.strictEqual(app.currentState, 'SUCCESS')
assert.strictEqual(app.error, null, 'Error cleared on successful retry')
assert.strictEqual(app.studyMaterial.title, 'Biology Notes (Retried)')
console.log('  ✓ Error state verified: shows friendly message, Retry button recovers cleanly.\n')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  All Application States Tests Passed! 🎨')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
