import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const navigate = useNavigate();

  // Calendar setup
  const today = new Date();
  const currentMonthName = today.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingArray = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // 1. DUMMY REMARKS DATA (We will connect this to the backend later!)
  const sirRemarks = [
    { id: 1, type: 'Performance', date: '2026-04-01', text: 'Excellent score in the recent Calculus mock test.' },
    { id: 2, type: 'Complaint', date: '2026-03-28', text: 'Arjun was talking during the physics lecture. Needs to focus.' },
    { id: 3, type: 'Note', date: '2026-03-15', text: 'Please bring the new RD Sharma textbook from next week.' }
  ];

  useEffect(() => {
    const savedData = localStorage.getItem('studentData');
    if (savedData) {
      const parsedStudent = JSON.parse(savedData);
      setStudent(parsedStudent);
      fetchAttendance(parsedStudent.id);
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

  const getDayStatus = (day) => {
    const dateToCheck = new Date(today.getFullYear(), today.getMonth(), day).toDateString();
    const record = attendance.find(r => new Date(r.date).toDateString() === dateToCheck);
    return record ? record.status : null;
  };

  // 2. CALCULATE ATTENDANCE PERCENTAGE
  const totalClasses = attendance.length;
  const presentClasses = attendance.filter(r => r.status === 'Present').length;
  const attendancePercentage = totalClasses === 0 ? 0 : Math.round((presentClasses / totalClasses) * 100);

  const handleLogout = () => {
    localStorage.removeItem('studentData');
    navigate('/');
  };

  if (!student) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-red-700 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wider">EduTrack Student Portal</h1>
        <button onClick={handleLogout} className="bg-red-800 hover:bg-red-900 px-4 py-2 rounded text-sm font-semibold">
          LOGOUT
        </button>
      </nav>

      <div className="max-w-6xl mx-auto mt-8 p-4">
        
        {/* Top Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-red-700 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Welcome back, <span className="text-red-700">{student.name}</span>
            </h2>
            <p className="text-gray-500 mt-1">Student ID: {student.id.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* QUICK STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Fee Stat */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-500">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Fees</h3>
            <p className="text-3xl font-bold text-red-600">Rs. {student.balance}</p>
            {student.balance > 0 ? <p className="text-xs text-red-500 mt-1">Clear by 10th of month</p> : <p className="text-xs text-green-500 mt-1">All clear!</p>}
          </div>

          {/* Percentage Stat */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Overall Attendance</h3>
            <p className={`text-3xl font-bold ${attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
              {attendancePercentage}%
            </p>
            <p className="text-xs text-gray-500 mt-1">{presentClasses} out of {totalClasses} classes attended</p>
          </div>

          {/* Performance Stat Placeholder */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-yellow-500">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Latest Test Score</h3>
            <p className="text-3xl font-bold text-gray-800">85%</p>
            <p className="text-xs text-yellow-600 mt-1">Calculus Weekly Mock</p>
          </div>
        </div>
          
        {/* MAIN TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
          {/* LEFT COLUMN: The Visual Calendar (Takes up 2 parts) */}
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

          {/* RIGHT COLUMN: Sir's Remarks & Complaints (Takes up 1 part) */}
          <div className="lg:col-span-1 bg-white border border-gray-200 p-6 rounded-lg shadow-sm max-h-[450px] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4 sticky top-0 bg-white pb-2 border-b">Sir's Remarks</h3>
            
            <div className="space-y-4">
              {sirRemarks.map((remark) => (
                <div key={remark.id} className={`p-3 rounded border-l-4 ${
                  remark.type === 'Complaint' ? 'bg-red-50 border-red-500' : 
                  remark.type === 'Performance' ? 'bg-green-50 border-green-500' : 'bg-blue-50 border-blue-500'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-bold uppercase ${
                      remark.type === 'Complaint' ? 'text-red-700' : 
                      remark.type === 'Performance' ? 'text-green-700' : 'text-blue-700'
                    }`}>{remark.type}</span>
                    <span className="text-[10px] text-gray-500">{remark.date}</span>
                  </div>
                  <p className="text-sm text-gray-700">{remark.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;