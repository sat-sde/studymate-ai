import './WelcomeBanner.css'

// WelcomeBanner — hero section at the top of the dashboard
function WelcomeBanner() {
  return (
    <div className="welcome-banner">
      <div className="welcome-content">
        <h1 className="welcome-title">Welcome to StudyMate AI 👋</h1>
        <p className="welcome-subtitle">
          Paste your study notes below and instantly generate personalized
          <strong> flashcards</strong> and <strong>quizzes</strong> powered by AI.
        </p>
      </div>
      <div className="welcome-stats">
        <div className="stat-chip">
          <span>📇</span>
          <span>Flashcards</span>
        </div>
        <div className="stat-chip">
          <span>🧠</span>
          <span>Quizzes</span>
        </div>
        <div className="stat-chip">
          <span>⚡</span>
          <span>Instant</span>
        </div>
      </div>
    </div>
  )
}

export default WelcomeBanner

