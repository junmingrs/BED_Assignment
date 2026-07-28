const NAV_ITEMS = {
    customer: [
        { name: "Home", href: "/customer/", align: "left" },
        {
            name: "Browse",
            href: "/customer/hawkers.html",
            align: "left",
            activePages: ["/customer/hawkers", "/customer/hawker", "/customer/stall"],
        },
        { name: "Complaint", href: "/customer/complaint.html", align: "left" },
        { name: "Cart", href: "/customer/cart.html", align: "right" },
        {
            name: "Profile",
            href: "/customer/profile.html",
            align: "right",
        },
    ],
    operator: [
        { name: "Home", href: "/operator/", align: "left" },
        { name: "Hawker Centres", href: "/operator/hawkers.html", align: "left" },
    ],
    vendor: [
        { name: "Home", href: "/vendor/", align: "left" },
        { name: "Orders", href: "/vendor/orders.html", align: "left" },
        { name: "Analytics", href: "/vendor/analytics.html", align: "left" },
        { name: "Menu", href: "/vendor/menuitem.html", align: "right" },
        { name: "Stall", href: "/vendor/stall.html", align: "right" },
    ],
    nea: [
        { name: "Inspections", href: "/nea/inspections.html", align: "left" },
        { name: "Hawker Centres", href: "/nea/hawkers.html", align: "left" },
        { name: "Complaints", href: "/nea/complaints.html", align: "left" },
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
    return items
        .map((item) => {
            const isActive = isItemActive(item, currentPath);

            const activeClasses = "text-slate-800 font-bold";
            const inactiveClasses =
                "text-slate-900 hover:text-slate-700 transition-colors";

            return `
            <a href="${item.href}" 
               class="py-1.5 text-xl rounded-md transition-colors ${isActive ? activeClasses : inactiveClasses}">
                ${item.name}
            </a>
        `;
        })
        .join("");
}

function loadNavbar() {
    const currentPath = window.location.pathname;

    const role = currentPath.split("/")[1];
    const navItems = NAV_ITEMS[role];

    const leftItems = navItems.filter((item) => item.align == "left");
    const rightItems = navItems.filter((item) => item.align == "right");

    // FIX: FIX THE CSS
    const header = document.createElement("header");

    header.innerHTML = `
        <nav class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-7">
                ${renderNavLinks(leftItems, currentPath)}
            </div>

            <div class="flex items-center justify-content gap-3">
                <div class="flex items-center gap-7">
                    ${renderNavLinks(rightItems, currentPath)}
                </div>
                <!-- language toggle -->
                <div class="flex gap-1 ml-4">
                    <button onclick="window.i18n.setLanguage('en')"
                        class="px-3 py-1 text-sm font-medium rounded border border-gray-300 hover:bg-gray-100 transition">
                        EN
                    </button>
                    <button onclick="window.i18n.setLanguage('zh')"
                        class="px-3 py-1 text-sm font-medium rounded border border-gray-300 hover:bg-gray-100 transition">
                        中文
                    </button>
                </div>
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
