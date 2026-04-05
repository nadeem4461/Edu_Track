import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  // Fetch all students when Sir opens the page
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/students');
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, []);

  // Filter out only the students who owe money
  const pendingStudents = students.filter(student => student.pendingBalance > 0);

  // The PDF Generator Function
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("EduTrack - Pending Fee Report", 14, 15);
    
    const tableData = pendingStudents.map(student => [
      student.name, 
      student.className, 
      student.parentPhone, 
      `Rs. ${student.pendingBalance}`
    ]);

    doc.autoTable({
      head: [['Student Name', 'Class', 'Parent Phone', 'Due Amount']],
      body: tableData,
      startY: 20,
    });

    doc.save('Fee-Defaulters-Report.pdf');
  };

  // The "Quick Pay" Function
  const handleMarkPaid = async (studentId, amount) => {
    // Adding a confirmation popup so Sir doesn't click it by accident!
    if (!window.confirm(`Are you sure you want to clear Rs. ${amount} for this student?`)) return;

    try {
      await axios.post('http://localhost:5000/api/fees/pay', {
        studentId,
        amount,
        paymentMode: 'Cash',
        remarks: 'Quick cleared from Admin Dashboard'
      });
      
      alert('Payment recorded successfully!');
      window.location.reload(); // Refresh the page to update the list
    } catch (error) {
      alert('Error updating payment');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navbar */}
      <nav className="bg-gray-900 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wider">EduTrack Admin Control</h1>
        <button 
          onClick={() => navigate('/')}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-semibold"
        >
          EXIT ADMIN
        </button>
      </nav>

      <div className="max-w-6xl mx-auto mt-8 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">Pending Fee Report</h2>
            <button 
              onClick={generatePDF} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition-colors font-semibold"
            >
              Download PDF Report
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b p-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="border-b p-3 text-left font-semibold text-gray-700">Class</th>
                  <th className="border-b p-3 text-left font-semibold text-gray-700">Parent Phone</th>
                  <th className="border-b p-3 text-left font-semibold text-gray-700">Due Amount</th>
                  <th className="border-b p-3 text-center font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500 italic">No pending fees!</td>
                  </tr>
                ) : (
                  pendingStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="border-b p-3 text-gray-800">{student.name}</td>
                      <td className="border-b p-3 text-gray-600">{student.className}</td>
                      <td className="border-b p-3 text-gray-600">{student.parentPhone}</td>
                      <td className="border-b p-3 text-red-600 font-bold">Rs. {student.pendingBalance}</td>
                      <td className="border-b p-3 text-center">
                        <button 
                          onClick={() => handleMarkPaid(student._id, student.pendingBalance)}
                          className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition-colors shadow-sm text-sm font-bold"
                        >
                          Mark Full Paid
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;