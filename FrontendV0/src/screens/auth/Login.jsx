import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Illustration from '../../assets/illustration3.svg';
import Logo from '../../assets/logo.svg';
import API_BASE_URL from '../../api'; // Adjust the import path as necessary

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('username', form.username);
      params.append('password', form.password);
      // params.append('scope', '');
      // params.append('client_id', '');
      // params.append('client_secret', '');
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
      } else if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        console.log('Access Token:', data.access_token);
        if (data.user_id) {
          localStorage.setItem('user_id', data.user_id);
          console.log('User ID:', data.user_id);
        }
        navigate('/config');
      } else {
        setError('No access token received');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white">
      {/* Left Panel */}
      <div className="w-[25%] h-[90%] flex items-center justify-center bg-white rounded-[2rem] overflow-hidden">
        <img src={Illustration} alt="Illustration" className="w-full h-full object-contain" />
      </div>
      {/* Right Panel */}
      <div className="w-[50%] flex flex-col items-center justify-center ml-50">
        <img src={Logo} alt="Logo" className="w-36 mb-8" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-6"
          style={{
            fontFamily: 'Segoe UI',
            fontWeight: 400,
            fontStyle: 'normal',
            fontSize: '28px',
            lineHeight: '100%',
            letterSpacing: '0%',
            color: '#1a202c',
          }}>
          Login
        </h2>
  <form className="w-full max-w-lg space-y-5" onSubmit={handleSubmit}>
    <div>
      <label htmlFor="login-identifier" className="block text-gray-700 mb-1">
        Email / Phone Number
      </label>
      <input
        id="login-identifier"
        type="text"
        name="username"
        value={form.username}
        onChange={handleChange}
        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="maya123@gmail.com"
        autoComplete="username"
        required
      />
    </div>
    <div className="relative">
      <label htmlFor="login-password" className="block text-gray-700 mb-1">
        Password
      </label>
      <input
        id="login-password"
        type={showPassword ? 'text' : 'password'}
        name="password"
        value={form.password}
        onChange={handleChange}
        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
        placeholder="Password"
        autoComplete="current-password"
        required
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute top-9 right-3 text-gray-600 hover:text-gray-900 focus:outline-none"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13C6.6 5 17.4 5 21 13" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 17C11.606 17 11.2159 16.9224 10.8519 16.7716C10.488 16.6209 10.1573 16.3999 9.87868 16.1213C9.6001 15.8427 9.37913 15.512 9.22836 15.1481C9.0776 14.7841 9 14.394 9 14C9 13.606 9.0776 13.2159 9.22836 12.8519C9.37913 12.488 9.6001 12.1573 9.87868 11.8787C10.1573 11.6001 10.488 11.3791 10.8519 11.2284C11.2159 11.0776 11.606 11 12 11C12.7956 11 13.5587 11.3161 14.1213 11.8787C14.6839 12.4413 15 13.2044 15 14C15 14.7956 14.6839 15.5587 14.1213 16.1213C13.5587 16.6839 12.7956 17 12 17Z" fill="black" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
    {error && (
      <div className="text-red-500 text-center mt-2">{error}</div>
    )}
    <div className="flex justify-end">
      <Link to="/forgot-password" className="text-blue-500 text-sm hover:underline">
        Forgot Password?
      </Link>
    </div>
    <div className="w-full block">
      <button
        type="submit"
        className="w-full bg-[#1cb0f6] hover:bg-blue-600 text-white py-2 rounded font-semibold transition"
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  </form>
        <div className="text-center mt-6 text-gray-700 text-sm">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-blue-500 font-semibold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
