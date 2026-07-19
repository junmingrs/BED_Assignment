let socket;

export function getSocket() {
    if (!socket) {
        socket = new WebSocket("ws://localhost:3000");
        socket.onopen = () => {
            console.log("Connected to websocket");
        };
        socket.onclose = () => {
            console.log("Websocket disconnected");
        };
    }
    return socket;
}
