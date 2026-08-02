const hawkerCentreController = require("../controller/hawkerCentreController");
const hawkerCentreModel = require("../model/hawkerCentreModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));
jest.mock("../model/hawkerCentreModel");


describe("hawkerCentreController.getAllHawkerCentres", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return all hawker centres for a Customer", async () => {
        const mockCentres = [
            { hawker_centre_id: "hc1", centre_name: "Maxwell Food Centre" },
            { hawker_centre_id: "hc2", centre_name: "Chinatown Complex" },
        ];
        hawkerCentreModel.getAllHawkerCentres.mockResolvedValue(mockCentres);

        const req = { user: { id: "cust1", role: "Customer" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await hawkerCentreController.getAllHawkerCentres(req, res);

        expect(hawkerCentreModel.getAllHawkerCentres).toHaveBeenCalledTimes(1);
        expect(hawkerCentreModel.getHawkerCentresByOperatorId).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockCentres);
    });

    it("should return all hawker centres for a Vendor", async () => {
        const mockCentres = [{ hawker_centre_id: "hc1", centre_name: "Maxwell Food Centre" }];
        hawkerCentreModel.getAllHawkerCentres.mockResolvedValue(mockCentres);

        const req = { user: { id: "vend1", role: "Vendor" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await hawkerCentreController.getAllHawkerCentres(req, res);

        expect(hawkerCentreModel.getAllHawkerCentres).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockCentres);
    });

    it("should return only the operator's own hawker centres for an Operator", async () => {
        const mockCentres = [{ hawker_centre_id: "hc1", centre_name: "Maxwell Food Centre", operator_id: "op1" }];
        hawkerCentreModel.getHawkerCentresByOperatorId.mockResolvedValue(mockCentres);

        const req = { user: { id: "op1", role: "Operator" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await hawkerCentreController.getAllHawkerCentres(req, res);

        expect(hawkerCentreModel.getHawkerCentresByOperatorId).toHaveBeenCalledWith("op1");
        expect(hawkerCentreModel.getAllHawkerCentres).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockCentres);
    });

    it("should handle errors and return 500", async () => {
        hawkerCentreModel.getAllHawkerCentres.mockRejectedValue(new Error("DB Error"));

        const req = { user: { id: "cust1", role: "Customer" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await hawkerCentreController.getAllHawkerCentres(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch hawker centres", details: "DB Error" });
    });
});

describe("hawkerCentreController.getHawkerCentreById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return a hawker centre with its stalls", async () => {
        const mockCentre = { hawker_centre_id: "hc1", centre_name: "Maxwell Food Centre", address: "1 Kadayanallur St" };
        const mockStalls = [{ stall_id: "s1", stall_name: "Kim Kitchen" }];
        hawkerCentreModel.getHawkerCentreById.mockResolvedValue(mockCentre);
        hawkerCentreModel.getStallsByHawkerCentreId.mockResolvedValue(mockStalls);

        const req = { params: { id: "hc1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await hawkerCentreController.getHawkerCentreById(req, res);

        expect(hawkerCentreModel.getHawkerCentreById).toHaveBeenCalledWith("hc1");
        expect(hawkerCentreModel.getStallsByHawkerCentreId).toHaveBeenCalledWith("hc1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ ...mockCentre, stalls: mockStalls });
    });

    it("should return 404 if the hawker centre is not found", async () => {
        hawkerCentreModel.getHawkerCentreById.mockResolvedValue(null);

        const req = { params: { id: "nope" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await hawkerCentreController.getHawkerCentreById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Hawker centre not found" });
        expect(hawkerCentreModel.getStallsByHawkerCentreId).not.toHaveBeenCalled();
    });

    it("should return the hawker centre with an empty stalls array when it has no stalls", async () => {
        const mockCentre = { hawker_centre_id: "hc1", centre_name: "Maxwell Food Centre" };
        hawkerCentreModel.getHawkerCentreById.mockResolvedValue(mockCentre);
        hawkerCentreModel.getStallsByHawkerCentreId.mockResolvedValue([]);

        const req = { params: { id: "hc1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await hawkerCentreController.getHawkerCentreById(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ ...mockCentre, stalls: [] });
    });

    it("should handle errors and return 500", async () => {
        hawkerCentreModel.getHawkerCentreById.mockRejectedValue(new Error("DB Error"));

        const req = { params: { id: "hc1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await hawkerCentreController.getHawkerCentreById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch hawker centre", details: "DB Error" });
    });
});