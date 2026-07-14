const jwt = require("jsonwebtoken");

function authorise(...authorisedRoles) {
    return (req, res, next) => {
        const token =
            req.headers.authorization && req.headers.authorization.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorised" });

        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedUser) => {
            if (err) return res.status(403).json({ message: "Forbidden" });

            if (!authorisedRoles.includes(decodedUser.role)) {
                return res.status(403).json({ message: "Forbidden" });
            }

            req.user = decodedUser;
            next();
        });
    };
}

module.exports = { authorise };
