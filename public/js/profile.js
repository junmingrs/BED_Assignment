import { getIdFromToken, getIsGuest, getAccount, signOut } from "./helper.js";

const signoutBtn = document.getElementById("signout-btn");
const name = document.getElementById("name");
const points = document.getElementById("points");
const email = document.getElementById("email");
const id = document.getElementById("id");
const profile = document.getElementById("profile");
const token = sessionStorage.getItem(SS_KEYS.accessToken);

async function fetchCustomer() {
    const accountId = getIdFromToken(token);
    try {
        const response = await fetch(`/customer/${accountId}/profile`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await response.json();
        return data;
    } catch (e) {
        console.error("Error: ", e)
    }
}

signoutBtn.addEventListener("click", signOut);

const isGuest = getIsGuest(token);
if (isGuest) {
    profile.classList.add("hidden");
    signoutBtn.setAttribute("data-i18n", "login_btn");
    signoutBtn.textContent = t("login_btn");
} else {
    const [customer, account] = await Promise.all([
        fetchCustomer(),
        getAccount(token),
    ]);
    name.innerText = customer.customer_name;
    points.innerText = customer.loyalty_points;
    email.innerText = account.account_email;
    id.innerText = account.account_id;
}
