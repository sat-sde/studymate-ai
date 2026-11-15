import './FlashCard.css'

/**
 * FlashCard Component
 * Displays a single 3D flippable card with question (front) and answer (back).
 *
 * Props:
 * - question: string (front text)
 * - answer: string (back text)
 * - isFlipped: boolean
 * - onFlip: function
 * - cardNumber: number (1-based)
 * - totalCards: number
 */
function FlashCard({
  question,
  answer,
  isFlipped,
  onFlip,
  cardNumber,
  totalCards,
}) {
  return (
    <div
      className={`flashcard ${isFlipped ? 'flipped' : ''}`}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? 'Flip to show question' : 'Flip to show answer'}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onFlip()
        }
      }}
    >
      <div className="flashcard-inner">
        {/* Front: Question */}
        <div className="flashcard-face flashcard-front">
          <div className="flashcard-face-header">
            <span className="flashcard-side-tag">Question</span>
            <span className="flashcard-index-badge">{cardNumber}/{totalCards}</span>
          </div>
          <div className="flashcard-content">
            <p className="flashcard-text">{question}</p>
          </div>
          <div className="flashcard-face-footer">
            <span className="flashcard-hint">👆 Click card or press Flip to reveal answer</span>
          </div>
        </div>

        {/* Back: Answer */}
        <div className="flashcard-face flashcard-back">
          <div className="flashcard-face-header">
            <span className="flashcard-side-tag">Answer</span>
            <span className="flashcard-index-badge">{cardNumber}/{totalCards}</span>
          </div>
          <div className="flashcard-content">
            <p className="flashcard-text">{answer}</p>
          </div>
          <div className="flashcard-face-footer">
            <span className="flashcard-hint">👆 Click card or press Flip to view question</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlashCard
