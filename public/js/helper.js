export function getIdFromToken(token) {
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

        case "Completed":
            return "bg-slate-100 text-slate-700";

        case "Cancelled":
            return "bg-red-100 text-red-700";

        default:
            return "bg-gray-100 text-gray-700";
    }
}

export function formatDate(date) {
    return new Date(date).toLocaleString("en-SG", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

// FOR VENDOR ORDER AND VENDOR INDEX PAGES
export async function getStallId(vendorId, token) {
    try {
        const response = await fetch(`/vendors/${vendorId}/stall`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        return await response.json();
    } catch (err) {
        console.error(err);
    }
}

export async function getOrders(token) {
    const vendorId = getIdFromToken(token);
    const stallId = await getStallId(vendorId, token);

    try {
        const response = await fetch(`/stalls/${stallId}/orders`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const orders = await response.json();
        return orders;
    } catch (err) {
        console.error(err);
    }
}
