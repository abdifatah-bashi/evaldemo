import express from 'express';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import Evaluation from '../models/Evaluation.js';
import User from '../models/User.js';
import { analyzeFeedback } from '../services/aiService.js';

const router = express.Router();

/**
 * @route POST /api/evaluations
 * @desc Submit a new evaluation or resolve a pending one with control questions
 * @access Private (Student)
 */
router.post(
  '/',
  [
    body('teacherId').isMongoId().withMessage('Valid teacher ID is required'),
    body('courseId').notEmpty().withMessage('Course ID is required'),
    body('rawFeedback').isString().isLength({ min: 10, max: 5000 }).withMessage('Feedback must be between 10 and 5000 characters')
  ],
  async (req, res) => {
    // 1. Validate Input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { teacherId, courseId, rawFeedback } = req.body;
    // In a real app, studentId comes from the auth middleware (e.g., req.user.id)
    const studentId = req.user?.id || req.body.studentId; 

    try {
      // 2. Intercept with AI Control Engine
      const aiAnalysis = await analyzeFeedback(rawFeedback);

      // 3. Build Evaluation Document
      const newEvaluation = new Evaluation({
        studentId,
        teacherId,
        courseId,
        rawFeedback,
        status: aiAnalysis.status,
        sanitizedFeedback: aiAnalysis.sanitizedFeedback,
        objectiveScore: aiAnalysis.objectiveScore,
        aiMetadata: aiAnalysis.aiMetadata,
        controlQuestions: aiAnalysis.controlQuestions?.map(q => ({
          questionText: q,
          studentAnswer: '',
          resolved: false
        })) || []
      });

      // Basic check if teacher exists and is a teacher
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' });
      }

      // 4. Save to Database
      await newEvaluation.save();

      // 5. Respond dynamically based on AI result
      if (aiAnalysis.status === 'requires_revision') {
        // Return 202 Accepted but indicating more action is needed from frontend
        return res.status(202).json({
          message: 'Feedback requires revision before submission.',
          status: 'requires_revision',
          evaluationId: newEvaluation._id,
          controlQuestions: aiAnalysis.controlQuestions,
          flags: aiAnalysis.aiMetadata.flags
        });
      }

      // If approved
      return res.status(201).json({
        message: 'Evaluation submitted successfully',
        status: 'approved',
        evaluation: {
          id: newEvaluation._id,
          sanitizedFeedback: newEvaluation.sanitizedFeedback,
          objectiveScore: newEvaluation.objectiveScore
        }
      });

    } catch (error) {
      console.error('Submit Evaluation Error:', error);
      res.status(500).json({ message: 'Server error processing evaluation' });
    }
  }
);

/**
 * @route PUT /api/evaluations/:id/resolve
 * @desc Resolve control questions for a pending evaluation
 * @access Private (Student)
 */
router.put('/:id/resolve', async (req, res) => {
  const { id } = req.params;
  const { answers, revisedFeedback } = req.body; // e.g. [{questionId, answer}]

  try {
    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    if (evaluation.status !== 'requires_revision') {
      return res.status(400).json({ message: 'Evaluation does not require revision' });
    }

    // In a full implementation, we might send the combination of revisedFeedback
    // and the answers back to the AI for a second pass, or just overwrite rawFeedback
    // and re-run the interception. For MVP, we re-run the interception.

    if (!revisedFeedback) {
      return res.status(400).json({ message: 'Revised feedback is required to resolve issues' });
    }

    const aiAnalysis = await analyzeFeedback(revisedFeedback, true);
    
    evaluation.rawFeedback = revisedFeedback;
    evaluation.status = aiAnalysis.status;
    evaluation.sanitizedFeedback = aiAnalysis.sanitizedFeedback;
    evaluation.objectiveScore = aiAnalysis.objectiveScore;
    evaluation.aiMetadata = aiAnalysis.aiMetadata;
    
    // Update control questions based on the new analysis
    evaluation.controlQuestions = aiAnalysis.controlQuestions?.map(q => ({
      questionText: q,
      resolved: false
    })) || [];

    await evaluation.save();

    if (aiAnalysis.status === 'requires_revision') {
      return res.status(202).json({
        message: 'Feedback still requires revision.',
        status: 'requires_revision',
        evaluationId: evaluation._id,
        controlQuestions: aiAnalysis.controlQuestions,
        flags: aiAnalysis.aiMetadata.flags
      });
    }

    return res.status(200).json({
      message: 'Evaluation revised and approved successfully',
      status: 'approved',
      evaluation: {
        id: evaluation._id,
        sanitizedFeedback: evaluation.sanitizedFeedback,
        objectiveScore: evaluation.objectiveScore
      }
    });

  } catch (error) {
    console.error('Resolve Evaluation Error:', error);
    res.status(500).json({ message: 'Server error resolving evaluation' });
  }
});

/**
 * @route GET /api/evaluations/admin/all
 * @desc Get aggregated, sanitized evaluations across all teachers
 * @access Private (Admin)
 */
router.get('/admin/all', async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ status: 'approved' })
      .populate('teacherId', 'name department')
      .select('sanitizedFeedback objectiveScore courseId createdAt teacherId')
      .sort({ createdAt: -1 });

    const totalEvaluations = evaluations.length;
    const averageScore = totalEvaluations > 0 
      ? evaluations.reduce((acc, curr) => acc + curr.objectiveScore, 0) / totalEvaluations
      : 0;

    res.json({
      metrics: {
        totalEvaluations,
        averageScore: averageScore.toFixed(2)
      },
      evaluations
    });
  } catch (error) {
    console.error('Admin Fetch Evaluations Error:', error);
    res.status(500).json({ message: 'Server error fetching admin evaluations' });
  }
});

/**
 * @route GET /api/evaluations/teacher/:teacherId
 * @desc Get aggregated, sanitized evaluations for a teacher
 * @access Private (Teacher/Admin)
 */
router.get('/teacher/:teacherId', async (req, res) => {
  const { teacherId } = req.params;

  try {
    const evaluations = await Evaluation.find({
      teacherId,
      status: 'approved' // Only show approved/sanitized feedback to teachers
    })
    .select('sanitizedFeedback objectiveScore courseId createdAt')
    .sort({ createdAt: -1 });

    // Calculate aggregated metrics
    const totalEvaluations = evaluations.length;
    const averageScore = totalEvaluations > 0 
      ? evaluations.reduce((acc, curr) => acc + curr.objectiveScore, 0) / totalEvaluations
      : 0;

    res.json({
      metrics: {
        totalEvaluations,
        averageScore: averageScore.toFixed(2)
      },
      evaluations
    });
  } catch (error) {
    console.error('Fetch Evaluations Error:', error);
    res.status(500).json({ message: 'Server error fetching evaluations' });
  }
});

export default router;
