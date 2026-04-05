import { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [message, setMessage] = useState('');

  // Generate arrays for our dropdowns
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  // Years from 1995 to 2020
  const years = Array.from({ length: 26 }, (_, i) => 2020 - i); 

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        phone,
        day: day.toString(),
        month: month.toString(),
        year: year.toString()
      });

      // If successful, show the student data
      setMessage(`Welcome back, ${response.data.student.name}! Your balance is Rs. ${response.data.student.balance}`);
      console.log(response.data);
      
      // TODO: Later, we will redirect the user to their dashboard here
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login Failed. Try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        
        {/* Header matching your college vibe */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-red-700">EduTrack Portal</h2>
          <p className="mt-2 text-gray-600">Login with your Phone and DOB</p>
        </div>

        {/* The Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Login Phone Number</label>
            <input 
              type="text" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g. 9876543211"
            />
          </div>

          {/* DOB Dropdowns */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Date of Birth</label>
            <div className="flex space-x-2">
              <select required value={day} onChange={(e) => setDay(e.target.value)} className="w-1/3 px-3 py-2 border rounded focus:ring-red-500">
                <option value="">Day</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select required value={month} onChange={(e) => setMonth(e.target.value)} className="w-1/3 px-3 py-2 border rounded focus:ring-red-500">
                <option value="">Month</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              <select required value={year} onChange={(e) => setYear(e.target.value)} className="w-1/3 px-3 py-2 border rounded focus:ring-red-500">
                <option value="">Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="w-full py-2 font-bold text-white bg-red-700 rounded hover:bg-red-800">
            LOGIN
          </button>
        </form>

        {/* Status Message */}
        {message && (
          <div className={`p-3 text-center rounded ${message.includes('Welcome') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;