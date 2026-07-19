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
const ratingController = require("./controller/ratingController");
const complaintController = require("./controller/complaintController");
const feedbackController = require("./controller/feedbackController");
const inspectionController = require("./controller/inspectionController");
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
app.get("/stalls", authorise("Vendor", "Customer"), stallController.getAllStalls);
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

// GET /stalls/:stallId/ratings - get ratings for a stall
app.get(
    "/stalls/:stallId/ratings",
    authorise("Vendor", "Customer", "Operator"),
    ratingController.getRatings
);

// POST /stalls/:stallId/ratings - submit a rating
app.post(
    "/stalls/:stallId/ratings",
    authorise("Customer"),
    ratingController.submitRating
);
// DELETE /ratings/:ratingId - delete a rating
app.delete(
    "/ratings/:ratingId",
    authorise("Customer"),
    ratingController.deleteRating
);

// GET /stalls/:stallId/complaints - get complaints for a stall
app.get(
    "/stalls/:stallId/complaints",
    authorise("Vendor", "Customer", "Operator"),
    complaintController.getComplaints
);

// POST /stalls/:stallId/complaints - submit a complaint
app.post(
    "/stalls/:stallId/complaints",
    authorise("Customer"),
    complaintController.submitComplaint
);
// DELETE /complaints/:complaintId - delete a complaint
app.delete(
    "/complaints/:complaintId",
    authorise("Customer"),
    complaintController.deleteComplaint
);
// GET /stalls/:stallId/feedback - get feedbacks for a stall
app.get(
    "/stalls/:stallId/feedback",
    authorise("Vendor", "Customer", "Operator"),
    feedbackController.getFeedback
);
// POST /stalls/:stallId/feedback - submit feedback(only by customer)
app.post(
    "/stalls/:stallId/feedback",
    authorise("Customer"),
    feedbackController.submitFeedback
);
// DELETE /feedback/:feedbackId - delete a feedback
app.delete(
    "/feedback/:feedbackId",
    authorise("Customer"),
    feedbackController.deleteFeedback
);
// GET /stalls/:stallId/inspections - get inspections for a stall
app.get(
    "/stalls/:stallId/inspections",
    authorise("NEA", "Vendor", "Operator"),
    inspectionController.getInspections
);

// POST /stalls/:stallId/inspections - create an inspection (NEA only)
app.post(
    "/stalls/:stallId/inspections",
    authorise("NEA"),
    inspectionController.createInspection
);

// DELETE /inspections/:inspectionId - delete an inspection (NEA only)
app.delete(
    "/inspections/:inspectionId",
    authorise("NEA"),
    inspectionController.deleteInspection
);

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
