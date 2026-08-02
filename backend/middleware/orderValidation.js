const Joi = require("joi");
const { handleValidationError } = require("../helper");

const cartSchema = Joi.object()
    .pattern(
        Joi.string(), // key is stallId
        Joi.object({
            isEco: Joi.boolean().optional().default(false),
            items: Joi.array()
                .items(
                    Joi.object({
                        stallId: Joi.string().required().messages({
                            "string.empty":
                                "Stall ID is required for each item",
                            "any.required":
                                "Stall ID is required for each item",
                        }),
                        itemCode: Joi.string().required().messages({
                            "string.empty": "Item code is required",
                            "any.required": "Item code is required",
                        }),
                        quantity: Joi.number()
                            .integer()
                            .min(1)
                            .default(1)
                            .messages({
                                "number.min": "Quantity must be at least 1",
                                "number.base":
                                    "Quantity must be a valid number",
                            }),
                        itemPrice: Joi.number().positive(),
                    }),
                )
                .min(1)
                .required()
                .messages({
                    "array.min": "Cart items list cannot be empty",
                }),
        }),
    )
    .required()
    .messages({
        "object.base": "Cart must be a valid object",
        "any.required": "Cart is required",
    });

const schemas = {
    getOrderById: Joi.object({
        orderId: Joi.string().uuid().required().messages({
            "string.empty": "Order ID is required",
            "any.required": "Order ID is required",
        }),
    }),

    getOrdersByCustomerParams: Joi.object({
        customerId: Joi.string().required().messages({
            "string.empty": "Customer ID is required",
            "any.required": "Customer ID is required",
        }),
    }),

    // status (which is optional) is either string or string[]
    getOrdersByCustomerQuery: Joi.object({
        status: Joi.alternatives()
            .try(Joi.string(), Joi.array().items(Joi.string()))
            .optional(),
    }),

    getCustomerProfile: Joi.object({
        customerId: Joi.string().required().messages({
            "string.empty": "Customer ID is required",
            "any.required": "Customer ID is required",
        }),
    }),

    updateOrderStatus: Joi.object({
        orderId: Joi.string().uuid().required().messages({
            "string.empty": "Order ID is required",
            "any.required": "Order ID is required",
        }),
        status: Joi.string().required().messages({
            "string.empty": "Status is required",
            "any.required": "Status is required",
        }),
    }),

    getOrderByStallIdParams: Joi.object({
        stallId: Joi.string().required().messages({
            "string.empty": "Stall ID is required",
            "any.required": "Stall ID is required",
        }),
    }),

    getOrderByStallIdQuery: Joi.object({
        timeframe: Joi.string().optional().allow(null, ""),
    }),

    checkoutCart: Joi.object({
        cart: cartSchema,
        customerId: Joi.string().required(),
    }),
};

function validateGetOrderById(req, res, next) {
    const { error, value } = schemas.getOrderById.validate(req.params, {
        abortEarly: false,
    });
    if (error) return handleValidationError(res, error);

    req.params = value;
    next();
}

function validateGetOrdersByCustomer(req, res, next) {
    const paramsValidation = schemas.getOrdersByCustomerParams.validate(
        req.params,
        { abortEarly: false },
    );
    if (paramsValidation.error)
        return handleValidationError(res, paramsValidation.error);

    const queryValidation = schemas.getOrdersByCustomerQuery.validate(
        req.query,
        {
            abortEarly: false,
        },
    );
    if (queryValidation.error)
        return handleValidationError(res, queryValidation.error);

    req.params = paramsValidation.value;
    req.query = queryValidation.value;
    next();
}

function validateGetCustomerProfile(req, res, next) {
    const { error, value } = schemas.getCustomerProfile.validate(req.params, {
        abortEarly: false,
    });
    if (error) return handleValidationError(res, error);

    req.params = value;
    next();
}

function validateUpdateOrderStatus(req, res, next) {
    const { error, value } = schemas.updateOrderStatus.validate(req.params, {
        abortEarly: false,
    });
    if (error) return handleValidationError(res, error);

    req.params = value;
    next();
}

function validateGetOrderByStallId(req, res, next) {
    const paramsValidation = schemas.getOrderByStallIdParams.validate(
        req.params,
        { abortEarly: false },
    );
    if (paramsValidation.error)
        return handleValidationError(res, paramsValidation.error);

    const queryValidation = schemas.getOrderByStallIdQuery.validate(req.query, {
        abortEarly: false,
    });
    if (queryValidation.error)
        return handleValidationError(res, queryValidation.error);

    req.params = paramsValidation.value;
    req.query = queryValidation.value;
    next();
}

function validateCheckoutCart(req, res, next) {
    const { error, value } = schemas.checkoutCart.validate(req.body, {
        abortEarly: false,
    });
    if (error) return handleValidationError(res, error);

    req.body = value;
    next();
}

module.exports = {
    validateGetOrderById,
    validateGetOrdersByCustomer,
    validateGetCustomerProfile,
    validateUpdateOrderStatus,
    validateGetOrderByStallId,
    validateCheckoutCart,
};
