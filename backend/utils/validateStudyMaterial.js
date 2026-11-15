/**
 * validateStudyMaterial.js
 * ─────────────────────────────────────────────────────────────
 * Validates that an AI-generated response matches the
 * StudyMate AI JSON schema before the backend sends it to
 * the frontend.
 *
 * Expected shape:
 * {
 *   title: string,
 *   flashcards: [{ id, question, answer }] × 5,
 *   quiz: [{ id, question, options[4], correctAnswer(0-3), explanation }] × 5
 * }
 *
 * Returns: { valid: boolean, errors: string[] }
 * ─────────────────────────────────────────────────────────────
 */

const REQUIRED_FLASHCARD_COUNT = 5
const REQUIRED_QUIZ_COUNT = 5
const REQUIRED_OPTIONS_COUNT = 4

/**
 * Checks that a value is a non-empty string.
 * @param {*} value
 * @returns {boolean}
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validates a single flashcard object.
 * @param {*} card  - The flashcard to validate
 * @param {number} index - Its position in the array (for error messages)
 * @param {Set} seenIds - Tracks IDs already seen (for uniqueness check)
 * @returns {string[]} Array of error messages (empty = valid)
 */
function validateFlashcard(card, index, seenIds) {
  const errors = []
  const prefix = `flashcards[${index}]`

  // --- id ---
  if (card.id === undefined || card.id === null) {
    errors.push(`${prefix}.id is missing`)
  } else if (seenIds.has(card.id)) {
    errors.push(`${prefix}.id (${card.id}) is not unique`)
  } else {
    seenIds.add(card.id)
  }

  // --- question ---
  if (!isNonEmptyString(card.question)) {
    errors.push(`${prefix}.question must be a non-empty string`)
  }

  // --- answer ---
  if (!isNonEmptyString(card.answer)) {
    errors.push(`${prefix}.answer must be a non-empty string`)
  }

  return errors
}

/**
 * Validates a single quiz question object.
 * @param {*} item  - The quiz item to validate
 * @param {number} index - Its position in the array
 * @param {Set} seenIds - Tracks IDs already seen
 * @returns {string[]} Array of error messages
 */
function validateQuizItem(item, index, seenIds) {
  const errors = []
  const prefix = `quiz[${index}]`

  // --- id ---
  if (item.id === undefined || item.id === null) {
    errors.push(`${prefix}.id is missing`)
  } else if (seenIds.has(item.id)) {
    errors.push(`${prefix}.id (${item.id}) is not unique`)
  } else {
    seenIds.add(item.id)
  }

  // --- question ---
  if (!isNonEmptyString(item.question)) {
    errors.push(`${prefix}.question must be a non-empty string`)
  }

  // --- options ---
  if (!Array.isArray(item.options)) {
    errors.push(`${prefix}.options must be an array`)
  } else {
    if (item.options.length !== REQUIRED_OPTIONS_COUNT) {
      errors.push(
        `${prefix}.options must have exactly ${REQUIRED_OPTIONS_COUNT} items (got ${item.options.length})`
      )
    }
    item.options.forEach((opt, j) => {
      if (!isNonEmptyString(opt)) {
        errors.push(`${prefix}.options[${j}] must be a non-empty string`)
      }
    })
  }

  // --- correctAnswer ---
  if (
    typeof item.correctAnswer !== 'number' ||
    !Number.isInteger(item.correctAnswer) ||
    item.correctAnswer < 0 ||
    item.correctAnswer > 3
  ) {
    errors.push(`${prefix}.correctAnswer must be an integer from 0 to 3`)
  }

  // --- explanation ---
  if (!isNonEmptyString(item.explanation)) {
    errors.push(`${prefix}.explanation must be a non-empty string`)
  }

  return errors
}

/**
 * Main validation function.
 *
 * @param {*} data - The parsed JSON object from the AI response
 * @returns {{ valid: boolean, errors: string[] }}
 *
 * @example
 * const result = validateStudyMaterial(aiResponse)
 * if (!result.valid) {
 *   console.error('Invalid AI response:', result.errors)
 * }
 */
function validateStudyMaterial(data) {
  const errors = []

  // ── Top-level type check ──────────────────────────────────
  if (data === null || data === undefined) {
    return { valid: false, errors: ['Data is null or undefined'] }
  }
  if (typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Data must be a plain object'] }
  }

  // ── title ─────────────────────────────────────────────────
  if (!isNonEmptyString(data.title)) {
    errors.push('title must be a non-empty string')
  }

  // ── flashcards ────────────────────────────────────────────
  if (!Array.isArray(data.flashcards)) {
    errors.push('flashcards must be an array')
  } else {
    if (data.flashcards.length !== REQUIRED_FLASHCARD_COUNT) {
      errors.push(
        `flashcards must have exactly ${REQUIRED_FLASHCARD_COUNT} items (got ${data.flashcards.length})`
      )
    }
    const seenIds = new Set()
    data.flashcards.forEach((card, i) => {
      errors.push(...validateFlashcard(card, i, seenIds))
    })
  }

  // ── quiz ─────────────────────────────────────────────────
  if (!Array.isArray(data.quiz)) {
    errors.push('quiz must be an array')
  } else {
    if (data.quiz.length !== REQUIRED_QUIZ_COUNT) {
      errors.push(
        `quiz must have exactly ${REQUIRED_QUIZ_COUNT} items (got ${data.quiz.length})`
      )
    }
    const seenIds = new Set()
    data.quiz.forEach((item, i) => {
      errors.push(...validateQuizItem(item, i, seenIds))
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

module.exports = { validateStudyMaterial }

