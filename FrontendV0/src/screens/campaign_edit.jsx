import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { User, Settings, Trash } from 'lucide-react';
import multiavatar from '@multiavatar/multiavatar/esm';
import API_BASE_URL from '../api'; // Adjust the import path as necessary

function CampaignEdit({ sidebarCollapsed = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('business');
  const [isDisabled, setIsDisabled] = useState(false);

  // Campaign edit form state
  const [form, setForm] = useState({
    business_name: '',
    business_description: '',
    business_website: '',
    campaign_name: '',
    agent_name: '',
    agent_voice: '',
    language: 'en',
    agent_role: '',
    task: '',
    campaign_start_date: '',
    campaign_end_date: '',
    voicemail_message: '',
    call_recording: true,
    voicemail_setting: true,
    interpution_threshold: 130, // hardcoded, not editable
  });
  const [batchId, setBatchId] = useState('');

  // Voice selection state (copied from setup_3.jsx)
  const [voicePopupOpen, setVoicePopupOpen] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  function getVoiceAvatar(name) {
    return multiavatar(name);
  }


  // Fetch voices from Bland AI API on mount (copied from setup_3.jsx)
  useEffect(() => {
    async function fetchVoices() {
      try {
        const BLAND_API_KEY = 'org_13cdb67a9c4a921cbb785561b109227815babf833689b7e39dd555ea64c1a55cabf9c8a0c88fc6578a8469';
        const res = await fetch('https://api.bland.ai/v1/voices', {
          method: 'GET',
          headers: {
            'authorization': BLAND_API_KEY,
          },
        });
        const data = await res.json();
        const filtered = (data.voices || []).filter(v => v.average_rating > 4);
        setVoices(filtered);
        if (filtered.length > 0) setSelectedVoice(filtered[0]);
      } catch (err) {
        setVoices([]);
      }
    }
    fetchVoices();
  }, []);

  // Fetch batch_id and campaign details on mount
  useEffect(() => {
    // Only fetch batchId, do not pre-fill form
    async function fetchCampaign() {
      try {
        const res = await fetch(`${API_BASE_URL}/campaign/active`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (res.ok) {
          const data = await res.json();
          const campaign = (data.data.campaigns && data.data.campaigns[0]) || {};
          setBatchId(campaign.batch_id || '');
        }
      } catch {
        setBatchId('');
      }
    }
    fetchCampaign();
  }, []);

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle Save (edit campaign)
  const handleSave = async () => {
    if (!batchId) {
      alert('No campaign selected.');
      return;
    }
    try {
      // Only send required fields, matching backend schema
      const payload = {
        business_name: form.business_name,
        business_description: form.business_description,
        business_website: form.business_website,
        campaign_name: form.campaign_name,
        agent_name: form.agent_name,
        agent_voice: form.agent_voice,
        language: form.language,
        agent_role: form.agent_role,
        task: form.task,
        campaign_start_date: form.campaign_start_date,
        campaign_end_date: form.campaign_end_date,
        voicemail_message: form.voicemail_message,
        call_recording: form.call_recording,
        voicemail_setting: form.voicemail_setting,
      };
      const res = await fetch(`${API_BASE_URL}/campaign/${batchId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert('Campaign updated successfully');
        navigate(-1);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update campaign');
      }
    } catch {
      alert('Network error');
    }
  };

  return (
    <>
      {/* Header reused from configScreen for consistency */}
      <header className="fixed top-0 left-0 w-full z-30 bg-transparent">
        <div
          className={`absolute top-0 ${sidebarCollapsed ? 'left-16 w-[calc(100%-4rem)]' : 'left-64 w-[calc(100%-16rem)]'} bg-white px-8 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300`}
          style={{ transitionProperty: 'left, width' }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lead Generation AI</h1>
        </div>
      </header>
      <div className="min-h-screen bg-[#fcfbfd] p-0 sm:p-8 pt-28">
  <div className="max-w-6xl mx-auto pt-8 pb-2">
        <div className="flex items-center gap-2 mb-4">
          <button
            className="text-2xl text-gray-500 hover:text-gray-700 mr-2"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            &#8592;
          </button>
          <span className="text-xl font-medium text-gray-800">Edit Agent and Business Information</span>
          <div className="flex-1" />
        </div>
        {/* Card */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 sm:p-8 mt-2">
          {/* Toggle Tabs - pill style, full width, divider, bold for active, subtle for inactive */}
          <div className="flex items-center w-full mb-8">
            <div className="flex w-full bg-[#f7f7fa] rounded-xl overflow-hidden border border-[#ededed]">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2 transition-all duration-200 font-semibold text-base
                  ${activeTab === 'business' ? 'bg-white text-black shadow-sm' : 'text-gray-700'}`}
                onClick={() => setActiveTab('business')}
                style={{ fontWeight: activeTab === 'business' ? 700 : 500 }}
              >
                <User size={20} className={activeTab === 'business' ? 'text-black' : 'text-gray-500'} />
                About Your Business
              </button>
              <div className="w-px bg-[#e5e7eb] h-8 self-center" />
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2 transition-all duration-200 font-semibold text-base
                  ${activeTab === 'agent' ? 'bg-white text-black shadow-sm' : 'text-gray-700'}`}
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
                <input type="text" name="business_name" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]" placeholder="Write your Business Name" value={form.business_name} onChange={handleFormChange} />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Tell About your business</label>
                <textarea name="business_description" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7] min-h-[64px]" placeholder="About your business" value={form.business_description} onChange={handleFormChange} />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Business Website</label>
                <input type="text" name="business_website" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]" placeholder="https://domainexpertsgroup.com/" value={form.business_website} onChange={handleFormChange} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Agent Name</label>
                  <input type="text" name="agent_name" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]" value={form.agent_name} onChange={handleFormChange} />
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
                              onClick={() => { setSelectedVoice(voice); setForm(f => ({ ...f, agent_voice: voice.name })); }}
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
                  <select
                    name="language"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
                    value={form.language}
                    onChange={handleFormChange}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Agent’s Role</label>
                  <input type="text" name="agent_role" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]" value={form.agent_role} onChange={handleFormChange} />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Assign a task to your Agent</label>
                  <textarea name="task" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7] min-h-[48px]" value={form.task} onChange={handleFormChange} />
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input type="text" name="campaign_name" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]" value={form.campaign_name} onChange={handleFormChange} />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Campaign Start Date<span className="text-red-500">*</span></label>
                  <input type="datetime-local" name="campaign_start_date" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]" value={form.campaign_start_date} onChange={handleFormChange} />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Campaign End Date<span className="text-red-500">*</span></label>
                  <input type="datetime-local" name="campaign_end_date" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7]" value={form.campaign_end_date} onChange={handleFormChange} />
                </div>
                <div className="flex items-center gap-6 mt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="call_recording" className="accent-[#00b6ff] w-5 h-5" checked={form.call_recording} onChange={handleFormChange} />
                    <span className="text-base font-medium text-gray-700">Call Recording</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="voicemail_setting" className="accent-[#00b6ff] w-5 h-5" checked={form.voicemail_setting} onChange={handleFormChange} />
                    <span className="text-base font-medium text-gray-700">Voicemail settings</span>
                  </label>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">Voicemail Message</label>
                  <textarea name="voicemail_message" className="w-full rounded-lg border border-gray-300 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#009ef7] min-h-[64px]" value={form.voicemail_message} onChange={handleFormChange} />
                </div>
                {/* Interpution Threshold is hardcoded and not editable by user */}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-base font-medium text-gray-700">Test your Agent</span>
                  <button className="flex items-center gap-2 bg-[#00b6ff] hover:bg-[#009ef7] text-white font-semibold px-6 py-2 rounded-lg shadow transition text-base">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#fff"/><path d="M7.5 10a2.5 2.5 0 1 0 5 0v-2a2.5 2.5 0 1 0-5 0v2Zm7.5 0c0 2.485-2.015 4.5-4.5 4.5S6 12.485 6 10" stroke="#00b6ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Make Test call
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Advanced Options - Disable Campaign */}
        <div className="bg-[#fffafd] border border-[#ffd6db] rounded-2xl p-4 sm:p-6 mt-6 relative">
          <div className="flex items-center mb-2">
            <Trash size={20} className="text-[#d32f2f] mr-2" />
            <span className="text-base sm:text-lg font-bold text-gray-900">Advanced Options</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="block text-sm sm:text-base font-semibold text-gray-900 mb-1">Disable This Campaign</span>
              <span className="block text-xs sm:text-sm text-gray-700 mb-2">Disabling this campaign will halt its operations without deleting any associated data or settings. Make sure to review any important information before proceeding.</span>
            </div>
            <button
              className={`border border-[#d32f2f] text-[#d32f2f] px-5 py-1.5 rounded-md font-semibold text-sm sm:text-base transition-colors duration-200 mt-2 sm:mt-0 ${isDisabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-transparent hover:bg-[#fff0f0]'}`}
              onClick={async () => {
                if (!batchId) return;
                setIsDisabled(true);
                try {
                  const res = await fetch(`${API_BASE_URL}/campaign/${batchId}/stop`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                      'ngrok-skip-browser-warning': 'true',
                    },
                  });
                  if (res.ok) {
                    alert('Campaign disabled successfully');
                    navigate('/config');
                  } else {
                    const data = await res.json();
                    alert(data.message || 'Failed to disable campaign');
                  }
                } catch {
                  alert('Network error');
                }
              }}
              disabled={isDisabled}
              style={{ minWidth: 90 }}
            >
              Disable
            </button>
          </div>
        </div>
        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <button className="bg-[#00b6ff] hover:bg-[#009ef7] text-white font-semibold px-10 py-3 rounded-lg shadow transition text-lg" onClick={handleSave}>Save</button>
        </div>
      </div>
      </div>
    </>
  );
}

export default CampaignEdit;
