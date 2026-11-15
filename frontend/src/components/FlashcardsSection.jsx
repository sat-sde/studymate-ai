import { useState, useEffect } from 'react'
import FlashCard from './FlashCard'
import EmptyState from './EmptyState'
import './FlashcardsSection.css'

/**
 * FlashcardsSection Component
 * Shows one flashcard at a time with 3D flip animation, navigation (Prev/Next),
 * card counter (e.g. 2/5), and auto-resets flip state on navigation.
 *
 * Props:
 * - flashcards: Array<{ id, question, answer }> | null
 * - title: string | null
 */
function FlashcardsSection({ flashcards, title }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Reset to first card and unflip whenever new flashcards are provided
  useEffect(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [flashcards])

  const totalCards = flashcards?.length || 0
  const hasCards = totalCards > 0
  const currentCard = hasCards ? flashcards[currentIndex] : null

  // Flip toggle handler
  const handleFlip = () => {
    setIsFlipped((prev) => !prev)
  }

  // Previous card handler (resets flip state to show question)
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setIsFlipped(false)
    }
  }

  // Next card handler (resets flip state to show question)
  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1)
      setIsFlipped(false)
    }
  }

  return (
    <section className="section" style={{ animationDelay: '0.1s' }}>
      <div className="section-header">
        <h2 className="section-title">📇 Flashcards</h2>
        {hasCards && (
          <span className="section-badge">{currentIndex + 1}/{totalCards}</span>
        )}
      </div>

      {title && hasCards && (
        <p className="section-topic">Topic: <strong>{title}</strong></p>
      )}

      <div className="section-card">
        {hasCards && currentCard ? (
          <div className="flashcards-deck-container">
            {/* Top Deck Info: Counter & Progress */}
            <div className="deck-header">
              <span className="deck-counter-badge">
                Card <strong>{currentIndex + 1}</strong> of <strong>{totalCards}</strong>
              </span>

              {/* Progress dots */}
              <div className="deck-progress-dots" role="tablist" aria-label="Flashcard list">
                {flashcards.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`deck-dot ${idx === currentIndex ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentIndex(idx)
                      setIsFlipped(false)
                    }}
                    aria-label={`Jump to card ${idx + 1}`}
                    title={`Card ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Single Active Flashcard */}
            <div className="flashcard-stage">
              <FlashCard
                question={currentCard.question}
                answer={currentCard.answer}
                isFlipped={isFlipped}
                onFlip={handleFlip}
                cardNumber={currentIndex + 1}
                totalCards={totalCards}
              />
            </div>

            {/* Navigation and Flip Controls */}
            <div className="deck-controls">
              <button
                type="button"
                className="deck-nav-btn"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                aria-label="Previous flashcard"
              >
                ← Previous
              </button>

              <button
                type="button"
                className="deck-flip-btn"
                onClick={handleFlip}
                aria-label={isFlipped ? 'Show question' : 'Show answer'}
              >
                🔄 {isFlipped ? 'Show Question' : 'Flip Card'}
              </button>

              <button
                type="button"
                className="deck-nav-btn"
                onClick={handleNext}
                disabled={currentIndex === totalCards - 1}
                aria-label="Next flashcard"
              >
                Next →
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon="📇"
            title="No flashcards yet"
            description="Paste your study notes above and click Generate to create personalized flashcards."
          />
        )}
      </div>
    </section>
  )
}

export default FlashcardsSection
