const {
    getAccountByEmail,
    getAccountById,
    createAccount,
    createRefreshToken,
    updateRefreshToken,
    createCustomer,
    createVendor,
    createOperator,
    createNEA,
    findRefreshToken,
    getVendorIdFromToken,
} = require("../model/accountModel");

const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(),
};

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: () => mockRequest,
    }),
}));

describe("Account Model Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest.input.mockReturnThis();
        mockRequest.query.mockReset();
    });

    describe("getAccountByEmail", () => {
        test("should return account details when account exists", async () => {
            const email = "test@example.com";
            const mockAccount = {
                account_id: "acc-123",
                account_email: email,
                password_hash: "hashed_pw",
                role: "Customer",
            };

            mockRequest.query.mockResolvedValueOnce({ recordset: [mockAccount] });

            const result = await getAccountByEmail(email);

            expect(result).toEqual(mockAccount);
            expect(mockRequest.input).toHaveBeenCalledWith("email", email);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should return null when account email is not found", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getAccountByEmail("nonexistent@example.com");

            expect(result).toBeNull();
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });
    });

    describe("getAccountById", () => {
        test("should return account details when account ID exists", async () => {
            const accountId = "acc-123";
            const mockAccount = {
                account_id: accountId,
                account_email: "test@example.com",
                password_hash: "hashed_pw",
                role: "Customer",
            };

            mockRequest.query.mockResolvedValueOnce({ recordset: [mockAccount] });

            const result = await getAccountById(accountId);

            expect(result).toEqual(mockAccount);
            expect(mockRequest.input).toHaveBeenCalledWith("id", accountId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should return null when account ID is not found", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getAccountById("invalid-id");

            expect(result).toBeNull();
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });
    });

    describe("findRefreshToken", () => {
        test("should return token count when query succeeds", async () => {
            const refreshToken = "some-refresh-token";
            mockRequest.query.mockResolvedValueOnce({ recordset: [{ n: 1 }] });

            const count = await findRefreshToken(refreshToken);

            expect(count).toBe(1);
            expect(mockRequest.input).toHaveBeenCalledWith(
                "refresh_token",
                refreshToken,
            );
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });
    });

    describe("createAccount", () => {
        test("should insert account and return new account_id", async () => {
            const newAccount = {
                email: "new@example.com",
                passwordHash: "secret_hash",
                role: "Vendor",
            };
            const generatedId = "acc-999";

            mockRequest.query.mockResolvedValueOnce({
                recordset: [{ account_id: generatedId }],
            });

            const result = await createAccount(newAccount);

            expect(result).toBe(generatedId);
            expect(mockRequest.input).toHaveBeenCalledWith(
                "account_email",
                newAccount.email,
            );
            expect(mockRequest.input).toHaveBeenCalledWith(
                "password_hash",
                newAccount.passwordHash,
            );
            expect(mockRequest.input).toHaveBeenCalledWith("role", newAccount.role);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });
    });

    describe("createRefreshToken", () => {
        test("should bind account_id and refresh_token and execute insert", async () => {
            const accountId = "acc-123";
            const refreshToken = "token-abc";

            mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

            await createRefreshToken(accountId, refreshToken);

            expect(mockRequest.input).toHaveBeenCalledWith("account_id", accountId);
            expect(mockRequest.input).toHaveBeenCalledWith(
                "refresh_token",
                refreshToken,
            );
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });
    });

    describe("updateRefreshToken", () => {
        test("should bind parameters and execute token update query", async () => {
            const accountId = "acc-123";
            const newToken = "new-token-xyz";

            mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

            await updateRefreshToken(accountId, newToken);

            expect(mockRequest.input).toHaveBeenCalledWith("account_id", accountId);
            expect(mockRequest.input).toHaveBeenCalledWith("refresh_token", newToken);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });
    });

    describe("create role helpers", () => {
        test("createCustomer should insert customer record", async () => {
            const accountId = "acc-123";
            const name = "John Doe";

            mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

            await createCustomer(accountId, name);

            expect(mockRequest.input).toHaveBeenCalledWith("id", accountId);
            expect(mockRequest.input).toHaveBeenCalledWith("name", name);
            expect(mockRequest.input).toHaveBeenCalledWith("points", 0);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("createVendor should insert vendor record", async () => {
            const accountId = "acc-vendor-1";

            mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

            await createVendor(accountId);

            expect(mockRequest.input).toHaveBeenCalledWith("id", accountId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("createOperator should insert operator record", async () => {
            const accountId = "acc-operator-1";

            mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

            await createOperator(accountId);

            expect(mockRequest.input).toHaveBeenCalledWith("id", accountId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("createNEA should insert NEA record", async () => {
            const accountId = "acc-nea-1";

            mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

            await createNEA(accountId);

            expect(mockRequest.input).toHaveBeenCalledWith("id", accountId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });
    });

    describe("getVendorIdFromToken", () => {
        test("should decode base64 payload and extract vendor id", () => {
            const mockPayloadBase64 = Buffer.from(
                JSON.stringify({ id: "vendor-456", role: "Vendor" }),
            ).toString("base64");

            const mockJwtToken = `header.${mockPayloadBase64}.signature`;

            const vendorId = getVendorIdFromToken(mockJwtToken);

            expect(vendorId).toBe("vendor-456");
        });
    });
});
