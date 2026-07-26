import { getIdFromToken } from "./helper.js";

const signoutBtn = document.getElementById("signout-btn");
const name = document.getElementById("name");
const points = document.getElementById("points");
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
        console.log(data)
        return data;
    } catch (e) {
        console.log(e)
    }

}

function signOut() {
    sessionStorage.removeItem(SS_KEYS.accessToken);
    localStorage.removeItem(LS_KEYS.cart);

    window.location.href = "/";
}

signoutBtn.addEventListener("click", signOut);
const customer = await fetchCustomer();
name.innerText = customer.customer_name;
points.innerText = customer.loyalty_points;

// TODO: Get guest to sign in 

