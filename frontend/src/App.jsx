import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import StudentDashboard from './StudentDashboard';
import AdminDashboard from './AdminDashboard';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The Default Page is Login */}
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* The Private Dashboard Page */}
        <Route path="/dashboard" element={<StudentDashboard />} />

        {/* Catch any weird URLs and send them back to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;