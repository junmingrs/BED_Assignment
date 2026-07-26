// public/js/i18n.js

// ===== 翻译词典 =====
const translations = {
    en: {
        // 导航
        nav_home: 'Home',
        nav_browse: 'Browse',
        nav_cart: 'Cart',
        nav_profile: 'Profile',

        // 通用
        total: 'Total',
        checkout: 'Checkout',
        checkout_fail: 'Checkout (failure)',
        payment_successful: 'Payment Successful!',
        thank_you: 'Thank you for your order.',
        order_summary: 'Order Summary',
        order_id: 'Order ID',
        receipt_sent: 'A receipt has been sent to your email.',
        back_to_home: 'Back to Home',
        view_orders: 'View Orders',
        no_items: 'No items added in cart',
        enjoy_your_meal: 'Enjoy your meal!',
        eco_friendly: 'Eco-friendly packaging',
        eco_description: 'Use paper containers and reduce plastic where possible.',
        plus_030: '+$0.30',
        total_label: 'Total',

        // 支付方式
        payment_method: 'Payment Method',
        payment_select: 'Select your preferred payment method.',
        credit_card: 'Credit / Debit Card',
        credit_desc: 'Visa, Mastercard, American Express',
        paynow: 'PayNow',
        paynow_desc: 'Pay instantly using your banking app.',
        cash: 'Cash',
        cash_desc: 'Pay at the stall upon collection.',

        // 商品分类
        drinks: 'Drinks',
        dessert: 'Dessert',
        main: 'Main',
        sides: 'Sides',

        // 按钮
        delete: 'Delete',
    },
    zh: {
        // 导航
        nav_home: '首页',
        nav_browse: '浏览',
        nav_cart: '购物车',
        nav_profile: '个人资料',

        // 通用
        total: '总计',
        checkout: '结账',
        checkout_fail: '结账 (失败)',
        payment_successful: '支付成功！',
        thank_you: '感谢您的订单。',
        order_summary: '订单摘要',
        order_id: '订单号',
        receipt_sent: '收据已发送至您的邮箱。',
        back_to_home: '返回首页',
        view_orders: '查看订单',
        no_items: '购物车中没有商品',
        enjoy_your_meal: '祝您用餐愉快！',
        eco_friendly: '环保包装',
        eco_description: '使用纸制容器，尽可能减少塑料使用。',
        plus_030: '+$0.30',
        total_label: '总计',

        // 支付方式
        payment_method: '支付方式',
        payment_select: '请选择您的支付方式。',
        credit_card: '信用卡 / 借记卡',
        credit_desc: 'Visa、Mastercard、American Express',
        paynow: 'PayNow',
        paynow_desc: '使用银行应用即时支付。',
        cash: '现金',
        cash_desc: '取餐时在摊位付款。',

        // 商品分类
        drinks: '饮料',
        dessert: '甜点',
        main: '主菜',
        sides: '配菜',

        // 按钮
        delete: '删除',
    }
};

// ===== 当前语言 =====
let currentLanguage = localStorage.getItem('appLanguage') || 'en';

// ===== 切换语言 =====
function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);
    translatePage();
}

// ===== 翻译整个页面 =====
function translatePage() {
    const dict = translations[currentLanguage];
    if (!dict) return;

    // 遍历所有带 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined) {
            el.textContent = dict[key];
        }
    });

    // 更新 HTML lang 属性
    document.documentElement.lang = currentLanguage;

    // 触发自定义事件，通知其他 JS 文件语言已更改
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: currentLanguage } }));
}

// ===== 获取当前语言 =====
function getCurrentLanguage() {
    return currentLanguage;
}

// ===== 获取翻译 =====
function t(key) {
    const dict = translations[currentLanguage];
    return dict && dict[key] !== undefined ? dict[key] : key;
}

// ===== 初始化 =====
function initI18n() {
    translatePage();
}

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
} else {
    initI18n();
}

// 导出给其他 JS 使用
window.i18n = {
    setLanguage,
    getCurrentLanguage,
    t,
    translatePage
};