const {
    validateMenuItemCreate,
    validateMenuItemUpdate,
} = require("../middleware/menuItemValidation");

describe("validateMenuItemCreate", () => {
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

    const validBody = () => ({
        menuItem: {
            stall_id: "1",
            item_desc: "Chicken Rice",
            item_price: 5.5,
            item_category: "Main",
            item_image: "",
        },
        cuisines: ["chinese"],
    });

    it("should call next() for a valid menu item", () => {
        req.body = validBody();
        validateMenuItemCreate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should accept a numeric stall_id", () => {
        req.body = validBody();
        req.body.menuItem.stall_id = 1;
        validateMenuItemCreate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it("should return 400 when cuisines are missing", () => {
        req.body = validBody();
        delete req.body.cuisines;
        validateMenuItemCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Cuisines are required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when cuisines array is empty", () => {
        req.body = validBody();
        req.body.cuisines = [];
        validateMenuItemCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("At least one cuisine is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when a cuisine is an empty string", () => {
        req.body = validBody();
        req.body.cuisines = ["   "];
        validateMenuItemCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 for an invalid category", () => {
        req.body = validBody();
        req.body.menuItem.item_category = "Snacks";
        validateMenuItemCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Category must be Main, Drinks, or Dessert") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when item_desc is missing", () => {
        req.body = validBody();
        delete req.body.menuItem.item_desc;
        validateMenuItemCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Item name is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when item_price is negative", () => {
        req.body = validBody();
        req.body.menuItem.item_price = -1;
        validateMenuItemCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Item price cannot be negative") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when menuItem is missing", () => {
        req.body = { cuisines: ["chinese"] };
        validateMenuItemCreate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Menu item is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });
});

describe("validateMenuItemUpdate", () => {
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

    const validBody = () => ({
        menuItem: {
            stall_id: "1",
            item_code: "A1",
            item_desc: "Chicken Rice",
            item_price: 5.5,
            item_category: "Main",
            item_image: "",
        },
        cuisines: ["chinese"],
    });

    it("should call next() for a valid update body", () => {
        req.body = validBody();
        validateMenuItemUpdate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 400 when item_code is missing", () => {
        req.body = validBody();
        delete req.body.menuItem.item_code;
        validateMenuItemUpdate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Item code is required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 when cuisines are missing", () => {
        req.body = validBody();
        delete req.body.cuisines;
        validateMenuItemUpdate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Cuisines are required") })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 for an invalid category", () => {
        req.body = validBody();
        req.body.menuItem.item_category = "Snacks";
        validateMenuItemUpdate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining("Category must be Main, Drinks, or Dessert") })
        );
        expect(next).not.toHaveBeenCalled();
    });
});
