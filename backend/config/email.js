const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendPromotion = async (toEmail, promotionData) => {
    try {
        const mailOptions = {
            from: `Hawker Centre <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `New Promotion - ${promotionData.stallName}'s ${promotionData.itemName} ${promotionData.discount}% OFF using ${promotionData.promoCode}`,
            html: generateHtmlContent(promotionData)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (e) {
        console.error('Error sending email:', e, toEmail);
    }
}

const generateHtmlContent = (data) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Special Promotion - ${data.stallName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 font-sans">
    <div class="max-w-[600px] mx-auto my-0 bg-white shadow-lg rounded-lg overflow-hidden">

        <!-- Header -->
        <div class="bg-gradient-to-r from-red-500 to-pink-500 text-white text-center py-8 px-5">
            <h1 class="text-3xl font-bold m-0">🎉 Special Promotion!</h1>
            <div class="inline-block bg-yellow-400 text-red-600 text-4xl font-black px-5 py-3 rounded-full mt-4">
                ${data.discount}% OFF
            </div>
        </div>

        <!-- Main Content -->
        <div class="p-8">
            <h2 class="text-xl text-gray-800 m-0 mb-3">Hi there! 👋</h2>
            <p class="text-gray-600 leading-relaxed m-0 mb-6">
                Great news! <strong class="text-gray-800">${data.stallName}</strong> is running a special promotion just for you!
            </p>

            <!-- Item Name -->
            <div class="text-2xl font-bold text-gray-800 my-4">
                🍜 ${data.itemName}
            </div>

            <!-- Stall Info -->
            <div class="flex flex-col bg-gray-50 p-4 border-l-4 border-red-500 my-5">
                <strong class="text-gray-800 block mb-2">🏪 Where to Find Us</strong>
                <div>
                    <span class="text-gray-700 block"><strong>Stall:</strong> ${data.stallName}</span>
                </div>
                <div>
                    ${data.hawkerCentre ? `<span class="text-gray-700 block"><strong>Location:</strong> ${data.hawkerCentre}</span>` : ''}
                </div>
            </div>

            <!-- Promo Code Box -->
            <div class="bg-yellow-50 border-2 border-dashed border-yellow-400 p-6 text-center my-6 rounded-lg">
                <div class="text-sm text-gray-600 mb-2">YOUR PROMO CODE</div>
                <div class="text-3xl font-black text-red-600 tracking-widest font-mono">
                    ${data.promoCode}
                </div>
                ${data.endDate
            ? `<div class="text-red-600 font-bold mt-2">Valid until: ${data.endDate}</div>`
            : `<div class="text-red-600 font-bold mt-2">⏰ Limited time only!</div>`
        }
            </div>

            <p class="text-gray-600 leading-relaxed m-0 mb-6">
                Hurry, this offer won't last long! Visit us soon and treat yourself to some amazing ${data.itemName}.
            </p>

        </div>

        <!-- Footer -->
        <div class="bg-gray-50 p-5 text-center text-xs text-gray-600">
            <p class="m-0 mb-2">See you at the hawker centre! 🍴</p>
            <p class="m-0 mb-3">
                <strong class="text-gray-800">${data.stallName}</strong><br>
                Hawker Centre Team
            </p>
            <p class="text-[10px] text-gray-400 m-0">
                You received this email because you're a valued customer.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
};

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

module.exports = { sendPromotion, sendReceipt };
