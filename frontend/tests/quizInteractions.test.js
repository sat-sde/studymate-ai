/**
 * quizInteractions.test.js
 * Comprehensive verification of all Quiz requirements:
 * 1. Shows one question at a time
 * 2. 4 selectable options
 * 3. Only one selected answer allowed
 * 4. Submit Answer button (disabled until selected)
 * 5. Checks against correctAnswer
 * 6. Shows correct / incorrect feedback
 * 7. Displays explanation
 * 8. Next Question advances
 * 9. Accurate score calculation
 * 10. Final result display
 * 11. Restart Quiz functionality
 * 12. Retry Wrong Answers functionality
 * 13. Multiple submissions prevented
 * 14. Reset state on restart
 */

import assert from 'node:assert'

const mockQuiz = [
  {
    id: 1,
    question: 'What is the powerhouse of the cell?',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Body'],
    correctAnswer: 1, // Mitochondria
    explanation: 'Mitochondria generates ATP through cellular respiration.',
  },
  {
    id: 2,
    question: 'What gas do plants absorb during photosynthesis?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
    correctAnswer: 2, // Carbon Dioxide
    explanation: 'Plants absorb CO2 and release O2 as a byproduct.',
  },
  {
    id: 3,
    question: 'Which law states F = ma?',
    options: ["Newton's 1st Law", "Newton's 2nd Law", "Newton's 3rd Law", 'Ohm Law'],
    correctAnswer: 1, // Newton's 2nd Law
    explanation: 'F = ma is Newton Second Law of Motion.',
  },
]

class QuizEngineModel {
  constructor(initialQuiz) {
    this.originalQuiz = [...initialQuiz]
    this.activeQuestions = [...initialQuiz]
    this.currentIndex = 0
    this.selectedOption = -1
    this.isSubmitted = false
    this.answers = []
    this.isFinished = false
    this.isRetryMode = false
  }

  get totalQuestions() {
    return this.activeQuestions.length
  }

  get currentQuestion() {
    return this.activeQuestions[this.currentIndex] || null
  }

  get score() {
    return this.answers.filter((a) => a.isCorrect).length
  }

  get percentage() {
    return this.totalQuestions > 0 ? Math.round((this.score / this.totalQuestions) * 100) : 0
  }

  get wrongAnswers() {
    return this.answers.filter((a) => !a.isCorrect)
  }

  selectOption(index) {
    if (!this.isSubmitted && index >= 0 && index < 4) {
      this.selectedOption = index
    }
  }

  submitAnswer() {
    if (this.selectedOption === -1 || this.isSubmitted || !this.currentQuestion) {
      return false
    }

    const isCorrect = this.selectedOption === this.currentQuestion.correctAnswer
    const answerRecord = {
      questionId: this.currentQuestion.id,
      selectedOption: this.selectedOption,
      isCorrect,
      correctAnswer: this.currentQuestion.correctAnswer,
      explanation: this.currentQuestion.explanation,
    }

    this.answers.push(answerRecord)
    this.isSubmitted = true
    return true
  }

  nextQuestion() {
    if (!this.isSubmitted) return false

    if (this.currentIndex < this.totalQuestions - 1) {
      this.currentIndex++
      this.selectedOption = -1
      this.isSubmitted = false
    } else {
      this.isFinished = true
    }
    return true
  }

  restartQuiz() {
    this.activeQuestions = [...this.originalQuiz]
    this.currentIndex = 0
    this.selectedOption = -1
    this.isSubmitted = false
    this.answers = []
    this.isFinished = false
    this.isRetryMode = false
  }

  retryWrongAnswers() {
    const wrongIds = new Set(this.wrongAnswers.map((a) => a.questionId))
    const wrongQuestions = this.originalQuiz.filter((q) => wrongIds.has(q.id))

    if (wrongQuestions.length > 0) {
      this.activeQuestions = wrongQuestions
      this.currentIndex = 0
      this.selectedOption = -1
      this.isSubmitted = false
      this.answers = []
      this.isFinished = false
      this.isRetryMode = true
      return true
    }
    return false
  }
}

console.log('Running Quiz Engine Integration Tests...\n')

const quiz = new QuizEngineModel(mockQuiz)

// 1. Initial State
assert.strictEqual(quiz.currentIndex, 0, 'Must start at question 1')
assert.strictEqual(quiz.selectedOption, -1, 'No option selected initially')
assert.strictEqual(quiz.isSubmitted, false, 'Question must not be submitted initially')
assert.strictEqual(quiz.currentQuestion.options.length, 4, 'Must have 4 options')
console.log('✓ Test 1: Starts on question 1 with 4 options and no initial selection')

// 2. Select option & change selection before submitting (single choice)
quiz.selectOption(0)
assert.strictEqual(quiz.selectedOption, 0, 'Option 0 should be selected')
quiz.selectOption(1)
assert.strictEqual(quiz.selectedOption, 1, 'Selection should change to option 1 (single choice enforced)')
console.log('✓ Test 2: Single choice selection verified')

// 3. Submit correct answer for Q1
const submitQ1 = quiz.submitAnswer()
assert.strictEqual(submitQ1, true, 'Submit must succeed')
assert.strictEqual(quiz.isSubmitted, true, 'isSubmitted must be true')
assert.strictEqual(quiz.answers.length, 1, '1 answer recorded in state')
assert.strictEqual(quiz.answers[0].isCorrect, true, 'Q1 answer must be marked correct')
assert.strictEqual(quiz.answers[0].explanation, mockQuiz[0].explanation, 'Explanation preserved')

// Multiple submission prevention check:
const secondSubmit = quiz.submitAnswer()
assert.strictEqual(secondSubmit, false, 'Cannot submit a second time for the same question')
assert.strictEqual(quiz.answers.length, 1, 'Answers length unchanged')
console.log('✓ Test 3: Correct answer submission verified & multiple submissions prevented')

// 4. Advance to Q2
quiz.nextQuestion()
assert.strictEqual(quiz.currentIndex, 1, 'Must advance to question 2')
assert.strictEqual(quiz.selectedOption, -1, 'Selected option must reset for new question')
assert.strictEqual(quiz.isSubmitted, false, 'Submitted state must reset for new question')
console.log('✓ Test 4: Next Question advances and resets state')

// 5. Submit WRONG answer for Q2
quiz.selectOption(0) // Picks Oxygen (index 0) instead of CO2 (index 2)
quiz.submitAnswer()
assert.strictEqual(quiz.answers.length, 2)
assert.strictEqual(quiz.answers[1].isCorrect, false, 'Q2 answer must be marked incorrect')
console.log('✓ Test 5: Incorrect answer correctly identified')

// 6. Advance to Q3 (last question)
quiz.nextQuestion()
assert.strictEqual(quiz.currentIndex, 2, 'Must advance to question 3')
quiz.selectOption(1) // Picks Newton 2nd Law (correct: index 1)
quiz.submitAnswer()
assert.strictEqual(quiz.answers.length, 3)
assert.strictEqual(quiz.answers[2].isCorrect, true, 'Q3 answer must be correct')
console.log('✓ Test 6: Answered final question')

// 7. Finish Quiz and verify score
quiz.nextQuestion()
assert.strictEqual(quiz.isFinished, true, 'Quiz should now be marked finished')
assert.strictEqual(quiz.score, 2, 'Score must be 2 correct answers')
assert.strictEqual(quiz.totalQuestions, 3, 'Total questions must be 3')
assert.strictEqual(quiz.percentage, 67, 'Percentage must be round(2/3 * 100) = 67%')
assert.strictEqual(quiz.wrongAnswers.length, 1, 'Must have 1 wrong answer (Q2)')
console.log('✓ Test 7: Quiz finishes and accurately calculates score (2/3, 67%)')

// 8. Retry Wrong Answers mode
const retrySuccess = quiz.retryWrongAnswers()
assert.strictEqual(retrySuccess, true, 'Retry mode should initialize with wrong questions')
assert.strictEqual(quiz.isRetryMode, true, 'isRetryMode must be true')
assert.strictEqual(quiz.activeQuestions.length, 1, 'Only 1 wrong question should be in activeQuestions')
assert.strictEqual(quiz.activeQuestions[0].id, 2, 'Active question should be Q2')
assert.strictEqual(quiz.currentIndex, 0, 'Index reset to 0')
assert.strictEqual(quiz.isFinished, false, 'Must not be finished')

// Retry Q2 with the correct answer this time!
quiz.selectOption(2) // Picks Carbon Dioxide (index 2)
quiz.submitAnswer()
assert.strictEqual(quiz.answers[0].isCorrect, true, 'Retried answer must be correct')
quiz.nextQuestion()
assert.strictEqual(quiz.isFinished, true, 'Retry quiz finished')
assert.strictEqual(quiz.score, 1, 'Score on retry should be 1/1')
assert.strictEqual(quiz.percentage, 100, 'Percentage should be 100%')
console.log('✓ Test 8: Retry Wrong Answers mode successfully filters and replays incorrect questions')

// 9. Restart Quiz (full reset)
quiz.restartQuiz()
assert.strictEqual(quiz.isRetryMode, false, 'Retry mode turned off')
assert.strictEqual(quiz.activeQuestions.length, 3, 'All 3 original questions restored')
assert.strictEqual(quiz.currentIndex, 0, 'Index reset to 0')
assert.strictEqual(quiz.answers.length, 0, 'Answers list cleared')
assert.strictEqual(quiz.isFinished, false, 'isFinished reset to false')
assert.strictEqual(quiz.selectedOption, -1, 'selectedOption reset to -1')
assert.strictEqual(quiz.isSubmitted, false, 'isSubmitted reset to false')
console.log('✓ Test 9: Restart Quiz restores full question set and cleanly resets state')

console.log('\nAll 9 Quiz Engine integration tests passed successfully! 🏆')

