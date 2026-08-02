const token = sessionStorage.getItem(SS_KEYS.accessToken);
const vendor_id = JSON.parse(atob(token.split(".")[1])).id;

const stallUnitNoRef = document.getElementById("stallUnitNo");
const addItemBtnRef = document.getElementById("addItemBtn");
const addDialogRef = document.getElementById("addDialog");
const addFormRef = document.getElementById("addForm");
const addNameInputRef = document.getElementById("addNameInput");
const addPriceInputRef = document.getElementById("addPriceInput");
const addCategoryInputRef = document.getElementById("addCategorySelect");
const addCancelBtnRef = document.getElementById("addCancelBtn");
const addMsgRef = document.getElementById("addMsg");
const addCuisineInputRef = document.getElementById("addCuisineInput");
const addCuisineBtnRef = document.getElementById("addCuisineBtn");
const addCuisineInputContainerRef = document.getElementById("addCuisineInputContainer");
const addCuisineInputFieldRef = document.querySelectorAll(".addCuisineInputField");
const cardContainerRef = document.getElementById("card-container");
const editDialogRef = document.getElementById("editDialog");
const deleteDialogRef = document.getElementById("deleteDialog");
const editNameInputRef = document.getElementById("editNameInput");
const editPriceInputRef = document.getElementById("editPriceInput");
const editCategoryInputRef = document.getElementById("editCategorySelect");
const editFormRef = document.getElementById("editForm");
const editCancelBtnRef = document.getElementById("editCancelBtn");
const editMsgRef = document.getElementById("editMsg");
const editCuisineInputRef = document.getElementById("editCuisineInput");
const editCuisineBtnRef = document.getElementById("editCuisineBtn");
const editCuisineInputContainerRef = document.getElementById("editCuisineInputContainer");
const editCuisineInputFieldRef = document.querySelectorAll(".addCuisineInputField");
const deleteNameRef = document.getElementById("deleteName");
const deletePriceRef = document.getElementById("deletePrice");
const deleteConfirmBtnRef = document.getElementById("deleteConfirmBtn");
const deleteCancelBtnRef = document.getElementById("deleteCancelBtn");
const deleteErrorMsgRef = document.getElementById("deleteErrorMsg");

const addImagePickerRef = document.getElementById("addImagePicker");
const addImageInputRef = document.getElementById("addImageInput");
const addImagePlaceholderRef = document.getElementById("addImagePlaceholder");
const addImagePreviewRef = document.getElementById("addImagePreview");

const editImagePickerRef = document.getElementById("editImagePicker");
const editImageInputRef = document.getElementById("editImageInput");
const editImagePlaceholderRef = document.getElementById("editImagePlaceholder");
const editImagePreviewRef = document.getElementById("editImagePreview");

let promotions = [];

const getStallId = async () => {
    const response = await fetch(`/vendors/${vendor_id}/stall`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    return await response.json();
};
const getStallInfo = async () => {
    const response = await fetch(`/stalls/${stallId}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    return await response.json();
};

const stallId = await getStallId();
const stallInfo = await getStallInfo(stallId);

async function fetchItems() {
    try {
        const response = await fetch(`/menuitemsbystall/${stallId}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        let data = await response.json();
        return data;
    } catch (e) {
        alert("FETCH ITEMS ERROR: ", e);
    }
}

async function fetchItemCuisine(stallId, itemCode) {
    try {
        const response = await fetch(`/menuItemCuisine/${stallId}/${itemCode}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            }
        });
        let data = await response.json();
        return data;
    } catch (e) {
        alert("FETCH CUISINES ERROR: ", e);
    }
}

async function createItem(menuItem, cuisines) {
    try {
        const response = await fetch(`/menuitem`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ menuItem, cuisines }),
        });
        let data = await response.json();
        return data;
    } catch (e) {
        alert(e);
    }
}

async function updateItem(menuItem, cuisines) {
    try {
        const response = await fetch(`/menuitem`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ menuItem, cuisines }),
        });
        let data = await response.json();
        return data;
    } catch (e) {
        alert("ERROR: ", e);
    }
}

async function fetchPromotion() {
    try {
        const response = await fetch(`/promotion/stall/${stallId}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            return false;
        }
        let data = await response.json();
        return data;
    } catch (e) {
        alert(e);
    }
}

async function createPromotion(promotion) {
    try {
        const response = await fetch(`/promotion`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ promotion }),
        });
        if (!response.ok) {
            return false;
        }
        let data = await response.json();
        return data;
    } catch (e) {
        alert(e);
    }
}

async function updatePromotion(promotion) {
    try {
        const response = await fetch(`/promotion`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ promotion }),
        });
        if (!response.ok) {
            return false;
        }
        let data = await response.json();
        return data;
    } catch (e) {
        alert(e);
    }
}

const endPromotion = async (promo) => {
    const result = await deletePromotion(promo.promo_code);
    if (result) {
        loadMenuItems();
    }
};

async function deletePromotion(promotionCode) {
    try {
        const response = await fetch(`/promotion`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ promotionCode }),
        });
        if (!response.ok) {
            return false;
        }
        let data = await response.json();
        return data;
    } catch (e) {
        alert(e);
    }
}

async function deleteItemRequest(stallId, itemCode) {
    try {
        const response = await fetch(`/menuitem`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ stallId, itemCode }),
        });
        if (!response.ok) {
            return false;
        }
        let data = await response.json();
        return data;
    } catch (e) {
        alert(e);
    }
}

stallUnitNoRef.innerText = stallInfo.stall.stall_unit_no;

const displayEditDialog = async (item) => {
    editDialogRef.className =
        "absolute flex inset-0 h-screen items-center justify-center backdrop-blur-xs";
    editNameInputRef.value = item.item_desc;
    editPriceInputRef.value = item.item_price.toFixed(2);
    editCategoryInputRef.value = item.item_category;
    editMsgRef.classList.add("hidden");

    editImagePreviewRef.classList.add("hidden");
    editImagePlaceholderRef.classList.remove("hidden");
    editImageInputRef.value = "";
    if (item.item_image) {
        editImagePreviewRef.src = item.item_image;
        editImagePreviewRef.classList.remove("hidden");
        editImagePlaceholderRef.classList.add("hidden");
    }

    const editCuisineInputContainerRef = document.getElementById("editCuisineInputContainer");
    editCuisineInputContainerRef.innerHTML = `
        <div class="editCuisineInputField flex gap-2 items-center rounded-md border border-slate-200 px-3 py-1.5 text-sm">
            <span class="text-slate-500 shrink-0">Cuisine:</span>
            <input id="editCuisineInput" type="text" class="w-full focus:outline-none"
                placeholder="Cuisine Name" />
        </div>
    `;

    const menuItemCuisines = await fetchItemCuisine(stallId, item.item_code);

    if (menuItemCuisines && menuItemCuisines.cuisines.length > 0) {
        const firstInput = editCuisineInputContainerRef.querySelector("input");
        firstInput.value = menuItemCuisines.cuisines[0].cuisine_name;
        firstInput.removeAttribute("id");

        for (let i = 1; i < menuItemCuisines.length; i++) {
            const newField = editCuisineInputContainerRef.querySelector(".editCuisineInputField").cloneNode(true);
            const input = newField.querySelector("input");
            input.value = menuItemCuisines[i].cuisine_name;
            input.removeAttribute("id");
            newField.removeAttribute("id");

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.innerText = "x";
            removeBtn.className = "rounded-md border border-slate-200 px-2 text-xs hover:bg-slate-100 transition-colors";
            removeBtn.onclick = () => newField.remove();
            newField.appendChild(removeBtn);

            editCuisineInputContainerRef.appendChild(newField);
        }
    }

    const editCuisineBtnRef = document.getElementById("editCuisineBtn");
    editCuisineBtnRef.onclick = () => {
        const newField = editCuisineInputContainerRef.querySelector(".editCuisineInputField").cloneNode(true);
        const input = newField.querySelector("input");
        input.value = "";
        input.removeAttribute("id");
        newField.removeAttribute("id");

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.innerText = "x";
        removeBtn.className = "rounded-md border border-slate-200 px-2 text-xs hover:bg-slate-100 transition-colors";
        removeBtn.onclick = () => newField.remove();
        newField.appendChild(removeBtn);

        editCuisineInputContainerRef.appendChild(newField);
    };

    editFormRef.onsubmit = async (e) => {
        e.preventDefault();
        item.item_desc = editNameInputRef.value;
        item.item_price = parseFloat(editPriceInputRef.value);
        item.item_category = editCategoryInputRef.value;
        item.item_image = editImageInputRef.files.length > 0 ? editImagePreviewRef.src : (item.item_image || null);

        const editCuisineInputFieldRefs = document.querySelectorAll(".editCuisineInputField");
        const cuisines = [];
        editCuisineInputFieldRefs.forEach(field => {
            const input = field.querySelector("input");
            if (input && input.value.trim() !== "") {
                cuisines.push(input.value.trim());
            }
        });

        const data = await updateItem(item, cuisines);
        if (data && data.message) {
            editMsgRef.innerText = data.message;
            editMsgRef.className = "text-red-600";
            return;
        }
        editMsgRef.innerText = "Edit successful";
        editMsgRef.className = "text-green-600";
        editDialogRef.classList.add("hidden");
        loadMenuItems();
    };

    editCancelBtnRef.onclick = () => {
        editMsgRef.classList.add("hidden");
        editDialogRef.classList.add("hidden");
    };
};
const displayDeleteDialog = (item) => {
    deleteDialogRef.className =
        "absolute flex inset-0 h-screen items-center justify-center backdrop-blur-xs";
    deleteNameRef.innerText = `Name: ${item.item_desc}`;
    deletePriceRef.innerText = `Price: $${item.item_price.toFixed(2)}`;
    deleteConfirmBtnRef.onclick = async () => {
        const data = await deleteItemRequest(item.stall_id, item.item_code);
        if (!data) {
            deleteErrorMsgRef.classList.remove("hidden");
        } else {
            deleteDialogRef.classList.add("hidden");
        }
        loadMenuItems();
    };
    deleteCancelBtnRef.onclick = () => {
        deleteDialogRef.classList.add("hidden");
        deleteErrorMsgRef.classList.add("hidden");
    };
};

const expandPromoForm = (promoSection, item) => {
    promoSection.innerHTML = "";
    promoSection.className = "rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2";

    const makeRow = (labelText, inputEl) => {
        const row = document.createElement("div");
        row.className = "flex gap-2 items-center w-full min-w-0";
        const label = document.createElement("span");
        label.innerText = labelText;
        label.className = "text-sm text-slate-500 w-20 shrink-0";
        row.appendChild(label);
        row.appendChild(inputEl);
        return row;
    };

    // Promo Code
    const promoCodeInput = document.createElement("input");
    promoCodeInput.type = "text";
    promoCodeInput.className = "flex-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950";
    promoCodeInput.placeholder = "SUMMER20";
    promoSection.appendChild(makeRow("Promo Code:", promoCodeInput));

    // Discount
    const discountInput = document.createElement("input");
    discountInput.type = "number";
    discountInput.min = "1";
    discountInput.max = "100";
    discountInput.className = "flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950";
    discountInput.placeholder = "20";
    promoSection.appendChild(makeRow("Discount %:", discountInput));

    const startInput = document.createElement("input");
    startInput.type = "date";
    startInput.className = "flex-1 min-w-0 rounded-md border border-slate-200 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950";
    startInput.valueAsDate = new Date();
    promoSection.appendChild(makeRow("Start:", startInput));

    // end
    const endInput = document.createElement("input");
    endInput.type = "date";
    endInput.className = "flex-1 min-w-0 rounded-md border border-slate-200 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950";
    promoSection.appendChild(makeRow("End:", endInput));

    // Live price preview
    const pricePreview = document.createElement("p");
    pricePreview.className = "text-xs text-slate-600";
    promoSection.appendChild(pricePreview);

    const updatePricePreview = () => {
        const d = parseInt(discountInput.value);
        if (d > 0 && d <= 100) {
            const final = item.item_price * (1 - d / 100);
            pricePreview.innerHTML = `Customer sees: <span class="line-through">${item.item_price.toFixed(2)}</span> → <span class="font-semibold text-red-600">${final.toFixed(2)}</span>`;
        } else {
            pricePreview.innerText = "";
        }
    };
    discountInput.addEventListener("input", updatePricePreview);

    // Error message
    const errorMsg = document.createElement("span");
    errorMsg.className = "text-red-600 text-xs hidden";
    promoSection.appendChild(errorMsg);

    // Action buttons
    const formActions = document.createElement("div");
    formActions.className = "flex gap-2 pt-1";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.innerText = "Save";
    saveBtn.className = "flex-1 rounded-md bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800 transition-colors";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.innerText = "Cancel";
    cancelBtn.className = "flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors";
    formActions.appendChild(saveBtn);
    formActions.appendChild(cancelBtn);
    promoSection.appendChild(formActions);

    saveBtn.addEventListener("click", async () => {
        errorMsg.classList.add("hidden");

        const discount = parseInt(discountInput.value);
        const promotionCode = promoCodeInput.value;
        const startDate = startInput.value;
        const endDate = endInput.value;

        // Validation
        if (!promotionCode) {
            showError("PromoCode is required");
            return;
        }
        if (promotions.find(p => p.promo_code === promotionCode)) {
            showError("This promo code already exist");
            return;
        }
        if (!discount || discount < 1 || discount > 100) {
            showError("Discount must be between 1 and 100");
            return;
        }
        if (!startDate || !endDate) {
            showError("Start and  dates are required");
            return;
        }
        if (new Date(endDate) <= new Date(startDate)) {
            showError("End date must be after start date");
            return;
        }

        const promoData = {
            promotionCode: promotionCode,
            stallId: item.stall_id,
            itemCode: item.item_code,
            discount,
            startDate,
            endDate
        };

        const result = await createPromotion(promoData);

        if (result) {
            loadMenuItems(); // refresh the whole list
        }
    });

    // === Cancel handler: re-render the card from scratch ===
    cancelBtn.addEventListener("click", () => {
        loadMenuItems();
    });

    function showError(msg) {
        errorMsg.innerText = msg;
        errorMsg.classList.remove("hidden");
    }
};

const createCard = (item, promos) => {
    const card = document.createElement("div");
    card.className =
        "flex flex-col max-w-full h-fit rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3";
    const infoRef = document.createElement("div");
    infoRef.className = "flex justify-between items-center"
    const nameRef = document.createElement("span");
    const priceRef = document.createElement("span");
    nameRef.innerText = `${item.item_desc}`;
    nameRef.className = "font-semibold text-slate-900";
    priceRef.innerText = `$${item.item_price.toFixed(2)}`;
    priceRef.className = "font-mono text-slate-700";
    infoRef.append(nameRef, priceRef)
    card.appendChild(infoRef);

    if (item.item_image) {
        const img = document.createElement("img");
        img.src = item.item_image;
        img.alt = item.item_desc;
        img.className = "w-full aspect-video object-cover rounded-lg border border-slate-200";
        card.appendChild(img);
    }

    const promoSection = document.createElement("div");
    promoSection.className = "rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2";

    promos.forEach(promo => {
        const today = new Date();
        const start = new Date(promo.start_date);
        const end = new Date(promo.end_date);
        end.setHours(23, 59, 59, 999);

        let state = "EXPIRED";
        let stateColor = "bg-slate-500";
        if (today < start) {
            state = "SCHEDULED";
            stateColor = "bg-amber-500";
        } else if (today >= start && today <= end) {
            state = "ACTIVE";
            stateColor = "bg-emerald-600";
        }

        const discountedPrice = item.item_price * (1 - promo.discount / 100);

        const stateBadge = document.createElement("div");
        stateBadge.className = "flex items-center gap-2 flex-wrap";
        const stateTag = document.createElement("span");
        stateTag.className = `${stateColor} text-white px-2 py-0.5 rounded text-xs font-medium`;
        stateTag.innerText = `${state} — ${promo.discount}% OFF`;
        const promoCode = document.createElement("span");
        promoCode.className = "font-semibold text-xs text-slate-600";
        promoCode.innerText = promo.promo_code;
        stateBadge.appendChild(stateTag);
        stateBadge.appendChild(promoCode);
        promoSection.appendChild(stateBadge);

        const pricePreview = document.createElement("p");
        pricePreview.className = "text-sm text-slate-700";
        pricePreview.innerHTML = `<span class="line-through">$${item.item_price.toFixed(2)}</span> → <span class="font-semibold text-red-600">$${discountedPrice.toFixed(2)}</span>`;
        promoSection.appendChild(pricePreview);

        const dateRange = document.createElement("p");
        dateRange.className = "text-xs text-slate-400";
        const fmt = (d) => new Date(d).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" });
        dateRange.innerText = `${fmt(start)} — ${fmt(end)}`;
        promoSection.appendChild(dateRange);

        const promoActions = document.createElement("div");
        promoActions.className = "flex gap-2";
        const endPromoBtn = document.createElement("button");
        endPromoBtn.innerText = "End";
        endPromoBtn.className = "rounded-md border border-red-200 text-red-600 px-3 py-1 text-xs hover:bg-red-50 transition-colors";
        endPromoBtn.addEventListener("click", () => endPromotion(promo));
        promoActions.appendChild(endPromoBtn);
        promoSection.appendChild(promoActions);
    })

    const addPromoBtn = document.createElement("button");
    addPromoBtn.innerText = "+ Add Promotion";
    addPromoBtn.className = "rounded-md border border-slate-200 bg-white text-sm hover:bg-slate-50 transition-colors w-full py-1.5";
    addPromoBtn.addEventListener("click", () => expandPromoForm(promoSection, item));
    promoSection.appendChild(addPromoBtn);

    // actions
    const action = document.createElement("div");
    action.className = "flex gap-2";
    const edit = document.createElement("button");
    edit.innerText = "Edit";
    edit.className = "flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors";
    edit.addEventListener("click", () => displayEditDialog(item));
    const del = document.createElement("button");
    del.className = "flex-1 rounded-md border border-red-200 text-red-600 px-3 py-1.5 text-sm hover:bg-red-50 transition-colors";
    del.innerText = "Delete";
    del.addEventListener("click", () => displayDeleteDialog(item));

    action.append(edit, del);
    card.appendChild(promoSection);
    card.appendChild(action);
    cardContainerRef.appendChild(card);
};

async function setup() {
    await loadMenuItems();
    addItemBtnRef.addEventListener("click", () => {
        addDialogRef.className =
            "absolute flex inset-0 h-screen items-center justify-center backdrop-blur-xs";
        addMsgRef.classList.add("hidden");
        addNameInputRef.value = "";
        addPriceInputRef.value = null;
        addCategoryInputRef.value = "";
        const cuisineInputField = addCuisineInputFieldRef[0].cloneNode(true);
        addCuisineInputContainerRef.replaceChildren();
        addCuisineInputContainerRef.appendChild(cuisineInputField);

        addImagePreviewRef.classList.add("hidden");
        addImagePlaceholderRef.classList.remove("hidden");
        addImageInputRef.value = "";
    });
    addFormRef.addEventListener("submit", async (e) => {
        e.preventDefault();
        const addCuisineInputFieldRef = document.querySelectorAll(".addCuisineInputField");
        const item = {
            stall_id: stallId,
            item_desc: addNameInputRef.value,
            item_price: parseFloat(addPriceInputRef.valueAsNumber),
            item_category: addCategoryInputRef.value,
            item_image: addImageInputRef.files.length > 0 ? addImagePreviewRef.src : null,
        }
        let cuisines = [];
        addCuisineInputFieldRef.forEach(field => {
            const input = field.querySelector("input");
            if (input && input.value.trim() !== "") {
                cuisines.push(input.value.trim());
            }
        });
        const data = await createItem(item, cuisines);
        if (data && data.message) {
            addMsgRef.innerText = data.message;
            addMsgRef.className = "text-red-600";
            return;
        }
        addMsgRef.innerText = "Add successful";
        addMsgRef.className = "text-green-600";
        addDialogRef.classList.add("hidden");
        loadMenuItems();
    });
    addCancelBtnRef.addEventListener("click", () => {
        addMsgRef.classList.add("hidden");
        addDialogRef.classList.add("hidden");
    });
    addCuisineBtnRef.addEventListener("click", () => {
        const cuisineInputField = addCuisineInputFieldRef[0].cloneNode(true);
        cuisineInputField.lastChild.value = ""
        const removeCuisineField = document.createElement("button");
        removeCuisineField.type = "button";
        removeCuisineField.innerText = "x";
        removeCuisineField.className = "rounded-md border border-slate-200 px-2 text-xs hover:bg-slate-100 transition-colors"
        removeCuisineField.addEventListener("click", () => {
            addCuisineInputContainerRef.removeChild(cuisineInputField);
        });
        cuisineInputField.appendChild(removeCuisineField);
        addCuisineInputContainerRef.appendChild(cuisineInputField);
    })
    addImagePickerRef.addEventListener("click", () => addImageInputRef.click());

    addImageInputRef.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                addImagePreviewRef.src = event.target.result;
                addImagePreviewRef.classList.remove("hidden");
                addImagePlaceholderRef.classList.add("hidden");
            };
            reader.readAsDataURL(file);
        }
    });

    editImagePickerRef.addEventListener("click", () => editImageInputRef.click());

    editImageInputRef.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                editImagePreviewRef.src = event.target.result;
                editImagePreviewRef.classList.remove("hidden");
                editImagePlaceholderRef.classList.add("hidden");
            };
            reader.readAsDataURL(file);
        }
    });
}

async function loadMenuItems() {
    // clear menu item
    cardContainerRef.replaceChildren();
    // load menu item
    const items = await fetchItems();
    promotions = await fetchPromotion();
    const promosByItemCode = new Map();
    if (Array.isArray(promotions)) {
        promotions.forEach(promo => {
            if (!promo || !promo.item_code) return;
            if (!promosByItemCode.has(promo.item_code)) {
                promosByItemCode.set(promo.item_code, []);
            }
            promosByItemCode.get(promo.item_code).push(promo);
        });
    }
    items.forEach((item) => {
        const promos = promosByItemCode.get(item.item_code) || [];
        createCard(item, promos)
    })
}

await setup();
