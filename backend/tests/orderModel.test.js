const {
    getOrderById,
    createOrder,
    getItemsFromOrder,
    getOrdersByCustomer,
    getOrderByStallId,
    createOrderItem,
    updateOrderStatus,
} = require("../model/orderModel");

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

describe("orderModel Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest.input.mockReturnThis();
        mockRequest.query.mockReset();
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

    describe("createOrderItem", () => {
        test("should bind all item properties and execute the INSERT query successfully", async () => {
            const orderId = "11111111-1111-1111-1111-111111111111";
            const item = {
                stallId: "stall_A",
                itemCode: "code-101",
                quantity: 2,
            };

            mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

            await createOrderItem(orderId, item);

            // verify that the inputs are correct
            expect(mockRequest.input).toHaveBeenCalledWith("order_id", orderId);
            expect(mockRequest.input).toHaveBeenCalledWith("stall_id", item.stallId);
            expect(mockRequest.input).toHaveBeenCalledWith(
                "item_code",
                item.itemCode,
            );
            expect(mockRequest.input).toHaveBeenCalledWith("quantity", item.quantity);

            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should throw an error if the database query fails", async () => {
            const orderId = "11111111-1111-1111-1111-111111111111";
            const item = {
                stallId: "stall_A",
                itemCode: "code-101",
                quantity: 2,
            };

            mockRequest.query.mockRejectedValueOnce(
                new Error("Foreign key constraint failed"),
            );

            await expect(createOrderItem(orderId, item)).rejects.toThrow(
                "Foreign key constraint failed",
            );
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

    describe("getOrdersByCustomer", () => {
        test("should return orders with items without filtering by status", async () => {
            const customerId = "cust_1";
            const mockOrders = [
                { order_id: "order_1", customer_id: customerId, total_amount: 15.0 },
                { order_id: "order_2", customer_id: customerId, total_amount: 20.0 },
            ];
            const mockItemsOrder1 = [{ item_code: "item_a", quantity: 1 }];
            const mockItemsOrder2 = [{ item_code: "item_b", quantity: 2 }];

            mockRequest.query
                // select all items
                .mockResolvedValueOnce({ recordset: mockOrders })
                // get items from order 1
                .mockResolvedValueOnce({ recordset: mockItemsOrder1 })
                // get items from order 2
                .mockResolvedValueOnce({ recordset: mockItemsOrder2 });

            const result = await getOrdersByCustomer(customerId);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ ...mockOrders[0], items: mockItemsOrder1 });
            expect(result[1]).toEqual({ ...mockOrders[1], items: mockItemsOrder2 });

            expect(mockRequest.input).toHaveBeenCalledWith("customerId", customerId);
            expect(mockRequest.query).toHaveBeenCalledTimes(3);
        });

        test("should handle status filtering correctly", async () => {
            const customerId = "cust_1";
            const statuses = ["Pending", "Preparing"];
            const mockOrders = [
                { order_id: "order_1", customer_id: customerId, status: "Pending" },
            ];
            const mockItems = [{ item_code: "item_a", quantity: 1 }];

            mockRequest.query
                .mockResolvedValueOnce({ recordset: mockOrders })
                .mockResolvedValueOnce({ recordset: mockItems });

            const result = await getOrdersByCustomer(customerId, statuses);

            expect(result).toEqual([{ ...mockOrders[0], items: mockItems }]);
            expect(mockRequest.input).toHaveBeenCalledWith("customerId", customerId);
            expect(mockRequest.input).toHaveBeenCalledWith("status0", "Pending");
            expect(mockRequest.input).toHaveBeenCalledWith("status1", "Preparing");
        });

        test("should return null if no orders are found for the customer", async () => {
            const customerId = "non_existent_cust";

            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getOrdersByCustomer(customerId);

            expect(result).toBeNull();
            // should stop early and not call getItems
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should throw an error if the database query fails", async () => {
            const customerId = "cust_1";

            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(getOrdersByCustomer(customerId)).rejects.toThrow(
                "Database connection error",
            );
        });
    });

    describe("getOrderByStallId", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            mockRequest.input.mockReturnThis();
            mockRequest.query.mockReset();
        });

        test("should return list of orders with items when no timeframe is provided", async () => {
            const stallId = "stall_A";
            const mockOrders = [
                { order_id: "order_1", stall_id: stallId, queue_number: 1 },
                { order_id: "order_2", stall_id: stallId, queue_number: 2 },
            ];
            const mockItemsOrder1 = [{ item_code: "item_a", quantity: 1 }];
            const mockItemsOrder2 = [{ item_code: "item_b", quantity: 2 }];

            mockRequest.query
                // returns 2 orders
                .mockResolvedValueOnce({ recordset: mockOrders })
                // returns items for order item 1
                .mockResolvedValueOnce({ recordset: mockItemsOrder1 })
                // returns items for order item 2
                .mockResolvedValueOnce({ recordset: mockItemsOrder2 });

            const result = await getOrderByStallId(stallId);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ ...mockOrders[0], items: mockItemsOrder1 });
            expect(result[1]).toEqual({ ...mockOrders[1], items: mockItemsOrder2 });

            expect(mockRequest.input).toHaveBeenCalledWith("id", stallId);
            expect(mockRequest.query).toHaveBeenCalledTimes(3);
        });

        test("should return list of orders correctly when a timeframe parameter is passed", async () => {
            const stallId = "stall_A";
            const timeframe = "today";
            const mockOrders = [
                { order_id: "order_1", stall_id: stallId, queue_number: 1 },
            ];
            const mockItems = [{ item_code: "item_a", quantity: 1 }];

            mockRequest.query
                .mockResolvedValueOnce({ recordset: mockOrders })
                .mockResolvedValueOnce({ recordset: mockItems });

            const result = await getOrderByStallId(stallId, timeframe);

            expect(result).toEqual([{ ...mockOrders[0], items: mockItems }]);
            expect(mockRequest.input).toHaveBeenCalledWith("id", stallId);
            expect(mockRequest.query).toHaveBeenCalledTimes(2);
        });

        test("should return null if no orders exist for the given stallId", async () => {
            const stallId = "non_existent_stall";

            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getOrderByStallId(stallId);

            expect(result).toBeNull();
            // stop early and not call getItems
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should throw an error if the database query fails", async () => {
            const stallId = "stall_A";

            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(getOrderByStallId(stallId)).rejects.toThrow(
                "Database connection error",
            );
        });
    });
    describe("updateOrderStatus", () => {
        test("should return true when order status is successfully updated", async () => {
            const orderId = "11111111-1111-1111-1111-111111111111";
            const status = "Completed";

            mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

            const result = await updateOrderStatus(orderId, status);

            expect(result).toBe(true);
            expect(mockRequest.input).toHaveBeenCalledWith("status", status);
            expect(mockRequest.input).toHaveBeenCalledWith("orderId", orderId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should return false if order_id is not found and no rows are updated", async () => {
            const orderId = "non-existent-id";
            const status = "Completed";

            mockRequest.query.mockResolvedValueOnce({ rowsAffected: [0] });

            const result = await updateOrderStatus(orderId, status);

            expect(result).toBe(false);
            expect(mockRequest.input).toHaveBeenCalledWith("status", status);
            expect(mockRequest.input).toHaveBeenCalledWith("orderId", orderId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should throw an error if the database query fails", async () => {
            const orderId = "11111111-1111-1111-1111-111111111111";
            const status = "Completed";

            mockRequest.query.mockRejectedValueOnce(
                new Error("Database write failure"),
            );

            await expect(updateOrderStatus(orderId, status)).rejects.toThrow(
                "Database write failure",
            );
        });
    });
});
