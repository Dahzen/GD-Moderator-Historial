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
    historyData, 
    gatekeepersList, 
    currentFechasYear, 
    fechasFilterState, 
    currentRoleFilter, 
    useOldBadgeInRoles,
    setCurrentFechasYear,
    setFechasFilterState,
    setCurrentRoleFilter,
    setUseOldBadgeInRoles
} from './state.js';

let datesOrder = 'desc'; // 'desc' = Reciente a Antigua, 'asc' = Antigua a Reciente

export function setDatesOrder(order) {
    datesOrder = order;
    renderFechasTimeline();
}

// Cambio de Pestañas Principales
export function switchTab(tabId) {
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    document.getElementById(tabId)?.classList.add("active");

    if (tabId === "tab-fechas") renderFechasTimeline();
    if (tabId === "tab-roles") renderRolesTimeline();
    if (tabId === "tab-nacionalidad") renderNacionalidades();
    if (tabId === "tab-otros") renderEstadisticas();
}

// 1. FECHAS
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

    let filtered = historyData.filter(item => {
        if (currentFechasYear !== "all" && String(item.year) !== String(currentFechasYear)) return false;
        
        const isPromote = isPromoteRole(item.role);

        if (fechasFilterState === 1 && !isPromote) return false;
        if (fechasFilterState === 2 && isPromote) return false;
        
        return true;
    }).map(item => ({
        ...item,
        name: item.user || item.name,
        date: `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`
    }));

    filtered.sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1, a.day || 1);
        const dateB = new Date(b.year, b.month - 1, b.day || 1);
        return datesOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    renderFechasComponent(container, filtered, datesOrder);
}

// 2. ROLES
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

    let filtered = historyData.filter(i => {
        if (currentRoleFilter === "all") return true;
        return i.role.toLowerCase() === currentRoleFilter.toLowerCase();
    }).map(item => ({
        ...item,
        name: item.user || item.name,
        date: item.dateStr || `${item.day}/${item.month}/${item.year}`,
        useOldBadge: useOldBadgeInRoles
    }));

    renderSimpleList(container, filtered);
}

// 3. NACIONALIDAD
export function renderNacionalidades() {
    const grid = document.getElementById("country-grid");
    if (!grid) return;
    grid.innerHTML = "";

    let countries = [...new Set(historyData.map(i => i.country))];
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

    let records = historyData
        .filter(i => i.country === country)
        .map(item => ({
            ...item,
            name: item.user || item.name,
            date: item.dateStr || `${item.day}/${item.month}/${item.year}`
        }));

    container.innerHTML = `<h3 style="color:var(--border-glow); margin-bottom: 0.8rem;">Registros de: ${country}</h3>`;
    
    let listWrapper = document.createElement("div");
    renderSimpleList(listWrapper, records);
    container.appendChild(listWrapper);
}

// 4. BUSCADOR
export function executeSearch() {
    const input = document.getElementById("search-input");
    const container = document.getElementById("search-results-container");
    if (!input || !container) return;

    const q = input.value.toLowerCase().trim();
    if (!q) {
        container.innerHTML = "";
        return;
    }

    let results = historyData.filter(i => 
        (i.user && i.user.toLowerCase().includes(q)) || 
        (i.name && i.name.toLowerCase().includes(q)) || 
        String(i.id).includes(q) || 
        (i.oldNames && i.oldNames.some(old => old.toLowerCase().includes(q)))
    ).map(item => ({
        ...item,
        name: item.user || item.name,
        previousNames: item.oldNames,
        date: item.dateStr || `${item.day}/${item.month}/${item.year}`
    }));

    renderSearchComponent(container, results);
}

// 5. OTROS / ESTADÍSTICAS
export function renderEstadisticas() {
    const totalProm = document.getElementById("stat-total-promotes");
    const totalDem = document.getElementById("stat-total-demotes");
    if (totalProm) totalProm.textContent = historyData.filter(i => isPromoteRole(i.role)).length;
    if (totalDem) totalDem.textContent = historyData.filter(i => !isPromoteRole(i.role)).length;

    const breakdown = document.getElementById("stats-yearly-breakdown");
    if (!breakdown) return;
    breakdown.innerHTML = "";

    let yearlyCount = {};
    historyData.forEach(i => {
        if (!yearlyCount[i.year]) yearlyCount[i.year] = { promote: 0, demote: 0 };
        const isPromote = isPromoteRole(i.role);
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

// GATEKEEPERS EN INTRODUCCIÓN
export function renderGatekeepers() {
    const mList = document.getElementById("gk-list-moderators");
    const aList = document.getElementById("gk-list-advisors");
    const lList = document.getElementById("gk-list-lbmods");

    if (!mList) return;
    mList.innerHTML = ""; if (aList) aList.innerHTML = ""; if (lList) lList.innerHTML = "";

    gatekeepersList.forEach(gk => {
        let item = document.createElement("div");
        item.className = "gk-item";
        item.innerHTML = `
            <img src="${getRoleBadge(gk.role)}" class="badge-img" alt="${gk.role}" title="${gk.role}">
            <div>
                <strong>${gk.name || gk.user}</strong>
                <div style="font-size:0.8rem; color:var(--text-muted)">ID: ${gk.id}</div>
            </div>
        `;
        if (gk.role === "Moderator") mList.appendChild(item);
        else if (gk.role === "Rating Advisor" && aList) aList.appendChild(item);
        else if (gk.role === "Leaderboard Mod" && lList) lList.appendChild(item);
    });
}

// AJUSTES RÁPIDOS
export function changeFontSize(sz) { document.documentElement.style.setProperty('--base-font-size', sz); }
export function changeTheme(th) { document.body.className = th === 'light' ? 'theme-light' : 'theme-dark'; }
export function changeFontFamily(fn) { document.body.style.fontFamily = fn; }