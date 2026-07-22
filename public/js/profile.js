const signoutBtn = document.getElementById("signout-btn");

function signOut() {
    sessionStorage.removeItem(SS_KEYS.accessToken);
    localStorage.removeItem(LS_KEYS.cart);

    window.location.href = "/";
}

signoutBtn.addEventListener("click", signOut);
