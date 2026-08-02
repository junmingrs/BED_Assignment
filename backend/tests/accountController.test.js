const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const accountModel = require("../model/accountModel");
const {
    registerUser,
    loginUser,
    loginGuest,
    refreshJWTToken,
    getAccountById,
} = require("../controller/accountController");

jest.mock("mssql", () => ({
    ConnectionPool: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue({
            request: () => mockRequest,
        }),
    })),
}));
jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../model/accountModel");

describe("Account Controller Unit Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {},
            headers: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
        };

        jest.spyOn(console, "error").mockImplementation(() => { });
        jest.spyOn(console, "log").mockImplementation(() => { });
    });

    describe("registerUser", () => {
        const mockRegisterData = {
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
            role: "Customer",
        };

        test("should return 400 if an account with the email already exists", async () => {
            req.body = mockRegisterData;
            accountModel.getAccountByEmail.mockResolvedValueOnce({
                account_id: "acc-123",
            });

            await registerUser(req, res);

            expect(accountModel.getAccountByEmail).toHaveBeenCalledWith(
                mockRegisterData.email,
            );
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "An account with this email already exists",
            });
        });

        test("should register a Customer successfully and return 201 with tokens", async () => {
            req.body = mockRegisterData;

            accountModel.getAccountByEmail.mockResolvedValueOnce(null);
            bcrypt.genSalt.mockResolvedValueOnce("salt_123");
            bcrypt.hash.mockResolvedValueOnce("hashed_password");
            accountModel.createAccount.mockResolvedValueOnce("acc-123");
            accountModel.createCustomer.mockResolvedValueOnce();

            jwt.sign
                .mockReturnValueOnce("mock_access_token")
                .mockReturnValueOnce("mock_refresh_token");

            await registerUser(req, res);

            expect(accountModel.createAccount).toHaveBeenCalledWith({
                name: "John Doe",
                email: "john@example.com",
                passwordHash: "hashed_password",
                role: "Customer",
                isGuest: false,
            });
            expect(accountModel.createCustomer).toHaveBeenCalledWith(
                "acc-123",
                "John Doe",
            );
            expect(accountModel.createRefreshToken).toHaveBeenCalledWith(
                "acc-123",
                "mock_refresh_token",
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                token: "mock_access_token",
                refreshToken: "mock_refresh_token",
                role: "Customer",
                message: "Account created successfully",
            });
        });

        // role creation helpers
        const nonCustomerRoles = [
            { role: "Vendor", method: "createVendor" },
            { role: "Operator", method: "createOperator" },
            { role: "NEA", method: "createNEA" },
        ];

        nonCustomerRoles.forEach(({ role, method }) => {
            test(`should call accountModel.${method} when registering role: ${role}`, async () => {
                req.body = { ...mockRegisterData, role };

                accountModel.getAccountByEmail.mockResolvedValueOnce(null);
                bcrypt.genSalt.mockResolvedValueOnce("salt");
                bcrypt.hash.mockResolvedValueOnce("hashed_pw");
                accountModel.createAccount.mockResolvedValueOnce("acc-123");
                accountModel[method].mockResolvedValueOnce();
                jwt.sign.mockReturnValue("mock_token");

                await registerUser(req, res);

                expect(accountModel[method]).toHaveBeenCalledWith("acc-123");
                expect(res.status).toHaveBeenCalledWith(201);
            });
        });

        test("should return 500 when registration process fails", async () => {
            req.body = mockRegisterData;
            accountModel.getAccountByEmail.mockRejectedValueOnce(
                new Error("DB error"),
            );

            await registerUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Internal server error",
            });
        });
    });

    describe("loginUser", () => {
        const loginData = {
            email: "john@example.com",
            password: "password123",
        };

        test("should return 401 if user email is not found", async () => {
            req.body = loginData;
            accountModel.getAccountByEmail.mockResolvedValueOnce(null);

            await loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: "Invalid credentials",
            });
        });

        test("should return 401 if password does not match", async () => {
            req.body = loginData;
            accountModel.getAccountByEmail.mockResolvedValueOnce({
                account_id: "acc-123",
                password_hash: "hashed_pw",
                role: "Customer",
            });
            bcrypt.compare.mockResolvedValueOnce(false);

            await loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                message: "The username or password is incorrect.",
            });
        });

        test("should log in successfully, set cookie, and return 200 with token", async () => {
            req.body = loginData;
            const mockUser = {
                account_id: "acc-123",
                password_hash: "hashed_pw",
                role: "Customer",
            };

            accountModel.getAccountByEmail.mockResolvedValueOnce(mockUser);
            bcrypt.compare.mockResolvedValueOnce(true);
            jwt.sign
                .mockReturnValueOnce("mock_access_token")
                .mockReturnValueOnce("mock_refresh_token");

            await loginUser(req, res);

            expect(accountModel.updateRefreshToken).toHaveBeenCalledWith(
                "acc-123",
                "mock_refresh_token",
            );
            expect(res.cookie).toHaveBeenCalledWith(
                "refreshToken",
                "mock_refresh_token",
                {
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict",
                },
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                token: "mock_access_token",
                role: "Customer",
                message: "Logged in successfully",
            });
        });

        test("should return 500 when login fails due to unexpected error", async () => {
            req.body = loginData;
            accountModel.getAccountByEmail.mockRejectedValueOnce(
                new Error("Database error"),
            );

            await loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Internal server error",
            });
        });
    });

    describe("loginGuest", () => {
        test("should generate guest credentials, save to DB, and return 201 with tokens", async () => {
            bcrypt.genSalt.mockResolvedValueOnce("salt_guest");
            bcrypt.hash.mockResolvedValueOnce("hashed_guest_pw");
            accountModel.createAccount.mockResolvedValueOnce("acc-guest-1");
            accountModel.createCustomer.mockResolvedValueOnce();

            jwt.sign
                .mockReturnValueOnce("mock_guest_access_token")
                .mockReturnValueOnce("mock_guest_refresh_token");

            await loginGuest(req, res);

            expect(accountModel.createAccount).toHaveBeenCalledWith(
                expect.objectContaining({
                    role: "Customer",
                    isGuest: true,
                    passwordHash: "hashed_guest_pw",
                }),
            );
            expect(accountModel.createCustomer).toHaveBeenCalledWith(
                "acc-guest-1",
                expect.stringMatching(/^Guest_/),
            );
            expect(accountModel.createRefreshToken).toHaveBeenCalledWith(
                "acc-guest-1",
                "mock_guest_refresh_token",
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                token: "mock_guest_access_token",
                refreshToken: "mock_guest_refresh_token",
                role: "Customer",
                isGuest: true,
                message: "Logged in as guest",
            });
        });

        test("should return 500 if guest creation fails", async () => {
            accountModel.createAccount.mockRejectedValueOnce(
                new Error("Guest creation error"),
            );

            await loginGuest(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Internal server error",
            });
        });
    });

    describe("refreshJWTToken", () => {
        const mockCookie =
            "otherCookie=123; refreshToken=valid_refresh_token_abc";

        test("should return null if refresh token does not exist in DB", async () => {
            accountModel.findRefreshToken.mockResolvedValueOnce(0);

            const result = await refreshJWTToken(mockCookie);

            expect(accountModel.findRefreshToken).toHaveBeenCalledWith(
                "valid_refresh_token_abc",
            );
            expect(result).toBeNull();
        });

        test("should verify token and return new access token on success", async () => {
            accountModel.findRefreshToken.mockResolvedValueOnce(1);

            const mockDecodedUser = {
                account_id: "acc-123",
                role: "Customer",
                isGuest: false,
            };

            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(null, mockDecodedUser);
            });

            jwt.sign.mockReturnValueOnce("new_generated_access_token");

            const result = await refreshJWTToken(mockCookie);

            expect(result).toBe("new_generated_access_token");
        });

        test("should return null if jwt.verify throws an error (e.g. token expired)", async () => {
            accountModel.findRefreshToken.mockResolvedValueOnce(1);

            jwt.verify.mockImplementation((token, secret, callback) => {
                callback(new Error("Token expired"), null);
            });

            const result = await refreshJWTToken(mockCookie);

            expect(result).toBeNull();
        });
    });

    describe("getAccountById", () => {
        test("should return 200 and the account if found", async () => {
            req.params = { accountId: "acc-123" };
            const mockAccount = {
                account_id: "acc-123",
                account_email: "john@example.com",
                role: "Customer",
            };
            accountModel.getAccountById.mockResolvedValueOnce(mockAccount);

            await getAccountById(req, res);

            expect(accountModel.getAccountById).toHaveBeenCalledWith(
                "acc-123",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockAccount);
        });

        test("should return 404 if account is not found", async () => {
            req.params = { accountId: "acc-does-not-exist" };
            accountModel.getAccountById.mockResolvedValueOnce(null);

            await getAccountById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Account not found",
            });
        });

        test("should return 500 when accountModel.getAccountById throws", async () => {
            req.params = { accountId: "acc-123" };
            accountModel.getAccountById.mockRejectedValueOnce(
                new Error("DB error"),
            );

            await getAccountById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Internal server error",
            });
        });
    });
});
