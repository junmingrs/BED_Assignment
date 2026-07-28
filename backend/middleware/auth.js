const jwt = require("jsonwebtoken");
const accountController = require("../controller/accountController.js");

function authorise(...authorisedRoles) {
    return (req, res, next) => {
        const token =
            req.headers.authorization && req.headers.authorization.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorised" });

        jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decodedUser) => {
            let user = decodedUser;
            if (err) {
                const newToken = await accountController.refreshJWTToken(req.headers.cookie);
                if (!newToken) return res.status(403).json({ message: "Forbidden" });

                try {
                    user = jwt.verify(newToken, process.env.JWT_SECRET_KEY);
                } catch (err) {
                    return res.status(403).json({ message: "Forbidden" });
                }
            }
            if (!user || !authorisedRoles.includes(user.role)) {
                return res.status(403).json({ message: "Forbidden" });
            }
            req.user = user;
            next();
        });
    };
}

module.exports = { authorise };
