import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, Elevation, FormGroup, TextArea, Button, Intent, Callout, H3, H5, Divider, InputGroup } from '@blueprintjs/core';
import api from '../api';

const StudentForm = () => {
  const { courseId, teacherId } = useParams();
  const location = useLocation();
  const instructorName = location.state?.instructorName || teacherId;
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  
  // AI Control State
  const [controlState, setControlState] = useState({
    active: false,
    evaluationId: null,
    questions: [],
    flags: [],
  });
  
  // Answers to control questions
  const [answers, setAnswers] = useState({});
  const [isApproved, setIsApproved] = useState(false);

  // Initial Submit to /api/evaluations
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.post('/evaluations', {
        teacherId,
        courseId,
        studentId: '65e9b8f2c23a5d1b7c8d8f00', // Valid Hex Mockup
        rawFeedback: feedback
      });

      if (response.status === 202) {
        // AI Intercepted and requires revision
        setControlState({
          active: true,
          evaluationId: response.data.evaluationId,
          questions: response.data.controlQuestions || [],
          flags: response.data.flags || []
        });
      } else if (response.status === 201) {
        setIsApproved(true);
      }
    } catch (error) {
      console.error('Error submitting evaluation', error);
      // Basic error handling for MVP
      alert('Failed to submit evaluation. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Resolve Submit to /api/evaluations/:id/resolve
  const handleResolve = async () => {
    setLoading(true);
    try {
      const response = await api.put(`/evaluations/${controlState.evaluationId}/resolve`, {
        revisedFeedback: feedback,
        answers: Object.entries(answers).map(([q, a]) => ({ questionText: q, answer: a }))
      });

      if (response.status === 202) {
        // Still requires revision
        setControlState({
          active: true,
          evaluationId: response.data.evaluationId,
          questions: response.data.controlQuestions || [],
          flags: response.data.flags || []
        });
        setAnswers({}); // reset answers for the new questions
      } else if (response.status === 200) {
        setControlState({ active: false, evaluationId: null, questions: [], flags: [] });
        setIsApproved(true);
      }
    } catch (error) {
      console.error('Error resolving evaluation', error);
      alert('Failed to resolve evaluation.');
    } finally {
      setLoading(false);
    }
  };

  if (isApproved) {
    return (
      <Card elevation={Elevation.TWO} style={{ padding: '2rem', textAlign: 'center' }}>
        <Callout intent={Intent.SUCCESS} icon="tick-circle" title="Evaluation Submitted">
          Thank you for your constructive feedback. The evaluation has been securely recorded.
        </Callout>
      </Card>
    );
  }

  return (
    <Card elevation={Elevation.TWO} style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <H3>Targeted Evaluation</H3>
      <p className="bp5-text-muted">Course: {courseId} | Instructor: {instructorName}</p>
      
      <FormGroup
        label="Your Feedback"
        labelInfo="(required, min 10 chars)"
        helperText="Please be objective and constructive."
      >
        <TextArea
          large={true}
          fill={true}
          style={{ minHeight: '150px' }}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter your observations and suggestions here..."
        />
      </FormGroup>

      {controlState.active && (
        <Callout intent={Intent.WARNING} icon="warning-sign" title="AI Review: Revision Requested" style={{ marginBottom: '1rem' }}>
          <p>The AI control engine detected potential bias or unconstructive language.</p>
          {controlState.flags.length > 0 && (
            <ul>
              {controlState.flags.map((flag, idx) => <li key={idx}><strong>Flag:</strong> {flag}</li>)}
            </ul>
          )}
          <Divider style={{ margin: '10px 0' }} />
          <H5>Control Questions to help reformulate your feedback:</H5>
          {controlState.questions.map((q, idx) => (
            <FormGroup key={idx} label={q}>
              <InputGroup 
                placeholder="Briefly reflect on your answer..."
                value={answers[q] || ''}
                onChange={(e) => setAnswers({...answers, [q]: e.target.value})}
              />
            </FormGroup>
          ))}
          <p className="bp5-text-small bp5-text-muted mt-2">
            Please revise your original feedback above in light of these questions, then click Resolve & Resubmit.
          </p>
        </Callout>
      )}

      {!controlState.active ? (
        <Button 
          intent={Intent.PRIMARY} 
          icon="send-message"
          text="Submit Evaluation" 
          onClick={handleSubmit} 
          loading={loading}
          disabled={feedback.length < 10}
        />
      ) : (
        <Button 
          intent={Intent.WARNING} 
          icon="refresh"
          text="Resolve & Resubmit" 
          onClick={handleResolve} 
          loading={loading}
          disabled={feedback.length < 10}
        />
      )}
    </Card>
  );
};

export default StudentForm;
