// public/js/nea-hawkers.js
const token = sessionStorage.getItem(SS_KEYS.accessToken);

async function loadHawkerCentres() {
    const container = document.getElementById('hawker-container');

    try {
        // 1. 获取所有 hawker centres
        const hcRes = await fetch('/hawkercentre', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const hawkerCentres = await hcRes.json();
        if (!hcRes.ok) throw new Error('Failed to load hawker centres');

        if (hawkerCentres.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500 text-center py-8 col-span-full">No hawker centres found.</p>';
            return;
        }

        // 2. 对每个 hawker centre，调用详情接口获取 stalls
        let html = '';
        for (const hc of hawkerCentres) {
            const detailRes = await fetch(`/hawkercentre/${hc.hawker_centre_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const detail = await detailRes.json();
            const stalls = detail.stalls || [];

            const stallList = stalls.length > 0
                ? stalls.map(s => `<li class="text-sm text-gray-600">${s.stall_name} (${s.stall_unit_no || '-'})</li>`).join('')
                : '<li class="text-sm text-gray-400">No stalls</li>';

            html += `
                <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                    <h2 class="text-xl font-semibold text-gray-800">${hc.centre_name}</h2>
                    <p class="text-sm text-gray-500 mt-1">${hc.address || 'Address not available'}</p>
                    <div class="mt-4 pt-4 border-t border-gray-100">
                        <p class="text-sm font-medium text-gray-700">Stalls (${stalls.length})</p>
                        <ul class="mt-2 space-y-1">
                            ${stallList}
                        </ul>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

    } catch (err) {
        console.error('Failed to load hawker centres:', err);
        container.innerHTML = `<p class="text-sm text-red-500 col-span-full">Error loading hawker centres: ${err.message}</p>`;
    }
}

// ===== Init =====
loadHawkerCentres();