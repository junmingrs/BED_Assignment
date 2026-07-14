const Joi = require("joi");

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.base": "Email must be a string",
        "string.empty": "Email is required",
        "string.email": "Please enter a valid email address",
        "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
        "string.empty": "Password cannot be empty",
        "any.required": "Password is required.",
    }),
});

const registerSchema = Joi.object({
    name: Joi.string().min(1).max(255).required().messages({
        "string.base": "Name must be a string",
        "string.empty": "Name cannot be empty",
        "string.min": "Name must be at least 1 character long",
        "string.max": "Name cannot exceed 255 characters",
        "any.required": "Name is required",
    }),
    email: Joi.string().email().required().messages({
        "string.base": "Email must be a string",
        "string.empty": "Email is required",
        "string.email": "Please enter a valid email address",
        "any.required": "Email is required",
    }),
    role: Joi.string()
        .valid("Customer", "Vendor", "Operator")
        .required()
        .messages({
            "any.only": "Role must be Customer, Vendor, Operator",
            "any.required": "Role is required",
        }),
    password: Joi.string()
        .min(8)
        // regex for at least 1 number and 1 special character
        .pattern(/^(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
        .required()
        .messages({
            "string.empty": "Password cannot be empty",
            "string.min": "Password must be at least 8 characters long.",
            "string.pattern.base":
                "Password must contain at least one number and one special character.",
            "any.required": "Password is required.",
        }),
});

function validateRegister(req, res, next) {
    const { error } = registerSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details
            .map((detail) => detail.message)
            .join(", ");
        return res.status(400).json({ error: errorMessage });
    }
    next();
}

function validateLogin(req, res, next) {
    const { error } = loginSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details
            .map((detail) => detail.message)
            .join(", ");
        return res.status(400).json({ error: errorMessage });
    }
    next();
}

module.exports = { validateRegister, validateLogin };
