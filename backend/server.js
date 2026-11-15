/**
 * server.js — StudyMate AI Express Backend
 * ─────────────────────────────────────────────────────────────
 * Complete error handling and reliability:
 * - Empty input validation
 * - Malformed JSON handling
 * - Missing/incomplete schema validation
 * - Empty response handling
 * - Rate limit detection
 * - Request timeout handling
 * - Secret-sanitized logging
 */
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { generateStudyMaterial, sanitizeMessage } = require('./utils/gemini')
const { validateStudyMaterial } = require('./utils/validateStudyMaterial')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:5174'] }))
app.use(express.json({ limit: '50kb' }))

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'StudyMate AI backend is running!',
    model: 'gemini-2.0-flash',
    timestamp: new Date().toISOString(),
  })
})

/**
 * POST /api/generate
 * Handles study notes generation with complete error resilience.
 */
app.post('/api/generate', async (req, res) => {
  const { notes } = req.body || {}

  // 1. Validate Input (Empty or missing input)
  if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
    return res.status(400).json({
      success: false,
      code: 'EMPTY_INPUT',
      error: 'Please enter study notes before generating study material.',
    })
  }

  const trimmedNotes = notes.trim()

  if (trimmedNotes.length > 10000) {
    return res.status(400).json({
      success: false,
      code: 'INPUT_TOO_LONG',
      error: 'Study notes must be under 10,000 characters.',
    })
  }

  try {
    // 2. Call Gemini
    const studyMaterial = await generateStudyMaterial(trimmedNotes)

    // 3. Validate AI response against schema
    const validation = validateStudyMaterial(studyMaterial)

    if (!validation.valid) {
      console.error('❌ AI response schema validation failed:', validation.errors)
      return res.status(502).json({
        success: false,
        code: 'INVALID_AI_SCHEMA',
        error: 'The AI output was incomplete or formatted incorrectly. Please click Retry.',
        details: validation.errors,
      })
    }

    console.log(`✅ Success: "${studyMaterial.title}" generated with 5 flashcards and 5 quiz items.`)

    return res.json({
      success: true,
      data: studyMaterial,
    })
  } catch (err) {
    const safeError = sanitizeMessage(err.message || 'Unknown error')
    console.error(`❌ Handled error in /api/generate [${err.code || 'UNKNOWN'}]:`, safeError)

    // Missing API Key
    if (err.code === 'MISSING_API_KEY' || safeError.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        success: false,
        code: 'MISSING_API_KEY',
        error: 'GEMINI_API_KEY is not set. Please add your Gemini API key to backend/.env and restart.',
      })
    }

    // Timeout
    if (err.code === 'TIMEOUT' || safeError.includes('timed out')) {
      return res.status(504).json({
        success: false,
        code: 'TIMEOUT',
        error: 'The AI request timed out. The server or AI took too long to respond. Please click Retry.',
      })
    }

    // Empty AI response
    if (err.code === 'EMPTY_RESPONSE') {
      return res.status(502).json({
        success: false,
        code: 'EMPTY_RESPONSE',
        error: 'The AI service returned an empty response. Please click Retry.',
      })
    }

    // Malformed JSON
    if (err.code === 'MALFORMED_JSON') {
      return res.status(502).json({
        success: false,
        code: 'MALFORMED_JSON',
        error: 'The AI response could not be parsed as valid JSON. Please click Retry.',
      })
    }

    // Rate Limit / Quota Exceeded
    if (
      safeError.includes('429') ||
      safeError.toLowerCase().includes('quota') ||
      safeError.includes('RESOURCE_EXHAUSTED')
    ) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT',
        error: 'Gemini API rate limit reached. Please wait a moment and click Retry.',
      })
    }

    // General AI / Network Error
    return res.status(502).json({
      success: false,
      code: 'AI_SERVICE_ERROR',
      error: 'The AI service encountered an error while generating your study material. Please click Retry.',
    })
  }
})

// Global Express error handler (prevents any unhandled throw from crashing the server)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', sanitizeMessage(err.stack || err.message))
  res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    error: 'An unexpected internal server error occurred. Please try again.',
  })
})

// Start server
app.listen(PORT, () => {
  const keyStatus =
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
      ? '✅ configured'
      : '⚠️  NOT SET (add GEMINI_API_KEY in backend/.env)'

  console.log(`\n🚀 Backend running at http://localhost:${PORT}`)
  console.log(`🔑 GEMINI_API_KEY: ${keyStatus}\n`)
})
