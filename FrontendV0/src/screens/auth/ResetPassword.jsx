import React from 'react';
import { Link } from 'react-router';
import Logo from '../../assets/logo.svg';
import Illustration from '../../assets/illustration2.svg';


function ResetPassword() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add password reset logic here
    // Navigation handled by Link below
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white-100 gap-44">
      {/* Left Panel */}
      <div className="w-[25%] h-[90%] flex items-center justify-center bg-white rounded-[2rem] overflow-hidden">
        <img src={Illustration} alt="Illustration" className="w-full h-full object-contain" />
      </div>
      {/* Right Panel */}
      <div className="w-[30%] flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow-lg">
        <img src={Logo} alt="Logo" className="w-36 mb-8" />
        <h2
          className="text-2xl font-semibold text-gray-800 mb-6"
          style={{
            fontFamily: 'Segoe UI',
            fontWeight: 400,
            fontStyle: 'normal',
            fontSize: '28px',
            lineHeight: '100%',
            letterSpacing: '0%',
            color: '#1a202c',
          }}
        >
          Reset Your Password
        </h2>
        <form className="w-full max-w-md" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter new password"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Confirm new password"
            />
          </div>
          <Link to="/password-reset-success" className="w-full block mt-12">
            <button
              type="submit"
              className="w-full bg-[#1cb0f6] hover:bg-blue-600 text-white py-2 rounded font-semibold transition"
            >
              Reset Password
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
