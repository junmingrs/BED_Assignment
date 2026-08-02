const googleCalendarController = require("../controller/googleCalendarController");
const { oauth2Client } = require("../googleAuth");
const { google } = require("googleapis");
const googleTokenModel = require("../model/googleTokenModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));

jest.mock("../googleAuth", () => ({
    oauth2Client: {
        generateAuthUrl: jest.fn(),
        getToken: jest.fn(),
    },
}));

jest.mock("../model/googleTokenModel");

beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => { });
    jest.spyOn(console, "error").mockImplementation(() => { });
});

afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
});

// mock client instance returned by `new google.auth.OAuth2(...)`
const mockClientInstance = {
    setCredentials: jest.fn(),
    on: jest.fn(),
};

// mock calendar instance returned by `google.calendar(...)`
const mockCalendarInstance = {
    calendarList: { list: jest.fn() },
    events: { list: jest.fn() },
};

jest.mock("googleapis", () => ({
    google: {
        auth: {
            OAuth2: jest.fn(() => mockClientInstance),
        },
        calendar: jest.fn(() => mockCalendarInstance),
    },
}));

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        redirect: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
    };
}

describe("googleCalendarController.connectGoogle", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 400 when vendorId is missing", () => {
        const req = { query: {} };
        const res = mockRes();

        googleCalendarController.connectGoogle(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Missing vendorId" });
    });

    it("should generate an auth URL and redirect when vendorId is provided", () => {
        oauth2Client.generateAuthUrl.mockReturnValue(
            "https://accounts.google.com/o/oauth2/auth?mock=1",
        );

        const req = { query: { vendorId: "vendor-1" } };
        const res = mockRes();

        googleCalendarController.connectGoogle(req, res);

        expect(oauth2Client.generateAuthUrl).toHaveBeenCalledWith(
            expect.objectContaining({
                access_type: "offline",
                prompt: "consent",
                state: "vendor-1",
            }),
        );
        expect(res.redirect).toHaveBeenCalledWith(
            "https://accounts.google.com/o/oauth2/auth?mock=1",
        );
    });
});

describe("googleCalendarController.googleCallback", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 400 (send) when code or vendorId is missing", async () => {
        const req = { query: { code: "abc" } }; // missing state (vendorId)
        const res = mockRes();

        await googleCalendarController.googleCallback(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
            "Missing code or vendor reference.",
        );
    });

    it("should exchange the code, save tokens, and redirect on success", async () => {
        const mockTokens = { access_token: "at", refresh_token: "rt" };
        oauth2Client.getToken.mockResolvedValue({ tokens: mockTokens });
        googleTokenModel.saveTokens.mockResolvedValue();

        const req = { query: { code: "abc", state: "vendor-1" } };
        const res = mockRes();

        await googleCalendarController.googleCallback(req, res);

        expect(oauth2Client.getToken).toHaveBeenCalledWith("abc");
        expect(googleTokenModel.saveTokens).toHaveBeenCalledWith(
            "vendor-1",
            mockTokens,
        );
        expect(res.redirect).toHaveBeenCalledWith(
            "/vendor/calendar.html?connected=true",
        );
    });

    it("should redirect with connected=false when the exchange fails", async () => {
        oauth2Client.getToken.mockRejectedValue(new Error("invalid_grant"));

        const req = { query: { code: "bad-code", state: "vendor-1" } };
        const res = mockRes();

        await googleCalendarController.googleCallback(req, res);

        expect(res.redirect).toHaveBeenCalledWith(
            "/vendor/calendar.html?connected=false",
        );
    });
});

describe("googleCalendarController.getConnectionStatus", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return connected: true when tokens exist", async () => {
        googleTokenModel.getTokens.mockResolvedValue({ access_token: "at" });

        const req = { user: { id: "vendor-1" } };
        const res = mockRes();

        await googleCalendarController.getConnectionStatus(req, res);

        expect(googleTokenModel.getTokens).toHaveBeenCalledWith("vendor-1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ connected: true });
    });

    it("should return connected: false when no tokens exist", async () => {
        googleTokenModel.getTokens.mockResolvedValue(null);

        const req = { user: { id: "vendor-1" } };
        const res = mockRes();

        await googleCalendarController.getConnectionStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ connected: false });
    });

    it("should handle errors and return 500", async () => {
        googleTokenModel.getTokens.mockRejectedValue(new Error("DB Error"));

        const req = { user: { id: "vendor-1" } };
        const res = mockRes();

        await googleCalendarController.getConnectionStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "DB Error" });
    });
});

describe("googleCalendarController.getGoogleEvents", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 404 when Google Calendar is not connected", async () => {
        googleTokenModel.getTokens.mockResolvedValue(null);

        const req = { user: { id: "vendor-1" } };
        const res = mockRes();

        await googleCalendarController.getGoogleEvents(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: "Google Calendar not connected",
        });
    });

    it("should fetch, merge, and sort events across all calendars", async () => {
        googleTokenModel.getTokens.mockResolvedValue({
            access_token: "at",
            refresh_token: "rt",
            token_expiry: "2026-12-31T00:00:00.000Z",
        });

        mockCalendarInstance.calendarList.list.mockResolvedValue({
            data: { items: [{ id: "cal1" }, { id: "cal2" }] },
        });

        mockCalendarInstance.events.list
            .mockResolvedValueOnce({
                data: {
                    items: [
                        {
                            id: "ev2",
                            summary: "Later Event",
                            start: { dateTime: "2026-08-10T10:00:00Z" },
                            end: { dateTime: "2026-08-10T11:00:00Z" },
                        },
                    ],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    items: [
                        {
                            id: "ev1",
                            summary: "Earlier Event",
                            start: { dateTime: "2026-08-05T10:00:00Z" },
                            end: { dateTime: "2026-08-05T11:00:00Z" },
                        },
                    ],
                },
            });

        const req = { user: { id: "vendor-1" } };
        const res = mockRes();

        await googleCalendarController.getGoogleEvents(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const returnedEvents = res.json.mock.calls[0][0];
        expect(returnedEvents).toHaveLength(2);
        // sorted chronologically - earlier event first despite being fetched second
        expect(returnedEvents[0].id).toBe("ev1");
        expect(returnedEvents[1].id).toBe("ev2");
        expect(returnedEvents[0].source).toBe("google");
    });

    it("should skip calendars that fail to fetch events rather than failing the whole request", async () => {
        googleTokenModel.getTokens.mockResolvedValue({ access_token: "at" });

        mockCalendarInstance.calendarList.list.mockResolvedValue({
            data: { items: [{ id: "cal1" }, { id: "cal2" }] },
        });

        mockCalendarInstance.events.list
            .mockRejectedValueOnce(new Error("no access"))
            .mockResolvedValueOnce({
                data: {
                    items: [
                        {
                            id: "ev1",
                            summary: "Valid Event",
                            start: { dateTime: "2026-08-05T10:00:00Z" },
                            end: { dateTime: "2026-08-05T11:00:00Z" },
                        },
                    ],
                },
            });

        const req = { user: { id: "vendor-1" } };
        const res = mockRes();

        await googleCalendarController.getGoogleEvents(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const returnedEvents = res.json.mock.calls[0][0];
        expect(returnedEvents).toHaveLength(1);
        expect(returnedEvents[0].id).toBe("ev1");
    });

    it("should handle errors and return 500", async () => {
        googleTokenModel.getTokens.mockRejectedValue(new Error("DB Error"));

        const req = { user: { id: "vendor-1" } };
        const res = mockRes();

        await googleCalendarController.getGoogleEvents(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Failed to fetch Google Calendar events",
        });
    });
});

describe("googleCalendarController.disconnectGoogle", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete tokens and return 200", async () => {
        googleTokenModel.deleteTokens.mockResolvedValue();

        const req = { user: { id: "vendor-1" } };
        const res = mockRes();

        await googleCalendarController.disconnectGoogle(req, res);

        expect(googleTokenModel.deleteTokens).toHaveBeenCalledWith("vendor-1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Google Calendar disconnected",
        });
    });

    it("should handle errors and return 500", async () => {
        googleTokenModel.deleteTokens.mockRejectedValue(new Error("DB Error"));

        const req = { user: { id: "vendor-1" } };
        const res = mockRes();

        await googleCalendarController.disconnectGoogle(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "DB Error" });
    });
});
