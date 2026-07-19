import { LS_KEYS } from "./const.js";
const token = localStorage.getItem(LS_KEYS.authToken);
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
const cardContainerRef = document.getElementById("card-container");
const editDialogRef = document.getElementById("editDialog");
const deleteDialogRef = document.getElementById("deleteDialog");
const editNameInputRef = document.getElementById("editNameInput");
const editPriceInputRef = document.getElementById("editPriceInput");
const editFormRef = document.getElementById("editForm");
const editCancelBtnRef = document.getElementById("editCancelBtn");
const editMsgRef = document.getElementById("editMsg");
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
            Authorization: `Bearer ${token}`
        }
    });
    return await response.json();
};
const getStallInfo = async () => {
    const response = await fetch(`/stalls/${stallId}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
        }
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
        })
        let data = await response.json()
        return data
    } catch (e) {
        alert("FETCH ERROR: ", e);
    }
}

async function createItem(payload) {
    try {
        const response = await fetch(`/menuitem`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload)
        })
        let data = response.json()
        return data
    } catch (e) {
        alert(e);
    }
}

async function updateItem(payload) {
    try {
        const response = await fetch(`/menuitem`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload)
        })
        let data = response.json()
        return data
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
            body: JSON.stringify({ stallId, itemCode })
        })
        if (!response.ok) {
            return false;
        }
        let data = response.json()
        return data
    } catch (e) {
        alert(e);
    }
}

stallUnitNoRef.innerText = stallInfo.stall.stall_unit_no;

const displayEditDialog = (item) => {
    editDialogRef.className = "absolute flex inset-0 h-screen items-center justify-center backdrop-blur-xs shadow-xl";
    editNameInputRef.value = item.item_desc;
    editPriceInputRef.value = item.item_price.toFixed(2);
    editMsgRef.classList.add("hidden");

    editFormRef.onsubmit = async (e) => {
        e.preventDefault();
        item.item_desc = editNameInputRef.value;
        item.item_price = parseFloat(editPriceInputRef.value);
        const data = await updateItem(item);
        if (data) {
            editMsgRef.classList.remove("hidden");
        }
        loadMenuItems();
    }
    editCancelBtnRef.onclick = () => {
        editMsgRef.classList.add("hidden");
        editDialogRef.classList.add("hidden");
    }
}

const displayDeleteDialog = (item) => {
    // TODO: needs testing
    deleteDialogRef.className = "absolute flex inset-0 h-screen items-center justify-center backdrop-blur-xs shadow-xl";
    deleteNameRef.innerText = `Name: ${item.item_desc}`;
    deletePriceRef.innerText = `Price: $${item.item_price.toFixed(2)}`;
    deleteConfirmBtnRef.onclick = async () => {
        const data = await deleteItemRequest(item.stall_id, item.item_code);
        if (!data) {
            deleteErrorMsgRef.classList.remove("hidden");
        }
        deleteDialogRef.classList.add("hidden");
        loadMenuItems();
    };
    deleteCancelBtnRef.onclick = () => {
        deleteDialogRef.classList.add("hidden");
        deleteErrorMsgRef.classList.add("hidden");
    };
}

const createCard = (item) => {
    const d = document.createElement("div");
    d.className = "flex flex-col max-w-full max-h-40 h-fit gap-1 rounded-xl border-2 border-black p-2"
    const nameRef = document.createElement("span");
    const priceRef = document.createElement("span");
    nameRef.innerText = `${item.item_desc}`;
    priceRef.innerText = `$${item.item_price.toFixed(2)}`;
    // actions
    const action = document.createElement("div");
    action.className = "flex gap-1 pt-2"
    const edit = document.createElement("button");
    edit.innerText = "edit";
    edit.className = "w-1/2 border-2 border-black"
    edit.addEventListener("click", () => displayEditDialog(item));
    const del = document.createElement("button");
    del.className = "w-1/2 border-2 border-black"
    del.innerText = "delete";
    del.addEventListener("click", () => displayDeleteDialog(item));

    action.appendChild(edit);
    action.appendChild(del);
    d.appendChild(nameRef);
    d.appendChild(priceRef);
    d.appendChild(action);
    cardContainerRef.appendChild(d)
}

async function setup() {
    await loadMenuItems();
    addItemBtnRef.addEventListener("click", () => {
        addDialogRef.className = "absolute flex inset-0 h-screen items-center justify-center backdrop-blur-xs shadow-xl";
        addMsgRef.classList.add("hidden");

        addFormRef.addEventListener("submit", async (e) => {
            e.preventDefault();
            const item = {
                stall_id: stallId,
                item_desc: addNameInputRef.value,
                item_price: parseFloat(addPriceInputRef.value),
                item_category: addCategoryInputRef.value,
            }
            const data = await createItem(item);
            console.log(data)
            if (data) {
                addMsgRef.classList.remove("hidden");
            }
            addDialogRef.classList.add("hidden");
            loadMenuItems();
        })
        addCancelBtnRef.onclick = () => {
            addMsgRef.classList.add("hidden");
            addDialogRef.classList.add("hidden");
        }
    })
}

async function loadMenuItems() {
    // clear menu item
    cardContainerRef.replaceChildren();
    // load menu item
    const items = await fetchItems();
    items.map((item) => {
        createCard(item);
    })
}

await setup();

