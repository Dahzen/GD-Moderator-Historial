// ui.js
import { assetPaths } from './config.js';
import { 
    renderFechasTimeline as renderFechasComponent, 
    renderSearchResults as renderSearchComponent, 
    renderSimpleList,
    getRoleBadge,
    isPromoteRole
} from './render.js';
import { 
    registros, 
    usuarios, 
    currentFechasYear, 
    fechasFilterState, 
    currentRoleFilter, 
    useOldBadgeInRoles,
    setCurrentFechasYear,
    setFechasFilterState,
    setCurrentRoleFilter,
    setUseOldBadgeInRoles
} from './state.js';
import { openEditRegistroModal, openDeleteRegistroModal, openDeleteUsuarioModal } from './admin.js';

let datesOrder = 'desc';
export let isAdminModeActive = false;
export let previousTabBeforeEdit = 'tab-intro';

export function setIsAdminModeActive(val) {
    isAdminModeActive = val;
    renderGatekeepers();
    renderFechasTimeline();
    renderRolesTimeline();
}

export function setDatesOrder(order) {
    datesOrder = order;
    renderFechasTimeline();
}

export function switchTab(tabId) {
    if (tabId !== 'tab-ajustes') {
        previousTabBeforeEdit = tabId;
    }

    // Alternar contenedores visuales
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    document.getElementById(tabId)?.classList.add("active");

    // Sincronizar botones activos en la barra de navegación
    document.querySelectorAll(".nav-btn").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Actualizar subtítulo del encabezado
    const subTitleEl = document.getElementById("display-subtitle");
    if (subTitleEl) {
        const tabTitles = {
            'tab-intro': 'Gatekeepers',
            'tab-fechas': 'Fechas',
            'tab-roles': 'Roles',
            'tab-nacionalidad': 'Nacionalidad',
            'tab-buscador': 'Buscador',
            'tab-otros': 'Otros',
            'tab-ajustes': 'Ajustes'
        };
        subTitleEl.textContent = tabTitles[tabId] || 'Gatekeepers';
    }

    if (tabId === "tab-intro") renderGatekeepers();
    if (tabId === "tab-fechas") renderFechasTimeline();
    if (tabId === "tab-roles") renderRolesTimeline();
    if (tabId === "tab-nacionalidad") renderNacionalidades();
    if (tabId === "tab-otros") renderEstadisticas();
}

export function selectFechasFilter(year) {
    setCurrentFechasYear(year);
    switchTab("tab-fechas");
}

export function cycleFechasFilterMode() {
    const nextState = (fechasFilterState + 1) % 3;
    setFechasFilterState(nextState);

    const imgBtn = document.getElementById("img-toggle-fechas");
    const labelBtn = document.getElementById("label-toggle-fechas");

    if (fechasFilterState === 0) {
        if (imgBtn) imgBtn.src = assetPaths["rating_advisor.png"] || "assets/rating_advisor.png";
        if (labelBtn) labelBtn.textContent = "Ver solo Ascensos";
    } else if (fechasFilterState === 1) {
        if (imgBtn) imgBtn.src = assetPaths["ex_rating_advisor.png"] || "assets/ex_rating_advisor.png";
        if (labelBtn) labelBtn.textContent = "Ver solo Descensos";
    } else if (fechasFilterState === 2) {
        if (imgBtn) imgBtn.src = assetPaths["moderator.png"] || "assets/moderator.png";
        if (labelBtn) labelBtn.textContent = "Ver todos los registros";
    }
    renderFechasTimeline();
}

export function renderFechasTimeline() {
    const container = document.getElementById("fechas-timeline-container");
    if (!container) return;

    let filtered = registros.filter(item => {
        if (currentFechasYear !== "all" && String(item.year) !== String(currentFechasYear)) return false;
        const isPromote = item.type === "promote" || isPromoteRole(item.role);

        if (fechasFilterState === 1 && !isPromote) return false;
        if (fechasFilterState === 2 && isPromote) return false;
        
        return true;
    }).map(item => ({
        ...item,
        id: item.idRecord,
        name: item.userName,
        date: `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`
    }));

    filtered.sort((a, b) => {
        const dateA = new Date(a.year, getMonthIndex(a.month), a.day || 1);
        const dateB = new Date(b.year, getMonthIndex(b.month), b.day || 1);
        return datesOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    renderFechasComponent(container, filtered, datesOrder, isAdminModeActive);
    attachCardEvents(container);
}

export function selectRolesFilter(role) {
    setCurrentRoleFilter(role);
    switchTab("tab-roles");
}

export function toggleOldBadgeView() {
    setUseOldBadgeInRoles(!useOldBadgeInRoles);

    const imgToggle = document.getElementById("img-old-badge-toggle");
    const lblToggle = document.getElementById("lbl-old-badge-toggle");

    if (useOldBadgeInRoles) {
        if (imgToggle) imgToggle.src = assetPaths["rating_advisor.png"] || "assets/rating_advisor.png";
        if (lblToggle) lblToggle.textContent = "Ver con Insignia Actual";
    } else {
        if (imgToggle) imgToggle.src = assetPaths["old_badge.png"] || "assets/old_badge.png";
        if (lblToggle) lblToggle.textContent = "Ver con Insignia Antigua";
    }

    renderRolesTimeline();
}

export function renderRolesTimeline() {
    const container = document.getElementById("roles-timeline-container");
    const oldBadgeWrapper = document.getElementById("old-badge-wrapper");
    if (!container) return;

    if (oldBadgeWrapper) {
        const isAdvisorOrAll = (currentRoleFilter === "all" || currentRoleFilter.toLowerCase() === "rating advisor");
        oldBadgeWrapper.classList.toggle("hidden", !isAdvisorOrAll);
    }

    let filtered = registros.filter(i => {
        if (currentRoleFilter === "all") return true;
        return i.role.toLowerCase() === currentRoleFilter.toLowerCase();
    }).map(item => ({
        ...item,
        id: item.idRecord,
        name: item.userName,
        date: item.dateStr || `${item.day}/${item.month}/${item.year}`,
        useOldBadge: useOldBadgeInRoles
    }));

    renderSimpleList(container, filtered, isAdminModeActive);
    attachCardEvents(container);
}

export function renderNacionalidades() {
    const grid = document.getElementById("country-grid");
    if (!grid) return;
    grid.innerHTML = "";

    let countries = [...new Set(registros.map(i => i.country).filter(Boolean))];
    countries.forEach(c => {
        let btn = document.createElement("button");
        btn.className = "country-btn";
        btn.textContent = c;
        btn.onclick = () => showCountryRecords(c);
        grid.appendChild(btn);
    });
}

export function showCountryRecords(country) {
    const container = document.getElementById("country-timeline-container");
    if (!container) return;

    let records = registros
        .filter(i => i.country === country)
        .map(item => ({
            ...item,
            id: item.idRecord,
            name: item.userName,
            date: item.dateStr || `${item.day}/${item.month}/${item.year}`
        }));

    container.innerHTML = `<h3 style="color:var(--border-glow); margin-bottom: 0.8rem;">Registros de: ${country}</h3>`;
    
    let listWrapper = document.createElement("div");
    renderSimpleList(listWrapper, records, isAdminModeActive);
    container.appendChild(listWrapper);
    attachCardEvents(listWrapper);
}

export function executeSearch() {
    const input = document.getElementById("search-input");
    const container = document.getElementById("search-results-container");
    if (!input || !container) return;

    const q = input.value.toLowerCase().trim();
    if (!q) {
        container.innerHTML = "";
        return;
    }

    let results = registros.filter(i => 
        (i.userName && i.userName.toLowerCase().includes(q)) || 
        String(i.userId).includes(q)
    ).map(item => {
        const u = usuarios.find(usr => String(usr.userId) === String(item.userId));
        return {
            ...item,
            id: item.idRecord,
            name: item.userName,
            previousNames: u ? u.oldNames : [],
            date: item.dateStr || `${item.day}/${item.month}/${item.year}`
        };
    });

    renderSearchComponent(container, results, isAdminModeActive);
    attachCardEvents(container);
}

export function renderEstadisticas() {
    const totalProm = document.getElementById("stat-total-promotes");
    const totalDem = document.getElementById("stat-total-demotes");

    if (totalProm) totalProm.textContent = registros.filter(i => i.type === "promote" || isPromoteRole(i.role)).length;
    if (totalDem) totalDem.textContent = registros.filter(i => i.type === "demote" || !isPromoteRole(i.role)).length;

    const breakdown = document.getElementById("stats-yearly-breakdown");
    if (!breakdown) return;
    breakdown.innerHTML = "";

    let yearlyCount = {};
    registros.forEach(i => {
        if (!yearlyCount[i.year]) yearlyCount[i.year] = { promote: 0, demote: 0 };
        const isPromote = i.type === "promote" || isPromoteRole(i.role);
        if (isPromote) yearlyCount[i.year].promote++;
        else yearlyCount[i.year].demote++;
    });

    Object.keys(yearlyCount).forEach(yr => {
        let div = document.createElement("div");
        div.style.marginBottom = "0.8rem";
        div.innerHTML = `
            <strong>Año ${yr}:</strong> 
            <span style="color:var(--accent-green)">${yearlyCount[yr].promote} Ascensos</span> | 
            <span style="color:var(--accent-red)">${yearlyCount[yr].demote} Descensos</span>
        `;
        breakdown.appendChild(div);
    });
}

// RENDEREAR USUARIOS EN LA PESTAÑA GATEKEEPERS (CON ID DE JUGADOR SIEMPRE VISIBLE)
export function renderGatekeepers() {
    const mList = document.getElementById("gk-list-moderators");
    const aList = document.getElementById("gk-list-advisors");
    const lList = document.getElementById("gk-list-lbmods");

    if (!mList) return;
    mList.innerHTML = ""; if (aList) aList.innerHTML = ""; if (lList) lList.innerHTML = "";

    usuarios.forEach(u => {
        let item = document.createElement("div");
        item.className = "gk-item";

        let deleteBtn = '';
        if (isAdminModeActive) {
            deleteBtn = `
                <button class="btn-card-action btn-delete-user" data-userid="${u.userId}" title="Eliminar usuario y TODO su historial" style="margin-left:auto;">
                    <img src="assets/delete.png" alt="Eliminar Usuario">
                </button>
            `;
        }

        const oldNamesText = u.oldNames && u.oldNames.length > 0 ? `<div style="font-size:0.75rem; color:var(--text-muted)">Antes: ${u.oldNames.join(", ")}</div>` : '';

        item.innerHTML = `
            <img src="${getRoleBadge(u.currentRole)}" class="badge-img" alt="${u.currentRole}" title="${u.currentRole}">
            <div>
                <strong>${u.currentName}</strong> <span style="font-size:0.85rem; color:var(--text-muted);">(ID: ${u.userId})</span>
                <div style="font-size:0.8rem; color:var(--text-muted)">País: ${u.country}</div>
                ${oldNamesText}
            </div>
            ${deleteBtn}
        `;

        if (u.currentRole === "Moderator") mList.appendChild(item);
        else if (u.currentRole === "Rating Advisor" && aList) aList.appendChild(item);
        else if (u.currentRole === "Leaderboard Mod" && lList) lList.appendChild(item);
    });

    // Eventos para eliminar usuario
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const uId = btn.getAttribute('data-userid');
            openDeleteUsuarioModal(uId);
        };
    });
}

// Adjuntar eventos de Editar/Eliminar en las tarjetas de registros
function attachCardEvents(parent) {
    parent.querySelectorAll('.btn-edit-record').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            openEditRegistroModal(id);
        };
    });

    parent.querySelectorAll('.btn-delete-record').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            openDeleteRegistroModal(id);
        };
    });
}

function getMonthIndex(monthName) {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const idx = months.indexOf(monthName);
    return idx !== -1 ? idx : 0;
}

// AJUSTES RÁPIDOS
export function changeFontSize(sz) { document.documentElement.style.setProperty('--base-font-size', sz); }
export function changeTheme(th) { document.body.className = th === 'light' ? 'theme-light' : 'theme-dark'; }
export function changeFontFamily(fn) { document.body.style.fontFamily = fn; }