const {
    getStallInfo,
    getStallById,
    updateStall,
    getAllStalls,
    getStallIdByVendorId,
} = require("../model/stallModel");

const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(),
};

// Mock mssql
jest.mock("mssql", () => ({
    ConnectionPool: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue({
            request: () => mockRequest,
        }),
    })),
}));

// Mock console.error
beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
    console.error.mockRestore();
});

describe("stallModel Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest.input.mockReturnThis();
        mockRequest.query.mockReset();
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
        const mockRatings = [
            { rating_id: "r1", rating: 5, comment: "Great!", created_at: "2026-08-01" },
        ];
        const mockComplaints = [
            { complaint_id: "c1", subject: "Hair found", status: "Open", created_at: "2026-08-01" },
        ];

        test("should return stall info with ratings and complaints successfully", async () => {
            mockRequest.query
                .mockResolvedValueOnce({ recordset: [mockStall] })
                .mockResolvedValueOnce({ recordset: mockRatings })
                .mockResolvedValueOnce({ recordset: mockComplaints });

            const result = await getStallInfo("stall_A");

            expect(mockRequest.input).toHaveBeenCalledWith("stallId", "stall_A");
            expect(mockRequest.query).toHaveBeenCalledTimes(3);
            expect(result).toEqual({
                stall: mockStall,
                ratings: mockRatings,
                complaints: mockComplaints,
            });
        });

        test("should throw error if stall not found", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await expect(getStallInfo("stall_A")).rejects.toThrow("Stall not found");
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should throw error when database query fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(getStallInfo("stall_A")).rejects.toThrow(
                "Database connection error",
            );
        });
    });

    // getStallById
    describe("getStallById", () => {
        const mockStall = {
            stall_id: "stall_A",
            stall_name: "Kim Kitchen",
            stall_unit_no: "#01-01",
            vendor_id: "vendor_1",
            hawker_centre_id: "hc_1",
        };

        test("should return stall by id successfully", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [mockStall] });

            const result = await getStallById("stall_A");

            expect(mockRequest.input).toHaveBeenCalledWith("stall_id", "stall_A");
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockStall);
        });

        test("should return undefined if stall not found", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getStallById("stall_A");

            expect(result).toBeUndefined();
        });

        test("should throw error when database query fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(getStallById("stall_A")).rejects.toThrow(
                "Database connection error",
            );
        });
    });

    // updateStall
    describe("updateStall", () => {
        const stallId = "stall_A";
        const accountId = "vendor_1";
        const mockUpdatedStall = {
            stall_id: "stall_A",
            stall_name: "Kim Kitchen 2.0",
            stall_unit_no: "#01-01",
            vendor_id: "vendor_1",
            vendor_email: "kim@email.com",
        };

        test("should update stall name successfully", async () => {
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{ stall_id: stallId, vendor_id: accountId }],
                })
                .mockResolvedValueOnce({ rowsAffected: [1] })
                .mockResolvedValueOnce({ recordset: [mockUpdatedStall] });

            const result = await updateStall(stallId, accountId, {
                stall_name: "Kim Kitchen 2.0",
            });

            expect(mockRequest.input).toHaveBeenCalledWith("stallId", stallId);
            expect(mockRequest.input).toHaveBeenCalledWith("stallName", "Kim Kitchen 2.0");
            expect(mockRequest.query).toHaveBeenCalledTimes(3);
            expect(result).toEqual(mockUpdatedStall);
        });

        test("should update stall unit number successfully", async () => {
            const updated = { ...mockUpdatedStall, stall_unit_no: "#01-03" };
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{ stall_id: stallId, vendor_id: accountId }],
                })
                .mockResolvedValueOnce({ rowsAffected: [1] })
                .mockResolvedValueOnce({ recordset: [updated] });

            const result = await updateStall(stallId, accountId, {
                stall_unit_no: "#01-03",
            });

            expect(mockRequest.input).toHaveBeenCalledWith("stallUnitNo", "#01-03");
            expect(result.stall_unit_no).toBe("#01-03");
        });

        test("should update both name and unit number successfully", async () => {
            const updated = { ...mockUpdatedStall, stall_unit_no: "#01-03" };
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{ stall_id: stallId, vendor_id: accountId }],
                })
                .mockResolvedValueOnce({ rowsAffected: [1] })
                .mockResolvedValueOnce({ recordset: [updated] });

            const result = await updateStall(stallId, accountId, {
                stall_name: "Kim Kitchen 2.0",
                stall_unit_no: "#01-03",
            });

            expect(mockRequest.input).toHaveBeenCalledWith("stallName", "Kim Kitchen 2.0");
            expect(mockRequest.input).toHaveBeenCalledWith("stallUnitNo", "#01-03");
            expect(result.stall_name).toBe("Kim Kitchen 2.0");
            expect(result.stall_unit_no).toBe("#01-03");
        });

        test("should throw error if stall not found", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await expect(
                updateStall(stallId, accountId, { stall_name: "New Name" }),
            ).rejects.toThrow("Stall not found");
        });

        test("should throw error if stall belongs to another vendor", async () => {
            // vendor_id mismatch
            mockRequest.query.mockResolvedValueOnce({
                recordset: [{ stall_id: stallId, vendor_id: "wrong_vendor" }],
            });

            await expect(
                updateStall(stallId, accountId, { stall_name: "New Name" }),
            ).rejects.toThrow("You are not authorized to update this stall");
        });

        test("should throw error if no fields to update", async () => {
            mockRequest.query.mockResolvedValueOnce({
                recordset: [{ stall_id: stallId, vendor_id: accountId }],
            });

            await expect(
                updateStall(stallId, accountId, {}),
            ).rejects.toThrow("No fields to update");
        });

        test("should throw error when database query fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(
                updateStall(stallId, accountId, { stall_name: "New Name" }),
            ).rejects.toThrow("Database connection error");
        });
    });

    // getAllStalls
    describe("getAllStalls", () => {
        const mockStalls = [
            {
                stall_id: "stall_A",
                stall_name: "Kim Kitchen",
                stall_unit_no: "#01-01",
                hawker_centre_id: "hc_1",
                vendor_id: "vendor_1",
            },
            {
                stall_id: "stall_B",
                stall_name: "Sakura Sushi",
                stall_unit_no: "#01-02",
                hawker_centre_id: "hc_1",
                vendor_id: "vendor_2",
            },
        ];

        test("should return all stalls successfully", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: mockStalls });

            const result = await getAllStalls();

            expect(mockRequest.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockStalls);
        });

        test("should return empty array when no stalls found", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getAllStalls();

            expect(result).toEqual([]);
        });

        test("should throw error when database query fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(getAllStalls()).rejects.toThrow("Database connection error");
        });
    });

    // getStallIdByVendorId
    describe("getStallIdByVendorId", () => {
        test("should return stall_id for a vendor successfully", async () => {
            mockRequest.query.mockResolvedValueOnce({
                recordset: [{ stall_id: "stall_A" }],
            });

            const result = await getStallIdByVendorId("vendor_1");

            expect(mockRequest.input).toHaveBeenCalledWith("vendorId", "vendor_1");
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ stall_id: "stall_A" });
        });

        test("should throw error if stall not found for vendor", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await expect(getStallIdByVendorId("vendor_1")).rejects.toThrow(
                "Stall not found",
            );
        });

        test("should throw error when database query fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(getStallIdByVendorId("vendor_1")).rejects.toThrow(
                "Database connection error",
            );
        });
    });
});