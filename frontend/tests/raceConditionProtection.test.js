/**
 * raceConditionProtection.test.js
 * ─────────────────────────────────────────────────────────────
 * Tests and verifies race condition protection:
 * 1. An older slow request never overwrites a newer fast request.
 * 2. AbortController safely cancels in-flight requests.
 * 3. Aborted requests do not trigger error alerts or wipe UI state.
 * 4. Loading state remains true until the latest active request completes.
 * 5. Out-of-order responses with failures do not overwrite valid content.
 * 6. High-concurrency rapid fire (5 rapid requests) only resolves latest.
 * ─────────────────────────────────────────────────────────────
 */

import assert from 'node:assert'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  StudyMate AI — Race Condition Protection Test Suite')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

class RaceConditionHarness {
  constructor() {
    this.studyMaterial = null
    this.isLoading = false
    this.error = null
    this.activeAbortController = null
    this.latestRequestId = 0
    this.renderLog = []
  }

  async startRequest(payload, delayMs, shouldFail = false) {
    // 1. Abort previous request
    if (this.activeAbortController) {
      this.activeAbortController.abort()
    }

    // 2. Create fresh controller and request ID
    const controller = new AbortController()
    this.activeAbortController = controller
    const currentRequestId = ++this.latestRequestId

    this.error = null
    this.isLoading = true

    try {
      // Simulate network latency with cancellation check
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (controller.signal.aborted) {
            const err = new Error('Request was canceled by a newer request.')
            err.name = 'AbortError'
            reject(err)
          } else if (shouldFail) {
            reject(new Error(`Server error on request #${currentRequestId}`))
          } else {
            resolve(payload)
          }
        }, delayMs)

        controller.signal.addEventListener('abort', () => {
          clearTimeout(timer)
          const err = new Error('Request was canceled by a newer request.')
          err.name = 'AbortError'
          reject(err)
        }, { once: true })
      })

      // 3. Race condition check: Only latest request updates UI
      if (currentRequestId === this.latestRequestId) {
        this.studyMaterial = result
        this.renderLog.push(`Rendered #${currentRequestId}: ${result.title}`)
      } else {
        this.renderLog.push(`Discarded #${currentRequestId}: superseded by #${this.latestRequestId}`)
      }
    } catch (err) {
      // 4. Safely handle aborted requests
      if (err.name === 'AbortError' || controller.signal.aborted) {
        this.renderLog.push(`Aborted #${currentRequestId}`)
        return
      }

      if (currentRequestId === this.latestRequestId) {
        this.error = err.message
        this.renderLog.push(`Error on #${currentRequestId}: ${err.message}`)
      }
    } finally {
      // 5. Only reset loading state if this request is still the latest one
      if (currentRequestId === this.latestRequestId) {
        this.isLoading = false
        this.activeAbortController = null
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Test 1: Slow Request 1 vs Fast Request 2 (Out-of-Order Completion)
// ─────────────────────────────────────────────────────────────
async function testOutOfOrderRequests() {
  const harness = new RaceConditionHarness()

  console.log('Testing Test 1: Older slow request (300ms) vs newer fast request (50ms)...')

  // Request 1 is slow (300ms)
  const req1Promise = harness.startRequest({ title: 'Topic 1 (Old)' }, 300)

  // User starts Request 2 immediately after (fast: 50ms)
  const req2Promise = harness.startRequest({ title: 'Topic 2 (New)' }, 50)

  await Promise.all([req1Promise, req2Promise])

  assert.strictEqual(harness.studyMaterial.title, 'Topic 2 (New)', 'Newer request must win')
  assert.strictEqual(harness.isLoading, false, 'Loading must be false after completion')
  assert.strictEqual(harness.error, null, 'Error must be null')
  assert(harness.renderLog.includes('Rendered #2: Topic 2 (New)'))
  console.log('  ✓ Test 1 Passed: Out-of-order completion handled; Request 2 preserved.\n')
}

// ─────────────────────────────────────────────────────────────
// Test 2: AbortController cancels Request 1 cleanly
// ─────────────────────────────────────────────────────────────
async function testAbortControllerCancellation() {
  const harness = new RaceConditionHarness()

  console.log('Testing Test 2: AbortController cancels in-flight request on new submission...')

  const p1 = harness.startRequest({ title: 'Topic A' }, 200)
  assert.strictEqual(harness.isLoading, true)

  const p2 = harness.startRequest({ title: 'Topic B' }, 50)
  assert.strictEqual(harness.isLoading, true, 'Loading must remain true while Request 2 runs')

  await Promise.all([p1, p2])

  assert.strictEqual(harness.studyMaterial.title, 'Topic B')
  assert.strictEqual(harness.error, null, 'Aborted request must not produce an error alert')
  assert(harness.renderLog.includes('Aborted #1'), 'Request 1 was aborted')
  console.log('  ✓ Test 2 Passed: Request 1 cleanly aborted without error.\n')
}

// ─────────────────────────────────────────────────────────────
// Test 3: Stale Request Fails — Does NOT Overwrite Valid State
// ─────────────────────────────────────────────────────────────
async function testStaleRequestFailureDoesNotCorruptState() {
  const harness = new RaceConditionHarness()

  console.log('Testing Test 3: Stale request failure does not wipe valid content or show error...')

  // Request 1 will fail after 250ms
  const p1 = harness.startRequest({ title: 'Failed Topic' }, 250, true)

  // Request 2 succeeds after 60ms
  const p2 = harness.startRequest({ title: 'Successful Topic' }, 60, false)

  await Promise.all([p1, p2])

  assert.strictEqual(harness.studyMaterial.title, 'Successful Topic', 'Valid content preserved')
  assert.strictEqual(harness.error, null, 'Stale failure must not show error banner')
  console.log('  ✓ Test 3 Passed: Stale failure ignored; active valid state intact.\n')
}

// ─────────────────────────────────────────────────────────────
// Test 4: Rapid-Fire Submissions (5 Concurrent Requests)
// ─────────────────────────────────────────────────────────────
async function testRapidFireSubmissions() {
  const harness = new RaceConditionHarness()

  console.log('Testing Test 4: Rapid-fire 5 requests fired sequentially...')

  const promises = []
  for (let i = 1; i <= 5; i++) {
    const delay = i === 5 ? 80 : 200 // Request 5 completes after 80ms
    promises.push(harness.startRequest({ title: `Topic ${i}` }, delay))
  }

  await Promise.all(promises)

  assert.strictEqual(harness.latestRequestId, 5, 'Must have recorded 5 requests')
  assert.strictEqual(harness.studyMaterial.title, 'Topic 5', 'Only request 5 must be in state')
  assert.strictEqual(harness.isLoading, false, 'Loading must be false')
  assert.strictEqual(harness.error, null, 'Error must be null')
  console.log('  ✓ Test 4 Passed: Only latest request (#5) displayed; earlier 4 safely canceled.\n')
}

// Run all tests
await testOutOfOrderRequests()
await testAbortControllerCancellation()
await testStaleRequestFailureDoesNotCorruptState()
await testRapidFireSubmissions()

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  All Race Condition Protection Tests Passed! 🏁')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

