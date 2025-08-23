import React, { useEffect, useState } from "react";
import axios from "axios";

function EditCampaign({ batchId }) {
    const [campaign, setCampaign] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [form, setForm] = useState({});

    useEffect(() => {
        // Fetch all campaigns
        axios.get("/api/campaigns").then(res => {
            const found = res.data.find(c => c.batch_id === batchId);
            setCampaign(found);
            if (found) setForm(found); // Prefill campaign form
        });

        // Fetch all contacts
        axios.get("/api/contacts").then(res => {
            // Find contacts whose contact_id is in campaign.contact_ids
            const filtered = res.data.filter(contact =>
                campaign?.contact_ids?.includes(contact.contact_id)
            );
            setContacts(filtered);
        });
    }, [batchId, campaign?.contact_ids]);

    // ...form handlers and rendering logic...

    return (
        <div>
            <h2>Edit Campaign</h2>
            {/* Render campaign form with prefilled values from `form` */}
            {/* Render contacts list and add/edit contact form, prefilled if editing */}
        </div>
    );
}

export default EditCampaign;