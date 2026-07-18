export function getCustomerIdFromToken(token) {
    // splits the token back to header, payload, signature and decodes it back from base64
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
}

export function statusStyle(status) {
    switch (status) {
        case "Pending":
            return "bg-amber-100 text-amber-700";
        case "Preparing":
            return "bg-blue-100 text-blue-700";
        case "Ready":
            return "bg-green-100 text-green-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
}
