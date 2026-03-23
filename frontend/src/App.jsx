import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { Navbar, Alignment, Button, Classes, Card, Elevation, H1, H3, H5, Text, Icon } from '@blueprintjs/core';
import { AuthProvider, useAuth } from './context/AuthContext';
import StudentForm from './components/StudentForm';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

const DEMO_COURSES = [
  { id: 'CS101', title: 'Intro to Computer Science', instructor: 'Dr. Alan Turing', teacherId: '65e9b8f2c23a5d1b7c8d8f99', icon: 'desktop' },
  { id: 'MATH202', title: 'Calculus & Linear Algebra', instructor: 'Dr. Katherine Johnson', teacherId: '65e9b8f2c23a5d1b7c8d8fa0', icon: 'function' },
  { id: 'ENG404', title: 'Machine Learning Ethics', instructor: 'Dr. Timnit Gebru', teacherId: '65e9b8f2c23a5d1b7c8d8fa1', icon: 'learning' }
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <H1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#10161a' }}>Empower Your Education</H1>
      <p className={Classes.UI_TEXT} style={{ fontSize: '1.2rem', color: '#5C7080', maxWidth: '600px', margin: '0 auto 4rem auto' }}>
        Welcome to EduEval AI. Select a course below to provide constructive, AI-mediated feedback that helps shape the future of learning.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', textAlign: 'left' }}>
        {DEMO_COURSES.map(course => (
          <Card 
            key={course.id} 
            interactive={true} 
            elevation={Elevation.TWO} 
            className="elegant-course-card"
            onClick={() => navigate(`/student/${course.id}/${course.teacherId}`, { state: { instructorName: course.instructor } })}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--accent-light)', color: 'var(--accent-hover)' }}>
                  <Icon icon={course.icon} size={24} />
                </div>
                <div>
                  <H5 style={{ margin: 0, color: '#5C7080' }}>{course.id}</H5>
                </div>
              </div>
              <H3>{course.title}</H3>
              <Text className="bp5-text-muted">Instructor: <strong>{course.instructor}</strong></Text>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button intent="primary" rightIcon="arrow-right" text="Evaluate" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Route protection wrappers
const RequireAuth = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'teacher') return <Navigate to={`/teacher/${user.id}`} replace />;
    return <Navigate to="/courses" replace />;
  }
  return children;
};

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar>
      <Navbar.Group align={Alignment.LEFT}>
        <Navbar.Heading style={{ fontWeight: 700, fontSize: '1.2rem', color: '#10161a' }}>
          EduEval<span style={{ color: 'var(--accent-color)' }}>.AI</span>
        </Navbar.Heading>
        <Navbar.Divider />
        {user && user.role === 'student' && (
          <Link to="/courses">
            <Button className={Classes.MINIMAL} icon="home" text="Home" />
          </Link>
        )}
        {user && user.role === 'teacher' && (
          <Link to={`/teacher/${user.id}`}>
            <Button className={Classes.MINIMAL} icon="dashboard" text="My Dashboard" />
          </Link>
        )}
        {user && user.role === 'admin' && (
          <Link to="/admin">
            <Button className={Classes.MINIMAL} icon="globe" text="Global Dashboard" />
          </Link>
        )}
      </Navbar.Group>
      
      <Navbar.Group align={Alignment.RIGHT}>
        {user ? (
          <>
            <span style={{ marginRight: '15px' }}><strong>{user.name}</strong> <span style={{opacity: 0.6}}>({user.role})</span></span>
            <Button className={Classes.MINIMAL} icon="log-out" text="Sign out" onClick={handleLogout} />
          </>
        ) : (
          <Link to="/login">
            <Button intent="primary" text="Sign In" />
          </Link>
        )}
      </Navbar.Group>
    </Navbar>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <NavigationBar />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              
              {/* Student Routes */}
              <Route path="/courses" element={<RequireAuth role="student"><LandingPage /></RequireAuth>} />
              <Route path="/student/:courseId/:teacherId" element={<RequireAuth role="student"><StudentForm /></RequireAuth>} />
              
              {/* Teacher Routes */}
              <Route path="/teacher/:teacherId" element={<RequireAuth role="teacher"><TeacherDashboard /></RequireAuth>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
