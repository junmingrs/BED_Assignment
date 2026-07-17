// Imports
const path = require("path");
const express = require("express");
const sql = require("mssql");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// TODO: Import Controllers
const accountController = require("./controller/accountController");
const menuItemController = require("./controller/menuItemController");
const orderController = require("./controller/orderController");
const stallController = require("./controller/stallController");
const promotionController = require("./controller/promotionController");
const rentalAgreementController = require("./controller/rentalAgreementController");
const { authorise } = require("./middleware/auth");
const { validateRegister, validateLogin } = require("./middleware/validate");


// TODO: Import Validations

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(express.static(path.join("public")));

// Routes
app.post("/register", validateRegister, accountController.registerUser);
app.post("/login", validateLogin, accountController.loginUser);

app.post("/menuitem", authorise("Vendor"), menuItemController.createMenuItem);
app.put("/menuitem", authorise("Vendor"), menuItemController.updateMenuItem);
app.delete("/menuitem", authorise("Vendor"), menuItemController.deleteMenuItem);
app.get(
    "/menuitem",
    authorise("Vendor", "Customer"),
    menuItemController.getMenuItemsByStallIdAndItemCode,
);
app.get("/menuitems", authorise("Vendor"), menuItemController.getAllMenuItems);
app.get(
    "/menuitemsbystall",
    authorise("Vendor"),
    menuItemController.getMenuItemsByStallId,
);

app.post("/checkout", authorise("Customer"), orderController.checkoutCart);
app.get("/order/:orderId", authorise("Customer"), orderController.getOrderById);
app.get(
    "/customer/:customerId/orders",
    authorise("Customer"),
    orderController.getOrdersByCustomer,
);
app.patch(
    "/orders/:orderId/:status",
    authorise("Vendor"),
    orderController.updateOrderStatus,
);
app.get(
    "/stalls/:stallId/orders",
    authorise("Customer", "Vendor"),
    orderController.getOrderByStallId,
);
app.get(
    "/stalls/:stallId",
    authorise("Vendor", "Operator"),
    stallController.getStallInfo,
);

app.post("/promotion", authorise("Vendor"), promotionController.createPromotion);
app.get("/promotion", authorise("Vendor"), promotionController.getPromotionsByStallId);
app.put("/promotion", authorise("Vendor"), promotionController.updatePromotion);
app.delete("/promotion", authorise("Vendor"), promotionController.deletePromotion);

// app.post("/checkout", authorise("Customer"), orderController.checkoutCart);
// app.get("/order/:orderId", authorise("Customer"), orderController.getOrderById);
// app.get(
//     "/stalls/:stallId/orders",
//     authorise("Customer", "Vendor"),
//     orderController.getOrderByStallId,
// );

app.get("/stalls", authorise("Vendor", "Customer", "Operator"), stallController.getAllStalls);
app.get(
    "/stalls/:stallId",
    authorise("Vendor", "Operator"),
    stallController.getStallInfo,
);
// PUT /stalls/:stallId - update stall info
app.put(
    "/stalls/:stallId",
    authorise("Vendor", "Operator"),
    stallController.updateStall
);

app.get("/rentalagreement", authorise("Vendor", "Operator"), rentalAgreementController.getRentalAgreementsByStallId);
app.get("/rentalagreement/:id", authorise("Vendor", "Operator"), rentalAgreementController.getRentalAgreementById);
app.post("/rentalagreement", authorise("Vendor", "Operator"), rentalAgreementController.createRentalAgreement);
app.put("/rentalagreement", authorise("Vendor", "Operator"), rentalAgreementController.updateRentalAgreement);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// shutdown
process.on("SIGINT", async () => {
    console.log("Server is gracefully shutting down");
    await sql.close();
    console.log("Database connections closed");
    process.exit(0);
});
