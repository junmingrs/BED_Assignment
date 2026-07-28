const { Ollama } = require("ollama");
const {
    getKPI,
    getHourlySales,
    getTopItems,
    getAISummary,
} = require("../model/analyticsModel");
const helper = require("../helper");

const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(),
};

jest.mock("mssql", () => ({
    ConnectionPool: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue({
            request: () => mockRequest,
        }),
    })),
}));

const mockChat = jest.fn();
jest.mock("ollama", () => ({
    Ollama: jest.fn().mockImplementation(() => ({
        chat: mockChat,
    })),
}));

describe("Analytics Model Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest.input.mockReturnThis();
        mockRequest.query.mockReset();
        mockChat.mockReset();

        // for testing
        process.env.OLLAMA_API_KEY = "test_ollama_key";

        jest.spyOn(helper, "getTimeFilter");
        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    describe("getKPI", () => {
        test("should execute query with time filter and return KPI data when found", async () => {
            const stallId = "stall_123";
            const timeframe = "today";
            const mockKpiData = {
                totalRevenue: 500.5,
                orderCount: 25,
                averageOrderValue: 20.02,
            };

            mockRequest.query.mockResolvedValueOnce({ recordset: [mockKpiData] });

            const result = await getKPI(stallId, timeframe);

            expect(result).toEqual(mockKpiData);
            expect(helper.getTimeFilter).toHaveBeenCalledWith(
                timeframe,
                "order_date",
            );
            expect(mockRequest.input).toHaveBeenCalledWith("id", stallId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should return null if no KPI data exists (recordset is empty)", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getKPI("stall_123", "this_week");

            expect(result).toBeNull();
        });
    });

    describe("getHourlySales", () => {
        test("should return hourly sales records when data exists for today", async () => {
            const stallId = "stall_123";
            const mockHourlyData = [
                { sales_hour: 11, totalRevenue: 120.0 },
                { sales_hour: 12, totalRevenue: 350.5 },
            ];

            mockRequest.query.mockResolvedValueOnce({ recordset: mockHourlyData });

            const result = await getHourlySales(stallId);

            expect(result).toEqual(mockHourlyData);
            expect(mockRequest.input).toHaveBeenCalledWith("id", stallId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should return null if no sales records exist for today", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getHourlySales("stall_123");

            expect(result).toBeNull();
        });
    });

    describe("getTopItems", () => {
        test("should execute query with time filter and return top selling items", async () => {
            const stallId = "stall_123";
            const timeframe = "this_month";
            const mockTopItems = [
                { itemName: "Chicken Rice", totalSold: 50, totalRevenue: 250.0 },
                { itemName: "Laksa", totalSold: 30, totalRevenue: 180.0 },
            ];

            mockRequest.query.mockResolvedValueOnce({ recordset: mockTopItems });

            const result = await getTopItems(stallId, timeframe);

            expect(result).toEqual(mockTopItems);
            expect(helper.getTimeFilter).toHaveBeenCalledWith(
                timeframe,
                "order_date",
            );
            expect(mockRequest.input).toHaveBeenCalledWith("id", stallId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should return null if no top items are found", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            const result = await getTopItems("stall_123", "this_month");

            expect(result).toBeNull();
        });
    });

    describe("getAISummary", () => {
        const mockInputData = {
            ratings: [{ rating: 5 }],
            complaints: [],
            feedback: ["Great food!"],
            orders: { totalRevenue: 1000 },
        };

        test("should fetch and parse the AI summary from Ollama successfully", async () => {
            const expectedSummary = {
                highlights: "Revenue grew by 20% this week.",
                flags: "Everything is looking good! No warnings or complaints flagged.",
                actions: "Everything is on track. No urgent action required today.",
            };

            mockChat.mockResolvedValueOnce({
                message: {
                    content: JSON.stringify(expectedSummary),
                },
            });

            const result = await getAISummary(mockInputData);

            expect(Ollama).toHaveBeenCalledWith({
                host: "https://ollama.com",
                headers: {
                    Authorization: "Bearer test_ollama_key",
                },
            });

            expect(mockChat).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: "minimax-m3",
                    messages: expect.arrayContaining([
                        expect.objectContaining({ role: "system" }),
                        expect.objectContaining({ role: "user" }),
                    ]),
                }),
            );

            expect(result).toEqual(expectedSummary);
        });

        test("should clean ```json markdown blocks before parsing JSON", async () => {
            const expectedSummary = {
                highlights: "Popular item was Chicken Rice.",
                flags: "No flags.",
                actions: "Check inventory.",
            };

            const markdownWrappedContent = `\`\`\`json\n${JSON.stringify(expectedSummary)}\n\`\`\``;

            mockChat.mockResolvedValueOnce({
                message: { content: markdownWrappedContent },
            });

            const result = await getAISummary(mockInputData);

            expect(result).toEqual(expectedSummary);
        });

        test("should return fallback object when response content is invalid JSON", async () => {
            mockChat.mockResolvedValueOnce({
                message: { content: "This is invalid JSON output from model" },
            });

            const result = await getAISummary(mockInputData);

            expect(result).toEqual({
                highlights:
                    "Cannot generate AI summary at this time. Please try again.",
                flags: "Cannot generate AI summary at this time. Please try again.",
                actions: "Cannot generate AI summary at this time. Please try again.",
            });
            expect(console.error).toHaveBeenCalled();
        });

        test("should return fallback object when Ollama API call throws an error", async () => {
            mockChat.mockRejectedValueOnce(new Error("Ollama connection failed"));

            const result = await getAISummary(mockInputData);

            expect(result).toEqual({
                highlights:
                    "Cannot generate AI summary at this time. Please try again.",
                flags: "Cannot generate AI summary at this time. Please try again.",
                actions: "Cannot generate AI summary at this time. Please try again.",
            });
            expect(console.error).toHaveBeenCalled();
        });
    });
});
