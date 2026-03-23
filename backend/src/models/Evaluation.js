import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: String, // Could reference a Course model in a full app, string for MVP
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'requires_revision', 'approved', 'rejected'],
    default: 'pending'
  },
  // The original text submitted by the student
  rawFeedback: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  // Processed by AI to remove bias, emotional language, or PII
  sanitizedFeedback: {
    type: String,
    trim: true
  },
  // An AI-derived objective score (e.g. 1-5 or 1-100) based on the feedback content
  objectiveScore: {
    type: Number,
    min: 0,
    max: 100
  },
  // If the AI detects strong bias or unconstructive feedback, it returns these follow-up questions
  controlQuestions: [{
    questionText: String,
    studentAnswer: String,
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  // AI analysis metadata (e.g. detected sentiment, flagged bias categories)
  aiMetadata: {
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'mixed']
    },
    biasFlagged: {
      type: Boolean,
      default: false
    },
    flags: [String] // e.g. ["ad hominem", "gender bias", "unverifiable claim"]
  }
}, {
  timestamps: true
});

// Compound indexes to efficiently fetch a teacher's evaluations or a student's submissions
evaluationSchema.index({ teacherId: 1, status: 1 });
evaluationSchema.index({ studentId: 1 });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);
export default Evaluation;
