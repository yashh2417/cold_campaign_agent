import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Banner from '../../assets/banner.svg';
import Logo from '../../assets/logo.svg';
import * as countryCodes from 'country-codes-list';
import API_BASE_URL from '../../api';

function Signup() {
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    countryCode: '+91',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const countryCodeOptions = countryCodes.customList(
    'countryCode',
    '[{countryCode}] {countryNameEn}: +{countryCallingCode}'
  );


  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const phone_number = `${form.countryCode}${form.phone}`;
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          hashed_password: form.password,
          name: form.name,
          phone_number,
          company: form.businessName,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Signup failed');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  }

  const toggleConfirmPassword = () => {
    setShowConfirmPassword((v) => !v);
  };

  const togglePassword = () => {
    setShowPassword((v) => !v);
  };

  const EyeIcon = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 13C6.6 5 17.4 5 21 13"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 17C11.606 17 11.2159 16.9224 10.8519 16.7716C10.488 16.6209 10.1573 16.3999 9.87868 16.1213C9.6001 15.8427 9.37913 15.512 9.22836 15.1481C9.0776 14.7841 9 14.394 9 14C9 13.606 9.0776 13.2159 9.22836 12.8519C9.37913 12.488 9.6001 12.1573 9.87868 11.8787C10.1573 11.6001 10.488 11.3791 10.8519 11.2284C11.2159 11.0776 11.606 11 12 11C12.7956 11 13.5587 11.3161 14.1213 11.8787C14.6839 12.4413 15 13.2044 15 14C15 14.7956 14.6839 15.5587 14.1213 16.1213C13.5587 16.6839 12.7956 17 12 17Z"
        fill="black"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white-100">
      {/* Left Panel */}
      <div
        className="w-[33%] h-[90%] flex items-center justify-center rounded-[2rem] overflow-hidden"
        style={{
          backgroundImage: `url(${Banner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
        }}
      >
        <img src={Banner} alt="Banner" className="w-full h-full object-contain" />
      </div>
      {/* Right Panel (Form Card) */}
      <div className="w-[50%] flex flex-col items-center justify-center">
        <div className="bg-white py-12 px-10 rounded-2xl shadow-lg w-full max-w-2xl flex flex-col items-center">
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
            Sign Up
          </h2>
          <form className="w-full flex flex-col gap-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-x-10 gap-y-6 w-full">
              <div>
                <label className="block text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Maya"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="maya123@gmail.com"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Country Code</label>
                <select
                  name="countryCode"
                  value={form.countryCode}
                  onChange={handleChange}
                  className="w-full px-5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                >
                  {Object.values(countryCodeOptions).map((label) => {
                    const callingCodeMatch = label.match(/\+\d+/);
                    const callingCode = callingCodeMatch ? callingCodeMatch[0] : '';
                    return (
                      <option key={callingCode} value={callingCode}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="97865 43210"
                  required
                />
              </div>
              <div className="relative">
                <label className="block text-gray-700 mb-1">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Maya123"
                  required
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-2 top-[38px]"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  {EyeIcon}
                </button>
              </div>
              <div className="relative">
                <label className="block text-gray-700 mb-1">Confirm Password</label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Maya123"
                  required
                />
                <button
                  type="button"
                  onClick={toggleConfirmPassword}
                  className="absolute right-2 top-[38px]"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  {EyeIcon}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Business Name (If any)</label>
              <input
                type="text"
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                className="w-full px-5 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Maya"
              />
            </div>
            {error && (
              <div className="text-red-500 text-center mt-2">{error}</div>
            )}
            <div className="flex justify-center mt-4">
              <button
                type="submit"
                className="bg-[#1cb0f6] hover:bg-blue-600 text-white py-2 px-1 rounded font-semibold transition text-center w-3/4"
                style={{ minWidth: 180 }}
                disabled={loading}
              >
                {loading ? 'Signing Up...' : 'Sign Up'}
              </button>
            </div>
          </form>
          <div className="text-center mt-6 text-gray-700 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 font-semibold hover:underline">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
  }

export default Signup;
