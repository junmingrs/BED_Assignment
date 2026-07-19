const signoutBtn = document.getElementById("signout-btn");

function signOut() {
    localStorage.removeItem(LS_KEYS.authToken);
    localStorage.removeItem(LS_KEYS.cart);

    window.location.href = "/";
}

signoutBtn.addEventListener("click", signOut);
