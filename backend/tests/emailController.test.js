const { sendReceiptEmail } = require("../controller/emailController");
const { sendReceipt } = require("../model/emailModel");

jest.mock("../model/emailModel", () => ({
    sendReceipt: jest.fn(),
}));

beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
});

describe("emailController Unit Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {
                orderId: "TEST-12345",
                email: "customer@example.com",
                items: [
                    { name: "Kimchi Fried Rice", quantity: 2, price: 7.50 },
                    { name: "Korean Iced Tea", quantity: 1, price: 2.00 },
                ],
                total: 17.00,
            },
            user: {
                id: "cust_1",
                role: "Customer",
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // test 1: 成功发送收据 
    test("should send receipt successfully and return 200", async () => {
        sendReceipt.mockResolvedValue(true);

        await sendReceiptEmail(req, res);

        expect(sendReceipt).toHaveBeenCalledTimes(1);
        expect(sendReceipt).toHaveBeenCalledWith(req.body.email, {
            order_id: req.body.orderId,
            items: req.body.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
            })),
            total: req.body.total,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Receipt sent successfully",
            sentTo: req.body.email,
        });
    });

    // test 2: 缺少 email 字段时返回 400 
    test("should return 400 when email is missing", async () => {
        req.body.email = undefined;

        await sendReceiptEmail(req, res);

        expect(sendReceipt).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Missing required fields: email, orderId, items",
        });
    });

    // test 3: 缺少 orderId 时返回 400 
    test("should return 400 when orderId is missing", async () => {
        req.body.orderId = undefined;

        await sendReceiptEmail(req, res);

        expect(sendReceipt).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Missing required fields: email, orderId, items",
        });
    });

    // test 4: 缺少 items 时返回 400 
    test("should return 400 when items is missing", async () => {
        req.body.items = undefined;

        await sendReceiptEmail(req, res);

        expect(sendReceipt).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Missing required fields: email, orderId, items",
        });
    });

    // test 5: items 为空数组时返回 400 
    test("should return 400 when items is an empty array", async () => {
        req.body.items = [];

        await sendReceiptEmail(req, res);

        expect(sendReceipt).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Missing required fields: email, orderId, items",
        });
    });

    // test 6: sendReceipt 返回 false 时返回 500 
    test("should return 500 when sendReceipt fails", async () => {
        sendReceipt.mockResolvedValue(false);

        await sendReceiptEmail(req, res);

        expect(sendReceipt).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Failed to send receipt",
        });
    });

    // test 7: sendReceipt 抛出异常时返回 500 
    test("should return 500 when sendReceipt throws an error", async () => {
        sendReceipt.mockRejectedValue(new Error("Email service unavailable"));

        await sendReceiptEmail(req, res);

        expect(sendReceipt).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Email service unavailable",
        });
    });

    // test 8: 处理 items 中不完整的商品数据 
    test("should handle incomplete item data with fallback values", async () => {
        sendReceipt.mockResolvedValue(true);

        req.body.items = [
            { name: undefined, quantity: undefined, price: undefined },
            { name: "Chicken Rice", quantity: 2 }, // 缺少 price
        ];

        await sendReceiptEmail(req, res);

        expect(sendReceipt).toHaveBeenCalledWith(req.body.email, {
            order_id: req.body.orderId,
            items: [
                { name: "Item", quantity: 1, price: 0 },
                { name: "Chicken Rice", quantity: 2, price: 0 },
            ],
            total: req.body.total,
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // test 9: 使用备用的 item 字段名（item_desc, item_price） 
    test("should handle alternative field names like item_desc and item_price", async () => {
        sendReceipt.mockResolvedValue(true);

        req.body.items = [
            { item_desc: "Salmon Sushi", quantity: 3, item_price: 12.50 },
        ];

        await sendReceiptEmail(req, res);

        expect(sendReceipt).toHaveBeenCalledWith(req.body.email, {
            order_id: req.body.orderId,
            items: [
                { name: "Salmon Sushi", quantity: 3, price: 12.50 },
            ],
            total: req.body.total,
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });
});