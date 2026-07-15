/**
 * menuItem.js
 * Vendor-facing menu board — list / add / edit / delete / search / filter.
 *
 * ASSUMED API (adjust to match your Express routes/controller for menuItemModel.js):
 *   GET    /api/menu-items/stall/:stallId          -> all items for this stall
 *   POST   /api/menu-items                         -> create  { stallId, itemCode, itemDesc, itemPrice, itemCategory }
 *   PUT    /api/menu-items                         -> update  { stallId, itemCode, itemDesc, itemPrice, itemCategory }
 *   DELETE /api/menu-items/:stallId/:itemCode      -> delete
 *
 * The stall ID is read from sessionStorage ("stallId"), set by your login/auth flow.
 * A fallback constant below is used only when nothing is in session storage, so this
 * page can be opened stand-alone for testing — replace/remove it once auth is wired up.
 */

(function () {
  "use strict";

  const API_BASE = "/api/menu-items";
  const FALLBACK_STALL_ID = "1"; // TODO: remove once session-based stallId is always set
  const STALL_ID = sessionStorage.getItem("stallId") || FALLBACK_STALL_ID;

  const state = {
    items: [],
    searchTerm: "",
    category: "",
    pendingDeleteCode: null,
  };

  // ---------- DOM refs ----------
  const el = {
    stallIdDisplay: document.getElementById("stallIdDisplay"),
    itemGrid: document.getElementById("itemGrid"),
    itemCount: document.getElementById("itemCount"),
    loadingState: document.getElementById("loadingState"),
    emptyState: document.getElementById("emptyState"),
    errorState: document.getElementById("errorState"),
    errorMessage: document.getElementById("errorMessage"),
    retryBtn: document.getElementById("retryBtn"),

    searchInput: document.getElementById("searchInput"),
    categoryFilter: document.getElementById("categoryFilter"),
    categorySuggestions: document.getElementById("categorySuggestions"),

    addItemBtn: document.getElementById("addItemBtn"),
    emptyAddBtn: document.getElementById("emptyAddBtn"),

    modal: document.getElementById("itemModal"),
    modalTitle: document.getElementById("modalTitle"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    cancelFormBtn: document.getElementById("cancelFormBtn"),
    itemForm: document.getElementById("itemForm"),
    formError: document.getElementById("formError"),
    saveItemBtn: document.getElementById("saveItemBtn"),

    itemCodeInput: document.getElementById("itemCode"),
    itemCodeOriginal: document.getElementById("itemCodeOriginal"),
    isEditMode: document.getElementById("isEditMode"),
    itemDescInput: document.getElementById("itemDesc"),
    itemPriceInput: document.getElementById("itemPrice"),
    itemCategoryInput: document.getElementById("itemCategory"),
    itemCodeHint: document.getElementById("itemCodeHint"),

    deleteModal: document.getElementById("deleteModal"),
    deleteItemName: document.getElementById("deleteItemName"),
    closeDeleteModalBtn: document.getElementById("closeDeleteModalBtn"),
    cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
    confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),

    toast: document.getElementById("toast"),
  };

  el.stallIdDisplay.textContent = STALL_ID;

  // ---------- Helpers ----------
  function formatPrice(value) {
    const n = Number(value);
    return "$" + (isNaN(n) ? "0.00" : n.toFixed(2));
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  let toastTimer = null;
  function showToast(message, isError) {
    el.toast.textContent = message;
    el.toast.classList.toggle("toast--error", !!isError);
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, 3200);
  }

  function setState(view) {
    // view: "loading" | "content" | "empty" | "error"
    el.loadingState.hidden = view !== "loading";
    el.errorState.hidden = view !== "error";
    el.emptyState.hidden = view !== "empty";
    el.itemGrid.hidden = view !== "content";
  }

  // ---------- API calls ----------
  async function apiRequest(url, options) {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    let body = null;
    try { body = await res.json(); } catch (_) { /* no body */ }
    if (!res.ok) {
      const message = (body && (body.message || body.error)) || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return body;
  }

  async function fetchItems() {
    return apiRequest(`${API_BASE}/stall/${encodeURIComponent(STALL_ID)}`);
  }

  async function createItem(payload) {
    return apiRequest(API_BASE, { method: "POST", body: JSON.stringify(payload) });
  }

  async function updateItem(payload) {
    return apiRequest(API_BASE, { method: "PUT", body: JSON.stringify(payload) });
  }

  async function deleteItemRequest(stallId, itemCode) {
    return apiRequest(`${API_BASE}/${encodeURIComponent(stallId)}/${encodeURIComponent(itemCode)}`, {
      method: "DELETE",
    });
  }

  // ---------- Rendering ----------
  function populateCategoryOptions(items) {
    const categories = Array.from(new Set(items.map((i) => i.item_category || i.itemCategory).filter(Boolean))).sort();

    const currentFilterValue = el.categoryFilter.value;
    el.categoryFilter.innerHTML = '<option value="">All dishes</option>';
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      el.categoryFilter.appendChild(opt);
    });
    if (categories.includes(currentFilterValue)) {
      el.categoryFilter.value = currentFilterValue;
    }

    el.categorySuggestions.innerHTML = categories
      .map((cat) => `<option value="${escapeHtml(cat)}"></option>`)
      .join("");
  }

  function getFilteredItems() {
    const term = state.searchTerm.trim().toLowerCase();
    return state.items.filter((item) => {
      const desc = (item.item_desc || item.itemDesc || "").toLowerCase();
      const category = item.item_category || item.itemCategory || "";
      const matchesSearch = !term || desc.includes(term);
      const matchesCategory = !state.category || category === state.category;
      return matchesSearch && matchesCategory;
    });
  }

  function renderItems() {
    if (state.items.length === 0) {
      setState("empty");
      el.itemCount.textContent = "";
      return;
    }

    const filtered = getFilteredItems();
    el.itemCount.textContent = `${filtered.length} dish${filtered.length === 1 ? "" : "es"}`;

    if (filtered.length === 0) {
      setState("content");
      el.itemGrid.innerHTML = `
        <div class="state-panel state-panel--empty" style="grid-column: 1 / -1;">
          <p class="state-panel__title">No dishes match your search.</p>
          <p class="state-panel__body">Try a different name or clear the category filter.</p>
        </div>`;
      return;
    }

    setState("content");
    el.itemGrid.innerHTML = filtered.map(renderChit).join("");

    el.itemGrid.querySelectorAll("[data-action='edit']").forEach((btn) => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.code));
    });
    el.itemGrid.querySelectorAll("[data-action='delete']").forEach((btn) => {
      btn.addEventListener("click", () => openDeleteModal(btn.dataset.code));
    });
  }

  function renderChit(item) {
    const code = item.item_code || item.itemCode;
    const desc = item.item_desc || item.itemDesc;
    const price = item.item_price !== undefined ? item.item_price : item.itemPrice;
    const category = item.item_category || item.itemCategory;

    return `
      <article class="chit" data-code="${escapeHtml(code)}">
        <div class="chit__top">
          <span class="chit__code">#${escapeHtml(code)}</span>
          ${category ? `<span class="chit__category">${escapeHtml(category)}</span>` : ""}
        </div>
        <h3 class="chit__name">${escapeHtml(desc)}</h3>
        <div class="chit__price">${formatPrice(price)}</div>
        <div class="chit__actions">
          <button class="btn btn--ghost" data-action="edit" data-code="${escapeHtml(code)}">Edit</button>
          <button class="btn btn--danger" data-action="delete" data-code="${escapeHtml(code)}">Remove</button>
        </div>
      </article>
    `;
  }

  // ---------- Load ----------
  async function loadItems() {
    setState("loading");
    try {
      const items = (await fetchItems()) || [];
      state.items = Array.isArray(items) ? items : [items];
      populateCategoryOptions(state.items);
      renderItems();
    } catch (err) {
      el.errorMessage.textContent = err.message || "Something went wrong.";
      setState("error");
    }
  }

  // ---------- Modal: add / edit ----------
  function openAddModal() {
    el.modalTitle.textContent = "Add a dish";
    el.isEditMode.value = "false";
    el.itemForm.reset();
    el.itemCodeInput.disabled = false;
    el.itemCodeHint.hidden = false;
    el.formError.hidden = true;
    el.modal.hidden = false;
    el.itemDescInput.focus();
  }

  function openEditModal(code) {
    const item = state.items.find((i) => (i.item_code || i.itemCode) === code);
    if (!item) return;

    el.modalTitle.textContent = "Edit dish";
    el.isEditMode.value = "true";
    el.itemCodeOriginal.value = code;
    el.itemCodeInput.value = code;
    el.itemCodeInput.disabled = true;
    el.itemCodeHint.hidden = true;
    el.itemDescInput.value = item.item_desc || item.itemDesc || "";
    el.itemPriceInput.value = item.item_price !== undefined ? item.item_price : item.itemPrice;
    el.itemCategoryInput.value = item.item_category || item.itemCategory || "";
    el.formError.hidden = true;
    el.modal.hidden = false;
    el.itemDescInput.focus();
  }

  function closeModal() {
    el.modal.hidden = true;
  }

  async function handleFormSubmit(evt) {
    evt.preventDefault();
    el.formError.hidden = true;

    const isEdit = el.isEditMode.value === "true";
    const itemCode = el.itemCodeInput.value.trim();
    const itemDesc = el.itemDescInput.value.trim();
    const itemPrice = parseFloat(el.itemPriceInput.value);
    const itemCategory = el.itemCategoryInput.value.trim();

    if (!itemCode || !itemDesc || !itemCategory || isNaN(itemPrice)) {
      el.formError.textContent = "Fill in every field — dish name, price, and category are all needed.";
      el.formError.hidden = false;
      return;
    }
    if (itemPrice < 0) {
      el.formError.textContent = "Price can't be negative.";
      el.formError.hidden = false;
      return;
    }
    if (!isEdit && state.items.some((i) => (i.item_code || i.itemCode) === itemCode)) {
      el.formError.textContent = `Item code "${itemCode}" is already in use — pick another one.`;
      el.formError.hidden = false;
      return;
    }

    const payload = {
      stallId: STALL_ID,
      itemCode,
      itemDesc,
      itemPrice,
      itemCategory,
    };

    el.saveItemBtn.disabled = true;
    el.saveItemBtn.textContent = "Saving…";
    try {
      if (isEdit) {
        await updateItem(payload);
        showToast(`${itemDesc} updated.`);
      } else {
        await createItem(payload);
        showToast(`${itemDesc} added to your menu.`);
      }
      closeModal();
      await loadItems();
    } catch (err) {
      el.formError.textContent = err.message || "Couldn't save this dish. Try again.";
      el.formError.hidden = false;
    } finally {
      el.saveItemBtn.disabled = false;
      el.saveItemBtn.textContent = "Save dish";
    }
  }

  // ---------- Modal: delete ----------
  function openDeleteModal(code) {
    const item = state.items.find((i) => (i.item_code || i.itemCode) === code);
    if (!item) return;
    state.pendingDeleteCode = code;
    el.deleteItemName.textContent = item.item_desc || item.itemDesc || code;
    el.deleteModal.hidden = false;
  }

  function closeDeleteModal() {
    el.deleteModal.hidden = true;
    state.pendingDeleteCode = null;
  }

  async function handleConfirmDelete() {
    if (!state.pendingDeleteCode) return;
    const code = state.pendingDeleteCode;
    el.confirmDeleteBtn.disabled = true;
    el.confirmDeleteBtn.textContent = "Removing…";
    try {
      await deleteItemRequest(STALL_ID, code);
      showToast("Dish removed from your menu.");
      closeDeleteModal();
      await loadItems();
    } catch (err) {
      showToast(err.message || "Couldn't remove this dish.", true);
    } finally {
      el.confirmDeleteBtn.disabled = false;
      el.confirmDeleteBtn.textContent = "Remove dish";
    }
  }

  // ---------- Search / filter ----------
  let searchDebounce = null;
  function handleSearchInput(evt) {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.searchTerm = evt.target.value;
      renderItems();
    }, 200);
  }

  function handleCategoryChange(evt) {
    state.category = evt.target.value;
    renderItems();
  }

  // ---------- Wire up events ----------
  el.addItemBtn.addEventListener("click", openAddModal);
  el.emptyAddBtn.addEventListener("click", openAddModal);
  el.closeModalBtn.addEventListener("click", closeModal);
  el.cancelFormBtn.addEventListener("click", closeModal);
  el.modal.addEventListener("click", (e) => { if (e.target === el.modal) closeModal(); });
  el.itemForm.addEventListener("submit", handleFormSubmit);

  el.closeDeleteModalBtn.addEventListener("click", closeDeleteModal);
  el.cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  el.deleteModal.addEventListener("click", (e) => { if (e.target === el.deleteModal) closeDeleteModal(); });
  el.confirmDeleteBtn.addEventListener("click", handleConfirmDelete);

  el.searchInput.addEventListener("input", handleSearchInput);
  el.categoryFilter.addEventListener("change", handleCategoryChange);
  el.retryBtn.addEventListener("click", loadItems);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!el.modal.hidden) closeModal();
      if (!el.deleteModal.hidden) closeDeleteModal();
    }
  });

  // ---------- Init ----------
  loadItems();
})();
