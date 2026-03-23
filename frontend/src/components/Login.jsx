import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Elevation, Button, H2, Callout, Intent, HTMLSelect, FormGroup } from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';

const MOCK_EMAILS = [
  { label: 'Select a demo account...', value: '' },
  { label: 'Student (Demo)', value: 'student@university.edu' },
  { label: 'Teacher (Dr. Turing - CS)', value: 'aturing@university.edu' },
  { label: 'Teacher (Dr. Johnson - Math)', value: 'kjohnson@university.edu' },
  { label: 'Admin (Global)', value: 'admin@university.edu' }
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please select a demo account.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const user = await login(email);
      // Route based on role
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate(`/teacher/${user.id}`);
      else navigate('/courses');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Card elevation={Elevation.THREE} style={{ width: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <H2>EduEval<span style={{ color: 'var(--accent-color)' }}>.AI</span></H2>
          <p className="bp5-text-muted">Sign in to your account</p>
        </div>

        {error && <Callout intent={Intent.DANGER} style={{ marginBottom: '1rem' }}>{error}</Callout>}

        <form onSubmit={handleLogin}>
          <FormGroup label="Demo Account Selection">
            <HTMLSelect 
              fill={true} 
              large={true}
              options={MOCK_EMAILS}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormGroup>
          
          <Button 
            type="submit" 
            intent={Intent.PRIMARY} 
            fill={true} 
            large={true} 
            loading={loading}
            style={{ marginTop: '1rem' }}
          >
            Login
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;
