import { useState, useRef, useEffect } from 'react'
import Header from './components/Header'
import WelcomeBanner from './components/WelcomeBanner'
import NotesInput, { SAMPLE_STUDY_NOTES } from './components/NotesInput'
import FlashcardsSection from './components/FlashcardsSection'
import QuizSection from './components/QuizSection'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import EmptyState from './components/EmptyState'
import { generateStudyMaterialApi } from './services/api'
import './App.css'

function App() {
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  // Preserves valid study material across generation attempts
  const [studyMaterial, setStudyMaterial] = useState(null)

  // Race condition protection references
  const activeAbortControllerRef = useRef(null)
  const latestRequestIdRef = useRef(0)

  // Abort any in-flight request when component unmounts
  useEffect(() => {
    return () => {
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort()
      }
    }
  }, [])

  // Generate study material handler with retry & duplicate request prevention
  const handleGenerate = async () => {
    const trimmed = notes ? notes.trim() : ''

    // Validate non-empty input
    if (!trimmed) {
      setError('Please paste your study notes before generating study material.')
      return
    }

    // Abort previous in-flight request if user triggered a new one
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort()
    }

    // Fresh controller and incrementing request ID
    const controller = new AbortController()
    activeAbortControllerRef.current = controller
    const currentRequestId = ++latestRequestIdRef.current

    setError(null)
    setIsLoading(true)

    try {
      const data = await generateStudyMaterialApi(trimmed, controller.signal)

      // Only update UI if this is the latest active request
      if (currentRequestId === latestRequestIdRef.current) {
        setStudyMaterial(data)
      }
    } catch (err) {
      // Aborted requests do not show errors (superseded cleanly)
      if (err.name === 'AbortError' || controller.signal.aborted) {
        return
      }

      if (currentRequestId === latestRequestIdRef.current) {
        console.error(`[Request #${currentRequestId}] Generation error:`, err.message)
        setError(err.message || 'An unexpected error occurred while generating study material.')
      }
    } finally {
      // Only reset loading state for the latest request
      if (currentRequestId === latestRequestIdRef.current) {
        setIsLoading(false)
        activeAbortControllerRef.current = null
      }
    }
  }

  const handleDismissError = () => setError(null)

  // Clears the workspace for a new topic
  const handleReset = () => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort()
    }
    setStudyMaterial(null)
    setNotes('')
    setError(null)
    setIsLoading(false)
  }

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <WelcomeBanner />

        <NotesInput
          notes={notes}
          onNotesChange={setNotes}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />

        {/* ── STATE 1: ERROR (friendly message + Retry button) ── */}
        {error && (
          <ErrorMessage
            message={error}
            onDismiss={handleDismissError}
            onRetry={handleGenerate}
          />
        )}

        {/* ── STATE 2: LOADING (spinner + "Generating your study material..." + duplicate prevention) ── */}
        {isLoading && <LoadingSpinner />}

        {/* ── STATE 3: EMPTY (message asking to paste notes + illustration + sample prompt) ── */}
        {!studyMaterial && !isLoading && (
          <EmptyState
            icon="📚"
            title="No study material yet"
            message="Paste your study notes in the text box above and click &quot;Generate Study Material&quot; to create custom flashcards and quizzes."
            onInsertSample={() => setNotes(SAMPLE_STUDY_NOTES)}
          />
        )}

        {/* ── STATE 4: SUCCESS / ACTIVE MATERIAL ── */}
        {studyMaterial && !isLoading && (
          <>
            <div className="topic-header-card">
              <div className="topic-header-info">
                <span className="topic-tag">Generated Topic</span>
                <h2 className="topic-heading">{studyMaterial.title}</h2>
              </div>
              <button
                className="topic-reset-btn"
                onClick={handleReset}
                aria-label="Start new study session"
              >
                🔄 New Topic
              </button>
            </div>

            <FlashcardsSection
              flashcards={studyMaterial.flashcards}
              title={studyMaterial.title}
            />

            <QuizSection
              quiz={studyMaterial.quiz}
              topicKey={studyMaterial.title}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App
