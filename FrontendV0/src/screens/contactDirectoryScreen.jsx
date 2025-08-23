// import React, { useState, useRef, useEffect } from 'react';
// import Papa from 'papaparse';
// // Helper to upload and parse CSV, then send each entry
// const handleCSVImport = async (file) => {
// 	if (!file) return;
// 	Papa.parse(file, {
// 		header: true,
// 		skipEmptyLines: true,
// 		complete: async function (results) {
// 			const rows = results.data;
// 			let successCount = 0;
// 			let failCount = 0;
// 			let duplicates = [];
// 			for (const row of rows) {
// 				// Expected columns: name, phone, email, company, tags
// 				const user_id = Number(localStorage.getItem('user_id'));
// 				const payload = {
// 					name: row.name || '',
// 					email: row.email || '',
// 					phone_number: row.phone ? `+${row.phone}` : '',
// 					company_name: row.company || '',
// 					tags: row.tags || '',
// 					user_id,
// 				};
// 				try {
// 					const res = await fetch(`${API_BASE_URL}/contact/create`, {
// 						method: 'POST',
// 						headers: {
// 							'Content-Type': 'application/json',
// 							'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// 							'ngrok-skip-browser-warning': 'true',
// 						},
// 						body: JSON.stringify(payload),
// 					});
// 					if (res.ok) {
// 						successCount++;
// 					} else if (res.status === 409) {
// 						failCount++;
// 						duplicates.push(`${row.name || ''} (${row.phone || ''})`);
// 					} else {
// 						failCount++;
// 					}
// 				} catch {
// 					failCount++;
// 				}
// 			}
// 			let msg = `Import complete. Success: ${successCount}, Failed: ${failCount}`;
// 			if (duplicates.length > 0) {
// 				msg += `\nDuplicates (already exist):\n` + duplicates.join('\n');
// 			}
// 			alert(msg);
// 			fetchContacts();
// 		}
// 	});
// };
// import 'react-phone-input-2/lib/style.css';
// import PhoneInput from 'react-phone-input-2';
// import { User2, Phone, Users, Edit2, Trash2 } from 'lucide-react';
// import NavigationSidebar from '../components/navBar';
// import { useNavigate } from 'react-router';
// import API_BASE_URL from '../api'; // Adjust the import path as necessary

// function ContactDirectoryScreen({ sidebarCollapsed }) {

// 	const navigate = useNavigate();
// 	// Popup state and ref
// 	const [searchValue, setSearchValue] = useState("");
// 	const [showPopup, setShowPopup] = useState(false);
// 	const [showModal, setShowModal] = useState(false);
// 	const [showDeleteModal, setShowDeleteModal] = useState(false);
// 	const [deleteIdx, setDeleteIdx] = useState(null);
// 	const popupRef = useRef();

// 	// Contacts state
// 	const [contacts, setContacts] = useState([]);


// 	// Form state
// 	const [form, setForm] = useState({
// 		name: '',
// 		phone: '',
// 		email: '',
// 		company: '',
// 		tags: '',
// 	});
// 	const [editForm, setEditForm] = useState({
// 		contact_id: null,
// 		name: '',
// 		phone: '',
// 		email: '',
// 		company: '',
// 		tags: '',
// 	});
// 	const [showEditModal, setShowEditModal] = useState(false);

// 	// Fetch contacts function
// 	const fetchContacts = async () => {
// 		try {
// 			const res = await fetch(`${API_BASE_URL}/contact/all`, {
// 				method: 'GET',
// 				headers: {
// 					'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// 					'Accept': 'application/json',
// 					'ngrok-skip-browser-warning': 'true',
// 				},
// 			});
// 			if (res.ok) {
// 				const data = await res.json();
// 				// Only show contacts with is_active !== false
// 				const filteredContacts = (data.data && data.data.contacts)
// 					? data.data.contacts.filter(c => c.is_active !== false)
// 					: [];
// 				setContacts(filteredContacts);
// 			} else {
// 				setContacts([]);
// 			}
// 		} catch {
// 			setContacts([]);
// 		}
// 	};

// 	// Fetch contacts on mount
// 	useEffect(() => {
// 		fetchContacts();
// 	}, []);

// 	// Close popup if clicked outside
// 	useEffect(() => {
// 		function handleClickOutside(event) {
// 			if (popupRef.current && !popupRef.current.contains(event.target)) {
// 				setShowPopup(false);
// 			}
// 		}
// 		if (showPopup) {
// 			document.addEventListener('mousedown', handleClickOutside);
// 		}
// 		return () => {
// 			document.removeEventListener('mousedown', handleClickOutside);
// 		};
// 	}, [showPopup]);

// 	// Handle form input change
// 	const handleFormChange = (e) => {
// 		setForm({ ...form, [e.target.name]: e.target.value });
// 	};

// 	// Handle form submit
// 	const handleFormSubmit = async (e) => {
// 		e.preventDefault();
// 		// Require phone number
// 		if (!form.phone || form.phone.trim() === '') {
// 			alert('Phone number is required.');
// 			return;
// 		}
// 		const user_id = Number(localStorage.getItem('user_id'));
// 		const payload = {
// 			name: form.name,
// 			email: form.email,
// 			phone_number: `+${form.phone}`,
// 			company_name: form.company,
// 			tags: form.tags,
// 			user_id,
// 		};
// 		try {
// 			const res = await fetch(`${API_BASE_URL}/contact/create`, {
// 				method: 'POST',
// 				headers: {
// 					'Content-Type': 'application/json',
// 					'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// 					'ngrok-skip-browser-warning': 'true',
// 				},
// 				body: JSON.stringify(payload),
// 			});
// 			if (!res.ok) {
// 				const data = await res.json();
// 				alert(data.message || 'Failed to create contact');
// 			} else {
// 				setShowModal(false);
// 				setForm({ name: '', phone: '', email: '', company: '', tags: '' });
// 				alert('Contact created successfully');
// 				fetchContacts();
// 			}
// 		} catch (err) {
// 			alert('Network error');
// 		}
// 	};

// 	// Open edit modal and populate form
// 	const handleEditClick = (contact) => {
// 		setEditForm({
// 			contact_id: contact.contact_id,
// 			name: contact.contact_name || '',
// 			phone: contact.phone_number || '',
// 			email: contact.email_address || '',
// 			company: contact.company_name || '',
// 			tags: contact.tags || '',
// 		});
// 		setShowEditModal(true);
// 	};

// 	// Handle edit form input change
// 	const handleEditFormChange = (e) => {
// 		setEditForm({ ...editForm, [e.target.name]: e.target.value });
// 	};

// 	// Handle edit form submit
// 	const handleEditFormSubmit = async (e) => {
// 		e.preventDefault();
// 		const payload = {
// 			name: editForm.name,
// 			email: editForm.email,
// 			phone_number: editForm.phone,
// 			company_name: editForm.company,
// 			tags: editForm.tags,
// 		};
// 		try {
// 			const res = await fetch(`${API_BASE_URL}/contact/${editForm.contact_id}/edit`, {
// 				method: 'PUT',
// 				headers: {
// 					'Content-Type': 'application/json',
// 					'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// 					'ngrok-skip-browser-warning': 'true',
// 				},
// 				body: JSON.stringify(payload),
// 			});
// 			if (!res.ok) {
// 				const data = await res.json();
// 				alert(data.message || 'Failed to update contact');
// 			} else {
// 				setShowEditModal(false);
// 				alert('Contact updated successfully');
// 				fetchContacts();
// 			}
// 		} catch (err) {
// 			alert('Network error');
// 		}
// 	};

// 	// Filtered contacts for table
// 	const filteredContacts = contacts.filter(c => {
// 		const q = searchValue.trim().toLowerCase();
// 		return (
// 			c.contact_name?.toLowerCase().includes(q) ||
// 			c.phone_number?.toLowerCase().includes(q) ||
// 			c.email_address?.toLowerCase().includes(q) ||
// 			c.company_name?.toLowerCase().includes(q) ||
// 			(c.tags ? c.tags.toLowerCase().includes(q) : false)
// 		);
// 	});

// 	return (
// 		<div className="p-8 bg-[#f8f9fb] min-h-screen">
// 			<header className="fixed top-0 left-0 w-full z-10 bg-transparent">
// 				<div
// 					className={`absolute top-0 ${sidebarCollapsed ? 'left-16 w-[calc(100%-4rem)]' : 'left-64 w-[calc(100%-16rem)]'} bg-white px-8 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300`}
// 					style={{ transitionProperty: 'left, width' }}
// 				>
// 					<h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Lead Generation AI</h1>
// 				</div>
// 			</header>
// 			<div className="pt-24 flex items-center justify-between mb-4 relative">
// 				<span className="text-lg text-gray-700">
// 					<span className="inline-block mr-2">&larr;</span>
// 					Add client phone numbers to enhance communication for the campaign
// 				</span>
// 				<div className="relative">
// 					<button
// 						className="bg-[#01B0F1] text-white px-10 py-2 rounded-lg font-medium shadow hover:bg-[#007fd1] transition min-w-[200px] text-base"
// 						onClick={() => setShowPopup(!showPopup)}
// 					>
// 						+ Add Contact
// 					</button>
// 					{showPopup && (
// 						<div
// 							ref={popupRef}
// 							className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
// 						>
// 							<button
// 								className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-200 text-gray-800 font-medium"
// 								onClick={() => { setShowModal(true); setShowPopup(false); }}
// 							>
// 								+ Create new contact
// 							</button>
// 							<button
// 								className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-800 font-medium"
// 								onClick={() => document.getElementById('importFileInput').click()}
// 							>
// 								+ Import CSV
// 							</button>
// 							<input
// 								type="file"
// 								id="importFileInput"
// 								className="hidden"
// 								accept=".csv"
// 								onChange={e => {
// 									const file = e.target.files[0];
// 									if (file) {
// 										handleCSVImport(file);
// 									}
// 								}}
// 							/>
// 						</div>
// 					)}
// 				</div>
// 			</div>
// 			{/* Modal for create new contact */}
// 			{showModal && (
// 				<div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40">
// 					<div className="rounded-xl shadow-lg p-8 w-full max-w-2xl relative" style={{ background: '#fefefe' }}>
// 						<button
// 							className="absolute top-6 right-6 text-red-500 hover:bg-red-100 rounded-full p-2 text-2xl"
// 							onClick={() => setShowModal(false)}
// 						>
// 							&#10006;
// 						</button>
// 						<h3 className="text-2xl font-semibold mb-8">Create Contact</h3>
// 						<form onSubmit={handleFormSubmit} className="space-y-6">
// 							{/* Contact Name */}
// 							<div>
// 								<label className="block text-base font-medium mb-2">Contact Name <span className="text-red-500">*</span></label>
// 								<input
// 									type="text"
// 									name="name"
// 									value={form.name}
// 									onChange={handleFormChange}
// 									placeholder="Contact Name"
// 									className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
// 									required
// 								/>
// 							</div>
// 							{/* Phone and Email Row */}
// 							<div className="flex flex-col md:flex-row gap-6">
// 								<div className="flex-1">
// 									<label className="block text-base font-medium mb-2">Phone Number <span className="text-red-500">*</span></label>
// 									<div className="flex items-center gap-3">
// 										<PhoneInput
// 											country={'in'}
// 											value={form.phone}
// 											onChange={phone => setForm({ ...form, phone })}
// 											inputClass="!w-full !px-4 !py-2 !rounded-lg !border !border-gray-300 !bg-white focus:!outline-none focus:!ring-2 focus:!ring-[#009ef7] !pl-12"
// 											buttonClass="!border-none !bg-transparent"
// 											dropdownClass="!z-[9999]"
// 											enableSearch
// 											inputProps={{ required: true, name: 'phone', autoFocus: false }}
// 											containerClass="!w-full"
// 											renderButton={(props, countryData) => (
// 												<div {...props} className="absolute left-0 top-0 h-full flex items-center pl-3">
// 													<div className={`flag ${countryData.iso2} w-6 h-6`}></div>
// 												</div>
// 											)}
// 										/>
// 									</div>
// 								</div>
// 								<div className="flex-1">
// 									<label className="block text-base font-medium mb-2">Email Address</label>
// 									<input
// 										type="email"
// 										name="email"
// 										value={form.email}
// 										onChange={handleFormChange}
// 										placeholder="Email Address"
// 										className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
// 									/>
// 								</div>
// 							</div>
// 							{/* Company Name */}
// 							<div>
// 								<label className="block text-base font-medium mb-2">Company Name</label>
// 								<input
// 									type="text"
// 									name="company"
// 									value={form.company}
// 									onChange={handleFormChange}
// 									placeholder="Company Name"
// 									className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
// 								/>
// 							</div>
// 							{/* Tags Row */}
// 							<div>
// 								<label className="block text-base font-medium mb-2">Tags</label>
// 								<div className="flex gap-2 items-center">
// 									<span className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-xl">
// 										<Users size={20} />
// 									</span>
// 									<input
// 										type="text"
// 										name="tags"
// 										value={form.tags}
// 										onChange={handleFormChange}
// 										placeholder="Tags"
// 										className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
// 									/>
// 								</div>
// 							</div>
// 							<div className="pt-2">
// 								<button
// 									type="submit"
// 									className="w-full bg-[#009ef7] text-white py-2 rounded-lg font-medium shadow hover:bg-[#007fd1] transition"
// 								>
// 									Save Contact
// 								</button>
// 							</div>
// 						</form>
// 					</div>
// 				</div>
// 			)}
// 			{/* Modal for edit contact */}
// 			{showEditModal && (
// 				<div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40">
// 					<div className="rounded-xl shadow-lg p-8 w-full max-w-2xl relative" style={{ background: '#fefefe' }}>
// 						<button
// 							className="absolute top-6 right-6 text-red-500 hover:bg-red-100 rounded-full p-2 text-2xl"
// 							onClick={() => setShowEditModal(false)}
// 						>
// 							&#10006;
// 						</button>
// 						<h3 className="text-2xl font-semibold mb-8">Edit Contact</h3>
// 						<form onSubmit={handleEditFormSubmit} className="space-y-6">
// 							{/* Contact Name */}
// 							<div>
// 								<label className="block text-base font-medium mb-2">Contact Name <span className="text-red-500">*</span></label>
// 								<input
// 									type="text"
// 									name="name"
// 									value={editForm.name}
// 									onChange={handleEditFormChange}
// 									placeholder="Contact Name"
// 									className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
// 									required
// 								/>
// 							</div>
// 							{/* Phone and Email Row */}
// 							<div className="flex flex-col md:flex-row gap-6">
// 								<div className="flex-1">
// 									<label className="block text-base font-medium mb-2">Phone Number <span className="text-red-500">*</span></label>
// 									<input
// 										type="text"
// 										name="phone"
// 										value={editForm.phone}
// 										onChange={handleEditFormChange}
// 										placeholder="Phone Number"
// 										className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
// 										required
// 									/>
// 								</div>
// 								<div className="flex-1">
// 									<label className="block text-base font-medium mb-2">Email Address</label>
// 									<input
// 										type="email"
// 										name="email"
// 										value={editForm.email}
// 										onChange={handleEditFormChange}
// 										placeholder="Email Address"
// 										className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
// 									/>
// 								</div>
// 							</div>
// 							{/* Company Name */}
// 							<div>
// 								<label className="block text-base font-medium mb-2">Company Name</label>
// 								<input
// 									type="text"
// 									name="company"
// 									value={editForm.company}
// 									onChange={handleEditFormChange}
// 									placeholder="Company Name"
// 									className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
// 								/>
// 							</div>
// 							{/* Tags Row */}
// 							<div>
// 								<label className="block text-base font-medium mb-2">Tags</label>
// 								<div className="flex gap-2 items-center">
// 									<span className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-xl">
// 										<Users size={20} />
// 									</span>
// 									<input
// 										type="text"
// 										name="tags"
// 										value={editForm.tags}
// 										onChange={handleEditFormChange}
// 										placeholder="Tags"
// 										className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
// 									/>
// 								</div>
// 							</div>
// 							<div className="pt-2">
// 								<button
// 									type="submit"
// 									className="w-full bg-[#009ef7] text-white py-2 rounded-lg font-medium shadow hover:bg-[#007fd1] transition"
// 								>
// 									Save Changes
// 								</button>
// 							</div>
// 						</form>
// 					</div>
// 				</div>
// 			)}
// 			<div className="mb-6">
// 				<input
// 					type="text"
// 					placeholder="Search contacts with name, phone, email, company, or tags"
// 					className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
// 					value={searchValue}
// 					onChange={e => setSearchValue(e.target.value)}
// 				/>
// 			</div>
// 			<div className="bg-white rounded-xl shadow p-4">
// 				<div className="w-full overflow-x-auto" style={{ maxHeight: '340px', overflowY: 'auto' }}>
// 					<table className="w-full text-left">
// 						<thead>
// 							<tr className="bg-gray-100 text-gray-700">
// 								<th className="py-3 px-4 align-middle text-base font-medium rounded-tl-xl">Contact Name &uarr;</th>
// 								<th className="py-3 px-4 align-middle text-base font-medium">Phone Number</th>
// 								<th className="py-3 px-4 align-middle text-base font-medium">Email Address</th>
// 								<th className="py-3 px-4 align-middle text-base font-medium">Company Name</th>
// 								<th className="py-3 px-4 align-middle text-base font-medium">Tags</th>
// 								<th className="py-3 px-4 align-middle text-base font-medium rounded-tr-xl">Actions</th>
// 							</tr>
// 						</thead>
// 						<tbody>
// 							{filteredContacts.map((c, idx) => (
// 								<tr key={c.contact_id || idx} className="border-t align-middle">
// 									<td className="py-3 px-4 align-middle text-base">{c.contact_name || c.name}</td>
// 									<td className="py-3 px-4 align-middle text-base">
// 										<div className="flex items-center gap-2">
// 											<Phone size={16} className="text-gray-500" />
// 											{c.phone_number || c.phone}
// 										</div>
// 									</td>
// 									<td className="py-3 px-4 align-middle text-base">{c.email_address || c.email}</td>
// 									<td className="py-3 px-4 align-middle text-base">{c.company_name || c.company}</td>
// 									<td className="py-3 px-4 align-middle text-base">
// 										<div className="flex items-center gap-2">
// 											<Users size={16} className="text-gray-500" />
// 											{c.tags}
// 										</div>
// 									</td>
// 									<td className="py-3 px-4 align-middle text-base">
// 										<div className="flex items-center gap-2">
// 											<button className="bg-[#e3f6ff] p-2 rounded hover:bg-[#bde8ff]" onClick={() => handleEditClick(c)}>
// 												<Edit2 size={16} className="text-[#009ef7]" />
// 											</button>
// 											<button className="bg-[#ffe3e3] p-2 rounded hover:bg-[#ffbdbd]" onClick={() => { setShowDeleteModal(true); setDeleteIdx(idx); }}>
// 												<Trash2 size={16} className="text-[#f1416c]" />
// 											</button>
// 										</div>
// 									</td>
// 								</tr>
// 							))}
// 						</tbody>
// 					</table>
// 				</div>
// 			</div>
// 			{/* Delete confirmation modal */}
// 			{showDeleteModal && (
// 				<div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40">
// 					<div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
// 						<h3 className="text-xl font-semibold mb-4">Are you sure?</h3>
// 						<hr className="mb-4" />
// 						<p className="mb-8 text-gray-700">You want to delete this contact, this action cannot be undone.</p>
// 						<div className="flex gap-4 justify-center">
// 							<button
// 								className="bg-[#f1416c] text-white px-8 py-2 rounded font-medium hover:bg-[#d12c4a]"
// 								onClick={() => setShowDeleteModal(false)}
// 							>
// 								Cancel
// 							</button>
// 							<button
// 								className="bg-white border border-green-500 text-green-600 px-8 py-2 rounded font-medium hover:bg-green-50"
// 								onClick={async () => {
// 									setShowDeleteModal(false);
// 									const contact = contacts[deleteIdx];
// 									if (!contact || !contact.contact_id) return;
// 									try {
// 										const res = await fetch(`${API_BASE_URL}/contact/${contact.contact_id}`, {
// 											method: 'DELETE',
// 											headers: {
// 												'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// 												'ngrok-skip-browser-warning': 'true',
// 											},
// 										});
// 										if (res.ok) {
// 											alert('Contact deleted successfully');
// 											fetchContacts();
// 										} else {
// 											const data = await res.json();
// 											alert(data.message || 'Failed to delete contact');
// 										}
// 									} catch {
// 										alert('Network error');
// 									}
// 								}}
// 							>
// 								Confirm
// 							</button>
// 						</div>
// 					</div>
// 				</div>
// 			)}
// 		</div>
// 	);
// }

// export default ContactDirectoryScreen;




import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import 'react-phone-input-2/lib/style.css';
import PhoneInput from 'react-phone-input-2';
import { User2, Phone, Users, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import API_BASE_URL from '../api'; // Adjust the import path as necessary

// Helper to upload and parse CSV, then send each entry
const handleCSVImport = async (file, fetchContacts) => {
	if (!file) return;
	Papa.parse(file, {
		header: true,
		skipEmptyLines: true,
		complete: async function (results) {
			const rows = results.data;
			let successCount = 0;
			let failCount = 0;
			let duplicates = [];
			for (const row of rows) {
				const user_id = Number(localStorage.getItem('user_id'));
				const payload = {
					name: row.name || '',
					email: row.email || '',
					phone_number: row.phone ? `+${row.phone}` : '',
					company_name: row.company || '',
					tags: row.tags || '',
					user_id,
				};
				try {
					const res = await fetch(`${API_BASE_URL}/contact/create`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
							'ngrok-skip-browser-warning': 'true',
						},
						body: JSON.stringify(payload),
					});
					if (res.ok) {
						successCount++;
					} else if (res.status === 409) {
						failCount++;
						duplicates.push(`${row.name || ''} (${row.phone || ''})`);
					} else {
						failCount++;
					}
				} catch {
					failCount++;
				}
			}
			let msg = `Import complete. Success: ${successCount}, Failed: ${failCount}`;
			if (duplicates.length > 0) {
				msg += `\nDuplicates (already exist):\n` + duplicates.join('\n');
			}
			alert(msg);
			if (fetchContacts) {
				fetchContacts();
			}
		}
	});
};

function ContactDirectoryScreen({ sidebarCollapsed }) {
	const navigate = useNavigate();
	const [searchValue, setSearchValue] = useState("");
	const [showPopup, setShowPopup] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteIdx, setDeleteIdx] = useState(null);
	const popupRef = useRef();
	const [contacts, setContacts] = useState([]);
	const [form, setForm] = useState({
		name: '',
		phone: '',
		email: '',
		company: '',
		tags: '',
	});
	const [editForm, setEditForm] = useState({
		contact_id: null,
		name: '',
		phone: '',
		email: '',
		company: '',
		tags: '',
	});
	const [showEditModal, setShowEditModal] = useState(false);

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
				const filteredContacts = (data.data && data.data.contacts)
					? data.data.contacts.filter(c => c.is_active !== false)
					: [];
				setContacts(filteredContacts);
			} else {
				setContacts([]);
			}
		} catch {
			setContacts([]);
		}
	};

	useEffect(() => {
		fetchContacts();
	}, []);

	useEffect(() => {
		function handleClickOutside(event) {
			if (popupRef.current && !popupRef.current.contains(event.target)) {
				setShowPopup(false);
			}
		}
		if (showPopup) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showPopup]);

	const handleFormChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleFormSubmit = async (e) => {
		e.preventDefault();
		if (!form.phone || form.phone.trim() === '') {
			alert('Phone number is required.');
			return;
		}
		const user_id = Number(localStorage.getItem('user_id'));
		const payload = {
			name: form.name,
			email: form.email,
			phone_number: `+${form.phone}`,
			company_name: form.company,
			tags: form.tags,
			user_id,
		};
		try {
			const res = await fetch(`${API_BASE_URL}/contact/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
					'ngrok-skip-browser-warning': 'true',
				},
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const data = await res.json();
				alert(data.message || 'Failed to create contact');
			} else {
				setShowModal(false);
				setForm({ name: '', phone: '', email: '', company: '', tags: '' });
				alert('Contact created successfully');
				fetchContacts();
			}
		} catch (err) {
			alert('Network error');
		}
	};

	const handleEditClick = (contact) => {
		setEditForm({
			contact_id: contact.contact_id,
			name: contact.contact_name || '',
			phone: contact.phone_number || '',
			email: contact.email_address || '',
			company: contact.company_name || '',
			tags: contact.tags || '',
		});
		setShowEditModal(true);
	};

	const handleEditFormChange = (e) => {
		setEditForm({ ...editForm, [e.target.name]: e.target.value });
	};

	const handleEditFormSubmit = async (e) => {
		e.preventDefault();
		const payload = {
			name: editForm.name,
			email: editForm.email,
			phone_number: editForm.phone,
			company_name: editForm.company,
			tags: editForm.tags,
		};
		try {
			const res = await fetch(`${API_BASE_URL}/contact/${editForm.contact_id}/edit`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
					'ngrok-skip-browser-warning': 'true',
				},
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const data = await res.json();
				alert(data.message || 'Failed to update contact');
			} else {
				setShowEditModal(false);
				alert('Contact updated successfully');
				fetchContacts();
			}
		} catch (err) {
			alert('Network error');
		}
	};

	const filteredContacts = contacts.filter(c => {
		const q = searchValue.trim().toLowerCase();
		return (
			c.contact_name?.toLowerCase().includes(q) ||
			c.phone_number?.toLowerCase().includes(q) ||
			c.email_address?.toLowerCase().includes(q) ||
			c.company_name?.toLowerCase().includes(q) ||
			(c.tags ? c.tags.toLowerCase().includes(q) : false)
		);
	});

	return (
		<div className="p-8 bg-[#f8f9fb] min-h-screen">
			<header className="fixed top-0 left-0 w-full z-10 bg-transparent">
				<div
					className={`absolute top-0 ${sidebarCollapsed ? 'left-16 w-[calc(100%-4rem)]' : 'left-64 w-[calc(100%-16rem)]'} bg-white px-8 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300`}
					style={{ transitionProperty: 'left, width' }}
				>
					<h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Lead Generation AI</h1>
				</div>
			</header>
			<div className="pt-24 flex items-center justify-between mb-4 relative">
				<span className="text-lg text-gray-700">
					<span className="inline-block mr-2">&larr;</span>
					Add client phone numbers to enhance communication for the campaign
				</span>
				<div className="relative">
					<button
						className="bg-[#01B0F1] text-white px-10 py-2 rounded-lg font-medium shadow hover:bg-[#007fd1] transition min-w-[200px] text-base"
						onClick={() => setShowPopup(!showPopup)}
					>
						+ Add Contact
					</button>
					{showPopup && (
						<div
							ref={popupRef}
							className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
						>
							<button
								className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-200 text-gray-800 font-medium"
								onClick={() => { setShowModal(true); setShowPopup(false); }}
							>
								+ Create new contact
							</button>
							<button
								className="w-full text-left px-4 py-3 hover:bg-gray-100 text-gray-800 font-medium"
								onClick={() => document.getElementById('importFileInput').click()}
							>
								+ Import CSV
							</button>
							<input
								type="file"
								id="importFileInput"
								className="hidden"
								accept=".csv"
								onChange={e => {
									const file = e.target.files[0];
									if (file) {
										handleCSVImport(file, fetchContacts);
									}
								}}
							/>
						</div>
					)}
				</div>
			</div>
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
					<div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative">
						<button
							className="absolute top-6 right-6 text-gray-500 hover:text-red-500 text-2xl"
							onClick={() => setShowModal(false)}
						>
							&#10006;
						</button>
						<h3 className="text-2xl font-semibold mb-8">Create Contact</h3>
						<form onSubmit={handleFormSubmit} className="space-y-6">
							<div>
								<label className="block text-base font-medium mb-2">Contact Name <span className="text-red-500">*</span></label>
								<input
									type="text" name="name" value={form.name} onChange={handleFormChange}
									placeholder="Contact Name" required
									className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
								/>
							</div>
							<div className="flex flex-col md:flex-row gap-6">
								<div className="flex-1">
									<label className="block text-base font-medium mb-2">Phone Number <span className="text-red-500">*</span></label>
									<PhoneInput
										country={'in'} value={form.phone} onChange={phone => setForm({ ...form, phone })}
										inputClass="!w-full !px-4 !py-2 !rounded-lg !border !border-gray-300 focus:!outline-none focus:!ring-2 focus:!ring-[#009ef7] !pl-12"
									/>
								</div>
								<div className="flex-1">
									<label className="block text-base font-medium mb-2">Email Address</label>
									<input
										type="email" name="email" value={form.email} onChange={handleFormChange}
										placeholder="Email Address"
										className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
									/>
								</div>
							</div>
							<div>
								<label className="block text-base font-medium mb-2">Company Name</label>
								<input
									type="text" name="company" value={form.company} onChange={handleFormChange}
									placeholder="Company Name"
									className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
								/>
							</div>
							<div>
								<label className="block text-base font-medium mb-2">Tags</label>
								<input
									type="text" name="tags" value={form.tags} onChange={handleFormChange}
									placeholder="Tags"
									className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
								/>
							</div>
							<div className="pt-2">
								<button
									type="submit"
									className="w-full bg-[#009ef7] text-white py-2 rounded-lg font-medium shadow hover:bg-[#007fd1] transition"
								>
									Save Contact
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
			{showEditModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
					<div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative">
						<button
							className="absolute top-6 right-6 text-gray-500 hover:text-red-500 text-2xl"
							onClick={() => setShowEditModal(false)}
						>
							&#10006;
						</button>
						<h3 className="text-2xl font-semibold mb-8">Edit Contact</h3>
						<form onSubmit={handleEditFormSubmit} className="space-y-6">
							<div>
								<label className="block text-base font-medium mb-2">Contact Name <span className="text-red-500">*</span></label>
								<input
									type="text" name="name" value={editForm.name} onChange={handleEditFormChange}
									placeholder="Contact Name" required
									className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
								/>
							</div>
							<div className="flex flex-col md:flex-row gap-6">
								<div className="flex-1">
									<label className="block text-base font-medium mb-2">Phone Number <span className="text-red-500">*</span></label>
									<input
										type="text" name="phone" value={editForm.phone} onChange={handleEditFormChange}
										placeholder="Phone Number" required
										className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
									/>
								</div>
								<div className="flex-1">
									<label className="block text-base font-medium mb-2">Email Address</label>
									<input
										type="email" name="email" value={editForm.email} onChange={handleEditFormChange}
										placeholder="Email Address"
										className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
									/>
								</div>
							</div>
							<div>
								<label className="block text-base font-medium mb-2">Company Name</label>
								<input
									type="text" name="company" value={editForm.company} onChange={handleEditFormChange}
									placeholder="Company Name"
									className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
								/>
							</div>
							<div>
								<label className="block text-base font-medium mb-2">Tags</label>
								<input
									type="text" name="tags" value={editForm.tags} onChange={handleEditFormChange}
									placeholder="Tags"
									className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
								/>
							</div>
							<div className="pt-2">
								<button
									type="submit"
									className="w-full bg-[#009ef7] text-white py-2 rounded-lg font-medium shadow hover:bg-[#007fd1] transition"
								>
									Save Changes
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
			<div className="mb-6">
				<input
					type="text"
					placeholder="Search contacts with name, phone, email, company, or tags"
					className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#009ef7]"
					value={searchValue}
					onChange={e => setSearchValue(e.target.value)}
				/>
			</div>
			<div className="bg-white rounded-xl shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm">
						<thead className="bg-gray-50 border-b border-gray-200">
							<tr className="text-gray-600 font-medium">
								<th className="py-3 px-4">Contact Name</th>
								<th className="py-3 px-4">Phone Number</th>
								<th className="py-3 px-4">Email Address</th>
								<th className="py-3 px-4">Company Name</th>
								<th className="py-3 px-4">Tags</th>
								<th className="py-3 px-4 text-center">Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredContacts.map((c, idx) => (
								<tr key={c.contact_id || idx} className="border-t border-gray-200 hover:bg-gray-50">
									<td className="py-3 px-4 align-middle">{c.contact_name || c.name}</td>
									<td className="py-3 px-4 align-middle">
										<div className="flex items-center gap-2">
											<Phone size={16} className="text-gray-500" />
											{c.phone_number || c.phone}
										</div>
									</td>
									<td className="py-3 px-4 align-middle">{c.email_address || c.email}</td>
									<td className="py-3 px-4 align-middle">{c.company_name || c.company}</td>
									<td className="py-3 px-4 align-middle">
										<div className="flex items-center gap-2">
											<Users size={16} className="text-gray-500" />
											{c.tags}
										</div>
									</td>
									<td className="py-3 px-4 align-middle">
										<div className="flex items-center justify-center gap-2">
											<button className="p-2 rounded-full hover:bg-blue-100" onClick={() => handleEditClick(c)}>
												<Edit2 size={16} className="text-blue-500" />
											</button>
											<button className="p-2 rounded-full hover:bg-red-100" onClick={() => { setShowDeleteModal(true); setDeleteIdx(idx); }}>
												<Trash2 size={16} className="text-red-500" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
			{showDeleteModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
					<div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
						<h3 className="text-xl font-semibold mb-4">Are you sure?</h3>
						<p className="mb-6 text-gray-600">You are about to delete this contact. This action cannot be undone.</p>
						<div className="flex gap-4 justify-end">
							<button
								className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300"
								onClick={() => setShowDeleteModal(false)}
							>
								Cancel
							</button>
							<button
								className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600"
								onClick={async () => {
									setShowDeleteModal(false);
									const contact = contacts[deleteIdx];
									if (!contact || !contact.contact_id) return;
									try {
										const res = await fetch(`${API_BASE_URL}/contact/${contact.contact_id}`, {
											method: 'DELETE',
											headers: {
												'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
												'ngrok-skip-browser-warning': 'true',
											},
										});
										if (res.ok) {
											alert('Contact deleted successfully');
											fetchContacts();
										} else {
											const data = await res.json();
											alert(data.message || 'Failed to delete contact');
										}
									} catch {
										alert('Network error');
									}
								}}
							>
								Confirm
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default ContactDirectoryScreen;