import './Header.css'

// Header component — sticky top bar with branding
function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-icon">📚</span>
          <span className="header-title">
            StudyMate <span className="header-title-ai">AI</span>
          </span>
        </div>
        <span className="header-badge">Beta</span>
      </div>
    </header>
  )
}

export default Header

