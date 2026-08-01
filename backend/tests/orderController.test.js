const {
    checkoutCart,
    getOrderById,
    getOrdersByCustomer,
    getOrderByStallId,
    updateOrderStatus,
} = require("../controller/orderController");
const orderModel = require("../model/orderModel");
const { broadcast } = require("../ws");
const { sendReceipt } = require("../model/emailModel");
const crypto = require("crypto");
const { wsMessages } = require("../../public/js/const");

jest.mock("../model/orderModel");
jest.mock("../ws", () => ({
    initWebServer: jest.fn(),
    broadcast: jest.fn(),
}));

jest.mock("../email.js", () => ({
    sendReceipt: jest.fn().mockResolvedValue(true),
}));

const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(),
};

jest.mock("mssql", () => ({
    ConnectionPool: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue({
            request: () => mockRequest,
        }),
    })),
}));

jest.spyOn(crypto, "randomUUID").mockReturnValue("mocked-uuid-1234");

describe("checkoutCart Controller Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest.input.mockReturnThis();

        req = {
            body: {
                customerId: "cust_1",
                cart: {
                    stall_A: {
                        items: [
                            { item_desc: "Salmon Sushi Set", item_price: 12.5, quantity: 2 },
                        ],
                        isEco: true,
                    },
                },
            },
            user: {
                isGuest: false,
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        // so that there's no logging
        jest.spyOn(console, "log").mockImplementation(() => { });
        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    test("should process checkout successfully for logged-in user and send receipt", async () => {
        mockRequest.query.mockResolvedValueOnce({
            recordset: [{ account_email: "test@example.com" }],
        });

        orderModel.getTotalAmount.mockResolvedValueOnce(25.0);
        orderModel.createOrder.mockResolvedValueOnce("mocked-uuid-1234");
        orderModel.createOrderItem.mockResolvedValueOnce(true);

        await checkoutCart(req, res);

        expect(orderModel.getTotalAmount).toHaveBeenCalledWith(
            req.body.cart.stall_A.items,
        );
        expect(orderModel.createOrder).toHaveBeenCalledWith(
            "mocked-uuid-1234",
            "stall_A",
            "cust_1",
            25.3,
            true,
        );
        expect(orderModel.createOrderItem).toHaveBeenCalledWith(
            "mocked-uuid-1234",
            {
                item_desc: "Salmon Sushi Set",
                item_price: 12.5,
                quantity: 2,
                stallId: "stall_A",
            },
        );

        expect(broadcast).toHaveBeenCalledWith({
            type: "newOrder",
            stallId: "stall_A",
            orderId: "mocked-uuid-1234",
        });

        expect(sendReceipt).toHaveBeenCalledWith("test@example.com", {
            order_id: "mocked-uuid-1234",
            items: [{ name: "Salmon Sushi Set", quantity: 2, price: 12.5 }],
            total: 25.3,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Orders placed successfully. Food is now being prepared",
            orderIds: { stall_A: "mocked-uuid-1234" },
        });
    });

    test("should skip sending receipt if customer is a guest", async () => {
        req.user.isGuest = true;

        mockRequest.query.mockResolvedValueOnce({
            recordset: [{ account_email: "guest@example.com" }],
        });

        orderModel.getTotalAmount.mockResolvedValueOnce(5.0);
        orderModel.createOrder.mockResolvedValueOnce("mocked-uuid-1234");

        await checkoutCart(req, res);

        expect(sendReceipt).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should return 500 error if order creation fails", async () => {
        mockRequest.query.mockResolvedValueOnce({ recordset: [] });
        orderModel.getTotalAmount.mockRejectedValueOnce(
            new Error("Database write error"),
        );

        await checkoutCart(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});

describe("getOrderById Controller Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {
                orderId: "11111111-1111-1111-1111-111111111111",
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        // ignore error logs
        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    test("should return status 200 and the order object when order is found", async () => {
        const mockOrder = {
            order_id: "11111111-1111-1111-1111-111111111111",
            stall_id: "stall_A",
            total_amount: 15.5,
            items: [
                {
                    item_code: "code-1",
                    quantity: 2,
                    item_desc: "Salmon Sushi",
                    item_price: 7.75,
                    item_category: "Japanese",
                },
            ],
        };

        orderModel.getOrderById.mockResolvedValueOnce(mockOrder);

        await getOrderById(req, res);

        expect(orderModel.getOrderById).toHaveBeenCalledWith(req.params.orderId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockOrder);
    });

    test("should return status 200 and null if order is not found in database", async () => {
        orderModel.getOrderById.mockResolvedValueOnce(null);

        await getOrderById(req, res);

        expect(orderModel.getOrderById).toHaveBeenCalledWith(req.params.orderId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(null);
    });

    test("should return status 500 when orderModel throws an error", async () => {
        orderModel.getOrderById.mockRejectedValueOnce(
            new Error("Database connection error"),
        );

        await getOrderById(req, res);

        expect(orderModel.getOrderById).toHaveBeenCalledWith(req.params.orderId);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});

describe("getOrdersByCustomer Controller Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {
                customerId: "cust_1",
            },
            query: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    test("should fetch orders with an empty status array when no query param is provided", async () => {
        const mockOrders = [{ order_id: "order_1", total_amount: 15.0, items: [] }];
        orderModel.getOrdersByCustomer.mockResolvedValueOnce(mockOrders);

        await getOrdersByCustomer(req, res);

        expect(orderModel.getOrdersByCustomer).toHaveBeenCalledWith("cust_1", []);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    test("should return orders correct when only 1 status is provided", async () => {
        req.query.status = "Pending";

        const mockOrders = [{ order_id: "order_1", status: "Pending", items: [] }];
        orderModel.getOrdersByCustomer.mockResolvedValueOnce(mockOrders);

        await getOrdersByCustomer(req, res);

        // also to verify that it converted to []
        expect(orderModel.getOrdersByCustomer).toHaveBeenCalledWith("cust_1", [
            "Pending",
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    test("should return orders correctly when multiple statuses are provided", async () => {
        req.query.status = ["Pending", "Preparing"];

        const mockOrders = [
            { order_id: "order_1", status: "Pending", items: [] },
            { order_id: "order_2", status: "Preparing", items: [] },
        ];
        orderModel.getOrdersByCustomer.mockResolvedValueOnce(mockOrders);

        await getOrdersByCustomer(req, res);

        expect(orderModel.getOrdersByCustomer).toHaveBeenCalledWith("cust_1", [
            "Pending",
            "Preparing",
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    test("should return 500 status when orderModel fails", async () => {
        orderModel.getOrdersByCustomer.mockRejectedValueOnce(
            new Error("Database lookup failed"),
        );

        await getOrdersByCustomer(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});

describe("getOrderByStallId Controller Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {
                stallId: "stall_A",
            },
            query: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    test("should fetch orders with timeframe set to null when no query param is passed", async () => {
        const mockOrders = [
            { order_id: "order_1", stall_id: "stall_A", queue_number: 1, items: [] },
        ];
        orderModel.getOrderByStallId.mockResolvedValueOnce(mockOrders);

        await getOrderByStallId(req, res);

        expect(orderModel.getOrderByStallId).toHaveBeenCalledWith("stall_A", null);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    test("should pass the timeframe query parameter to the model when provided", async () => {
        req.query.timeframe = "today";

        const mockOrders = [
            { order_id: "order_1", stall_id: "stall_A", queue_number: 1, items: [] },
        ];
        orderModel.getOrderByStallId.mockResolvedValueOnce(mockOrders);

        await getOrderByStallId(req, res);

        expect(orderModel.getOrderByStallId).toHaveBeenCalledWith(
            "stall_A",
            "today",
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    test("should return 200 and null when no orders exist for the stall", async () => {
        orderModel.getOrderByStallId.mockResolvedValueOnce(null);

        await getOrderByStallId(req, res);

        expect(orderModel.getOrderByStallId).toHaveBeenCalledWith("stall_A", null);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(null);
    });

    test("should return 500 when orderModel throws an error", async () => {
        orderModel.getOrderByStallId.mockRejectedValueOnce(
            new Error("Database connection error"),
        );

        await getOrderByStallId(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});

describe("updateOrderStatus Controller Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {
                orderId: "11111111-1111-1111-1111-111111111111",
                status: "Completed",
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    test("should update status, broadcast update, and return 200 on success", async () => {
        const mockOrder = {
            order_id: req.params.orderId,
            customer_id: "cust_123",
            stall_id: "stall_A",
            status: "Completed",
        };

        orderModel.updateOrderStatus.mockResolvedValueOnce(true);
        orderModel.getOrderById.mockResolvedValueOnce(mockOrder);

        await updateOrderStatus(req, res);

        expect(orderModel.updateOrderStatus).toHaveBeenCalledWith(
            req.params.orderId,
            req.params.status,
        );
        expect(orderModel.getOrderById).toHaveBeenCalledWith(req.params.orderId);

        // verify ws broadcast
        expect(broadcast).toHaveBeenCalledWith({
            type: wsMessages.updateOrder,
            customerId: mockOrder.customer_id,
            stallId: mockOrder.stall_id,
            orderId: mockOrder.order_id,
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Order status updated successfully.",
        });
    });

    test("should return 404 if the order is not found", async () => {
        orderModel.updateOrderStatus.mockResolvedValueOnce(false);

        await updateOrderStatus(req, res);

        expect(orderModel.updateOrderStatus).toHaveBeenCalledWith(
            req.params.orderId,
            req.params.status,
        );
        expect(orderModel.getOrderById).not.toHaveBeenCalled();
        expect(broadcast).not.toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Order not found" });
    });

    test("should return 500 when orderModel throws an error", async () => {
        orderModel.updateOrderStatus.mockRejectedValueOnce(
            new Error("Database write failure"),
        );

        await updateOrderStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});
