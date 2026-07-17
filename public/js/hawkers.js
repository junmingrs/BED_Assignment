import { LS_KEYS } from "./const.js";

const tableBody = document.getElementById("agreementTableBody");
const messageEl = document.getElementById("message");
const stallSelect = document.getElementById("stallSelect");

const params = new URLSearchParams(window.location.search);
const initialStallId = params.get("stallId");

function authHeaders() {
    const token = localStorage.getItem(LS_KEYS.authToken);
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

async function loadStalls() {
    try {
        const response = await fetch("/stalls", {
            method: "GET",
            headers: authHeaders(),
        });
        console.log(response);
        const data = await response.json();

        if (!response.ok) {
            messageEl.textContent = data.error || "Failed to load stall list";
            return;
        }

        data.forEach((stall) => {
            const option = document.createElement("option");
            option.value = stall.stall_id;
            option.textContent = stall.stall_name;
            stallSelect.appendChild(option);
        });

        if (initialStallId) {
            stallSelect.value = initialStallId;
            loadAgreements(initialStallId);
        }
    } catch (err) {
        console.error(err);
        messageEl.textContent = "Something went wrong while loading stalls.";
    }
}

async function loadAgreements(stallId) {
    tableBody.innerHTML = "";
    messageEl.textContent = "";

    if (!stallId) {
        messageEl.textContent = "Select a stall to view its rental agreements.";
        return;
    }

    try {
        const response = await fetch(
            `/rentalagreement?stallId=${encodeURIComponent(stallId)}`,
            {
                method: "GET",
                headers: authHeaders(),
            },
        );

        const data = await response.json();

        if (!response.ok) {
            messageEl.textContent = data.error || "Failed to load rental agreements";
            return;
        }

        if (data.length === 0) {
            messageEl.textContent = "No rental agreements found for this stall.";
            return;
        }

        tableBody.innerHTML = data
            .map(
                (agreement) => `
        <tr>
          <td>${agreement.stall_id}</td>
          <td>${agreement.start_date?.split("T")[0] ?? ""}</td>
          <td>${agreement.end_date?.split("T")[0] ?? ""}</td>
          <td>$${Number(agreement.rental_fee).toFixed(2)}</td>
          <td><span class="status ${agreement.status}">${agreement.status}</span></td>
          <td><button class="view-btn" onclick="window.location.href='hawkerDetails.html?id=${agreement.rental_agreement_id}'">View</button></td>
        </tr>
      `,
            )
            .join("");
    } catch (err) {
        console.error(err);
        messageEl.textContent =
            "Something went wrong while loading rental agreements.";
    }
}

stallSelect.addEventListener("change", (e) => loadAgreements(e.target.value));

loadStalls();
