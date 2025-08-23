import React from 'react';
import Illustration  from '../../assets/illustration.svg';
import Logo from '../../assets/logo.svg';

function AuthLayout({ children, title }) {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
      {/* Left Panel */}
      <div className="w-[25%] h-[90%] flex items-center justify-center bg-[#01B0F1] rounded-[2rem] overflow-hidden">
        <div className="w-[90%] h-[90%] flex items-center justify-center">
          <Illustration className="w-full h-full object-contain" />
        </div>
      </div>
      {/* Right Panel */}
      <div className="w-1/2 flex flex-col items-center justify-center ml-30">
        <Logo className="w-36 mb-8" />
        {title && (
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
