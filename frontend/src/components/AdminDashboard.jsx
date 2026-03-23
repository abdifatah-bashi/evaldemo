import { useEffect, useState } from 'react';
import { Card, Elevation, Intent, Callout, H2, H4, H5, Spinner, NonIdealState, Tag, Text, Divider, HTMLTable } from '@blueprintjs/core';
import api from '../api';

const AdminDashboard = () => {
  const [data, setData] = useState({ metrics: {}, evaluations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardContent = async () => {
      try {
        const response = await api.get('/evaluations/admin/all');
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
        setError('Unable to load university evaluations.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardContent();
  }, []);

  if (loading) return <div style={{ padding: '4rem' }}><Spinner intent={Intent.PRIMARY} size={50} /></div>;
  if (error) return <NonIdealState icon="error" title="Data Load Failed" description={error} />;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <H2>Global University Dashboard</H2>
      
      {/* High Level Metrics KPI Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <Card elevation={Elevation.TWO} style={{ textAlign: 'center' }}>
          <H4 className="bp5-text-muted">Total Active Evaluations</H4>
          <H2 style={{ margin: 0, color: '#2b95d6' }}>{data.metrics.totalEvaluations}</H2>
        </Card>
        
        <Card elevation={Elevation.TWO} style={{ textAlign: 'center' }}>
          <H4 className="bp5-text-muted">Avg University Health Score</H4>
          <H2 style={{ margin: 0, color: data.metrics.averageScore >= 75 ? '#0f9960' : data.metrics.averageScore >= 50 ? '#d9822b' : '#db3737' }}>
            {data.metrics.averageScore} <span style={{ fontSize: '0.5em', color: '#8A9BA8' }}>/ 100</span>
          </H2>
        </Card>
      </div>

      <Divider />
      <H4>Recent Sanitized Feedback Stream</H4>
      
      {data.evaluations.length === 0 ? (
        <NonIdealState icon="document" title="No evaluations yet" description="Feedback will stream here as students submit it." />
      ) : (
        <HTMLTable bordered={true} striped={true} interactive={true} style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Instructor</th>
              <th>Course</th>
              <th>Score</th>
              <th>Sanitized Review</th>
            </tr>
          </thead>
          <tbody>
            {data.evaluations.map(evalItem => (
              <tr key={evalItem._id}>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(evalItem.createdAt).toLocaleDateString()}</td>
                <td>{evalItem.teacherId?.name || 'Unknown'}</td>
                <td>{evalItem.courseId}</td>
                <td>
                  <Tag intent={evalItem.objectiveScore >= 75 ? Intent.SUCCESS : evalItem.objectiveScore >= 50 ? Intent.WARNING : Intent.DANGER}>
                    {evalItem.objectiveScore}
                  </Tag>
                </td>
                <td><Text ellipsize={true}>{evalItem.sanitizedFeedback}</Text></td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>
      )}
    </div>
  );
};

export default AdminDashboard;
