const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(),
};

// mock sql
jest.mock("mssql", () => {
    return {
        ConnectionPool: jest.fn().mockImplementation(() => ({
            connect: jest.fn().mockResolvedValue({
                request: () => mockRequest,
            }),
        })),
    };
});

const {
    getOrderById,
    createOrder,
    getItemsFromOrder,
} = require("../model/orderModel");
describe("orderModel Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest.input.mockReturnThis();
    });

    describe("createOrder", () => {
        test("should successfully create an order and return the orderId", async () => {
            const orderId = "11111111-1111-1111-1111-111111111111";
            const stallId = "DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD";
            const customerId = "22222222-2222-2222-2222-222222222222";
            const totalAmount = 12.5;
            const isEco = true;

            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{ max_queue: 5 }],
                })
                .mockResolvedValueOnce({
                    recordset: [{ order_id: orderId }],
                });

            const result = await createOrder(
                orderId,
                stallId,
                customerId,
                totalAmount,
                isEco,
            );

            expect(result).toBe(orderId);

            // for get queue number
            expect(mockRequest.input).toHaveBeenCalledWith("stall_id", stallId);

            // for create order
            expect(mockRequest.input).toHaveBeenCalledWith("order_id", orderId);
            expect(mockRequest.input).toHaveBeenCalledWith("customer_id", customerId);
            expect(mockRequest.input).toHaveBeenCalledWith(
                "total_amount",
                totalAmount,
            );
            expect(mockRequest.input).toHaveBeenCalledWith("status", "Pending");
            expect(mockRequest.input).toHaveBeenCalledWith("queue_number", 6);
            expect(mockRequest.input).toHaveBeenCalledWith("is_eco", isEco);

            expect(mockRequest.query).toHaveBeenCalledTimes(2);
        });

        test("should default to queue number 1 when no previous orders exist for stall", async () => {
            const orderId = "11111111-1111-1111-1111-111111111111";
            const stallId = "DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD";
            const customerId = "22222222-2222-2222-2222-222222222222";
            const totalAmount = 8.0;
            const isEco = false;

            mockRequest.query
                .mockResolvedValueOnce({
                    // getNextQueueNum
                    recordset: [],
                })
                .mockResolvedValueOnce({
                    // createOrder
                    recordset: [{ order_id: orderId }],
                });

            const result = await createOrder(
                orderId,
                stallId,
                customerId,
                totalAmount,
                isEco,
            );

            expect(result).toBe(orderId);
            expect(mockRequest.input).toHaveBeenCalledWith("queue_number", 1);
            expect(mockRequest.input).toHaveBeenCalledWith("is_eco", false);
        });

        test("should throw an error if the database query fails", async () => {
            const orderId = "11111111-1111-1111-1111-111111111111";
            const stallId = "DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD";
            const customerId = "22222222-2222-2222-2222-222222222222";

            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(
                createOrder(orderId, stallId, customerId, 10.0, false),
            ).rejects.toThrow("Database connection error");
        });
    });

    describe("getItemsFromOrder", () => {
        test("should return array of items for that order", async () => {
            const orderId = "11111111-1111-1111-1111-111111111111";
            const mockItems = [
                {
                    item_code: "code-1",
                    quantity: 2,
                    item_desc: "Salmon Sushi",
                    item_price: 12.5,
                    item_category: "Japanese",
                },
            ];

            mockRequest.query.mockResolvedValueOnce({ recordset: mockItems });

            const result = await getItemsFromOrder(orderId);

            expect(result).toEqual(mockItems);
            expect(mockRequest.input).toHaveBeenCalledWith("id", orderId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });
    });
    describe("getOrderById", () => {
        test("should return complete order object with the items array when order exists", async () => {
            const orderId = "11111111-1111-1111-1111-111111111111";
            const mockOrderRow = {
                order_id: orderId,
                stall_id: "stall_A",
                total_amount: 25.0,
                status: "Pending",
            };
            const mockItemsRows = [
                {
                    item_code: "code-1",
                    quantity: 2,
                    item_desc: "Salmon Sushi",
                    item_price: 12.5,
                    item_category: "Japanese",
                },
            ];

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [mockOrderRow] })
                .mockResolvedValueOnce({ recordset: mockItemsRows });

            const result = await getOrderById(orderId);

            expect(result).toEqual({
                ...mockOrderRow,
                items: mockItemsRows,
            });

            expect(mockRequest.input).toHaveBeenCalledWith("id", orderId);
            expect(mockRequest.query).toHaveBeenCalledTimes(2);
        });

        test("should return null if order is not found and skip fetching items", async () => {
            const orderId = "non-existent-id";

            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getOrderById(orderId);

            expect(result).toBeNull();
            // should not be called for the fetching items
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should throw an error if database query fails", async () => {
            const orderId = "11111111-1111-1111-1111-111111111111";

            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(getOrderById(orderId)).rejects.toThrow(
                "Database connection error",
            );
        });
    });
});
