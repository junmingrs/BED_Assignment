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

        alert(data.message);
        if (!response.ok) {
            console.log("ERROR WHILE LOGIN: " + data.error);
            return;
        } else {
            localStorage.setItem(LS_KEYS.authToken, data.token);
            window.location.href = "/customer/";
        }
    } catch (err) {
        console.error(err);
    }
}

form.addEventListener("submit", loginUser);
