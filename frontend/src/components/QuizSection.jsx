import { useState, useEffect } from 'react'
import EmptyState from './EmptyState'
import './QuizSection.css'

/**
 * QuizSection Component
 * Full interactive multiple-choice quiz experience:
 * - One question at a time
 * - 4 selectable options with single-choice selection
 * - Submit Answer button with answer checking against correctAnswer
 * - Immediate correct/incorrect visual feedback and explanation
 * - Next Question / Finish navigation
 * - Accurate score calculation and final results breakdown
 * - Restart Quiz (all questions) & Retry Wrong Answers (incorrect only)
 *
 * Props:
 * - quiz: Array<{ id, question, options: string[], correctAnswer: number, explanation: string }> | null
 * - topicKey: string
 */
function QuizSection({ quiz, topicKey = 'default' }) {
  // Master list of original questions for restarts
  const [originalQuiz, setOriginalQuiz] = useState([])
  // Active questions for the current quiz run (all questions or wrong questions only)
  const [activeQuestions, setActiveQuestions] = useState([])
  // Current question index in activeQuestions
  const [currentIndex, setCurrentIndex] = useState(0)
  // Selected option index (0-3) before submitting (-1 means none selected)
  const [selectedOption, setSelectedOption] = useState(-1)
  // Whether current question has been submitted
  const [isSubmitted, setIsSubmitted] = useState(false)
  // Store all user answers: Array<{ questionId, selectedOption, isCorrect, question, options, correctAnswer, explanation }>
  const [answers, setAnswers] = useState([])
  // Whether the quiz is finished and showing results
  const [isFinished, setIsFinished] = useState(false)
  // Whether the current run is Retry Wrong Answers mode
  const [isRetryMode, setIsRetryMode] = useState(false)

  // Reset quiz state whenever a new quiz prop is supplied
  useEffect(() => {
    if (quiz && quiz.length > 0) {
      setOriginalQuiz(quiz)
      setActiveQuestions(quiz)
      setCurrentIndex(0)
      setSelectedOption(-1)
      setIsSubmitted(false)
      setAnswers([])
      setIsFinished(false)
      setIsRetryMode(false)
    } else {
      setOriginalQuiz([])
      setActiveQuestions([])
      setCurrentIndex(0)
      setSelectedOption(-1)
      setIsSubmitted(false)
      setAnswers([])
      setIsFinished(false)
      setIsRetryMode(false)
    }
  }, [quiz, topicKey])

  const hasQuiz = activeQuestions.length > 0
  const currentQuestion = hasQuiz ? activeQuestions[currentIndex] : null
  const totalQuestions = activeQuestions.length

  // Select an option (only allowed before submission)
  const handleSelectOption = (index) => {
    if (!isSubmitted) {
      setSelectedOption(index)
    }
  }

  // Submit Answer
  const handleSubmitAnswer = () => {
    if (selectedOption === -1 || isSubmitted || !currentQuestion) return

    const isCorrect = selectedOption === currentQuestion.correctAnswer
    const answerRecord = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      selectedOption,
      isCorrect,
    }

    setAnswers((prev) => [...prev, answerRecord])
    setIsSubmitted(true)
  }

  // Next Question or Finish Quiz
  const handleNextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedOption(-1)
      setIsSubmitted(false)
    } else {
      setIsFinished(true)
    }
  }

  // Restart Quiz with all original questions
  const handleRestartQuiz = () => {
    setActiveQuestions(originalQuiz)
    setCurrentIndex(0)
    setSelectedOption(-1)
    setIsSubmitted(false)
    setAnswers([])
    setIsFinished(false)
    setIsRetryMode(false)
  }

  // Retry only the questions the user got wrong
  const handleRetryWrong = () => {
    const wrongQuestionIds = new Set(
      answers.filter((a) => !a.isCorrect).map((a) => a.questionId)
    )
    const wrongQuestions = originalQuiz.filter((q) => wrongQuestionIds.has(q.id))

    if (wrongQuestions.length > 0) {
      setActiveQuestions(wrongQuestions)
      setCurrentIndex(0)
      setSelectedOption(-1)
      setIsSubmitted(false)
      setAnswers([])
      setIsFinished(false)
      setIsRetryMode(true)
    }
  }

  // Score calculation
  const score = answers.filter((a) => a.isCorrect).length
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
  const wrongCount = totalQuestions - score

  // Returns CSS classes for option buttons based on selection and submission state
  const getOptionButtonClass = (index) => {
    if (!isSubmitted) {
      return selectedOption === index ? 'quiz-opt-btn selected' : 'quiz-opt-btn'
    }

    // After submission
    const isCorrectAnswer = index === currentQuestion.correctAnswer
    const isUserChoice = index === selectedOption

    if (isCorrectAnswer) return 'quiz-opt-btn correct'
    if (isUserChoice && !isCorrectAnswer) return 'quiz-opt-btn wrong'
    return 'quiz-opt-btn dimmed'
  }

  return (
    <section className="section" style={{ animationDelay: '0.15s' }}>
      <div className="section-header">
        <h2 className="section-title">🧠 Quiz</h2>
        {hasQuiz && !isFinished && (
          <span className="section-badge">
            {isRetryMode ? 'Retry Mode • ' : ''}Question {currentIndex + 1}/{totalQuestions}
          </span>
        )}
      </div>

      <div className="section-card">
        {!hasQuiz && (
          <EmptyState
            icon="🧠"
            title="No quiz yet"
            description="Generate study material from your notes to get a custom quiz with multiple-choice questions."
          />
        )}

        {/* 1. Active Quiz Question View */}
        {hasQuiz && !isFinished && currentQuestion && (
          <div className="quiz-active-container">
            {/* Top progress bar */}
            <div className="quiz-progress-bar-wrapper">
              <div
                className="quiz-progress-bar-fill"
                style={{
                  width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>

            {/* Question Header */}
            <div className="quiz-q-header">
              <span className="quiz-q-badge">
                {isRetryMode ? '🔁 Retry Question' : `Question ${currentIndex + 1} of ${totalQuestions}`}
              </span>
              <span className="quiz-step-counter">{currentIndex + 1}/{totalQuestions}</span>
            </div>

            {/* Question Text */}
            <h3 className="quiz-q-title">{currentQuestion.question}</h3>

            {/* Options List */}
            <div className="quiz-options-grid">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={getOptionButtonClass(idx)}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isSubmitted}
                  aria-pressed={selectedOption === idx}
                >
                  <span className="quiz-opt-letter">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="quiz-opt-text">{option}</span>

                  {/* Submission Icons */}
                  {isSubmitted && idx === currentQuestion.correctAnswer && (
                    <span className="quiz-opt-icon correct-mark" title="Correct Answer">✓</span>
                  )}
                  {isSubmitted && idx === selectedOption && idx !== currentQuestion.correctAnswer && (
                    <span className="quiz-opt-icon wrong-mark" title="Your Choice">✗</span>
                  )}
                </button>
              ))}
            </div>

            {/* Feedback & Explanation (after submission) */}
            {isSubmitted && (
              <div
                className={`quiz-feedback-box ${
                  selectedOption === currentQuestion.correctAnswer ? 'fb-box-correct' : 'fb-box-wrong'
                }`}
              >
                <div className="fb-headline">
                  {selectedOption === currentQuestion.correctAnswer ? (
                    <span>🎉 <strong>Correct!</strong> Well done.</span>
                  ) : (
                    <span>
                      ❌ <strong>Incorrect.</strong> The correct answer is{' '}
                      <strong>
                        ({String.fromCharCode(65 + currentQuestion.correctAnswer)}){' '}
                        {currentQuestion.options[currentQuestion.correctAnswer]}
                      </strong>
                    </span>
                  )}
                </div>
                <div className="fb-explanation-text">
                  <span className="fb-exp-tag">Explanation:</span> {currentQuestion.explanation}
                </div>
              </div>
            )}

            {/* Action Toolbar */}
            <div className="quiz-action-toolbar">
              {!isSubmitted ? (
                <button
                  type="button"
                  className="quiz-action-btn submit-btn"
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === -1}
                >
                  Submit Answer ✓
                </button>
              ) : (
                <button
                  type="button"
                  className="quiz-action-btn next-btn"
                  onClick={handleNextQuestion}
                >
                  {currentIndex < totalQuestions - 1 ? 'Next Question →' : 'View Results 🎉'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. Final Results View */}
        {hasQuiz && isFinished && (
          <div className="quiz-results-container">
            <div className="results-hero">
              <span className="results-icon">
                {percentage >= 80 ? '🏆' : percentage >= 60 ? '👏' : '📚'}
              </span>
              <h3 className="results-title">Quiz Completed!</h3>
              <p className="results-subtitle">
                {percentage === 100
                  ? 'Perfect score! You have completely mastered this material.'
                  : percentage >= 80
                  ? 'Great performance! You demonstrated a strong understanding.'
                  : percentage >= 60
                  ? 'Good job! Review the questions you missed to reinforce your knowledge.'
                  : 'Keep learning! Review your flashcards and give it another try.'}
              </p>

              <div className="score-card">
                <div className="score-big">{score} / {totalQuestions}</div>
                <div className="score-percentage">{percentage}% Score</div>
              </div>
            </div>

            {/* Actions: Restart Quiz & Retry Wrong Answers */}
            <div className="results-actions">
              <button
                type="button"
                className="results-btn restart-btn"
                onClick={handleRestartQuiz}
              >
                🔄 Restart Quiz
              </button>

              {wrongCount > 0 && (
                <button
                  type="button"
                  className="results-btn retry-btn"
                  onClick={handleRetryWrong}
                >
                  🔁 Retry Wrong Answers ({wrongCount})
                </button>
              )}
            </div>

            {/* Question Breakdown Summary */}
            <div className="results-breakdown">
              <h4 className="breakdown-heading">Question Summary</h4>
              <div className="breakdown-list">
                {answers.map((ans, i) => (
                  <div
                    key={i}
                    className={`breakdown-item ${ans.isCorrect ? 'item-correct' : 'item-wrong'}`}
                  >
                    <div className="breakdown-item-header">
                      <span className="breakdown-num">Q{i + 1}</span>
                      <span className="breakdown-status-badge">
                        {ans.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                    <p className="breakdown-question">{ans.question}</p>
                    <div className="breakdown-answers">
                      <p className="breakdown-user-ans">
                        Your answer: <strong>{ans.options[ans.selectedOption]}</strong>
                      </p>
                      {!ans.isCorrect && (
                        <p className="breakdown-correct-ans">
                          Correct: <strong>{ans.options[ans.correctAnswer]}</strong>
                        </p>
                      )}
                    </div>
                    <p className="breakdown-explanation">
                      💡 {ans.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default QuizSection
