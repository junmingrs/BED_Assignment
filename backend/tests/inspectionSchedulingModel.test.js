const { poolPromise } = require("../db");
const inspectionSchedulingModel = require("../model/inspectionSchedulingModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));

describe("inspectionSchedulingModel.scheduleInspection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should insert a scheduled inspection and return the created row", async () => {
        const scheduled = {
            inspection_id: "i1",
            stall_id: "stall-1",
            nea_id: "nea-1",
            inspection_date: "2026-08-15",
            status: "Scheduled",
        };
        const insertRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const selectRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [scheduled] }) };
        const mockPool = await poolPromise;
        mockPool.request
            .mockReturnValueOnce(insertRequest)
            .mockReturnValueOnce(selectRequest);

        const result = await inspectionSchedulingModel.scheduleInspection("stall-1", "nea-1", "2026-08-15");

        expect(insertRequest.input).toHaveBeenCalledWith("stallId", "stall-1");
        expect(insertRequest.input).toHaveBeenCalledWith("neaId", "nea-1");
        expect(insertRequest.input).toHaveBeenCalledWith("inspectionDate", "2026-08-15");
        expect(insertRequest.query).toHaveBeenCalledWith(expect.stringContaining("'Scheduled'"));
        expect(result).toEqual(scheduled);
    });

    it("should handle errors", async () => {
        const insertRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(insertRequest);

        await expect(
            inspectionSchedulingModel.scheduleInspection("stall-1", "nea-1", "2026-08-15"),
        ).rejects.toThrow("DB Error");
    });
});

describe("inspectionSchedulingModel.completeInspection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update the inspection with score/grade and flip status to Completed", async () => {
        const completed = {
            inspection_id: "i1",
            score: 90,
            remarks: "Great",
            hygiene_grade: "A",
            status: "Completed",
        };
        const updateRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const selectRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [completed] }) };
        const mockPool = await poolPromise;
        mockPool.request
            .mockReturnValueOnce(updateRequest)
            .mockReturnValueOnce(selectRequest);

        const result = await inspectionSchedulingModel.completeInspection("i1", 90, "Great", "A");

        expect(updateRequest.input).toHaveBeenCalledWith("inspectionId", "i1");
        expect(updateRequest.input).toHaveBeenCalledWith("score", 90);
        expect(updateRequest.input).toHaveBeenCalledWith("remarks", "Great");
        expect(updateRequest.input).toHaveBeenCalledWith("hygieneGrade", "A");
        expect(updateRequest.query).toHaveBeenCalledWith(expect.stringContaining("'Completed'"));
        expect(result).toEqual(completed);
    });

    it("should default remarks to null when not provided", async () => {
        const completed = { inspection_id: "i1", status: "Completed" };
        const updateRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const selectRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [completed] }) };
        const mockPool = await poolPromise;
        mockPool.request
            .mockReturnValueOnce(updateRequest)
            .mockReturnValueOnce(selectRequest);

        await inspectionSchedulingModel.completeInspection("i1", 90, undefined, "A");

        expect(updateRequest.input).toHaveBeenCalledWith("remarks", null);
    });

    it("should return undefined when the inspection id does not exist", async () => {
        const updateRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const selectRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request
            .mockReturnValueOnce(updateRequest)
            .mockReturnValueOnce(selectRequest);

        const result = await inspectionSchedulingModel.completeInspection("nope", 90, "", "A");

        expect(result).toBeUndefined();
    });

    it("should handle errors", async () => {
        const updateRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(updateRequest);

        await expect(inspectionSchedulingModel.completeInspection("i1", 90, "", "A")).rejects.toThrow("DB Error");
    });
});

describe("inspectionSchedulingModel.getScheduledInspectionsByStallId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve scheduled inspections for a stall", async () => {
        const scheduled = [
            { inspection_id: "i1", stall_id: "stall-1", status: "Scheduled" },
            { inspection_id: "i2", stall_id: "stall-1", status: "Scheduled" },
        ];
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: scheduled }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await inspectionSchedulingModel.getScheduledInspectionsByStallId("stall-1");

        expect(mockRequest.input).toHaveBeenCalledWith("stallId", "stall-1");
        expect(result).toEqual(scheduled);
    });

    it("should return an empty array when there are no scheduled inspections", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await inspectionSchedulingModel.getScheduledInspectionsByStallId("stall-1");

        expect(result).toEqual([]);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(inspectionSchedulingModel.getScheduledInspectionsByStallId("stall-1")).rejects.toThrow("DB Error");
    });
});