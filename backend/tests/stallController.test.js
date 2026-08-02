// stallController.test.js
const {
    getStallInfo,
    getStallIdByVendorId,
    getAllStalls,
    updateStall,
} = require("../controller/stallController");
const stallModel = require("../model/stallModel");

// Mock dependencies
// Must mock "../db" too — jest.mock("../model/stallModel") below is an
// automock (no factory), which requires Jest to load the REAL model file to
// introspect its shape. That real file requires the real db.js, which tries
// to construct a real mssql.ConnectionPool with no test DB config and crashes
// the whole worker before any test runs. This stub prevents that.
jest.mock("../db", () => ({
    poolPromise: Promise.resolve({}),
}));
jest.mock("../model/stallModel");

// Mock console.log and console.error
beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => { });
    jest.spyOn(console, "error").mockImplementation(() => { });
});

afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
});

describe("stallController Unit Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {},
            body: {},
            user: { id: "vendor_1" },
            query: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // getStallInfo
    describe("getStallInfo", () => {
        const mockStall = {
            stall_id: "stall_A",
            stall_name: "Kim Kitchen",
            stall_unit_no: "#01-01",
            vendor_id: "vendor_1",
            vendor_email: "kim@email.com",
        };

        test("should return stall info successfully", async () => {
            stallModel.getStallInfo.mockResolvedValue(mockStall);
            req.params.stallId = "stall_A";

            await getStallInfo(req, res);

            expect(stallModel.getStallInfo).toHaveBeenCalledWith("stall_A");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockStall);
        });

        test("should return 500 when model throws error", async () => {
            stallModel.getStallInfo.mockRejectedValue(
                new Error("Database connection error"),
            );
            req.params.stallId = "stall_A";

            await getStallInfo(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Database connection error",
            });
        });
    });

    // getStallIdByVendorId
    describe("getStallIdByVendorId", () => {
        test("should return stall_id for a vendor successfully", async () => {
            stallModel.getStallIdByVendorId.mockResolvedValue({
                stall_id: "stall_A",
            });
            req.params.vendorId = "vendor_1";

            await getStallIdByVendorId(req, res);

            expect(stallModel.getStallIdByVendorId).toHaveBeenCalledWith(
                "vendor_1",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith("stall_A");
        });

        test("should return 500 when model throws error", async () => {
            stallModel.getStallIdByVendorId.mockRejectedValue(
                new Error("Stall not found"),
            );
            req.params.vendorId = "vendor_1";

            await getStallIdByVendorId(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Stall not found",
            });
        });
    });

    // getAllStalls
    describe("getAllStalls", () => {
        const mockStalls = [
            {
                stall_id: "stall_A",
                stall_name: "Kim Kitchen",
                stall_unit_no: "#01-01",
            },
            {
                stall_id: "stall_B",
                stall_name: "Sakura Sushi",
                stall_unit_no: "#01-02",
            },
        ];

        test("should return all stalls successfully", async () => {
            stallModel.getAllStalls.mockResolvedValue(mockStalls);

            await getAllStalls(req, res);

            expect(stallModel.getAllStalls).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockStalls);
        });

        test("should return empty array when no stalls found", async () => {
            stallModel.getAllStalls.mockResolvedValue([]);

            await getAllStalls(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        test("should return 500 when model throws error", async () => {
            stallModel.getAllStalls.mockRejectedValue(
                new Error("Database connection error"),
            );

            await getAllStalls(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Database connection error",
            });
        });
    });

    // updateStall
    describe("updateStall", () => {
        const mockUpdatedStall = {
            stall_id: "stall_A",
            stall_name: "Kim Kitchen 2.0",
            stall_unit_no: "#01-01",
            vendor_id: "vendor_1",
            vendor_email: "kim@email.com",
        };

        beforeEach(() => {
            req.params.stallId = "stall_A";
            req.user.id = "vendor_1";
        });

        test("should update stall name successfully", async () => {
            req.body.stall_name = "Kim Kitchen 2.0";
            stallModel.updateStall.mockResolvedValue(mockUpdatedStall);

            await updateStall(req, res);

            expect(stallModel.updateStall).toHaveBeenCalledWith(
                "stall_A",
                "vendor_1",
                { stall_name: "Kim Kitchen 2.0", stall_unit_no: undefined },
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockUpdatedStall);
        });

        test("should update stall unit number successfully", async () => {
            req.body.stall_unit_no = "#01-03";
            stallModel.updateStall.mockResolvedValue({
                ...mockUpdatedStall,
                stall_unit_no: "#01-03",
            });

            await updateStall(req, res);

            expect(stallModel.updateStall).toHaveBeenCalledWith(
                "stall_A",
                "vendor_1",
                { stall_name: undefined, stall_unit_no: "#01-03" },
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("should update both name and unit number successfully", async () => {
            req.body.stall_name = "Kim Kitchen 2.0";
            req.body.stall_unit_no = "#01-03";
            stallModel.updateStall.mockResolvedValue({
                ...mockUpdatedStall,
                stall_unit_no: "#01-03",
            });

            await updateStall(req, res);

            expect(stallModel.updateStall).toHaveBeenCalledWith(
                "stall_A",
                "vendor_1",
                { stall_name: "Kim Kitchen 2.0", stall_unit_no: "#01-03" },
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("should return 400 if no fields to update", async () => {
            req.body = {};

            await updateStall(req, res);

            expect(stallModel.updateStall).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "At least one field to update is required: stall_name, stall_unit_no",
            });
        });

        test("should return 500 when model throws error", async () => {
            req.body.stall_name = "Kim Kitchen 2.0";
            stallModel.updateStall.mockRejectedValue(
                new Error("Not authorized"),
            );

            await updateStall(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Not authorized",
            });
        });
    });
});
