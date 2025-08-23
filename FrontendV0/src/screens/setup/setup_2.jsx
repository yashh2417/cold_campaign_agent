import React, { useState, useRef, useEffect } from 'react';
import { Phone, Contact, Search, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import API_BASE_URL from '../../api';

function getUniqueTags(contacts) {
  const tags = new Set();
  contacts.forEach(c => {
    if (c.tags) tags.add(c.tags);
  });
  return Array.from(tags);
}

function Setup2({ sidebarCollapsed = false }) {
  const [contactsList, setContactsList] = useState([]);

  // Fetch contacts from backend
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/contact/all`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (res.ok) {
          const data = await res.json();
          // Map API fields to local format
          const contacts = (data.data && data.data.contacts) ? data.data.contacts.map(c => ({
            id: c.contact_id,
            name: c.contact_name,
            phone: c.phone_number,
            email: c.email_address,
            company: c.company_name,
            tags: c.tags,
          })) : [];
          
          setContactsList(contacts);
        } else {
          setContactsList([]);
        }
      } catch {
        setContactsList([]);
      }
    };
    fetchContacts();
  }, []);
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [selectedTags, setSelectedTags] = useState([]); // Example selected tags
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [pendingTags, setPendingTags] = useState();
  const [selectedContactIds, setSelectedContactIds] = useState([]);

    // Save selectedContactIds to localStorage whenever it changes
    useEffect(() => {
      localStorage.setItem('selected_contact_ids', JSON.stringify(selectedContactIds));
    }, [selectedContactIds]);
  const filterRef = useRef(null);
  const allTags = getUniqueTags(contactsList);

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

  // Select all logic
  const allFilteredIds = filteredContacts.map(c => c.id);
  const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedContactIds.includes(id));
  const isIndeterminate = selectedContactIds.length > 0 && !isAllSelected && allFilteredIds.some(id => selectedContactIds.includes(id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedContactIds(selectedContactIds.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedContactIds(Array.from(new Set([...selectedContactIds, ...allFilteredIds])));
    }
  };

  const handleSelectContact = (id) => {
    console.log('Selected contact id:', id);
    setSelectedContactIds(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };

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

  return (
    <div className="min-h-screen bg-[#fcfbfd] flex flex-col">
      {/* Fixed animated header like config screen */}
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
          <button
            className="text-2xl text-gray-500 hover:text-gray-700 mr-2"
            onClick={() => navigate('/config/setup1')}
            aria-label="Go to step 1"
          >
            &#8592;
          </button>
          <span className="text-lg font-medium text-gray-700">Assign Contacts to Agent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1 bg-[#d9d9d9] rounded-full relative">
            <div className="absolute left-0 top-0 h-1 bg-[#00b6ff] rounded-full" style={{ width: '66%' }}></div>
          </div>
          <span className="text-sm text-gray-500 font-medium">2/3</span>
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-6xl px-4">
          <div className="flex flex-col items-stretch bg-white rounded-xl border border-gray-200 shadow p-8 mt-4">
            {/* Search and filter row */}
            <div className="flex flex-col gap-4 mb-4">
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
              {/* Tag filter pills */}
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
            {/* Table styled like reference image, with select-all and modern checkboxes, scrollable body */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-[#fafafd]">
              <table className="w-full text-left border-separate" style={{ borderSpacing: 0 }}>
                <thead>
                  <tr className="bg-[#f3f3f3] text-gray-700 text-base">
                    <th className="py-3 px-4 font-semibold text-left align-middle w-12">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                          onChange={handleSelectAll}
                          className="peer appearance-none w-5 h-5 border-2 border-gray-400 rounded-md checked:bg-[#00b6ff] checked:border-[#00b6ff] focus:outline-none transition-all relative"
                          style={{ display: 'inline-block' }}
                        />
                        {isAllSelected && (
                          <svg className="absolute w-5 h-5 pointer-events-none" viewBox="0 0 20 20" fill="none" style={{left:0,top:0}}>
                            <path d="M5 10.5L9 14.5L15 7.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {isIndeterminate && !isAllSelected && (
                          <svg className="absolute w-5 h-5 pointer-events-none" viewBox="0 0 20 20" fill="none" style={{left:0,top:0}}>
                            <rect x="5" y="9" width="10" height="2" rx="1" fill="white" />
                          </svg>
                        )}
                      </label>
                    </th>
                    <th className="py-3 px-4 font-semibold text-left align-middle">Contact Name</th>
                    <th className="py-3 px-4 font-semibold text-left align-middle">Phone Number</th>
                    <th className="py-3 px-4 font-semibold text-left align-middle">Company name</th>
                    <th className="py-3 px-4 font-semibold text-left align-middle">Email Address</th>
                    <th className="py-3 px-4 font-semibold text-left align-middle">Tags</th>
                  </tr>
                </thead>
              </table>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                <table className="w-full text-left border-separate" style={{ borderSpacing: 0 }}>
                  <tbody className="text-base">
                    {filteredContacts.map((contact) => (
                      <tr key={contact.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 align-middle text-center">
                          <label className="inline-flex items-center cursor-pointer relative">
                            <input
                              type="checkbox"
                              checked={selectedContactIds.includes(contact.id)}
                              onChange={() => handleSelectContact(contact.id)}
                              className="peer appearance-none w-5 h-5 border-2 border-gray-400 rounded-md checked:bg-[#00b6ff] checked:border-[#00b6ff] focus:outline-none transition-all relative"
                              style={{ display: 'inline-block' }}
                            />
                            {selectedContactIds.includes(contact.id) && (
                              <svg className="absolute w-5 h-5 pointer-events-none" viewBox="0 0 20 20" fill="none" style={{left:0,top:0}}>
                                <path d="M5 10.5L9 14.5L15 7.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </label>
                        </td>
                        <td className="py-3 px-4 align-middle whitespace-nowrap">{contact.name}</td>
                        <td className="py-3 px-4 align-middle whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <Phone size={16} className="text-gray-500" />
                            {contact.phone}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle whitespace-nowrap">{contact.company}</td>
                        <td className="py-3 px-4 align-middle whitespace-nowrap">{contact.email}</td>
                        <td className="py-3 px-4 align-middle whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <Contact size={16} className="text-gray-500" />
                            {contact.tags}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Add space between table and button */}
      <div className="h-8" />
      {/* Bottom right button */}
      <div className="flex justify-end items-center px-12 pb-8">
        <Link to="/config/setup3">
          <div
            className="bg-[#00b6ff] hover:bg-[#009ef7] text-white font-semibold px-8 py-3 rounded-lg shadow transition text-lg cursor-pointer"
          >
            Setup Agent & Business Details &rarr;
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Setup2;
