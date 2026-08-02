const { poolPromise } = require("../db");
const rentalAgreementModel = require("../model/rentalAgreementModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));

describe("rentalAgreementModel.getRentalAgreementsByStallId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve rental agreements for a stall", async () => {
        const mockAgreements = [
            { rental_agreement_id: "ra1", stall_id: "stall-1", status: "Active" },
        ];
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: mockAgreements }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const agreements = await rentalAgreementModel.getRentalAgreementsByStallId("stall-1");

        expect(mockRequest.input).toHaveBeenCalledWith("stall_id", "stall-1");
        expect(agreements).toEqual(mockAgreements);
    });

    it("should return an empty array when the stall has no agreements", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const agreements = await rentalAgreementModel.getRentalAgreementsByStallId("stall-1");

        expect(agreements).toEqual([]);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(rentalAgreementModel.getRentalAgreementsByStallId("stall-1")).rejects.toThrow("DB Error");
    });
});

describe("rentalAgreementModel.getRentalAgreementById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve a rental agreement by id", async () => {
        const mockAgreement = { rental_agreement_id: "ra1", stall_id: "stall-1", status: "Active" };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [mockAgreement] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const agreement = await rentalAgreementModel.getRentalAgreementById("ra1");

        expect(mockRequest.input).toHaveBeenCalledWith("rental_agreement_id", "ra1");
        expect(agreement).toEqual(mockAgreement);
    });

    it("should return null when no agreement matches", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const agreement = await rentalAgreementModel.getRentalAgreementById("nope");

        expect(agreement).toBeNull();
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(rentalAgreementModel.getRentalAgreementById("ra1")).rejects.toThrow("DB Error");
    });
});

describe("rentalAgreementModel.createRentalAgreement", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a new rental agreement with default status", async () => {
        const input = {
            stallId: "stall-1",
            operatorId: "op-1",
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            rentalFee: 1200,
        };
        const created = { rental_agreement_id: "ra1", stall_id: "stall-1", status: "Active" };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [created] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await rentalAgreementModel.createRentalAgreement(input);

        expect(mockRequest.input).toHaveBeenCalledWith("stall_id", "stall-1");
        expect(mockRequest.input).toHaveBeenCalledWith("operator_id", "op-1");
        expect(mockRequest.input).toHaveBeenCalledWith("start_date", "2026-01-01");
        expect(mockRequest.input).toHaveBeenCalledWith("end_date", "2026-12-31");
        expect(mockRequest.input).toHaveBeenCalledWith("rental_fee", 1200);
        expect(mockRequest.input).toHaveBeenCalledWith("status", "Active");
        expect(result).toEqual(created);
    });

    it("should use the provided status when given", async () => {
        const input = {
            stallId: "stall-1",
            operatorId: "op-1",
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            rentalFee: 1200,
            status: "Terminated",
        };
        const created = { rental_agreement_id: "ra1", status: "Terminated" };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [created] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await rentalAgreementModel.createRentalAgreement(input);

        expect(mockRequest.input).toHaveBeenCalledWith("status", "Terminated");
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(rentalAgreementModel.createRentalAgreement({})).rejects.toThrow("DB Error");
    });
});

describe("rentalAgreementModel.updateRentalAgreement", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update an existing rental agreement", async () => {
        const updated = { rental_agreement_id: "ra1", status: "Terminated" };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [updated] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await rentalAgreementModel.updateRentalAgreement({
            rentalAgreementId: "ra1",
            status: "Terminated",
        });

        expect(mockRequest.input).toHaveBeenCalledWith("rental_agreement_id", "ra1");
        expect(mockRequest.input).toHaveBeenCalledWith("status", "Terminated");
        expect(result).toEqual(updated);
    });

    it("should return null when no agreement is updated", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await rentalAgreementModel.updateRentalAgreement({ rentalAgreementId: "nope" });

        expect(result).toBeNull();
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(rentalAgreementModel.updateRentalAgreement({})).rejects.toThrow("DB Error");
    });
});