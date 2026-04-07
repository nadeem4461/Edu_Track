import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]); 
  const navigate = useNavigate();

  // Calendar setup
  const today = new Date();
  const currentMonthName = today.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingArray = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const fetchFreshStudentData = async (studentId) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/students/${studentId}`);
      setStudent(data); // Overwrites stale local data with fresh database data!
    } catch (error) {
      console.error("Error fetching fresh student data:", error);
    }
  };

  useEffect(() => {
    const savedData = localStorage.getItem('studentData');
    if (savedData) {
      const parsedStudent = JSON.parse(savedData);
      setStudent(parsedStudent); // Instant load from local storage
      
      // Secretly fetch the newest data from the database in the background!
      fetchFreshStudentData(parsedStudent.id); 
      fetchAttendance(parsedStudent.id);
      fetchAnnouncements(); 
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchAttendance = async (studentId) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/attendance/${studentId}`);
      setAttendance(data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/announcements');
      setAnnouncements(data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const getDayStatus = (day) => {
    const dateToCheck = new Date(today.getFullYear(), today.getMonth(), day).toDateString();
    const record = attendance.find(r => new Date(r.date).toDateString() === dateToCheck);
    return record ? record.status : null;
  };

  const totalClasses = attendance.length;
  const presentClasses = attendance.filter(r => r.status === 'Present').length;
  const attendancePercentage = totalClasses === 0 ? 0 : Math.round((presentClasses / totalClasses) * 100);

  const handleLogout = () => {
    localStorage.removeItem('studentData');
    navigate('/');
  };

  if (!student) return <div className="p-10 text-center">Loading...</div>;

  // --- THE FIX: GRAB THE LATEST TEST SCORE ---
  let latestScore = null;
  if (student.scores && student.scores.length > 0) {
    // Get the very last item in the scores array (the newest test)
    latestScore = student.scores[student.scores.length - 1]; 
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-red-700 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wider">EduTrack Student Portal</h1>
        <button onClick={handleLogout} className="bg-red-800 hover:bg-red-900 px-4 py-2 rounded text-sm font-semibold">
          LOGOUT
        </button>
      </nav>

      <div className="max-w-6xl mx-auto mt-8 p-4">
        
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-red-700 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Welcome back, <span className="text-red-700">{student.name}</span>
            </h2>
            <p className="text-gray-500 mt-1">Student ID: {student.id ? student.id.substring(0, 8).toUpperCase() : student._id?.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-500">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Fees</h3>
            <p className="text-3xl font-bold text-red-600">Rs. {student.pendingBalance !== undefined ? student.pendingBalance : student.balance}</p>
            {(student.pendingBalance !== undefined ? student.pendingBalance : student.balance) > 0 ? <p className="text-xs text-red-500 mt-1">Clear by 10th of month</p> : <p className="text-xs text-green-500 mt-1">All clear!</p>}
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Overall Attendance</h3>
            <p className={`text-3xl font-bold ${attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
              {attendancePercentage}%
            </p>
            <p className="text-xs text-gray-500 mt-1">{presentClasses} out of {totalClasses} classes attended</p>
          </div>

          {/* --- THE UPDATED SCORE CARD --- */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-yellow-500">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Latest Test Score</h3>
            {latestScore ? (
              <>
                <p className="text-3xl font-bold text-gray-800">
                  {Math.round((latestScore.marksObtained / latestScore.totalMarks) * 100)}%
                </p>
                <p className="text-xs text-yellow-600 mt-1 font-bold truncate">
                  {latestScore.testName}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {latestScore.marksObtained} out of {latestScore.totalMarks} marks
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-300">--%</p>
                <p className="text-xs text-gray-500 mt-1">No tests taken yet</p>
              </>
            )}
          </div>
        </div>
          
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
          <div className="lg:col-span-2 bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Attendance Tracker</h3>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                {currentMonthName} {today.getFullYear()}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-bold text-gray-500 uppercase">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {paddingArray.map(pad => <div key={`pad-${pad}`} className="p-2"></div>)}
              {daysArray.map(day => {
                const status = getDayStatus(day);
                const isToday = day === today.getDate();
                let bgColor = "bg-gray-50 text-gray-400"; 
                if (status === 'Present') bgColor = "bg-green-100 text-green-800 font-bold border-green-300 border";
                if (status === 'Absent') bgColor = "bg-red-100 text-red-800 font-bold border-red-300 border";
                
                return (
                  <div key={day} className={`flex flex-col items-center justify-center p-2 rounded-lg h-16 ${bgColor} ${isToday ? 'ring-2 ring-blue-500 shadow-md' : ''}`}>
                    <span className="text-lg">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* NOTICE BOARD */}
            <div className="bg-blue-600 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold mb-4 flex items-center">📢 Notice Board</h3>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {announcements.filter(a => a.targetBatch === 'All' || a.targetBatch === student.className).map(a => (
                  <div key={a._id} className="border-b border-blue-400 pb-2">
                    <p className="font-bold text-sm">{a.title}</p>
                    <p className="text-xs opacity-90">{a.message}</p>
                    <p className="text-[10px] opacity-75 mt-1">{new Date(a.date).toLocaleDateString()}</p>
                  </div>
                ))}
                {announcements.length === 0 && <p className="text-xs italic">No new notices.</p>}
              </div>
            </div>

            {/* REAL DATABASE REMARKS */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm max-h-[300px] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 sticky top-0 bg-white">Sir's Feedback</h3>
              <div className="space-y-4">
                {student.remarks && student.remarks.length > 0 ? (
                  student.remarks.slice().reverse().map((remark, idx) => (
                    <div key={idx} className={`p-3 rounded border-l-4 ${
                      remark.type === 'Complaint' ? 'bg-red-50 border-red-500' : 
                      remark.type === 'Performance' ? 'bg-green-50 border-green-500' : 'bg-blue-50 border-blue-500'
                    }`}>
                      <p className="text-xs font-bold uppercase mb-1">{remark.type}</p>
                      <p className="text-sm text-gray-700">{remark.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic text-sm">No remarks yet.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;