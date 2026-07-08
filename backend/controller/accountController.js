const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const accountModel = require("../model/accountModel");

async function registerUser(req, res) {
    const { name, email, password, role } = req.body;
    try {
        // TODO: validation

        // account is tied to email
        const existingUser = await accountModel.getAccountByEmail(email);
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "An account with this email already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await accountModel.createAccount({
            name,
            email,
            passwordHash: hashedPassword,
            role,
        });
        return res.status(201).json({ message: "Account created successfully" });
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

        const payload = {
            id: user.account_id,
            role: user.role,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
            expiresIn: "3600s",
        });
        return res.status(200).json({ token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { registerUser, loginUser };
