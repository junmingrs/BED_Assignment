const menuItemController = require("../controller/menuItemController");
const menuItemModel = require("../model/menuItemModel");

jest.mock("../model/menuItemModel");
jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));

describe("menuItemController.getAllMenuItems", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch all menu items and return JSON response", async () => {
        const mockItems = [
            { stall_id: "1", item_code: "A1", item_desc: "Chicken Rice" },
        ];
        menuItemModel.getAllMenuItems.mockResolvedValue(mockItems);

        const req = {};
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.getAllMenuItems(req, res);

        expect(menuItemModel.getAllMenuItems).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith(mockItems);
    });

    it("should handle errors and return 500", async () => {
        menuItemModel.getAllMenuItems.mockRejectedValue(new Error("DB Error"));

        const req = {};
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.getAllMenuItems(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error retrieving menu items" });
    });
});

describe("menuItemController.getMenuItemsByStallId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch menu items by stall ID and return 201", async () => {
        const mockItems = [{ stall_id: "1", item_code: "A1" }];
        menuItemModel.getMenuItemsByStallId.mockResolvedValue(mockItems);

        const req = { params: { stallId: "1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.getMenuItemsByStallId(req, res);

        expect(menuItemModel.getMenuItemsByStallId).toHaveBeenCalledWith("1");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockItems);
    });

    it("should handle errors and return 500", async () => {
        menuItemModel.getMenuItemsByStallId.mockRejectedValue(new Error("DB Error"));

        const req = { params: { stallId: "1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.getMenuItemsByStallId(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error retrieving menu items in stall" });
    });
});

describe("menuItemController.getMenuItemsByStallIdAndItemCode", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch a specific menu item and return JSON", async () => {
        const mockItem = { stall_id: "1", item_code: "A1", item_desc: "Chicken Rice" };
        menuItemModel.getMenuItemsByStallIdAndItemCode.mockResolvedValue(mockItem);

        const req = { query: { stallId: "1", itemCode: "A1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.getMenuItemsByStallIdAndItemCode(req, res);

        expect(menuItemModel.getMenuItemsByStallIdAndItemCode).toHaveBeenCalledWith("1", "A1");
        expect(res.json).toHaveBeenCalledWith(mockItem);
    });

    it("should return 404 if menu item not found", async () => {
        menuItemModel.getMenuItemsByStallIdAndItemCode.mockResolvedValue(null);

        const req = { query: { stallId: "1", itemCode: "ZZZ" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.getMenuItemsByStallIdAndItemCode(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Menu item not found" });
    });

    it("should handle errors and return 500", async () => {
        menuItemModel.getMenuItemsByStallIdAndItemCode.mockRejectedValue(new Error("DB Error"));

        const req = { query: { stallId: "1", itemCode: "A1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.getMenuItemsByStallIdAndItemCode(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error retrieving specific menu item in stall" });
    });
});

describe("menuItemController.createMenuItem", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a menu item and return 201", async () => {
        const image = "data:image/png;base64,iVBORw0KGgo=";
        const mockNewItem = { menuItem: { stall_id: "1", item_code: "NEW1", item_image: image }, cuisines: [] };
        menuItemModel.getAllCuisines.mockResolvedValue([]);
        menuItemModel.createMenuItem.mockResolvedValue(mockNewItem);

        const req = { body: { menuItem: { stall_id: "1", item_image: image }, cuisines: ["Chinese"] } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.createMenuItem(req, res);

        expect(menuItemModel.getAllCuisines).toHaveBeenCalledTimes(1);
        expect(menuItemModel.createMenuItem).toHaveBeenCalledTimes(1);
        expect(menuItemModel.createMenuItem).toHaveBeenCalledWith(
            expect.objectContaining({ item_image: image }),
            ["Chinese"],
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockNewItem);
    });

    it("should create a new cuisine if it does not exist", async () => {
        const mockNewItem = { menuItem: { stall_id: "1", item_code: "NEW1" }, cuisines: [] };
        menuItemModel.getAllCuisines.mockResolvedValue([{ cuisine_name: "Chinese" }]);
        menuItemModel.createMenuItem.mockResolvedValue(mockNewItem);

        const req = { body: { menuItem: { stall_id: "1" }, cuisines: ["NewCuisine"] } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.createMenuItem(req, res);

        expect(menuItemModel.createCuisine).toHaveBeenCalledWith("NewCuisine");
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should handle errors and return 500", async () => {
        menuItemModel.getAllCuisines.mockRejectedValue(new Error("DB Error"));

        const req = { body: { menuItem: {}, cuisines: [] } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.createMenuItem(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error creating menu item" });
    });
});

describe("menuItemController.updateMenuItem", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update a menu item and return 201", async () => {
        const image = "data:image/png;base64,iVBORw0KGgo=";
        const updatedItem = { stall_id: "1", item_code: "A1", item_desc: "Updated" };
        menuItemModel.getAllCuisines.mockResolvedValue([{ cuisine_name: "Chinese" }]);
        menuItemModel.getMenuItemCuisine.mockResolvedValue([{ cuisine_name: "Chinese" }]);
        menuItemModel.updateMenuItem.mockResolvedValue(updatedItem);

        const req = { body: { menuItem: { stall_id: "1", item_code: "A1", item_image: image }, cuisines: ["Chinese"] } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.updateMenuItem(req, res);

        expect(menuItemModel.updateMenuItem).toHaveBeenCalledTimes(1);
        expect(menuItemModel.updateMenuItem).toHaveBeenCalledWith(
            expect.objectContaining({ item_image: image }),
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(updatedItem);
    });

    it("should add new cuisine and remove old cuisine during update", async () => {
        const updatedItem = { stall_id: "1", item_code: "A1", item_desc: "Updated" };
        menuItemModel.getAllCuisines.mockResolvedValue([{ cuisine_name: "Chinese" }]);
        menuItemModel.getMenuItemCuisine.mockResolvedValue([{ cuisine_name: "OldCuisine" }]);
        menuItemModel.updateMenuItem.mockResolvedValue(updatedItem);

        const req = { body: { menuItem: { stall_id: "1", item_code: "A1" }, cuisines: ["Chinese"] } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.updateMenuItem(req, res);

        expect(menuItemModel.createMenuItemCuisine).toHaveBeenCalledWith("1", "A1", "Chinese");
        expect(menuItemModel.deleteMenuItemCuisine).toHaveBeenCalledWith("1", "A1", "OldCuisine");
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should handle errors and return 500", async () => {
        menuItemModel.getAllCuisines.mockRejectedValue(new Error("DB Error"));

        const req = { body: { menuItem: {}, cuisines: [] } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.updateMenuItem(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error updating menu item" });
    });
});

describe("menuItemController.deleteMenuItem", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a menu item and return 201", async () => {
        menuItemModel.deleteMenuItem.mockResolvedValue(true);

        const req = { body: { stallId: "1", itemCode: "A1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.deleteMenuItem(req, res);

        expect(menuItemModel.deleteMenuItem).toHaveBeenCalledWith("1", "A1");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ success: "true" });
    });

    it("should return 500 if delete fails (orders exist)", async () => {
        menuItemModel.deleteMenuItem.mockResolvedValue(false);

        const req = { body: { stallId: "1", itemCode: "A1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.deleteMenuItem(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Theres still orders with this menu item" });
    });

    it("should handle errors and return 500", async () => {
        menuItemModel.deleteMenuItem.mockRejectedValue(new Error("DB Error"));

        const req = { body: { stallId: "1", itemCode: "A1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.deleteMenuItem(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error deleting menu item" });
    });
});

describe("menuItemController.getMenuItemLikeByCustomer", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch likes by customer and return JSON", async () => {
        const mockLikes = [{ stall_id: "1", item_code: "A1", customer_id: "c1" }];
        menuItemModel.getMenuItemLikesByCustomer.mockResolvedValue(mockLikes);

        const req = { params: { customerId: "c1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.getMenuItemLikeByCustomer(req, res);

        expect(menuItemModel.getMenuItemLikesByCustomer).toHaveBeenCalledWith("c1");
        expect(res.json).toHaveBeenCalledWith(mockLikes);
    });

    it("should return 404 if no likes found", async () => {
        menuItemModel.getMenuItemLikesByCustomer.mockResolvedValue(null);

        const req = { params: { customerId: "c1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.getMenuItemLikeByCustomer(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Menu item not found" });
    });

    it("should handle errors and return 500", async () => {
        menuItemModel.getMenuItemLikesByCustomer.mockRejectedValue(new Error("DB Error"));

        const req = { params: { customerId: "c1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.getMenuItemLikeByCustomer(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error retrieving menu item likes by customer" });
    });
});

describe("menuItemController.createMenuItemLike", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a like and return 201", async () => {
        const mockLike = { stall_id: "1", item_code: "A1", customer_id: "c1" };
        menuItemModel.createMenuItemLike.mockResolvedValue(mockLike);

        const req = { params: { customerId: "c1" }, body: { stallId: "1", itemCode: "A1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.createMenuItemLike(req, res);

        expect(menuItemModel.createMenuItemLike).toHaveBeenCalledWith("1", "A1", "c1");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockLike);
    });

    it("should handle errors and return 500", async () => {
        menuItemModel.createMenuItemLike.mockRejectedValue(new Error("DB Error"));

        const req = { params: { customerId: "c1" }, body: {} };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.createMenuItemLike(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error creating menu item" });
    });
});

describe("menuItemController.deleteMenuItemLike", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a like and return 201", async () => {
        menuItemModel.deleteMenuItemLike.mockResolvedValue(undefined);

        const req = { params: { customerId: "c1" }, body: { stallId: "1", itemCode: "A1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.deleteMenuItemLike(req, res);

        expect(menuItemModel.deleteMenuItemLike).toHaveBeenCalledWith("1", "A1", "c1");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("should handle errors and return 500", async () => {
        menuItemModel.deleteMenuItemLike.mockRejectedValue(new Error("DB Error"));

        const req = { params: { customerId: "c1" }, body: {} };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.deleteMenuItemLike(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error deleting menu item" });
    });
});

describe("menuItemController.getMenuItemCuisine", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch cuisines for a menu item and return 201", async () => {
        const mockCuisines = [{ stall_id: "1", item_code: "A1", cuisine_name: "Chinese" }];
        menuItemModel.getMenuItemCuisine.mockResolvedValue(mockCuisines);

        const req = { params: { stallId: "1", itemCode: "A1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.getMenuItemCuisine(req, res);

        expect(menuItemModel.getMenuItemCuisine).toHaveBeenCalledWith("1", "A1");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ cuisines: mockCuisines });
    });

    it("should handle errors and return 500", async () => {
        menuItemModel.getMenuItemCuisine.mockRejectedValue(new Error("DB Error"));

        const req = { params: { stallId: "1", itemCode: "A1" } };
        const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

        await menuItemController.getMenuItemCuisine(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Error getting cuisines for menu item" });
    });
});
