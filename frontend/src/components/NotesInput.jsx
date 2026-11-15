import './NotesInput.css'

const MAX_CHARS = 5000

export const SAMPLE_STUDY_NOTES = `Photosynthesis is the process by which autotrophic organisms, such as green plants, algae, and cyanobacteria, convert light energy into chemical energy. During oxygenic photosynthesis, light energy transfers electrons from water (H2O) to carbon dioxide (CO2), producing carbohydrates like glucose and releasing oxygen (O2) into the atmosphere. The light-dependent reactions take place within the thylakoid membranes of chloroplasts, where chlorophyll pigments absorb photons. The Calvin cycle occurs in the stroma and uses ATP and NADPH to fix carbon into sugars.`

// NotesInput — textarea for pasting study notes + generate button
function NotesInput({ notes = '', onNotesChange, onGenerate, isLoading }) {
  const charCount = notes ? notes.length : 0
  const isOverLimit = charCount > MAX_CHARS

  const handleInsertSample = () => {
    if (!isLoading) {
      onNotesChange(SAMPLE_STUDY_NOTES)
    }
  }

  return (
    <div className="notes-card">
      <div className="notes-header">
        <div className="notes-title-group">
          <h2 className="notes-title">📝 Paste Your Study Notes</h2>
          {!notes && !isLoading && (
            <button
              type="button"
              className="notes-sample-pill"
              onClick={handleInsertSample}
              title="Click to insert sample biology notes"
            >
              📋 Insert sample notes
            </button>
          )}
        </div>
        <span className={`char-count ${isOverLimit ? 'over-limit' : ''}`}>
          {charCount} / {MAX_CHARS}
        </span>
      </div>

      <textarea
        className="notes-textarea"
        placeholder={`Paste your notes, textbook excerpts, or study guide here...\n\nExample: "Photosynthesis is the process by which plants convert light energy into chemical energy. Plants absorb sunlight using chlorophyll..."`}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={7}
        disabled={isLoading}
        aria-label="Study notes input"
      />

      <div className="notes-footer">
        <p className="notes-hint">
          {isLoading
            ? '⏳ Generation in progress. Input is locked to prevent duplicate submissions.'
            : '💡 Tip: Clear, detailed notes produce better flashcards and quizzes.'}
        </p>

        <button
          type="button"
          className="generate-btn"
          onClick={onGenerate}
          disabled={isLoading || isOverLimit}
          aria-label="Generate study material"
        >
          {isLoading ? (
            <>
              <span className="btn-spinner" aria-hidden="true" />
              Generating...
            </>
          ) : (
            '✨ Generate Study Material'
          )}
        </button>
      </div>
    </div>
  )
}

export default NotesInput
