import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // When the page loads, grab the data we saved during login
    const savedData = localStorage.getItem('studentData');
    if (savedData) {
      setStudent(JSON.parse(savedData));
    } else {
      // If someone tries to guess the URL without logging in, kick them out!
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('studentData');
    navigate('/');
  };

  if (!student) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <nav className="bg-red-700 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wider">EduTrack Student Portal</h1>
        <button 
          onClick={handleLogout}
          className="bg-red-800 hover:bg-red-900 px-4 py-2 rounded text-sm font-semibold"
        >
          LOGOUT
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto mt-8 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 border-b pb-4 mb-4">
            Welcome back, <span className="text-red-700">{student.name}</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            
            {/* Fee Card */}
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Tuition Fee</h3>
              <p className="text-4xl font-bold text-red-600">
                Rs. {student.balance}
              </p>
              {student.balance > 0 ? (
                <p className="text-sm text-red-500 mt-2">Please clear your dues by the 10th of this month.</p>
              ) : (
                <p className="text-sm text-green-600 mt-2 font-bold">All dues cleared! Great job.</p>
              )}
            </div>

            {/* Attendance Card Placeholder */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">My Attendance</h3>
              <p className="text-gray-600 italic mt-4">
                Detailed attendance calendar coming soon...
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;