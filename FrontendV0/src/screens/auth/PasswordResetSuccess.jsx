import React from 'react';
import { Link } from 'react-router';
import Illustration from '../../assets/illustration2.svg';
import Logo from '../../assets/logo.svg';

function PasswordResetSuccess() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white-100">
      {/* Left Panel */}
      <div className="w-[25%] h-[90%] flex items-center justify-center bg-white rounded-[2rem] overflow-hidden">
        <img src={Illustration} alt="Illustration" className="w-full h-full object-contain" />
      </div>
      {/* Right Panel */}
      <div className="w-1/2 flex flex-col items-center justify-center ml-30">
        <img src={Logo} alt="Logo" className="w-36 mb-8" />
        <div className="flex flex-col items-center w-full max-w-md">
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
            Password Reset Successful!
          </h2>
          <p
            className="mb-4 text-center"
            style={{
              fontFamily: 'Segoe UI',
              fontWeight: 400,
              fontStyle: 'normal',
              fontSize: '15px',
              lineHeight: '100%',
              letterSpacing: '0%',
              color: '#1a202c',
            }}
          >
            Now you can use your new password to login to your account 🙌🏻
          </p>
          <Link to="/login" className="w-full block mt-10">
            <button
              className="w-full bg-[#1cb0f6] hover:bg-blue-600 text-white py-2 rounded font-semibold transition"
            >
              Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetSuccess;
