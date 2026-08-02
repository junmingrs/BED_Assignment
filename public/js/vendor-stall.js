// public/js/vendor-stall.js
import { getAccount, signOut } from "./helper.js";
const signoutBtn = document.getElementById("signout-btn");
const token = sessionStorage.getItem(SS_KEYS.accessToken);

function getAccountIdFromToken() {
    if (!token) return null;
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));
        return payload.id;
    } catch (err) {
        console.error("Failed to decode token:", err);
        return null;
    }
}

// ===== Tab switching =====
const tabInfo = document.getElementById("tab-info");
const tabInspections = document.getElementById("tab-inspections");
const panelInfo = document.getElementById("panel-info");
const panelInspections = document.getElementById("panel-inspections");

tabInfo.addEventListener("click", () => {
    tabInfo.className =
        "px-4 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600 transition";
    tabInspections.className =
        "px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 transition";
    panelInfo.classList.remove("hidden");
    panelInspections.classList.add("hidden");
});

tabInspections.addEventListener("click", () => {
    tabInspections.className =
        "px-4 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600 transition";
    tabInfo.className =
        "px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 transition";
    panelInspections.classList.remove("hidden");
    panelInfo.classList.add("hidden");
    loadInspections();
});

// ===== Load stall info using vendorId from token =====
async function loadStallInfo() {
    const vendorId = getAccountIdFromToken();
    if (!vendorId) {
        document.getElementById("stall-name").textContent =
            "No vendor ID found";
        return;
    }

    try {
        const user = await getAccount(token);

        const stallIdRes = await fetch(`/vendors/${vendorId}/stall`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!stallIdRes.ok) {
            console.error("Failed to get stall ID:", stallIdRes.status);
            return;
        }

        const stallId = await stallIdRes.json();

        const stallRes = await fetch(`/stalls/${stallId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!stallRes.ok) {
            console.error("Failed to get stall info:", stallRes.status);
            return;
        }

        const stall = await stallRes.json();
        const stallData = stall.stall || stall;

        document.getElementById("stall-name").textContent =
            stallData.stall_name || "-";
        document.getElementById("stall-unit").textContent =
            stallData.stall_unit_no || "-";
        document.getElementById("hawker-centre").textContent =
            stallData.hawker_centre_name || stallData.hawkerCentre || "-";
        document.getElementById("vendor-id").textContent =
            stallData.vendor_id || vendorId;
        document.getElementById("vendor-email").textContent =
            user.account_email || "Not available";

        // ===== 租约信息（使用 /rentalagreement API） =====
        try {
            const leaseRes = await fetch(
                `/rentalagreement?stallId=${stallId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (leaseRes.ok) {
                const leases = await leaseRes.json();
                // 查找当前有效的租约（status 为 'Active'）
                const activeLease = leases.find((l) => l.status === "Active");
                if (activeLease) {
                    const start = new Date(
                        activeLease.start_date,
                    ).toLocaleDateString("en-SG");
                    const end = new Date(
                        activeLease.end_date,
                    ).toLocaleDateString("en-SG");
                    document.getElementById("rental-agreement").textContent =
                        `$${activeLease.rental_fee}/month (${start} - ${end})`;
                } else if (leases.length > 0) {
                    // 如果没有 active 的，显示最近一条（按 start_date 排序取第一个）
                    const sorted = leases.sort(
                        (a, b) =>
                            new Date(b.start_date) - new Date(a.start_date),
                    );
                    const latest = sorted[0];
                    const start = new Date(
                        latest.start_date,
                    ).toLocaleDateString("en-SG");
                    const end = new Date(latest.end_date).toLocaleDateString(
                        "en-SG",
                    );
                    document.getElementById("rental-agreement").textContent =
                        `$${latest.rental_fee}/month (${start} - ${end}) - ${latest.status}`;
                } else {
                    document.getElementById("rental-agreement").textContent =
                        "No rental agreement";
                }
            } else {
                document.getElementById("rental-agreement").textContent =
                    "No rental agreement";
            }
        } catch (err) {
            console.warn("Could not fetch rental agreement:", err);
            document.getElementById("rental-agreement").textContent =
                "Rental info unavailable";
        }

        window.currentStallId = stallId;
    } catch (err) {
        console.error("Failed to load stall info:", err);
    }
}

// ===== Load inspections =====
async function loadInspections() {
    const container = document.getElementById("inspection-container");
    const stallId = window.currentStallId;

    if (!stallId) {
        container.innerHTML =
            '<p class="text-sm text-red-500">No stall found.</p>';
        return;
    }

    try {
        const res = await fetch(`/stalls/${stallId}/inspections`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
            container.innerHTML = `<p class="text-sm text-red-500">${data.error || "Failed to load inspections"}</p>`;
            return;
        }

        if (data.length === 0) {
            container.innerHTML = `
                <div class="py-8 text-center text-sm text-gray-400">
                    No inspection records found for your stall.
                </div>
            `;
            document.getElementById("inspection-count").textContent =
                "0 records";
            return;
        }

        document.getElementById("inspection-count").textContent =
            `${data.length} records`;

        let html = `
            <div class="overflow-x-auto">
                <table class="w-full min-w-[360px] text-sm">
                    <thead>
                        <tr class="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                            <th class="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Date</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Score</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Hygiene Grade</th>
                            <th class="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Remarks</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
        `;

        data.forEach((inspection) => {
            const date = new Date(
                inspection.inspection_date,
            ).toLocaleDateString("en-SG");
            const gradeConfig = {
                A: {
                    bg: "bg-emerald-100",
                    text: "text-emerald-700",
                    emoji: "🟢",
                },
                B: { bg: "bg-blue-100", text: "text-blue-700", emoji: "🔵" },
                C: { bg: "bg-amber-100", text: "text-amber-700", emoji: "🟡" },
                D: { bg: "bg-rose-100", text: "text-rose-700", emoji: "🔴" },
            }[inspection.hygiene_grade] || {
                bg: "bg-gray-100",
                text: "text-gray-600",
                emoji: "⚪",
            };

            const scoreColor =
                inspection.score >= 80
                    ? "text-emerald-600"
                    : inspection.score >= 60
                        ? "text-amber-600"
                        : "text-rose-600";

            html += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-3 whitespace-nowrap font-medium text-gray-700">${date}</td>
                    <td class="px-4 py-3 whitespace-nowrap font-bold ${scoreColor}">${inspection.score}/100</td>
                    <td class="px-4 py-3 whitespace-nowrap">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${gradeConfig.bg} ${gradeConfig.text}">
                            ${gradeConfig.emoji} ${inspection.hygiene_grade}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-gray-600 max-w-xs truncate">${inspection.remarks || "-"}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    } catch (err) {
        console.error("Failed to load inspections:", err);
        container.innerHTML =
            '<p class="text-sm text-red-500">Network error. Please try again.</p>';
    }
}

signoutBtn.addEventListener("click", signOut);

// ===== Init =====
loadStallInfo();
