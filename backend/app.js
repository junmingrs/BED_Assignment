// Imports
const path = require("path");
const express = require("express");
const sql = require("mssql");

require("dotenv").config();

// TODO: Import Controllers
const accountController = require("./controller/accountController");

// TODO: Import Validations

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// TODO: Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// TODO: ROUTES
app.post("/register", accountController.registerUser);

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
