const EDIT_ITEM_API_BASE_URL = "http://127.0.0.1:5000/api";

function getEditItemToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("mysaskia_token") ||
        ""
    );
}

function getEditItemId() {
    const params = new URLSearchParams(window.location.search);

    return (params.get("id") || "").trim();
}

function setEditItemMessage(text, type = "") {
    const message = document.getElementById("editItemMessage");

    if (!message) {
        return;
    }

    message.textContent = text;
    message.className = `status-message${type ? ` ${type}` : ""}`;
}

function fillEditItemForm(item) {
    const fields = {
        title: item.title,
        description: item.description,
        species: item.species,
        breed: item.breed,
        age: item.age,
        gender: item.gender,
        price: item.price,
        status: item.status,
        itemType: item.item_type
    };

    for (const [id, value] of Object.entries(fields)) {
        const field = document.getElementById(id);

        if (field) {
            field.value = value ?? "";
        }
    }

    const preview = document.getElementById("imagePreview");

    if (preview && item.image_url) {
        preview.src = item.image_url;
        preview.style.display = "block";
    }
}

function setupEditImagePreview() {
    const imageInput = document.getElementById("image");
    const preview = document.getElementById("imagePreview");

    if (!imageInput || !preview) {
        return;
    }

    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];

        if (!file) {
            return;
        }

        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
    });
}

async function loadEditItem(itemId) {
    setEditItemMessage("Inserat wird geladen...");

    try {
        const response = await fetch(`${EDIT_ITEM_API_BASE_URL}/items/${encodeURIComponent(itemId)}`);
        const data = await response.json();

        if (!response.ok) {
            setEditItemMessage(data.error || data.message || "Inserat konnte nicht geladen werden.", "error");
            return;
        }

        fillEditItemForm(data.item);
        setEditItemMessage("");
    } catch (error) {
        setEditItemMessage("Server nicht erreichbar. Läuft dein Flask-Backend?", "error");
    }
}

function setupEditItemForm(itemId, token) {
    const form = document.getElementById("editItemForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        setEditItemMessage("Änderungen werden gespeichert...");

        try {
            const response = await fetch(`${EDIT_ITEM_API_BASE_URL}/items/${encodeURIComponent(itemId)}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: new FormData(form)
            });
            const data = await response.json();

            if (!response.ok) {
                setEditItemMessage(data.error || data.message || "Inserat konnte nicht aktualisiert werden.", "error");
                return;
            }

            fillEditItemForm(data.item);
            setEditItemMessage(data.message || "Inserat wurde aktualisiert.", "success");

            const actions = document.getElementById("editItemSuccessActions");

            if (actions) {
                actions.innerHTML = `
                    <a class="btn secondary" href="my-items.html">Zu meinen Inseraten</a>
                    <a class="btn secondary" href="item.html?id=${encodeURIComponent(itemId)}">Detailseite ansehen</a>
                `;
            }
        } catch (error) {
            setEditItemMessage("Server nicht erreichbar. Läuft dein Flask-Backend?", "error");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const token = getEditItemToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const itemId = getEditItemId();

    if (!itemId) {
        setEditItemMessage("Keine Inserat-ID angegeben.", "error");
        return;
    }

    setupEditImagePreview();
    setupEditItemForm(itemId, token);
    loadEditItem(itemId);
});
