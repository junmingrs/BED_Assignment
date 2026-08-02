const { poolPromise } = require("../db");
const googleTokenModel = require("../model/googleTokenModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));

describe("googleTokenModel.saveTokens", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete any existing tokens then insert the new ones", async () => {
        const deleteRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const insertRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const mockPool = await poolPromise;
        mockPool.request
            .mockReturnValueOnce(deleteRequest)
            .mockReturnValueOnce(insertRequest);

        const tokens = {
            access_token: "at",
            refresh_token: "rt",
            expiry_date: 1893456000000,
        };

        await googleTokenModel.saveTokens("vendor-1", tokens);

        expect(deleteRequest.input).toHaveBeenCalledWith("vendorId", "vendor-1");
        expect(insertRequest.input).toHaveBeenCalledWith("vendorId", "vendor-1");
        expect(insertRequest.input).toHaveBeenCalledWith("accessToken", "at");
        expect(insertRequest.input).toHaveBeenCalledWith("refreshToken", "rt");
        expect(insertRequest.input).toHaveBeenCalledWith("tokenExpiry", expect.any(Date));
    });

    it("should default refresh_token and expiry_date to null when not provided", async () => {
        const deleteRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const insertRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const mockPool = await poolPromise;
        mockPool.request
            .mockReturnValueOnce(deleteRequest)
            .mockReturnValueOnce(insertRequest);

        await googleTokenModel.saveTokens("vendor-1", { access_token: "at" });

        expect(insertRequest.input).toHaveBeenCalledWith("refreshToken", null);
        expect(insertRequest.input).toHaveBeenCalledWith("tokenExpiry", null);
    });

    it("should handle errors", async () => {
        const deleteRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(deleteRequest);

        await expect(googleTokenModel.saveTokens("vendor-1", { access_token: "at" })).rejects.toThrow("DB Error");
    });
});

describe("googleTokenModel.getTokens", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return the vendor's tokens when they exist", async () => {
        const mockTokens = { vendor_id: "vendor-1", access_token: "at" };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [mockTokens] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await googleTokenModel.getTokens("vendor-1");

        expect(mockRequest.input).toHaveBeenCalledWith("vendorId", "vendor-1");
        expect(result).toEqual(mockTokens);
    });

    it("should return null when no tokens exist for the vendor", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await googleTokenModel.getTokens("vendor-1");

        expect(result).toBeNull();
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(googleTokenModel.getTokens("vendor-1")).rejects.toThrow("DB Error");
    });
});

describe("googleTokenModel.deleteTokens", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete the vendor's tokens", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await googleTokenModel.deleteTokens("vendor-1");

        expect(mockRequest.input).toHaveBeenCalledWith("vendorId", "vendor-1");
        expect(mockRequest.query).toHaveBeenCalledWith("DELETE FROM VendorGoogleToken WHERE vendor_id = @vendorId");
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(googleTokenModel.deleteTokens("vendor-1")).rejects.toThrow("DB Error");
    });
});