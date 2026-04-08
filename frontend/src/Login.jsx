import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosInstance';

const Login = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'admin'
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Student Form State (MSRIT Style Dropdowns)
  const [phone, setPhone] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Admin Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Stitch the 3 dropdowns together to match the database format (YYYY-MM-DD)
    const formattedDob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    try {
      const { data } = await axiosInstance.post('/api/auth/student', { 
        loginPhone: phone, 
        dob: formattedDob 
      });
      // Save data locally and redirect
      localStorage.setItem('studentData', JSON.stringify({ id: data._id, name: data.name, className: data.className, token: data.token }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Phone Number or Date of Birth');
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await axiosInstance.post('/api/auth/admin', { username, password });
      localStorage.setItem('adminData', JSON.stringify(data));
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Admin Credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-red-700 p-6 text-center">
          <h1 className="text-3xl font-bold text-white tracking-wider">EduTrack</h1>
          <p className="text-red-200 mt-1">Tuition Management System</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => { setActiveTab('student'); setError(''); }}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'student' ? 'text-red-700 border-b-4 border-red-700 bg-red-50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            👨‍🎓 Student
          </button>
          <button 
            onClick={() => { setActiveTab('admin'); setError(''); }}
            className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'admin' ? 'text-gray-900 border-b-4 border-gray-900 bg-gray-100' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            👨‍🏫 Admin
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 text-sm font-bold text-center">
              {error}
            </div>
          )}

          {activeTab === 'student' ? (
            <form onSubmit={handleStudentLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Registered Phone Number</label>
                <input required type="text" placeholder="Enter mobile number" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth (Password)</label>
                {/* --- 3 SEPARATE DROPDOWNS (MSRIT STYLE) --- */}
                <div className="flex space-x-2">
                  
                  {/* DAY DROPDOWN */}
                  <select required className="w-1/3 px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all bg-white text-gray-700" value={day} onChange={e => setDay(e.target.value)}>
                    <option value="" disabled>Day</option>
                    {[...Array(31)].map((_, i) => (
                      <option key={i+1} value={i+1}>{String(i+1).padStart(2, '0')}</option>
                    ))}
                  </select>

                  {/* MONTH DROPDOWN */}
                  <select required className="w-1/3 px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all bg-white text-gray-700" value={month} onChange={e => setMonth(e.target.value)}>
                    <option value="" disabled>Month</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>{String(i+1).padStart(2, '0')}</option>
                    ))}
                  </select>

                  {/* YEAR DROPDOWN */}
                  <select required className="w-1/3 px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all bg-white text-gray-700" value={year} onChange={e => setYear(e.target.value)}>
                    <option value="" disabled>Year</option>
                    {/* Generates years from 2025 down to 1995 */}
                    {[...Array(31)].map((_, i) => {
                      const y = 2025 - i; 
                      return <option key={y} value={y}>{y}</option>
                    })}
                  </select>

                </div>
              </div>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-colors text-lg">
                Login to Portal
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                <input required type="text" placeholder="Admin username" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none transition-all" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                <input required type="password" placeholder="••••••••" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-colors text-lg">
                Access Dashboard
              </button>
            </form>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Login;