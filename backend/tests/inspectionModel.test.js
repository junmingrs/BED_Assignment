const { poolPromise } = require("../db");
const inspectionModel = require("../model/inspectionModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));

describe("inspectionModel.getInspectionsByStallId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve inspections for a stall", async () => {
        const mockInspections = [
            { inspection_id: "i1", score: 85, hygiene_grade: "B", nea_email: "nea@email.com" },
        ];
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: mockInspections }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const inspections = await inspectionModel.getInspectionsByStallId("stall-1");

        expect(mockRequest.input).toHaveBeenCalledWith("stallId", "stall-1");
        expect(inspections).toEqual(mockInspections);
    });

    it("should return an empty array when the stall has no inspections", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const inspections = await inspectionModel.getInspectionsByStallId("stall-1");

        expect(inspections).toEqual([]);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(inspectionModel.getInspectionsByStallId("stall-1")).rejects.toThrow("DB Error");
    });
});

describe("inspectionModel.createInspection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create an inspection and return the newly created row", async () => {
        const created = { inspection_id: "i1", stall_id: "stall-1", nea_id: "nea-1", score: 90, hygiene_grade: "A" };
        const insertRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const selectRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [created] }) };
        const mockPool = await poolPromise;
        mockPool.request
            .mockReturnValueOnce(insertRequest)
            .mockReturnValueOnce(selectRequest);

        const result = await inspectionModel.createInspection("stall-1", "nea-1", 90, "Great job", "A");

        expect(insertRequest.input).toHaveBeenCalledWith("stallId", "stall-1");
        expect(insertRequest.input).toHaveBeenCalledWith("neaId", "nea-1");
        expect(insertRequest.input).toHaveBeenCalledWith("score", 90);
        expect(insertRequest.input).toHaveBeenCalledWith("remarks", "Great job");
        expect(insertRequest.input).toHaveBeenCalledWith("hygieneGrade", "A");
        expect(result).toEqual(created);
    });

    it("should default remarks to null when not provided", async () => {
        const created = { inspection_id: "i1" };
        const insertRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const selectRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [created] }) };
        const mockPool = await poolPromise;
        mockPool.request
            .mockReturnValueOnce(insertRequest)
            .mockReturnValueOnce(selectRequest);

        await inspectionModel.createInspection("stall-1", "nea-1", 90, undefined, "A");

        expect(insertRequest.input).toHaveBeenCalledWith("remarks", null);
    });

    it("should handle errors", async () => {
        const insertRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(insertRequest);

        await expect(inspectionModel.createInspection("stall-1", "nea-1", 90, "", "A")).rejects.toThrow("DB Error");
    });
});

describe("inspectionModel.deleteInspection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete an inspection that exists", async () => {
        const checkRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [{ inspection_id: "i1" }] }) };
        const deleteRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const mockPool = await poolPromise;
        mockPool.request
            .mockReturnValueOnce(checkRequest)
            .mockReturnValueOnce(deleteRequest);

        const result = await inspectionModel.deleteInspection("i1");

        expect(result).toEqual({ message: "Inspection deleted successfully" });
    });

    it("should throw when the inspection does not exist", async () => {
        const checkRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(checkRequest);

        await expect(inspectionModel.deleteInspection("nope")).rejects.toThrow("Inspection not found");
    });
});

describe("inspectionModel.getInspectionById", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve an inspection by id", async () => {
        const mockInspection = { inspection_id: "i1", score: 85, hygiene_grade: "B" };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [mockInspection] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const inspection = await inspectionModel.getInspectionById("i1");

        expect(mockRequest.input).toHaveBeenCalledWith("inspectionId", "i1");
        expect(inspection).toEqual(mockInspection);
    });

    it("should return null when no inspection matches", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const inspection = await inspectionModel.getInspectionById("nope");

        expect(inspection).toBeNull();
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(inspectionModel.getInspectionById("i1")).rejects.toThrow("DB Error");
    });
});

describe("inspectionModel.updateInspection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update the provided fields and return the updated row", async () => {
        const updated = { inspection_id: "i1", score: 95, hygiene_grade: "A" };
        const updateRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const selectRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [updated] }) };
        const mockPool = await poolPromise;
        mockPool.request
            .mockReturnValueOnce(updateRequest)
            .mockReturnValueOnce(selectRequest);

        const result = await inspectionModel.updateInspection("i1", { score: 95, hygiene_grade: "A" });

        expect(updateRequest.input).toHaveBeenCalledWith("inspectionId", "i1");
        expect(updateRequest.input).toHaveBeenCalledWith("score", 95);
        expect(updateRequest.input).toHaveBeenCalledWith("hygiene_grade", "A");
        expect(updateRequest.query).toHaveBeenCalledWith(
            expect.stringContaining("score = @score, hygiene_grade = @hygiene_grade"),
        );
        expect(result).toEqual(updated);
    });

    it("should only update remarks when only remarks is provided", async () => {
        const updated = { inspection_id: "i1", remarks: "Updated remark" };
        const updateRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const selectRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [updated] }) };
        const mockPool = await poolPromise;
        mockPool.request
            .mockReturnValueOnce(updateRequest)
            .mockReturnValueOnce(selectRequest);

        await inspectionModel.updateInspection("i1", { remarks: "Updated remark" });

        expect(updateRequest.input).toHaveBeenCalledWith("remarks", "Updated remark");
        expect(updateRequest.query).toHaveBeenCalledWith(expect.stringContaining("remarks = @remarks"));
    });

    it("should throw when no fields are provided to update", async () => {
        await expect(inspectionModel.updateInspection("i1", {})).rejects.toThrow("No fields to update");
    });
});