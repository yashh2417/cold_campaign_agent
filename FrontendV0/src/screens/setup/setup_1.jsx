


import React, { useState } from 'react';
import Setup_phone from '../../assets/setup_phone.svg';
import Setup_sparkle from '../../assets/setup_sparkle.svg';
import { useNavigate, Link } from 'react-router';


// Accept sidebarCollapsed as a prop for header animation
function Setup1({ sidebarCollapsed = false }) {
  const [enabled, setEnabled] = useState(true);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#fcfbfd] flex flex-col">
      {/* Fixed animated header like call history/config screen */}
      <header className="fixed top-0 left-0 w-full z-30 bg-transparent">
        <div
          className={`absolute top-0 ${sidebarCollapsed ? 'left-16 w-[calc(100%-4rem)]' : 'left-64 w-[calc(100%-16rem)]'} bg-white px-8 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300`}
          style={{ transitionProperty: 'left, width' }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lead Generation AI</h1>
        </div>
      </header>
      {/* Progress bar and header row below fixed header */}
      <div className="flex items-center justify-between px-8 pt-28">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/config')} className="text-2xl text-gray-500 hover:text-gray-700 mr-2">&#8592;</button>
          <span className="text-lg font-medium text-gray-700">Setup Page</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1 bg-[#d9d9d9] rounded-full relative">
            <div className="absolute left-0 top-0 h-1 bg-[#27ae60] rounded-full" style={{ width: '33%' }}></div>
          </div>
          <span className="text-sm text-gray-500 font-medium">1/3</span>
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-5xl px-4">
          <div className="flex flex-col items-center">
            {/* Sparkle box */}
            <div className="mb-10 w-full flex justify-center">
              <div className="flex items-center gap-3 px-8 py-4 bg-white rounded-xl border border-gray-300 shadow-sm w-[480px] max-w-full">
                {/* Sparkle SVG */}
                <img src={Setup_sparkle} alt="Sparkle" className="w-6 h-6" />
                <span className="text-base font-medium text-gray-700">Let's start setting up your Campaign</span>
              </div>
            </div>
            {/* Phone Calls card */}
            <div className="w-full flex justify-center">
              <div className="flex items-center gap-6 bg-[#fdf4ea] border border-[#f3d7b6] rounded-xl px-8 py-7 shadow-sm w-[600px] max-w-full">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-md">
                    <img src={Setup_phone} alt="Phone Calls" className="w-14 h-14" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-800">Phone Calls</div>
                  <div className="text-sm text-gray-500 mt-1">AI makes voice calls to your contacts</div>
                </div>
                {/* Toggle */}
                <div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => setEnabled(v => !v)}
                      className="sr-only peer"
                    />
                    <div className={`w-10 h-6 rounded-full flex items-center transition-colors duration-200
                      ${enabled ? 'bg-[#00b6ff]' : 'bg-gray-200'}
                    `}>
                      <div className={`h-5 w-5 rounded-full transition-transform duration-200
                        ${enabled ? 'bg-white translate-x-4' : 'bg-gray-300 translate-x-0'}
                      `}></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom right button */}
      <div className="flex justify-end items-center px-12 pb-8">
        <Link to="/config/setup2">
          <div
            className="bg-[#00b6ff] hover:bg-[#009ef7] text-white font-semibold px-8 py-3 rounded-lg shadow transition text-lg cursor-pointer"
          >
            Choose Contacts &rarr;
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Setup1;
