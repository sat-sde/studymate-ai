/**
 * mistral.js — Mistral AI Integration for StudyMate AI
 * ─────────────────────────────────────────────────────────────
 * Communicates with the Mistral API (api.mistral.ai) using
 * native Node.js fetch with:
 * - Strict JSON mode (response_format: { type: "json_object" })
 * - 25-second request timeout via AbortController
 * - Markdown fence stripping
 * - Empty response detection
 * - Secret-sanitized logging
 * - Structured error codes
 * ─────────────────────────────────────────────────────────────
 */

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'
const DEFAULT_MODEL = 'mistral-small-latest'
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
 * System prompt forcing structured JSON for flashcards & quiz
 */
const SYSTEM_PROMPT = `
You are an expert study assistant. Your job is to read the study notes
provided by the user and generate structured study material.

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
5. Return ONLY valid JSON matching the schema — no markdown, no code blocks, no extra commentary.

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
`.trim()

/**
 * Calls Mistral Chat Completion with strict JSON format and timeout.
 *
 * @param {string} notes - User's study notes
 * @returns {Promise<Object>} Parsed JSON study material
 */
async function generateWithMistral(notes) {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey || apiKey === 'your_mistral_api_key_here') {
    const err = new Error('MISTRAL_API_KEY is not set. Please add it to backend/.env.')
    err.code = 'MISSING_API_KEY'
    throw err
  }

  const model = process.env.MISTRAL_MODEL || DEFAULT_MODEL
  console.log(`📤 Sending ${notes.length} chars to Mistral AI (${model})...`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Study Notes:\n─────────────\n${notes.trim()}\n─────────────` },
        ],
      }),
      signal: controller.signal,
    })
  } catch (fetchErr) {
    clearTimeout(timeoutId)
    if (fetchErr.name === 'AbortError') {
      const err = new Error(`AI request timed out after ${TIMEOUT_MS / 1000} seconds.`)
      err.code = 'TIMEOUT'
      throw err
    }
    throw fetchErr
  } finally {
    clearTimeout(timeoutId)
  }

  // Handle HTTP status errors
  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    if (response.status === 401) {
      const err = new Error('Invalid Mistral API key. Please check MISTRAL_API_KEY in backend/.env.')
      err.code = 'INVALID_API_KEY'
      throw err
    }
    if (response.status === 429) {
      const err = new Error('Mistral API rate limit reached. Please wait a moment and click Retry.')
      err.code = 'RATE_LIMIT'
      throw err
    }
    const err = new Error(`Mistral API error (${response.status}): ${errBody.slice(0, 200)}`)
    err.code = 'AI_SERVICE_ERROR'
    throw err
  }

  const data = await response.json()
  const rawText = data?.choices?.[0]?.message?.content

  // Check for empty response
  if (!rawText || rawText.trim().length === 0) {
    const err = new Error('AI returned an empty response.')
    err.code = 'EMPTY_RESPONSE'
    throw err
  }

  // Parse JSON
  const cleaned = cleanJsonText(rawText)
  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch (parseErr) {
    console.error('❌ Failed to parse Mistral JSON output:', parseErr.message)
    const err = new Error('AI response was not valid JSON.')
    err.code = 'MALFORMED_JSON'
    err.rawSample = cleaned.slice(0, 200)
    throw err
  }

  return parsed
}

function sanitizeMessage(message) {
  if (!message || typeof message !== 'string') return ''
  return message
    .replace(/AIza[0-9A-Za-z-_]{20,50}/g, '[REDACTED_API_KEY]')
    .replace(/(Bearer\s+)[A-Za-z0-9_-]{20,64}/gi, '$1[REDACTED_MISTRAL_KEY]')
    .replace(/(key=)[^\s&]+/gi, '$1[REDACTED]')
}

module.exports = {
  generateWithMistral,
  cleanJsonText,
  sanitizeMessage,
  SYSTEM_PROMPT,
}
