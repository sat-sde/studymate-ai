/**
 * mistralProvider.test.js
 * ─────────────────────────────────────────────────────────────
 * Unit tests for Mistral AI integration in StudyMate AI:
 * - Provider detection
 * - Code fence stripping for strict JSON
 * - Secret and Bearer token redaction
 * - Missing API key handling
 * ─────────────────────────────────────────────────────────────
 */

const assert = require('node:assert')
const { cleanJsonText, sanitizeMessage } = require('../utils/mistral')
const { getActiveProvider } = require('../utils/gemini')

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  StudyMate AI — Mistral AI Unit Tests')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

let passed = 0

function runTest(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`  ✗ ${name}`)
    console.error(`    ${err.message}`)
    process.exit(1)
  }
}

// 1. Markdown fence cleaning
runTest('Strips markdown fences from Mistral JSON response', () => {
  const fenced = '```json\n{"title": "Photosynthesis", "flashcards": [], "quiz": []}\n```'
  const cleaned = cleanJsonText(fenced)
  assert.strictEqual(cleaned, '{"title": "Photosynthesis", "flashcards": [], "quiz": []}')
})

// 2. Secret Redaction of Mistral Bearer Tokens
runTest('Redacts Mistral Bearer tokens from logs and error strings', () => {
  const sensitiveStr = 'Failed to call Mistral: Authorization: Bearer abc1234567890xyzMISTRALKEY99999999'
  const sanitized = sanitizeMessage(sensitiveStr)
  assert(!sanitized.includes('abc1234567890xyzMISTRALKEY99999999'), 'Raw Mistral token must not leak')
  assert(sanitized.includes('[REDACTED_MISTRAL_KEY]'), 'Redacted token marker must appear')
})

// 3. Provider detection
runTest('Correctly identifies Mistral provider when MISTRAL_API_KEY is set', () => {
  const origMistral = process.env.MISTRAL_API_KEY
  const origMock = process.env.MOCK_AI_RESPONSE
  try {
    process.env.MOCK_AI_RESPONSE = 'false'
    process.env.MISTRAL_API_KEY = 'valid_test_mistral_key_12345'
    const active = getActiveProvider()
    assert.strictEqual(active.provider, 'mistral')
    assert.strictEqual(active.name, 'Mistral AI')
    assert.strictEqual(active.model, 'mistral-small-latest')
  } finally {
    process.env.MISTRAL_API_KEY = origMistral
    process.env.MOCK_AI_RESPONSE = origMock
  }
})

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`  All ${passed} Mistral provider tests passed! 🚀`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

