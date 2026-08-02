const Joi = require("joi");
const { handleValidationError } = require("../helper");

const analyticsSchemas = {
    stallIdParams: Joi.object({
        stallId: Joi.string().required().messages({
            "string.empty": "Stall ID is required",
            "any.required": "Stall ID is required",
        }),
    }),

    timeframeQuery: Joi.object({
        timeframe: Joi.string().optional().allow(null, ""),
    }),
};

function validateGetKPI(req, res, next) {
    const paramsValidation = analyticsSchemas.stallIdParams.validate(
        req.params,
        {
            abortEarly: false,
        },
    );
    if (paramsValidation.error)
        return handleValidationError(res, paramsValidation.error);

    const queryValidation = analyticsSchemas.timeframeQuery.validate(
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

function validateGetHourlySales(req, res, next) {
    const { error, value } = analyticsSchemas.stallIdParams.validate(
        req.params,
        {
            abortEarly: false,
        },
    );
    if (error) return handleValidationError(res, error);

    req.params = value;
    next();
}

function validateGetTopItems(req, res, next) {
    const paramsValidation = analyticsSchemas.stallIdParams.validate(
        req.params,
        {
            abortEarly: false,
        },
    );
    if (paramsValidation.error)
        return handleValidationError(res, paramsValidation.error);

    const queryValidation = analyticsSchemas.timeframeQuery.validate(
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

function validateGetAISummary(req, res, next) {
    const paramsValidation = analyticsSchemas.stallIdParams.validate(
        req.params,
        {
            abortEarly: false,
        },
    );
    if (paramsValidation.error)
        return handleValidationError(res, paramsValidation.error);

    const queryValidation = analyticsSchemas.timeframeQuery.validate(
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

module.exports = {
    validateGetKPI,
    validateGetHourlySales,
    validateGetTopItems,
    validateGetAISummary,
};
