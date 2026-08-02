const {
    getFeedback,
    submitFeedback,
    deleteFeedback,
} = require("../controller/feedbackController");
const feedbackModel = require("../model/feedbackModel");
const { poolPromise } = require("../db");

// Mock dependencies
jest.mock("../model/feedbackModel");
jest.mock("../db", () => ({
    poolPromise: jest.fn(),
}));

// Mock console.log and console.error
beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
});

describe("feedbackController Unit Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {},
            body: {},
            user: { id: "cust_1" },
            query: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // getFeedback
    describe("getFeedback", () => {
        test("should return feedback for a stall successfully", async () => {
            const mockFeedback = [
                { feedback_id: "f1", description: "Great food!", created_at: "2026-08-01" },
                { feedback_id: "f2", description: "Loved it", created_at: "2026-07-31" },
            ];
            feedbackModel.getFeedbackByStallId.mockResolvedValue(mockFeedback);
            req.params.stallId = "stall_A";
            req.query.timeframe = "this_week";

            await getFeedback(req, res);

            expect(feedbackModel.getFeedbackByStallId).toHaveBeenCalledWith(
                "stall_A",
                "this_week",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockFeedback);
        });

        test("should call getFeedbackByStallId with null timeframe when not provided", async () => {
            feedbackModel.getFeedbackByStallId.mockResolvedValue([]);
            req.params.stallId = "stall_A";
            req.query.timeframe = undefined;

            await getFeedback(req, res);

            expect(feedbackModel.getFeedbackByStallId).toHaveBeenCalledWith(
                "stall_A",
                null,
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("should return empty array when no feedback found", async () => {
            feedbackModel.getFeedbackByStallId.mockResolvedValue([]);
            req.params.stallId = "stall_A";

            await getFeedback(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        test("should return 500 when model throws error", async () => {
            feedbackModel.getFeedbackByStallId.mockRejectedValue(
                new Error("Database connection error"),
            );
            req.params.stallId = "stall_A";

            await getFeedback(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Database connection error",
            });
        });
    });

    // submitFeedback
    describe("submitFeedback", () => {
        const mockCreatedFeedback = {
            feedback_id: "new_fb",
            stall_id: "stall_A",
            customer_id: "cust_1",
            description: "Great food!",
            created_at: "2026-08-02T10:00:00.000Z",
        };

        beforeEach(() => {
            req.params.stallId = "stall_A";
            req.body.description = "Great food!";
            req.user.id = "cust_1";

            const mockPool = {
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({
                    recordset: [{ stall_id: "stall_A" }],
                }),
            };
            poolPromise.mockResolvedValue(mockPool);

            feedbackModel.createFeedback.mockResolvedValue(mockCreatedFeedback);
        });

        test("should submit feedback successfully", async () => {
            await submitFeedback(req, res);

            expect(feedbackModel.createFeedback).toHaveBeenCalledWith(
                "stall_A",
                "cust_1",
                "Great food!",
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockCreatedFeedback);
        });

        test("should return 400 if description is missing", async () => {
            req.body.description = undefined;

            await submitFeedback(req, res);

            expect(feedbackModel.createFeedback).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Missing required field: description",
            });
        });

        test("should return 400 if description is empty string", async () => {
            req.body.description = "";

            await submitFeedback(req, res);

            expect(feedbackModel.createFeedback).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Missing required field: description",
            });
        });

        test("should return 404 if stall does not exist", async () => {
            const mockPool = {
                request: jest.fn().mockReturnThis(),
                input: jest.fn().mockReturnThis(),
                query: jest.fn().mockResolvedValue({ recordset: [] }),
            };
            poolPromise.mockResolvedValue(mockPool);

            await submitFeedback(req, res);

            expect(feedbackModel.createFeedback).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Stall not found" });
        });

        test("should return 500 if createFeedback throws error", async () => {
            feedbackModel.createFeedback.mockRejectedValue(
                new Error("Database error"),
            );

            await submitFeedback(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Database error",
            });
        });
    });

    // deleteFeedback
    describe("deleteFeedback", () => {
        beforeEach(() => {
            req.params.feedbackId = "fb_123";
            req.user.id = "cust_1";
        });

        test("should delete feedback successfully", async () => {
            feedbackModel.deleteFeedback.mockResolvedValue({
                message: "Feedback deleted successfully",
            });

            await deleteFeedback(req, res);

            expect(feedbackModel.deleteFeedback).toHaveBeenCalledWith(
                "fb_123",
                "cust_1",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Feedback deleted successfully",
            });
        });

        test("should return 500 if deleteFeedback throws error", async () => {
            feedbackModel.deleteFeedback.mockRejectedValue(
                new Error("Not authorized"),
            );

            await deleteFeedback(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Not authorized",
            });
        });
    });
});