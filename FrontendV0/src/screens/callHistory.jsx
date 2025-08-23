import React, { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronRight, PhoneOutgoing } from 'lucide-react';
import API_BASE_URL from '../api'; // Adjust import based on your project structure

function parseDate(dateStr) {
  // Parse date string as DD/MM/YY, HH:MMAM/PM
  const [date, time] = dateStr.split(', ');
  const [day, month, year] = date.split('/').map(Number);
  let [hms, ampm] = time.match(/([\d:]+)(AM|PM)/i).slice(1, 3);
  let [hour, minute] = hms.split(':').map(Number);
  if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
  return new Date(2000 + year, month - 1, day, hour, minute);
}

// Helper function to parse duration strings to seconds
const parseDurationToSeconds = (duration) => {
  if (!duration || duration === '-' || typeof duration !== 'string') return 0;

  let totalSeconds = 0;

  // Match formats like "30 mins", "2m 15s", "30m 0s"
  const minMatch = duration.match(/(\d+)\s*m(in)?s?/i);
  const secMatch = duration.match(/(\d+)\s*s(ec)?s?/i);

  if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60;
  if (secMatch) totalSeconds += parseInt(secMatch[1], 10);

  return totalSeconds;
};

// Compute average talk time in mm:ss format
const getAverageTalkTime = (calls) => {
  const answeredCalls = calls.filter(c => c.answer && c.duration && c.duration !== '-');
  if (answeredCalls.length === 0) return "0m 0s";

  const totalSeconds = answeredCalls.reduce((sum, c) => sum + parseDurationToSeconds(c.duration), 0);
  const avgSeconds = Math.round(totalSeconds / answeredCalls.length);

  const mins = Math.floor(avgSeconds / 60);
  const secs = avgSeconds % 60;

  return `${mins}m ${secs}s`;
};



function CallHistory({ sidebarCollapsed }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignIdx, setSelectedCampaignIdx] = useState(0);
  const [groupedData, setGroupedData] = useState([]);
  const [activeMap, setActiveMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch campaigns on mount and when page is visible
  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
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
          const campaignsList = data.data.campaigns || [];
          setCampaigns(campaignsList);
          // Only set selectedCampaignIdx to 0 if campaigns are loaded and none is selected
          if (campaignsList.length > 0 && selectedCampaignIdx === null) {
            setSelectedCampaignIdx(0);
          }
        } else {
          setCampaigns([]);
        }
      } catch {
        setCampaigns([]);
      }
      setLoading(false);
    }
    fetchCampaigns();
    // Listen for page visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchCampaigns();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Fetch call history when campaign changes
  useEffect(() => {
    async function fetchCallHistory() {
      if (!campaigns.length) return;
      setLoading(true);
      const campaign_thread_id = campaigns[selectedCampaignIdx]?.campaign_thread_id;
      if (!campaign_thread_id) return;
      try {
          const res = await fetch(`${API_BASE_URL}/call/call-history?campaign_thread_id=${campaign_thread_id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Accept': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          });
        if (res.ok) {
          const data = await res.json();
          // Map API response to groupedData format
          const contacts = (data.data.call_history || []).map(contact => ({
            name: contact.contact_name,
            history: (contact.calls || []).sort((a, b) => parseDate(b.call_date_time) - parseDate(a.call_date_time)).map(call => ({
              phone: call.call_type,
              type: call.call_type,
              date: call.call_date_time,
              duration: call.call_duration,
              stage: call.call_stage,
              transcript: !!call.recording_url,
              answer: true, // Assume answered if present
              recording_url: call.recording_url,
            }))
          }));
          setGroupedData(contacts);
          // Set all contacts active by default
          const map = {};
          contacts.forEach(c => { map[c.name] = true; });
          setActiveMap(map);
        } else {
          setGroupedData([]);
        }
      } catch {
        setGroupedData([]);
      }
      setLoading(false);
    }
    fetchCallHistory();
  }, [campaigns, selectedCampaignIdx]);

  const handleToggleActive = (name) => {
    setActiveMap(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Helper for talk time and call stats
  const flatCallData = groupedData.flatMap(c => c.history);
  const totalCalls = flatCallData.length;
  const avgTalkTime = getAverageTalkTime(flatCallData);
  const positiveCalls = flatCallData.filter(c => c.stage === 'Positive').length;
  const negativeCalls = flatCallData.filter(c => c.stage === 'Negative').length;
  const neutralCalls = flatCallData.filter(c => c.stage === 'Neutral').length;

  return (
    <div className="pt-24 p-8 bg-[#f8f9fb] min-h-screen">
      <header className="fixed top-0 left-0 w-full z-30 bg-transparent">
        <div
          className={`absolute top-0 ${sidebarCollapsed ? 'left-16 w-[calc(100%-4rem)]' : 'left-64 w-[calc(100%-16rem)]'} bg-white px-8 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300`}
          style={{ transitionProperty: 'left, width' }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lead Generation AI</h1>
        </div>
      </header>
      {/* Title row */}
      <div className="mb-2">
        <span className="text-lg text-gray-700 flex items-center gap-2">
          <span className="text-xl">&larr;</span> Call History
        </span>
      </div>
      {/* Dropdown and agent row */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <select
          className="bg-gray-200 border border-gray-100 rounded-xl px-6 py-3 min-w-[320px] text-base focus:ring-2 focus:ring-purple-200 focus:outline-none"
          value={selectedCampaignIdx}
          onChange={e => setSelectedCampaignIdx(Number(e.target.value))}
        >
          {campaigns.map((c, idx) => (
            <option key={c.campaign_thread_id} value={idx}>{c.campaign_name}</option>
          ))}
        </select>
        <span className="text-[#b83280] bg-[#f8f0fc] px-6 py-3 rounded-xl font-semibold text-base whitespace-nowrap">
          Agent Name: {campaigns[selectedCampaignIdx]?.agent_name || "-"}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-lg">Loading...</div>
        ) : groupedData.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-lg">No call history found for this campaign.</div>
        ) : (
          <>
            <table className="w-full text-left border-separate" style={{ borderSpacing: 0 }}>
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm">
                  <th className="py-3 px-4 font-medium w-12 text-center align-middle"></th>
                  <th className="py-3 px-4 font-medium w-12 text-center align-middle"></th>
                  <th className="py-3 px-6 font-medium align-middle">Contact Name</th>
                  <th className="py-3 px-6 font-medium align-middle">Call Type</th>
                  <th className="py-3 px-6 font-medium align-middle">Call Date & Time</th>
                  <th className="py-3 px-6 font-medium align-middle">Call Duration</th>
                  <th className="py-3 px-6 font-medium align-middle">Call Stage</th>
                  <th className="py-3 px-6 font-medium align-middle">Recording/Transcript</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {groupedData.map((contact, idx) => {
                  const hasHistory = contact.history.length > 1;
                  const latestCall = contact.history[0];
                  const previousCalls = contact.history.slice(1);
                  const isActive = activeMap[contact.name];
                  return (
                    <React.Fragment key={idx}>
                      {/* Main row: show dropdown only if there is history */}
                      <tr
                        className={
                          `${hasHistory ? "border-t border-gray-200 hover:bg-gray-50 transition" : "border-t border-gray-200"} ` +
                          (idx % 2 === 0 ? "bg-white" : "bg-[#f1f1f1]")
                        }
                      >
                        {/* Toggle column */}
                        <td className="py-4 px-4 align-middle text-center">
                          <label className="inline-flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => handleToggleActive(contact.name)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-[#212529] transition-all relative border border-gray-300">
                              <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full shadow transition-all duration-200 ${isActive ? 'bg-[#009ef7] translate-x-4' : 'bg-white'}`}></div>
                            </div>
                          </label>
                        </td>
                        {/* Dropdown column */}
                        <td className="py-4 px-4 align-middle text-center">
                          {hasHistory ? (
                            <span
                              className="cursor-pointer flex items-center justify-center"
                              onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                              tabIndex={0}
                              role="button"
                              aria-label="Expand call history"
                            >
                              {expandedRow === idx ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </span>
                          ) : null}
                        </td>
                        {/* Contact Name */}
                        <td className="py-4 px-6 font-medium text-gray-800 align-middle">
                          {contact.name}
                        </td>
                        {/* Call Type */}
                        <td className="py-4 px-6 align-middle">
                          {latestCall.type && latestCall.type.toLowerCase().includes('outbound') ? (
                            <div className="flex flex-col justify-start h-full">
                              <span className="flex items-center gap-2 text-gray-700 leading-tight" style={{ alignItems: 'center', minHeight: '24px' }}>
                                <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-1" style={{ verticalAlign: 'middle' }}></span>
                                {(() => {
                                  const match = latestCall.phone.match(/\+?\d[\d\s\-()]+/);
                                  let num = match ? match[0] : latestCall.phone;
                                  return num.replace(/[()]+$/g, "");
                                })()}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-gray-500 leading-tight mt-1" style={{ alignItems: 'center', minHeight: '18px' }}>
                                <PhoneOutgoing size={14} className="inline-block" />
                                Outbound
                              </span>
                              {!latestCall.answer && (
                                <span className="text-xs text-red-500 font-semibold leading-tight mt-0.5 h-4">No Answer</span>
                              )}
                              {latestCall.answer && (
                                <span className="text-xs invisible h-4">No Answer</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col justify-start h-full">
                              <span className="text-gray-700 leading-tight" style={{ minHeight: '24px', display: 'flex', alignItems: 'center' }}>{latestCall.phone}</span>
                              <span className="text-xs text-gray-500 leading-tight" style={{ minHeight: '18px', display: 'flex', alignItems: 'center' }}>{latestCall.type}</span>
                              {!latestCall.answer && (
                                <span className="text-xs text-red-500 font-semibold leading-tight mt-0.5 h-4">No Answer</span>
                              )}
                              {latestCall.answer && (
                                <span className="text-xs invisible h-4">No Answer</span>
                              )}
                            </div>
                          )}
                        </td>
                        {/* Call Date & Time */}
                        <td className="py-4 px-6 align-middle">{latestCall.date}</td>
                        {/* Call Duration */}
                        <td className="py-4 px-6 align-middle">{latestCall.duration}</td>
                        {/* Call Stage */}
                        <td className="py-4 px-6 align-middle">
                          {latestCall.stage === 'Positive' && (
                            <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-xs font-medium">Positive</span>
                          )}
                          {latestCall.stage === 'Negative' && (
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-medium">Negative</span>
                          )}
                          {latestCall.stage === 'Neutral' && (
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-medium">Neutral</span>
                          )}
                          {latestCall.stage === '-' && <span className="text-gray-400">-</span>}
                        </td>
                        {/* Recording/Transcript */}
                        <td className="py-4 px-6 flex items-center gap-4 align-middle">
                          {latestCall.transcript ? (
                            <a
                              href={latestCall.recording_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 bg-white text-xl shadow-sm"
                              style={{ verticalAlign: 'middle' }}
                              title="Open recording/transcript"
                            >
                              <Users size={18} />
                            </a>
                          ) : (
                            <span className="text-gray-400" style={{ verticalAlign: 'middle' }}>-</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded previous calls */}
                      {hasHistory && expandedRow === idx && previousCalls.map((c, hIdx) => (
                        <tr key={hIdx} className="border-t border-gray-100 bg-gray-50">
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-6"></td>
                          <td className="py-4 px-6 align-middle">
                            {c.type && c.type.toLowerCase().includes('outbound') ? (
                              <div className="flex flex-col justify-start h-full">
                                <span className="flex items-center gap-2 text-gray-700 leading-tight" style={{ alignItems: 'center', minHeight: '24px' }}>
                                  <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-1" style={{ verticalAlign: 'middle' }}></span>
                                  {(() => {
                                    const match = c.phone.match(/\+?\d[\d\s\-()]+/);
                                    let num = match ? match[0] : c.phone;
                                    return num.replace(/[()]+$/g, "");
                                  })()}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-gray-500 leading-tight mt-1" style={{ alignItems: 'center', minHeight: '18px' }}>
                                  <PhoneOutgoing size={14} className="inline-block" />
                                  Outbound
                                </span>
                                {!c.answer && (
                                  <span className="text-xs text-red-500 font-semibold leading-tight mt-0.5 h-4">No Answer</span>
                                )}
                                {c.answer && (
                                  <span className="text-xs invisible h-4">No Answer</span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col justify-start h-full">
                                <span className="text-gray-700 leading-tight" style={{ minHeight: '24px', display: 'flex', alignItems: 'center' }}>{c.phone}</span>
                                <span className="text-xs text-gray-500 leading-tight" style={{ minHeight: '18px', display: 'flex', alignItems: 'center' }}>{c.type}</span>
                                {!c.answer && (
                                  <span className="text-xs text-red-500 font-semibold leading-tight mt-0.5 h-4">No Answer</span>
                                )}
                                {c.answer && (
                                  <span className="text-xs invisible h-4">No Answer</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 align-middle">{c.date}</td>
                          <td className="py-4 px-6 align-middle">{c.duration}</td>
                          <td className="py-4 px-6"></td>
                          <td className="py-4 px-6 flex items-center gap-4 align-middle">
                            {c.transcript ? (
                              <a
                                href={c.recording_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 bg-white text-xl shadow-sm"
                                style={{ verticalAlign: 'middle' }}
                                title="Open recording/transcript"
                              >
                                <Users size={18} />
                              </a>
                            ) : (
                              <span className="text-gray-400" style={{ verticalAlign: 'middle' }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Footer */}
            <div className="flex items-center justify-end gap-8 text-sm px-5 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
              <span>Total Calls: {totalCalls}</span>
              <span>Avg Talk Time: {avgTalkTime}</span>
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-sm bg-green-100 border border-green-200 inline-block"></span>
                <span className="text-gray-800">Positive Calls {positiveCalls}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-sm bg-red-100 border border-red-200 inline-block"></span>
                <span className="text-gray-800">Negative Calls: {negativeCalls}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-sm bg-blue-100 border border-blue-200 inline-block"></span>
                <span className="text-gray-800">Neutral Calls: {neutralCalls}</span>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CallHistory;
