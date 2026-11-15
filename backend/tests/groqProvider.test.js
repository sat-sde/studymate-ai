/**
 * groqProvider.test.js
 * ─────────────────────────────────────────────────────────────
 * Unit tests for Groq AI integration in StudyMate AI:
 * - Provider detection
 * - Code fence stripping for strict JSON
 * - Secret redaction of Groq keys (gsk_...)
 * ─────────────────────────────────────────────────────────────
 */

const assert = require('node:assert')
const { cleanJsonText, sanitizeMessage } = require('../utils/groq')
const { getActiveProvider } = require('../utils/gemini')

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  StudyMate AI — Groq AI Unit Tests')
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
runTest('Strips markdown fences from Groq JSON response', () => {
  const fenced = '```json\n{"title": "Operating Systems", "flashcards": [], "quiz": []}\n```'
  const cleaned = cleanJsonText(fenced)
  assert.strictEqual(cleaned, '{"title": "Operating Systems", "flashcards": [], "quiz": []}')
})

// 2. Secret Redaction of Groq Keys
runTest('Redacts Groq keys (gsk_...) from logs and error strings', () => {
  const sensitiveStr = 'Failed calling Groq: key=gsk_mockTestKeyFake1234567890abcdefghijklmnopqrstuv'
  const sanitized = sanitizeMessage(sensitiveStr)
  assert(!sanitized.includes('gsk_mockTestKeyFake1234567890abcdefghijklmnopqrstuv'), 'Raw Groq key must not leak')
  assert(sanitized.includes('[REDACTED_GROQ_KEY]'), 'Redacted Groq key marker must appear')
})

// 3. Provider detection
runTest('Correctly identifies Groq provider when GROQ_API_KEY is set', () => {
  const origGroq = process.env.GROQ_API_KEY
  const origMock = process.env.MOCK_AI_RESPONSE
  try {
    process.env.MOCK_AI_RESPONSE = 'false'
    process.env.GROQ_API_KEY = 'gsk_test_mock_groq_key_1234567890abcdef'
    const active = getActiveProvider()
    assert.strictEqual(active.provider, 'groq')
    assert.strictEqual(active.name, 'Groq AI')
    assert.strictEqual(active.model, 'openai/gpt-oss-120b')
  } finally {
    process.env.GROQ_API_KEY = origGroq
    process.env.MOCK_AI_RESPONSE = origMock
  }
})

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`  All ${passed} Groq provider tests passed! ⚡`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
