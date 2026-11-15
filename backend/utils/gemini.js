/**
 * gemini.js — AI Provider Orchestrator for StudyMate AI
 * ─────────────────────────────────────────────────────────────
 * Multi-Provider support:
 * - Groq AI (llama-3.3-70b-versatile / GROQ_API_KEY)
 * - Mistral AI (mistral-small-latest / MISTRAL_API_KEY)
 * - Google Gemini (gemini-2.0-flash / GEMINI_API_KEY)
 * - Offline Mock Provider (MOCK_AI_RESPONSE=true for tests)
 *
 * Features:
 * - Markdown fence stripping for reliable JSON parsing
 * - Empty response detection
 * - 25-second request timeout
 * - Secret redaction in logging
 * - Structured error codes
 * ─────────────────────────────────────────────────────────────
 */

const { GoogleGenerativeAI } = require('@google/generative-ai')
const { generateWithGroq } = require('./groq')
const { generateWithMistral } = require('./mistral')

const GEMINI_MODEL_NAME = 'gemini-2.0-flash'
const TIMEOUT_MS = 25000

/**
 * Strips markdown code blocks (e.g. ```json ... ```) if present
 */
function cleanJsonText(text) {
  if (!text || typeof text !== 'string') return ''
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '')
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\n?```\s*$/i, '')
  }
  return cleaned.trim()
}

/**
 * Redacts any accidental API key or secret in log messages
 */
function sanitizeMessage(message) {
  if (!message || typeof message !== 'string') return ''
  return message
    .replace(/gsk_[0-9A-Za-z]{25,70}/g, '[REDACTED_GROQ_KEY]')
    .replace(/AIza[0-9A-Za-z-_]{20,50}/g, '[REDACTED_API_KEY]')
    .replace(/(Bearer\s+)[A-Za-z0-9_-]{20,64}/gi, '$1[REDACTED_KEY]')
    .replace(/(key=)(?!\[REDACTED)[^\s&]+/gi, '$1[REDACTED]')
}

/**
 * Detects which AI provider is currently configured
 */
function getActiveProvider() {
  if (process.env.MOCK_AI_RESPONSE === 'true') {
    return {
      provider: 'mock',
      name: 'Offline Mock Provider',
      model: 'mock-study-data',
    }
  }

  const groqKey = process.env.GROQ_API_KEY
  if (groqKey && groqKey.trim() !== '' && groqKey !== 'your_groq_api_key_here') {
    return {
      provider: 'groq',
      name: 'Groq AI',
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    }
  }

  const mistralKey = process.env.MISTRAL_API_KEY
  if (mistralKey && mistralKey.trim() !== '' && mistralKey !== 'your_mistral_api_key_here') {
    return {
      provider: 'mistral',
      name: 'Mistral AI',
      model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey && geminiKey.trim() !== '' && geminiKey !== 'your_gemini_api_key_here') {
    return {
      provider: 'gemini',
      name: 'Google Gemini',
      model: GEMINI_MODEL_NAME,
    }
  }

  return {
    provider: 'none',
    name: 'None',
    model: 'none',
  }
}

/**
 * Prompt forcing strict JSON schema for Gemini
 */
const buildPrompt = (notes) => `
You are an expert study assistant. Your job is to read the study notes
provided below and generate structured study material.

STRICT RULES — follow these exactly:
1. Generate a short, descriptive "title" for the notes topic.
2. Generate EXACTLY 5 flashcards. Each must have:
   - "id": unique integer starting from 1
   - "question": a clear, specific question from the notes
   - "answer": a concise, accurate answer (1–3 sentences)
3. Generate EXACTLY 5 multiple-choice quiz questions. Each must have:
   - "id": unique integer starting from 1
   - "question": a clear question from the notes
   - "options": an array of EXACTLY 4 answer choices (strings)
   - "correctAnswer": the integer INDEX (0, 1, 2, or 3) of the correct option
   - "explanation": a 1–2 sentence explanation of why that answer is correct
4. ALL content must come directly from the provided study notes.
5. Return ONLY valid JSON — no markdown, no code blocks, no extra text.

Required JSON structure:
{
  "title": "Topic title here",
  "flashcards": [
    {
      "id": 1,
      "question": "Question text",
      "answer": "Answer text"
    }
  ],
  "quiz": [
    {
      "id": 1,
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation text"
    }
  ]
}

Study Notes:
─────────────
${notes.trim()}
─────────────
`.trim()

/**
 * Calls Gemini with timeout, empty response detection, and robust JSON parsing.
 */
async function generateWithGemini(notes) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const err = new Error('GEMINI_API_KEY is not set. Please add it to backend/.env.')
    err.code = 'MISSING_API_KEY'
    throw err
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
      topP: 0.95,
    },
  })

  const prompt = buildPrompt(notes)
  console.log(`📤 Sending ${notes.length} chars to Gemini (${GEMINI_MODEL_NAME})...`)

  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`AI request timed out after ${TIMEOUT_MS / 1000} seconds.`)
      err.code = 'TIMEOUT'
      reject(err)
    }, TIMEOUT_MS)
  })

  let rawText = ''
  try {
    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise,
    ])
    clearTimeout(timeoutId)
    rawText = result.response.text()
  } catch (apiErr) {
    clearTimeout(timeoutId)
    console.error('❌ Gemini API error:', sanitizeMessage(apiErr.message))
    throw apiErr
  }

  if (!rawText || rawText.trim().length === 0) {
    const err = new Error('AI returned an empty response.')
    err.code = 'EMPTY_RESPONSE'
    throw err
  }

  const cleaned = cleanJsonText(rawText)
  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch (parseErr) {
    console.error('❌ Failed to parse AI JSON response:', sanitizeMessage(parseErr.message))
    const err = new Error('AI response was not valid JSON.')
    err.code = 'MALFORMED_JSON'
    err.rawSample = cleaned.slice(0, 200)
    throw err
  }

  return parsed
}

/**
 * Main generator entry point: dispatches to Groq, Mistral, Gemini, or Mock Provider.
 *
 * @param {string} notes - Raw study notes
 * @returns {Promise<Object>} Parsed JSON
 */
async function generateStudyMaterial(notes) {
  const active = getActiveProvider()

  // 1. Mock mode for automated testing without consuming API quota
  if (active.provider === 'mock') {
    return {
      title: 'Cell Biology & Photosynthesis',
      flashcards: [
        { id: 1, question: 'What is photosynthesis?', answer: 'The process by which plants convert light energy into chemical energy.' },
        { id: 2, question: 'What organelle produces ATP?', answer: 'The mitochondria, known as the powerhouse of the cell.' },
        { id: 3, question: 'What is osmosis?', answer: 'The passive movement of water molecules through a semipermeable membrane.' },
        { id: 4, question: "What is Newton's First Law?", answer: 'An object remains at rest or in motion unless acted upon by a force.' },
        { id: 5, question: 'What is the basic unit of life?', answer: 'The cell is the fundamental structural unit of all organisms.' },
      ],
      quiz: [
        { id: 1, question: 'Which organelle generates ATP?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi'], correctAnswer: 1, explanation: 'Mitochondria produces ATP through cellular respiration.' },
        { id: 2, question: 'What gas is absorbed in photosynthesis?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctAnswer: 2, explanation: 'Plants absorb CO2 during the light-independent reactions.' },
        { id: 3, question: 'What is the basic unit of life?', options: ['Atom', 'Molecule', 'Cell', 'Tissue'], correctAnswer: 2, explanation: 'The cell is the basic unit of all living organisms.' },
        { id: 4, question: 'Which law defines F = ma?', options: ['1st Law', '2nd Law', '3rd Law', 'Gravity Law'], correctAnswer: 1, explanation: "Newton's Second Law states that force equals mass times acceleration." },
        { id: 5, question: 'What is passive water diffusion called?', options: ['Active transport', 'Osmosis', 'Endocytosis', 'Exocytosis'], correctAnswer: 1, explanation: 'Osmosis refers specifically to the diffusion of water across a membrane.' },
      ],
    }
  }

  // 2. Groq AI Provider (Ultra-fast)
  if (active.provider === 'groq') {
    return await generateWithGroq(notes)
  }

  // 3. Mistral AI Provider
  if (active.provider === 'mistral') {
    return await generateWithMistral(notes)
  }

  // 4. Google Gemini Provider
  if (active.provider === 'gemini') {
    return await generateWithGemini(notes)
  }

  // 5. No provider configured
  const err = new Error(
    'No AI API key is configured. Please add your GROQ_API_KEY, MISTRAL_API_KEY, or GEMINI_API_KEY in backend/.env.'
  )
  err.code = 'MISSING_API_KEY'
  throw err
}

module.exports = {
  generateStudyMaterial,
  generateWithGroq,
  generateWithMistral,
  generateWithGemini,
  cleanJsonText,
  sanitizeMessage,
  getActiveProvider,
}
