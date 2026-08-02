const {
    getComplaintsByStallId,
    createComplaint,
    deleteComplaint,
} = require("../model/complaintModel");
const { getTimeFilter } = require("../helper");

// Mock dependencies 
jest.mock("../helper", () => ({
    getTimeFilter: jest.fn(),
}));

const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(),
};

// Mock mssql 
jest.mock("mssql", () => ({
    ConnectionPool: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue({
            request: () => mockRequest,
        }),
    })),
}));

// Mock console.error 
beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
    console.error.mockRestore();
});

describe("complaintModel Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest.input.mockReturnThis();
        mockRequest.query.mockReset();
    });

    // 测试 getComplaintsByStallId
    describe("getComplaintsByStallId", () => {
        test("should return complaints for a stall successfully", async () => {
            const stallId = "stall_A";
            const mockComplaints = [
                {
                    complaint_id: "comp_1",
                    subject: "Hair found in food",
                    description: "I found a hair in my food",
                    status: "Investigating",
                    created_at: "2026-07-02T18:35:00.000Z",
                },
                {
                    complaint_id: "comp_2",
                    subject: "Overcharged",
                    description: "I was charged too much",
                    status: "Open",
                    created_at: "2026-07-01T14:10:00.000Z",
                },
            ];

            getTimeFilter.mockReturnValue("AND created_at >= '2026-07-01'");
            mockRequest.query.mockResolvedValue({ recordset: mockComplaints });

            const result = await getComplaintsByStallId(stallId, "this_week");

            expect(getTimeFilter).toHaveBeenCalledWith("this_week", "created_at");
            expect(mockRequest.input).toHaveBeenCalledWith("stallId", stallId);
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockComplaints);
        });

        test("should use empty timeFilter when timeframe is null", async () => {
            const stallId = "stall_A";
            const mockComplaints = [
                { complaint_id: "comp_1", subject: "Test", status: "Open" },
            ];

            getTimeFilter.mockReturnValue("");
            mockRequest.query.mockResolvedValue({ recordset: mockComplaints });

            const result = await getComplaintsByStallId(stallId, null);

            expect(getTimeFilter).toHaveBeenCalledWith(null, "created_at");
            expect(mockRequest.input).toHaveBeenCalledWith("stallId", stallId);
            expect(result).toEqual(mockComplaints);
        });

        test("should return empty array when no complaints found", async () => {
            const stallId = "stall_A";
            getTimeFilter.mockReturnValue("");
            mockRequest.query.mockResolvedValue({ recordset: [] });

            const result = await getComplaintsByStallId(stallId);

            expect(result).toEqual([]);
        });

        test("should throw error when database query fails", async () => {
            const stallId = "stall_A";
            getTimeFilter.mockReturnValue("");
            mockRequest.query.mockRejectedValue(new Error("Database connection error"));

            await expect(getComplaintsByStallId(stallId)).rejects.toThrow(
                "Database connection error",
            );
        });
    });

    // 测试 createComplaint
    describe("createComplaint", () => {
        const stallId = "stall_A";
        const customerId = "cust_1";
        const subject = "Bad service";
        const description = "The staff was rude";

        const mockNewComplaint = {
            complaint_id: "new_comp_123",
            stall_id: stallId,
            customer_id: customerId,
            subject: subject,
            description: description,
            status: "Open",
            created_at: "2026-08-02T10:00:00.000Z",
        };

        test("should create a complaint successfully and return the new record", async () => {
            mockRequest.query
                .mockResolvedValueOnce({ rowsAffected: [1] }) 
                .mockResolvedValueOnce({ recordset: [mockNewComplaint] }); 

            const result = await createComplaint(
                stallId,
                customerId,
                subject,
                description,
            );

            // 验证 INSERT
            expect(mockRequest.input).toHaveBeenCalledWith("stallId", stallId);
            expect(mockRequest.input).toHaveBeenCalledWith("customerId", customerId);
            expect(mockRequest.input).toHaveBeenCalledWith("subject", subject);
            expect(mockRequest.input).toHaveBeenCalledWith("description", description);
            expect(mockRequest.query).toHaveBeenCalledTimes(2);

            // 返回
            expect(result).toEqual(mockNewComplaint);
        });

        test("should set status to 'Open' by default", async () => {
            mockRequest.query
                .mockResolvedValueOnce({ rowsAffected: [1] })
                .mockResolvedValueOnce({
                    recordset: [{ ...mockNewComplaint, status: "Open" }],
                });

            const result = await createComplaint(
                stallId,
                customerId,
                subject,
                description,
            );

            expect(result.status).toBe("Open");
        });

        test("should throw error when database insert fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Foreign key constraint failed"),
            );

            await expect(
                createComplaint(stallId, customerId, subject, description),
            ).rejects.toThrow("Foreign key constraint failed");
        });
    });

    // 测试 deleteComplaint
    describe("deleteComplaint", () => {
        const complaintId = "comp_123";
        const customerId = "cust_1";

        test("should delete a complaint successfully", async () => {
            // 检查记录是否存在
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{ complaint_id: complaintId }],
                })
                .mockResolvedValueOnce({ rowsAffected: [1] }); 

            const result = await deleteComplaint(complaintId, customerId);

            // 验证检查查询
            expect(mockRequest.input).toHaveBeenCalledWith("complaintId", complaintId);
            expect(mockRequest.input).toHaveBeenCalledWith("customerId", customerId);
            expect(mockRequest.query).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ message: "Complaint deleted successfully" });
        });

        test("should throw error if complaint not found", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await expect(deleteComplaint(complaintId, customerId)).rejects.toThrow(
                "Complaint not found or you are not authorized to delete it",
            );

            // 验证 DELETE 没有被调用
            expect(mockRequest.query).toHaveBeenCalledTimes(1);
        });

        test("should throw error if complaint belongs to another customer", async () => {
            // 返回记录但 customer_id 不匹配（但检查查询会过滤 customer_id）
            // 所以如果 customer_id 不匹配，recordset 应该为空
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await expect(deleteComplaint(complaintId, "wrong_customer")).rejects.toThrow(
                "Complaint not found or you are not authorized to delete it",
            );
        });

        test("should throw error when database query fails", async () => {
            mockRequest.query.mockRejectedValueOnce(
                new Error("Database connection error"),
            );

            await expect(deleteComplaint(complaintId, customerId)).rejects.toThrow(
                "Database connection error",
            );
        });
    });
});