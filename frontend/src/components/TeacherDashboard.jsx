import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Elevation, Intent, Callout, H2, H4, Spinner, NonIdealState, Tag, Text, Divider } from '@blueprintjs/core';
import api from '../api';

const TeacherDashboard = () => {
  const { teacherId } = useParams();
  const [data, setData] = useState({ metrics: {}, evaluations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardContent = async () => {
      try {
        const response = await api.get(`/evaluations/teacher/${teacherId}`);
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch teacher data', err);
        setError('Unable to load evaluations. Please check the backend connection.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardContent();
  }, [teacherId]);

  if (loading) {
    return (
      <div style={{ padding: '4rem' }}>
        <Spinner intent={Intent.PRIMARY} size={50} />
      </div>
    );
  }

  if (error) {
    return (
      <NonIdealState
        icon="error"
        title="Data Load Failed"
        description={error}
        action={<Card elevation={Elevation.ZERO}><Text className="bp5-text-muted">Ensure API is running on :8080</Text></Card>}
      />
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <H2>Teacher Performance Dashboard</H2>
      
      {/* High Level Metrics KPI Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <Card elevation={Elevation.TWO} style={{ textAlign: 'center' }}>
          <H4 className="bp5-text-muted">Total Evaluations</H4>
          <H2 style={{ margin: 0, color: '#2b95d6' }}>{data.metrics.totalEvaluations}</H2>
        </Card>
        
        <Card elevation={Elevation.TWO} style={{ textAlign: 'center' }}>
          <H4 className="bp5-text-muted">Avg Objective Score</H4>
          <H2 style={{ margin: 0, color: data.metrics.averageScore >= 75 ? '#0f9960' : data.metrics.averageScore >= 50 ? '#d9822b' : '#db3737' }}>
            {data.metrics.averageScore} <span style={{ fontSize: '0.5em', color: '#8A9BA8' }}>/ 100</span>
          </H2>
        </Card>
      </div>

      <Divider />

      <H4>Sanitized Student Feedback</H4>
      
      {data.evaluations.length === 0 ? (
        <NonIdealState
          icon="document"
          title="No evaluations yet"
          description="Approved student feedback will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {data.evaluations.map((evalItem) => (
            <Card key={evalItem._id} elevation={Elevation.ONE}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <Text className="bp5-text-muted">Course: <strong>{evalItem.courseId}</strong></Text>
                <div>
                  <Tag 
                    intent={evalItem.objectiveScore >= 75 ? Intent.SUCCESS : evalItem.objectiveScore >= 50 ? Intent.WARNING : Intent.DANGER}
                    round={true}
                  >
                    Score: {evalItem.objectiveScore}
                  </Tag>
                </div>
              </div>
              <Callout>
                {/* Notice we only show sanitizedFeedback, ensuring teacher privacy and constructive tone */}
                <Text style={{ whiteSpace: 'pre-wrap' }}>
                  {evalItem.sanitizedFeedback || "No feedback body provided."}
                </Text>
              </Callout>
              <Text className="bp5-text-muted" style={{ fontSize: '0.8em', marginTop: '10px', textAlign: 'right' }}>
                {new Date(evalItem.createdAt).toLocaleDateString()}
              </Text>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
