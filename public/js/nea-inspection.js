// public/js/nea-inspections.js
const token = sessionStorage.getItem(SS_KEYS.accessToken);

let allInspections = [];
let allStalls = [];
let stallMap = {};

async function loadInspections() {
    try {
        const stallRes = await fetch('/stalls', {
            headers: { Authorization: `Bearer ${token}` }
        });
        allStalls = await stallRes.json();
        stallMap = {};
        allStalls.forEach(s => { stallMap[s.stall_id] = s.stall_name; });

        let allInspectionsData = [];
        for (const stall of allStalls) {
            const res = await fetch(`/stalls/${stall.stall_id}/inspections`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const inspections = await res.json();
                inspections.forEach(insp => {
                    insp.stall_name = stall.stall_name;
                    insp.stall_unit_no = stall.stall_unit_no;
                    allInspectionsData.push(insp);
                });
            }
        }

        allInspections = allInspectionsData.sort((a, b) =>
            new Date(b.inspection_date) - new Date(a.inspection_date)
        );

        applyFilters();

    } catch (err) {
        console.error('Failed to load inspections:', err);
        document.getElementById('inspection-container').innerHTML =
            `<p class="text-sm text-red-500">Error loading inspections: ${err.message}</p>`;
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('search-stall').value.toLowerCase().trim();
    const gradeFilter = document.getElementById('filter-grade').value;

    let filtered = allInspections.filter(insp => {
        if (searchTerm && !insp.stall_name.toLowerCase().includes(searchTerm)) return false;
        if (gradeFilter !== 'all' && insp.hygiene_grade !== gradeFilter) return false;
        return true;
    });

    renderInspections(filtered);
    document.getElementById('filter-result-count').textContent =
        `Showing ${filtered.length} of ${allInspections.length} inspections`;
}

function renderInspections(inspections) {
    const container = document.getElementById('inspection-container');

    if (inspections.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 text-center py-8">No inspections found.</p>';
        return;
    }

    let html = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stall</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                    </tr>
                </thead>
                <tbody>
    `;

    inspections.forEach(insp => {
        const date = new Date(insp.inspection_date).toLocaleDateString('en-SG');
        const gradeColor = {
            'A': 'bg-green-100 text-green-700',
            'B': 'bg-blue-100 text-blue-700',
            'C': 'bg-amber-100 text-amber-700',
            'D': 'bg-red-100 text-red-700'
        } [insp.hygiene_grade] || 'bg-gray-100 text-gray-500';

        html += `
            <tr class="border-b hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 font-medium text-gray-800">${insp.stall_name}</td>
                <td class="px-4 py-3 text-gray-600">${insp.stall_unit_no || '-'}</td>
                <td class="px-4 py-3 text-gray-600">${date}</td>
                <td class="px-4 py-3 font-medium">${insp.score}/100</td>
                <td class="px-4 py-3">
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-bold ${gradeColor}">
                        ${insp.hygiene_grade}
                    </span>
                </td>
                <td class="px-4 py-3 text-gray-600 max-w-xs truncate">${insp.remarks || '-'}</td>
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
document.getElementById('filter-grade')?.addEventListener('change', applyFilters);
document.getElementById('reset-filter-btn')?.addEventListener('click', () => {
    document.getElementById('search-stall').value = '';
    document.getElementById('filter-grade').value = 'all';
    applyFilters();
});

// ===== Init =====
loadInspections();