const {
    getFeedbackByStallId,
    createFeedback,
    deleteFeedback,
} = require("../model/feedbackModel");
const { getTimeFilter } = require("../helper");

// Mock dependencies
jest.mock("../helper", () => ({
    getTimeFilter: jest.fn(),
}));

const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(),
};

// Mock mssql
jest.mock("mssql", () => ({
    ConnectionPool: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue({
            request: () => mockRequest,
        }),
    })),
}));

// Mock console.error
beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
    console.error.mockRestore();
});

describe("feedbackModel Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest.input.mockReturnThis();
        mockRequest.query.mockReset();
    });

    // getFeedbackByStallId
    describe("getFeedbackByStallId", () => {
        test("should return feedback for a stall successfully", async () => {
            const stallId = "stall_A";
            const mockFeedback = [
                {
                    feedback_id: "fb_1",
                    description: "Great food!",
                    created_at: "2026-08-01T12:00:00.000Z",
                },
                {
                    feedback_id: "fb_2",
                    description: "Loved it",
                    created_at: "2026-07-31T10:00:00.000Z",
                },
            ];

            getTimeFilter.mockReturnValue("AND created_at >= '2026-07-01'");
            mockRequest.query.mockResolvedValue({ recordset: mockFeedback });

            const result = await getFeedbackByStallId(stallId, "this_week");

            expect(getTimeFilter).toHaveBeenCalledWith("this_week", "created_at");
            expect(mockRequest.input).toHaveBeenCalledWith("stallId", stallId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockFeedback);
        });

        test("should use empty timeFilter when timeframe is null", async () => {
            const stallId = "stall_A";
            const mockFeedback = [
                { feedback_id: "fb_1", description: "Test", created_at: "2026-08-01" },
            ];

            getTimeFilter.mockReturnValue("");
            mockRequest.query.mockResolvedValue({ recordset: mockFeedback });

            const result = await getFeedbackByStallId(stallId, null);

            expect(getTimeFilter).toHaveBeenCalledWith(null, "created_at");
            expect(mockRequest.input).toHaveBeenCalledWith("stallId", stallId);
            expect(result).toEqual(mockFeedback);
        });

        test("should return empty array when no feedback found", async () => {
            const stallId = "stall_A";
            getTimeFilter.mockReturnValue("");
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const result = await getFeedbackByStallId(stallId);

            expect(result).toEqual([]);
        });

        test("should throw error when database query fails", async () => {
            const stallId = "stall_A";
            getTimeFilter.mockReturnValue("");
            mockRequest.query.mockRejectedValue(new Error("Database connection error"));

            await expect(getFeedbackByStallId(stallId)).rejects.toThrow(
                "Database connection error",
            );
        });
    });

    // createFeedback
    describe("createFeedback", () => {
        const stallId = "stall_A";
        const customerId = "cust_1";
        const description = "Great food!";

        const mockNewFeedback = {
            feedback_id: "new_fb_123",
            stall_id: stallId,
            customer_id: customerId,
            description: description,
            created_at: "2026-08-02T10:00:00.000Z",
        };

        test("should create feedback successfully and return the new record", async () => {
            mockRequest.query
                .mockResolvedValueOnce({ rowsAffected: [1] })
                .mockResolvedValueOnce({ recordset: [mockNewFeedback] });

            const result = await createFeedback(stallId, customerId, description);

            // Verify INSERT
            expect(mockRequest.input).toHaveBeenCalledWith("stallId", stallId);
            expect(mockRequest.input).toHaveBeenCalledWith("customerId", customerId);
            expect(mockRequest.input).toHaveBeenCalledWith("description", description);
            expect(mockRequest.query).toHaveBeenCalledTimes(2);

            expect(result).toEqual(mockNewFeedback);
        });

        test("should throw error when database insert fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Foreign key constraint failed"),
            );

            await expect(
                createFeedback(stallId, customerId, description),
            ).rejects.toThrow("Foreign key constraint failed");
        });
    });

    // deleteFeedback
    describe("deleteFeedback", () => {
        const feedbackId = "fb_123";
        const customerId = "cust_1";

        test("should delete feedback successfully", async () => {
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{ feedback_id: feedbackId }],
                })
                .mockResolvedValueOnce({ rowsAffected: [1] });

            const result = await deleteFeedback(feedbackId, customerId);

            expect(mockRequest.input).toHaveBeenCalledWith("feedbackId", feedbackId);
            expect(mockRequest.input).toHaveBeenCalledWith("customerId", customerId);
            expect(mockRequest.query).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ message: "Feedback deleted successfully" });
        });

        test("should throw error if feedback not found", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await expect(deleteFeedback(feedbackId, customerId)).rejects.toThrow(
                "Feedback not found or you are not authorized to delete it",
            );

            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should throw error if feedback belongs to another customer", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await expect(deleteFeedback(feedbackId, "wrong_customer")).rejects.toThrow(
                "Feedback not found or you are not authorized to delete it",
            );
        });

        test("should throw error when database query fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(deleteFeedback(feedbackId, customerId)).rejects.toThrow(
                "Database connection error",
            );
        });
    });
});