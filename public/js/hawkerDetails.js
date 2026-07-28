import { LS_KEYS } from "./const.js";

const params = new URLSearchParams(window.location.search);
const agreementId = params.get("id");

const messageEl = document.getElementById("message");
const card = document.getElementById("detailsCard");

async function loadDetails() {
    if (!agreementId) {
        messageEl.textContent =
            "No rental agreement id provided in the URL (e.g. ?id=...)";
        return;
    }

    try {
        const token = localStorage.getItem(LS_KEYS.authToken);
        const response = await fetch(`/rentalagreement/${agreementId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            messageEl.textContent = data.error || "Failed to load rental agreement";
            return;
        }

        document.getElementById("stallLabel").textContent =
            `Stall ${data.stall_id}`;
        document.getElementById("startDate").textContent =
            data.start_date?.split("T")[0] ?? "";
        document.getElementById("endDate").textContent =
            data.end_date?.split("T")[0] ?? "";
        document.getElementById("rentalFee").textContent =
            `$${Number(data.rental_fee).toFixed(2)}`;
        document.getElementById("operatorId").textContent = data.operator_id;

        const badge = document.getElementById("statusBadge");
        badge.textContent = data.status;
        badge.classList.add(data.status);

        card.style.display = "block";
    } catch (err) {
        console.error(err);
        messageEl.textContent =
            "Something went wrong while loading the rental agreement.";
    }
}

loadDetails();
