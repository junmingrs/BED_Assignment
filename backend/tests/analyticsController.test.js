const analyticsModel = require("../model/analyticsModel");
const orderModel = require("../model/orderModel");
const feedbackModel = require("../model/feedbackModel");
const ratingModel = require("../model/ratingModel");
const complaintModel = require("../model/complaintModel");

const {
    getKPI,
    getHourlySales,
    getTopItems,
    getAISummary,
} = require("../controller/analyticsController");

jest.mock("../model/analyticsModel");
jest.mock("../model/orderModel");
jest.mock("../model/feedbackModel");
jest.mock("../model/ratingModel");
jest.mock("../model/complaintModel");

jest.mock("mssql", () => ({
    ConnectionPool: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue({
            request: () => mockRequest,
        }),
    })),
}));

beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => { });
    jest.spyOn(console, "error").mockImplementation(() => { });
});

afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
});

describe("Analytics Controller Unit Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: { stallId: "stall_123" },
            query: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    describe("getKPI", () => {
        test("should default to timeframe 'this_week' when query param is missing and return 200 with stats", async () => {
            const mockStats = {
                totalRevenue: 1500,
                orderCount: 50,
                averageOrderValue: 30,
            };

            analyticsModel.getKPI.mockResolvedValueOnce(mockStats);

            await getKPI(req, res);

            expect(analyticsModel.getKPI).toHaveBeenCalledWith(
                "stall_123",
                "this_week",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockStats);
        });

        test("should pass custom timeframe from query params when provided", async () => {
            req.query.timeframe = "today";
            const mockStats = {
                totalRevenue: 300,
                orderCount: 10,
                averageOrderValue: 30,
            };

            analyticsModel.getKPI.mockResolvedValueOnce(mockStats);

            await getKPI(req, res);

            expect(analyticsModel.getKPI).toHaveBeenCalledWith(
                "stall_123",
                "today",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockStats);
        });

        test("should return 500 when analyticsModel.getKPI throws an error", async () => {
            analyticsModel.getKPI.mockRejectedValueOnce(
                new Error("Database error"),
            );

            await getKPI(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Internal server error",
            });
        });
    });

    describe("getHourlySales", () => {
        test("should return 200 with hourly sales data", async () => {
            const mockHourlySales = [
                { sales_hour: 11, totalRevenue: 150 },
                { sales_hour: 12, totalRevenue: 400 },
            ];

            analyticsModel.getHourlySales.mockResolvedValueOnce(
                mockHourlySales,
            );

            await getHourlySales(req, res);

            expect(analyticsModel.getHourlySales).toHaveBeenCalledWith(
                "stall_123",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockHourlySales);
        });

        test("should return 500 when analyticsModel.getHourlySales throws an error", async () => {
            analyticsModel.getHourlySales.mockRejectedValueOnce(
                new Error("DB Connection Error"),
            );

            await getHourlySales(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Internal server error",
            });
        });
    });

    describe("getTopItems", () => {
        test("should default timeframe to 'this_week' and return 200 with top items list", async () => {
            const mockTopItems = [
                { itemName: "Chicken Rice", totalSold: 100, totalRevenue: 500 },
            ];

            analyticsModel.getTopItems.mockResolvedValueOnce(mockTopItems);

            await getTopItems(req, res);

            expect(analyticsModel.getTopItems).toHaveBeenCalledWith(
                "stall_123",
                "this_week",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTopItems);
        });

        test("should use provided timeframe query param", async () => {
            req.query.timeframe = "this_month";
            const mockTopItems = [
                { itemName: "Laksa", totalSold: 80, totalRevenue: 480 },
            ];

            analyticsModel.getTopItems.mockResolvedValueOnce(mockTopItems);

            await getTopItems(req, res);

            expect(analyticsModel.getTopItems).toHaveBeenCalledWith(
                "stall_123",
                "this_month",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTopItems);
        });

        test("should return 500 when analyticsModel.getTopItems throws an error", async () => {
            analyticsModel.getTopItems.mockRejectedValueOnce(
                new Error("Query failure"),
            );

            await getTopItems(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Internal server error",
            });
        });
    });

    describe("getAISummary", () => {
        test("should gather operational data in parallel and return AI summary JSON", async () => {
            const mockRatings = [{ rating: 5 }];
            const mockComplaints = [];
            const mockFeedback = ["Tastes great!"];
            const mockOrders = [{ order_id: "ord_1" }];

            const mockSummary = {
                highlights: "Sales are up this week.",
                flags: "Everything is looking good! No warnings or complaints flagged.",
                actions:
                    "Everything is on track. No urgent action required today.",
            };

            // mock model responses for Promise.all
            ratingModel.getRatingsByStallId.mockResolvedValueOnce(mockRatings);
            complaintModel.getComplaintsByStallId.mockResolvedValueOnce(
                mockComplaints,
            );
            feedbackModel.getFeedbackByStallId.mockResolvedValueOnce(
                mockFeedback,
            );
            orderModel.getOrderByStallId.mockResolvedValueOnce(mockOrders);

            analyticsModel.getAISummary.mockResolvedValueOnce(mockSummary);

            await getAISummary(req, res);

            expect(ratingModel.getRatingsByStallId).toHaveBeenCalledWith(
                "stall_123",
                "this_week",
            );
            expect(complaintModel.getComplaintsByStallId).toHaveBeenCalledWith(
                "stall_123",
                "this_week",
            );
            expect(feedbackModel.getFeedbackByStallId).toHaveBeenCalledWith(
                "stall_123",
                "this_week",
            );
            expect(orderModel.getOrderByStallId).toHaveBeenCalledWith(
                "stall_123",
                "this_week",
            );

            expect(analyticsModel.getAISummary).toHaveBeenCalledWith({
                ratings: mockRatings,
                complaints: mockComplaints,
                feedback: mockFeedback,
                orders: mockOrders,
            });

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockSummary);
        });

        test("should pass custom query timeframe parameter to all model queries", async () => {
            req.query.timeframe = "today";

            ratingModel.getRatingsByStallId.mockResolvedValueOnce([]);
            complaintModel.getComplaintsByStallId.mockResolvedValueOnce([]);
            feedbackModel.getFeedbackByStallId.mockResolvedValueOnce([]);
            orderModel.getOrderByStallId.mockResolvedValueOnce([]);
            analyticsModel.getAISummary.mockResolvedValueOnce({});

            await getAISummary(req, res);

            expect(ratingModel.getRatingsByStallId).toHaveBeenCalledWith(
                "stall_123",
                "today",
            );
            expect(complaintModel.getComplaintsByStallId).toHaveBeenCalledWith(
                "stall_123",
                "today",
            );
            expect(feedbackModel.getFeedbackByStallId).toHaveBeenCalledWith(
                "stall_123",
                "today",
            );
            expect(orderModel.getOrderByStallId).toHaveBeenCalledWith(
                "stall_123",
                "today",
            );
        });

        test("should return 500 if any model promise fails in getAISummary", async () => {
            ratingModel.getRatingsByStallId.mockRejectedValueOnce(
                new Error("Failed to fetch ratings"),
            );

            await getAISummary(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Internal server error",
            });
        });
    });
});
