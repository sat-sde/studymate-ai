/**
 * flashcardInteractions.test.js
 * Verification of all Flashcard Deck interactions and requirements:
 * 1. Shows one card at a time.
 * 2. Question displayed initially.
 * 3. Flip reveals answer.
 * 4. Flip again reveals question.
 * 5. Prev/Next navigation.
 * 6. Card number display (e.g. 2/5).
 * 7. Boundary prevention (Previous disabled on 0, Next disabled on 4).
 * 8. Flipped state reset on navigation.
 */

import assert from 'node:assert'

const mockFlashcards = [
  { id: 1, question: 'What is photosynthesis?', answer: 'Process converting sunlight to glucose.' },
  { id: 2, question: 'What is mitochondria?', answer: 'Powerhouse of the cell.' },
  { id: 3, question: 'What is Newton First Law?', answer: 'Inertia law.' },
  { id: 4, question: 'What is osmosis?', answer: 'Water diffusion across membrane.' },
  { id: 5, question: 'What is DNA?', answer: 'Deoxyribonucleic acid genetic code.' },
]

class FlashcardDeckModel {
  constructor(cards) {
    this.cards = cards || []
    this.currentIndex = 0
    this.isFlipped = false
  }

  get totalCards() {
    return this.cards.length
  }

  get currentCard() {
    return this.cards[this.currentIndex] || null
  }

  get displayedText() {
    if (!this.currentCard) return null
    return this.isFlipped ? this.currentCard.answer : this.currentCard.question
  }

  get counterText() {
    return `${this.currentIndex + 1}/${this.totalCards}`
  }

  get canGoPrevious() {
    return this.currentIndex > 0
  }

  get canGoNext() {
    return this.currentIndex < this.totalCards - 1
  }

  flip() {
    this.isFlipped = !this.isFlipped
  }

  next() {
    if (this.canGoNext) {
      this.currentIndex++
      this.isFlipped = false // Requirement 8: Reset flipped state on change
    }
  }

  previous() {
    if (this.canGoPrevious) {
      this.currentIndex--
      this.isFlipped = false // Requirement 8: Reset flipped state on change
    }
  }

  jumpTo(index) {
    if (index >= 0 && index < this.totalCards) {
      this.currentIndex = index
      this.isFlipped = false
    }
  }
}

console.log('Running Flashcard Interaction Tests...\n')

const deck = new FlashcardDeckModel(mockFlashcards)

// Test 1: Initial state
assert.strictEqual(deck.currentIndex, 0, 'Initial card index must be 0')
assert.strictEqual(deck.isFlipped, false, 'Initial card must not be flipped')
assert.strictEqual(deck.counterText, '1/5', 'Initial counter must be 1/5')
assert.strictEqual(deck.displayedText, mockFlashcards[0].question, 'Initial card shows question')
assert.strictEqual(deck.canGoPrevious, false, 'Previous button must be disabled on first card')
assert.strictEqual(deck.canGoNext, true, 'Next button must be enabled on first card')
console.log('✓ Test 1: Initial state displays card 1 question, counter 1/5, Previous disabled')

// Test 2: Flip card reveals answer
deck.flip()
assert.strictEqual(deck.isFlipped, true, 'isFlipped must be true after flip')
assert.strictEqual(deck.displayedText, mockFlashcards[0].answer, 'Card must show answer after flip')
console.log('✓ Test 2: Clicking flip reveals answer')

// Test 3: Flip again reveals question
deck.flip()
assert.strictEqual(deck.isFlipped, false, 'isFlipped must be false after second flip')
assert.strictEqual(deck.displayedText, mockFlashcards[0].question, 'Card must show question after second flip')
console.log('✓ Test 3: Clicking flip again reveals question')

// Test 4: Flip card, then click Next -> verify next card shows question (flipped reset)
deck.flip() // now flipped to answer
assert.strictEqual(deck.isFlipped, true)
deck.next() // advance to card 2
assert.strictEqual(deck.currentIndex, 1, 'Index must be 1')
assert.strictEqual(deck.counterText, '2/5', 'Counter must be 2/5')
assert.strictEqual(deck.isFlipped, false, 'Flipped state must reset to false on navigation')
assert.strictEqual(deck.displayedText, mockFlashcards[1].question, 'Card 2 must show question, not answer')
assert.strictEqual(deck.canGoPrevious, true, 'Previous button enabled on card 2')
assert.strictEqual(deck.canGoNext, true, 'Next button enabled on card 2')
console.log('✓ Test 4: Next button advances to 2/5 and resets flipped state to question')

// Test 5: Flip card 2, then click Previous -> verify card 1 shows question (flipped reset)
deck.flip() // flip card 2
assert.strictEqual(deck.isFlipped, true)
deck.previous() // go back to card 1
assert.strictEqual(deck.currentIndex, 0, 'Index must be 0')
assert.strictEqual(deck.counterText, '1/5', 'Counter must be 1/5')
assert.strictEqual(deck.isFlipped, false, 'Flipped state must reset to false on previous')
assert.strictEqual(deck.displayedText, mockFlashcards[0].question, 'Card 1 must show question')
console.log('✓ Test 5: Previous button returns to 1/5 and resets flipped state')

// Test 6: Boundary check — cannot go previous below 0
deck.previous()
assert.strictEqual(deck.currentIndex, 0, 'Index must not go below 0')
assert.strictEqual(deck.canGoPrevious, false, 'Previous button must remain disabled at index 0')
console.log('✓ Test 6: Prevents navigation before first card')

// Test 7: Navigate to last card (5/5) and check boundary
deck.next() // 2/5
deck.next() // 3/5
deck.next() // 4/5
deck.next() // 5/5
assert.strictEqual(deck.currentIndex, 4, 'Index must be 4')
assert.strictEqual(deck.counterText, '5/5', 'Counter must be 5/5')
assert.strictEqual(deck.canGoNext, false, 'Next button must be disabled at last card')
assert.strictEqual(deck.canGoPrevious, true, 'Previous button must be enabled at last card')
deck.next() // try to go past last card
assert.strictEqual(deck.currentIndex, 4, 'Index must not go past last card')
console.log('✓ Test 7: Prevents navigation beyond last card (disabled at 5/5)')

console.log('\nAll 7 Flashcard interaction tests passed successfully! 🎉')
