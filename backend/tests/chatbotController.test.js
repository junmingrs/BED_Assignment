const chatbotController = require("../controller/chatbotController");
const chatbotModel = require("../model/chatbotModel");

jest.mock("../model/chatbotModel");
jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));

describe("chatbotController.chat", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return chat response with actions as JSON", async () => {
        const mockContext = { stalls: [], popularItems: [], menuItems: [], hawkerCentres: [] };
        const mockResult = { reply: "Try the Chicken Rice!", actions: [{ type: "viewStall", stallId: "1" }] };
        chatbotModel.getRelevantContext.mockResolvedValue(mockContext);
        chatbotModel.getChatResponse.mockResolvedValue(mockResult);

        const req = { params: { customerId: "c1" }, body: { history: [{ role: "user", content: "hello" }] } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await chatbotController.chat(req, res);

        expect(chatbotModel.getRelevantContext).toHaveBeenCalledTimes(1);
        expect(chatbotModel.getChatResponse).toHaveBeenCalledWith(
            [{ role: "user", content: "hello" }],
            mockContext,
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should handle errors and return 500", async () => {
        chatbotModel.getRelevantContext.mockRejectedValue(new Error("DB Error"));

        const req = { params: { customerId: "c1" }, body: { history: [] } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await chatbotController.chat(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });

    it("should handle errors from getChatResponse and return 500", async () => {
        const mockContext = { stalls: [], popularItems: [], menuItems: [], hawkerCentres: [] };
        chatbotModel.getRelevantContext.mockResolvedValue(mockContext);
        chatbotModel.getChatResponse.mockRejectedValue(new Error("Ollama Error"));

        const req = { params: { customerId: "c1" }, body: { history: [] } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await chatbotController.chat(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
});
