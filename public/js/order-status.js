import { statusStyle } from "./helper.js";

// get翻译function
const t = window.i18n ? window.i18n.t : (key) => key;

const params = new URLSearchParams(window.location.search);
const success = params.get("success") === "true";
const token = sessionStorage.getItem(SS_KEYS.accessToken);

const orderStatus = document.getElementById("order-status");

if (success) {
    orderStatus.innerHTML = `
        <div class="text-center grid gap-8">
            <div class="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100" >
                <i data-lucide="circle-check" class="size-8 text-green-600"></i>
            </div>
            <h1 class="text-3xl font-bold text-green-600">
                ${t('payment_successful')}
            </h1>

            <p class="text-gray-600">
                ${t('receipt_sent')}
            </p>

            <div id="queue-numbers"></div>
            <a
                href="/customer"
                class="inline-flex h-10 items-center justify-center rounded-md bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
                ${t('back_to_home')}
            </a>
        </div>
    `;
} else {
    orderStatus.innerHTML = `
        <div class="text-center">
            <div class="mx-auto flex size-16 items-center justify-center rounded-full bg-red-100" >
                <i data-lucide="circle-x" class="size-8 text-red-600"></i>
            </div>
            <h1 class="mt-6 text-3xl font-bold text-red-600">
                ${t('payment_unsuccessful')}
            </h1>

            <p class="mt-4 text-gray-600">
                ${t('payment_retry')}
            </p>

            <a
                href="/customer/cart.html"
                class="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
                ${t('return_checkout')}
            </a>
        </div>
    `;
}

async function loadQueueNumbers() {
    const orderIdMap = JSON.parse(
        sessionStorage.getItem(LS_KEYS.createdOrderIds) ?? "{}",
    );

    try {
        const orderDetails = await Promise.all(
            Object.keys(orderIdMap).map(async (stallId) => {
                const orderId = orderIdMap[stallId];

                const response = await fetch(`/order/${orderId}`, {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                return await response.json();
            }),
        );
        displayQueueNumbers(orderDetails);
    } catch (err) {
        console.error(err);
    }
}

async function getStallInfo(stallId) {
    try {
        const response = await fetch(`/stalls/${stallId}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        return await response.json();
    } catch (err) {
        console.error(err);
    }
}

async function displayQueueNumbers(orders) {
    const container = document.getElementById("queue-numbers");

    if (!container) return;

    // 使用 Promise.all 等待所有异步操作完成
    const queueCards = await Promise.all(
        orders.map(async (order) => {
            const stallInfo = await getStallInfo(order.stall_id);
            const stallName = stallInfo.stall_name;
            const statusText = t(order.status.toLowerCase()) || order.status;

            return `
                <div class="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
                    <p class="text-base text-gray-500 mb-1 font-bold">${stallName}</p>
                    <p class="text-sm text-gray-500">${t('your_queue_number')}</p>
                    <p class="text-4xl font-bold text-gray-900 mt-1">${order.queue_number}</p>
                    <span class="inline-block mt-3 text-xs font-medium px-2 py-1 rounded-full ${statusStyle(order.status)}">
                        ${statusText}
                    </span>
                </div>
            `;
        })
    );

    container.innerHTML = queueCards.join("");
}

lucide.createIcons();
loadQueueNumbers();
