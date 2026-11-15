import React from 'react'

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a friendly recovery UI instead of crashing.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught a runtime error:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: '#f8fafc',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '3rem' }}>🛠️</span>
            <h2 style={{ fontSize: '1.4rem', color: '#1e293b', margin: '0.8rem 0 0.4rem' }}>
              Oops! Something unexpected happened
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              StudyMate AI encountered a temporary display issue. Don't worry, your data is safe.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.6rem',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              🔄 Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

