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
const emailController = require("./controller/emailController");
const stallController = require("./controller/stallController");
const promotionController = require("./controller/promotionController");
const rentalAgreementController = require("./controller/rentalAgreementController");
const ratingController = require("./controller/ratingController");
const complaintController = require("./controller/complaintController");
const feedbackController = require("./controller/feedbackController");
const analyticsController = require("./controller/analyticsController");
const inspectionController = require("./controller/inspectionController");
const hawkerCentreController = require("./controller/hawkerCentreController");
const customerController = require("./controller/customerController.js");
const chatbotController = require("./controller/chatbotController.js");
const googleCalendarController = require("./controller/googleCalendarController");
const inspectionSchedulingController = require("./controller/inspectionSchedulingController");
const { authorise } = require("./middleware/auth");

// validation
const {
    validateRegister,
    validateLogin,
    authenticateToken,
} = require("./middleware/validate");
const {
    validateGetOrderById,
    validateGetOrdersByCustomer,
    validateGetCustomerProfile,
    validateUpdateOrderStatus,
    validateGetOrderByStallId,
    validateCheckoutCart,
} = require("./middleware/orderValidation.js");
const {
    validateGetKPI,
    validateGetHourlySales,
    validateGetTopItems,
    validateGetAISummary,
} = require("./middleware/analyticsValidation.js");

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

app.post(
    "/checkout",
    authorise("Customer"),
    validateCheckoutCart,
    orderController.checkoutCart,
);

app.get(
    "/order/:orderId",
    authorise("Customer", "Vendor"),
    validateGetOrderById,
    orderController.getOrderById,
);

app.get(
    "/customer/:customerId/orders",
    authorise("Customer"),
    validateGetOrdersByCustomer,
    orderController.getOrdersByCustomer,
);

app.get(
    "/customer/:customerId/profile",
    authorise("Customer"),
    validateGetCustomerProfile,
    customerController.getCustomerByAccountId,
);

app.patch(
    "/orders/:orderId/:status",
    authorise("Vendor", "Customer"),
    validateUpdateOrderStatus,
    orderController.updateOrderStatus,
);

app.get(
    "/stalls/:stallId/orders",
    authorise("Customer", "Vendor"),
    validateGetOrderByStallId,
    orderController.getOrderByStallId,
);
app.get(
    "/stalls/:stallId",
    authorise("Vendor", "Operator", "Customer"),
    stallController.getStallInfo,
);
app.post(
    "/promotion",
    authorise("Vendor"),
    promotionController.createPromotion,
);
app.get(
    "/promotion",
    authorise("Customer", "Vendor"),
    promotionController.getAllPromotions,
);
app.get(
    "/promotion/code/:promotionCode",
    authorise("Vendor"),
    promotionController.getPromotionByCode,
);
app.get(
    "/promotion/stall/:stallId",
    authorise("Vendor"),
    promotionController.getPromotionByStallId,
);
app.get(
    "/promotionActive/",
    authorise("Vendor"),
    promotionController.getActivePromotions,
);
app.put("/promotion", authorise("Vendor"), promotionController.updatePromotion);
app.delete(
    "/promotion",
    authorise("Vendor"),
    promotionController.deletePromotion,
);

app.get(
    "/stalls",
    authorise("Vendor", "Customer", "Operator", "NEA"),
    stallController.getAllStalls,
);

app.get(
    "/rentalagreement",
    authorise("Vendor", "Operator"),
    rentalAgreementController.getRentalAgreementsByStallId,
);
app.get(
    "/rentalagreement/:id",
    authorise("Vendor", "Operator"),
    rentalAgreementController.getRentalAgreementById,
);
app.post(
    "/rentalagreement",
    authorise("Vendor", "Operator"),
    rentalAgreementController.createRentalAgreement,
);
app.put(
    "/rentalagreement",
    authorise("Vendor", "Operator"),
    rentalAgreementController.updateRentalAgreement,
);

app.get(
    "/vendors/:vendorId/stall",
    authorise("Vendor"),
    stallController.getStallIdByVendorId,
);

// get ratings for a stall
app.get(
    "/stalls/:stallId/ratings",
    authorise("Vendor", "Customer", "Operator"),
    ratingController.getRatings,
);

//  submit a rating
app.post(
    "/stalls/:stallId/ratings",
    authorise("Customer"),
    ratingController.submitRating,
);
//  delete a rating
app.delete(
    "/ratings/:ratingId",
    authorise("Customer"),
    ratingController.deleteRating,
);

// get complaints for a stall
app.get(
    "/stalls/:stallId/complaints",
    authorise("Vendor", "Customer", "Operator", "NEA"),
    complaintController.getComplaints,
);

//  submit a complaint
app.post(
    "/stalls/:stallId/complaints",
    authorise("Customer"),
    complaintController.submitComplaint,
);
//  delete a complaint
app.delete(
    "/complaints/:complaintId",
    authorise("Customer"),
    complaintController.deleteComplaint,
);
//  get feedbacks for a stall
app.get(
    "/stalls/:stallId/feedback",
    authorise("Vendor", "Customer", "Operator"),
    feedbackController.getFeedback,
);
// submit feedback(only by customer)
app.post(
    "/stalls/:stallId/feedback",
    authorise("Customer"),
    feedbackController.submitFeedback,
);
// delete a feedback
app.delete(
    "/feedback/:feedbackId",
    authorise("Customer"),
    feedbackController.deleteFeedback,
);
// get inspections for a stall
app.get(
    "/stalls/:stallId/inspections",
    authorise("NEA", "Vendor", "Operator"),
    inspectionController.getInspections,
);

// create an inspection (NEA only)
app.post(
    "/stalls/:stallId/inspections",
    authorise("NEA"),
    inspectionController.createInspection,
);
// get a single inspection (NEA only)
app.get(
    "/inspections/:inspectionId",
    authorise("NEA"),
    inspectionController.getInspectionById,
);

// add an inspection (NEA only)
app.put(
    "/inspections/:inspectionId",
    authorise("NEA"),
    inspectionController.updateInspection,
);

// delete an inspection (NEA only)
app.delete(
    "/inspections/:inspectionId",
    authorise("NEA"),
    inspectionController.deleteInspection,
);
// send email
app.post(
    "/send-receipt",
    authorise("Customer"),
    emailController.sendReceiptEmail,
);

// Stall Analytics
app.get(
    "/vendor/analytics/kpi/:stallId",
    authorise("Vendor"),
    validateGetKPI,
    analyticsController.getKPI,
);
app.get(
    "/vendor/analytics/hourly-sales/:stallId",
    authorise("Vendor"),
    validateGetHourlySales,
    analyticsController.getHourlySales,
);
app.get(
    "/vendor/analytics/top-items/:stallId",
    authorise("Vendor"),
    validateGetTopItems,
    analyticsController.getTopItems,
);
app.get(
    "/vendor/analytics/ai-summary/:stallId",
    authorise("Vendor"),
    validateGetAISummary,
    analyticsController.getAISummary,
);

app.get(
    "/menuItemCuisine/:stallId/:itemCode",
    authorise("Vendor", "Customer"),
    menuItemController.getMenuItemCuisine,
);

app.get(
    "/hawkercentre",
    authorise("Vendor", "Customer", "Operator", "NEA"),
    hawkerCentreController.getAllHawkerCentres,
);
app.get(
    "/hawkercentre/:id",
    authorise("Vendor", "Customer", "Operator", "NEA"),
    hawkerCentreController.getHawkerCentreById,
);

app.post(
    "/menuitem/likes/:customerId",
    authorise("Customer"),
    menuItemController.createMenuItemLike,
);
app.delete(
    "/menuitem/likes/:customerId",
    authorise("Customer"),
    menuItemController.deleteMenuItemLike,
);
app.get(
    "/menuitem/likes/:customerId",
    authorise("Customer"),
    menuItemController.getMenuItemLikeByCustomer,
);
app.get(
    "/menuitem",
    authorise("Vendor", "Customer"),
    menuItemController.getMenuItemsByStallIdAndItemCode,
);

app.post(
    "/customer/chatbot/:customerId",
    authorise("Customer"),
    chatbotController.chat,
);

// Google Calendar sync
app.get("/auth/google", googleCalendarController.connectGoogle);
app.get("/auth/google/callback", googleCalendarController.googleCallback);
app.get(
    "/vendor/calendar/status",
    authorise("Vendor"),
    googleCalendarController.getConnectionStatus,
);
app.get(
    "/vendor/calendar/events",
    authorise("Vendor"),
    googleCalendarController.getGoogleEvents,
);
app.delete(
    "/vendor/calendar/disconnect",
    authorise("Vendor"),
    googleCalendarController.disconnectGoogle,
);

app.post(
    "/stalls/:stallId/inspections/schedule",
    authorise("NEA"),
    inspectionSchedulingController.scheduleInspection,
);
app.patch(
    "/inspections/:inspectionId/complete",
    authorise("NEA"),
    inspectionSchedulingController.completeInspection,
);
app.get(
    "/stalls/:stallId/inspections/scheduled",
    authorise("Vendor", "NEA", "Operator"),
    inspectionSchedulingController.getScheduledInspections,
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
