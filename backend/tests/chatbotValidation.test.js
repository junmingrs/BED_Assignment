const { validateChat } = require("../middleware/chatbotValidation");

describe("validateChat", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = { body: {} };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    it("should call next() when history is missing", () => {
        req.body = {};
        validateChat(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should call next() when history is an empty array", () => {
        req.body = { history: [] };
        validateChat(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should call next() when history has valid role/content items", () => {
        req.body = {
            history: [
                { role: "user", content: "What do you recommend?" },
                { role: "assistant", content: "Try the chicken rice." },
            ],
        };
        validateChat(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 400 when history is not an array", () => {
        req.body = { history: "not an array" };
        validateChat(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("History must be an array") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when a history item is not an object", () => {
        req.body = { history: ["just a string"] };
        validateChat(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("History items must be objects") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when a history item is missing role", () => {
        req.body = { history: [{ content: "hello" }] };
        validateChat(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Role is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when a history item is missing content", () => {
        req.body = { history: [{ role: "user" }] };
        validateChat(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Content is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when a history item has an empty role", () => {
        req.body = { history: [{ role: "", content: "hello" }] };
        validateChat(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Role cannot be empty") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when a history item has an empty content", () => {
        req.body = { history: [{ role: "user", content: "" }] };
        validateChat(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Content cannot be empty") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when an item in a non-empty history is invalid", () => {
        req.body = {
            history: [
                { role: "user", content: "What do you recommend?" },
                { role: "user" },
            ],
        };
        validateChat(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Content is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });
});
