const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const form = document.getElementById("loginForm");

const guestLoginBtn = document.getElementById("guestLogin");

async function loginUser(e) {
    e.preventDefault();
    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.log("ERROR WHILE LOGIN: " + data.message);
            alert(data.message);
            return;
        } else {
            if (data.role == "Customer") {
                alert(data.message);
                sessionStorage.setItem(SS_KEYS.accessToken, data.token);
                window.location.href = "/customer/";
            } else {
                alert(
                    "You need to be a Customer to access this portal. Please use the staff login if you are a staff.",
                );
            }
        }
    } catch (err) {
        console.error(err);
    }
}

async function guestLogin() {
    try {
        const response = await fetch("/loginGuest", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.log("ERROR WHILE LOGIN: " + data.message);
            alert(data.message);
            return;
        } else {
            alert(data.message);
            sessionStorage.setItem(SS_KEYS.accessToken, data.token);
            window.location.href = "/customer/";
        }
    } catch (err) {
        console.error(err);
    }
}

form.addEventListener("submit", loginUser);
guestLoginBtn.addEventListener("click", guestLogin);
