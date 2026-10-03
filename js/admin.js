// admin.js
import { assetPaths } from './config.js';
import { historyData, gatekeepersList } from './state.js';
import { renderGatekeepers, renderFechasTimeline, renderRolesTimeline, setIsAdminModeActive } from './ui.js';
import { guardarEnLocalStorage } from './storage.js';

let itemToDeleteId = null;
let deleteType = null; // 'record' o 'member'

export function toggleAdminPanel(enabled) {
    document.getElementById("admin-panel")?.classList.toggle("hidden", !enabled);
    setIsAdminModeActive(enabled);
}

export function setupRoleSelectors() {
    setupSingleSelector("btn-trigger-add-role", "popup-add-role", "img-selected-add-role");
    setupTextManager();
    setupAssetSelector();
    setupModalEvents();
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

    document.addEventListener("click", () => popup.classList.add("hidden"));
}

/* ===================================================
   GESTIÓN DE MODALES CUSTOM (EDITAR Y ELIMINAR)
   =================================================== */

function setupModalEvents() {
    // Modales
    const modalDelete = document.getElementById('modal-delete');
    const modalEdit = document.getElementById('modal-edit');

    // Botones Cancelar
    document.getElementById('btn-modal-cancel-delete')?.addEventListener('click', () => {
        modalDelete?.classList.add('hidden');
    });

    document.getElementById('btn-modal-cancel-edit')?.addEventListener('click', () => {
        modalEdit?.classList.add('hidden');
    });

    // Confirmar Eliminar
    document.getElementById('btn-modal-confirm-delete')?.addEventListener('click', () => {
        if (!itemToDeleteId) return;

        if (deleteType === 'record') {
            const idx = historyData.findIndex(i => String(i.id) === String(itemToDeleteId));
            if (idx !== -1) historyData.splice(idx, 1);
        } else if (deleteType === 'member') {
            const idx = gatekeepersList.findIndex(i => String(i.id) === String(itemToDeleteId));
            if (idx !== -1) gatekeepersList.splice(idx, 1);
        }

        guardarEnLocalStorage(historyData, gatekeepersList);
        renderGatekeepers();
        renderFechasTimeline();
        renderRolesTimeline();

        modalDelete?.classList.add('hidden');
    });

    // Guardar Edición
    document.getElementById('btn-modal-save-edit')?.addEventListener('click', () => {
        const id = document.getElementById('modal-edit-id').value;
        const name = document.getElementById('modal-edit-name').value.trim();
        const role = document.getElementById('modal-edit-role').value;
        const dateVal = document.getElementById('modal-edit-date').value;
        const country = document.getElementById('modal-edit-country').value.trim();

        const target = historyData.find(i => String(i.id) === String(id));
        if (target) {
            if (name) target.user = name;
            if (role) target.role = role;
            if (country) target.country = country;

            if (dateVal) {
                const d = new Date(dateVal);
                const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                
                target.year = d.getFullYear().toString();
                target.month = monthNames[d.getMonth()];
                target.day = d.getDate().toString();

                const hours = d.getHours().toString().padStart(2, '0');
                const minutes = d.getMinutes().toString().padStart(2, '0');
                target.dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()} ${hours}:${minutes}`;
            }

            guardarEnLocalStorage(historyData, gatekeepersList);
            renderFechasTimeline();
            renderRolesTimeline();
        }

        modalEdit?.classList.add('hidden');
    });
}

// Abrir Modal de Confirmación para Eliminar
export function quickDeleteRecord(id) {
    itemToDeleteId = id;
    deleteType = 'record';
    document.getElementById('modal-delete-title').textContent = '¿Eliminar Registro?';
    document.getElementById('modal-delete-msg').textContent = `¿Estás seguro de eliminar este registro histórico (ID: ${id})?`;
    document.getElementById('modal-delete')?.classList.remove('hidden');
}

export function quickDeleteMember(id) {
    itemToDeleteId = id;
    deleteType = 'member';
    document.getElementById('modal-delete-title').textContent = '¿Eliminar Miembro?';
    document.getElementById('modal-delete-msg').textContent = `¿Estás seguro de eliminar a este miembro de Gatekeepers (ID: ${id})?`;
    document.getElementById('modal-delete')?.classList.remove('hidden');
}

// Abrir Modal de Edición
export function prepareEditMember(id) {
    const target = historyData.find(i => String(i.id) === String(id));
    if (!target) return;

    document.getElementById('modal-edit-id').value = target.id;
    document.getElementById('modal-edit-name').value = target.user || target.name || '';
    document.getElementById('modal-edit-role').value = target.role || 'Rating Advisor';
    document.getElementById('modal-edit-country').value = target.country || '';

    document.getElementById('modal-edit')?.classList.remove('hidden');
}

/* ===================================================
   GESTOR DE TEXTOS Y ASSETS (MANTIENE FUNCIONALIDAD)
   =================================================== */
const infoTargetMap = {
    'header_main': () => document.getElementById('display-title'),
    'header_sub': () => document.getElementById('display-subtitle'),
    'intro_about_title': () => document.querySelector('#tab-intro article h3'),
    'intro_about_desc': () => document.getElementById('desc-intro'),
    'intro_gk_title': () => document.querySelector('#tab-intro section h2'),
    'tab_fechas_desc': () => document.getElementById('desc-fechas'),
    'tab_roles_desc': () => document.querySelector('#tab-roles article h2'),
    'tab_country_desc': () => document.querySelector('#tab-nacionalidad article p'),
    'tab_search_desc': () => document.getElementById('search-input')
};

const infoDefaults = {
    'header_main': 'GD Promoted History',
    'header_sub': 'Introducción',
    'intro_about_title': 'Acerca del Documento',
    'intro_about_desc': 'Este proyecto recopila y organiza el historial completo de promociones y degradaciones dentro de la comunidad de moderación de Geometry Dash.',
    'intro_gk_title': 'GD Gatekeepers',
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

export function adminAddMember() {
    let role = document.getElementById("btn-trigger-add-role")?.getAttribute("data-selected-role");
    let name = document.getElementById("add-name")?.value.trim();
    let id = document.getElementById("add-id")?.value.trim();
    let dateVal = document.getElementById("add-date")?.value;
    let country = document.getElementById("add-country")?.value.trim() || "Global";

    if (!name || !id || !dateVal || !role) return alert("Completa los campos requeridos.");

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