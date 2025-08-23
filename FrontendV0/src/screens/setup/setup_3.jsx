import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { User, Settings, PlayCircle, PauseCircle } from 'lucide-react';
import SuccessMsg from '../../assets/success_msg.svg';
import justinAudio from './voices/justin.mp3';
import multiavatar from '@multiavatar/multiavatar/esm';
import API_BASE_URL from '../../api';

// Dynamically fetched voices from Bland AI
const BLAND_API_KEY = 'org_13cdb67a9c4a921cbb785561b109227815babf833689b7e39dd555ea64c1a55cabf9c8a0c88fc6578a8469';

function getVoiceAvatar(name) {
  return multiavatar(name);
}


function Setup3({ sidebarCollapsed = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('business');
  const [showSuccess, setShowSuccess] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [voicePopupOpen, setVoicePopupOpen] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(null);
  const audioRefs = useRef([]);
  const [campaignStart, setCampaignStart] = useState('');
  const [campaignEnd, setCampaignEnd] = useState('');
  const [testCallLoading, setTestCallLoading] = useState(false);

  // Handle Test Call
  const handleTestCall = async () => {
    // Validate required fields (same as campaign creation)
    if (!businessName.trim() || !businessDescription.trim() || !businessWebsite.trim() || !agentRole.trim() || !task.trim() || !language.trim() || !voicemailMessage.trim() || !campaignStart || !campaignEnd || !selectedVoice || !selectedVoice.name) {
      alert('Please fill in all required fields.');
      return;
    }
    // Validate date format
    const startISO = toUTCISOString(campaignStart);
    const endISO = toUTCISOString(campaignEnd);
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(startISO) || !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(endISO)) {
      alert('Please enter valid start and end dates.');
      return;
    }
    setTestCallLoading(true);
    const payload = {
      form_data: {
        business_name: businessName.trim(),
        business_description: businessDescription.trim(),
        business_website: businessWebsite.trim(),
        campaign_name: campaignName.trim() || 'Sales & Cold Outreach Agents',
        agent_name: agentName.trim() || 'Maya',
        agent_voice: selectedVoice.name,
        language: language.trim(),
        agent_role: agentRole.trim(),
        task: task.trim(),
        campaign_start_date: startISO,
        campaign_end_date: endISO,
        voicemail_message: voicemailMessage.trim(),
        call_recording: !!callRecording,
        voicemail_setting: !!voicemailSetting,
      }
    };
    const test_call_payload = {
      business_name: businessName.trim(),
      business_description: businessDescription.trim(),
      business_website: businessWebsite.trim(),
      campaign_name: campaignName.trim() || 'Sales & Cold Outreach Agents',
      agent_name: agentName.trim() || 'Maya',
      agent_voice: selectedVoice.name,
      language: language.trim(),
      agent_role: agentRole.trim(),
      task: task.trim(),
      voicemail_message: voicemailMessage.trim(),
      call_recording: !!callRecording,
      voicemail_setting: !!voicemailSetting,
    }
    try {
      const res = await fetch(`${API_BASE_URL}/call/test-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(test_call_payload),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Test call initiated successfully!');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to initiate test call');
      }
    } catch {
      alert('Network error');
    }
    setTestCallLoading(false);
  };

  // Form state for business and agent info
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentRole, setAgentRole] = useState('');
  const [task, setTask] = useState('');
  const [language, setLanguage] = useState('en');
  const [voicemailMessage, setVoicemailMessage] = useState('Hi ((Customer Name)), this is Maya from ((Company name))! Just wanted to follow up on your interest. Feel free to call back on ((phone number)) or ((company website)).');
  const [callRecording, setCallRecording] = useState(true);
  const [voicemailSetting, setVoicemailSetting] = useState(true);

  // Fetch voices from Bland AI API on mount
  React.useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await fetch('https://api.bland.ai/v1/voices', {
          method: 'GET',
          headers: {
            'authorization': BLAND_API_KEY,
          },
        });
        const data = await res.json();
        // Only use voices with average_rating > 3
        const filtered = (data.voices || []).filter(v => v.average_rating > 4);
        setVoices(filtered);
        if (filtered.length > 0) setSelectedVoice(filtered[0]);
      } catch (err) {
        setVoices([]);
      }
    }
    fetchVoices();
  }, []);

  // Convert local datetime to UTC ISO string
  const toUTCISOString = (localValue) => {
    if (!localValue) return '';
    const date = new Date(localValue);
    return date.toISOString();
  };

  // Success modal close after 2.5 seconds and API call
  const handleCreateCampaign = async () => {
    // Get selected contacts from localStorage
    let contacts = [];
    try {
      const stored = localStorage.getItem('selected_contact_ids');
      contacts = stored ? JSON.parse(stored) : [];
    } catch {
      contacts = [];
    }

    // Validate required fields
    if (!businessName.trim() || !businessDescription.trim() || !businessWebsite.trim() || !agentRole.trim() || !task.trim() || !language.trim() || !voicemailMessage.trim() || !campaignStart || !campaignEnd || !selectedVoice || !selectedVoice.name) {
      alert('Please fill in all required fields.');
      return;
    }
    if (!Array.isArray(contacts) || contacts.length === 0 || !contacts.every(id => typeof id === 'number')) {
      alert('Please select at least one contact.');
      return;
    }
    // Validate date format
    const startISO = toUTCISOString(campaignStart);
    const endISO = toUTCISOString(campaignEnd);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(startISO) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(endISO)) {
      alert('Please enter valid start and end dates.');
      return;
    }
    // Enforce 30-35 minute buffer for campaign start
    const now = new Date();
    const startDate = new Date(campaignStart);
    const diffMinutes = (startDate - now) / (1000 * 60);
    if (diffMinutes < 5) {
      alert('Please schedule your campaign at least 30-35 minutes in the future to allow for proper setup.');
      return;
    }

    // Build payload
    const payload = {
      form_data: {
        business_name: businessName.trim(),
        business_description: businessDescription.trim(),
        business_website: businessWebsite.trim(),
        campaign_name: campaignName.trim() || 'Sales & Cold Outreach Agents',
        agent_name: agentName.trim() || 'Maya',
        agent_voice: selectedVoice.name,
        language: language.trim(),
        agent_role: agentRole.trim(),
        task: task.trim(),
        campaign_start_date: startISO,
        campaign_end_date: endISO,
        voicemail_message: voicemailMessage.trim(),
        call_recording: !!callRecording,
        voicemail_setting: !!voicemailSetting,
      },
      contacts,
    };
    console.log('Campaign creation payload:', payload);
    try {
      const res = await fetch(`${API_BASE_URL}/campaign/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowSuccess(true);
        if (timeoutId) clearTimeout(timeoutId);
        const id = setTimeout(() => {
          setShowSuccess(false);
          navigate('/config');
        }, 2500);
        setTimeoutId(id);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to create campaign');
      }
    } catch {
      alert('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbfd] p-0 sm:p-8 relative">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 w-full z-30 bg-transparent">
        <div
          className={`absolute top-0 ${sidebarCollapsed ? 'left-16 w-[calc(100%-4rem)]' : 'left-64 w-[calc(100%-16rem)]'} bg-white px-8 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300`}
          style={{ transitionProperty: 'left, width' }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lead Generation AI</h1>
        </div>
      </header>
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg px-10 py-10 flex flex-col items-center w-[90vw] max-w-2xl border border-gray-200">
            <div className="mb-6 flex flex-col items-center justify-center">
              <span className="relative flex h-24 w-24 items-center justify-center">
                {/* Bubble animation */}
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-200 opacity-60 animate-ping"></span>
                <span className="absolute inline-flex h-20 w-20 rounded-full bg-green-300 opacity-80 animate-ping delay-150"></span>
                <span className="relative inline-flex items-center justify-center h-24 w-24">
                  <img src={SuccessMsg} alt="Success" className="w-24 h-24 object-contain mx-auto z-10" />
                </span>
              </span>
            </div>
            <div className="text-center">
              <span className="block text-lg sm:text-xl font-medium text-gray-900">{campaignName} has been successfully created</span>
            </div>
          </div>
        </div>
      )}
  <div className="max-w-6xl mx-auto pt-8 pb-2" style={{ paddingTop: '7rem' }}>
        <div className="flex items-center gap-2 mb-4">
          <button
            className="text-2xl text-gray-500 hover:text-gray-700 mr-2"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            &#8592;
          </button>
          <span className="text-xl font-medium text-gray-800">Agent and Business Information</span>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-24 h-1 bg-[#d9d9d9] rounded-full relative">
              <div className="absolute left-0 top-0 h-1 bg-[#27ae60] rounded-full" style={{ width: '100%' }}></div>
            </div>
            <span className="text-sm text-gray-500 font-medium">3/3</span>
          </div>
        </div>
        {/* Card */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 sm:p-8 mt-2">
          {/* Toggle Tabs - pill style, full width, divider, bold for active, subtle for inactive */}
          <div className="flex items-center w-full mb-8">
            <div className="flex w-full bg-[#f7f7fa] rounded-xl overflow-hidden border border-[#ededed]">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2 transition-all duration-200 font-semibold text-base
                  ${activeTab === 'business' ? 'bg-white text-black shadow-sm' : 'text-gray-700'}
                `}
                onClick={() => setActiveTab('business')}
                style={{ fontWeight: activeTab === 'business' ? 700 : 500 }}
              >
                <User size={20} className={activeTab === 'business' ? 'text-black' : 'text-gray-500'} />
                About Your Business
              </button>
              <div className="w-px bg-[#e5e7eb] h-8 self-center" />
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2 transition-all duration-200 font-semibold text-base
                  ${activeTab === 'agent' ? 'bg-white text-black shadow-sm' : 'text-gray-700'}
                `}
                onClick={() => setActiveTab('agent')}
                style={{ fontWeight: activeTab === 'agent' ? 700 : 500 }}
              >
                <Settings size={20} className={activeTab === 'agent' ? 'text-black' : 'text-gray-500'} />
                Agent Settings
              </button>
            </div>
          </div>
          {/* Forms */}
          {activeTab === 'business' ? (
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Your Business Name</label>
                <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]" placeholder="Write your Business Name" value={businessName} onChange={e => setBusinessName(e.target.value)} />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Tell About your business</label>
                <textarea className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7] min-h-[64px]" placeholder="About your business" value={businessDescription} onChange={e => setBusinessDescription(e.target.value)} />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Business Website</label>
                <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]" placeholder="https://domainexpertsgroup.com/" value={businessWebsite} onChange={e => setBusinessWebsite(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Agent Name</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
                    placeholder="Maya"
                    value={agentName}
                    onChange={e => setAgentName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Agent Voice</label>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7] flex items-center gap-2 justify-between"
                    onClick={() => setVoicePopupOpen(true)}
                    disabled={voices.length === 0}
                  >
                    {selectedVoice ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="w-7 h-7 rounded-full border bg-white flex items-center justify-center overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: getVoiceAvatar(selectedVoice.name) }}
                          style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }}
                        />
                        {selectedVoice.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">Loading voices...</span>
                    )}
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{selectedVoice && selectedVoice.description}</span>
                  </button>
                  {/* Voice Selection Popup */}
                  {voicePopupOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-semibold text-gray-800">Choose Voice</span>
                          <button onClick={() => setVoicePopupOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl font-bold">&times;</button>
                        </div>
                        <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                          {voices.map((voice, idx) => (
                            <div key={voice.id} className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${selectedVoice && selectedVoice.id === voice.id ? 'bg-blue-50 border border-blue-400' : 'hover:bg-gray-50'}`} style={{ border: selectedVoice && selectedVoice.id === voice.id ? '1.5px solid #1cb0f6' : '1.5px solid transparent', cursor: 'pointer' }}
                              onClick={() => { setSelectedVoice(voice); }}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="w-7 h-7 rounded-full border bg-white flex items-center justify-center overflow-hidden"
                                  dangerouslySetInnerHTML={{ __html: getVoiceAvatar(voice.name) }}
                                  style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }}
                                />
                                <span className="font-medium text-gray-800">{voice.name}</span>
                                <span className="text-xs text-gray-500 ml-2">{voice.description}</span>
                              </div>
                              {selectedVoice && selectedVoice.id === voice.id ? (
                                <span className="ml-4 px-3 py-1 rounded bg-blue-500 text-white">Selected</span>
                              ) : (
                                <span className="ml-4 px-3 py-1 rounded bg-gray-100 text-gray-700">Select</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end mt-4">
                          <button className="bg-[#009ef7] text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-[#007fd1]" onClick={() => setVoicePopupOpen(false)}>
                            Confirm Selection
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Select Default Language</label>
                  <select className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Agent’s Role</label>
                  <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]" placeholder="Loren Ipsum" value={agentRole} onChange={e => setAgentRole(e.target.value)} />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Assign a task to your Agent</label>
                  <textarea className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7] min-h-[48px]" placeholder="" value={task} onChange={e => setTask(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
                    placeholder="Sales & Cold Outreach Agents"
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Campaign Start Date & Time<span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
                    value={campaignStart}
                    onChange={e => setCampaignStart(e.target.value)}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    UTC: {campaignStart ? toUTCISOString(campaignStart) : '--'}
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Campaign End Date & Time<span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
                    value={campaignEnd}
                    onChange={e => setCampaignEnd(e.target.value)}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    UTC: {campaignEnd ? toUTCISOString(campaignEnd) : '--'}
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[#00b6ff] w-5 h-5" checked={callRecording} onChange={e => setCallRecording(e.target.checked)} />
                    <span className="text-base font-medium text-gray-700">Call Recording</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[#00b6ff] w-5 h-5" checked={voicemailSetting} onChange={e => setVoicemailSetting(e.target.checked)} />
                    <span className="text-base font-medium text-gray-700">Voicemail settings</span>
                  </label>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Voicemail Message</label>
                  <textarea className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7] min-h-[64px]" defaultValue={
                    voicemailMessage
                  } onChange={e => setVoicemailMessage(e.target.value)} />
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-base font-medium text-gray-700">Test your Agent</span>
                  <button
                    className={`flex items-center gap-2 bg-[#00b6ff] hover:bg-[#009ef7] text-white font-semibold px-6 py-2 rounded-lg shadow transition text-base ${testCallLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={handleTestCall}
                    disabled={testCallLoading}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#fff"/><path d="M7.5 10a2.5 2.5 0 1 0 5 0v-2a2.5 2.5 0 1 0-5 0v2Zm7.5 0c0 2.485-2.015 4.5-4.5 4.5S6 12.485 6 10" stroke="#00b6ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {testCallLoading ? 'Testing...' : 'Make Test call'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Create Campaign Button - only show in Agent Settings tab */}
        {activeTab === 'agent' && (
          <div className="flex justify-end mt-8">
            <button
              className="bg-[#27ae60] hover:bg-[#219150] text-white font-semibold px-10 py-3 rounded-lg shadow transition text-lg"
              onClick={handleCreateCampaign}
              disabled={showSuccess}
            >
              Create Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Setup3;
