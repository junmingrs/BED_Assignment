import { getIdFromToken } from "./helper.js";

const CHAT_STORAGE_KEY = 'hawker_chat_history';
const MAX_HISTORY = 10;

const token = sessionStorage.getItem(window.SS_KEYS.accessToken);
const customerId = getIdFromToken(token);

function getChatHistory() {
    try {
        return JSON.parse(sessionStorage.getItem(CHAT_STORAGE_KEY) || '[]');
    } catch { return []; }
}

function saveChatHistory(messages) {
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
}

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(window.LS_KEYS.cart) || '{}');
    } catch { return {}; }
}

function saveCart(cart) {
    localStorage.setItem(window.LS_KEYS.cart, JSON.stringify(cart));
}

function addItemToCart(stallId, itemCode) {
    const cart = getCart();
    if (!cart[stallId]) {
        cart[stallId] = { items: [], isEco: false };
    }
    const existing = cart[stallId].items.find(i => i.itemCode === itemCode);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart[stallId].items.push({ stallId, itemCode, quantity: 1 });
    }
    saveCart(cart);
}

function scrollToBottom(container) {
    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderMarkdown(text) {
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1 rounded text-xs">$1</code>');
    html = html.replace(/\n/g, '<br>');
    return html;
}

function buildChatHTML() {
    return `
    <div id="hc-chat-toggle" class="fixed bottom-6 right-6 z-50 flex items-center gap-2 cursor-pointer select-none">
      <span id="hc-chat-badge" class="hidden bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center absolute -top-1 -right-1"></span>
      <div class="w-14 h-14 rounded-full bg-slate-900 text-white shadow-lg flex items-center justify-center hover:bg-slate-800 transition-colors">
        <svg id="hc-chat-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
    </div>
    <div id="hc-chat-panel" class="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden hidden">
      <div id="hc-chat-header" class="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-green-400"></div>
          <span class="text-sm font-semibold">Hawker Assistant</span>
        </div>
        <button id="hc-chat-close" class="text-white/70 hover:text-white transition-colors text-lg leading-none">&times;</button>
      </div>
      <div id="hc-chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-sm"></div>
      <div class="border-t border-slate-200 p-3 bg-white">
        <div class="flex gap-2">
          <input id="hc-chat-input" type="text" placeholder="Ask me what to eat..." class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" autocomplete="off">
          <button id="hc-chat-send" class="bg-slate-900 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">Send</button>
        </div>
      </div>
    </div>
  `;
}

function appendMessage(container, role, content, actions) {
    const div = document.createElement('div');
    const isUser = role === 'user';
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
    const bubble = document.createElement('div');
    bubble.className = `max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isUser
        ? 'bg-slate-900 text-white rounded-br-md'
        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
        }`;
    if (isUser) {
        bubble.textContent = content;
    } else {
        bubble.innerHTML = renderMarkdown(content);
        if (actions && actions.length > 0) {
            const actionBar = document.createElement('div');
            actionBar.className = 'flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100';
            actions.forEach(action => {
                if (action.type === 'addToCart') {
                    const btn = document.createElement('button');
                    btn.className = 'inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors';
                    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add to cart';
                    btn.dataset.stallId = action.stallId;
                    btn.dataset.itemCode = action.itemCode;
                    btn.dataset.itemName = action.itemName || '';
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        addItemToCart(this.dataset.stallId, this.dataset.itemCode);
                        this.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Added!';
                        this.className = 'inline-flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700';
                    });
                    actionBar.appendChild(btn);
                }
                if (action.type === 'viewStall') {
                    const btn = document.createElement('a');
                    btn.href = `/customer/stall.html?stallId=${action.stallId}`;
                    btn.className = 'inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors';
                    btn.innerHTML = 'View stall &rarr;';
                    actionBar.appendChild(btn);
                }
            });
            bubble.appendChild(actionBar);
        }
    }
    div.appendChild(bubble);
    container.appendChild(div);
    scrollToBottom(container);
}

function addLoadingIndicator(container) {
    const div = document.createElement('div');
    div.id = 'hc-loading';
    div.className = 'flex justify-start';
    div.innerHTML = '<div class="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"><div class="flex gap-1"><span class="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style="animation-delay:0ms"></span><span class="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style="animation-delay:150ms"></span><span class="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style="animation-delay:300ms"></span></div></div>';
    container.appendChild(div);
    scrollToBottom(container);
}

function removeLoadingIndicator() {
    const el = document.getElementById('hc-loading');
    if (el) el.remove();
}

async function sendMessage(inputEl, sendBtn, messagesContainer) {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    sendBtn.disabled = true;
    appendMessage(messagesContainer, 'user', text);
    const history = getChatHistory();
    history.push({ role: 'user', content: text });
    const recentHistory = history.slice(-MAX_HISTORY);
    addLoadingIndicator(messagesContainer);
    try {
        const res = await fetch(`/customer/chatbot/${customerId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                history: recentHistory,
            }),
        });
        removeLoadingIndicator(messagesContainer);
        if (!res.ok) {
            appendMessage(messagesContainer, 'assistant', 'Sorry, I had trouble responding. Please try again.');
            return;
        }
        const data = await res.json();
        appendMessage(messagesContainer, 'assistant', data.reply, data.actions || []);
        recentHistory.push({ role: 'assistant', content: data.reply });
        saveChatHistory(recentHistory);
    } catch (err) {
        removeLoadingIndicator(messagesContainer);
        appendMessage(messagesContainer, 'assistant', 'Network error. Please check your connection and try again.');
        console.error('Chat error:', err);
    } finally {
        sendBtn.disabled = false;
        inputEl.focus();
    }
}

function injectChatWidget() {
    const existing = document.getElementById('hc-chat-toggle');
    if (existing) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildChatHTML();
    document.body.appendChild(wrapper);
    const toggle = document.getElementById('hc-chat-toggle');
    const panel = document.getElementById('hc-chat-panel');
    const close = document.getElementById('hc-chat-close');
    const messages = document.getElementById('hc-chat-messages');
    const input = document.getElementById('hc-chat-input');
    const sendBtn = document.getElementById('hc-chat-send');
    toggle.addEventListener('click', () => {
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            input.focus();
            if (messages.children.length === 0) {
                appendMessage(messages, 'assistant', 'Hi! I\'m your **Hawker Ups** assistant. Ask me what\'s good to eat, or say something like "I want chicken rice" and I\'ll help you order!');
                const history = getChatHistory();
                if (history.length > 0) {
                    history.forEach(m => appendMessage(messages, m.role, m.content));
                }
            }
        }
    });
    close.addEventListener('click', () => {
        panel.classList.add('hidden');
    });
    sendBtn.addEventListener('click', () => sendMessage(input, sendBtn, messages));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage(input, sendBtn, messages);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectChatWidget);
} else {
    injectChatWidget();
}
