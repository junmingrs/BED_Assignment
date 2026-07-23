const swaggerAutogen = require("swagger-autogen")();

const outputFile = "./swagger-output.json";
const routes = ["./app.js"];

const doc = {
    info: {
        title: "Hawker Centre Management System",
        description:
            "API for Hawker Centre Management System, under Y2S1 BED Assignment",
    },
    host: "localhost:3000",
};

swaggerAutogen(outputFile, routes, doc);
