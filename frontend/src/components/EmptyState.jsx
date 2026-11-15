import './EmptyState.css'

/**
 * EmptyState Component
 * State: EMPTY
 * - Shows an empty-state illustration/icon
 * - Asks the user to paste study notes
 * - Provides an optional "Insert Sample Notes" action for instant testing
 * - Visually consistent with loading and error states
 */
function EmptyState({
  icon = '📚',
  title = 'No study material yet',
  message = 'Paste your study notes in the text box above and click "Generate Study Material" to create custom flashcards and quizzes.',
  onInsertSample,
}) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-illustration-wrapper">
        <div className="empty-state-icon-circle">
          <span className="empty-state-emoji" role="img" aria-label="Study notes">
            {icon}
          </span>
        </div>
      </div>

      <div className="empty-state-content">
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-message">{message}</p>
      </div>

      {/* 3 Step visual hints */}
      <div className="empty-state-steps">
        <div className="empty-step-chip">
          <span className="step-num">1</span>
          <span>Paste notes</span>
        </div>
        <div className="empty-step-divider">→</div>
        <div className="empty-step-chip">
          <span className="step-num">2</span>
          <span>Click Generate</span>
        </div>
        <div className="empty-step-divider">→</div>
        <div className="empty-step-chip">
          <span className="step-num">3</span>
          <span>Study & Quiz</span>
        </div>
      </div>

      {onInsertSample && (
        <button
          type="button"
          className="empty-sample-btn"
          onClick={onInsertSample}
          aria-label="Paste sample study notes"
        >
          💡 Try with sample notes
        </button>
      )}
    </div>
  )
}

export default EmptyState
