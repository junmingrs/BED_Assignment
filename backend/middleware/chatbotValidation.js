const Joi = require("joi");

const chatSchema = Joi.object({
    history: Joi.array()
        .items(
            Joi.object({
                role: Joi.string().min(1).required().messages({
                    "string.empty": "Role cannot be empty",
                    "any.required": "Role is required",
                }),
                content: Joi.string().min(1).required().messages({
                    "string.empty": "Content cannot be empty",
                    "any.required": "Content is required",
                }),
            }).messages({
                "object.base": "History items must be objects with role and content",
            })
        )
        .optional()
        .messages({
            "array.base": "History must be an array",
        }),
});

function validateChat(req, res, next) {
    const { error } = chatSchema.validate(req.body, {
        abortEarly: true,
    });

    if (error) {
        const errorMessage = error.details
            .map((detail) => detail.message)
            .join(", ");
        return res.status(400).json({ message: errorMessage });
    }
    next();
}

module.exports = { validateChat };
