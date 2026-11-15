/**
 * testData.js
 * ─────────────────────────────────────────────────────────────
 * Valid and invalid sample payloads used to test the
 * validateStudyMaterial function.
 * ─────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────
// ✅  VALID DATA — should pass all checks
// ─────────────────────────────────────────────
const VALID_STUDY_MATERIAL = {
  title: 'Introduction to Biology',
  flashcards: [
    {
      id: 1,
      question: 'What is a cell?',
      answer: 'The basic structural and functional unit of life.',
    },
    {
      id: 2,
      question: 'What is photosynthesis?',
      answer:
        'The process by which plants convert sunlight, water, and CO₂ into glucose and oxygen.',
    },
    {
      id: 3,
      question: 'What is the powerhouse of the cell?',
      answer: 'The mitochondria — it produces ATP through cellular respiration.',
    },
    {
      id: 4,
      question: "What is Newton's First Law of Motion?",
      answer:
        'An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.',
    },
    {
      id: 5,
      question: 'What is osmosis?',
      answer:
        'The movement of water through a semipermeable membrane from low to high solute concentration.',
    },
  ],
  quiz: [
    {
      id: 1,
      question: 'Which organelle is responsible for energy production?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Body'],
      correctAnswer: 1,
      explanation:
        'The mitochondria generates ATP through cellular respiration, earning it the nickname "powerhouse of the cell".',
    },
    {
      id: 2,
      question: 'What gas do plants absorb during photosynthesis?',
      options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
      correctAnswer: 2,
      explanation:
        'Plants absorb Carbon Dioxide (CO₂) and release Oxygen (O₂) as a byproduct of photosynthesis.',
    },
    {
      id: 3,
      question: 'Which law states F = ma?',
      options: [
        "Newton's First Law",
        "Newton's Second Law",
        "Newton's Third Law",
        'Law of Conservation',
      ],
      correctAnswer: 1,
      explanation:
        "Newton's Second Law states that force equals mass times acceleration (F = ma).",
    },
    {
      id: 4,
      question: 'What is the basic unit of life?',
      options: ['Atom', 'Molecule', 'Cell', 'Tissue'],
      correctAnswer: 2,
      explanation:
        'The cell is the smallest structural and functional unit of all living organisms.',
    },
    {
      id: 5,
      question: 'Which process describes water moving across a membrane?',
      options: ['Diffusion', 'Osmosis', 'Active Transport', 'Endocytosis'],
      correctAnswer: 1,
      explanation:
        'Osmosis specifically refers to the passive movement of water across a semipermeable membrane.',
    },
  ],
}

// ─────────────────────────────────────────────
// ❌  INVALID CASES — each should trigger specific errors
// ─────────────────────────────────────────────

// 1. Data is null
const INVALID_NULL = null

// 2. Data is a plain string instead of an object
const INVALID_WRONG_TYPE = 'just a string, not an object'

// 3. title is missing entirely
const INVALID_MISSING_TITLE = {
  flashcards: VALID_STUDY_MATERIAL.flashcards,
  quiz: VALID_STUDY_MATERIAL.quiz,
}

// 4. title is an empty string
const INVALID_EMPTY_TITLE = {
  title: '   ',
  flashcards: VALID_STUDY_MATERIAL.flashcards,
  quiz: VALID_STUDY_MATERIAL.quiz,
}

// 5. flashcards has only 3 items instead of 5
const INVALID_TOO_FEW_FLASHCARDS = {
  title: 'Biology',
  flashcards: VALID_STUDY_MATERIAL.flashcards.slice(0, 3),
  quiz: VALID_STUDY_MATERIAL.quiz,
}

// 6. A flashcard is missing its answer
const INVALID_FLASHCARD_MISSING_ANSWER = {
  title: 'Biology',
  flashcards: [
    { id: 1, question: 'What is a cell?' }, // ← answer missing
    ...VALID_STUDY_MATERIAL.flashcards.slice(1),
  ],
  quiz: VALID_STUDY_MATERIAL.quiz,
}

// 7. Two flashcards share the same ID
const INVALID_DUPLICATE_FLASHCARD_ID = {
  title: 'Biology',
  flashcards: [
    { id: 1, question: 'What is a cell?', answer: 'The basic unit of life.' },
    { id: 1, question: 'What is DNA?', answer: 'Deoxyribonucleic acid.' }, // ← duplicate id: 1
    ...VALID_STUDY_MATERIAL.flashcards.slice(2),
  ],
  quiz: VALID_STUDY_MATERIAL.quiz,
}

// 8. Quiz has only 2 questions instead of 5
const INVALID_TOO_FEW_QUIZ = {
  title: 'Biology',
  flashcards: VALID_STUDY_MATERIAL.flashcards,
  quiz: VALID_STUDY_MATERIAL.quiz.slice(0, 2),
}

// 9. A quiz question only has 3 options instead of 4
const INVALID_QUIZ_WRONG_OPTIONS_COUNT = {
  title: 'Biology',
  flashcards: VALID_STUDY_MATERIAL.flashcards,
  quiz: [
    {
      id: 1,
      question: 'Which organelle produces energy?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome'], // ← only 3 options
      correctAnswer: 1,
      explanation: 'Mitochondria produces ATP.',
    },
    ...VALID_STUDY_MATERIAL.quiz.slice(1),
  ],
}

// 10. correctAnswer is out of range (5 is not 0–3)
const INVALID_CORRECT_ANSWER_OUT_OF_RANGE = {
  title: 'Biology',
  flashcards: VALID_STUDY_MATERIAL.flashcards,
  quiz: [
    {
      ...VALID_STUDY_MATERIAL.quiz[0],
      correctAnswer: 5, // ← out of range
    },
    ...VALID_STUDY_MATERIAL.quiz.slice(1),
  ],
}

// 11. correctAnswer is a string instead of a number
const INVALID_CORRECT_ANSWER_WRONG_TYPE = {
  title: 'Biology',
  flashcards: VALID_STUDY_MATERIAL.flashcards,
  quiz: [
    {
      ...VALID_STUDY_MATERIAL.quiz[0],
      correctAnswer: '1', // ← string, not number
    },
    ...VALID_STUDY_MATERIAL.quiz.slice(1),
  ],
}

// 12. A quiz item is missing its explanation
const INVALID_MISSING_EXPLANATION = {
  title: 'Biology',
  flashcards: VALID_STUDY_MATERIAL.flashcards,
  quiz: [
    {
      id: 1,
      question: 'Which organelle produces energy?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Body'],
      correctAnswer: 1,
      // explanation is missing ↑
    },
    ...VALID_STUDY_MATERIAL.quiz.slice(1),
  ],
}

// 13. Two quiz items share the same ID
const INVALID_DUPLICATE_QUIZ_ID = {
  title: 'Biology',
  flashcards: VALID_STUDY_MATERIAL.flashcards,
  quiz: [
    { ...VALID_STUDY_MATERIAL.quiz[0], id: 1 },
    { ...VALID_STUDY_MATERIAL.quiz[1], id: 1 }, // ← duplicate id: 1
    ...VALID_STUDY_MATERIAL.quiz.slice(2),
  ],
}

module.exports = {
  VALID_STUDY_MATERIAL,
  INVALID_NULL,
  INVALID_WRONG_TYPE,
  INVALID_MISSING_TITLE,
  INVALID_EMPTY_TITLE,
  INVALID_TOO_FEW_FLASHCARDS,
  INVALID_FLASHCARD_MISSING_ANSWER,
  INVALID_DUPLICATE_FLASHCARD_ID,
  INVALID_TOO_FEW_QUIZ,
  INVALID_QUIZ_WRONG_OPTIONS_COUNT,
  INVALID_CORRECT_ANSWER_OUT_OF_RANGE,
  INVALID_CORRECT_ANSWER_WRONG_TYPE,
  INVALID_MISSING_EXPLANATION,
  INVALID_DUPLICATE_QUIZ_ID,
}

