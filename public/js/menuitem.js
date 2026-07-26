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
const editFormRef = document.getElementById("editForm");
const editCancelBtnRef = document.getElementById("editCancelBtn");
const editMsgRef = document.getElementById("editMsg");
const editCuisineInputRef = document.getElementById("addCuisineInput");
const editCuisineBtnRef = document.getElementById("addCuisineBtn");
const editCuisineInputContainerRef = document.getElementById("addCuisineInputContainer");
const editCuisineInputFieldRef = document.querySelectorAll(".addCuisineInputField");
const deleteNameRef = document.getElementById("deleteName");
const deletePriceRef = document.getElementById("deletePrice");
const deleteConfirmBtnRef = document.getElementById("deleteConfirmBtn");
const deleteCancelBtnRef = document.getElementById("deleteCancelBtn");
const deleteErrorMsgRef = document.getElementById("deleteErrorMsg");

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
        "absolute flex inset-0 h-screen items-center justify-center backdrop-blur-xs shadow-xl";
    editNameInputRef.value = item.item_desc;
    editPriceInputRef.value = item.item_price.toFixed(2);
    editMsgRef.classList.add("hidden");

    const editCuisineInputContainerRef = document.getElementById("editCuisineInputContainer");
    editCuisineInputContainerRef.innerHTML = `
        <div class="editCuisineInputField flex gap-2 border-2 border-black p-1">
            <span>Cuisine:</span>
            <input id="editCuisineInput" type="text" class="pl-2 w-full focus:outline-none"
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
            removeBtn.className = "w-1/5 justify-center items-center border-2 border-black";
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
        removeBtn.className = "w-1/5 justify-center items-center border-2 border-black";
        removeBtn.onclick = () => newField.remove();
        newField.appendChild(removeBtn);

        editCuisineInputContainerRef.appendChild(newField);
    };

    editFormRef.onsubmit = async (e) => {
        e.preventDefault();
        item.item_desc = editNameInputRef.value;
        item.item_price = parseFloat(editPriceInputRef.value);

        // Collect cuisines from all fields
        const editCuisineInputFieldRefs = document.querySelectorAll(".editCuisineInputField");
        const cuisines = [];
        editCuisineInputFieldRefs.forEach(field => {
            const input = field.querySelector("input");
            if (input && input.value.trim() !== "") {
                cuisines.push(input.value.trim());
            }
        });

        const data = await updateItem(item, cuisines);
        if (data) {
            editMsgRef.classList.remove("hidden");
        }
        loadMenuItems();
    };

    editCancelBtnRef.onclick = () => {
        editMsgRef.classList.add("hidden");
        editDialogRef.classList.add("hidden");
    };
};
const displayDeleteDialog = (item) => {
    // TODO: needs testing
    deleteDialogRef.className =
        "absolute flex inset-0 h-screen items-center justify-center backdrop-blur-xs shadow-xl";
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
    promoSection.className = "promo-section border-2 border-black p-2 rounded flex flex-col gap-1 min-w-0 overflow-hidden";

    const makeRow = (labelText, inputEl) => {
        const row = document.createElement("div");
        row.className = "flex gap-2 items-center w-full min-w-0";
        const label = document.createElement("span");
        label.innerText = labelText;
        label.className = "text-sm w-16 shrink-0";
        row.appendChild(label);
        row.appendChild(inputEl);
        return row;
    };

    // Promo Code
    const promoCodeInput = document.createElement("input");
    promoCodeInput.type = "text";
    promoCodeInput.className = "flex-1 w-full border-2 border-black px-1 focus:outline-none";
    promoCodeInput.placeholder = "% OFF";
    promoSection.appendChild(makeRow("Promo Code:", promoCodeInput));

    // Discount
    const discountInput = document.createElement("input");
    discountInput.type = "number";
    discountInput.min = "1";
    discountInput.max = "100";
    discountInput.className = "flex-1 border-2 border-black px-1 focus:outline-none";
    discountInput.placeholder = "20";
    promoSection.appendChild(makeRow("Discount %:", discountInput));

    const startInput = document.createElement("input");
    startInput.type = "date";
    startInput.className = "flex-1 min-w-0 border-2 border-black px-1 focus:outline-none";
    startInput.valueAsDate = new Date();
    promoSection.appendChild(makeRow("Start:", startInput));

    const endInput = document.createElement("input");
    endInput.type = "date";
    endInput.className = "flex-1 min-w-0 border-2 border-black px-1 focus:outline-none";
    promoSection.appendChild(makeRow("End:", endInput));

    // Live price preview
    const pricePreview = document.createElement("p");
    pricePreview.className = "text-xs text-gray-700";
    promoSection.appendChild(pricePreview);

    const updatePricePreview = () => {
        const d = parseInt(discountInput.value);
        if (d > 0 && d <= 100) {
            const final = item.item_price * (1 - d / 100);
            pricePreview.innerHTML = `Customer sees: <span class="line-through">${item.item_price.toFixed(2)}</span> → <span class="font-bold text-red-600">${final.toFixed(2)}</span>`;
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
    formActions.className = "flex gap-1 pt-1";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.innerText = "Save";
    saveBtn.className = "flex-1 border-2 border-black bg-green-300 px-2";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.innerText = "Cancel";
    cancelBtn.className = "flex-1 border-2 border-black px-2";
    formActions.appendChild(saveBtn);
    formActions.appendChild(cancelBtn);
    promoSection.appendChild(formActions);

    // === Save handler ===
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
    const d = document.createElement("div");
    d.className =
        "flex flex-col max-w-full h-fit gap-1 rounded-xl border-2 border-black p-2";
    const nameRef = document.createElement("span");
    const priceRef = document.createElement("span");
    nameRef.innerText = `${item.item_desc}`;
    priceRef.innerText = `$${item.item_price.toFixed(2)}`;

    // === Promotion section ===
    const promoSection = document.createElement("div");
    promoSection.className = "border-2 border-black p-2 rounded flex flex-col gap-2";

    promos.forEach(promo => {
        const today = new Date();
        const start = new Date(promo.start_date);
        const end = new Date(promo.end_date);
        end.setHours(23, 59, 59, 999);

        let state = "EXPIRED";
        let stateColor = "bg-gray-500";
        if (today < start) {
            state = "SCHEDULED";
            stateColor = "bg-yellow-500";
        } else if (today >= start && today <= end) {
            state = "ACTIVE";
            stateColor = "bg-green-500";
        }

        const discountedPrice = item.item_price * (1 - promo.discount / 100);

        const stateBadge = document.createElement("div");
        stateBadge.className = "flex items-center gap-2 flex-wrap";
        const stateTag = document.createElement("span");
        stateTag.className = `${stateColor} text-white px-2 py-0.5 rounded text-sm`;
        stateTag.innerText = `${state} — ${promo.discount}% OFF`;
        const promoCode = document.createElement("span");
        promoCode.className = "font-bold";
        promoCode.innerText = promo.promo_code;
        stateBadge.appendChild(stateTag);
        stateBadge.appendChild(promoCode);
        promoSection.appendChild(stateBadge);

        const pricePreview = document.createElement("p");
        pricePreview.className = "text-sm";
        pricePreview.innerHTML = `<span class="line-through">$${item.item_price.toFixed(2)}</span> → <span class="font-bold text-red-600">$${discountedPrice.toFixed(2)}</span>`;
        promoSection.appendChild(pricePreview);

        const dateRange = document.createElement("p");
        dateRange.className = "text-xs";
        const fmt = (d) => new Date(d).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" });
        dateRange.innerText = `${fmt(start)} — ${fmt(end)}`;
        promoSection.appendChild(dateRange);

        const promoActions = document.createElement("div");
        promoActions.className = "flex gap-1 mt-1";
        // const editPromoBtn = document.createElement("button");
        // editPromoBtn.innerText = "Edit";
        // editPromoBtn.className = "flex-1 border-2 border-black px-2";
        // editPromoBtn.addEventListener("click", () => expandPromoForm(promoSection, item));
        const endPromoBtn = document.createElement("button");
        endPromoBtn.innerText = "End";
        endPromoBtn.className = "flex-1 border-2 border-black bg-red-200 px-2";
        endPromoBtn.addEventListener("click", () => endPromotion(promo));
        // promoActions.appendChild(editPromoBtn);
        promoActions.appendChild(endPromoBtn);
        promoSection.appendChild(promoActions);
    })

    const addPromoBtn = document.createElement("button");
    addPromoBtn.innerText = "+ Add Promotion";
    addPromoBtn.className = "border-2 border-black bg-white px-2 w-full";
    addPromoBtn.addEventListener("click", () => expandPromoForm(promoSection, item));
    promoSection.appendChild(addPromoBtn);

    // === Item actions ===
    const action = document.createElement("div");
    action.className = "flex gap-1 pt-2";
    const edit = document.createElement("button");
    edit.innerText = "edit";
    edit.className = "w-1/2 border-2 border-black";
    edit.addEventListener("click", () => displayEditDialog(item));
    const del = document.createElement("button");
    del.className = "w-1/2 border-2 border-black";
    del.innerText = "delete";
    del.addEventListener("click", () => displayDeleteDialog(item));

    action.appendChild(edit);
    action.appendChild(del);
    d.appendChild(nameRef);
    d.appendChild(priceRef);
    d.appendChild(promoSection);
    d.appendChild(action);
    cardContainerRef.appendChild(d);
};

async function setup() {
    await loadMenuItems();
    addItemBtnRef.addEventListener("click", () => {
        addDialogRef.className =
            "absolute flex inset-0 h-screen items-center justify-center backdrop-blur-xs shadow-xl";
        addMsgRef.classList.add("hidden");
        addNameInputRef.value = "";
        addPriceInputRef.value = null;
        addCategoryInputRef.value = "";
        const cuisineInputField = addCuisineInputFieldRef[0].cloneNode(true);
        addCuisineInputContainerRef.replaceChildren();
        addCuisineInputContainerRef.appendChild(cuisineInputField);
    });
    addFormRef.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fields = {
            name: addNameInputRef.value,
            price: addPriceInputRef.valueAsNumber,
            category: addCategoryInputRef.value
        }
        const isValid = validateMenuItem(fields);
        if (isValid != true) {
            addMsgRef.innerText = isValid;
            addMsgRef.className = "text-red-600";
            return;
        }
        const addCuisineInputFieldRef = document.querySelectorAll(".addCuisineInputField");
        const item = {
            stall_id: stallId,
            item_desc: addNameInputRef.value,
            item_price: parseFloat(addPriceInputRef.valueAsNumber),
            item_category: addCategoryInputRef.value,
        }
        let cuisines = [];
        addCuisineInputFieldRef.forEach(field => {
            const input = field.querySelector("input");
            cuisines.push(input.value);
        });
        const data = await createItem(item, cuisines);
        if (data) {
            addMsgRef.classList = "text-green-600";
        }
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
        removeCuisineField.className = "w-1/5 justify-center items-center border-2 border-black"
        removeCuisineField.addEventListener("click", () => {
            addCuisineInputContainerRef.removeChild(cuisineInputField);
        });
        cuisineInputField.appendChild(removeCuisineField);
        addCuisineInputContainerRef.appendChild(cuisineInputField);
    })
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

function validateMenuItem(fields) {
    if (fields.name == null || fields.name == "") {
        return "Name cannot be empty";
    }
    if (fields.price < 0 || Number.isNaN(fields.price)) {
        return "Price cannot be negative";
    }
    if (fields.category == null || fields.category == "") {
        return "Category cannot be empty";
    }
    const addCuisineInputFieldRef = document.querySelectorAll(".addCuisineInputField");
    let validatedCuisine = true;
    addCuisineInputFieldRef.forEach(field => {
        const input = field.querySelector('input');
        if (!input || input.value.trim() === "") {
            validatedCuisine = false;
        }
    });
    return validatedCuisine ? true : "Cuisine name cannot be empty";
}


await setup();
