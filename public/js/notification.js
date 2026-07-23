// notification.js
// Toast notification helper. Uses Tailwind CSS for styling.
// Exposes a single function: showNotification(type, options)
//   type: 'newOrder' | 'updateOrder' | 'newComplaint'
//   options: { title?: string, message?: string, duration?: number }


export const TYPE_STYLES = {
    newOrder: {
        border: 'border-green-500',
        icon: '✓',
        label: 'New Order',
        accent: 'text-green-500',
        message: 'has been added',
    },
    updateOrder: {
        border: 'border-yellow-500',
        icon: '⟳',
        label: 'Order Updated',
        accent: 'text-yellow-500',
        message: 'has been updated',
    },
    newComplaint: {
        border: 'border-red-500',
        icon: '!',
        label: 'New Complaint',
        accent: 'text-red-500',
    },
};

function ensureContainer() {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className =
            'fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
    }
    return container;
}

export function showNotification(type, options = {}) {
    console.log("notification called")
    const style = TYPE_STYLES[type];
    if (!style) {
        console.warn(`showNotification: unknown type "${type}"`);
        return null;
    }

    let {
        title = style.label,
        message = '',
        duration = 4000,
    } = options;
    message += " " + style.message;

    const container = ensureContainer();

    const toast = document.createElement('div');
    toast.setAttribute('role', 'alert');
    toast.className = [
        'pointer-events-auto',
        'min-w-[280px] max-w-sm',
        'bg-white',
        'border-l-4',
        style.border,
        'shadow-lg',
        'rounded-md',
        'px-4 py-3',
        'flex items-start gap-3',
        'transform transition-all duration-300 ease-out',
        'translate-x-full opacity-0',
    ].join(' ');

    toast.innerHTML = `
      <div class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 ${style.accent} font-bold text-sm">
        ${style.icon}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-900">${escapeHtml(title)}</p>
        ${message
            ? `<p class="mt-0.5 text-sm text-gray-600">${escapeHtml(message)}</p>`
            : ''
        }
      </div>
      <button type="button" class="notification-close text-gray-400 hover:text-gray-600 leading-none" aria-label="Dismiss">
        ×
      </button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
        toast.classList.add('translate-x-0', 'opacity-100');
    });

    const dismiss = () => {
        toast.classList.remove('translate-x-0', 'opacity-100');
        toast.classList.add('translate-x-full', 'opacity-0');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.notification-close').addEventListener('click', dismiss);

    if (duration > 0) {
        setTimeout(dismiss, duration);
    }

    return { element: toast, dismiss };
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

