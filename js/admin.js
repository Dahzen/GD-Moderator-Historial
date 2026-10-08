// admin.js
import { assetPaths } from './config.js';
import { registros, usuarios, syncUsuariosFromRegistros, updateOrAddUser, setCountryFlag } from './state.js';
import { renderGatekeepers, renderFechasTimeline, renderRolesTimeline, setIsAdminModeActive } from './ui.js';
import { guardarEnLocalStorage } from './storage.js';

let targetDeleteId = null;
let deleteCategory = null; // 'registro' o 'usuario'

const ROLE_ASSETS = {
    'Rating Advisor': 'assets/rating_advisor.png',
    'Moderator': 'assets/moderator.png',
    'Leaderboard Mod': 'assets/leaderboard_Mod.png',
    'Ex Rating Advisor': 'assets/ex_rating_advisor.png',
    'Ex Moderator': 'assets/ex_moderator.png',
};

// Control para mostrar/ocultar la barra lateral de administración
export function initSidebarAdmin() {
    const btnSideToggle = document.getElementById("btn-side-admin-toggle");
    const sidebar = document.getElementById("admin-panel-sidebar");
    const btnClose = document.getElementById("btn-close-admin-sidebar");

    if (btnSideToggle && sidebar) {
        btnSideToggle.addEventListener("click", () => {
            const isHidden = sidebar.classList.contains("hidden");
            sidebar.classList.toggle("hidden", !isHidden);
            setIsAdminModeActive(isHidden);
        });
    }

    if (btnClose && sidebar) {
        btnClose.addEventListener("click", () => {
            sidebar.classList.add("hidden");
            setIsAdminModeActive(false);
        });
    }
}

export function setupRoleSelectors() {
    initSidebarAdmin();
    setupRolePicker("add");
    setupRolePicker("edit");
    setupRolePicker("user");

    setupTextManager();
    setupAssetSelector();
    setupFlagManager();
    setupModalEvents();
}

function setupRolePicker(prefix, currentRole = "Rating Advisor") {
    const popup = document.getElementById(`popup-${prefix}-role`);
    const trigger = document.getElementById(`btn-trigger-${prefix}-role`);
    const imgSelected = document.getElementById(`img-selected-${prefix}-role`);

    if (!popup || !trigger || !imgSelected) return;

    const allRoles = [
        "Rating Advisor",
        "Moderator",
        "Leaderboard Mod",
        "Ex Rating Advisor",
        "Ex Moderator",
    ];

    popup.innerHTML = "";

    allRoles.forEach(role => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "role-option-btn";
        btn.setAttribute("data-role", role);
        btn.title = role;
        btn.innerHTML = `<img src="${ROLE_ASSETS[role] || 'assets/rating_advisor.png'}" alt="${role}">`;

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            trigger.setAttribute("data-selected-role", role);
            imgSelected.setAttribute("src", ROLE_ASSETS[role] || 'assets/rating_advisor.png');

            popup.querySelectorAll(".role-option-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            popup.classList.add("hidden");
        });

        popup.appendChild(btn);
    });

    trigger.setAttribute("data-selected-role", currentRole);
    imgSelected.setAttribute("src", ROLE_ASSETS[currentRole] || 'assets/rating_advisor.png');

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        popup.classList.toggle("hidden");
    });

    document.addEventListener("click", () => popup.classList.add("hidden"));
}

/* ===================================================
   1. REGISTROS Y ACCIONES DE USUARIO
   =================================================== */

/**
 * Genera el HTML de los botones de acción para cada fila de usuario/registro (Settings + Delete)
 */
export function renderUserActionButtons(userId, recordId = null) {
    const editBtnHtml = `
        <button class="btn-icon-action btn-edit-user" onclick="openEditUsuarioModal('${userId}')" title="Editar Usuario">
            <img src="assets/settings.png" alt="Editar">
        </button>`;

    const deleteTarget = recordId ? `openDeleteRegistroModal('${recordId}')` : `openDeleteUsuarioModal('${userId}')`;
    const deleteBtnHtml = `
        <button class="btn-icon-action btn-delete" onclick="${deleteTarget}" title="Eliminar">
            <img src="assets/other.png" alt="Eliminar" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23ff4d4d\'><path d=\'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z\'/></svg>';">
        </button>`;

    return `<div class="user-actions">${editBtnHtml}${deleteBtnHtml}</div>`;
}

// Guardar o Crear Usuario Individual
export function adminSaveUser() {
    const userId = document.getElementById("admin-user-id")?.value.trim();
    const currentName = document.getElementById("admin-user-name")?.value.trim();
    const country = document.getElementById("admin-user-country")?.value.trim() || "Global";
    const oldNamesInput = document.getElementById("admin-user-oldnames")?.value.trim();
    const currentRole = document.getElementById("btn-trigger-user-role")?.getAttribute("data-selected-role") || "Rating Advisor";

    if (!userId || !currentName) {
        return alert("El ID de Usuario y el Nombre Actual son obligatorios.");
    }

    const oldNames = oldNamesInput ? oldNamesInput.split(',').map(n => n.trim()).filter(Boolean) : [];

    updateOrAddUser({
        userId,
        currentName,
        currentRole,
        country,
        oldNames
    });

    guardarEnLocalStorage(registros, usuarios);
    renderGatekeepers();
    alert("Usuario guardado/actualizado correctamente.");
}

// Crear Registro Vinculado
export function adminAddRegistroSeparated() {
    const userId = document.getElementById("add-record-userid")?.value.trim();
    const userName = document.getElementById("add-record-username")?.value.trim();
    const role = document.getElementById("btn-trigger-add-role")?.getAttribute("data-selected-role") || "Rating Advisor";
    const dateVal = document.getElementById("add-date")?.value;

    if (!userId || !userName || !dateVal || !role) {
        return alert("Completa todos los campos obligatorios.");
    }

    const type = role.startsWith("Ex ") ? "demote" : "promote";
    const d = new Date(dateVal);
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const dateFormatted = `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${hours}:${minutes}`;

    const nuevoRegistro = {
        idRecord: 'rec_' + Date.now(),
        userId,
        userName,
        role,
        type,
        year: d.getFullYear().toString(),
        month: monthNames[d.getMonth()],
        day: d.getDate().toString(),
        hours,
        minutes,
        dateStr: dateFormatted
    };

    registros.push(nuevoRegistro);
    syncUsuariosFromRegistros();
    guardarEnLocalStorage(registros, usuarios);

    renderGatekeepers();
    renderFechasTimeline();
    renderRolesTimeline();

    alert("Registro guardado con éxito.");
}

/* ===================================================
   2. GESTIÓN DE BANDERAS
   =================================================== */
function setupFlagManager() {
    const btnSaveFlag = document.getElementById('btn-admin-save-flag');
    if (!btnSaveFlag) return;

    btnSaveFlag.addEventListener('click', () => {
        const country = document.getElementById('admin-flag-country')?.value.trim();
        const code = document.getElementById('admin-flag-code')?.value.trim();
        const customUrl = document.getElementById('admin-flag-url')?.value.trim();

        if (!country) return alert("Ingresa el nombre del país.");

        setCountryFlag(country, code, customUrl);
        renderGatekeepers();
        renderFechasTimeline();
        renderRolesTimeline();

        alert(`Configuración de bandera para ${country} guardada.`);
    });
}

/* ===================================================
   3. MODALES CUSTOM
   =================================================== */
function setupModalEvents() {
    const modalDelete = document.getElementById('modal-delete');
    const modalEdit = document.getElementById('modal-edit');
    const modalUserEdit = document.getElementById('modal-edit-user');

    document.getElementById('btn-modal-cancel-delete')?.addEventListener('click', () => {
        modalDelete?.classList.add('hidden');
    });

    document.getElementById('btn-modal-cancel-edit')?.addEventListener('click', () => {
        modalEdit?.classList.add('hidden');
    });

    document.getElementById('btn-modal-cancel-user-edit')?.addEventListener('click', () => {
        modalUserEdit?.classList.add('hidden');
    });

    document.getElementById('btn-modal-confirm-delete')?.addEventListener('click', () => {
        if (!targetDeleteId) return;

        if (deleteCategory === 'registro') {
            const idx = registros.findIndex(r => String(r.idRecord) === String(targetDeleteId));
            if (idx !== -1) registros.splice(idx, 1);
        } else if (deleteCategory === 'usuario') {
            for (let i = registros.length - 1; i >= 0; i--) {
                if (String(registros[i].userId) === String(targetDeleteId)) {
                    registros.splice(i, 1);
                }
            }
        }

        syncUsuariosFromRegistros();
        guardarEnLocalStorage(registros, usuarios);

        renderGatekeepers();
        renderFechasTimeline();
        renderRolesTimeline();

        modalDelete?.classList.add('hidden');
    });

    document.getElementById('btn-modal-save-user-edit')?.addEventListener('click', () => {
        const userId = document.getElementById('modal-edit-user-id').value;
        const newName = document.getElementById('modal-edit-user-name').value.trim();
        const newCountry = document.getElementById('modal-edit-user-country').value.trim();

        registros.forEach(r => {
            if (String(r.userId) === String(userId)) {
                if (newName) r.userName = newName;
                if (newCountry) r.country = newCountry;
            }
        });

        syncUsuariosFromRegistros();
        guardarEnLocalStorage(registros, usuarios);

        renderGatekeepers();
        renderFechasTimeline();
        renderRolesTimeline();

        modalUserEdit?.classList.add('hidden');
    });

    document.getElementById('btn-modal-save-edit')?.addEventListener('click', () => {
        const idRecord = document.getElementById('modal-edit-id').value;
        const name = document.getElementById('modal-edit-name').value.trim();
        const role = document.getElementById('btn-trigger-edit-role')?.getAttribute('data-selected-role');
        const dateVal = document.getElementById('modal-edit-date').value;
        const country = document.getElementById('modal-edit-country').value.trim();

        const reg = registros.find(r => String(r.idRecord) === String(idRecord));
        if (reg) {
            if (name) reg.userName = name;
            if (role) {
                reg.role = role;
                reg.type = role.startsWith('Ex ') ? 'demote' : 'promote';
            }
            if (country) reg.country = country;

            if (dateVal) {
                const d = new Date(dateVal);
                const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                
                reg.year = d.getFullYear().toString();
                reg.month = monthNames[d.getMonth()];
                reg.day = d.getDate().toString();
                reg.hours = d.getHours().toString().padStart(2, '0');
                reg.minutes = d.getMinutes().toString().padStart(2, '0');
                reg.dateStr = `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${reg.hours}:${reg.minutes}`;
            }

            syncUsuariosFromRegistros();
            guardarEnLocalStorage(registros, usuarios);

            renderGatekeepers();
            renderFechasTimeline();
            renderRolesTimeline();
        }

        modalEdit?.classList.add('hidden');
    });
}

export function openEditUsuarioModal(userId) {
    const userObj = usuarios.find(u => String(u.userId) === String(userId));
    if (!userObj) return;

    document.getElementById('modal-edit-user-id').value = userId;
    document.getElementById('modal-edit-user-name').value = userObj.currentName || '';
    document.getElementById('modal-edit-user-country').value = userObj.country || '';

    document.getElementById('modal-edit-user')?.classList.remove('hidden');
}

export function openDeleteRegistroModal(idRecord) {
    targetDeleteId = idRecord;
    deleteCategory = 'registro';
    document.getElementById('modal-delete-title').textContent = '¿Eliminar Registro?';
    document.getElementById('modal-delete-msg').textContent = `¿Estás seguro de eliminar este registro específico?`;
    document.getElementById('modal-delete')?.classList.remove('hidden');
}

export function openDeleteUsuarioModal(userId) {
    targetDeleteId = userId;
    deleteCategory = 'usuario';

    const userObj = usuarios.find(u => String(u.userId) === String(userId));
    const name = userObj ? userObj.currentName : userId;

    document.getElementById('modal-delete-title').textContent = '¿Eliminar Usuario e Historial?';
    document.getElementById('modal-delete-msg').textContent = `¡Atención! Se eliminará al usuario "${name}" y TODOS sus registros asociados.`;
    document.getElementById('modal-delete')?.classList.remove('hidden');
}

export function openEditRegistroModal(idRecord) {
    const reg = registros.find(r => String(r.idRecord) === String(idRecord));
    if (!reg) return;

    document.getElementById('modal-edit-id').value = reg.idRecord;
    document.getElementById('modal-edit-name').value = reg.userName;

    const currentRole = reg.role || 'Rating Advisor';
    const trigger = document.getElementById('btn-trigger-edit-role');
    const imgSelected = document.getElementById('img-selected-edit-role');
    if (trigger && imgSelected) {
        trigger.setAttribute('data-selected-role', currentRole);
        imgSelected.setAttribute('src', ROLE_ASSETS[currentRole] || 'assets/rating_advisor.png');
    }

    let formattedDate = '';
    if (reg.year && reg.month && reg.day) {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const mIdx = monthNames.indexOf(reg.month) + 1;
        const mm = String(mIdx).padStart(2, '0');
        const dd = String(reg.day).padStart(2, '0');
        const hours = reg.hours || '12';
        const minutes = reg.minutes || '00';
        formattedDate = `${reg.year}-${mm}-${dd}T${hours}:${minutes}`;
    }
    document.getElementById('modal-edit-date').value = formattedDate;
    document.getElementById('modal-edit-country').value = reg.country || '';

    document.getElementById('modal-edit')?.classList.remove('hidden');
}

/* ===================================================
   GESTOR DE TEXTOS Y ASSETS
   =================================================== */
const infoTargetMap = {
    'header_main': () => document.getElementById('display-title'),
    'header_sub': () => document.getElementById('display-subtitle'),
    'intro_about_title': () => document.querySelector('#tab-intro article h3'),
    'intro_about_desc': () => document.getElementById('desc-intro'),
    'tab_fechas_desc': () => document.getElementById('desc-fechas'),
    'tab_roles_desc': () => document.querySelector('#tab-roles article h2'),
    'tab_country_desc': () => document.querySelector('#tab-nacionalidad article p'),
    'tab_search_desc': () => document.getElementById('search-input')
};

const infoDefaults = {
    'header_main': 'GD Promoted History',
    'header_sub': 'Gatekeepers',
    'intro_about_title': 'Acerca del Documento',
    'intro_about_desc': 'Este proyecto recopila y organiza el historial completo de promociones y degradaciones dentro de la comunidad de moderación de Geometry Dash.',
    'tab_fechas_desc': 'Historial cronológico estructurado por Años, Meses y Días.',
    'tab_roles_desc': 'Filtrado por Roles',
    'tab_country_desc': 'Selecciona un país para ver los ascensos y descensos registrados en esa región:',
    'tab_search_desc': 'Buscar por Nombre Actual, Nombre Antiguo o ID de Cuenta...'
};

function setupTextManager() {
    const selectTarget = document.getElementById('admin-info-target');
    const textarea = document.getElementById('admin-info-text');
    const btnSave = document.getElementById('btn-admin-info-save');
    const btnReset = document.getElementById('btn-admin-info-reset');
    const btnClear = document.getElementById('btn-admin-info-clear');

    if (!selectTarget || !textarea) return;

    const loadCurrentText = () => {
        const key = selectTarget.value;
        const targetEl = infoTargetMap[key]?.();
        if (targetEl) {
            textarea.value = targetEl.tagName === 'INPUT' ? targetEl.placeholder : targetEl.textContent;
        }
    };

    selectTarget.addEventListener('change', loadCurrentText);
    loadCurrentText();

    btnSave?.addEventListener('click', () => {
        const key = selectTarget.value;
        const targetEl = infoTargetMap[key]?.();
        if (targetEl) {
            if (targetEl.tagName === 'INPUT') targetEl.placeholder = textarea.value;
            else targetEl.textContent = textarea.value;
            alert('Texto actualizado.');
        }
    });

    btnReset?.addEventListener('click', () => {
        const key = selectTarget.value;
        const defaultText = infoDefaults[key] || '';
        textarea.value = defaultText;
        const targetEl = infoTargetMap[key]?.();
        if (targetEl) {
            if (targetEl.tagName === 'INPUT') targetEl.placeholder = defaultText;
            else targetEl.textContent = defaultText;
        }
    });

    btnClear?.addEventListener('click', () => {
        textarea.value = '';
        const key = selectTarget.value;
        const targetEl = infoTargetMap[key]?.();
        if (targetEl) {
            if (targetEl.tagName === 'INPUT') targetEl.placeholder = '';
            else targetEl.textContent = '';
        }
    });
}

function setupAssetSelector() {
    const btnTrigger = document.getElementById('btn-trigger-asset-select');
    const popup = document.getElementById('popup-asset-select');
    const imgSelected = document.getElementById('img-selected-asset');
    const lblSelected = document.getElementById('lbl-selected-asset');
    const inputUrl = document.getElementById('admin-asset-url');
    const btnSave = document.getElementById('btn-admin-asset-save');
    const btnReset = document.getElementById('btn-admin-asset-reset');

    if (!btnTrigger || !popup) return;

    btnTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        popup.classList.toggle('hidden');
    });

    popup.querySelectorAll('.asset-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const assetName = btn.getAttribute('data-asset');
            btnTrigger.setAttribute('data-selected-asset', assetName);
            if (lblSelected) lblSelected.textContent = assetName;
            if (imgSelected) imgSelected.src = assetPaths[assetName] || `assets/${assetName}`;
            popup.classList.add('hidden');
        });
    });

    btnSave?.addEventListener('click', () => {
        const assetName = btnTrigger.getAttribute('data-selected-asset');
        const newUrl = inputUrl.value.trim();
        if (!newUrl) return alert('Ingresa una ruta o URL válida.');

        assetPaths[assetName] = newUrl;
        document.querySelectorAll(`img[src*="${assetName}"]`).forEach(img => img.src = newUrl);
        if (imgSelected) imgSelected.src = newUrl;
        alert(`Asset ${assetName} actualizado.`);
    });

    btnReset?.addEventListener('click', () => {
        const assetName = btnTrigger.getAttribute('data-selected-asset');
        const defaultUrl = `assets/${assetName}`;
        assetPaths[assetName] = defaultUrl;
        document.querySelectorAll(`img[src*="${assetName}"]`).forEach(img => img.src = defaultUrl);
        if (imgSelected) imgSelected.src = defaultUrl;
        if (inputUrl) inputUrl.value = '';
        alert(`Asset ${assetName} restablecido.`);
    });
}