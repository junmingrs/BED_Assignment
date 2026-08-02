const { poolPromise } = require("../db");
const hawkerCentreModel = require("../model/hawkerCentreModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));

describe("hawkerCentreModel.getAllHawkerCentres", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve all hawker centres", async () => {
        const mockCentres = [
            { hawker_centre_id: "hc1", centre_name: "Maxwell Food Centre" },
            { hawker_centre_id: "hc2", centre_name: "Chinatown Complex" },
        ];
        const mockRequest = { query: jest.fn().mockResolvedValue({ recordset: mockCentres }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const centres = await hawkerCentreModel.getAllHawkerCentres();

        expect(mockRequest.query).toHaveBeenCalledWith("SELECT * FROM HawkerCentre");
        expect(centres).toEqual(mockCentres);
    });

    it("should handle errors", async () => {
        const mockRequest = { query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(hawkerCentreModel.getAllHawkerCentres()).rejects.toThrow("DB Error");
    });
});

describe("hawkerCentreModel.getHawkerCentreById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve a hawker centre by id", async () => {
        const mockCentre = { hawker_centre_id: "hc1", centre_name: "Maxwell Food Centre" };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [mockCentre] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const centre = await hawkerCentreModel.getHawkerCentreById("hc1");

        expect(mockRequest.input).toHaveBeenCalledWith("hawker_centre_id", "hc1");
        expect(centre).toEqual(mockCentre);
    });

    it("should return null when no hawker centre matches", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const centre = await hawkerCentreModel.getHawkerCentreById("nope");

        expect(centre).toBeNull();
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(hawkerCentreModel.getHawkerCentreById("hc1")).rejects.toThrow("DB Error");
    });
});

describe("hawkerCentreModel.getStallsByHawkerCentreId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve stalls for a hawker centre", async () => {
        const mockStalls = [
            { stall_id: "s1", stall_name: "Kim Kitchen", hawker_centre_id: "hc1" },
            { stall_id: "s2", stall_name: "Sakura Sushi", hawker_centre_id: "hc1" },
        ];
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: mockStalls }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const stalls = await hawkerCentreModel.getStallsByHawkerCentreId("hc1");

        expect(mockRequest.input).toHaveBeenCalledWith("hawker_centre_id", "hc1");
        expect(stalls).toEqual(mockStalls);
    });

    it("should return an empty array when the hawker centre has no stalls", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const stalls = await hawkerCentreModel.getStallsByHawkerCentreId("hc1");

        expect(stalls).toEqual([]);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(hawkerCentreModel.getStallsByHawkerCentreId("hc1")).rejects.toThrow("DB Error");
    });
});

describe("hawkerCentreModel.getHawkerCentresByOperatorId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve hawker centres for an operator", async () => {
        const mockCentres = [{ hawker_centre_id: "hc1", operator_id: "op1" }];
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: mockCentres }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const centres = await hawkerCentreModel.getHawkerCentresByOperatorId("op1");

        expect(mockRequest.input).toHaveBeenCalledWith("operator_id", "op1");
        expect(centres).toEqual(mockCentres);
    });

    it("should return an empty array when the operator has no hawker centres", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const centres = await hawkerCentreModel.getHawkerCentresByOperatorId("op1");

        expect(centres).toEqual([]);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(hawkerCentreModel.getHawkerCentresByOperatorId("op1")).rejects.toThrow("DB Error");
    });
});