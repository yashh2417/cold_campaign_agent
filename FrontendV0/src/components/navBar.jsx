import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, ChevronDown, LogOut } from 'lucide-react';

// images
import nav_image1 from '../assets/nav_image1.svg';
import nav_image2 from '../assets/nav_image2.svg';
import nav_image3 from '../assets/nav_image3.svg';
import logo_open from '../assets/logo_open.svg';
import nav_image4 from '../assets/nav_image4.svg';
import logo from '../assets/logo.svg';

const NavigationSidebar = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLeadGenExpanded, setIsLeadGenExpanded] = useState(true);
  const [activeNav, setActiveNav] = useState('leadgen'); // Track active nav
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleLeadGen = () => {
    setIsLeadGenExpanded(!isLeadGenExpanded);
  };

  return (
  <div className="flex min-h-screen bg-[#012060]">
      {/* Sidebar */}
  <div className={`bg-[#012060] text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col min-h-screen`}>
        {/* Header */}
        <div className="p-4 flex items-center justify-center border-b border-[#012060] relative">
          <img
            src={isCollapsed ? logo : logo_open}
            alt="Logo"
            className={isCollapsed ? "w-30 h-30 transition-all duration-300" : "w-32 h-32 transition-all duration-300"}
          />
          <button
            onClick={toggleSidebar}
            className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white text-[#012060] shadow-xl rounded-full w-8 h-8 flex items-center justify-center transition-colors z-20"
            style={{ boxShadow: '0 2px 12px 4px rgba(1,32,96,0.10)', backdropFilter: 'blur(2px)' }}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 pt-4">
          {isCollapsed ? (
            <div className="space-y-6 px-2 flex flex-col items-center">
              {/* Lead Generation Tool icon with arrow */}
              <Link to={""} /* TODO: Add route */ className="w-full">
                <div
                  className={`p-3 rounded-lg cursor-pointer group relative flex flex-col items-center transition-colors ${
                    activeNav === 'leadgen'
                      ? 'bg-white/30'
                      : 'hover:bg-white/20 active:bg-white/30'
                  }`}
                  onClick={() => setActiveNav('leadgen')}
                >
                  <img src={nav_image1} alt="Lead Gen" className="w-6 h-6 mb-1" />
                  <ChevronDown size={16} className="text-white" />
                  <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-[#012060] text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    Lead Generation Tool
                  </div>
                </div>
              </Link>
              {/* Configuration icon */}
              <Link to={"/config"} /* TODO: Add route */ className="w-full">
                <div
                  className={`p-3 rounded-lg cursor-pointer group relative flex justify-center transition-colors ${
                    activeNav === 'config'
                      ? 'bg-white/30'
                      : 'hover:bg-white/20 active:bg-white/30'
                  }`}
                  onClick={() => setActiveNav('config')}
                >
                  <img src={nav_image2} alt="Configurations" className="w-6 h-6" />
                  <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-[#012060] text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    Configurations
                  </div>
                </div>
              </Link>
              <Link to={"/contactDirectory"} /* TODO: Add route */ className="w-full">
                <div
                  className={`p-3 rounded-lg cursor-pointer group relative flex justify-center transition-colors ${
                    activeNav === 'contacts'
                      ? 'bg-white/30'
                      : 'hover:bg-white/20 active:bg-white/30'
                  }`}
                  onClick={() => setActiveNav('contacts')}
                >
                  <img src={nav_image3} alt="Nav 2" className="w-6 h-6" />
                  <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-[#012060] text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    Contacts
                  </div>
                </div>
              </Link>
              <Link to={"/callHistory"} /* TODO: Add route */ className="w-full">
                <div
                  className={`p-3 rounded-lg cursor-pointer group relative flex justify-center transition-colors ${
                    activeNav === 'history'
                      ? 'bg-white/30'
                      : 'hover:bg-white/20 active:bg-white/30'
                  }`}
                  onClick={() => setActiveNav('history')}
                >
                  <img src={nav_image4} alt="Nav 3" className="w-6 h-6" />
                  <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-[#012060] text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    Call History
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="space-y-6 px-4">
              <div>
                <button
                  onClick={toggleLeadGen}
                  className="w-full flex items-center justify-between p-3 hover:bg-[#012060] rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <img src={nav_image1} alt="Lead Gen" className="w-6 h-6" />
                    <span className="text-sm font-medium">Lead Generation Tool</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`transform transition-transform ${isLeadGenExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {isLeadGenExpanded && (
                  <div className="ml-9 mt-2 space-y-1">
                    <Link to="/config" className="w-full">
                      <div
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          activeNav === 'config' ? 'bg-white' : 'bg-[#012060] hover:bg-white/10 active:bg-white/20'
                        }`}
                        onClick={() => setActiveNav('config')}
                      >
                        <img src={nav_image2} alt="Configurations" className="w-5 h-5" style={activeNav === 'config' ? { filter: 'brightness(0) saturate(100%) invert(0)' } : { }} />
                        <span className={`text-sm ${activeNav === 'config' ? 'text-black' : 'text-white'}`}>Configurations</span>
                      </div>
                    </Link>
                    <Link to={"/contactDirectory"} /* TODO: Add route */ className="w-full">
                      <div
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          activeNav === 'contacts' ? 'bg-white' : 'bg-[#012060] hover:bg-white/10 active:bg-white/20'
                        }`}
                        onClick={() => setActiveNav('contacts')}
                      >
                        <img src={nav_image3} alt="Contacts" className="w-5 h-5" style={activeNav === 'contacts' ? { filter: 'brightness(0) saturate(100%) invert(0)' } : {}} />
                        <span className={`text-sm ${activeNav === 'contacts' ? 'text-black' : 'text-white'}`}>Contacts</span>
                      </div>
                    </Link>
                    <Link to={"/callHistory"} /* TODO: Add route */ className="w-full">
                      <div
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          activeNav === 'history' ? 'bg-white' : 'bg-[#012060] hover:bg-white/10 active:bg-white/20'
                        }`}
                        onClick={() => setActiveNav('history')}
                      >
                        <img src={nav_image4} alt="Call History" className="w-5 h-5" style={activeNav === 'history' ? { filter: 'brightness(0) saturate(100%) invert(0)' } : {}} />
                        <span className={`text-sm ${activeNav === 'history' ? 'text-black' : 'text-white'}`}>Call History</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
        {/* Logout Button at Bottom */}
        <div className="w-full px-2 pb-4 mt-auto flex flex-col items-center">
          {isCollapsed ? (
            <button
              className="p-3 rounded-lg cursor-pointer group relative flex flex-col items-center transition-colors hover:bg-white/20 active:bg-white/30"
              onClick={() => navigate('/')}
              aria-label="Logout"
            >
              <LogOut size={24} className="text-white" />
              <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-[#012060] text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                Logout
              </div>
            </button>
          ) : (
            <button
              className="w-full flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/10 active:bg-white/20"
              onClick={() => navigate('/')}
              aria-label="Logout"
            >
              <LogOut size={22} className="text-white" />
              <span className="text-sm font-medium text-white">Logout</span>
            </button>
          )}
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 bg-white">
        {React.isValidElement(children)
          ? React.cloneElement(children, { sidebarCollapsed: isCollapsed })
          : children}
      </div>
    </div>
  );
};

export default NavigationSidebar;