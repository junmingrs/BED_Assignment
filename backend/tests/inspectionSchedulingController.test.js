const { poolPromise } = require("../db");
const inspectionSchedulingController = require("../controller/inspectionSchedulingController");
const inspectionSchedulingModel = require("../model/inspectionSchedulingModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));
jest.mock("../model/inspectionSchedulingModel");

beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => { });
    jest.spyOn(console, "error").mockImplementation(() => { });
});

afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
});

describe("inspectionSchedulingController.scheduleInspection", () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        const mockPool = await poolPromise;
        mockPool.request.mockReturnThis();
    });

    it("should return 400 when inspection_date is missing", async () => {
        const req = {
            params: { stallId: "stall-1" },
            body: {},
            user: { id: "nea-1" },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.scheduleInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Missing required field: inspection_date",
        });
    });

    it("should return 400 when inspection_date is invalid", async () => {
        const req = {
            params: { stallId: "stall-1" },
            body: { inspection_date: "not-a-date" },
            user: { id: "nea-1" },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.scheduleInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Invalid inspection_date",
        });
    });

    it("should return 404 when the stall does not exist", async () => {
        const stallCheckRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({ recordset: [] }),
        };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(stallCheckRequest);

        const req = {
            params: { stallId: "nope" },
            body: { inspection_date: "2026-08-15" },
            user: { id: "nea-1" },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.scheduleInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "Stall not found" });
        expect(
            inspectionSchedulingModel.scheduleInspection,
        ).not.toHaveBeenCalled();
    });

    it("should schedule an inspection and return 201 when valid", async () => {
        const stallCheckRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest
                .fn()
                .mockResolvedValue({ recordset: [{ stall_id: "stall-1" }] }),
        };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(stallCheckRequest);

        const scheduled = {
            inspection_id: "i1",
            stall_id: "stall-1",
            status: "Scheduled",
        };
        inspectionSchedulingModel.scheduleInspection.mockResolvedValue(
            scheduled,
        );

        const req = {
            params: { stallId: "stall-1" },
            body: { inspection_date: "2026-08-15" },
            user: { id: "nea-1" },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.scheduleInspection(req, res);

        expect(
            inspectionSchedulingModel.scheduleInspection,
        ).toHaveBeenCalledWith("stall-1", "nea-1", expect.any(Date));
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(scheduled);
    });

    it("should handle errors and return 500", async () => {
        const stallCheckRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockRejectedValue(new Error("DB Error")),
        };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(stallCheckRequest);

        const req = {
            params: { stallId: "stall-1" },
            body: { inspection_date: "2026-08-15" },
            user: { id: "nea-1" },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.scheduleInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "DB Error" });
    });
});

describe("inspectionSchedulingController.completeInspection", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 400 when score is missing", async () => {
        const req = {
            params: { inspectionId: "i1" },
            body: { hygiene_grade: "A" },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.completeInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Missing required fields: score, hygiene_grade",
        });
    });

    it("should return 400 when hygiene_grade is missing", async () => {
        const req = { params: { inspectionId: "i1" }, body: { score: 90 } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.completeInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Missing required fields: score, hygiene_grade",
        });
    });

    it("should return 400 when score is out of range", async () => {
        const req = {
            params: { inspectionId: "i1" },
            body: { score: -5, hygiene_grade: "A" },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.completeInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Score must be between 0 and 100",
        });
    });

    it("should return 400 when hygiene_grade is invalid", async () => {
        const req = {
            params: { inspectionId: "i1" },
            body: { score: 90, hygiene_grade: "F" },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.completeInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Hygiene grade must be A, B, C, or D",
        });
    });

    it("should return 404 when the inspection is not found", async () => {
        inspectionSchedulingModel.completeInspection.mockResolvedValue(null);

        const req = {
            params: { inspectionId: "nope" },
            body: { score: 90, hygiene_grade: "A" },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.completeInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: "Inspection not found",
        });
    });

    it("should complete an inspection and return 200 when valid", async () => {
        const completed = {
            inspection_id: "i1",
            score: 90,
            hygiene_grade: "A",
            status: "Completed",
        };
        inspectionSchedulingModel.completeInspection.mockResolvedValue(
            completed,
        );

        const req = {
            params: { inspectionId: "i1" },
            body: { score: 90, remarks: "Great", hygiene_grade: "A" },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.completeInspection(req, res);

        expect(
            inspectionSchedulingModel.completeInspection,
        ).toHaveBeenCalledWith("i1", 90, "Great", "A");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(completed);
    });

    it("should handle errors and return 500", async () => {
        inspectionSchedulingModel.completeInspection.mockRejectedValue(
            new Error("DB Error"),
        );

        const req = {
            params: { inspectionId: "i1" },
            body: { score: 90, hygiene_grade: "A" },
        };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.completeInspection(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "DB Error" });
    });
});

describe("inspectionSchedulingController.getScheduledInspections", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return scheduled inspections for a stall with 200", async () => {
        const scheduled = [{ inspection_id: "i1", status: "Scheduled" }];
        inspectionSchedulingModel.getScheduledInspectionsByStallId.mockResolvedValue(
            scheduled,
        );

        const req = { params: { stallId: "stall-1" } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.getScheduledInspections(req, res);

        expect(
            inspectionSchedulingModel.getScheduledInspectionsByStallId,
        ).toHaveBeenCalledWith("stall-1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(scheduled);
    });

    it("should handle errors and return 500", async () => {
        inspectionSchedulingModel.getScheduledInspectionsByStallId.mockRejectedValue(
            new Error("DB Error"),
        );

        const req = { params: { stallId: "stall-1" } };
        const res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        await inspectionSchedulingController.getScheduledInspections(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "DB Error" });
    });
});
