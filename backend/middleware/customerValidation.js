const Joi = require("joi");

const customerIdField = {
    customerId: Joi.alternatives()
        .try(Joi.string().min(1), Joi.number())
        .required()
        .messages({
            "any.required": "Customer ID is required",
        }),
};

const pointsField = {
    points: Joi.number().integer().min(1).required().messages({
        "number.base": "Points must be a number",
        "number.integer": "Points must be a whole number",
        "number.min": "Points must be at least 1",
        "any.required": "Points are required",
    }),
};

const getCustomerByAccountIdSchema = Joi.object({
    ...customerIdField,
});

const addCustomerLoyaltyPointsSchema = Joi.object({
    ...customerIdField,
    ...pointsField,
});

const subtractCustomerLoyaltyPointsSchema = Joi.object({
    ...customerIdField,
    ...pointsField,
});

function validateGetCustomerByAccountId(req, res, next) {
    const { error } = getCustomerByAccountIdSchema.validate(req.params, {
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

function validateAddCustomerLoyaltyPoints(req, res, next) {
    const { error } = addCustomerLoyaltyPointsSchema.validate(
        { ...req.params, ...req.body },
        { abortEarly: true }
    );

    if (error) {
        const errorMessage = error.details
            .map((detail) => detail.message)
            .join(", ");
        return res.status(400).json({ message: errorMessage });
    }
    next();
}

function validateSubtractCustomerLoyaltyPoints(req, res, next) {
    const { error } = subtractCustomerLoyaltyPointsSchema.validate(
        { ...req.params, ...req.body },
        { abortEarly: true }
    );

    if (error) {
        const errorMessage = error.details
            .map((detail) => detail.message)
            .join(", ");
        return res.status(400).json({ message: errorMessage });
    }
    next();
}

module.exports = {
    validateGetCustomerByAccountId,
    validateAddCustomerLoyaltyPoints,
    validateSubtractCustomerLoyaltyPoints,
};
