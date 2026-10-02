// admin.js
import { assetPaths } from './config.js';
import { historyData, gatekeepersList } from './state.js';
import { renderGatekeepers, renderFechasTimeline, renderRolesTimeline } from './ui.js';
import { guardarEnLocalStorage } from './storage.js';

export function toggleAdminPanel(enabled) {
    document.getElementById("admin-panel")?.classList.toggle("hidden", !enabled);
}

/* ===================================================
   INICIALIZACIÓN Y SELECTORES
   =================================================== */

export function setupRoleSelectors() {
    // Configurar desplegables de roles (Editar y Agregar)
    setupSingleSelector("btn-trigger-edit-role", "popup-edit-role", "img-selected-edit-role");
    setupSingleSelector("btn-trigger-add-role", "popup-add-role", "img-selected-add-role");

    // Inicializar los dos nuevos módulos reworked
    setupTextManager();
    setupAssetSelector();
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
   1. GESTOR DE TEXTOS E INFORMACIÓN
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
    'intro_about_desc': 'Este proyecto recopila y organiza el historial completo de promociones y degradaciones dentro de la comunidad de moderación de Geometry Dash. Aquí podrás consultar registros detallados por año, mes, rol y nacionalidad de cada moderador.',
    'intro_gk_title': 'GD Gatekeepers',
    'tab_fechas_desc': 'Historial cronológico estructurado por Años, Meses y Días. Utiliza el botón interactivo para filtrar entre ascensos, descensos o ver el registro completo.',
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

    // Cargar el texto actual que hay en el DOM al cambiar de sección
    const loadCurrentText = () => {
        const key = selectTarget.value;
        const targetEl = infoTargetMap[key]?.();
        if (targetEl) {
            textarea.value = targetEl.tagName === 'INPUT' ? targetEl.placeholder : targetEl.textContent;
        }
    };

    selectTarget.addEventListener('change', loadCurrentText);
    loadCurrentText();

    // Guardar cambios en el DOM
    btnSave?.addEventListener('click', () => {
        const key = selectTarget.value;
        const targetEl = infoTargetMap[key]?.();
        if (targetEl) {
            if (targetEl.tagName === 'INPUT') {
                targetEl.placeholder = textarea.value;
            } else {
                targetEl.textContent = textarea.value;
            }
            alert('Texto actualizado correctamente.');
        }
    });

    // Restablecer texto por defecto
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

    // Vaciar / ocultar texto
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

/* ===================================================
   2. MODIFICAR ASSETS / ICONOS (CON SELECTOR CUSTOM)
   =================================================== */

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

    // Actualizar asset a nueva ruta o URL
    btnSave?.addEventListener('click', () => {
        const assetName = btnTrigger.getAttribute('data-selected-asset');
        const newUrl = inputUrl.value.trim();
        
        if (!newUrl) return alert('Ingresa una ruta o URL válida.');

        assetPaths[assetName] = newUrl;
        
        // Reemplazar todas las coincidencias en el DOM en tiempo real
        document.querySelectorAll(`img[src*="${assetName}"]`).forEach(img => {
            img.src = newUrl;
        });

        if (imgSelected) imgSelected.src = newUrl;
        alert(`Asset ${assetName} actualizado exitosamente.`);
    });

    // Restablecer asset a su ruta local por defecto
    btnReset?.addEventListener('click', () => {
        const assetName = btnTrigger.getAttribute('data-selected-asset');
        const defaultUrl = `assets/${assetName}`;
        assetPaths[assetName] = defaultUrl;

        document.querySelectorAll(`img[src*="${assetName}"]`).forEach(img => {
            img.src = defaultUrl;
        });

        if (imgSelected) imgSelected.src = defaultUrl;
        if (inputUrl) inputUrl.value = '';
        alert(`Asset ${assetName} restablecido a su valor por defecto.`);
    });
}

/* ===================================================
   3. GESTIÓN DE MIEMBROS (EDITAR, AGREGAR, ELIMINAR)
   =================================================== */

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

    if (!id) return alert("Por favor ingresa el ID del miembro a eliminar.");

    let historyIndex = historyData.findIndex(item => String(item.id) === id);
    let gkIndex = gatekeepersList.findIndex(item => String(item.id) === id);

    if (historyIndex === -1 && gkIndex === -1) {
        return alert(`No se encontró ningún registro o moderador con el ID: ${id}`);
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