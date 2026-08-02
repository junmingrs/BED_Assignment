const {
    getAllHawkerCentres,
    getHawkerCentreById,
    getStallsByHawkerCentreId,
    getHawkerCentresByOperatorId,
} = require("../model/hawkerCentreModel");

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
    jest.spyOn(console, "error").mockImplementation(() => { });
});

afterAll(() => {
    console.error.mockRestore();
});

describe("hawkerCentreModel Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest.input.mockReturnThis();
        mockRequest.query.mockReset();
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

        test("should return all hawker centres successfully", async () => {
            mockRequest.query.mockResolvedValueOnce({
                recordset: mockHawkerCentres,
            });

            const result = await getAllHawkerCentres();

            expect(mockRequest.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockHawkerCentres);
        });

        test("should return empty array when no hawker centres found", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getAllHawkerCentres();

            expect(result).toEqual([]);
        });

        test("should throw error when database query fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(getAllHawkerCentres()).rejects.toThrow(
                "Database connection error",
            );
        });
    });

    // getHawkerCentreById
    describe("getHawkerCentreById", () => {
        const mockHawkerCentre = {
            hawker_centre_id: "hc_1",
            centre_name: "Maxwell Food Centre",
            address: "1 Kadayanallur St",
            operator_id: "op_1",
        };

        test("should return hawker centre by id successfully", async () => {
            mockRequest.query.mockResolvedValueOnce({
                recordset: [mockHawkerCentre],
            });

            const result = await getHawkerCentreById("hc_1");

            expect(mockRequest.input).toHaveBeenCalledWith(
                "hawker_centre_id",
                "hc_1",
            );
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockHawkerCentre);
        });

        test("should return null if hawker centre not found", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getHawkerCentreById("hc_1");

            expect(mockRequest.input).toHaveBeenCalledWith(
                "hawker_centre_id",
                "hc_1",
            );
            expect(result).toBeNull();
        });

        test("should throw error when database query fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(getHawkerCentreById("hc_1")).rejects.toThrow(
                "Database connection error",
            );
        });
    });

    // getStallsByHawkerCentreId
    describe("getStallsByHawkerCentreId", () => {
        const mockStalls = [
            {
                stall_id: "stall_A",
                stall_name: "Kim Kitchen",
                stall_unit_no: "#01-01",
                vendor_id: "vendor_1",
                hawker_centre_id: "hc_1",
            },
            {
                stall_id: "stall_B",
                stall_name: "Sakura Sushi",
                stall_unit_no: "#01-02",
                vendor_id: "vendor_2",
                hawker_centre_id: "hc_1",
            },
        ];

        test("should return stalls for a hawker centre successfully", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: mockStalls });

            const result = await getStallsByHawkerCentreId("hc_1");

            expect(mockRequest.input).toHaveBeenCalledWith(
                "hawker_centre_id",
                "hc_1",
            );
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockStalls);
        });

        test("should return empty array when no stalls found for hawker centre", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getStallsByHawkerCentreId("hc_1");

            expect(result).toEqual([]);
        });

        test("should throw error when database query fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(getStallsByHawkerCentreId("hc_1")).rejects.toThrow(
                "Database connection error",
            );
        });
    });

    // getHawkerCentresByOperatorId
    describe("getHawkerCentresByOperatorId", () => {
        const mockHawkerCentres = [
            {
                hawker_centre_id: "hc_1",
                centre_name: "Maxwell Food Centre",
                address: "1 Kadayanallur St",
                operator_id: "op_1",
            },
        ];

        test("should return hawker centres by operator id successfully", async () => {
            mockRequest.query.mockResolvedValueOnce({
                recordset: mockHawkerCentres,
            });

            const result = await getHawkerCentresByOperatorId("op_1");

            expect(mockRequest.input).toHaveBeenCalledWith(
                "operator_id",
                "op_1",
            );
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockHawkerCentres);
        });

        test("should return empty array when no hawker centres found for operator", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getHawkerCentresByOperatorId("op_1");

            expect(result).toEqual([]);
        });

        test("should throw error when database query fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(getHawkerCentresByOperatorId("op_1")).rejects.toThrow(
                "Database connection error",
            );
        });
    });
});
