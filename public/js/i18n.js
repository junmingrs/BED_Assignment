// 翻译词典
const translations = {
    en: {
        // nav
        Home: 'Home',
        Browse: 'Browse',
        Complaint: 'Complaint',
        'Order History': 'Order History',
        Cart: 'Cart',
        Profile: 'Profile',
        'Hawker Centres': 'Hawker Centres',
        Orders: 'Orders',
        Analytics: 'Analytics',
        Menu: 'Menu',
        Stall: 'Stall',
        Inspections: 'Inspections',
        Complaints: 'Complaints',
        // 通用 
        total_label: 'Total',
        enjoy_your_meal: 'Enjoy your meal!',
        cancel: 'Cancel',
        submit: 'Submit',
        loading: 'Loading...',

        // payment-success.html
        payment_successful: 'Payment Successful!',
        thank_you: 'Thank you for your order.',
        order_summary: 'Order Summary',
        order_id: 'Order ID',
        receipt_sent: 'A receipt has been sent to your email.',
        back_to_home: 'Back to Home',

        // ===== cart.html =====
        cart_title: 'Cart',
        promo_code_title: 'Promo Code',
        promo_code_placeholder: 'Enter Promo Code',
        promo_enter_btn: 'Enter',
        payment_method_title: 'Payment Method',
        payment_method_desc: 'Select your preferred payment method.',
        payment_card: 'Credit / Debit Card',
        payment_card_desc: 'Visa, Mastercard, American Express',
        payment_paynow: 'PayNow',
        payment_paynow_desc: 'Pay instantly using your banking app.',
        payment_cash: 'Cash',
        payment_cash_desc: 'Pay at the stall upon collection.',
        checkout_success_btn: 'Checkout',
        checkout_fail_btn: 'Checkout (fail)',
        cart_empty: 'No items added in cart',
        checkout_empty_error: 'Cannot checkout if there are no items in the cart.',
        eco_packaging_label: 'Eco-friendly Packaging',
        promo_enter_error: 'Please enter a promo code',
        promo_verify_error: 'Unable to verify promo code. Try again.',
        promo_invalid: 'is not a valid promo code',
        promo_already_applied: 'is already applied',
        promo_inactive: 'is not currently active',
        promo_applied: 'applied',

        // ===== complaint.html =====
        submit_complaint: 'Submit a Complaint',
        complaint_desc: 'Submit a formal complaint about a stall\'s food quality or service.',
        select_stall: 'Select Stall',
        subject: 'Subject',
        subject_placeholder: 'e.g. Food was undercooked',
        description: 'Description',
        description_placeholder: 'Describe your issue in detail...',
        submit_btn: 'Submit Complaint',
        copyright: '© 2026 Hawker Centre',

        // hawker.html
        stalls_title: 'Stalls',
        back_to_hawkers: '← Back to all hawker centres',
        no_hawker_id_error: 'No hawker centre id provided in the URL (e.g. ?id=...)',
        failed_load_hawker: 'Failed to load hawker centre',
        no_stalls_found: 'No stalls found for this hawker centre.',
        load_error: 'Something went wrong while loading the hawker centre.',
        unit_label: 'Unit',

        // hawkers.html
        hawker_centres_title: 'Hawker Centres',
        view_stalls: 'View stalls',
        failed_load_hawker_centres: 'Failed to load hawker centres',
        no_hawker_centres: 'No hawker centres found.',
        load_hawker_error: 'Something went wrong while loading hawker centres.',

         // index.html 
        active_orders: 'Active Orders',

        // order-history.html
        order_history_title: 'Order History',
        guest_note: 'Guest orders are saved on this device only. Clearing your browser data will remove this history.',
        rate_feedback_title: 'Rate & Feedback',
        rate_feedback_desc: 'Let the stall know how it went.',
        rate_feedback_btn: 'Rate & Feedback',
        optional_comment: 'Optional comment...',
        queue_number: 'Queue Number',
        ordered_at: 'Ordered at',
        order_id_label: 'Order ID(s)',
        failed_load_orders: 'Failed to load order history',
        load_orders_error: 'Something went wrong while loading your order history.',
        no_orders: 'No past orders found.',
        no_guest_orders: 'No past orders found on this device.',
        please_select_rating: 'Please select a star rating.',
        thanks_feedback: 'Thanks for your feedback!',
        submit_failed: 'Failed to submit rating. Please try again.',

        // order status (用于状态翻译)
        pending: 'Pending',
        preparing: 'Preparing',
        ready: 'Ready',
        completed: 'Completed',
        cancelled: 'Cancelled',

        // order-status.js
        payment_unsuccessful: 'Payment Unsuccessful',
        payment_retry: 'Please try again.',
        return_checkout: 'Return to Checkout',
        your_queue_number: 'Your queue number is',

        // profile.html 
        profile_title: 'Profile',
        name_label: 'Name:',
        points_label: 'Points:',
        sign_out: 'Sign Out',

        // stall.html 
        menu_items: 'Menu Items',


        // complaint.html JS中 
        loading_stalls: 'Loading stalls...',
        no_stalls_available: 'No stalls available',
        failed_load_stalls: 'Failed to load stalls',
        fill_all_fields: 'Please fill in all fields.',
        complaint_success: '✅ Complaint submitted successfully!',
        network_error: '❌ Network error. Please try again.',
        complaint_failed: 'Submission failed',
        select_stall_first: 'Please select a stall.',

        // cart.js 
        cart_empty: 'No items added in cart',
        checkout_success_msg: 'Orders placed successfully. Food is now being prepared',
        checkout_fail_msg: 'Checkout failed. Please try again.',
        eco_friendly: 'Eco-friendly packaging',
        eco_description: 'Use paper containers and reduce plastic where possible.',
        plus_030: '+$0.30',
        delete: 'Delete',
    },
    zh: {
        // nav
        Home: '首页',
        Browse: '浏览',
        Complaint: '投诉',
        'Order History': '订单历史',
        Cart: '购物车',
        Profile: '个人资料',
        'Hawker Centres': '小贩中心',
        Orders: '订单',
        Analytics: '分析',
        Menu: '菜单',
        Stall: '摊位',
        Inspections: '检查',
        Complaints: '投诉',

        // 通用 
        total_label: '总计',
        enjoy_your_meal: '祝您用餐愉快！',
        cancel: '取消',
        submit: '提交',
        loading: '加载中...',

        // payment-success.html 
        payment_successful: '支付成功！',
        thank_you: '感谢您的订单。',
        order_summary: '订单摘要',
        order_id: '订单号',
        receipt_sent: '收据已发送至您的邮箱。',
        back_to_home: '返回首页',

        // cart.html 
        cart_title: '购物车',
        promo_code_title: '优惠码',
        promo_code_placeholder: '输入优惠码',
        promo_enter_btn: '使用',
        payment_method_title: '支付方式',
        payment_method_desc: '请选择您的支付方式。',
        payment_card: '信用卡 / 借记卡',
        payment_card_desc: 'Visa、Mastercard、American Express',
        payment_paynow: 'PayNow',
        payment_paynow_desc: '使用银行应用即时支付。',
        payment_cash: '现金',
        payment_cash_desc: '取餐时在摊位付款。',
        checkout_success_btn: '结账',
        checkout_fail_btn: '结账（失败）',
        cart_empty: '购物车中没有商品',
        checkout_empty_error: '购物车中没有商品，无法结账。',
        eco_packaging_label: '环保包装',
        promo_enter_error: '请输入优惠码',
        promo_verify_error: '无法验证优惠码，请重试。',
        promo_invalid: '不是有效的优惠码',
        promo_already_applied: '已使用过此优惠码',
        promo_inactive: '当前不在有效期内',
        promo_applied: '已使用',

        // complaint.html 
        submit_complaint: '提交投诉',
        complaint_desc: '提交关于摊位食品质量或服务的正式投诉。',
        select_stall: '选择摊位',
        subject: '主题',
        subject_placeholder: '例如：食物未煮熟',
        description: '描述',
        description_placeholder: '请详细描述您的问题...',
        submit_btn: '提交投诉',
        copyright: '© 2026 小贩中心',

        // hawker.html
        stalls_title: '摊位',
        back_to_hawkers: '← 返回所有小贩中心',
        no_hawker_id_error: 'URL 中未提供小贩中心 ID（例如 ?id=...）',
        failed_load_hawker: '加载小贩中心失败',
        no_stalls_found: '该小贩中心暂无摊位。',
        load_error: '加载小贩中心时出错。',
        unit_label: '单位',

        // hawkers.html
        hawker_centres_title: '小贩中心',
        view_stalls: '查看摊位',
        failed_load_hawker_centres: '加载小贩中心失败',
        no_hawker_centres: '没有找到小贩中心。',
        load_hawker_error: '加载小贩中心时出错。',

        // index.html 
        active_orders: '进行中的订单',

        // order-history.html
        order_history_title: '订单历史',
        guest_note: '访客订单仅保存在此设备上。清除浏览器数据将删除此历史记录。',
        rate_feedback_title: '评分与反馈',
        rate_feedback_desc: '告诉摊位您的用餐体验。',
        rate_feedback_btn: '评分与反馈',
        optional_comment: '可选评论...',
        queue_number: '排队号码',
        ordered_at: '下单时间',
        order_id_label: '订单号',
        failed_load_orders: '加载订单历史失败',
        load_orders_error: '加载订单历史时出错。',
        no_orders: '没有找到过往订单。',
        no_guest_orders: '此设备上没有找到过往订单。',
        please_select_rating: '请选择星级评分。',
        thanks_feedback: '感谢您的反馈！',
        submit_failed: '提交评分失败，请重试。',

        // order status (用于状态翻译)
        pending: '待处理',
        preparing: '准备中',
        ready: '已准备',
        completed: '已完成',
        cancelled: '已取消',

        // order-status.js
        payment_unsuccessful: '支付失败',
        payment_retry: '请重试。',
        return_checkout: '返回结账',
        your_queue_number: '您的排队号码是',

        

        // profile.html 
        profile_title: '个人资料',
        name_label: '姓名：',
        points_label: '积分：',
        sign_out: '登出',

        // stall.html
        menu_items: '菜单',

        // order-status.html (JS中)
        order_placed: '已下单',
        preparing: '准备中',
        ready: '已准备',
        completed: '已完成',
        cancelled: '已取消',
        pending: '待处理',
        order_status_title: '订单状态',
        your_order_is: '您的订单状态为',
        thank_you_order: '感谢您的订单！',
        your_food_is_being_prepared: '您的食物正在准备中。',
        your_food_is_ready: '您的食物已准备好取餐！',
        order_completed: '订单已完成。祝您用餐愉快！',
        order_cancelled: '订单已取消。',

        // complaint.html JS中
        loading_stalls: '加载摊位中...',
        no_stalls_available: '没有可用摊位',
        failed_load_stalls: '加载摊位失败',
        fill_all_fields: '请填写所有字段。',
        complaint_success: '✅ 投诉提交成功！',
        network_error: '❌ 网络错误，请重试。',
        complaint_failed: '提交失败',
        select_stall_first: '请选择摊位。',

        // cart.js 中 
        cart_empty: '购物车中没有商品',
        checkout_success_msg: '订单已成功提交，食物正在准备中',
        checkout_fail_msg: '结账失败，请重试。',
        eco_friendly: '环保包装',
        eco_description: '使用纸制容器，尽可能减少塑料使用。',
        plus_030: '+$0.30',
        delete: '删除',
    }
};

// 当前语言 
let currentLanguage = localStorage.getItem('appLanguage') || 'en';

// 切换语言 
function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);
    translatePage();
}

// 翻译整个页面
function translatePage() {
    const dict = translations[currentLanguage];
    if (!dict) return;

    // 处理 data-i18n（文本内容）
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined) {
            el.textContent = dict[key];
        }
    });

    // 处理 data-i18n-placeholder（输入框占位符）
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key] !== undefined) {
            el.placeholder = dict[key];
        }
    });

    // 更新 HTML lang 属性
    document.documentElement.lang = currentLanguage;

    // 触发自定义事件，通知其他 JS 文件语言已更改
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: currentLanguage } }));
}

// 获取当前语言 
function getCurrentLanguage() {
    return currentLanguage;
}

// 获取翻译 
function t(key) {
    const dict = translations[currentLanguage];
    return dict && dict[key] !== undefined ? dict[key] : key;
}

// 初始化 i18n
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
