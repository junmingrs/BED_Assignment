const { poolPromise } = require("../db");
const inspectionController = require("../controller/inspectionController");
const inspectionModel = require("../model/inspectionModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));
jest.mock("../model/inspectionModel");

describe("inspectionController.getInspections", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return inspections for a stall with 200", async () => {
        const mockInspections = [{ inspection_id: "i1", score: 85 }];
        inspectionModel.getInspectionsByStallId.mockResolvedValue(mockInspections);

        const req = { params: { stallId: "stall-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.getInspections(req, res);

        expect(inspectionModel.getInspectionsByStallId).toHaveBeenCalledWith("stall-1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockInspections);
    });

    it("should handle errors and return 500", async () => {
        inspectionModel.getInspectionsByStallId.mockRejectedValue(new Error("DB Error"));

        const req = { params: { stallId: "stall-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.getInspections(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "DB Error" });
    });
});

describe("inspectionController.createInspection", () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        const mockPool = await poolPromise;
        mockPool.request.mockReturnThis();
    });

    it("should return 400 when score is missing", async () => {
        const req = { params: { stallId: "stall-1" }, body: { hygiene_grade: "A" }, user: { id: "nea-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.createInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Missing required fields: score, hygiene_grade" });
    });

    it("should return 400 when hygiene_grade is missing", async () => {
        const req = { params: { stallId: "stall-1" }, body: { score: 85 }, user: { id: "nea-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.createInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Missing required fields: score, hygiene_grade" });
    });

    it("should return 400 when score is out of range", async () => {
        const req = { params: { stallId: "stall-1" }, body: { score: 150, hygiene_grade: "A" }, user: { id: "nea-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.createInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Score must be between 0 and 100" });
    });

    it("should return 400 when hygiene_grade is invalid", async () => {
        const req = { params: { stallId: "stall-1" }, body: { score: 85, hygiene_grade: "Z" }, user: { id: "nea-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.createInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Hygiene grade must be A, B, C, or D" });
    });

    it("should return 404 when the stall does not exist", async () => {
        const stallCheckRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(stallCheckRequest);

        const req = { params: { stallId: "nope" }, body: { score: 85, hygiene_grade: "A" }, user: { id: "nea-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.createInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Stall not found" });
        expect(inspectionModel.createInspection).not.toHaveBeenCalled();
    });

    it("should create an inspection and return 201 when valid", async () => {
        const stallCheckRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [{ stall_id: "stall-1" }] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(stallCheckRequest);

        const created = { inspection_id: "i1", stall_id: "stall-1", nea_id: "nea-1", score: 85, hygiene_grade: "A" };
        inspectionModel.createInspection.mockResolvedValue(created);

        const req = { params: { stallId: "stall-1" }, body: { score: 85, remarks: "Good", hygiene_grade: "A" }, user: { id: "nea-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.createInspection(req, res);

        expect(inspectionModel.createInspection).toHaveBeenCalledWith("stall-1", "nea-1", 85, "Good", "A");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(created);
    });

    it("should handle errors and return 500", async () => {
        const stallCheckRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(stallCheckRequest);

        const req = { params: { stallId: "stall-1" }, body: { score: 85, hygiene_grade: "A" }, user: { id: "nea-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.createInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "DB Error" });
    });
});

describe("inspectionController.deleteInspection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete an inspection and return 200", async () => {
        inspectionModel.deleteInspection.mockResolvedValue({ message: "Inspection deleted successfully" });

        const req = { params: { inspectionId: "i1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.deleteInspection(req, res);

        expect(inspectionModel.deleteInspection).toHaveBeenCalledWith("i1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "Inspection deleted successfully" });
    });

    it("should handle errors and return 500", async () => {
        inspectionModel.deleteInspection.mockRejectedValue(new Error("Inspection not found"));

        const req = { params: { inspectionId: "nope" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.deleteInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Inspection not found" });
    });
});

describe("inspectionController.getInspectionById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return an inspection with 200", async () => {
        const mockInspection = { inspection_id: "i1", stall_id: "stall-1", score: 85 };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [mockInspection] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const req = { params: { inspectionId: "i1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.getInspectionById(req, res);

        expect(mockRequest.input).toHaveBeenCalledWith("inspectionId", "i1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockInspection);
    });

    it("should return 404 when the inspection is not found", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const req = { params: { inspectionId: "nope" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.getInspectionById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Inspection not found" });
    });

    it("should handle errors and return 500", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const req = { params: { inspectionId: "i1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.getInspectionById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "DB Error" });
    });
});

describe("inspectionController.updateInspection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 404 when the inspection does not exist", async () => {
        const checkRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(checkRequest);

        const req = { params: { inspectionId: "nope" }, body: { score: 90, hygiene_grade: "A" }, user: { id: "nea-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.updateInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Inspection not found" });
    });

    it("should update an inspection and return 200 when it exists", async () => {
        const existing = { inspection_id: "i1", stall_id: "stall-1", score: 70, hygiene_grade: "C" };
        const updated = { inspection_id: "i1", stall_id: "stall-1", score: 90, hygiene_grade: "A" };

        const checkRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [existing] }) };
        const updateRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const selectRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [updated] }) };

        const mockPool = await poolPromise;
        mockPool.request
            .mockReturnValueOnce(checkRequest)
            .mockReturnValueOnce(updateRequest)
            .mockReturnValueOnce(selectRequest);

        const req = { params: { inspectionId: "i1" }, body: { score: 90, remarks: "Improved", hygiene_grade: "A" }, user: { id: "nea-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.updateInspection(req, res);

        expect(updateRequest.input).toHaveBeenCalledWith("score", 90);
        expect(updateRequest.input).toHaveBeenCalledWith("remarks", "Improved");
        expect(updateRequest.input).toHaveBeenCalledWith("hygiene_grade", "A");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(updated);
    });

    it("should handle errors and return 500", async () => {
        const checkRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(checkRequest);

        const req = { params: { inspectionId: "i1" }, body: { score: 90, hygiene_grade: "A" }, user: { id: "nea-1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await inspectionController.updateInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "DB Error" });
    });
});