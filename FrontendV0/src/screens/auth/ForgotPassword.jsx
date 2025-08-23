import React from 'react';
import { Link } from 'react-router';
import Forgot from '../../assets/forgot.svg';
import Logo from '../../assets/logo.svg';
import banner from '../../assets/banner.svg';


function ForgotPassword() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add your API call or logic for password reset email here
    // Navigation handled by Link below
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white-100">
      {/* Left Panel */}
      <div
        className="w-[33%] h-[90%] flex items-center justify-center rounded-[2rem] overflow-hidden"
        style={{
          backgroundImage: `url(${banner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
        }}
      >
        {/* Illustration on top of background */}
        <img src={Forgot} alt="Forgot Illustration" className="w-3/4 h-3/4" style={{ objectFit: 'fill', zIndex: 2, position: 'relative' }} />
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
          Forgot Password?
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
          Enter user email and stored password will be going to <br />
          send on the user email
        </p>
        <form className="w-full max-w-md space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-gray-700 mb-1">
              Enter Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Link to="/enter-code" className="w-full block">
              <button
                type="submit"
                className="mt-10 w-full bg-[#1cb0f6] hover:bg-blue-600 text-white py-2 rounded font-semibold transition"
              >
                Send
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
