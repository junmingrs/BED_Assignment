// public/js/nea-inspections.js
const token = sessionStorage.getItem(SS_KEYS.accessToken);

let allInspections = [];
let allStalls = [];
let allHawkerCentres = [];
let stallMap = {};
let hawkerMap = {};

// ===== DOM Elements =====
const container = document.getElementById('inspection-container');
const searchInput = document.getElementById('search-stall');
const gradeFilter = document.getElementById('filter-grade');
const hawkerFilter = document.getElementById('filter-hawker');
const resetBtn = document.getElementById('reset-filter-btn');
const resultCount = document.getElementById('filter-result-count');

// Modal
const modal = document.getElementById('inspection-modal');
const modalTitle = document.getElementById('modal-title');
const addBtn = document.getElementById('add-inspection-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const modalForm = document.getElementById('inspection-form');
const modalMessage = document.getElementById('modal-message');
const inspectionIdInput = document.getElementById('modal-inspection-id');
const stallSelect = document.getElementById('modal-stall-id');
const dateInput = document.getElementById('modal-date');
const scoreModeNote = document.getElementById('modal-schedule-note');
const scoreInput = document.getElementById('modal-score');
const gradeSelect = document.getElementById('modal-grade');
const remarksInput = document.getElementById('modal-remarks');

let isEditing = false;

// ===== Check token =====
function checkToken() {
    if (!token) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-sm text-red-500">⚠️ You are not logged in. Please log in as NEA officer.</p>
                <a href="/login.html" class="text-blue-600 hover:underline">Go to Login</a>
            </div>
        `;
        return false;
    }
    return true;
}

// ===== Load hawker centres =====
async function loadHawkerCentres() {
    try {
        const res = await fetch('/hawkercentre', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            allHawkerCentres = await res.json();
            hawkerMap = {};
            allHawkerCentres.forEach(hc => {
                hawkerMap[hc.hawker_centre_id] = hc.centre_name;
            });
            populateHawkerDropdown();
        }
    } catch (err) {
        console.warn('Failed to load hawker centres:', err);
    }
}

function populateHawkerDropdown() {
    hawkerFilter.innerHTML = '<option value="all">All Hawker Centres</option>';
    allHawkerCentres.forEach(hc => {
        const option = document.createElement('option');
        option.value = hc.hawker_centre_id;
        option.textContent = hc.centre_name;
        hawkerFilter.appendChild(option);
    });
}

// ===== Load inspections =====
async function loadInspections() {
    if (!checkToken()) return;

    try {
        // 1. Load hawker centres first
        await loadHawkerCentres();

        // 2. Get all stalls
        const stallRes = await fetch('/stalls', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!stallRes.ok) {
            const errorData = await stallRes.json().catch(() => ({}));
            console.error('API error:', errorData);
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-sm text-red-500">⚠️ Failed to load stalls: ${errorData.error || 'Unknown error'}</p>
                    <p class="text-xs text-gray-400 mt-2">Status: ${stallRes.status}</p>
                </div>
            `;
            return;
        }

        const data = await stallRes.json();

        if (!Array.isArray(data)) {
            console.error('Data is not an array:', data);
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-sm text-red-500">⚠️ Invalid data format from server.</p>
                </div>
            `;
            return;
        }

        allStalls = data;
        stallMap = {};
        allStalls.forEach(s => { stallMap[s.stall_id] = s.stall_name; });

        // 3. Get all inspections
        let allInspectionsData = [];
        for (const stall of allStalls) {
            const res = await fetch(`/stalls/${stall.stall_id}/inspections`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const inspections = await res.json();
                if (Array.isArray(inspections)) {
                    inspections.forEach(insp => {
                        insp.stall_name = stall.stall_name;
                        insp.stall_unit_no = stall.stall_unit_no;
                        insp.hawker_centre_id = stall.hawker_centre_id;
                        allInspectionsData.push(insp);
                    });
                }
            } else {
                console.warn(`Failed to fetch inspections for ${stall.stall_name}: ${res.status}`);
            }
        }

        allInspections = allInspectionsData.sort((a, b) =>
            new Date(b.inspection_date) - new Date(a.inspection_date)
        );

        populateStallDropdown();
        applyFilters();

    } catch (err) {
        console.error('Failed to load inspections:', err);
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-sm text-red-500">⚠️ Error: ${err.message}</p>
            </div>
        `;
    }
}

// ===== Populate stall dropdown =====
function populateStallDropdown() {
    if (!stallSelect) return;
    stallSelect.innerHTML = '<option value="">Select a stall...</option>';
    allStalls.forEach(stall => {
        const option = document.createElement('option');
        option.value = stall.stall_id;
        option.textContent = `${stall.stall_name} (${stall.stall_unit_no || '-'})`;
        stallSelect.appendChild(option);
    });
}

// ===== Apply filters =====
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const gradeFilterVal = gradeFilter.value;
    const hawkerFilterVal = hawkerFilter.value;

    let filtered = allInspections.filter(insp => {
        // Search filter
        if (searchTerm && !insp.stall_name.toLowerCase().includes(searchTerm)) return false;
        // Grade filter
        if (gradeFilterVal !== 'all' && insp.hygiene_grade !== gradeFilterVal) return false;
        // Hawker Centre filter
        if (hawkerFilterVal !== 'all' && insp.hawker_centre_id !== hawkerFilterVal) return false;
        return true;
    });

    renderInspections(filtered);
    resultCount.textContent = `Showing ${filtered.length} of ${allInspections.length} inspections`;
}

// ===== Render inspections table =====
function renderInspections(inspections) {
    if (inspections.length === 0) {
        container.innerHTML = `<div class="text-center py-8"><p class="text-sm text-gray-400">No inspections found.</p></div>`;
        return;
    }

    let html = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm table-fixed">
                <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                        <th class="w-[14%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stall</th>
                        <th class="w-[9%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th class="w-[11%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th class="w-[9%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        <th class="w-[7%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                        <th class="w-[9%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="w-[31%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                        <th class="w-[10%] px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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

        // status may be undefined on rows fetched before the backend added this column;
        // treat that as "Completed" so existing data doesn't visually break
        const status = insp.status || 'Completed';
        const statusLabel = status === 'Scheduled' ? 'Upcoming' : 'Complete';
        const statusColor = status === 'Scheduled'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-emerald-100 text-emerald-700';

        // scheduled inspections have no score/grade yet
        const scoreDisplay = insp.score !== null && insp.score !== undefined ? `${insp.score}/100` : '—';
        const gradeDisplay = insp.hygiene_grade
            ? `<span class="inline-block px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor}">${insp.hygiene_grade}</span>`
            : `<span class="text-gray-400">—</span>`;

        html += `
            <tr class="border-b hover:bg-gray-50 transition-colors">
                <td class="px-3 py-2 font-medium text-gray-800 truncate">${insp.stall_name}</td>
                <td class="px-3 py-2 text-gray-600">${insp.stall_unit_no || '-'}</td>
                <td class="px-3 py-2 text-gray-600">${date}</td>
                <td class="px-3 py-2 font-medium">${scoreDisplay}</td>
                <td class="px-3 py-2">${gradeDisplay}</td>
                <td class="px-3 py-2">
                    <span class="inline-block px-2 py-0.5 rounded-full text-xs font-bold ${statusColor}">
                        ${statusLabel}
                    </span>
                </td>
                <td class="px-3 py-2 text-gray-600 break-words">${insp.remarks || '-'}</td>
                <td class="px-3 py-2 text-center whitespace-nowrap">
                    <button class="edit-inspection-btn text-blue-500 hover:text-blue-700 transition mr-1" 
                            data-inspection-id="${insp.inspection_id}" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button class="delete-inspection-btn text-red-500 hover:text-red-700 transition" 
                            data-inspection-id="${insp.inspection_id}" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;

    // Attach edit event listeners
    document.querySelectorAll('.edit-inspection-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const inspectionId = btn.dataset.inspectionId;
            openEditModal(inspectionId);
        });
    });

    // Attach delete event listeners
    document.querySelectorAll('.delete-inspection-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const inspectionId = btn.dataset.inspectionId;
            deleteInspection(inspectionId);
        });
    });
}

// ===== Delete inspection =====
async function deleteInspection(inspectionId) {
    if (!confirm('Are you sure you want to delete this inspection?')) return;

    try {
        const res = await fetch(`/inspections/${inspectionId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
            alert('✅ Inspection deleted!');
            await loadInspections();
        } else {
            const data = await res.json().catch(() => ({}));
            alert(`❌ Failed: ${data.error || 'Unknown error'}`);
        }
    } catch (err) {
        console.error(err);
        alert('❌ Network error.');
    }
}

// ===== Open modal for editing =====
async function openEditModal(inspectionId) {
    try {
        const res = await fetch(`/inspections/${inspectionId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            alert('Failed to load inspection details.');
            return;
        }

        const insp = await res.json();

        isEditing = true;
        modalTitle.textContent = 'Edit Inspection';
        inspectionIdInput.value = insp.inspection_id;
        stallSelect.value = insp.stall_id;
        if (insp.inspection_date) {
            const d = new Date(insp.inspection_date);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            dateInput.value = d.toISOString().slice(0, 16);
        }
        scoreInput.value = insp.score;
        gradeSelect.value = insp.hygiene_grade;
        remarksInput.value = insp.remarks || '';

        showModal();
    } catch (err) {
        console.error(err);
        alert('❌ Error loading inspection data.');
    }
}

// ===== Open modal for adding =====
function openAddModal() {
    isEditing = false;
    modalTitle.textContent = 'Add New Inspection';
    inspectionIdInput.value = '';
    modalForm.reset();
    // default to right now, in the format datetime-local expects
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.value = now.toISOString().slice(0, 16);
    showModal();
}

// ===== Show/hide modal =====
function showModal() { modal.classList.remove('hidden'); }
function hideModal() {
    modal.classList.add('hidden');
    modalMessage.classList.add('hidden');
    modalMessage.textContent = '';
}

// ===== Toggle score/grade requirement based on whether the date is in the future =====
function updateScheduleModeUI() {
    if (!dateInput.value) return;
    const isFuture = new Date(dateInput.value) > new Date();

    scoreInput.required = !isFuture;
    gradeSelect.required = !isFuture;

    if (scoreModeNote) {
        scoreModeNote.textContent = isFuture
            ? 'Future date selected — this will be scheduled. Score and grade can be filled in later.'
            : '';
        scoreModeNote.classList.toggle('hidden', !isFuture);
    }
}
dateInput?.addEventListener('change', updateScheduleModeUI);

addBtn.addEventListener('click', openAddModal);
closeModalBtn.addEventListener('click', hideModal);
cancelModalBtn.addEventListener('click', hideModal);
modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });

// ===== Submit form (Add or Edit) =====
modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const stallId = stallSelect.value;
    const dateValue = dateInput.value;
    const score = parseInt(scoreInput.value);
    const hygiene_grade = gradeSelect.value;
    const remarks = remarksInput.value.trim();

    if (!stallId || !dateValue) {
        showModalMessage('Please select a stall and date.', 'red');
        return;
    }

    const selectedDate = new Date(dateValue);
    const isFutureDate = selectedDate > new Date();

    // Editing an existing inspection always goes through the original update flow
    // (editing doesn't currently support re-scheduling a Completed inspection)
    if (isEditing) {
        if (isNaN(score) || score < 0 || score > 100 || !hygiene_grade) {
            showModalMessage('Please fill all fields correctly.', 'red');
            return;
        }

        const inspectionId = inspectionIdInput.value;
        try {
            const res = await fetch(`/inspections/${inspectionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ score, remarks, hygiene_grade })
            });

            if (res.ok) {
                showModalMessage('✅ Inspection updated successfully!', 'green');
                setTimeout(() => { hideModal(); loadInspections(); }, 1000);
            } else {
                const data = await res.json().catch(() => ({}));
                showModalMessage(`❌ Failed: ${data.error || 'Unknown error'}`, 'red');
            }
        } catch (err) {
            console.error(err);
            showModalMessage('❌ Network error.', 'red');
        }
        return;
    }

    // New inspection: future date -> schedule it (no score/grade needed yet)
    if (isFutureDate) {
        try {
            const res = await fetch(`/stalls/${stallId}/inspections/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ inspection_date: selectedDate.toISOString() })
            });

            if (res.ok) {
                showModalMessage('✅ Inspection scheduled successfully!', 'green');
                setTimeout(() => { hideModal(); loadInspections(); }, 1000);
            } else {
                const data = await res.json().catch(() => ({}));
                showModalMessage(`❌ Failed: ${data.error || 'Unknown error'}`, 'red');
            }
        } catch (err) {
            console.error(err);
            showModalMessage('❌ Network error.', 'red');
        }
        return;
    }

    // New inspection: today/past date -> log it as completed immediately (original flow)
    if (isNaN(score) || score < 0 || score > 100 || !hygiene_grade) {
        showModalMessage('Score and grade are required for a completed inspection.', 'red');
        return;
    }

    try {
        const res = await fetch(`/stalls/${stallId}/inspections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ score, remarks, hygiene_grade })
        });

        if (res.ok) {
            showModalMessage('✅ Inspection added successfully!', 'green');
            setTimeout(() => { hideModal(); loadInspections(); }, 1000);
        } else {
            const data = await res.json().catch(() => ({}));
            showModalMessage(`❌ Failed: ${data.error || 'Unknown error'}`, 'red');
        }
    } catch (err) {
        console.error(err);
        showModalMessage('❌ Network error.', 'red');
    }
});

function showModalMessage(msg, type) {
    modalMessage.textContent = msg;
    modalMessage.className = `mt-3 rounded-lg p-3 text-center text-sm ${
        type === 'green' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`;
    modalMessage.classList.remove('hidden');
}

// ===== Event listeners for filters =====
searchInput.addEventListener('input', applyFilters);
gradeFilter.addEventListener('change', applyFilters);
hawkerFilter.addEventListener('change', applyFilters);
resetBtn.addEventListener('click', () => {
    searchInput.value = '';
    gradeFilter.value = 'all';
    hawkerFilter.value = 'all';
    applyFilters();
});

// ===== Init =====
loadInspections();