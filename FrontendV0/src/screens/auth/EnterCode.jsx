import React from 'react';
import { Link } from 'react-router';
import Banner from '../../assets/banner.svg';
import Logo from '../../assets/logo.svg';


function EnterCode() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add code verification logic here
    // Navigation handled by Link below
  };

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
      {/* Right Panel */}
      <div className="w-1/2 flex flex-col items-center justify-center ml-30">
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
          Enter Code
        </h2>
        <div className="flex flex-col items-center w-full max-w-md">
          <p className="text-gray-700 text-center text-sm mb-4">
            Enter the code that you've received in your email<br />
            <span className="font-semibold text-blue-500">ma******@gmail.com</span>
          </p>
          <form className="space-y-5 w-full" onSubmit={handleSubmit}>
            <div className="mb-10">
              <label className="block text-gray-700 mt-4">Enter Code</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter code"
              />
            </div>
            <Link
              to="/reset-password"
              className="w-full block"
            >
              <button
                type="submit"
                className="w-full bg-[#1cb0f6] hover:bg-blue-600 text-white py-2 rounded font-semibold transition"
              >
                Verify
              </button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EnterCode;
