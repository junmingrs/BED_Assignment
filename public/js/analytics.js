// const { getStallId, getIdFromToken } = require("./helper");
import { getStallId, getIdFromToken } from "./helper.js";

const kpiElements = {
    totalRevenue: document.getElementById("kpi-revenue"),
    orderCount: document.getElementById("kpi-orders"),
    averageOrderValue: document.getElementById("kpi-aov"),
};

const token = localStorage.getItem(LS_KEYS.authToken);
const vendorId = await getIdFromToken(token);
const stallId = await getStallId(vendorId, token);

async function getKPIData(stallId) {
    try {
        const response = await fetch(`/vendor/analytics/kpi/${stallId}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        return await response.json();
    } catch (err) {
        console.error(err);
    }
}

async function loadUI() {
    const kpiData = await getKPIData(stallId);
    for (const [item, container] of Object.entries(kpiElements)) {
        if (item == "orderCount") {
            container.textContent = kpiData[item];
        } else {
            container.textContent = "$" + kpiData[item].toFixed(2);
        }
    }
}

loadUI();
