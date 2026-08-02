const {
    getRatingsByStallId,
    createRating,
    deleteRating,
} = require("../model/ratingModel");
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

describe("ratingModel Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest.input.mockReturnThis();
        mockRequest.query.mockReset();
    });

    // getRatingsByStallId
    describe("getRatingsByStallId", () => {
        test("should return ratings for a stall successfully", async () => {
            const stallId = "stall_A";
            const mockRatings = [
                {
                    rating_id: "r_1",
                    rating: 5,
                    comment: "Great food!",
                    created_at: "2026-08-01T12:00:00.000Z",
                },
                {
                    rating_id: "r_2",
                    rating: 4,
                    comment: "Good",
                    created_at: "2026-07-31T10:00:00.000Z",
                },
            ];

            getTimeFilter.mockReturnValue("AND created_at >= '2026-07-01'");
            mockRequest.query.mockResolvedValue({ recordset: mockRatings });

            const result = await getRatingsByStallId(stallId, "this_week");

            expect(getTimeFilter).toHaveBeenCalledWith("this_week", "created_at");
            expect(mockRequest.input).toHaveBeenCalledWith("stallId", stallId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockRatings);
        });

        test("should use empty timeFilter when timeframe is null", async () => {
            const stallId = "stall_A";
            const mockRatings = [
                { rating_id: "r_1", rating: 5, comment: "Great", created_at: "2026-08-01" },
            ];

            getTimeFilter.mockReturnValue("");
            mockRequest.query.mockResolvedValue({ recordset: mockRatings });

            const result = await getRatingsByStallId(stallId, null);

            expect(getTimeFilter).toHaveBeenCalledWith(null, "created_at");
            expect(mockRequest.input).toHaveBeenCalledWith("stallId", stallId);
            expect(result).toEqual(mockRatings);
        });

        test("should return empty array when no ratings found", async () => {
            const stallId = "stall_A";
            getTimeFilter.mockReturnValue("");
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const result = await getRatingsByStallId(stallId);

            expect(result).toEqual([]);
        });

        test("should throw error when database query fails", async () => {
            const stallId = "stall_A";
            getTimeFilter.mockReturnValue("");
            mockRequest.query.mockRejectedValue(new Error("Database connection error"));

            await expect(getRatingsByStallId(stallId)).rejects.toThrow(
                "Database connection error",
            );
        });
    });

    // createRating
    describe("createRating", () => {
        const stallId = "stall_A";
        const customerId = "cust_1";
        const rating = 5;
        const comment = "Great food!";

        const mockNewRating = {
            rating_id: "new_r_123",
            stall_id: stallId,
            customer_id: customerId,
            rating: rating,
            comment: comment,
            created_at: "2026-08-02T10:00:00.000Z",
        };

        test("should create rating successfully and return the new record", async () => {
            mockRequest.query
                .mockResolvedValueOnce({ rowsAffected: [1] })
                .mockResolvedValueOnce({ recordset: [mockNewRating] });

            const result = await createRating(stallId, customerId, rating, comment);

            expect(mockRequest.input).toHaveBeenCalledWith("stallId", stallId);
            expect(mockRequest.input).toHaveBeenCalledWith("customerId", customerId);
            expect(mockRequest.input).toHaveBeenCalledWith("rating", rating);
            expect(mockRequest.input).toHaveBeenCalledWith("comment", comment);
            expect(mockRequest.query).toHaveBeenCalledTimes(2);
            expect(result).toEqual(mockNewRating);
        });

        test("should create rating with comment as null when not provided", async () => {
            mockRequest.query
                .mockResolvedValueOnce({ rowsAffected: [1] })
                .mockResolvedValueOnce({
                    recordset: [{ ...mockNewRating, comment: null }],
                });

            const result = await createRating(stallId, customerId, rating, undefined);

            expect(mockRequest.input).toHaveBeenCalledWith("comment", null);
            expect(result.comment).toBeNull();
        });

        test("should throw error when database insert fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Foreign key constraint failed"),
            );

            await expect(
                createRating(stallId, customerId, rating, comment),
            ).rejects.toThrow("Foreign key constraint failed");
        });
    });

    // deleteRating
    describe("deleteRating", () => {
        const ratingId = "r_123";
        const customerId = "cust_1";

        test("should delete rating successfully", async () => {
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{ rating_id: ratingId }],
                })
                .mockResolvedValueOnce({ rowsAffected: [1] });

            const result = await deleteRating(ratingId, customerId);

            expect(mockRequest.input).toHaveBeenCalledWith("ratingId", ratingId);
            expect(mockRequest.input).toHaveBeenCalledWith("customerId", customerId);
            expect(mockRequest.query).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ message: "Rating deleted successfully" });
        });

        test("should throw error if rating not found", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await expect(deleteRating(ratingId, customerId)).rejects.toThrow(
                "Rating not found or you are not authorized to delete it",
            );

            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should throw error if rating belongs to another customer", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await expect(deleteRating(ratingId, "wrong_customer")).rejects.toThrow(
                "Rating not found or you are not authorized to delete it",
            );
        });

        test("should throw error when database query fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(deleteRating(ratingId, customerId)).rejects.toThrow(
                "Database connection error",
            );
        });
    });
});