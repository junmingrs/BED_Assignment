import { LS_KEYS } from "./const.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm");
const nameInput = document.getElementById("name");
const form = document.getElementById("registerForm");

async function registerUser(e) {
    if (passwordInput.value != confirmInput.value) {
        alert("Password and confirm password are different");
        return;
    }

    e.preventDefault();
    try {
        const body = {
            name: nameInput.value,
            email: emailInput.value,
            password: passwordInput.value,
            role: "Customer",
        };
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        console.log(data);
        console.log(response);
        alert(data.message ? data.message : data.error);
        if (!response.ok) {
            console.log("ERROR WHILE REGISTERING: " + data.error);
            return;
        } else {
            localStorage.setItem(LS_KEYS.authToken, data.token);
            window.location.href = "/customer/";
        }
    } catch (err) {
        console.error(err);
    }
}

form.addEventListener("submit", registerUser);
