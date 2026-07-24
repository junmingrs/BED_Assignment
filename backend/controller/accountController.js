const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const accountModel = require("../model/accountModel");

function generateToken(id, role, isGuest = false) {
    return jwt.sign({ id, role, isGuest }, process.env.JWT_SECRET_KEY, {
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
            isGuest: false,
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
        const refreshToken = jwt.sign(
            { accountId, role },
            process.env.REFRESH_TOKEN_SECRET_KEY,
            {
                expiresIn: "604,800", // 7 days in seconds
            },
        );
        await accountModel.createRefreshToken(accountId, refreshToken);

        return res.status(201).json({
            token,
            refreshToken,
            role,
            message: "Account created successfully",
        });
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
        const refreshToken = jwt.sign(
            { accountId: user.account_id, role: user.role },
            process.env.REFRESH_TOKEN_SECRET_KEY,
        );
        await accountModel.updateRefreshToken(user.account_id, refreshToken);
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        });
        const role = user.role;
        return res
            .status(200)
            .json({ token, role, message: "Logged in successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function loginGuest(_, res) {
    try {
        const guestId = crypto.randomUUID().slice(0, 8);
        const name = `Guest_${guestId}`;
        const email = `guest_${Date.now()}_${guestId}@guest.local`;
        const role = "Customer";

        const dummyPassword = crypto.randomBytes(16).toString("hex");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(dummyPassword, salt);

        const accountId = await accountModel.createAccount({
            name,
            email,
            passwordHash: hashedPassword,
            role,
            isGuest: true,
        });
        await accountModel.createCustomer(accountId, name);

        const token = generateToken(accountId, role, true);
        const refreshToken = jwt.sign(
            { accountId, role, isGuest: true },
            process.env.REFRESH_TOKEN_SECRET_KEY,
            { expiresIn: 604800 },
        );

        await accountModel.createRefreshToken(accountId, refreshToken);

        return res.status(201).json({
            token,
            refreshToken,
            role,
            isGuest: true,
            message: "Logged in as guest",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

function parseCookie(header) {
    return header.split(";").reduce((acc, pair) => {
        const [key, ...v] = pair.trim().split("=");
        if (key) acc[key] = decodeURIComponent(v.join("="));
        return acc;
    }, {});
}

async function refreshJWTToken(cookie) {
    const refreshToken = parseCookie(cookie).refreshToken;
    try {
        const exists = await accountModel.findRefreshToken(refreshToken);

        if (exists == 0) {
            return null;
        }
        const user = await new Promise((resolve, reject) => {
            jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET_KEY,
                (err, user) => {
                    if (err) return reject(err);
                    return resolve(user);
                },
            );
        });
        return generateToken(user.account_id, user.role, user.isGuest ?? false);
    } catch (err) {
        console.log(err);
        return null;
    }
}

module.exports = { registerUser, loginUser, refreshJWTToken, loginGuest };
