const {
    getRatings,
    submitRating,
    deleteRating,
} = require("../controller/ratingController");
const ratingModel = require("../model/ratingModel");
const { getCustomerByAccountId } = require("../model/customerModel");

// Mock dependencies
jest.mock("../model/ratingModel");
jest.mock("../model/customerModel");

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

beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => { });
    jest.spyOn(console, "error").mockImplementation(() => { });
});

afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
});

describe("ratingController Unit Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest.input.mockReturnThis();

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

    // getRatings
    describe("getRatings", () => {
        test("should return ratings for a stall successfully", async () => {
            const mockRatings = [
                {
                    rating_id: "r1",
                    rating: 5,
                    comment: "Great!",
                    created_at: "2026-08-01",
                },
                {
                    rating_id: "r2",
                    rating: 4,
                    comment: "Good",
                    created_at: "2026-07-31",
                },
            ];
            ratingModel.getRatingsByStallId.mockResolvedValue(mockRatings);
            req.params.stallId = "stall_A";
            req.query.timeframe = "this_week";

            await getRatings(req, res);

            expect(ratingModel.getRatingsByStallId).toHaveBeenCalledWith(
                "stall_A",
                "this_week",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRatings);
        });

        test("should call getRatingsByStallId with null timeframe when not provided", async () => {
            ratingModel.getRatingsByStallId.mockResolvedValue([]);
            req.params.stallId = "stall_A";
            req.query.timeframe = undefined;

            await getRatings(req, res);

            expect(ratingModel.getRatingsByStallId).toHaveBeenCalledWith(
                "stall_A",
                null,
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("should return empty array when no ratings found", async () => {
            ratingModel.getRatingsByStallId.mockResolvedValue([]);
            req.params.stallId = "stall_A";

            await getRatings(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        test("should return 500 when model throws error", async () => {
            ratingModel.getRatingsByStallId.mockRejectedValue(
                new Error("Database connection error"),
            );
            req.params.stallId = "stall_A";

            await getRatings(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Database connection error",
            });
        });
    });

    // submitRating
    describe("submitRating", () => {
        const mockCustomer = { customer_id: "cust_1", account_id: "acc_1" };
        const mockCreatedRating = {
            rating_id: "new_rating",
            stall_id: "stall_A",
            customer_id: "cust_1",
            rating: 5,
            comment: "Great food!",
            created_at: "2026-08-02T10:00:00.000Z",
        };

        beforeEach(() => {
            req.params.stallId = "stall_A";
            req.body.rating = 5;
            req.body.comment = "Great food!";
            req.user.id = "acc_1";

            mockRequest.query.mockResolvedValue({
                recordset: [{ stall_id: "stall_A" }],
            });

            getCustomerByAccountId.mockResolvedValue(mockCustomer);
            ratingModel.createRating.mockResolvedValue(mockCreatedRating);
        });

        test("should submit rating successfully", async () => {
            await submitRating(req, res);

            expect(getCustomerByAccountId).toHaveBeenCalledWith("acc_1");
            expect(ratingModel.createRating).toHaveBeenCalledWith(
                "stall_A",
                "cust_1",
                5,
                "Great food!",
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockCreatedRating);
        });

        test("should submit rating with comment as null when not provided", async () => {
            req.body.comment = undefined;
            ratingModel.createRating.mockResolvedValue({
                ...mockCreatedRating,
                comment: null,
            });

            await submitRating(req, res);

            expect(ratingModel.createRating).toHaveBeenCalledWith(
                "stall_A",
                "cust_1",
                5,
                undefined,
            );
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test("should return 400 if rating is missing", async () => {
            req.body.rating = undefined;

            await submitRating(req, res);

            expect(ratingModel.createRating).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Missing required field: rating",
            });
        });

        test("should return 400 with 'missing required field' when rating is 0 (falsy value is caught before range check)", async () => {
            req.body.rating = 0;

            await submitRating(req, res);

            expect(ratingModel.createRating).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            // controller checks `if (!rating)` before the range check,
            // and 0 is falsy in JS — so it never reaches the
            // "Rating must be between 1 and 5" branch for this input
            expect(res.json).toHaveBeenCalledWith({
                error: "Missing required field: rating",
            });
        });

        test("should return 400 if rating is greater than 5", async () => {
            req.body.rating = 6;

            await submitRating(req, res);

            expect(ratingModel.createRating).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Rating must be between 1 and 5",
            });
        });

        test("should return 404 if stall does not exist", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await submitRating(req, res);

            expect(getCustomerByAccountId).not.toHaveBeenCalled();
            expect(ratingModel.createRating).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Stall not found" });
        });

        test("should return 404 if customer profile not found", async () => {
            getCustomerByAccountId.mockResolvedValue(null);

            await submitRating(req, res);

            expect(ratingModel.createRating).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: "Customer profile not found",
            });
        });

        test("should return 500 if createRating throws error", async () => {
            ratingModel.createRating.mockRejectedValue(
                new Error("Database error"),
            );

            await submitRating(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Database error",
            });
        });
    });

    // deleteRating
    describe("deleteRating", () => {
        beforeEach(() => {
            req.params.ratingId = "rating_123";
            req.user.id = "cust_1";
        });

        test("should delete rating successfully", async () => {
            ratingModel.deleteRating.mockResolvedValue({
                message: "Rating deleted successfully",
            });

            await deleteRating(req, res);

            expect(ratingModel.deleteRating).toHaveBeenCalledWith(
                "rating_123",
                "cust_1",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Rating deleted successfully",
            });
        });

        test("should return 500 if deleteRating throws error", async () => {
            ratingModel.deleteRating.mockRejectedValue(
                new Error("Not authorized"),
            );

            await deleteRating(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Not authorized",
            });
        });
    });
});
