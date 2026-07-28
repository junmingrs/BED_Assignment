const chatbotModel = require("../model/chatbotModel.js");

async function chat(req, res) {
    const { customerId } = req.params;
    const { history } = req.body;
    try {
        const context = await chatbotModel.getRelevantContext();
        const result = await chatbotModel.getChatResponse(history, context);
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}
module.exports = { chat };
