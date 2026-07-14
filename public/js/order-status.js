const params = new URLSearchParams(window.location.search);
const success = params.get("success") === "true";

const orderStatus = document.getElementById("order-status");

if (success) {
    orderStatus.innerHTML = `
        <div class="text-center">
            <div class="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100" >
                <i data-lucide="circle-check" class="size-8 text-green-600"></i>
            </div>
            <h1 class="mt-6 text-3xl font-bold text-green-600">
                Payment Successful
            </h1>

            <p class="mt-4 text-gray-600">
                Here is a summary of your order.
            </p>

            <div class="mt-8 rounded-lg border bg-gray-50 p-6">
                <p class="text-sm text-gray-500">
                    Your queue number is
                </p>

                <p class="mt-2 text-5xl font-bold">
                    A023
                </p>
            </div>

            <a
                href="/customer"
                class="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
                Back to Home
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
                Payment Unsuccessful
            </h1>

            <p class="mt-4 text-gray-600">
                Please try again.
            </p>

            <a
                href="/customer/cart.html"
                class="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
                Return to Checkout
            </a>
        </div>
    `;
}
lucide.createIcons();
