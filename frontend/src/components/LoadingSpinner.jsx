import './LoadingSpinner.css'

/**
 * LoadingSpinner Component
 * State: LOADING
 * - Displays an animated spinner
 * - Shows "Generating your study material..."
 * - Shows an animated progress wave
 * - Card styling consistent with the rest of the application
 */
function LoadingSpinner() {
  return (
    <div className="loading-card" role="status" aria-live="polite">
      <div className="loading-spinner-wrapper">
        <div className="spinner-dual-ring" aria-hidden="true" />
      </div>

      <div className="loading-text-wrapper">
        <h3 className="loading-title">Generating your study material...</h3>
        <p className="loading-subtitle">
          AI is reading your notes to create 5 flashcards and 5 quiz questions. Please hold on ✨
        </p>
      </div>

      {/* Infinite pulse progress bar */}
      <div className="loading-progress-track">
        <div className="loading-progress-wave" />
      </div>
    </div>
  )
}

export default LoadingSpinner
