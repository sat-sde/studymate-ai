import './ErrorMessage.css'

/**
 * ErrorMessage Component
 * State: ERROR
 * - Shows a friendly error message
 * - Provides a prominent Retry button
 * - Clean rounded card consistent with other states
 */
function ErrorMessage({ message, onDismiss, onRetry }) {
  return (
    <div className="error-card" role="alert" aria-live="assertive">
      <div className="error-card-inner">
        <div className="error-icon-badge" aria-hidden="true">
          ⚠️
        </div>

        <div className="error-body">
          <h4 className="error-title">Unable to generate study material</h4>
          <p className="error-message-text">{message}</p>
        </div>

        <div className="error-actions">
          {onRetry && (
            <button
              type="button"
              className="error-retry-btn"
              onClick={onRetry}
              aria-label="Retry generating study material"
            >
              🔄 Retry
            </button>
          )}

          {onDismiss && (
            <button
              type="button"
              className="error-dismiss-btn"
              onClick={onDismiss}
              aria-label="Dismiss error notification"
              title="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage
