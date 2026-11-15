/**
 * api.js — Frontend API client for StudyMate AI
 * ─────────────────────────────────────────────────────────────
 * Complete error handling & race condition protection:
 * - Accepts external AbortSignal from caller
 * - Cancels older in-flight requests when a newer request starts
 * - 30-second request timeout
 * - Distinguishes user cancellation from genuine timeouts/network failures
 * - Complete schema validation before resolving
 * ─────────────────────────────────────────────────────────────
 */

import { validateStudyMaterial } from '../utils/validateStudyMaterial'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const REQUEST_TIMEOUT_MS = 30000

/**
 * Sends study notes to the Express backend and validates the structured response.
 * Supports cancellation via external AbortSignal to prevent race conditions.
 *
 * @param {string} notes - User's study notes
 * @param {AbortSignal|null} externalSignal - Optional signal to cancel this request
 * @returns {Promise<{ title: string, flashcards: Array, quiz: Array }>}
 */
export async function generateStudyMaterialApi(notes, externalSignal = null) {
  // 1. Client-side input validation
  const trimmed = notes ? notes.trim() : ''

  if (!trimmed) {
    throw new Error('Please enter study notes before generating study material.')
  }

  // 2. Offline check
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You appear to be offline. Please check your internet connection and click Retry.')
  }

  // 3. Setup internal AbortController combining external cancellation + timeout
  const internalController = new AbortController()

  // If already aborted before start
  if (externalSignal?.aborted) {
    const cancelErr = new Error('Request was canceled because a newer request was started.')
    cancelErr.name = 'AbortError'
    throw cancelErr
  }

  // Listen to caller abort (superseded request)
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => internalController.abort(), { once: true })
  }

  // Timeout controller
  let didTimeout = false
  const timeoutId = setTimeout(() => {
    didTimeout = true
    internalController.abort()
  }, REQUEST_TIMEOUT_MS)

  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes: trimmed }),
      signal: internalController.signal,
    })
  } catch (networkError) {
    clearTimeout(timeoutId)

    // Check if superseded by caller's signal
    if (externalSignal?.aborted) {
      const cancelErr = new Error('Request was canceled because a newer request was started.')
      cancelErr.name = 'AbortError'
      throw cancelErr
    }

    // Check if aborted due to timeout
    if (didTimeout) {
      throw new Error('Request timed out. The server or AI took too long to respond. Please click Retry.')
    }

    console.error('Network failure calling backend:', networkError)
    throw new Error(
      'Unable to connect to the StudyMate AI server. Please make sure the backend is running on http://localhost:3001 and click Retry.'
    )
  } finally {
    clearTimeout(timeoutId)
  }

  // 4. Parse server JSON response
  let result
  try {
    result = await response.json()
  } catch (jsonErr) {
    console.error('Failed to parse response JSON from backend:', jsonErr)
    throw new Error('The server returned an unreadable response format. Please click Retry.')
  }

  // 5. Handle HTTP status errors
  if (!response.ok) {
    const errorMsg =
      result?.error ||
      `Server error (${response.status}: ${response.statusText || 'Unknown error'})`
    throw new Error(errorMsg)
  }

  // 6. Validate response shape
  if (!result || !result.success || !result.data) {
    throw new Error('Server returned an unexpected payload structure. Please click Retry.')
  }

  // 7. Validate full schema on frontend before resolving
  const validation = validateStudyMaterial(result.data)
  if (!validation.valid) {
    console.error('Frontend schema validation failed:', validation.errors)
    throw new Error(
      `Received invalid study material from AI: ${validation.errors.slice(0, 2).join('; ')}. Please click Retry.`
    )
  }

  return result.data
}
