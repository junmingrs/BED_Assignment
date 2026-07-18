const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const accountModel = require("../model/accountModel");
const { ref } = require("joi");

function generateToken(id, role) {
    return jwt.sign({ id, role }, process.env.JWT_SECRET_KEY, {
        expiresIn: "3600s",
    });
}

async function registerUser(req, res) {
    const { name, email, password, role } = req.body;
    try {
        // account is tied to email
        const existingUser = await accountModel.getAccountByEmail(email);
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "An account with this email already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const accountId = await accountModel.createAccount({
            name,
            email,
            passwordHash: hashedPassword,
            role,
        });

        switch (role) {
            case "Customer":
                await accountModel.createCustomer(accountId, name);
                break;
            case "Vendor":
                await accountModel.createVendor(accountId);
                break;
            case "Operator":
                await accountModel.createOperator(accountId);
                break;
            case "NEA":
                await accountModel.createNEA(accountId);
                break;
        }

        const token = generateToken(accountId, role);
        const refreshToken = jwt.sign({ accountId, role }, process.env.REFRESH_TOKEN_SECRET_KEY);
        await accountModel.createRefreshToken(accountId, refreshToken);

        return res
            .status(201)
            .json({ token, refreshToken, role, message: "Account created successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function loginUser(req, res) {
    // login via email & password
    const { email, password } = req.body;
    try {
        const user = await accountModel.getAccountByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch)
            return res
                .status(401)
                .json({ message: "The username or password is incorrect." });

        const token = generateToken(user.account_id, user.role);
        const refreshToken = jwt.sign({ accountId: user.account_id, role: user.role }, process.env.REFRESH_TOKEN_SECRET_KEY);
        await accountModel.updateRefreshToken(user.account_id, refreshToken);
        const role = user.role;
        return res
            .status(200)
            .json({ token, role, message: "Logged in successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function refreshToken(req, res) {

    const refreshToken = req.body.token;
    try {
        const exists = await accountModel.findRefreshToken(refreshToken);

        if (!exists) {
            return res.status(401).json({ message: "Refresh token not found. Log in again to create refresh token" });
        }
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY, (err, user) => {
            if (err) return res.status(401).json({ message: "Refresh token not found. Log in again to create refresh token" });
            const token = generateToken(user.account_id, user.role);
            res.json({ token })
        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { registerUser, loginUser, refreshToken };
