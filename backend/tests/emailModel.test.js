const { sendReceipt } = require("../model/emailModel");

// Mock Resend 库 
jest.mock("resend", () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: {
            send: jest.fn(),
        },
    })),
}));

beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
});

describe("emailModel Unit Tests", () => {
    // 每次测试前reset mock
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // test data for order
    const mockOrderData = {
        order_id: "TEST-12345-67890",
        items: [
            { name: "Kimchi Fried Rice", quantity: 2, price: 7.50 },
            { name: "Korean Iced Tea", quantity: 1, price: 2.00 },
        ],
        total: 17.00,
    };

    const mockToEmail = "customer@example.com";

    const getMockResend = () => {
        const { Resend } = require("resend");
        return new Resend();
    };

    // test 1: 成功发送邮件 
    test("should send email successfully and return true", async () => {
        const mockResend = getMockResend();
        mockResend.emails.send.mockResolvedValue({
            data: { id: "email-123" },
            error: null,
        });

        const result = await sendReceipt(mockToEmail, mockOrderData);

        expect(result).toBe(true);
        expect(mockResend.emails.send).toHaveBeenCalledTimes(1);
        expect(mockResend.emails.send).toHaveBeenCalledWith({
            from: expect.any(String),
            to: [mockToEmail],
            subject: expect.stringContaining("Your Order Receipt - #TEST-123"),
            html: expect.any(String),
        });
        expect(console.log).toHaveBeenCalledWith(
            "✅ Receipt sent to:",
            mockToEmail
        );
    });

    // test 2: Resend 返回错误时返回 false
    test("should return false when Resend returns an error", async () => {
        const mockResend = getMockResend();
        mockResend.emails.send.mockResolvedValue({
            data: null,
            error: { message: "Invalid email address" },
        });

        const result = await sendReceipt(mockToEmail, mockOrderData);

        expect(result).toBe(false);
        expect(mockResend.emails.send).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalled();
    });

    // test 3: Resend 抛出异常时返回 false 
    test("should return false when Resend throws an exception", async () => {
        const mockResend = getMockResend();
        mockResend.emails.send.mockRejectedValue(
            new Error("Network connection failed")
        );

        const result = await sendReceipt(mockToEmail, mockOrderData);

        expect(result).toBe(false);
        expect(mockResend.emails.send).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(
            "❌ Error sending email:",
            expect.any(Error)
        );
    });

    // test 4: 正确生成 HTML 内容 
    test("should generate correct HTML content with order data", async () => {
        let capturedHtml = "";
        const mockResend = getMockResend();
        mockResend.emails.send.mockImplementation((options) => {
            capturedHtml = options.html;
            return Promise.resolve({ data: { id: "email-123" }, error: null });
        });

        await sendReceipt(mockToEmail, mockOrderData);

        // 验证 HTML 包含order info
        expect(capturedHtml).toContain("✅ Payment Successful!");
        expect(capturedHtml).toContain("Thank you for your order");
        expect(capturedHtml).toContain("Kimchi Fried Rice");
        expect(capturedHtml).toContain("Korean Iced Tea");
        expect(capturedHtml).toContain("2");
        expect(capturedHtml).toContain("1");
        expect(capturedHtml).toContain("$7.50");
        expect(capturedHtml).toContain("$2.00");
        expect(capturedHtml).toContain("$17.00");
        expect(capturedHtml).toContain("TEST-12345-67890");
        expect(capturedHtml).toContain("This is an automated receipt");
    });

    // test 5: 处理空订单数据
    test("should handle empty order data gracefully", async () => {
        let capturedHtml = "";
        const mockResend = getMockResend();
        mockResend.emails.send.mockImplementation((options) => {
            capturedHtml = options.html;
            return Promise.resolve({ data: { id: "email-123" }, error: null });
        });

        const emptyOrder = {
            order_id: "EMPTY-001",
            items: [],
            total: 0,
        };

        const result = await sendReceipt(mockToEmail, emptyOrder);

        expect(result).toBe(true);
        expect(capturedHtml).toContain("Order Summary");
        expect(capturedHtml).toContain("$0.00");
        expect(capturedHtml).not.toContain("×");
    });

    // test 6: 处理缺失字段
    test("should handle missing optional fields gracefully", async () => {
        let capturedHtml = "";
        const mockResend = getMockResend();
        mockResend.emails.send.mockImplementation((options) => {
            capturedHtml = options.html;
            return Promise.resolve({ data: { id: "email-123" }, error: null });
        });

        const minimalOrder = {
            order_id: "MINIMAL-001",
            items: [{ name: "Item", quantity: 1, price: 5.0 }],
            // total 字段缺失
        };

        // 如果 total 缺失，可能显示 undefined，所以测试时要考虑
        const result = await sendReceipt(mockToEmail, minimalOrder);

        expect(result).toBe(true);
        expect(capturedHtml).toContain("Item");
        expect(capturedHtml).toContain("1");
        expect(capturedHtml).toContain("$5.00");
    });

    // test 7: 验证 from 地址使用环境变量或默认值
    test("should use EMAIL_FROM env or default onboarding address", async () => {
        const mockResend = getMockResend();
        let usedFrom = "";
        mockResend.emails.send.mockImplementation((options) => {
            usedFrom = options.from;
            return Promise.resolve({ data: { id: "email-123" }, error: null });
        });

        const originalEmailFrom = process.env.EMAIL_FROM;
        delete process.env.EMAIL_FROM;

        await sendReceipt(mockToEmail, mockOrderData);

        expect(usedFrom).toBe("onboarding@resend.dev");

        process.env.EMAIL_FROM = originalEmailFrom;
    });
});