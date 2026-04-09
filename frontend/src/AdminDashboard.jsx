import { useState, useEffect } from 'react';
import axiosInstance from './axiosInstance';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]); 
  const [announcements, setAnnouncements] = useState([]); 
  const [materials, setMaterials] = useState([]); // NEW: Materials State
  
  const [activeTab, setActiveTab] = useState('classroom'); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [timeFilter, setTimeFilter] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', className: '', parentPhone: '', loginPhone: '', totalFee: '', day: '', month: '', year: '' });
  const [remarkData, setRemarkData] = useState({ type: 'Note', text: '' });
  const [newNotice, setNewNotice] = useState({ title: '', message: '', targetBatch: 'All', sendWhatsapp: false });
  
  // NEW: Material Form State
  const [newMaterial, setNewMaterial] = useState({ title: '', description: '', batch: 'All', driveLink: '' });

  const [testDetails, setTestDetails] = useState({ testName: '', totalMarks: 100 });
  const [studentMarks, setStudentMarks] = useState({});

  const fetchData = async () => {
    try {
      const studentRes = await axiosInstance.get('/api/students');
      const attendanceRes = await axiosInstance.get('/api/attendance/all');
      
      let noticeRes = { data: [] };
      try { noticeRes = await axiosInstance.get('/api/announcements'); } catch (e) {}
      
      // Fetch Materials
      let matRes = { data: [] };
      try { matRes = await axiosInstance.get('/api/materials'); } catch (e) {}
      
      setStudents(studentRes.data);
      setAllAttendance(attendanceRes.data);
      setAnnouncements(noticeRes.data);
      setMaterials(matRes.data);
    } catch (error) { console.error("Error fetching data:", error); }
  };

  useEffect(() => { fetchData(); }, []);

  const isSameDate = (recordDate, targetDate) => {
    if (!recordDate) return false;
    if (recordDate === targetDate) return true;
    const d = new Date(recordDate);
    const localYYYYMMDD = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return localYYYYMMDD === targetDate;
  };

  const existingClasses = students.map(s => s.className);
  const standardClasses = [...Array(12)].map((_, i) => `Class ${i + 1}`);
  const batches = ['All', ...new Set([...existingClasses, ...standardClasses])].sort();

  const filteredStudents = selectedBatch === 'All' ? students : students.filter(s => s.className === selectedBatch);
  const currentBatchSize = filteredStudents.length;
  const totalPendingMoney = filteredStudents.reduce((sum, s) => sum + (Number(s.pendingBalance) || 0), 0);

  const getStatusForDate = (studentId) => {
    const record = allAttendance.find(r => r.studentId === studentId && isSameDate(r.date, selectedDate));
    return record ? record.status : null;
  };

  const presentTodayCount = filteredStudents.filter(s => getStatusForDate(s._id) === 'Present').length;
  const absentTodayCount = filteredStudents.filter(s => getStatusForDate(s._id) === 'Absent').length;
  const unmarkedCount = currentBatchSize - (presentTodayCount + absentTodayCount);

  const getAttendanceStats = (studentId) => {
    const studentRecords = allAttendance.filter(r => r.studentId === studentId);
    const now = new Date();
    const filteredRecords = studentRecords.filter(record => {
      const recordDate = new Date(record.date);
      if (timeFilter === 'month') return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
      if (timeFilter === 'week') return Math.ceil(Math.abs(now - recordDate) / (1000 * 60 * 60 * 24)) <= 7;
      return true; 
    });

    const present = filteredRecords.filter(r => r.status === 'Present').length;
    const actualTrackedDays = filteredRecords.filter(r => r.status === 'Present' || r.status === 'Absent').length;
    const percentage = actualTrackedDays === 0 ? 0 : Math.round((present / actualTrackedDays) * 100);
    return { present, total: actualTrackedDays, percentage };
  };

  // --- ACTIONS ---
  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete ${studentName}?`)) return;
    try {
      await axiosInstance.delete(`/api/students/${studentId}`);
      fetchData();
    } catch (error) { alert('Error removing student.'); }
  };

  const handleFeeReminder = async (studentName, parentPhone, pendingBalance) => {
    let phone = parentPhone.replace(/\D/g, ''); 
    if (phone.length === 10) phone = '91' + phone; 
    const message = `Hello, this is a gentle reminder from Sir's Tuition. \n\nFees of *Rs. ${pendingBalance}* are currently pending for *${studentName}*. Please clear the dues at your earliest convenience. Thank you!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleMarkAttendance = async (studentId, clickedStatus, currentStatus) => {
    const finalStatus = currentStatus === clickedStatus ? 'Unmarked' : clickedStatus;
    setAllAttendance(prev => {
      const existingIndex = prev.findIndex(r => r.studentId === studentId && isSameDate(r.date, selectedDate));
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], status: finalStatus };
        return updated;
      }
      return [...prev, { studentId, status: finalStatus, date: selectedDate }];
    });
    try {
      await axiosInstance.post('/api/attendance', { studentId, status: finalStatus, date: selectedDate });
      fetchData(); 
    } catch (error) { fetchData(); }
  };

  const handleMarkPaid = async (studentId, amount) => {
    if (!window.confirm(`Clear Rs. ${amount}?`)) return;
    try {
      await axiosInstance.post('/api/fees/pay', { studentId, amount, paymentMode: 'Cash' });
      fetchData();
    } catch (error) { alert('Error updating payment'); }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post(`/api/students/${selectedStudent._id}/remarks`, remarkData);
      setShowRemarkModal(false);
      setRemarkData({ type: 'Note', text: '' });
      fetchData();
    } catch (error) { alert('Error saving remark'); }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/students', formData);
      setShowAddModal(false);
      setFormData({ name: '', className: '', parentPhone: '', loginPhone: '', totalFee: '', day: '', month: '', year: '' });
      fetchData();
    } catch (error) { alert('Error adding student'); }
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/announcements', newNotice);
      setNewNotice({ title: '', message: '', targetBatch: 'All', sendWhatsapp: false });
      fetchData();
    } catch (error) { alert('Error posting announcement.'); }
  };

  const handleSaveScores = async (e) => {
    e.preventDefault();
    if (!testDetails.testName) return alert("Please enter a Test Name!");
    try {
      const promises = Object.entries(studentMarks).map(([studentId, marksObtained]) => {
        if (marksObtained !== '') { 
          return axiosInstance.post(`/api/students/${studentId}/scores`, {
            testName: testDetails.testName, totalMarks: testDetails.totalMarks, marksObtained: Number(marksObtained)
          });
        }
      });
      await Promise.all(promises);
      alert("Scores saved!");
      setStudentMarks({}); setTestDetails({ testName: '', totalMarks: 100 });
      fetchData();
    } catch (error) { alert('Error saving scores.'); }
  };

  // NEW: Handle Material Upload
  const handlePostMaterial = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/materials', newMaterial);
      setNewMaterial({ title: '', description: '', batch: 'All', driveLink: '' });
      alert("Material uploaded successfully!");
      fetchData();
    } catch (error) { alert('Error uploading material.'); }
  };

  // NEW: Delete Material
  const handleDeleteMaterial = async (id) => {
    if(!window.confirm("Delete this material link?")) return;
    try {
      await axiosInstance.delete(`/api/materials/${id}`);
      fetchData();
    } catch (error) { alert('Error deleting material.'); }
  };

  // --- PDF GENERATION ---
  const generateFeePDF = () => {
    const doc = new jsPDF();
    doc.text(`MS Tution Classes - Pending Fee Report (${selectedBatch})`, 14, 15);
    const defaulters = filteredStudents.filter(s => s.pendingBalance > 0);
    autoTable(doc, { head: [['Student Name', 'Class', 'Parent Phone', 'Due Amount']], body: defaulters.map(s => [s.name, s.className, s.parentPhone, `Rs. ${s.pendingBalance}`]), startY: 20 });
    doc.save(`Fee-Report-${selectedBatch}.pdf`);
  };

  const generateAttendancePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(`Daily Attendance Report`, 14, 15); doc.setFontSize(11); doc.setTextColor(100);
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    doc.text(`Date: ${formattedDate}  |  Batch: ${selectedBatch}`, 14, 22);
    const tableRows = filteredStudents.map(student => [student.name, student.className, getStatusForDate(student._id) || 'Unmarked']);
    autoTable(doc, {
      head: [["Student Name", "Class", "Status"]], body: tableRows, startY: 28,
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 2) {
          if (data.cell.raw === 'Present') { data.cell.styles.textColor = [0, 153, 0]; data.cell.styles.fontStyle = 'bold'; } 
          else if (data.cell.raw === 'Absent') { data.cell.styles.textColor = [204, 0, 0]; data.cell.styles.fontStyle = 'bold'; }
        }
      }
    });
    doc.save(`Attendance_Full_${selectedBatch}_${selectedDate}.pdf`);
  };

  const generateAbsenteesPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(`Absentees Report`, 14, 15); doc.setFontSize(11); doc.setTextColor(100);
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    doc.text(`Date: ${formattedDate}  |  Batch: ${selectedBatch}`, 14, 22);
    const tableRows = [];
    filteredStudents.forEach(student => { if (getStatusForDate(student._id) === 'Absent') tableRows.push([student.name, student.className]); });
    if (tableRows.length === 0) return alert("No students are marked absent.");
    autoTable(doc, {
      head: [["Student Name", "Class"]], body: tableRows, startY: 28,
      didParseCell: function(data) { if (data.section === 'body' && data.column.index === 0) { data.cell.styles.textColor = [204, 0, 0]; data.cell.styles.fontStyle = 'bold'; } }
    });
    doc.save(`Absentees_Only_${selectedBatch}_${selectedDate}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wider truncate">MS Tution Classes Admin</h1>
        <button onClick={() => { sessionStorage.removeItem('adminData'); Cookies.remove('token'); navigate('/'); }} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm font-semibold whitespace-nowrap ml-2">EXIT</button>
      </nav>

      <div className="max-w-7xl mx-auto mt-4 md:mt-8 p-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-gray-300 pb-4 gap-4">
          <div className="w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Dashboard</h2>
            <div className="flex overflow-x-auto space-x-2 pb-1">
              <button onClick={() => setActiveTab('classroom')} className={`px-4 md:px-6 py-2 rounded-t-lg font-bold transition-colors whitespace-nowrap ${activeTab === 'classroom' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>🏫 Classroom</button>
              <button onClick={() => setActiveTab('academics')} className={`px-4 md:px-6 py-2 rounded-t-lg font-bold transition-colors whitespace-nowrap ${activeTab === 'academics' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>📝 Academics</button>
              <button onClick={() => setActiveTab('fees')} className={`px-4 md:px-6 py-2 rounded-t-lg font-bold transition-colors whitespace-nowrap ${activeTab === 'fees' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>💰 Fees</button>
              <button onClick={() => setActiveTab('materials')} className={`px-4 md:px-6 py-2 rounded-t-lg font-bold transition-colors whitespace-nowrap ${activeTab === 'materials' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>📚 Materials</button>
              <button onClick={() => setActiveTab('notices')} className={`px-4 md:px-6 py-2 rounded-t-lg font-bold transition-colors whitespace-nowrap ${activeTab === 'notices' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>📢 Notices</button>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow font-bold whitespace-nowrap w-full md:w-auto">+ Admit Student</button>
        </div>

        {/* Global Filters */}
        {(activeTab !== 'notices' && activeTab !== 'materials') && (
          <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center border border-gray-200">
            <div className="w-full md:w-auto flex-1">
              <label className="text-sm font-bold text-gray-500 uppercase block mb-1">
                Batch / Class <span className="ml-2 md:ml-3 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded border border-blue-400">Size: {currentBatchSize}</span>
              </label>
              <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 p-2.5 w-full md:w-64">
                {batches.map(batch => <option key={batch} value={batch}>{batch === 'All' ? 'All Classes' : batch}</option>)}
              </select>
            </div>

            {activeTab === 'classroom' && (
              <div className="w-full md:w-auto">
                <label className="text-sm font-bold text-gray-500 uppercase block mb-1">Stats Timeframe</label>
                <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 p-2.5 w-full md:w-auto">
                  <option value="week">Past 7 Days</option>
                  <option value="month">Current Month</option>
                  <option value="overall">Overall</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: CLASSROOM */}
        {activeTab === 'classroom' && (
          <div className="bg-white rounded-lg shadow-lg border-t-4 border-blue-600 overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center">
                  <label className="font-bold text-gray-700 mr-3">Date:</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div className="flex space-x-2">
                  <button onClick={generateAttendancePDF} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded shadow text-sm font-bold transition-colors whitespace-nowrap">📄 Full Report</button>
                  <button onClick={generateAbsenteesPDF} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded shadow text-sm font-bold transition-colors whitespace-nowrap">📄 Absentees</button>
                </div>
              </div>
              <div className="flex space-x-2">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-300">{presentTodayCount} P</span>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold border border-red-300">{absentTodayCount} A</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-left font-bold text-gray-700 whitespace-nowrap">Student Info</th>
                    <th className="p-4 text-center font-bold text-gray-700 whitespace-nowrap">Attendance</th>
                    <th className="p-4 text-center font-bold text-blue-700 whitespace-nowrap">Mark for {selectedDate}</th>
                    <th className="p-4 text-right font-bold text-gray-700 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan="4" className="p-4 text-center text-gray-500 italic">No students in this batch.</td></tr>
                  ) : (
                    filteredStudents.map(s => {
                      const stats = getAttendanceStats(s._id);
                      const currentStatus = getStatusForDate(s._id);
                      return (
                        <tr key={s._id} className="hover:bg-gray-50">
                          <td className="p-4 whitespace-nowrap">
                            <p className="font-bold text-gray-800 text-lg">{s.name}</p>
                            <p className="text-sm text-gray-500">{s.className}</p>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center">
                              <span className={`text-xl font-bold ${stats.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>{stats.present} / {stats.total}</span>
                              <span className="text-xs text-gray-500 font-semibold">{stats.percentage}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <div className="inline-flex rounded-md shadow-sm" role="group">
                              <button onClick={() => handleMarkAttendance(s._id, 'Present', currentStatus)} className={`px-4 py-2 text-sm font-bold border rounded-l-lg transition-colors ${currentStatus === 'Present' ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-green-50'}`}>P</button>
                              <button onClick={() => handleMarkAttendance(s._id, 'Absent', currentStatus)} className={`px-4 py-2 text-sm font-bold border border-l-0 rounded-r-lg transition-colors ${currentStatus === 'Absent' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-gray-700 hover:bg-red-50'}`}>A</button>
                            </div>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap space-x-2">
                            <button onClick={() => { setSelectedStudent(s); setShowRemarkModal(true); }} className="bg-gray-800 text-white px-3 py-2 rounded text-sm font-bold hover:bg-gray-700 shadow-sm">+ Remark</button>
                            <button onClick={() => handleDeleteStudent(s._id, s.name)} className="bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded text-sm font-bold hover:bg-red-200 shadow-sm" title="Remove Student">🗑️</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ACADEMICS */}
        {activeTab === 'academics' && (
          <div className="bg-white rounded-lg shadow-lg border-t-4 border-blue-600 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-blue-50">
              <h3 className="text-xl font-bold text-gray-700 mb-4">Enter Test Marks for {selectedBatch}</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <input required type="text" placeholder="Test Name (e.g., Math Ch-1)" className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500" value={testDetails.testName} onChange={e => setTestDetails({...testDetails, testName: e.target.value})} />
                <div className="flex items-center">
                  <span className="mr-2 font-bold text-gray-600 whitespace-nowrap">Total Marks:</span>
                  <input required type="number" className="w-24 p-2 border rounded focus:ring-2 focus:ring-blue-500" value={testDetails.totalMarks} onChange={e => setTestDetails({...testDetails, totalMarks: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto p-6">
              {selectedBatch === 'All' ? (
                <div className="text-center p-8 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                  <p className="font-bold text-lg">⚠️ Please select a specific Batch (e.g., Class 10) from the dropdown above to enter marks.</p>
                </div>
              ) : (
                <form onSubmit={handleSaveScores}>
                  <table className="min-w-full border border-gray-200 mb-6">
                    <thead className="bg-gray-100">
                      <tr><th className="p-3 text-left font-bold text-gray-700">Student Name</th><th className="p-3 text-right font-bold text-gray-700">Marks Obtained</th></tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? <tr><td colSpan="2" className="p-4 text-center text-gray-500 italic">No students.</td></tr> : filteredStudents.map(s => (
                        <tr key={s._id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-bold text-gray-800">{s.name}</td>
                          <td className="p-3 text-right"><input type="number" placeholder="Score" max={testDetails.totalMarks} className="w-32 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-center font-bold" value={studentMarks[s._id] || ''} onChange={e => setStudentMarks({...studentMarks, [s._id]: e.target.value})} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md text-lg">💾 Save All Scores</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FEES */}
        {activeTab === 'fees' && (
          <div className="bg-white rounded-lg shadow-lg border-t-4 border-blue-600 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white border-b gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-700">Fee Status ({selectedBatch})</h3>
                <p className="text-sm font-bold mt-1 text-red-500 bg-red-50 inline-block px-2 py-1 rounded border border-red-200">Total Outstanding: Rs. {totalPendingMoney}</p>
              </div>
              <button onClick={generateFeePDF} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold whitespace-nowrap w-full md:w-auto">PDF Defaulters</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr><th className="p-4 text-left font-bold text-gray-700 whitespace-nowrap">Name</th><th className="p-4 text-left font-bold text-gray-700 whitespace-nowrap">Status</th><th className="p-4 text-right font-bold text-gray-700 whitespace-nowrap">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.length === 0 ? <tr><td colSpan="3" className="p-4 text-center text-gray-500 italic">No students.</td></tr> : filteredStudents.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold whitespace-nowrap text-gray-800">{s.name}</td>
                      <td className="p-4 whitespace-nowrap">{s.pendingBalance > 0 ? <span className="text-red-600 font-bold text-lg">Rs. {s.pendingBalance} Due</span> : <span className="text-green-600 font-bold text-lg">Cleared</span>}</td>
                      <td className="p-4 text-right whitespace-nowrap space-x-2">
                        {s.pendingBalance > 0 ? (
                          <><button onClick={() => handleMarkPaid(s._id, s.pendingBalance)} className="bg-green-500 text-white px-4 py-2 rounded font-bold shadow-sm hover:bg-green-600">Mark Paid</button>
                          <button onClick={() => handleFeeReminder(s.name, s.parentPhone, s.pendingBalance)} className="bg-yellow-100 text-yellow-800 border border-yellow-300 px-3 py-2 rounded font-bold shadow-sm hover:bg-yellow-200"><span className="mr-1">💬</span> WhatsApp</button></>
                        ) : <span className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded font-bold inline-block">✅ All Clear</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NEW TAB 4: MATERIALS */}
        {activeTab === 'materials' && (
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-600">
            <h3 className="text-xl font-bold text-gray-700 mb-4">Upload Study Material (Google Drive Links)</h3>
            <form onSubmit={handlePostMaterial} className="space-y-4 mb-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="Document Title (e.g., Math Notes Ch-1)" className="p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})} />
                <select className="p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white" value={newMaterial.batch} onChange={e => setNewMaterial({...newMaterial, batch: e.target.value})}>
                  {batches.map(b => <option key={b} value={b}>{b === 'All' ? 'Assign to ALL Classes' : `Assign to ${b} Only`}</option>)}
                </select>
              </div>
              <input required type="url" placeholder="Paste Google Drive Link Here" className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" value={newMaterial.driveLink} onChange={e => setNewMaterial({...newMaterial, driveLink: e.target.value})} />
              <input type="text" placeholder="Short Description (Optional)" className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" value={newMaterial.description} onChange={e => setNewMaterial({...newMaterial, description: e.target.value})} />
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-red-600">⚠️ Make sure the Google Drive link is set to "Anyone with the link can view".</span>
                <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded font-bold hover:bg-blue-700 shadow-md">Upload Material</button>
              </div>
            </form>

            <h3 className="font-bold text-gray-500 mb-4 uppercase text-sm border-b pb-2">Uploaded Materials History</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {materials.length === 0 ? <p className="text-gray-500 italic">No materials uploaded yet.</p> : materials.map(m => (
                <div key={m._id} className="p-4 border border-gray-200 rounded bg-white hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{m.title} <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">{m.batch}</span></p>
                    <p className="text-gray-600 mt-1 text-sm">{m.description}</p>
                    <a href={m.driveLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline mt-2 inline-block font-bold">🔗 Open Link</a>
                  </div>
                  <button onClick={() => handleDeleteMaterial(m._id)} className="text-red-500 hover:text-red-700 font-bold ml-4">🗑️ Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: NOTICES */}
        {activeTab === 'notices' && (
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-600">
            <h3 className="text-xl font-bold text-gray-700 mb-4">Broadcast Emergency Notice</h3>
            <form onSubmit={handlePostNotice} className="space-y-4 mb-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="text" placeholder="Notice Title (e.g., Exam Date)" className="p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} />
                <select className="p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white" value={newNotice.targetBatch} onChange={e => setNewNotice({...newNotice, targetBatch: e.target.value})}>
                  {batches.map(b => <option key={b} value={b}>{b === 'All' ? 'Broadcast to ALL Classes' : `Broadcast to ${b} Only`}</option>)}
                </select>
              </div>
              <textarea required placeholder="Type your message here..." className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" rows="3" value={newNotice.message} onChange={e => setNewNotice({...newNotice, message: e.target.value})}></textarea>
              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded font-bold hover:bg-blue-700 shadow-md">Send Broadcast</button>
              </div>
            </form>
            <h3 className="font-bold text-gray-500 mb-4 uppercase text-sm border-b pb-2">Notice History</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {announcements.length === 0 ? <p className="text-gray-500 italic">No notices sent yet.</p> : announcements.map(n => (
                <div key={n._id} className="p-4 border border-gray-200 rounded bg-white hover:bg-gray-50 flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{n.title} <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">{n.targetBatch}</span></p>
                    <p className="text-gray-600 mt-1">{n.message}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-400 whitespace-nowrap ml-4">{new Date(n.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* --- MODALS --- */}
      {showRemarkModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex justify-between"><h3 className="font-bold">Remark for {selectedStudent.name}</h3><button onClick={() => setShowRemarkModal(false)} className="text-white font-bold text-xl">&times;</button></div>
            <form onSubmit={handleAddRemark} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Type</label>
                <select className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={remarkData.type} onChange={e => setRemarkData({...remarkData, type: e.target.value})}>
                  <option value="Performance">Performance (Positive)</option><option value="Complaint">Complaint (Negative)</option><option value="Note">General Note</option>
                </select>
              </div>
              <div><label className="block text-sm text-gray-600 mb-1">Details</label><textarea required rows="3" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={remarkData.text} onChange={e => setRemarkData({...remarkData, text: e.target.value})}></textarea></div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded font-bold">Save Remark</button>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center"><h3 className="font-bold text-lg">Admit Student</h3><button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button></div>
            <div className="overflow-y-auto p-6">
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm text-gray-600 mb-1">Full Name</label><input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Standard/Class</label><select required className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-green-500" value={formData.className} onChange={e => setFormData({...formData, className: e.target.value})}><option value="" disabled>Select Class...</option>{[...Array(12)].map((_, i) => <option key={i+1} value={`Class ${i + 1}`}>Class {i + 1}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm text-gray-600 mb-1">Parent WhatsApp</label><input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} /></div>
                  <div><label className="block text-sm text-gray-600 mb-1">Student Login Phone</label><input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500" value={formData.loginPhone} onChange={e => setFormData({...formData, loginPhone: e.target.value})} /></div>
                </div>
                <div><label className="block text-sm text-gray-600 mb-1">Total Annual Fee (Rs.)</label><input required type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500" value={formData.totalFee} onChange={e => setFormData({...formData, totalFee: e.target.value})} /></div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                  <div className="flex space-x-2">
                    <input required type="number" placeholder="DD" className="w-1/3 border p-2 rounded focus:ring-2 focus:ring-green-500" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} />
                    <input required type="number" placeholder="MM" className="w-1/3 border p-2 rounded focus:ring-2 focus:ring-green-500" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} />
                    <input required type="number" placeholder="YYYY" className="w-1/3 border p-2 rounded focus:ring-2 focus:ring-green-500" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-3 mt-4 rounded font-bold hover:bg-green-700 shadow-md">Save Student</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;