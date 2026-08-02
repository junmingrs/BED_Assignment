const NAV_ITEMS = {
    customer: [
        { name: "Home", href: "/customer/", align: "left" },
        {
            name: "Browse",
            href: "/customer/hawkers.html",
            align: "left",
            activePages: [
                "/customer/hawkers",
                "/customer/hawker",
                "/customer/stall",
            ],
        },
        { name: "Complaint", href: "/customer/complaint.html", align: "left" },
        {
            name: "Order History",
            href: "/customer/order-history.html",
            align: "left",
        },
        { name: "Cart", href: "/customer/cart.html", align: "right" },
        {
            name: "Profile",
            href: "/customer/profile.html",
            align: "right",
        },
    ],
    operator: [
        { name: "Home", href: "/operator/", align: "left" },
        { name: "Profile", href: "/operator/profile.html", align: "right" },
    ],
    vendor: [
        { name: "Home", href: "/vendor/", align: "left" },
        { name: "Orders", href: "/vendor/orders.html", align: "left" },
        { name: "Analytics", href: "/vendor/analytics.html", align: "left" },
        { name: "Calendar", href: "/vendor/calendar.html", align: "left" },
        { name: "Menu", href: "/vendor/menuitem.html", align: "right" },
        { name: "Stall", href: "/vendor/stall.html", align: "right" },
    ],
    nea: [
        { name: "Inspections", href: "/nea/inspections.html", align: "left" },
        { name: "Hawker Centres", href: "/nea/hawkers.html", align: "left" },
        { name: "Complaints", href: "/nea/complaints.html", align: "left" },
        { name: "Profile", href: "/nea/profile.html", align: "right" },
    ],
};

function isItemActive(item, currentPath) {
    if (currentPath == item.href) return true;

    if (
        item.activePages &&
        item.activePages.some((pattern) => currentPath.startsWith(pattern))
    ) {
        return true;
    }

    return false;
}

function renderNavLinks(items, currentPath) {
    const t = window.i18n ? window.i18n.t : (key) => key;

    return items
        .map((item) => {
            const isActive = isItemActive(item, currentPath);

            const activeClasses = "text-slate-800 font-bold";
            const inactiveClasses =
                "text-slate-900 hover:text-slate-700 transition-colors";

            return `
            <a href="${item.href}" 
               data-i18n="${item.name}"
               class="py-1.5 text-xl rounded-md transition-colors ${isActive ? activeClasses : inactiveClasses}">
                ${t(item.name)}
            </a>
        `;
        })
        .join("");
}

function renderLanguageToggle() {
    const currentLang = window.i18n ? window.i18n.getCurrentLanguage() : "en";

    const activeClasses = "bg-black text-white border-black";
    const inactiveClasses =
        "border-gray-300 hover:bg-gray-100 text-gray-700";

    return `
        <div class="flex gap-1 ml-4">
            <button onclick="window.i18n.setLanguage('en'); updateLanguageToggle();"
                data-lang="en"
                class="lang-btn px-3 py-1 text-sm font-medium rounded border transition ${currentLang === "en" ? activeClasses : inactiveClasses}">
                EN
            </button>
            <button onclick="window.i18n.setLanguage('zh'); updateLanguageToggle();"
                data-lang="zh"
                class="lang-btn px-3 py-1 text-sm font-medium rounded border transition ${currentLang === "zh" ? activeClasses : inactiveClasses}">
                中文
            </button>
        </div>
    `;
}

function updateLanguageToggle() {
    const currentLang = window.i18n ? window.i18n.getCurrentLanguage() : "en";
    const activeClasses = ["bg-black", "text-white", "border-black"];
    const inactiveClasses = ["border-gray-300", "hover:bg-gray-100", "text-gray-700"];

    document.querySelectorAll(".lang-btn").forEach((btn) => {
        const isActive = btn.dataset.lang == currentLang;
        btn.classList.remove(...activeClasses, ...inactiveClasses);
        btn.classList.add(...(isActive ? activeClasses : inactiveClasses));
    });
}


function loadNavbar() {
    const currentPath = window.location.pathname;

    const role = currentPath.split("/")[1];
    const navItems = NAV_ITEMS[role];

    if (!navItems) return;

    const leftItems = navItems.filter((item) => item.align == "left");
    const rightItems = navItems.filter((item) => item.align == "right");

    const header = document.createElement("header");

    const showLanguageToggle = role === "customer";

    header.innerHTML = `
        <nav class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-7">
                ${renderNavLinks(leftItems, currentPath)}
            </div>

            <div class="flex items-center justify-content gap-3">
                <div class="flex items-center gap-7">
                    ${renderNavLinks(rightItems, currentPath)}
                </div>
                ${showLanguageToggle ? renderLanguageToggle() : ""}
            </div>
        </nav>
    `;

    document.body.prepend(header);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadNavbar);
} else {
    loadNavbar();
}
