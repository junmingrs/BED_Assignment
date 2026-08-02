const { Ollama } = require("ollama");
const { poolPromise } = require("../db");
const { getAllHawkerCentres } = require("../model/hawkerCentreModel");
const { getAllCuisines } = require("../model/menuItemModel");
const chatbotModel = require("../model/chatbotModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));

jest.mock("../model/hawkerCentreModel", () => ({
    getAllHawkerCentres: jest.fn(),
}));

jest.mock("../model/menuItemModel", () => ({
    getAllCuisines: jest.fn(),
}));

const mockChat = jest.fn();
jest.mock("ollama", () => ({
    Ollama: jest.fn(() => ({
        chat: mockChat,
    })),
}));

describe("chatbotModel.getRelevantContext", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve stalls, popular items, menu items, and hawker centres", async () => {
        const mockHawkerCentres = [{ hawker_centre_id: "hc1", centre_name: "Central" }];
        const mockStalls = [{ stall_id: "1", stall_name: "Best Stall", avg_rating: 4.5 }];
        const mockPopularItems = [{ item_name: "Chicken Rice", total_ordered: 50 }];
        const mockMenuItems = [{ stall_id: "1", item_code: "A1", item_desc: "Chicken Rice" }];
        const mockCuisines = [{ cuisine_name: "Chinese" }];

        getAllHawkerCentres.mockResolvedValue(mockHawkerCentres);
        getAllCuisines.mockResolvedValue(mockCuisines);

        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue({
            query: jest.fn()
                .mockResolvedValueOnce({ recordset: mockStalls })
                .mockResolvedValueOnce({ recordset: mockPopularItems })
                .mockResolvedValueOnce({ recordset: mockMenuItems }),
        });

        const ctx = await chatbotModel.getRelevantContext();

        expect(getAllHawkerCentres).toHaveBeenCalledTimes(1);
        expect(ctx.hawkerCentres).toEqual(mockHawkerCentres);
        expect(ctx.stalls).toEqual(mockStalls);
        expect(ctx.popularItems).toEqual(mockPopularItems);
        expect(ctx.menuItems).toEqual(mockMenuItems);
        expect(ctx.cuisines).toEqual(mockCuisines);
    });

    it("should handle errors from hawker centre model", async () => {
        getAllHawkerCentres.mockRejectedValue(new Error("DB Error"));

        await expect(chatbotModel.getRelevantContext()).rejects.toThrow("DB Error");
    });

    it("should handle errors from stall query", async () => {
        getAllHawkerCentres.mockResolvedValue([]);

        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue({
            query: jest.fn().mockRejectedValue(new Error("DB Error")),
        });

        await expect(chatbotModel.getRelevantContext()).rejects.toThrow("DB Error");
    });
});

describe("chatbotModel.getChatResponse", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return a plain text reply when no JSON action block", async () => {
        const mockHistory = [{ role: "user", content: "What do you recommend?" }];
        const mockContext = {
            hawkerCentres: [],
            stalls: [],
            popularItems: [],
            menuItems: [],
        };
        const mockOllamaResponse = {
            message: { content: "I recommend the Chicken Rice!" },
        };

        mockChat.mockResolvedValue(mockOllamaResponse);

        const result = await chatbotModel.getChatResponse(mockHistory, mockContext);

        expect(result.reply).toBe("I recommend the Chicken Rice!");
        expect(result.actions).toEqual([]);
    });

    it("should parse JSON action block and separate from reply text", async () => {
        const mockHistory = [{ role: "user", content: "Add chicken rice to cart" }];
        const mockContext = {
            hawkerCentres: [],
            stalls: [{ stall_id: "1", stall_name: "Best Stall" }],
            popularItems: [],
            menuItems: [{ stall_id: "1", item_code: "A1", item_desc: "Chicken Rice" }],
        };
        const mockOllamaResponse = {
            message: {
                content: `Great choice! I'll add Chicken Rice to your cart.\n\`\`\`json\n{"actions": [{"type": "addToCart", "stallId": "1", "itemCode": "A1", "itemName": "Chicken Rice"}]}\n\`\`\``,
            },
        };

        mockChat.mockResolvedValue(mockOllamaResponse);

        const result = await chatbotModel.getChatResponse(mockHistory, mockContext);

        expect(result.reply).toBe("Great choice! I'll add Chicken Rice to your cart.");
        expect(result.actions).toHaveLength(1);
        expect(result.actions[0].type).toBe("addToCart");
        expect(result.actions[0].stallId).toBe("1");
    });

    it("should handle malformed JSON gracefully", async () => {
        const mockHistory = [];
        const mockContext = { hawkerCentres: [], stalls: [], popularItems: [], menuItems: [] };
        const mockOllamaResponse = {
            message: {
                content: `Some text\n\`\`\`json\n{invalid json}\n\`\`\``,
            },
        };

        mockChat.mockResolvedValue(mockOllamaResponse);

        const result = await chatbotModel.getChatResponse(mockHistory, mockContext);

        expect(result.reply).toBe("Some text");
        expect(result.actions).toEqual([]);
    });

    it("should return a fallback response when Ollama throws an error", async () => {
        const mockHistory = [];
        const mockContext = { hawkerCentres: [], stalls: [], popularItems: [], menuItems: [] };

        mockChat.mockRejectedValue(new Error("Ollama Error"));

        const result = await chatbotModel.getChatResponse(mockHistory, mockContext);

        expect(result.reply).toBe("Sorry, I'm having trouble connecting. Please try again later.");
        expect(result.actions).toEqual([]);
    });
});
