const {
    validatePromotionCreate,
    validatePromotionUpdate,
    validateDeletePromotion,
    validateGetPromotionByCode,
    validateGetPromotionByStallId,
} = require("../middleware/promotionValidation");

function makeMocks() {
    const req = { body: {}, params: {} };
    const res = {
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();
    return { req, res, next };
}

describe("validatePromotionCreate", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        ({ req, res, next } = makeMocks());
    });

    const validBody = () => ({
        promotion: {
            promotionCode: "PROMO1",
            stallId: "1",
            itemCode: "A1",
            discount: 10,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
        },
    });

    it("should call next() for a valid promotion", () => {
        req.body = validBody();
        validatePromotionCreate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should accept a numeric stallId", () => {
        req.body = validBody();
        req.body.promotion.stallId = 1;
        validatePromotionCreate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it("should return 400 when promotion is missing", () => {
        req.body = {};
        validatePromotionCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Promotion is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when promotionCode is missing", () => {
        req.body = validBody();
        delete req.body.promotion.promotionCode;
        validatePromotionCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Promotion code is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when stallId is missing", () => {
        req.body = validBody();
        delete req.body.promotion.stallId;
        validatePromotionCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Stall is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when itemCode is missing", () => {
        req.body = validBody();
        delete req.body.promotion.itemCode;
        validatePromotionCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Item code is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when discount is negative", () => {
        req.body = validBody();
        req.body.promotion.discount = -1;
        validatePromotionCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Discount cannot be negative") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when discount is not a whole number", () => {
        req.body = validBody();
        req.body.promotion.discount = 1.5;
        validatePromotionCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Discount must be a whole number") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when startDate is missing", () => {
        req.body = validBody();
        delete req.body.promotion.startDate;
        validatePromotionCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Start date is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when endDate is before startDate", () => {
        req.body = validBody();
        req.body.promotion.endDate = "2025-12-31";
        validatePromotionCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("End date cannot be before start date") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when startDate is not a valid date", () => {
        req.body = validBody();
        req.body.promotion.startDate = "not-a-date";
        validatePromotionCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Start date must be a valid date") })
        );
        expect(next).not.toHaveBeenCalled();
    });
});

describe("validatePromotionUpdate", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        ({ req, res, next } = makeMocks());
    });

    const validBody = () => ({
        promotion: {
            promotionCode: "PROMO1",
            discount: 15,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
        },
    });

    it("should call next() for a valid update body", () => {
        req.body = validBody();
        validatePromotionUpdate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should call next() when only discount is provided", () => {
        req.body = { promotion: { promotionCode: "PROMO1", discount: 20 } };
        validatePromotionUpdate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it("should return 400 when promotionCode is missing", () => {
        req.body = validBody();
        delete req.body.promotion.promotionCode;
        validatePromotionUpdate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Promotion code is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when endDate is before startDate", () => {
        req.body = validBody();
        req.body.promotion.endDate = "2025-12-31";
        validatePromotionUpdate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("End date cannot be before start date") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when discount is negative", () => {
        req.body = validBody();
        req.body.promotion.discount = -1;
        validatePromotionUpdate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Discount cannot be negative") })
        );
        expect(next).not.toHaveBeenCalled();
    });
});

describe("validateDeletePromotion", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        ({ req, res, next } = makeMocks());
    });

    it("should call next() when promotionCode is present", () => {
        req.body = { promotionCode: "PROMO1" };
        validateDeletePromotion(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 400 when promotionCode is missing", () => {
        req.body = {};
        validateDeletePromotion(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Promotion code is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });
});

describe("validateGetPromotionByCode", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        ({ req, res, next } = makeMocks());
    });

    it("should call next() when promotionCode is present", () => {
        req.params = { promotionCode: "PROMO1" };
        validateGetPromotionByCode(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 400 when promotionCode is missing", () => {
        req.params = {};
        validateGetPromotionByCode(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Promotion code is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });
});

describe("validateGetPromotionByStallId", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        ({ req, res, next } = makeMocks());
    });

    it("should call next() when stallId is present", () => {
        req.params = { stallId: "1" };
        validateGetPromotionByStallId(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should accept a numeric stallId", () => {
        req.params = { stallId: 1 };
        validateGetPromotionByStallId(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it("should return 400 when stallId is missing", () => {
        req.params = {};
        validateGetPromotionByStallId(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Stall is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });
});
