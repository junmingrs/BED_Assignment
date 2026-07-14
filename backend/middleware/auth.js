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
            "POST /menuitem": ["Vendor"],
            "PUT /menuitem": ["Vendor"],
            "DELETE /menuitem": ["Vendor"],
            "GET /menuitem": ["Vendor"], // specific menu item by stallId and itemCode
            "GET /menuitems": ["Vendor"], // all menu items
            "GET /menuitemsbystore": ["Vendor"],
            "GET /stalls/:stallId": ["Vendor", "Operator"],
            "POST /stalls/:stallId/menu": ["Vendor", "Operator"],
            "PUT /stalls/:stallId/menu/:itemId": ["Vendor", "Operator"],
            "DELETE /stalls/:stallId/menu/:itemId": ["Vendor", "Operator"],
            "GET /stalls": ["Vendor", "Operator", "Customer"],
        };
        const reqEndpoint = `${req.method} ${req.route.path}`;
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
