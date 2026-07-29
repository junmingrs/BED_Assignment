const { poolPromise } = require("../db");
const menuItemModel = require("../model/menuItemModel");

jest.mock("../db", () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        query: jest.fn(),
    }),
}));

describe("menuItemModel.getAllMenuItems", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve all menu items from the database", async () => {
        const mockItems = [
            { stall_id: "1", item_code: "A1", item_desc: "Chicken Rice", item_price: 5.00, item_category: "Main" },
            { stall_id: "1", item_code: "A2", item_desc: "Fried Rice", item_price: 4.50, item_category: "Main" },
        ];
        const mockRequest = { query: jest.fn().mockResolvedValue({ recordset: mockItems }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const items = await menuItemModel.getAllMenuItems();

        expect(mockRequest.query).toHaveBeenCalledWith("SELECT * FROM MenuItem");
        expect(items).toEqual(mockItems);
    });

    it("should return null when no menu items exist", async () => {
        const mockRequest = { query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const items = await menuItemModel.getAllMenuItems();

        expect(items).toBeNull();
    });

    it("should handle errors when retrieving menu items", async () => {
        const mockRequest = { query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.getAllMenuItems()).rejects.toThrow("DB Error");
    });
});

describe("menuItemModel.getMenuItemsByStallId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve menu items for a specific stall", async () => {
        const mockItems = [
            { stall_id: "1", item_code: "A1", item_desc: "Chicken Rice", item_price: 5.00, item_category: "Main" },
        ];
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: mockItems }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const items = await menuItemModel.getMenuItemsByStallId("1");

        expect(mockRequest.input).toHaveBeenCalledWith("stall_id", "1");
        expect(items).toEqual(mockItems);
    });

    it("should return empty array when stall has no items", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const items = await menuItemModel.getMenuItemsByStallId("1");

        expect(items).toEqual([]);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.getMenuItemsByStallId("1")).rejects.toThrow("DB Error");
    });
});

describe("menuItemModel.getMenuItemsByStallIdAndItemCode", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve a specific menu item", async () => {
        const mockItem = { stall_id: "1", item_code: "A1", item_desc: "Chicken Rice", item_price: 5.00 };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [mockItem] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const item = await menuItemModel.getMenuItemsByStallIdAndItemCode("1", "A1");

        expect(item).toEqual(mockItem);
    });

    it("should return null when menu item not found", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const item = await menuItemModel.getMenuItemsByStallIdAndItemCode("1", "ZZZ");

        expect(item).toBeNull();
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.getMenuItemsByStallIdAndItemCode("1", "A1")).rejects.toThrow("DB Error");
    });
});

describe("menuItemModel.createMenuItem", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a new menu item with cuisines", async () => {
        const mockMenuItem = { stall_id: "1", item_desc: "New Dish", item_price: 6.00, item_category: "Main" };
        const cuisines = ["Chinese", "Spicy"];
        const createdItem = { stall_id: "1", item_code: "NEW1", item_desc: "New Dish", item_price: 6.00, item_category: "Main" };
        const mockCuisine = { stall_id: "1", item_code: "NEW1", cuisine_name: "Chinese" };

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn()
                .mockResolvedValueOnce({ recordset: [createdItem] })
                .mockResolvedValue({ recordset: [mockCuisine] }),
        };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await menuItemModel.createMenuItem(mockMenuItem, cuisines);

        expect(result.menuItem).toEqual(createdItem);
        expect(result.cuisines).toHaveLength(2);
    });

    it("should handle errors when creating menu item", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.createMenuItem({}, [])).rejects.toThrow("DB Error");
    });
});

describe("menuItemModel.updateMenuItem", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update a menu item and return the updated item", async () => {
        const updateData = { stall_id: "1", item_code: "A1", item_desc: "Updated Dish", item_price: 7.00, item_category: "Main" };
        const updatedItem = { stall_id: "1", item_code: "A1", item_desc: "Updated Dish", item_price: 7.00, item_category: "Main" };

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn()
                .mockResolvedValueOnce({})  // UPDATE
                .mockResolvedValueOnce({ recordset: [updatedItem] }),  // getMenuItemsByStallIdAndItemCode
        };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await menuItemModel.updateMenuItem(updateData);

        expect(result).toEqual(updatedItem);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.updateMenuItem({})).rejects.toThrow("DB Error");
    });
});

describe("menuItemModel.deleteMenuItem", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a menu item and return true", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await menuItemModel.deleteMenuItem("1", "A1");

        expect(result).toBe(true);
    });

    it("should return false on error", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("FK violation")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await menuItemModel.deleteMenuItem("1", "A1");

        expect(result).toBe(false);
    });
});

describe("menuItemModel.getMenuItemLikesByCustomer", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve likes for a customer", async () => {
        const mockLikes = [{ stall_id: "1", item_code: "A1", customer_id: "c1" }];
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: mockLikes }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const likes = await menuItemModel.getMenuItemLikesByCustomer("c1");

        expect(likes).toEqual(mockLikes);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.getMenuItemLikesByCustomer("c1")).rejects.toThrow("DB Error");
    });
});

describe("menuItemModel.createMenuItemLike", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a menu item like", async () => {
        const mockLike = { stall_id: "1", item_code: "A1", customer_id: "c1" };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [mockLike] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const like = await menuItemModel.createMenuItemLike("1", "A1", "c1");

        expect(like).toEqual(mockLike);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.createMenuItemLike("1", "A1", "c1")).rejects.toThrow("DB Error");
    });
});

describe("menuItemModel.deleteMenuItemLike", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a menu item like", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.deleteMenuItemLike("1", "A1", "c1")).resolves.not.toThrow();
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.deleteMenuItemLike("1", "A1", "c1")).rejects.toThrow("DB Error");
    });
});

describe("menuItemModel.getMenuItemCuisine", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve cuisines for a menu item", async () => {
        const mockCuisines = [{ stall_id: "1", item_code: "A1", cuisine_name: "Chinese" }];
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: mockCuisines }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const cuisines = await menuItemModel.getMenuItemCuisine("1", "A1");

        expect(cuisines).toEqual(mockCuisines);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.getMenuItemCuisine("1", "A1")).rejects.toThrow("DB Error");
    });
});

describe("menuItemModel.getAllCuisines", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should retrieve all cuisines", async () => {
        const mockCuisines = [{ cuisine_name: "Chinese" }, { cuisine_name: "Malay" }];
        const mockRequest = { query: jest.fn().mockResolvedValue({ recordsets: [mockCuisines] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const cuisines = await menuItemModel.getAllCuisines();

        expect(cuisines).toEqual([mockCuisines]);
    });

    it("should handle errors", async () => {
        const mockRequest = { query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.getAllCuisines()).rejects.toThrow("DB Error");
    });
});

describe("menuItemModel.createCuisine", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a new cuisine", async () => {
        const mockCuisine = { cuisine_name: "NewCuisine" };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [mockCuisine] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const cuisine = await menuItemModel.createCuisine("NewCuisine");

        expect(cuisine).toEqual(mockCuisine);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.createCuisine("NewCuisine")).rejects.toThrow("DB Error");
    });
});

describe("menuItemModel.createMenuItemCuisine", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create a menu item cuisine association", async () => {
        const mockResult = { stall_id: "1", item_code: "A1", cuisine_name: "Chinese" };
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({ recordset: [mockResult] }) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        const result = await menuItemModel.createMenuItemCuisine("1", "A1", "Chinese");

        expect(result).toEqual(mockResult);
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.createMenuItemCuisine("1", "A1", "Chinese")).rejects.toThrow("DB Error");
    });
});

describe("menuItemModel.deleteMenuItemCuisine", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a menu item cuisine association", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockResolvedValue({}) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.deleteMenuItemCuisine("1", "A1", "Chinese")).resolves.not.toThrow();
    });

    it("should handle errors", async () => {
        const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn().mockRejectedValue(new Error("DB Error")) };
        const mockPool = await poolPromise;
        mockPool.request.mockReturnValue(mockRequest);

        await expect(menuItemModel.deleteMenuItemCuisine("1", "A1", "Chinese")).rejects.toThrow("DB Error");
    });
});
