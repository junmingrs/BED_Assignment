const {
    getComplaints,
    submitComplaint,
    deleteComplaint,
} = require("../controller/complaintController");
const complaintModel = require("../model/complaintModel");
const { getCustomerByAccountId } = require("../model/customerModel");
const { broadcast } = require("../ws");

jest.mock("../model/complaintModel");
jest.mock("../model/customerModel");
jest.mock("../ws", () => ({
    broadcast: jest.fn(),
}));

const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn(),
};

jest.mock("mssql", () => ({
    ConnectionPool: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue({
            request: () => mockRequest,
        }),
    })),
}));

describe("complaintController Unit Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest.input.mockReturnThis();

        req = {
            params: {},
            query: {},
            body: {},
            user: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.spyOn(console, "log").mockImplementation(() => { });
        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    describe("getComplaints", () => {
        test("should return complaints for a stall successfully", async () => {
            const mockComplaints = [
                { complaint_id: "c1", subject: "Hair found", status: "Open" },
                {
                    complaint_id: "c2",
                    subject: "Overcharged",
                    status: "Resolved",
                },
            ];
            complaintModel.getComplaintsByStallId.mockResolvedValue(
                mockComplaints,
            );
            req.params.stallId = "stall_A";
            req.query.timeframe = "this_week";

            await getComplaints(req, res);

            expect(complaintModel.getComplaintsByStallId).toHaveBeenCalledWith(
                "stall_A",
                "this_week",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockComplaints);
        });

        test("should call getComplaintsByStallId with null timeframe when not provided", async () => {
            complaintModel.getComplaintsByStallId.mockResolvedValue([]);
            req.params.stallId = "stall_A";
            req.query.timeframe = undefined;

            await getComplaints(req, res);

            expect(complaintModel.getComplaintsByStallId).toHaveBeenCalledWith(
                "stall_A",
                null,
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("should return 500 when model throws error", async () => {
            complaintModel.getComplaintsByStallId.mockRejectedValue(
                new Error("Database connection error"),
            );
            req.params.stallId = "stall_A";

            await getComplaints(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Database connection error",
            });
        });
    });

    describe("submitComplaint", () => {
        const mockCustomer = { customer_id: "cust_1", account_id: "acc_1" };
        const mockCreatedComplaint = {
            complaint_id: "new_comp",
            stall_id: "stall_A",
            customer_id: "cust_1",
            subject: "Bad service",
            description: "Rude staff",
        };

        beforeEach(() => {
            req.params.stallId = "stall_A";
            req.body.subject = "Bad service";
            req.body.description = "Rude staff";
            req.user = { id: "acc_1" };

            mockRequest.query.mockResolvedValue({
                recordset: [{ stall_id: "stall_A" }],
            });

            getCustomerByAccountId.mockResolvedValue(mockCustomer);
            complaintModel.createComplaint.mockResolvedValue(
                mockCreatedComplaint,
            );
        });

        test("should submit complaint successfully and broadcast", async () => {
            await submitComplaint(req, res);

            expect(getCustomerByAccountId).toHaveBeenCalledWith("acc_1");
            expect(complaintModel.createComplaint).toHaveBeenCalledWith(
                "stall_A",
                "cust_1",
                "Bad service",
                "Rude staff",
            );
            expect(broadcast).toHaveBeenCalledWith({
                type: "newComplaint",
                customerId: "cust_1",
                stallId: "stall_A",
                subject: "Bad service",
                description: "Rude staff",
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockCreatedComplaint);
        });

        test("should return 400 if subject is missing", async () => {
            req.body.subject = undefined;

            await submitComplaint(req, res);

            expect(complaintModel.createComplaint).not.toHaveBeenCalled();
            expect(broadcast).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Missing required fields: subject, description",
            });
        });

        test("should return 400 if description is missing", async () => {
            req.body.description = undefined;

            await submitComplaint(req, res);

            expect(complaintModel.createComplaint).not.toHaveBeenCalled();
            expect(broadcast).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Missing required fields: subject, description",
            });
        });

        test("should return 404 if stall does not exist", async () => {
            mockRequest.query.mockResolvedValueOnce({ recordset: [] });

            await submitComplaint(req, res);

            expect(getCustomerByAccountId).not.toHaveBeenCalled();
            expect(complaintModel.createComplaint).not.toHaveBeenCalled();
            expect(broadcast).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Stall not found" });
        });

        test("should return 404 if customer profile not found", async () => {
            getCustomerByAccountId.mockResolvedValue(null);

            await submitComplaint(req, res);

            expect(complaintModel.createComplaint).not.toHaveBeenCalled();
            expect(broadcast).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: "Customer profile not found",
            });
        });

        test("should return 500 if createComplaint throws error", async () => {
            complaintModel.createComplaint.mockRejectedValue(
                new Error("Database error"),
            );

            await submitComplaint(req, res);

            expect(broadcast).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Database error",
            });
        });
    });

    describe("deleteComplaint", () => {
        beforeEach(() => {
            req.params.complaintId = "comp_123";
            req.user.id = "cust_1";
        });

        test("should delete complaint successfully", async () => {
            complaintModel.deleteComplaint.mockResolvedValue({
                message: "Complaint deleted successfully",
            });

            await deleteComplaint(req, res);

            expect(complaintModel.deleteComplaint).toHaveBeenCalledWith(
                "comp_123",
                "cust_1",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Complaint deleted successfully",
            });
        });

        test("should return 500 if deleteComplaint throws error", async () => {
            complaintModel.deleteComplaint.mockRejectedValue(
                new Error("Not authorized"),
            );

            await deleteComplaint(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Not authorized",
            });
        });
    });
});
