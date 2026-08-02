const {
    getAllHawkerCentres,
    getHawkerCentreById,
} = require("../controller/hawkerCentreController");
const hawkerCentreModel = require("../model/hawkerCentreModel");

// Mock dependencies
jest.mock("../model/hawkerCentreModel");

// Mock console.error
beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
    console.error.mockRestore();
});

describe("hawkerCentreController Unit Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {},
            user: { id: "user_1", role: "Customer" },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // getAllHawkerCentres
    describe("getAllHawkerCentres", () => {
        const mockHawkerCentres = [
            {
                hawker_centre_id: "hc_1",
                centre_name: "Maxwell Food Centre",
                address: "1 Kadayanallur St",
                operator_id: "op_1",
            },
            {
                hawker_centre_id: "hc_2",
                centre_name: "Chinatown Complex",
                address: "335 Smith St",
                operator_id: "op_2",
            },
        ];

        test("should return all hawker centres for non-Operator user", async () => {
            req.user.role = "Customer";
            hawkerCentreModel.getAllHawkerCentres.mockResolvedValue(mockHawkerCentres);

            await getAllHawkerCentres(req, res);

            expect(hawkerCentreModel.getAllHawkerCentres).toHaveBeenCalled();
            expect(hawkerCentreModel.getHawkerCentresByOperatorId).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockHawkerCentres);
        });

        test("should return hawker centres by operator id for Operator user", async () => {
            req.user.role = "Operator";
            req.user.id = "op_1";
            const mockOperatorCentres = [mockHawkerCentres[0]];
            hawkerCentreModel.getHawkerCentresByOperatorId.mockResolvedValue(mockOperatorCentres);

            await getAllHawkerCentres(req, res);

            expect(hawkerCentreModel.getHawkerCentresByOperatorId).toHaveBeenCalledWith("op_1");
            expect(hawkerCentreModel.getAllHawkerCentres).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockOperatorCentres);
        });

        test("should return empty array when no hawker centres found", async () => {
            req.user.role = "Customer";
            hawkerCentreModel.getAllHawkerCentres.mockResolvedValue([]);

            await getAllHawkerCentres(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        test("should return 500 when model throws error", async () => {
            req.user.role = "Customer";
            hawkerCentreModel.getAllHawkerCentres.mockRejectedValue(
                new Error("Database connection error"),
            );

            await getAllHawkerCentres(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Failed to fetch hawker centres",
                details: "Database connection error",
            });
        });
    });

    // getHawkerCentreById
    describe("getHawkerCentreById", () => {
        const mockCentre = {
            hawker_centre_id: "hc_1",
            centre_name: "Maxwell Food Centre",
            address: "1 Kadayanallur St",
            operator_id: "op_1",
        };
        const mockStalls = [
            { stall_id: "stall_A", stall_name: "Kim Kitchen", stall_unit_no: "#01-01" },
            { stall_id: "stall_B", stall_name: "Sakura Sushi", stall_unit_no: "#01-02" },
        ];

        test("should return hawker centre with stalls successfully", async () => {
            req.params.id = "hc_1";
            hawkerCentreModel.getHawkerCentreById.mockResolvedValue(mockCentre);
            hawkerCentreModel.getStallsByHawkerCentreId.mockResolvedValue(mockStalls);

            await getHawkerCentreById(req, res);

            expect(hawkerCentreModel.getHawkerCentreById).toHaveBeenCalledWith("hc_1");
            expect(hawkerCentreModel.getStallsByHawkerCentreId).toHaveBeenCalledWith("hc_1");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                ...mockCentre,
                stalls: mockStalls,
            });
        });

        test("should return 404 if hawker centre not found", async () => {
            req.params.id = "hc_1";
            hawkerCentreModel.getHawkerCentreById.mockResolvedValue(null);

            await getHawkerCentreById(req, res);

            expect(hawkerCentreModel.getStallsByHawkerCentreId).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: "Hawker centre not found",
            });
        });

        test("should return 500 when getHawkerCentreById throws error", async () => {
            req.params.id = "hc_1";
            hawkerCentreModel.getHawkerCentreById.mockRejectedValue(
                new Error("Database error"),
            );

            await getHawkerCentreById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Failed to fetch hawker centre",
                details: "Database error",
            });
        });

        test("should return 500 when getStallsByHawkerCentreId throws error", async () => {
            req.params.id = "hc_1";
            hawkerCentreModel.getHawkerCentreById.mockResolvedValue(mockCentre);
            hawkerCentreModel.getStallsByHawkerCentreId.mockRejectedValue(
                new Error("Stall query failed"),
            );

            await getHawkerCentreById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Failed to fetch hawker centre",
                details: "Stall query failed",
            });
        });
    });
});