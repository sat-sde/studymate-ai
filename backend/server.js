/**
 * server.js — StudyMate AI Express Backend
 * ─────────────────────────────────────────────────────────────
 * Complete error handling and reliability:
 * - Multi-provider support (Mistral AI & Google Gemini)
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
const {
  generateStudyMaterial,
  sanitizeMessage,
  getActiveProvider,
} = require('./utils/gemini')
const { validateStudyMaterial } = require('./utils/validateStudyMaterial')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:5174'] }))
app.use(express.json({ limit: '50kb' }))

// Health check route
app.get('/api/health', (req, res) => {
  const active = getActiveProvider()
  res.json({
    status: 'OK',
    message: 'StudyMate AI backend is running!',
    provider: active.name,
    model: active.model,
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
    // 2. Call AI Provider (Mistral / Gemini / Mock)
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
    if (err.code === 'MISSING_API_KEY' || safeError.includes('API_KEY is not set')) {
      return res.status(500).json({
        success: false,
        code: 'MISSING_API_KEY',
        error: 'No AI API key is configured. Please add GROQ_API_KEY, MISTRAL_API_KEY, or GEMINI_API_KEY in backend/.env.',
      })
    }

    // Invalid API Key
    if (err.code === 'INVALID_API_KEY' || safeError.toLowerCase().includes('invalid api key') || safeError.toLowerCase().includes('unauthorized')) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_API_KEY',
        error: 'The provided AI API key is invalid or unauthorized. Please verify your API key in backend/.env.',
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
      err.code === 'RATE_LIMIT' ||
      safeError.includes('429') ||
      safeError.toLowerCase().includes('quota') ||
      safeError.includes('RESOURCE_EXHAUSTED')
    ) {
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT',
        error: 'AI API rate limit reached. Please wait a moment and click Retry.',
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

const path = require('path')
const fs = require('fs')

// Serve production built React frontend if dist exists
const distPath = path.join(__dirname, '../frontend/dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  // Fallback for Single Page Application client routing
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'))
    }
    next()
  })
}

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
  const active = getActiveProvider()

  let statusStr
  if (active.provider === 'groq') {
    statusStr = `✅ Groq AI (${active.model} - ultra-fast)`
  } else if (active.provider === 'mistral') {
    statusStr = `✅ Mistral AI (${active.model})`
  } else if (active.provider === 'gemini') {
    statusStr = `✅ Google Gemini (${active.model})`
  } else if (active.provider === 'mock') {
    statusStr = `🧪 Mock Provider (offline test mode)`
  } else {
    statusStr = `⚠️  NOT SET (add GROQ_API_KEY in backend/.env)`
  }

  console.log(`\n🚀 Backend running at http://localhost:${PORT}`)
  console.log(`🔑 AI Provider: ${statusStr}\n`)
})
