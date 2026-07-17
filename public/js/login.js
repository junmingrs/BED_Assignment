import { LS_KEYS } from "./const.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const form = document.getElementById("loginForm");

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
            console.log("ERROR WHILE LOGIN: " + data.error);
            alert(data.message);
            return;
        } else {
            switch (data.role) {
                case "Vendor":
                    alert(data.message);
                    localStorage.setItem(LS_KEYS.authToken, data.token);
                    window.location.href = "/vendor/";
                    break;
                case "Customer":
                    alert(data.message);
                    localStorage.setItem(LS_KEYS.authToken, data.token);
                    window.location.href = "/customer/";
                    break;
                default:
                    alert(
                        "You need to be a Vendor or Customer to log in via this portal. For operators and NEA officers, please use the staff log in.",
                    );
            }
        }
    } catch (err) {
        console.error(err);
    }
}

form.addEventListener("submit", loginUser);
