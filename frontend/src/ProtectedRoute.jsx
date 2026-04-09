import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute = ({ children, roleRequired }) => {
  const studentData = sessionStorage.getItem('studentData');
  const adminData = sessionStorage.getItem('adminData');
  const token = Cookies.get('token');

  if (roleRequired === 'admin') {
    if (!adminData || !token) {
      return <Navigate to="/" replace />;
    }
  } else if (roleRequired === 'student') {
    if (!studentData || !token) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
