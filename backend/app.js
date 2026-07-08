// Imports
const path = require("path");
const express = require("express");
const sql = require("mssql");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// TODO: Import Controllers
const accountController = require("./controller/accountController");
const menuItemController = require("./controller/menuItemController");
const { verifyJWT } = require("./middleware/auth");
const { validateRegister, valdiateLogin } = require("./middleware/validate");

// TODO: Import Validations

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// TODO: Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// TODO: ROUTES
app.post("/register", validateRegister, accountController.registerUser);
app.post("/login", valdiateLogin, accountController.loginUser);

// to use auth:
// app.post("/orders", verifyJWT, );
// app.get("/orders", verifyJWT, );
app.post("/menuitem", verifyJWT, menuItemController.createMenuItem);
app.put("/menuitem", verifyJWT, menuItemController.updateMenuItem);
app.delete("/menuitem", verifyJWT, menuItemController.deleteMenuItem);
app.get("/menuitem", verifyJWT, menuItemController.getMenuItemsByStallIdAndItemCode);
app.get("/menuitems", verifyJWT, menuItemController.getAllMenuItems);
app.get("/menuitemsbystore", verifyJWT, menuItemController.getMenuItemsByStallId);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
