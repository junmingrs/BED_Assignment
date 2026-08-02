const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const form = document.getElementById("operatorForm");

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
            if (data.role == "Operator") {
                alert(data.message);
                sessionStorage.setItem(SS_KEYS.accessToken, data.token);
                window.location.href = "/operator/";
            } else if (data.role == "NEA") {
                alert(data.message);
                sessionStorage.setItem(SS_KEYS.accessToken, data.token);
                window.location.href = "/nea/inspections.html";
            } else if (data.role == "Vendor") {
                alert(data.message);
                sessionStorage.setItem(SS_KEYS.accessToken, data.token);
                window.location.href = "/vendor/";
            } else {
                alert(
                    "You need to be a staff (NEA, Operator, Vendor) to login via this portal",
                );
            }
        }
    } catch (err) {
        console.error(err);
    }
}

form.addEventListener("submit", loginUser);
