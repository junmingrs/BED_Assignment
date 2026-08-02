const Joi = require("joi");

const cuisinesSchema = Joi.array()
    .items(Joi.string().trim().min(1).required())
    .min(1)
    .required()
    .messages({
        "array.base": "Cuisines must be an array",
        "array.min": "At least one cuisine is required",
        "array.includesRequiredUnknowns": "At least one cuisine is required",
        "array.includesRequiredKnowns": "At least one cuisine is required",
        "any.required": "Cuisines are required",
    });

const menuItemSchema = {
    stall_id: Joi.alternatives()
        .try(Joi.string().min(1), Joi.number())
        .required()
        .messages({
            "any.required": "Stall is required",
        }),
    item_desc: Joi.string().min(1).max(255).required().messages({
        "string.base": "Item name must be a string",
        "string.empty": "Item name cannot be empty",
        "string.min": "Item name must be at least 1 character long",
        "string.max": "Item name cannot exceed 255 characters",
        "any.required": "Item name is required",
    }),
    item_price: Joi.number().min(0).required().messages({
        "number.base": "Item price must be a number",
        "number.min": "Item price cannot be negative",
        "any.required": "Item price is required",
    }),
    item_category: Joi.string()
        .valid("Main", "Drinks", "Dessert")
        .required()
        .messages({
            "any.only": "Category must be Main, Drinks, or Dessert",
            "any.required": "Category is required",
        }),
    item_image: Joi.string().allow("", null).optional().messages({
        "string.base": "Item image must be a string",
    }),
};

const addMenuItemSchema = Joi.object({
    menuItem: Joi.object(menuItemSchema).required().messages({
        "any.required": "Menu item is required",
    }),
    cuisines: cuisinesSchema,
});

const updateMenuItemSchema = Joi.object({
    menuItem: Joi.object({
        ...menuItemSchema,
        item_code: Joi.string().min(1).required().messages({
            "string.empty": "Item code cannot be empty",
            "any.required": "Item code is required",
        }),
    }).required().messages({
        "any.required": "Menu item is required",
    }),
    cuisines: cuisinesSchema,
});

function validateMenuItemCreate(req, res, next) {
    const { error } = addMenuItemSchema.validate(req.body, {
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

function validateMenuItemUpdate(req, res, next) {
    const { error } = updateMenuItemSchema.validate(req.body, {
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

module.exports = { validateMenuItemCreate, validateMenuItemUpdate };
