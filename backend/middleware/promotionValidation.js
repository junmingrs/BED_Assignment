const Joi = require("joi");

const promotionCodeField = {
    promotionCode: Joi.string().min(1).required().messages({
        "string.empty": "Promotion code cannot be empty",
        "any.required": "Promotion code is required",
    }),
};

const stallIdField = {
    stallId: Joi.alternatives()
        .try(Joi.string().min(1), Joi.number())
        .required()
        .messages({
            "any.required": "Stall is required",
        }),
};

const dateRangeCheck = (promotion, helpers) => {
    if (
        promotion.startDate &&
        promotion.endDate &&
        new Date(promotion.endDate) < new Date(promotion.startDate)
    ) {
        return helpers.message("End date cannot be before start date");
    }
    return promotion;
};

const createPromotionSchema = Joi.object({
    promotion: Joi.object({
        ...promotionCodeField,
        ...stallIdField,
        itemCode: Joi.string().min(1).required().messages({
            "string.empty": "Item code cannot be empty",
            "any.required": "Item code is required",
        }),
        discount: Joi.number().integer().min(0).required().messages({
            "number.base": "Discount must be a number",
            "number.integer": "Discount must be a whole number",
            "number.min": "Discount cannot be negative",
            "any.required": "Discount is required",
        }),
        startDate: Joi.date().required().messages({
            "date.base": "Start date must be a valid date",
            "any.required": "Start date is required",
        }),
        endDate: Joi.date().required().messages({
            "date.base": "End date must be a valid date",
            "any.required": "End date is required",
        }),
    })
        .custom(dateRangeCheck)
        .required()
        .messages({
            "any.required": "Promotion is required",
        }),
});

const updatePromotionSchema = Joi.object({
    promotion: Joi.object({
        promotionCode: Joi.string().min(1).required().messages({
            "string.empty": "Promotion code cannot be empty",
            "any.required": "Promotion code is required",
        }),
        discount: Joi.number().integer().min(0).optional().messages({
            "number.base": "Discount must be a number",
            "number.integer": "Discount must be a whole number",
            "number.min": "Discount cannot be negative",
        }),
        startDate: Joi.date().optional().messages({
            "date.base": "Start date must be a valid date",
        }),
        endDate: Joi.date().optional().messages({
            "date.base": "End date must be a valid date",
        }),
    })
        .custom(dateRangeCheck)
        .required()
        .messages({
            "any.required": "Promotion is required",
        }),
});

const deletePromotionSchema = Joi.object({
    ...promotionCodeField,
});

const getPromotionByCodeSchema = Joi.object({
    ...promotionCodeField,
});

const getPromotionByStallIdSchema = Joi.object({
    ...stallIdField,
});

function validatePromotionCreate(req, res, next) {
    const { error } = createPromotionSchema.validate(req.body, {
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

function validatePromotionUpdate(req, res, next) {
    const { error } = updatePromotionSchema.validate(req.body, {
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

function validateDeletePromotion(req, res, next) {
    const { error } = deletePromotionSchema.validate(req.body, {
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

function validateGetPromotionByCode(req, res, next) {
    const { error } = getPromotionByCodeSchema.validate(req.params, {
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

function validateGetPromotionByStallId(req, res, next) {
    const { error } = getPromotionByStallIdSchema.validate(req.params, {
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

module.exports = {
    validatePromotionCreate,
    validatePromotionUpdate,
    validateDeletePromotion,
    validateGetPromotionByCode,
    validateGetPromotionByStallId,
};
