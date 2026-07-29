const { poolPromise } = require("../db");
const promotionModel = require("../model/promotionModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));

describe("promotionModel.getAllPromotions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve all promotions", async () => {
        const mockPromos = [
            { promo_code: "PROMO1", stall_id: "1", discount: 20 },
            { promo_code: "PROMO2", stall_id: "2", discount: 10 },
        ];
        const mockRequest = { query: jest.fn().mockResolvedValue({ recordset: mockPromos }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const promos = await promotionModel.getAllPromotions();

        expect(mockRequest.query).toHaveBeenCalledWith("SELECT * FROM Promotion");
        expect(promos).toHaveLength(2);
        expect(promos).toEqual(mockPromos);
    });

    it("should handle errors", async () => {
        const mockRequest = { query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(promotionModel.getAllPromotions()).rejects.toThrow("DB Error");
    });
});

describe("promotionModel.getActivePromotions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve active promotions", async () => {
        const mockPromos = [{ promo_code: "PROMO1", discount: 20 }];
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: mockPromos }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const promos = await promotionModel.getActivePromotions();

        expect(mockRequest.input).toHaveBeenCalledWith("now", expect.any(Date));
        expect(promos).toEqual(mockPromos);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(promotionModel.getActivePromotions()).rejects.toThrow("DB Error");
    });
});

describe("promotionModel.getPromotionByCode", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve a promotion by code", async () => {
        const mockPromo = { promo_code: "PROMO1", discount: 20 };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [mockPromo] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const promo = await promotionModel.getPromotionByCode("PROMO1");

        expect(mockRequest.input).toHaveBeenCalledWith("promotionCode", "PROMO1");
        expect(promo).toEqual(mockPromo);
    });

    it("should return null when promotion not found", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const promo = await promotionModel.getPromotionByCode("INVALID");

        expect(promo).toBeNull();
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(promotionModel.getPromotionByCode("PROMO1")).rejects.toThrow("DB Error");
    });
});

describe("promotionModel.getPromotionByStallId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve promotions by stall ID", async () => {
        const mockPromos = [{ promo_code: "PROMO1", stall_id: "1" }];
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: mockPromos }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const promos = await promotionModel.getPromotionByStallId("1");

        expect(mockRequest.input).toHaveBeenCalledWith("stallId", "1");
        expect(promos).toEqual(mockPromos);
    });

    it("should return empty array when stall has no promotions", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const promos = await promotionModel.getPromotionByStallId("1");

        expect(promos).toEqual([]);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(promotionModel.getPromotionByStallId("1")).rejects.toThrow("DB Error");
    });
});

describe("promotionModel.createPromotion", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a new promotion", async () => {
        const promoInput = { promotionCode: "NEWCODE", stallId: "1", itemCode: "A1", discount: 15, startDate: new Date("2025-01-01"), endDate: new Date("2025-12-31") };
        const createdPromo = { promo_code: "NEWCODE", stall_id: "1", discount: 15 };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [createdPromo] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await promotionModel.createPromotion(promoInput);

        expect(mockRequest.input).toHaveBeenCalledWith("promotionCode", "NEWCODE");
        expect(mockRequest.input).toHaveBeenCalledWith("stallId", "1");
        expect(mockRequest.input).toHaveBeenCalledWith("discount", 15);
        expect(result).toEqual(createdPromo);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(promotionModel.createPromotion({})).rejects.toThrow("DB Error");
    });
});

describe("promotionModel.updatePromotion", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update an existing promotion", async () => {
        const updatedPromo = { promo_code: "PROMO1", discount: 25 };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [updatedPromo] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await promotionModel.updatePromotion({ promotionCode: "PROMO1", discount: 25 });

        expect(result).toEqual(updatedPromo);
    });

    it("should return null if promotion not found", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await promotionModel.updatePromotion({ promotionCode: "INVALID" });

        expect(result).toBeNull();
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(promotionModel.updatePromotion({})).rejects.toThrow("DB Error");
    });
});

describe("promotionModel.deletePromotion", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a promotion and return the deleted record", async () => {
        const deletedPromo = { promo_code: "PROMO1", discount: 20 };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [deletedPromo] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await promotionModel.deletePromotion("PROMO1");

        expect(result).toEqual(deletedPromo);
    });

    it("should return null if promotion not found", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await promotionModel.deletePromotion("INVALID");

        expect(result).toBeNull();
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(promotionModel.deletePromotion("PROMO1")).rejects.toThrow("DB Error");
    });
});
