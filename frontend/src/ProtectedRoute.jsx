import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, roleRequired }) => {
  const studentData = localStorage.getItem('studentData');
  const adminData = localStorage.getItem('adminData');

  if (roleRequired === 'admin') {
    if (!adminData) {
      return <Navigate to="/" replace />;
    }
  } else if (roleRequired === 'student') {
    if (!studentData) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
