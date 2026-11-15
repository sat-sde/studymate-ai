/**
 * validateStudyMaterial.js (Frontend)
 * Validates the structured study material response received from the backend
 * before rendering it in React state.
 */

const REQUIRED_FLASHCARD_COUNT = 5
const REQUIRED_QUIZ_COUNT = 5
const REQUIRED_OPTIONS_COUNT = 4

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function validateFlashcard(card, index, seenIds) {
  const errors = []
  const prefix = `flashcards[${index}]`

  if (card.id === undefined || card.id === null) {
    errors.push(`${prefix}.id is missing`)
  } else if (seenIds.has(card.id)) {
    errors.push(`${prefix}.id (${card.id}) is duplicate`)
  } else {
    seenIds.add(card.id)
  }

  if (!isNonEmptyString(card.question)) {
    errors.push(`${prefix}.question must be a non-empty string`)
  }

  if (!isNonEmptyString(card.answer)) {
    errors.push(`${prefix}.answer must be a non-empty string`)
  }

  return errors
}

function validateQuizItem(item, index, seenIds) {
  const errors = []
  const prefix = `quiz[${index}]`

  if (item.id === undefined || item.id === null) {
    errors.push(`${prefix}.id is missing`)
  } else if (seenIds.has(item.id)) {
    errors.push(`${prefix}.id (${item.id}) is duplicate`)
  } else {
    seenIds.add(item.id)
  }

  if (!isNonEmptyString(item.question)) {
    errors.push(`${prefix}.question must be a non-empty string`)
  }

  if (!Array.isArray(item.options)) {
    errors.push(`${prefix}.options must be an array`)
  } else {
    if (item.options.length !== REQUIRED_OPTIONS_COUNT) {
      errors.push(`${prefix}.options must have exactly ${REQUIRED_OPTIONS_COUNT} items`)
    }
    item.options.forEach((opt, j) => {
      if (!isNonEmptyString(opt)) {
        errors.push(`${prefix}.options[${j}] must be a non-empty string`)
      }
    })
  }

  if (
    typeof item.correctAnswer !== 'number' ||
    !Number.isInteger(item.correctAnswer) ||
    item.correctAnswer < 0 ||
    item.correctAnswer > 3
  ) {
    errors.push(`${prefix}.correctAnswer must be an integer from 0 to 3`)
  }

  if (!isNonEmptyString(item.explanation)) {
    errors.push(`${prefix}.explanation must be a non-empty string`)
  }

  return errors
}

export function validateStudyMaterial(data) {
  const errors = []

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Response must be an object'] }
  }

  if (!isNonEmptyString(data.title)) {
    errors.push('title must be a non-empty string')
  }

  if (!Array.isArray(data.flashcards)) {
    errors.push('flashcards must be an array')
  } else {
    if (data.flashcards.length !== REQUIRED_FLASHCARD_COUNT) {
      errors.push(`flashcards must contain exactly ${REQUIRED_FLASHCARD_COUNT} items (received ${data.flashcards.length})`)
    }
    const seenIds = new Set()
    data.flashcards.forEach((card, i) => {
      errors.push(...validateFlashcard(card, i, seenIds))
    })
  }

  if (!Array.isArray(data.quiz)) {
    errors.push('quiz must be an array')
  } else {
    if (data.quiz.length !== REQUIRED_QUIZ_COUNT) {
      errors.push(`quiz must contain exactly ${REQUIRED_QUIZ_COUNT} items (received ${data.quiz.length})`)
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

