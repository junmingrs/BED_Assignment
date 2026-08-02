const {
    validateGetCustomerByAccountId,
    validateAddCustomerLoyaltyPoints,
    validateSubtractCustomerLoyaltyPoints,
} = require("../middleware/customerValidation");

function makeMocks() {
    const req = { body: {}, params: {} };
    const res = {
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();
    return { req, res, next };
}

describe("validateGetCustomerByAccountId", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        ({ req, res, next } = makeMocks());
    });

    it("should call next() when customerId is present", () => {
        req.params = { customerId: "1" };
        validateGetCustomerByAccountId(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should accept a numeric customerId", () => {
        req.params = { customerId: 1 };
        validateGetCustomerByAccountId(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it("should return 400 when customerId is missing", () => {
        req.params = {};
        validateGetCustomerByAccountId(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Customer ID is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });
});

describe("validateAddCustomerLoyaltyPoints", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        ({ req, res, next } = makeMocks());
    });

    it("should call next() with valid customerId and points", () => {
        req.params = { customerId: "1" };
        req.body = { points: 10 };
        validateAddCustomerLoyaltyPoints(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 400 when customerId is missing", () => {
        req.params = {};
        req.body = { points: 10 };
        validateAddCustomerLoyaltyPoints(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Customer ID is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when points are missing", () => {
        req.params = { customerId: "1" };
        req.body = {};
        validateAddCustomerLoyaltyPoints(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Points are required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when points are zero", () => {
        req.params = { customerId: "1" };
        req.body = { points: 0 };
        validateAddCustomerLoyaltyPoints(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Points must be at least 1") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when points are negative", () => {
        req.params = { customerId: "1" };
        req.body = { points: -5 };
        validateAddCustomerLoyaltyPoints(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Points must be at least 1") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when points are not a whole number", () => {
        req.params = { customerId: "1" };
        req.body = { points: 2.5 };
        validateAddCustomerLoyaltyPoints(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Points must be a whole number") })
        );
        expect(next).not.toHaveBeenCalled();
    });
});

describe("validateSubtractCustomerLoyaltyPoints", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        ({ req, res, next } = makeMocks());
    });

    it("should call next() with valid customerId and points", () => {
        req.params = { customerId: "1" };
        req.body = { points: 5 };
        validateSubtractCustomerLoyaltyPoints(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 400 when customerId is missing", () => {
        req.params = {};
        req.body = { points: 5 };
        validateSubtractCustomerLoyaltyPoints(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Customer ID is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when points are missing", () => {
        req.params = { customerId: "1" };
        req.body = {};
        validateSubtractCustomerLoyaltyPoints(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Points are required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when points are zero", () => {
        req.params = { customerId: "1" };
        req.body = { points: 0 };
        validateSubtractCustomerLoyaltyPoints(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Points must be at least 1") })
        );
        expect(next).not.toHaveBeenCalled();
    });
});
