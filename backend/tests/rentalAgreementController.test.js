const rentalAgreementController = require("../controller/rentalAgreementController");
const rentalAgreementModel = require("../model/rentalAgreementModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));
jest.mock("../model/rentalAgreementModel");

describe("rentalAgreementController.getRentalAgreementsByStallId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch rental agreements by stall ID and return 200", async () => {
        const mockAgreements = [{ rental_agreement_id: "ra1", stall_id: "stall-1" }];
        rentalAgreementModel.getRentalAgreementsByStallId.mockResolvedValue(mockAgreements);

        const req = { query: { stallId: "stall-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.getRentalAgreementsByStallId(req, res);

        expect(rentalAgreementModel.getRentalAgreementsByStallId).toHaveBeenCalledWith("stall-1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockAgreements);
    });

    it("should return 400 if stallId is missing", async () => {
        const req = { query: {} };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.getRentalAgreementsByStallId(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "stallId is required" });
        expect(rentalAgreementModel.getRentalAgreementsByStallId).not.toHaveBeenCalled();
    });

    it("should handle errors and return 500", async () => {
        rentalAgreementModel.getRentalAgreementsByStallId.mockRejectedValue(new Error("DB Error"));

        const req = { query: { stallId: "stall-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.getRentalAgreementsByStallId(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch rental agreements", details: "DB Error" });
    });
});

describe("rentalAgreementController.getRentalAgreementById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch a rental agreement by id and return 200", async () => {
        const mockAgreement = { rental_agreement_id: "ra1", status: "Active" };
        rentalAgreementModel.getRentalAgreementById.mockResolvedValue(mockAgreement);

        const req = { params: { id: "ra1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.getRentalAgreementById(req, res);

        expect(rentalAgreementModel.getRentalAgreementById).toHaveBeenCalledWith("ra1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockAgreement);
    });

    it("should return 404 if agreement not found", async () => {
        rentalAgreementModel.getRentalAgreementById.mockResolvedValue(null);

        const req = { params: { id: "nope" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.getRentalAgreementById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Rental agreement not found" });
    });

    it("should handle errors and return 500", async () => {
        rentalAgreementModel.getRentalAgreementById.mockRejectedValue(new Error("DB Error"));

        const req = { params: { id: "ra1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.getRentalAgreementById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch rental agreement", details: "DB Error" });
    });
});

describe("rentalAgreementController.createRentalAgreement", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a rental agreement and return 201", async () => {
        const body = {
            stallId: "stall-1",
            operatorId: "op-1",
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            rentalFee: 1200,
        };
        const created = { rental_agreement_id: "ra1", ...body };
        rentalAgreementModel.createRentalAgreement.mockResolvedValue(created);

        const req = { body };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.createRentalAgreement(req, res);

        expect(rentalAgreementModel.createRentalAgreement).toHaveBeenCalledWith(body);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(created);
    });

    it("should return 400 if required fields are missing", async () => {
        const req = { body: { stallId: "stall-1" } }; // missing the rest
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.createRentalAgreement(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Missing required fields" });
        expect(rentalAgreementModel.createRentalAgreement).not.toHaveBeenCalled();
    });

    it("should handle errors and return 500", async () => {
        rentalAgreementModel.createRentalAgreement.mockRejectedValue(new Error("DB Error"));

        const req = {
            body: {
                stallId: "stall-1",
                operatorId: "op-1",
                startDate: "2026-01-01",
                endDate: "2026-12-31",
                rentalFee: 1200,
            },
        };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.createRentalAgreement(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to create rental agreement", details: "DB Error" });
    });
});

describe("rentalAgreementController.updateRentalAgreement", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update a rental agreement and return 200", async () => {
        const updated = { rental_agreement_id: "ra1", status: "Terminated" };
        rentalAgreementModel.updateRentalAgreement.mockResolvedValue(updated);

        const req = { body: { rentalAgreementId: "ra1", status: "Terminated" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.updateRentalAgreement(req, res);

        expect(rentalAgreementModel.updateRentalAgreement).toHaveBeenCalledWith(req.body);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(updated);
    });

    it("should return 400 if rentalAgreementId is missing", async () => {
        const req = { body: { status: "Terminated" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.updateRentalAgreement(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "rentalAgreementId is required" });
        expect(rentalAgreementModel.updateRentalAgreement).not.toHaveBeenCalled();
    });

    it("should return 404 if agreement not found", async () => {
        rentalAgreementModel.updateRentalAgreement.mockResolvedValue(null);

        const req = { body: { rentalAgreementId: "nope" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.updateRentalAgreement(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Rental agreement not found" });
    });

    it("should handle errors and return 500", async () => {
        rentalAgreementModel.updateRentalAgreement.mockRejectedValue(new Error("DB Error"));

        const req = { body: { rentalAgreementId: "ra1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await rentalAgreementController.updateRentalAgreement(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to update rental agreement", details: "DB Error" });
    });
});