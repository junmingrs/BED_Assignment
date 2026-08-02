import { getIdFromToken } from "./helper.js";
const signoutBtn = document.getElementById("signout-btn");
const nameElement = document.getElementById("user-email");
const idElement = document.getElementById("user-id");
const token = sessionStorage.getItem(SS_KEYS.accessToken);

async function fetchAccount() {
    const accountId = getIdFromToken(token);

    try {
        const response = await fetch(`/account/${accountId}/profile`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await response.json();
        return data;
    } catch (e) {
        console.error("Error: ", e);
    }
}

function signOut() {
    sessionStorage.removeItem(SS_KEYS.accessToken);
    window.location.href = "/";
}

const user = await fetchAccount();
nameElement.textContent = user.account_email;
idElement.textContent = user.account_id;

signoutBtn.addEventListener("click", signOut);
