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
        alert("FETCH ERROR: ", e);
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
        alert("FETCH ERROR: ", e);
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
        let data = response.json();
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
        let data = response.json();
        return data;
    } catch (e) {
        alert("ERROR: ", e);
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
        let data = response.json();
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

const createCard = (item) => {
    const d = document.createElement("div");
    d.className =
        "flex flex-col max-w-full max-h-40 h-fit gap-1 rounded-xl border-2 border-black p-2";
    const nameRef = document.createElement("span");
    const priceRef = document.createElement("span");
    nameRef.innerText = `${item.item_desc}`;
    priceRef.innerText = `$${item.item_price.toFixed(2)}`;
    // actions
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
    items.map((item) => {
        createCard(item);
    });
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
