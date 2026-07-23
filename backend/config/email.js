const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendReceipt = async (toEmail, orderData) => {
    try {
        const mailOptions = {
            from: `Hawker Centre <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `Your Order Receipt - #${orderData.order_id.substring(0, 8)}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h1 style="color: #28a745; text-align: center;">✅ Payment Successful!</h1>
                    <p style="text-align: center; font-size: 18px;">Thank you for your order!</p>
                    
                    <hr style="border: 1px solid #eee;">
                    
                    <h2 style="color: #333;">Order Summary</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa; text-align: left;">
                                <th style="padding: 8px;">Item</th>
                                <th style="padding: 8px;">Qty</th>
                                <th style="padding: 8px;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderData.items.map(item => `
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #eee;">$${item.price.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="text-align: right; margin-top: 20px; font-size: 18px;">
                        <strong>Total: $${orderData.total.toFixed(2)}</strong>
                    </div>
                    
                    <hr style="border: 1px solid #eee; margin-top: 20px;">
                    
                    <p style="color: #666; font-size: 14px;">
                        <strong>Order ID:</strong> ${orderData.order_id}<br>
                        <strong>Date:</strong> ${new Date().toLocaleString()}
                    </p>
                    
                    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                        This is an automated receipt. Please keep it for your records.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Receipt sent to:', toEmail);
        console.log('📧 Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
};

module.exports = { sendReceipt };