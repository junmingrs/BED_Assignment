let socket;

export function getSocket() {
    if (!socket) {
        socket = new WebSocket(`ws://localhost:${window.location.port}`);
        socket.onopen = () => {
            console.log("Connected to websocket");
        };
        socket.onclose = () => {
            console.log("Websocket disconnected");
        };
    }
    return socket;
}
