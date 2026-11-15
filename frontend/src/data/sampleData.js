/**
 * sampleData.js
 * Updated to match the final StudyMate AI JSON schema.
 * This data mirrors exactly what the Gemini API will return.
 */

export const SAMPLE_STUDY_MATERIAL = {
  title: 'Introduction to Biology',

  flashcards: [
    {
      id: 1,
      question: 'What is a cell?',
      answer: 'The basic structural and functional unit of life.',
    },
    {
      id: 2,
      question: 'What is photosynthesis?',
      answer:
        'The process by which plants use sunlight, water, and CO₂ to produce glucose and oxygen.',
    },
    {
      id: 3,
      question: 'What is the powerhouse of the cell?',
      answer: 'The mitochondria — it generates ATP through cellular respiration.',
    },
    {
      id: 4,
      question: "What is Newton's First Law of Motion?",
      answer:
        'An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.',
    },
    {
      id: 5,
      question: 'What is osmosis?',
      answer:
        'The movement of water molecules through a semipermeable membrane from low to high solute concentration.',
    },
  ],

  quiz: [
    {
      id: 1,
      question: 'Which organelle is responsible for energy production in a cell?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Body'],
      correctAnswer: 1,
      explanation:
        'The mitochondria generates ATP through cellular respiration, earning it the nickname "powerhouse of the cell".',
    },
    {
      id: 2,
      question: 'What gas do plants primarily absorb during photosynthesis?',
      options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
      correctAnswer: 2,
      explanation:
        'Plants absorb Carbon Dioxide (CO₂) and release Oxygen (O₂) as a byproduct of photosynthesis.',
    },
    {
      id: 3,
      question: 'Which law states that force equals mass times acceleration (F = ma)?',
      options: [
        "Newton's First Law",
        "Newton's Second Law",
        "Newton's Third Law",
        'Law of Conservation',
      ],
      correctAnswer: 1,
      explanation:
        "Newton's Second Law of Motion defines the relationship between force, mass, and acceleration: F = ma.",
    },
    {
      id: 4,
      question: 'What is the basic unit of life?',
      options: ['Atom', 'Molecule', 'Cell', 'Tissue'],
      correctAnswer: 2,
      explanation:
        'The cell is the smallest structural and functional unit of all living organisms.',
    },
    {
      id: 5,
      question: 'Which process specifically describes water moving across a membrane?',
      options: ['Diffusion', 'Osmosis', 'Active Transport', 'Endocytosis'],
      correctAnswer: 1,
      explanation:
        'Osmosis refers exclusively to the passive movement of water across a semipermeable membrane, driven by solute concentration differences.',
    },
  ],
}
