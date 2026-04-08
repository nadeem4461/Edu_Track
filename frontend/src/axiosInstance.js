import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Check if we have student or admin data in localStorage
    const studentData = localStorage.getItem('studentData');
    const adminData = localStorage.getItem('adminData');

    let token = null;

    if (adminData) {
      token = JSON.parse(adminData).token;
    } else if (studentData) {
      token = JSON.parse(studentData).token;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
