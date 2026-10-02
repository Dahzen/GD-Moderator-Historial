// admin.js
import { assetPaths } from './config.js';
import { historyData, gatekeepersList } from './state.js';
import { renderGatekeepers, renderFechasTimeline, renderRolesTimeline } from './ui.js';
import { guardarEnLocalStorage } from './storage.js';

export function toggleAdminPanel(enabled) {
    document.getElementById("admin-panel")?.classList.toggle("hidden", !enabled);
}

/* Manejo de los desplegables de insignias */
export function setupRoleSelectors() {
    // Configurar toggle de desplegables
    setupSingleSelector("btn-trigger-edit-role", "popup-edit-role", "img-selected-edit-role");
    setupSingleSelector("btn-trigger-add-role", "popup-add-role", "img-selected-add-role");
}

function setupSingleSelector(triggerId, popupId, imgId) {
    const trigger = document.getElementById(triggerId);
    const popup = document.getElementById(popupId);
    const imgSelected = document.getElementById(imgId);

    if (!trigger || !popup) return;

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        popup.classList.toggle("hidden");
    });

    popup.querySelectorAll(".role-option-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const selectedRole = btn.getAttribute("data-role");
            const imgSrc = btn.querySelector("img").getAttribute("src");

            trigger.setAttribute("data-selected-role", selectedRole);
            if (imgSelected) imgSelected.setAttribute("src", imgSrc);

            popup.querySelectorAll(".role-option-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            popup.classList.add("hidden");
        });
    });

    // Cerrar al hacer clic fuera
    document.addEventListener("click", () => popup.classList.add("hidden"));
}

export function adminUpdateAsset() {
    let k = document.getElementById("asset-key")?.value.trim();
    let u = document.getElementById("asset-url")?.value.trim();
    if (k && u) {
        assetPaths[k] = u;
        alert(`Asset ${k} actualizado.`);
    }
}

export function adminUpdateInfo() {
    let t = document.getElementById("admin-info-title")?.value;
    let st = document.getElementById("admin-info-subtitle")?.value;
    let d = document.getElementById("admin-info-desc")?.value;

    if (t) document.getElementById("display-title").textContent = t;
    if (st) document.getElementById("display-subtitle").textContent = st;
    if (d) document.getElementById("desc-intro").textContent = d;

    alert("Información actualizada correctamente.");
}

export function adminEditMember() {
    let id = document.getElementById("edit-member-id")?.value.trim();
    let newName = document.getElementById("edit-member-newname")?.value.trim();
    let newRole = document.getElementById("btn-trigger-edit-role")?.getAttribute("data-selected-role");
    let dateVal = document.getElementById("edit-member-date")?.value;

    let target = historyData.find(i => i.id === id);
    if (!target) return alert("Usuario no encontrado.");

    if (newName) {
        if (!target.oldNames.includes(target.user)) target.oldNames.push(target.user);
        target.user = newName;
    }

    if (newRole) {
        if (!dateVal) return alert("Si cambias el rol, debes especificar una fecha obligatoriamente.");
        let d = new Date(dateVal);
        let monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        let hours = d.getHours().toString().padStart(2, '0');
        let minutes = d.getMinutes().toString().padStart(2, '0');
        let dateFormatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()} ${hours}:${minutes}`;

        historyData.push({
            year: d.getFullYear().toString(),
            month: monthNames[d.getMonth()],
            day: d.getDate().toString(),
            dateStr: dateFormatted,
            user: target.user,
            oldNames: target.oldNames,
            id: target.id,
            role: newRole,
            type: "promote",
            country: target.country
        });
    }

    guardarEnLocalStorage(historyData, gatekeepersList);
    renderFechasTimeline();
    renderRolesTimeline();

    alert("Miembro actualizado.");
}

export function adminAddMember() {
    let role = document.getElementById("btn-trigger-add-role")?.getAttribute("data-selected-role");
    let name = document.getElementById("add-name")?.value.trim();
    let id = document.getElementById("add-id")?.value.trim();
    let dateVal = document.getElementById("add-date")?.value;
    let country = document.getElementById("add-country")?.value.trim() || "Global";

    if (!name || !id || !dateVal || !role) return alert("Por favor completa los campos requeridos (Nombre, ID, Fecha, Rol).");

    let d = new Date(dateVal);
    let monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    let hours = d.getHours().toString().padStart(2, '0');
    let minutes = d.getMinutes().toString().padStart(2, '0');
    let dateFormatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()} ${hours}:${minutes}`;

    historyData.push({
        year: d.getFullYear().toString(),
        month: monthNames[d.getMonth()],
        day: d.getDate().toString(),
        dateStr: dateFormatted,
        user: name,
        oldNames: [],
        id: id,
        role: role,
        type: "promote",
        country: country
    });

    gatekeepersList.push({ name: name, id: id, role: role });
    
    guardarEnLocalStorage(historyData, gatekeepersList);
    renderGatekeepers();
    renderFechasTimeline();
    renderRolesTimeline();

    alert("Nuevo miembro agregado correctamente.");
}

export function adminDeleteMember() {
    let id = document.getElementById("delete-member-id")?.value.trim();

    if (!id) {
        alert("Por favor ingresa el ID del miembro a eliminar.");
        return;
    }

    let historyIndex = historyData.findIndex(item => String(item.id) === id);
    let gkIndex = gatekeepersList.findIndex(item => String(item.id) === id);

    if (historyIndex === -1 && gkIndex === -1) {
        alert(`No se encontró ningún registro o moderador con el ID: ${id}`);
        return;
    }

    let confirmDelete = confirm(`¿Estás seguro de que deseas eliminar permanentemente el registro con ID ${id}?`);
    
    if (confirmDelete) {
        if (historyIndex !== -1) historyData.splice(historyIndex, 1);
        if (gkIndex !== -1) gatekeepersList.splice(gkIndex, 1);

        guardarEnLocalStorage(historyData, gatekeepersList);
        renderGatekeepers();
        renderFechasTimeline();
        renderRolesTimeline();

        alert("Registro eliminado exitosamente.");
    }
}