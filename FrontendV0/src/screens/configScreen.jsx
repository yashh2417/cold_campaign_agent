import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { Phone, Pencil, Contact, Search, Filter } from 'lucide-react';
import API_BASE_URL from '../api'; // Adjust the import path as necessary

function getUniqueTags(contacts) {
  const tags = new Set();
  contacts.forEach(c => {
    if (c.tags) tags.add(c.tags);
  });
  return Array.from(tags);
}

function ConfigScreen({ sidebarCollapsed = false }) {
  // State for campaigns and contacts
  const [campaigns, setCampaigns] = useState([]);
  const [contactsList, setContactsList] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);
  // Track modal open/close and which campaign
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [activeCampaignIdx, setActiveCampaignIdx] = useState(null);
  const [activeCampaignThreadId, setActiveCampaignThreadId] = useState(null);
  // Track active/inactive state for each contact per campaign using id mapping
  // Set all toggles to default active (true)
  const [campaignContactsActive, setCampaignContactsActive] = useState(() =>
    campaigns.map(() => {
      const obj = {};
      contactsList.forEach(contact => {
        obj[contact.id] = true;
      });
      return obj;
    })
  );
  // Search/filter state for modal
  const [searchValue, setSearchValue] = useState("");
  const [selectedTags, setSelectedTags] = useState([]); // tags currently applied as filter
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [pendingTags, setPendingTags] = useState([]); // tags being selected in dropdown before apply
  const filterRef = useRef(null);


  // Fetch campaigns on mount and when page is visible
  useEffect(() => {
    async function fetchCampaigns() {
      setLoadingCampaigns(true);
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
          setCampaigns(data.data.campaigns || []);
        } else {
          setCampaigns([]);
        }
      } catch {
        setCampaigns([]);
      }
      setLoadingCampaigns(false);
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

  // Fetch contacts for a campaign
  const fetchContactsForCampaign = async (campaignThreadId) => {
    setLoadingContacts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/campaign/${campaignThreadId}/contact-list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const contacts = (data.data.contacts || []).map((c) => ({
          id: c.contact_id, // Use backend-provided contact_id
          name: c.name,
          phone: c.phone_number,
          company: c.company_name,
          email: c.email,
          tags: c.tags,
          is_active: c.is_active,
        }));
        setContactsList(contacts);
        setCampaignContactsActive(prev => {
          const updated = [...prev];
          updated[activeCampaignIdx] = {};
          contacts.forEach(contact => {
            updated[activeCampaignIdx][contact.id] = true;
          });
          return updated;
        });
      } else {
        setContactsList([]);
      }
    } catch {
      setContactsList([]);
    }
    setLoadingContacts(false);
  };

  // Open modal for a campaign
  const handleOpenContactsModal = (campaignIdx) => {
    const campaign = campaigns[campaignIdx];
    setActiveCampaignIdx(campaignIdx);
    setActiveCampaignThreadId(campaign.campaign_thread_id);
    setShowContactsModal(true);
    setSearchValue("");
    setSelectedTags([]);
    fetchContactsForCampaign(campaign.campaign_thread_id);
  };

  // Toggle contact active/inactive for a campaign using id mapping
  const handleToggleContact = (contact) => {
    setCampaignContactsActive(prev => prev.map((obj, cIdx) =>
      cIdx === activeCampaignIdx
        ? { ...obj, [contact.id]: !obj[contact.id] }
        : obj
    ));
  };

  // Tag filter logic
  const allTags = getUniqueTags(contactsList);

  // Open filter dropdown and sync pendingTags
  const handleOpenFilterDropdown = () => {
    setPendingTags(selectedTags);
    setFilterDropdownOpen(true);
  };

  // Handle tag checkbox in dropdown
  const handlePendingTagToggle = (tag) => {
    setPendingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Apply selected tags from dropdown
  const handleApplyFilter = () => {
    setSelectedTags(pendingTags);
    setFilterDropdownOpen(false);
  };

  // Remove a tag pill
  const handleRemoveTag = (tag) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!filterDropdownOpen) return;
    function handleClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filterDropdownOpen]);

  // Enhanced search: filter by name, phone, email, company, tags (case-insensitive)
  const filteredContacts = contactsList.filter(c => {
    const q = searchValue.trim().toLowerCase();
    const matchesSearch =
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      (c.tags ? c.tags.toLowerCase().includes(q) : false);
    const matchesTag = selectedTags.length === 0 || selectedTags.includes(c.tags);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="pt-24 p-8 bg-[#fafafd] min-h-screen">
      {/* Fixed animated header like call history */}
      <header className="fixed top-0 left-0 w-full z-30 bg-transparent">
        <div
          className={`absolute top-0 ${sidebarCollapsed ? 'left-16 w-[calc(100%-4rem)]' : 'left-64 w-[calc(100%-16rem)]'} bg-white px-8 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300`}
          style={{ transitionProperty: 'left, width' }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lead Generation AI</h1>
        </div>
      </header>
      {/* Title and Create button in one row */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <span className="text-lg text-gray-700 flex items-center gap-2">
          Campaign Configuration
        </span>
        <Link to="/config/setup1" className="w-fit">
          <div
            className="bg-sky-400 hover:bg-sky-500 text-white font-semibold px-5 py-2 rounded-lg shadow-sm transition text-center"
          >
            + Create Campaign
          </div>
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-separate" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-[#f7f7fa] text-gray-700 text-sm">
              <th className="py-3 px-5 font-semibold text-left align-middle">Campaign name <span className="text-xs">↑</span></th>
              <th className="py-3 px-5 font-semibold text-left align-middle">Agent Name</th>
              <th className="py-3 px-5 font-semibold text-left align-middle">Assigned Number</th>
              <th className="py-3 px-5 font-semibold text-left align-middle">Channels Enabled</th>
              <th className="py-3 px-5 font-semibold text-left align-middle">Connected Contacts</th>
              <th className="py-3 px-5 font-semibold text-left align-middle">Campaign Date/Status</th>
              <th className="py-3 px-5 font-semibold text-center align-middle">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {Array.isArray(campaigns) && campaigns.length > 0 ? campaigns.map((c, idx) => (
              <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50 transition">
                <td className="py-4 px-5 align-middle whitespace-nowrap">{c.campaign_name}</td>
                <td className="py-4 px-5 align-middle whitespace-nowrap">{c.agent_name}</td>
                {/* Assigned Number: lucide Phone icon before number */}
                <td className="py-4 px-5 align-middle whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <Phone size={18} className="text-gray-500" />
                    <span className="tracking-wide">{c.campaign_phone_number}</span>
                  </span>
                </td>
                <td className="py-4 px-5 align-middle whitespace-nowrap">
                  <div className="flex justify-center items-center h-full min-h-[32px]">
                    <span className="flex items-center justify-center bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap">
                      {c.channels_enabled}
                    </span>
                  </div>
                </td>
                {/* Connected Contacts: number and person icon perfectly aligned */}
                <td className="py-4 px-5 align-middle whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-9 h-8 rounded bg-gray-100 border border-gray-200 text-gray-800 font-semibold text-base">{c.connected_contacts}</span>
                    <button
                      className="focus:outline-none"
                      onClick={() => handleOpenContactsModal(idx)}
                      title="View/Manage Contacts"
                    >
                      <Contact size={18} className="text-gray-700 hover:text-blue-600 transition" />
                    </button>
                  </div>
                </td>
                <td className="py-4 px-5 align-middle whitespace-nowrap">
                  {c.campaign_status === 'Inactive Campaign' ? (
                    <span className="bg-red-50 text-red-700 px-3 py-1 rounded-md text-xs font-medium border border-red-100 whitespace-nowrap">{c.campaign_status}</span>
                  ) : (
                    <span className="bg-green-50 text-green-700 px-3 py-1 rounded-md text-xs font-medium border border-green-100 whitespace-nowrap">{c.campaign_status}</span>
                  )}
                </td>
                <td className="py-4 px-5 align-middle text-center">
                  <Link to="/campaign-edit">
                    <button className="bg-sky-100 hover:bg-sky-200 p-2 rounded flex items-center justify-center mx-auto">
                      <Pencil size={18} className="text-sky-600" />
                    </button>
                  </Link>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No campaigns found.</td></tr>
            )}
          </tbody>
        </table>
        <div className="flex justify-end items-center text-sm px-4 py-3 bg-[#f7f7fa] rounded-b-xl border-t border-gray-100">
          Total Active Campaign: {campaigns.length}
        </div>
      </div>
      {/* Contacts Modal */}
      {showContactsModal && activeCampaignIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-10 w-[90vw] max-w-5xl relative">
            <button
              className="absolute top-6 right-6 text-red-500 hover:bg-red-100 rounded-full p-2 text-2xl"
              onClick={() => setShowContactsModal(false)}
            >
              &#10006;
            </button>
            <h3 className="text-2xl font-semibold mb-6">Contact List</h3>
            {/* Search and filter row styled like reference image */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center gap-3 w-full">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts with name or Phone number"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#009ef7] text-base"
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                  />
                </div>
                <div className="relative" ref={filterRef}>
                  <button
                    className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition shadow-sm"
                    onClick={handleOpenFilterDropdown}
                    type="button"
                  >
                    <Filter size={18} className="text-gray-500" />
                    <span className="font-medium text-base">Filter</span>
                  </button>
                  {filterDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 py-3 px-3 border border-gray-200">
                      <div className="flex flex-col gap-1">
                        {allTags.length === 0 && <span className="text-gray-400 text-sm">No tags available</span>}
                        {allTags.map(tag => (
                          <label
                            key={tag}
                            className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-gray-50 transition"
                            style={{ userSelect: 'none' }}
                          >
                            <span className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={pendingTags.includes(tag)}
                                onChange={() => handlePendingTagToggle(tag)}
                                className="appearance-none w-5 h-5 border-2 border-gray-400 rounded-md checked:bg-[#009ef7] checked:border-[#009ef7] focus:outline-none transition-all flex-shrink-0"
                                style={{ display: 'inline-block' }}
                              />
                              {pendingTags.includes(tag) && (
                                <svg className="absolute left-0 top-0 w-5 h-5 pointer-events-none" viewBox="0 0 20 20" fill="none">
                                  <path d="M5 10.5L9 14.5L15 7.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                            <span className="font-semibold text-black text-base">{tag}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                          onClick={() => setFilterDropdownOpen(false)}
                        >Cancel</button>
                        <button
                          className="px-3 py-1 rounded bg-[#009ef7] text-white hover:bg-[#007acc] text-sm font-semibold"
                          onClick={handleApplyFilter}
                        >Apply</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Tag filter pills, only show if tags are applied */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center mt-1">
                  {selectedTags.map(tag => (
                    <span key={tag} className="inline-flex items-center bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium mr-1">
                      {tag}
                      <button
                        className="ml-2 text-gray-500 hover:text-red-500 focus:outline-none"
                        onClick={() => handleRemoveTag(tag)}
                        aria-label={`Remove ${tag}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <table className="w-full text-left border-separate" style={{ borderSpacing: 0 }}>
              <thead>
                <tr className="bg-gray-100 text-gray-700 items-center align-middle">
                  <th className="py-3 px-4 font-medium align-middle text-center"></th>
                  <th className="py-3 px-4 font-medium align-middle">Contact Name</th>
                  <th className="py-3 px-4 font-medium align-middle">Phone Number</th>
                  <th className="py-3 px-4 font-medium align-middle">Company name</th>
                  <th className="py-3 px-4 font-medium align-middle">Email Address</th>
                  <th className="py-3 px-4 font-medium align-middle">Tags</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => {
                  const isActive = campaignContactsActive[activeCampaignIdx]?.[contact.id] ?? true;
                  return (
                    <tr key={contact.id} className="border-t align-middle items-center">
                      <td className="py-3 px-4 align-middle text-center">
                        <div className="flex items-center justify-center h-full">
                          <input type="checkbox" checked={isActive} onChange={() => handleToggleContact(contact)} />
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle">{contact.name}</td>
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-500" />
                          {contact.phone}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle">{contact.company}</td>
                      <td className="py-3 px-4 align-middle">{contact.email}</td>
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <Contact size={16} className="text-gray-500" />
                          {contact.tags}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex justify-end mt-6">
              <button
                className="bg-[#27ae60] text-white px-12 py-3 rounded-lg font-medium shadow hover:bg-[#219150] transition text-lg"
                onClick={() => setShowContactsModal(false)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfigScreen