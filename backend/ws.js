const { WebSocketServer } = require("ws");
let wss;

function initWebServer(server) {
    wss = new WebSocketServer({ server });
    wss.on("connection", (_) => {
        console.log("Client Connected");
    });
}

function broadcast(data) {
    if (!wss) return;
    console.log("broadcasting..");
    wss.clients.forEach((client) => {
        client.send(JSON.stringify(data));
    });
}

module.exports = { initWebServer, broadcast };
