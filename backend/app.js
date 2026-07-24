// Imports
const path = require("path");
const express = require("express");
const sql = require("mssql");
const http = require("http");
const { initWebServer } = require("./ws.js");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// swagger
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");

const accountController = require("./controller/accountController");
const menuItemController = require("./controller/menuItemController");
const orderController = require("./controller/orderController");
const stallController = require("./controller/stallController");
const promotionController = require("./controller/promotionController");
const ratingController = require("./controller/ratingController");
const complaintController = require("./controller/complaintController");
const feedbackController = require("./controller/feedbackController");
const analyticsController = require("./controller/analyticsController");
const inspectionController = require("./controller/inspectionController");
const hawkerCentreController = require("./controller/hawkerCentreController");
const { authorise } = require("./middleware/auth");
const {
    validateRegister,
    validateLogin,
    authenticateToken,
} = require("./middleware/validate");

// Create Express app
const app = express();
const port = process.env.PORT || process.argv[2];

// create websocket
const server = http.createServer(app);
initWebServer(server);
server.listen(port);

// swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(express.static(path.join("public")));

// Routes
app.post("/register", validateRegister, accountController.registerUser);
app.post("/login", validateLogin, accountController.loginUser);
app.post("/loginGuest", accountController.loginGuest);

// refresh token
app.post("/refresh", accountController.refreshJWTToken);

app.post("/menuitem", authorise("Vendor"), menuItemController.createMenuItem);
app.put("/menuitem", authorise("Vendor"), menuItemController.updateMenuItem);
app.delete("/menuitem", authorise("Vendor"), menuItemController.deleteMenuItem);
app.get(
    "/menuitem",
    authorise("Vendor", "Customer"),
    menuItemController.getMenuItemsByStallIdAndItemCode,
);
app.get(
    "/menuitems",
    authorise("Vendor"),
    authenticateToken,
    menuItemController.getAllMenuItems,
);
app.get(
    "/menuitemsbystall/:stallId",
    authorise("Vendor", "Customer"),
    menuItemController.getMenuItemsByStallId,
);

app.post("/checkout", authorise("Customer"), orderController.checkoutCart);
app.get(
    "/order/:orderId",
    authorise("Customer", "Vendor"),
    orderController.getOrderById,
);
app.get(
    "/customer/:customerId/orders",
    authorise("Customer"),
    orderController.getOrdersByCustomer,
);
app.patch(
    "/orders/:orderId/:status",
    authorise("Vendor", "Customer"),
    orderController.updateOrderStatus,
);
app.get(
    "/stalls/:stallId/orders",
    authorise("Customer", "Vendor"),
    orderController.getOrderByStallId,
);
app.get(
    "/stalls/:stallId",
    authorise("Vendor", "Operator", "Customer"),
    stallController.getStallInfo,
);
app.get(
    "/stalls",
    authorise("Vendor", "Customer"),
    stallController.getAllStalls,
);
app.put(
    "/stalls/:stallId",
    authorise("Vendor", "Operator"),
    stallController.updateStall,
);
app.get(
    "/vendors/:vendorId/stall",
    authorise("Vendor"),
    stallController.getStallIdByVendorId,
);

app.post(
    "/promotion",
    authorise("Vendor"),
    promotionController.createPromotion,
);
app.get(
    "/promotion",
    authorise("Vendor"),
    promotionController.getPromotionsByStallId,
);
app.put("/promotion", authorise("Vendor"), promotionController.updatePromotion);
app.delete(
    "/promotion",
    authorise("Vendor"),
    promotionController.deletePromotion,
);

// GET /stalls/:stallId/ratings - get ratings for a stall
app.get(
    "/stalls/:stallId/ratings",
    authorise("Vendor", "Customer", "Operator"),
    ratingController.getRatings,
);

// POST /stalls/:stallId/ratings - submit a rating
app.post(
    "/stalls/:stallId/ratings",
    authorise("Customer"),
    ratingController.submitRating,
);
// DELETE /ratings/:ratingId - delete a rating
app.delete(
    "/ratings/:ratingId",
    authorise("Customer"),
    ratingController.deleteRating,
);

// GET /stalls/:stallId/complaints - get complaints for a stall
app.get(
    "/stalls/:stallId/complaints",
    authorise("Vendor", "Customer", "Operator"),
    complaintController.getComplaints,
);

// POST /stalls/:stallId/complaints - submit a complaint
app.post(
    "/stalls/:stallId/complaints",
    authorise("Customer"),
    complaintController.submitComplaint,
);
// DELETE /complaints/:complaintId - delete a complaint
app.delete(
    "/complaints/:complaintId",
    authorise("Customer"),
    complaintController.deleteComplaint,
);
// GET /stalls/:stallId/feedback - get feedbacks for a stall
app.get(
    "/stalls/:stallId/feedback",
    authorise("Vendor", "Customer", "Operator"),
    feedbackController.getFeedback,
);
// POST /stalls/:stallId/feedback - submit feedback(only by customer)
app.post(
    "/stalls/:stallId/feedback",
    authorise("Customer"),
    feedbackController.submitFeedback,
);
// DELETE /feedback/:feedbackId - delete a feedback
app.delete(
    "/feedback/:feedbackId",
    authorise("Customer"),
    feedbackController.deleteFeedback,
);
// GET /stalls/:stallId/inspections - get inspections for a stall
app.get(
    "/stalls/:stallId/inspections",
    authorise("NEA", "Vendor", "Operator"),
    inspectionController.getInspections,
);

// POST /stalls/:stallId/inspections - create an inspection (NEA only)
app.post(
    "/stalls/:stallId/inspections",
    authorise("NEA"),
    inspectionController.createInspection,
);

// DELETE /inspections/:inspectionId - delete an inspection (NEA only)
app.delete(
    "/inspections/:inspectionId",
    authorise("NEA"),
    inspectionController.deleteInspection,
);

// Stall Analytics
app.get(
    "/vendor/analytics/kpi/:stallId",
    authorise("Vendor"),
    analyticsController.getKPI,
);
app.get(
    "/vendor/analytics/hourly-sales/:stallId",
    authorise("Vendor"),
    analyticsController.getHourlySales,
);
app.get(
    "/vendor/analytics/top-items/:stallId",
    authorise("Vendor"),
    analyticsController.getTopItems,
);
app.get(
    "/vendor/analytics/ai-summary/:stallId",
    authorise("Vendor"),
    analyticsController.getAISummary,
);

app.get(
    "/hawkercentre",
    authorise("Vendor", "Customer", "Operator"),
    hawkerCentreController.getAllHawkerCentres,
);
app.get(
    "/hawkercentre/:id",
    authorise("Vendor", "Customer", "Operator"),
    hawkerCentreController.getHawkerCentreById,
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
