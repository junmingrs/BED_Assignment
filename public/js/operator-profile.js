import { getIdFromToken, getAccount, signOut } from "./helper.js";
const signoutBtn = document.getElementById("signout-btn");
const nameElement = document.getElementById("user-email");
const idElement = document.getElementById("user-id");
const token = sessionStorage.getItem(SS_KEYS.accessToken);

const user = await getAccount(token);
nameElement.textContent = user.account_email;
idElement.textContent = user.account_id;

signoutBtn.addEventListener("click", signOut);
