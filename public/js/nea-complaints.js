// public/js/nea-complaints.js
const token = sessionStorage.getItem(SS_KEYS.accessToken);

let allComplaints = [];

async function loadComplaints() {
    try {
        const stallRes = await fetch('/stalls', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const stalls = await stallRes.json();

        let complaintsData = [];
        for (const stall of stalls) {
            const res = await fetch(`/stalls/${stall.stall_id}/complaints`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const complaints = await res.json();
                complaints.forEach(c => {
                    c.stall_name = stall.stall_name;
                    c.stall_unit_no = stall.stall_unit_no;
                    complaintsData.push(c);
                });
            }
        }

        allComplaints = complaintsData.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );

        applyFilters();

    } catch (err) {
        console.error('Failed to load complaints:', err);
        document.getElementById('complaint-container').innerHTML =
            `<p class="text-sm text-red-500">Error loading complaints: ${err.message}</p>`;
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('search-stall').value.toLowerCase().trim();
    const statusFilter = document.getElementById('filter-status').value;

    let filtered = allComplaints.filter(c => {
        if (searchTerm && !c.stall_name.toLowerCase().includes(searchTerm)) return false;
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        return true;
    });

    renderComplaints(filtered);
    document.getElementById('filter-result-count').textContent =
        `Showing ${filtered.length} of ${allComplaints.length} complaints`;
}

function renderComplaints(complaints) {
    const container = document.getElementById('complaint-container');

    if (complaints.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 text-center py-8">No complaints found.</p>';
        return;
    }

    let html = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stall</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                </thead>
                <tbody>
    `;

    complaints.forEach(c => {
        const date = new Date(c.created_at).toLocaleDateString('en-SG');
        const statusStyle = {
            'Open': 'bg-red-100 text-red-700',
            'Investigating': 'bg-amber-100 text-amber-700',
            'Resolved': 'bg-green-100 text-green-700',
            'Closed': 'bg-gray-100 text-gray-500'
        } [c.status] || 'bg-gray-100 text-gray-500';

        html += `
            <tr class="border-b hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 font-medium text-gray-800">${c.stall_name}</td>
                <td class="px-4 py-3 text-gray-700 max-w-xs truncate">${c.subject}</td>
                <td class="px-4 py-3 text-gray-600 max-w-xs truncate">${c.description || '-'}</td>
                <td class="px-4 py-3">
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-bold ${statusStyle}">
                        ${c.status}
                    </span>
                </td>
                <td class="px-4 py-3 text-gray-500">${date}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

// ===== Event listeners =====
document.getElementById('search-stall')?.addEventListener('input', applyFilters);
document.getElementById('filter-status')?.addEventListener('change', applyFilters);
document.getElementById('reset-filter-btn')?.addEventListener('click', () => {
    document.getElementById('search-stall').value = '';
    document.getElementById('filter-status').value = 'all';
    applyFilters();
});

// ===== Init =====
loadComplaints();