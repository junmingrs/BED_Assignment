const jwt = require("jsonwebtoken");

function verifyJWT(req, res, next) {
    const token =
        req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorised" });

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedUser) => {
        if (err) return res.status(403).json({ message: "Forbidden" });
        const authorisedRoles = {
            "POST /orders": ["Customer"],
            "GET /orders": ["Vendor"],
        };
        const reqEndpoint = `${req.method} ${req.url}`;
        const userRole = decodedUser.role;
        const authorisedRole = Object.entries(authorisedRoles).find(
            ([endpoint, roles]) => {
                const regex = new RegExp(`^${endpoint}$`);
                return regex.test(reqEndpoint) && roles.includes(userRole);
            },
        );
        if (!authorisedRole) return res.status(403).json({ message: "Forbidden" });
        req.user = decodedUser;
        next();
    });
}

module.exports = { verifyJWT };
