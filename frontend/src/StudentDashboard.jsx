import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosInstance';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]); 
  const [materials, setMaterials] = useState([]); 
  const navigate = useNavigate();

  const today = new Date();
  const currentMonthName = today.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingArray = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const fetchFreshStudentData = async (studentId) => {
    try {
      const { data } = await axiosInstance.get(`/api/students/${studentId}`);
      setStudent(data); 
    } catch (error) { console.error("Error fetching fresh student data:", error); }
  };

  useEffect(() => {
    const savedData = localStorage.getItem('studentData');
    if (savedData) {
      const parsedStudent = JSON.parse(savedData);
      setStudent(parsedStudent); 
      fetchFreshStudentData(parsedStudent.id); 
      fetchAttendance(parsedStudent.id);
      fetchAnnouncements(); 
      fetchMaterials();
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchAttendance = async (studentId) => {
    try {
      const { data } = await axiosInstance.get(`/api/attendance/${studentId}`);
      setAttendance(data);
    } catch (error) {}
  };

  const fetchAnnouncements = async () => {
    try {
      const { data } = await axiosInstance.get('/api/announcements');
      setAnnouncements(data);
    } catch (error) {}
  };

  const fetchMaterials = async () => {
    try {
      const { data } = await axiosInstance.get('/api/materials');
      setMaterials(data);
    } catch (error) {}
  };

  const getDayStatus = (day) => {
    const dateToCheck = new Date(today.getFullYear(), today.getMonth(), day).toDateString();
    const record = attendance.find(r => new Date(r.date).toDateString() === dateToCheck);
    return record ? record.status : null;
  };

  // --- ACADEMIC CALCULATIONS ---
  const totalClasses = attendance.length;
  const presentClasses = attendance.filter(r => r.status === 'Present').length;
  const attendancePercentage = totalClasses === 0 ? 0 : Math.round((presentClasses / totalClasses) * 100);

  let latestScore = null;
  let overallAvg = 0;
  if (student?.scores && student.scores.length > 0) {
    latestScore = student.scores[student.scores.length - 1];
    const totalPercentage = student.scores.reduce((acc, s) => acc + (s.marksObtained / s.totalMarks), 0);
    overallAvg = Math.round((totalPercentage / student.scores.length) * 100);
  }

  // --- REPORT CARD PDF GENERATION ---
  const downloadReportCard = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("OFFICIAL REPORT CARD", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Student Name: ${student.name}`, 14, 40);
    doc.text(`Class: ${student.className}`, 14, 47);
    doc.text(`Attendance: ${attendancePercentage}%`, 14, 54);
    doc.text(`Overall Academic Average: ${overallAvg}%`, 14, 61);

    const tableRows = student.scores.map(s => [
      s.testName,
      s.marksObtained,
      s.totalMarks,
      `${Math.round((s.marksObtained / s.totalMarks) * 100)}%`
    ]);

    autoTable(doc, {
      head: [["Test Name", "Marks Obtained", "Max Marks", "Percentage"]],
      body: tableRows,
      startY: 70,
      theme: 'grid',
      headStyles: { fillStyle: [180, 0, 0] } // Red header to match portal
    });

    doc.save(`${student.name}_Report_Card.pdf`);
  };

  const handleLogout = () => {
    localStorage.removeItem('studentData');
    navigate('/');
  };

  if (!student) return <div className="p-10 text-center">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-red-700 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-wider">MS Tution Classes Portal</h1>
        <button onClick={handleLogout} className="bg-red-800 hover:bg-red-900 px-4 py-2 rounded text-sm font-semibold transition-colors">LOGOUT</button>
      </nav>

      <div className="max-w-6xl mx-auto mt-8 p-4">
        
        {/* Header with PDF Download */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-red-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Welcome, <span className="text-red-700">{student.name}</span></h2>
            <p className="text-gray-500 mt-1">Class: {student.className} | Student ID: {student._id?.substring(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={downloadReportCard} className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-gray-700 flex items-center transition-all">
            <span className="mr-2">📄</span> Download Report Card
          </button>
        </div>

        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-red-500">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Dues</h3>
            <p className="text-3xl font-bold text-red-600">Rs. {student.pendingBalance ?? 0}</p>
            <p className="text-[10px] text-gray-400 mt-1">Updated on {new Date().toLocaleDateString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-blue-500">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Attendance</h3>
            <p className={`text-3xl font-bold ${attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>{attendancePercentage}%</p>
            <p className="text-[10px] text-gray-400 mt-1">{presentClasses} / {totalClasses} classes attended</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-yellow-500">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Avg Score</h3>
            <p className="text-3xl font-bold text-gray-800">{overallAvg}%</p>
            <p className="text-[10px] text-gray-400 mt-1">Across all recorded tests</p>
          </div>
        </div>
          
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. REPORT CARD TABLE */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b">
                <h3 className="font-bold text-gray-700 flex items-center"><span className="mr-2">📝</span> Detailed Test History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white text-gray-500 text-xs uppercase font-bold border-b">
                    <tr>
                      <th className="p-4">Test Name</th>
                      <th className="p-4 text-center">Score</th>
                      <th className="p-4 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {student.scores?.length > 0 ? [...student.scores].reverse().map((s, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold text-gray-800">{s.testName}</td>
                        <td className="p-4 text-center text-gray-600">{s.marksObtained} / {s.totalMarks}</td>
                        <td className="p-4 text-right">
                          <span className={`font-bold px-2 py-1 rounded text-sm ${Math.round((s.marksObtained/s.totalMarks)*100) >= 40 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                            {Math.round((s.marksObtained / s.totalMarks) * 100)}%
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" className="p-8 text-center text-gray-400 italic">No academic records found yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. CALENDAR */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-700">Attendance Calendar</h3>
                <span className="text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{currentMonthName} {today.getFullYear()}</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-4">
                {['S','M','T','W','T','F','S'].map(day => (<div key={day} className="text-[10px] font-bold text-gray-400 uppercase">{day}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {paddingArray.map(pad => <div key={`p-${pad}`}></div>)}
                {daysArray.map(day => {
                  const status = getDayStatus(day);
                  const isToday = day === today.getDate();
                  let color = "bg-gray-50 text-gray-300"; 
                  if (status === 'Present') color = "bg-green-500 text-white font-bold";
                  if (status === 'Absent') color = "bg-red-500 text-white font-bold";
                  return (
                    <div key={day} className={`flex items-center justify-center rounded-lg h-10 text-sm ${color} ${isToday ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. STUDY MATERIALS */}
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center"><span className="mr-2">📚</span> Study Materials</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {materials.filter(m => m.batch === 'All' || m.batch === student.className).length > 0 ? (
                  materials.filter(m => m.batch === 'All' || m.batch === student.className).map(m => (
                    <a key={m._id} href={m.driveLink} target="_blank" rel="noreferrer" className="block border border-blue-100 bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-all">
                      <h4 className="font-bold text-blue-900 text-sm truncate">{m.title}</h4>
                      <p className="text-[10px] text-blue-700 mt-1">{m.description || "No description"}</p>
                    </a>
                  ))
                ) : <p className="text-gray-400 italic text-xs">No materials uploaded.</p>}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg">
              <h3 className="font-bold mb-4 flex items-center">📢 Notice Board</h3>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {announcements.filter(a => a.targetBatch === 'All' || a.targetBatch === student.className).map(a => (
                  <div key={a._id} className="border-b border-blue-400 pb-3">
                    <p className="font-bold text-sm">{a.title}</p>
                    <p className="text-[11px] opacity-80 mt-1">{a.message}</p>
                  </div>
                ))}
                {announcements.length === 0 && <p className="text-xs italic opacity-70">All quiet for now.</p>}
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Feedback & Remarks</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {student.remarks?.length > 0 ? student.remarks.slice().reverse().map((r, i) => (
                  <div key={i} className={`p-3 rounded-lg border-l-4 ${r.type === 'Complaint' ? 'bg-red-50 border-red-500' : r.type === 'Performance' ? 'bg-green-50 border-green-500' : 'bg-blue-50 border-blue-500'}`}>
                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">{r.type}</p>
                    <p className="text-xs text-gray-700">{r.text}</p>
                  </div>
                )) : <p className="text-gray-400 italic text-xs">No feedback yet.</p>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;