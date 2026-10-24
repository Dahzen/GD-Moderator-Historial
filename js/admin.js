// js/admin.js
import { 
    accountsList, 
    currentUserSession, 
    setUserSession, 
    moderatorsList, 
    setModerators 
} from './state.js';
import { saveModeratorsToLocal } from './storage.js';
import { 
    applySessionUI, 
    renderGatekeepers, 
    renderFechasTimeline, 
    renderRolesTimeline, 
    renderEstadisticas 
} from './ui.js';
import { getSpriteImage } from './spriteSheet.js';

let targetDeleteId = null;
let targetDeleteType = null; // 'moderator' o 'event'

export function setupAdminAuth() {
    // 1. Control del Drawer lateral
    const sidebar = document.getElementById("admin-panel-sidebar");
    document.getElementById("btn-side-admin-toggle")?.addEventListener("click", () => {
        sidebar?.classList.toggle("hidden");
    });
    document.getElementById("btn-close-admin-sidebar")?.addEventListener("click", () => {
        sidebar?.classList.add("hidden");
    });

    // 2. Eventos de la pestaña Cuenta
    document.getElementById("btn-submit-login")?.addEventListener("click", handleLoginSubmit);
    document.getElementById("btn-profile-logout")?.addEventListener("click", handleLogout);
    document.getElementById("btn-profile-admin-panel")?.addEventListener("click", () => {
        sidebar?.classList.remove("hidden");
    });

    // 3. Formularios del Panel Lateral
    document.getElementById("btn-admin-save-user")?.addEventListener("click", adminSaveModerator);
    document.getElementById("btn-admin-add-record")?.addEventListener("click", adminAddEvent);

    // 4. Modales de confirmación y guardado
    setupAdminModals();

    // Renderizar estado inicial de la cuenta
    renderAccountTab();
}

function handleLoginSubmit() {
    const user = document.getElementById("input-login-user")?.value.trim();
    const pass = document.getElementById("input-login-pass")?.value.trim();

    const account = accountsList.find(a => a.username.toLowerCase() === user.toLowerCase());

    if (!account) {
        return alert("El usuario ingresado no existe.");
    }

    if (account.password && account.password !== pass) {
        return alert("Contraseña incorrecta.");
    }

    setUserSession({
        username: account.username,
        role: account.role
    });

    applySessionUI();
    renderAccountTab();
    refreshAllViews();
}

export function handleLogout() {
    setUserSession({
        username: "guest",
        role: "viewer"
    });

    document.getElementById("admin-panel-sidebar")?.classList.add("hidden");
    applySessionUI();
    renderAccountTab();
    refreshAllViews();
}

export function renderAccountTab() {
    const loginView = document.getElementById("account-login-view");
    const profileView = document.getElementById("account-profile-view");
    if (!loginView || !profileView) return;

    const isLoggedIn = currentUserSession.username !== "guest";

    if (!isLoggedIn) {
        loginView.classList.remove("hidden");
        profileView.classList.add("hidden");
        const uInput = document.getElementById("input-login-user");
        const pInput = document.getElementById("input-login-pass");
        if (uInput) uInput.value = "";
        if (pInput) pInput.value = "";
    } else {
        loginView.classList.add("hidden");
        profileView.classList.remove("hidden");

        const nameEl = document.getElementById("profile-display-name");
        const roleEl = document.getElementById("profile-display-role");
        const avatarSlot = document.getElementById("profile-avatar-slot");
        const descEl = document.getElementById("profile-status-desc");
        const btnAdminPanel = document.getElementById("btn-profile-admin-panel");

        if (nameEl) nameEl.textContent = currentUserSession.username;
        if (roleEl) {
            roleEl.textContent = currentUserSession.role.toUpperCase();
            roleEl.style.color = currentUserSession.role === "admin" ? "var(--accent-green)" : "var(--accent-cyan)";
        }

        if (avatarSlot) {
            avatarSlot.innerHTML = "";
            const spriteKey = currentUserSession.role === "admin" ? "admin_gear" : "Rating Advisor";
            avatarSlot.appendChild(getSpriteImage(spriteKey, 48, "badge-img"));
        }

        if (descEl) {
            descEl.textContent = currentUserSession.role === "admin"
                ? "Sesión de Administrador activa. Tienes permisos para registrar, editar y borrar moderadores o eventos."
                : "Sesión de Lector activa. Tienes acceso visual al catálogo general y estadísticas.";
        }

        if (btnAdminPanel) {
            btnAdminPanel.style.display = currentUserSession.role === "admin" ? "inline-flex" : "none";
        }
    }
}

// Guardar o Actualizar Moderador desde el panel lateral
function adminSaveModerator() {
    const modId = document.getElementById("admin-user-id")?.value.trim();
    const modName = document.getElementById("admin-user-name")?.value.trim();
    const country = document.getElementById("admin-user-country")?.value.trim() || "Global";
    const oldNamesInput = document.getElementById("admin-user-oldnames")?.value.trim();
    const currentRole = document.getElementById("admin-user-role-select")?.value || "Rating Advisor";

    if (!modId || !modName) {
        return alert("El ID y el Nombre del Moderador son obligatorios.");
    }

    const aliases = oldNamesInput ? oldNamesInput.split(',').map(s => s.trim()).filter(Boolean) : [];
    const numId = Number(modId);

    const existingIndex = moderatorsList.findIndex(m => Number(m.id) === numId);

    if (existingIndex !== -1) {
        moderatorsList[existingIndex].name = modName;
        moderatorsList[existingIndex].currentRole = currentRole;
        moderatorsList[existingIndex].country = country;
        if (aliases.length) moderatorsList[existingIndex].aliases = aliases;
    } else {
        moderatorsList.push({
            id: numId,
            name: modName,
            aliases: aliases,
            currentRole: currentRole,
            country: country,
            isGatekeeper: true,
            active: true,
            history: []
        });
    }

    saveModeratorsToLocal(moderatorsList);
    refreshAllViews();
    alert("Moderador guardado con éxito.");
}

// Agregar Evento al historial de un moderador
function adminAddEvent() {
    const modId = document.getElementById("add-record-userid")?.value.trim();
    const usernameAtEvent = document.getElementById("add-record-username")?.value.trim();
    const role = document.getElementById("add-record-role-select")?.value;
    const dateVal = document.getElementById("add-date")?.value;

    if (!modId || !dateVal || !role) {
        return alert("Completa el ID de moderador, fecha/hora y rol.");
    }

    const numId = Number(modId);
    let mod = moderatorsList.find(m => Number(m.id) === numId);

    if (!mod) {
        mod = {
            id: numId,
            name: usernameAtEvent || `User_${numId}`,
            aliases: [],
            currentRole: role,
            country: "Global",
            isGatekeeper: true,
            active: true,
            history: []
        };
        moderatorsList.push(mod);
    }

    const d = new Date(dateVal);
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const dateFormatted = `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${hours}:${minutes}`;

    const newEvent = {
        eventId: `evt_${numId}_${Date.now()}`,
        dateStr: dateFormatted,
        year: d.getFullYear().toString(),
        month: monthNames[d.getMonth()],
        day: d.getDate().toString().padStart(2, '0'),
        role: role,
        type: role.startsWith("Ex ") ? "demote" : "promote",
        note: `Evento asignado (${role})`
    };

    if (!mod.history) mod.history = [];
    mod.history.push(newEvent);

    // Actualizar rol actual con el último evento
    mod.currentRole = role;

    saveModeratorsToLocal(moderatorsList);
    refreshAllViews();
    alert("Registro histórico agregado correctamente.");
}

function setupAdminModals() {
    const modalDelete = document.getElementById('modal-delete');
    const modalEditUser = document.getElementById('modal-edit-user');

    document.getElementById('btn-modal-cancel-delete')?.addEventListener('click', () => {
        modalDelete?.classList.add('hidden');
    });
    document.getElementById('btn-modal-cancel-user-edit')?.addEventListener('click', () => {
        modalEditUser?.classList.add('hidden');
    });

    document.getElementById('btn-modal-confirm-delete')?.addEventListener('click', () => {
        if (!targetDeleteId) return;

        if (targetDeleteType === 'moderator') {
            const idx = moderatorsList.findIndex(m => Number(m.id) === Number(targetDeleteId));
            if (idx !== -1) moderatorsList.splice(idx, 1);
        } else if (targetDeleteType === 'event') {
            moderatorsList.forEach(m => {
                if (m.history) {
                    m.history = m.history.filter(e => e.eventId !== targetDeleteId);
                }
            });
        }

        saveModeratorsToLocal(moderatorsList);
        refreshAllViews();
        modalDelete?.classList.add('hidden');
    });

    document.getElementById('btn-modal-save-user-edit')?.addEventListener('click', () => {
        const id = document.getElementById('modal-edit-user-id')?.value;
        const newName = document.getElementById('modal-edit-user-name')?.value.trim();
        const newCountry = document.getElementById('modal-edit-user-country')?.value.trim();

        const mod = moderatorsList.find(m => Number(m.id) === Number(id));
        if (mod) {
            if (newName && newName !== mod.name) {
                if (!mod.aliases) mod.aliases = [];
                if (!mod.aliases.includes(mod.name)) mod.aliases.push(mod.name);
                mod.name = newName;
            }
            if (newCountry) mod.country = newCountry;

            saveModeratorsToLocal(moderatorsList);
            refreshAllViews();
        }
        modalEditUser?.classList.add('hidden');
    });
}

export function openEditUserModal(id) {
    const mod = moderatorsList.find(m => Number(m.id) === Number(id));
    if (!mod) return;

    document.getElementById('modal-edit-user-id').value = mod.id;
    document.getElementById('modal-edit-user-name').value = mod.name;
    document.getElementById('modal-edit-user-country').value = mod.country || '';
    document.getElementById('modal-edit-user')?.classList.remove('hidden');
}

export function openDeleteModal(id, type = 'moderator', label = '') {
    targetDeleteId = id;
    targetDeleteType = type;

    const titleEl = document.getElementById('modal-delete-title');
    const msgEl = document.getElementById('modal-delete-msg');

    if (titleEl) titleEl.textContent = type === 'moderator' ? '¿Eliminar Moderador?' : '¿Eliminar Registro?';
    if (msgEl) {
        msgEl.textContent = type === 'moderator' 
            ? `Se eliminará a "${label}" y todo su historial de ascensos/descensos permanentemente.` 
            : `Se eliminará el registro histórico seleccionado.`;
    }

    document.getElementById('modal-delete')?.classList.remove('hidden');
}

function refreshAllViews() {
    renderGatekeepers();
    renderFechasTimeline();
    renderRolesTimeline();
    renderEstadisticas();
}
