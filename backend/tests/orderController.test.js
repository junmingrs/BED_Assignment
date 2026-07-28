const { checkoutCart, getOrderById } = require("../controller/orderController");
const orderModel = require("../model/orderModel");
const { broadcast } = require("../ws");
const { sendReceipt } = require("../config/email");
const crypto = require("crypto");

jest.mock("../model/orderModel");
jest.mock("../ws", () => ({
    initWebServer: jest.fn(),
    broadcast: jest.fn(),
}));

// TODO: tests for send receipt
// jest.mock("./emailService", () => ({
//     sendReceipt: jest.fn().mockResolvedValue(true),
// }));

// FIX: remove this, it's just to mock the email service and pretend that it is always successful
jest.mock("../config/email.js", () => ({
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

// Mock crypto.randomUUID
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

        orderModel.getTotalAmount.mockResolvedValueOnce(10.0);
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
            10.3,
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

        // TODO: expect email receipt

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
