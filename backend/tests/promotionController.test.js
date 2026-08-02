const promotionController = require("../controller/promotionController");
const promotionModel = require("../model/promotionModel");
const customerModel = require("../model/customerModel");
const accountModel = require("../model/accountModel");
const stallModel = require("../model/stallModel");
const hawkerCentreModel = require("../model/hawkerCentreModel");
const menuItemModel = require("../model/menuItemModel");
const email = require("../model/emailModel.js");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));
jest.mock("../model/promotionModel");
jest.mock("../model/customerModel");
jest.mock("../model/accountModel");
jest.mock("../model/stallModel");
jest.mock("../model/hawkerCentreModel");
jest.mock("../model/menuItemModel");
jest.mock("../model/emailModel", () => ({
    sendPromotion: jest.fn(),
}));

describe("promotionController.getAllPromotions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch all promotions and return 200", async () => {
        const mockPromos = [{ promo_code: "PROMO1", discount: 20 }];
        promotionModel.getAllPromotions.mockResolvedValue(mockPromos);

        const req = {};
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.getAllPromotions(req, res);

        expect(promotionModel.getAllPromotions).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockPromos);
    });

    it("should handle errors and return 500", async () => {
        promotionModel.getAllPromotions.mockRejectedValue(
            new Error("DB Error"),
        );

        const req = {};
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.getAllPromotions(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Failed to fetch promotions",
            details: "DB Error",
        });
    });
});

describe("promotionController.getPromotionByStallId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch promotions by stall ID and return 200", async () => {
        const mockPromos = [{ promo_code: "PROMO1" }];
        promotionModel.getPromotionByStallId.mockResolvedValue(mockPromos);

        const req = { params: { stallId: "1" } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.getPromotionByStallId(req, res);

        expect(promotionModel.getPromotionByStallId).toHaveBeenCalledWith("1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockPromos);
    });

    it("should handle errors and return 500", async () => {
        promotionModel.getPromotionByStallId.mockRejectedValue(
            new Error("DB Error"),
        );

        const req = { params: { stallId: "1" } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.getPromotionByStallId(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        // controller uses a distinct message for this endpoint
        expect(res.json).toHaveBeenCalledWith({
            error: "Failed to fetch promotions by stall id",
            details: "DB Error",
        });
    });
});

describe("promotionController.getActivePromotions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch active promotions and return 200", async () => {
        const mockPromos = [{ promo_code: "PROMO1" }];
        promotionModel.getActivePromotions.mockResolvedValue(mockPromos);

        const req = {};
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.getActivePromotions(req, res);

        expect(promotionModel.getActivePromotions).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockPromos);
    });

    it("should handle errors and return 500", async () => {
        promotionModel.getActivePromotions.mockRejectedValue(
            new Error("DB Error"),
        );

        const req = {};
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.getActivePromotions(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Failed to fetch promotions",
            details: "DB Error",
        });
    });
});

describe("promotionController.getPromotionByCode", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch a promotion by code and return 200", async () => {
        const mockPromo = { promo_code: "PROMO1", discount: 20 };
        promotionModel.getPromotionByCode.mockResolvedValueOnce(mockPromo);

        const req = { params: { promotionCode: "PROMO1" } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.getPromotionByCode(req, res);

        expect(promotionModel.getPromotionByCode).toHaveBeenCalledWith(
            "PROMO1",
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockPromo);
    });

    it("should call the model with undefined and return 200 when promotionCode param is missing (no validation in controller)", async () => {
        promotionModel.getPromotionByCode.mockResolvedValueOnce(null);

        const req = { params: {} };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.getPromotionByCode(req, res);

        expect(promotionModel.getPromotionByCode).toHaveBeenCalledWith(
            undefined,
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(null);
    });

    it("should handle errors and return 500", async () => {
        promotionModel.getPromotionByCode.mockRejectedValueOnce(
            new Error("DB Error"),
        );

        const req = { params: { promotionCode: "PROMO1" } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.getPromotionByCode(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Failed to fetch promotions",
            details: "DB Error",
        });
    });
});

describe("promotionController.createPromotion", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a promotion, send emails, and return 201", async () => {
        const mockPromo = {
            promo_code: "NEWCODE",
            stall_id: "1",
            item_code: "A1",
            discount: 15,
        };
        promotionModel.createPromotion.mockResolvedValueOnce(mockPromo);
        customerModel.getAllCustomers.mockResolvedValueOnce([
            { customer_id: "c1" },
        ]);
        accountModel.getAccountById.mockResolvedValueOnce({
            account_email: "test@test.com",
        });
        stallModel.getStallById.mockResolvedValueOnce({
            stall_name: "Best Stall",
            hawker_centre_id: "hc1",
        });
        hawkerCentreModel.getHawkerCentreById.mockResolvedValueOnce({
            centre_name: "Central Hawker",
        });
        menuItemModel.getMenuItemsByStallIdAndItemCode.mockResolvedValueOnce({
            item_desc: "Chicken Rice",
        });
        email.sendPromotion.mockResolvedValueOnce(true);

        const req = {
            body: {
                promotion: {
                    promotionCode: "NEWCODE",
                    stallId: "1",
                    itemCode: "A1",
                    discount: 15,
                },
            },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.createPromotion(req, res);

        expect(promotionModel.createPromotion).toHaveBeenCalledTimes(1);
        expect(customerModel.getAllCustomers).toHaveBeenCalledTimes(1);
        expect(email.sendPromotion).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockPromo);
    });

    it("should create a promotion with no customers to email", async () => {
        const mockPromo = {
            promo_code: "NEWCODE",
            stall_id: "1",
            item_code: "A1",
            discount: 15,
        };
        promotionModel.createPromotion.mockResolvedValueOnce(mockPromo);
        customerModel.getAllCustomers.mockResolvedValueOnce([]); // no customers
        stallModel.getStallById.mockResolvedValueOnce({
            stall_name: "Best Stall",
            hawker_centre_id: "hc1",
        });
        hawkerCentreModel.getHawkerCentreById.mockResolvedValueOnce({
            centre_name: "Central Hawker",
        });
        menuItemModel.getMenuItemsByStallIdAndItemCode.mockResolvedValueOnce({
            item_desc: "Chicken Rice",
        });

        const req = {
            body: {
                promotion: {
                    promotionCode: "NEWCODE",
                    stallId: "1",
                    itemCode: "A1",
                    discount: 15,
                },
            },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.createPromotion(req, res);

        expect(email.sendPromotion).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockPromo);
    });

    it("should still create a promotion when promotion body is missing (no validation in controller)", async () => {
        const mockPromo = { promo_code: undefined };
        promotionModel.createPromotion.mockResolvedValueOnce(mockPromo);
        customerModel.getAllCustomers.mockResolvedValueOnce([]);
        stallModel.getStallById.mockResolvedValueOnce({
            stall_name: "Stall",
            hawker_centre_id: "hc1",
        });
        hawkerCentreModel.getHawkerCentreById.mockResolvedValueOnce({
            centre_name: "Centre",
        });
        menuItemModel.getMenuItemsByStallIdAndItemCode.mockResolvedValueOnce({
            item_desc: "Item",
        });

        const req = { body: {} };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.createPromotion(req, res);

        expect(promotionModel.createPromotion).toHaveBeenCalledWith(undefined);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockPromo);
    });

    it("should handle errors and return 500", async () => {
        promotionModel.createPromotion.mockRejectedValueOnce(
            new Error("DB Error"),
        );

        const req = { body: { promotion: {} } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.createPromotion(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Failed to create promotion",
            details: "DB Error",
        });
    });
});

describe("promotionController.updatePromotion", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update a promotion and return 200", async () => {
        const updated = { promo_code: "PROMO1", discount: 25 };
        promotionModel.updatePromotion.mockResolvedValueOnce(updated);

        const req = {
            body: { promotion: { promotionCode: "PROMO1", discount: 25 } },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.updatePromotion(req, res);

        expect(promotionModel.updatePromotion).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(updated);
    });

    it("should call the model with undefined and return 200 when promotion body is missing (no validation in controller)", async () => {
        promotionModel.updatePromotion.mockResolvedValueOnce(undefined);

        const req = { body: {} };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.updatePromotion(req, res);

        expect(promotionModel.updatePromotion).toHaveBeenCalledWith(undefined);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(undefined);
    });

    it("should return 200 with null body when promotion is not found (no 404 check in controller)", async () => {
        promotionModel.updatePromotion.mockResolvedValueOnce(null);

        const req = { body: { promotion: { promotionCode: "INVALID" } } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.updatePromotion(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(null);
    });

    it("should handle errors and return 500", async () => {
        promotionModel.updatePromotion.mockRejectedValueOnce(
            new Error("DB Error"),
        );

        const req = { body: { promotion: { promotionCode: "PROMO1" } } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.updatePromotion(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Failed to update promotion",
            details: "DB Error",
        });
    });
});

describe("promotionController.deletePromotion", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a promotion and return 200", async () => {
        const deleted = { promo_code: "PROMO1" };
        promotionModel.deletePromotion.mockResolvedValueOnce(deleted);

        const req = { body: { promotionCode: "PROMO1" } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.deletePromotion(req, res);

        expect(promotionModel.deletePromotion).toHaveBeenCalledWith("PROMO1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Promotion deleted",
            deleted,
        });
    });

    it("should call the model with undefined and return 200 when promotionCode is missing (no validation in controller)", async () => {
        promotionModel.deletePromotion.mockResolvedValueOnce(undefined);

        const req = { body: {} };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.deletePromotion(req, res);

        expect(promotionModel.deletePromotion).toHaveBeenCalledWith(undefined);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Promotion deleted",
            deleted: undefined,
        });
    });

    it("should return 200 with deleted:null when promotion is not found (no 404 check in controller)", async () => {
        promotionModel.deletePromotion.mockResolvedValueOnce(null);

        const req = { body: { promotionCode: "INVALID" } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.deletePromotion(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Promotion deleted",
            deleted: null,
        });
    });

    it("should handle errors and return 500", async () => {
        promotionModel.deletePromotion.mockRejectedValueOnce(
            new Error("DB Error"),
        );

        const req = { body: { promotionCode: "PROMO1" } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await promotionController.deletePromotion(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Failed to delete promotion",
            details: "DB Error",
        });
    });
});
