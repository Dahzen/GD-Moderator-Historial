// script.js
import { SPRITESHEETS, SPRITE_MAPPINGS, fallbackBadges } from './js/config.js';
import { initSpriteSheets, getSpriteImage } from './js/spriteSheet.js';

// Base de datos local
let gatekeepersList = [];
let historyData = [];

// Estados de navegación y filtros
let currentFechasYear = "all";
let fechasFilterState = 0; // 0: Todos, 1: Solo Ascensos, 2: Solo Descensos
let currentRoleFilter = "all";
let useOldBadgeInRoles = false;

// Retorna el elemento HTML en string generado desde el Canvas del spritesheet
function getBadgeHTML(role, useOld = false) {
    let key = role;
    if (role === "Rating Advisor" && useOld) {
        key = "badge_old";
    }

    const spriteImg = getSpriteImage(key, 24, "badge-img");
    return spriteImg.outerHTML;
}

// Inyecta los sprites oficiales en la botonera de la barra superior
function setupNavbarIcons() {
    const navButtons = [
        { id: "btn-gatekeepers", key: "nav_gatekeepers" },
        { id: "btn-fechas", key: "nav_fechas" },
        { id: "btn-roles", key: "nav_roles" },
        { id: "btn-nacionalidad", key: "nav_nacionalidad" },
        { id: "btn-buscador", key: "nav_buscador" },
        { id: "btn-otros", key: "nav_otros" },
        { id: "btn-ajustes", key: "nav_ajustes" }
    ];

    navButtons.forEach(item => {
        const btn = document.getElementById(item.id);
        if (!btn) return;

        const sprite = getSpriteImage(item.key, 18, "icon-small");
        const existingImg = btn.querySelector("img");
        if (existingImg) {
            existingImg.replaceWith(sprite);
        } else {
            btn.prepend(sprite);
        }
    });

    // Botón flotante Admin
    const adminToggle = document.getElementById("btn-side-admin-toggle");
    if (adminToggle) {
        adminToggle.innerHTML = "";
        adminToggle.appendChild(getSpriteImage("admin_gear", 24, "icon-small"));
    }

    // Iconos de los toggles de filtros
    updateFilterToggleIcons();
}

function updateFilterToggleIcons() {
    const slotFechas = document.getElementById("img-toggle-fechas-slot");
    if (slotFechas) {
        slotFechas.innerHTML = "";
        let role = (fechasFilterState === 2) ? "Leaderboard Mod" : (fechasFilterState === 1 ? "Moderator" : "Rating Advisor");
        slotFechas.appendChild(getSpriteImage(role, 20, "badge-img"));
    }

    const slotOld = document.getElementById("img-old-badge-toggle-slot");
    if (slotOld) {
        slotOld.innerHTML = "";
        slotOld.appendChild(getSpriteImage(useOldBadgeInRoles ? "Moderator" : "Rating Advisor", 20, "badge-img"));
    }
}

function guardarEnLocalStorage() {
    localStorage.setItem("historyData", JSON.stringify(historyData));
    localStorage.setItem("gatekeepersList", JSON.stringify(gatekeepersList));
}

async function cargarDatosJSON() {
    try {
        // 1. Inicializar y precargar las 3 hojas de Geometry Dash
        await initSpriteSheets();
        setupNavbarIcons();

        // 2. Cargar datos del historial
        const localHistory = localStorage.getItem("historyData");
        const localGatekeepers = localStorage.getItem("gatekeepersList");

        if (localHistory && localGatekeepers) {
            historyData = JSON.parse(localHistory);
            gatekeepersList = JSON.parse(localGatekeepers);
        } else {
            const [resGeneral, resNaciones, resFechas] = await Promise.all([
                fetch('data/registro_general.json'),
                fetch('data/nacionalidad.json'),
                fetch('data/fechas_ascensos.json')
            ]);

            const generalData = await resGeneral.json();
            const nacionesData = await resNaciones.json();
            const fechasData = await resFechas.json();

            gatekeepersList = generalData.map(u => ({
                name: u.name,
                id: u.id,
                role: u.role
            }));

            historyData = fechasData.map(f => {
                const userGeneral = generalData.find(g => g.id === f.id) || {};
                const userNacion = nacionesData.find(n => n.id === f.id) || {};

                return {
                    year: f.year,
                    month: f.month,
                    day: f.day,
                    dateStr: f.dateStr,
                    user: f.user || userGeneral.name,
                    oldNames: userGeneral.oldNames || [],
                    id: f.id,
                    role: f.role,
                    type: f.type,
                    country: userNacion.country || "Global"
                };
            });

            guardarEnLocalStorage();
        }

        renderGatekeepers();
        renderFechasTimeline();
        renderRolesTimeline();

    } catch (error) {
        console.error("Error al inicializar la base de datos o spritesheets:", error);
    }
    
}

// Cambio de pestañas
function switchTab(tabId) {
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add("active");

    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    if (tabId === "tab-fechas") renderFechasTimeline();
    if (tabId === "tab-roles") renderRolesTimeline();
    if (tabId === "tab-nacionalidad") renderNacionalidades();
    if (tabId === "tab-otros") renderEstadisticas();
}

// 1. FECHAS
function selectFechasFilter(year) {
    currentFechasYear = year;
    switchTab("tab-fechas");
}

function cycleFechasFilterMode() {
    fechasFilterState = (fechasFilterState + 1) % 3;
    const labelBtn = document.getElementById("label-toggle-fechas");

    if (fechasFilterState === 0 && labelBtn) labelBtn.textContent = "Ver solo Ascensos";
    if (fechasFilterState === 1 && labelBtn) labelBtn.textContent = "Ver solo Descensos";
    if (fechasFilterState === 2 && labelBtn) labelBtn.textContent = "Ver todos los registros";

    updateFilterToggleIcons();
    renderFechasTimeline();
}

function renderFechasTimeline() {
    const container = document.getElementById("fechas-timeline-container");
    if (!container) return;
    container.innerHTML = "";

    const order = document.getElementById("select-dates-order")?.value || "desc";

    let list = historyData.filter(item => {
        if (currentFechasYear !== "all" && item.year !== currentFechasYear) return false;
        if (fechasFilterState === 1 && item.type !== "promote") return false;
        if (fechasFilterState === 2 && item.type !== "demote") return false;
        return true;
    });

    if (list.length === 0) {
        container.innerHTML = "<div class='content-card'><p>No hay registros para este filtro.</p></div>";
        return;
    }

    let grouped = {};
    list.forEach(item => {
        if (!grouped[item.year]) grouped[item.year] = {};
        if (!grouped[item.year][item.month]) grouped[item.year][item.month] = [];
        grouped[item.year][item.month].push(item);
    });

    let years = Object.keys(grouped);
    if (order === "desc") years.sort((a, b) => b - a);
    else years.sort((a, b) => a - b);

    years.forEach(yr => {
        let yearDiv = document.createElement("div");
        yearDiv.className = "year-block";
        yearDiv.innerHTML = `<h2 class="year-title">Año ${yr}</h2>`;

        Object.keys(grouped[yr]).forEach(mth => {
            let monthDiv = document.createElement("div");
            monthDiv.className = "month-block";
            monthDiv.innerHTML = `<h3 class="month-title">${mth}</h3>`;

            grouped[yr][mth].forEach(rec => {
                let recDiv = document.createElement("div");
                recDiv.className = `record-item ${rec.type === 'promote' ? 'record-promote' : 'record-demote'}`;
                recDiv.innerHTML = `
                    ${getBadgeHTML(rec.role)}
                    <div>
                        <strong>Día ${rec.day}</strong> - <strong>${rec.user}</strong> (ID: ${rec.id}) 
                        - <span style="color:${rec.type === 'promote' ? 'var(--accent-green)' : 'var(--accent-red)'}">
                            ${rec.type === 'promote' ? 'ASCENSO' : 'DESCENSO'}
                          </span> 
                        [${rec.role}]
                    </div>
                `;
                monthDiv.appendChild(recDiv);
            });
            yearDiv.appendChild(monthDiv);
        });
        container.appendChild(yearDiv);
    });
}

// 2. ROLES
function selectRolesFilter(role) {
    currentRoleFilter = role;
    switchTab("tab-roles");
}

function toggleOldBadgeView() {
    useOldBadgeInRoles = !useOldBadgeInRoles;
    const lblToggle = document.getElementById("lbl-old-badge-toggle");
    if (lblToggle) {
        lblToggle.textContent = useOldBadgeInRoles ? "Ver con Insignia Actual" : "Ver con Insignia Antigua";
    }
    updateFilterToggleIcons();
    renderRolesTimeline();
}

function renderRolesTimeline() {
    const container = document.getElementById("roles-timeline-container");
    const oldBadgeWrapper = document.getElementById("old-badge-wrapper");
    if (!container) return;
    container.innerHTML = "";

    if (oldBadgeWrapper) {
        const isAdvisorOrAll = (currentRoleFilter === "all" || currentRoleFilter === "Rating Advisor");
        oldBadgeWrapper.classList.toggle("hidden", !isAdvisorOrAll);
    }

    let list = historyData.filter(i => {
        if (currentRoleFilter === "all") return true;
        return i.role.toLowerCase() === currentRoleFilter.toLowerCase();
    });

    if (list.length === 0) {
        container.innerHTML = "<div class='content-card'><p>No hay registros para este filtro.</p></div>";
        return;
    }

    list.forEach(rec => {
        let card = document.createElement("div");
        card.className = "record-item";
        card.innerHTML = `
            ${getBadgeHTML(rec.role, useOldBadgeInRoles && rec.role === "Rating Advisor")}
            <div>
                <strong>${rec.dateStr}</strong> - <strong>${rec.user}</strong> (ID: ${rec.id}) 
                - Rol: <strong>${rec.role}</strong> (${rec.type === 'promote' ? 'Ascenso' : 'Descenso'})
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. NACIONALIDADES
function renderNacionalidades() {
    const grid = document.getElementById("country-grid");
    if (!grid) return;
    grid.innerHTML = "";

    let countries = [...new Set(historyData.map(i => i.country))].filter(Boolean);
    countries.forEach(c => {
        let btn = document.createElement("button");
        btn.className = "country-btn";
        btn.textContent = c;
        btn.onclick = () => showCountryRecords(c);
        grid.appendChild(btn);
    });
}

function showCountryRecords(country) {
    const container = document.getElementById("country-timeline-container");
    if (!container) return;
    container.innerHTML = `<h3 style="color:var(--accent-primary); margin-bottom: 12px;">Registros de: ${country}</h3>`;

    historyData.filter(i => i.country === country).forEach(rec => {
        let card = document.createElement("div");
        card.className = "record-item";
        card.innerHTML = `
            ${getBadgeHTML(rec.role)}
            <div>
                <strong>${rec.dateStr}</strong> - <strong>${rec.user}</strong> (${rec.type}) - Rol: ${rec.role}
            </div>
        `;
        container.appendChild(card);
    });
}

// 4. BUSCADOR
function executeSearch() {
    const input = document.getElementById("search-input");
    if (!input) return;
    const q = input.value.toLowerCase().trim();
    const container = document.getElementById("search-results-container");
    if (!container) return;
    container.innerHTML = "";
    if (!q) return;

    let results = historyData.filter(i => 
        i.user.toLowerCase().includes(q) || 
        String(i.id).includes(q) || 
        (i.oldNames && i.oldNames.some(old => old.toLowerCase().includes(q)))
    );

    if (results.length === 0) {
        container.innerHTML = "<div class='content-card'><p>No se encontraron moderadores con ese criterio.</p></div>";
        return;
    }

    results.forEach(rec => {
        let card = document.createElement("div");
        card.className = "record-item";
        card.innerHTML = `
            ${getBadgeHTML(rec.role)}
            <div>
                <strong>${rec.user}</strong> (ID: ${rec.id})
                ${rec.oldNames && rec.oldNames.length ? `<br><small style='color:var(--text-muted)'>Nombres anteriores: ${rec.oldNames.join(", ")}</small>` : ""}
                <br><span>Fecha: ${rec.dateStr} | Estado: ${rec.type} [${rec.role}]</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// 5. OTROS / ESTADÍSTICAS
function renderEstadisticas() {
    const totalProm = document.getElementById("stat-total-promotes");
    const totalDem = document.getElementById("stat-total-demotes");
    if (totalProm) totalProm.textContent = historyData.filter(i => i.type === "promote").length;
    if (totalDem) totalDem.textContent = historyData.filter(i => i.type === "demote").length;

    const breakdown = document.getElementById("stats-yearly-breakdown");
    if (!breakdown) return;
    breakdown.innerHTML = "";

    let yearlyCount = {};
    historyData.forEach(i => {
        if (!yearlyCount[i.year]) yearlyCount[i.year] = { promote: 0, demote: 0 };
        yearlyCount[i.year][i.type]++;
    });

    Object.keys(yearlyCount).sort((a, b) => b - a).forEach(yr => {
        let div = document.createElement("div");
        div.style.marginBottom = "0.8rem";
        div.innerHTML = `
            <strong>Año ${yr}:</strong> 
            <span style="color:var(--accent-green)">${yearlyCount[yr].promote || 0} Ascensos</span> | 
            <span style="color:var(--accent-red)">${yearlyCount[yr].demote || 0} Descensos</span>
        `;
        breakdown.appendChild(div);
    });
}

// GATEKEEPERS EN INTRODUCCIÓN
function renderGatekeepers() {
    const mList = document.getElementById("gk-list-moderators");
    const aList = document.getElementById("gk-list-advisors");
    const lList = document.getElementById("gk-list-lbmods");

    if (!mList) return;
    mList.innerHTML = ""; if (aList) aList.innerHTML = ""; if (lList) lList.innerHTML = "";

    gatekeepersList.forEach(gk => {
        let item = document.createElement("div");
        item.className = "gk-item";
        item.innerHTML = `
            ${getBadgeHTML(gk.role)}
            <div>
                <strong>${gk.name}</strong>
                <div style="font-size:0.8rem; color:var(--text-muted)">ID: ${gk.id}</div>
            </div>
        `;
        if (gk.role === "Moderator") mList.appendChild(item);
        else if (gk.role === "Rating Advisor" && aList) aList.appendChild(item);
        else if (gk.role === "Leaderboard Mod" && lList) lList.appendChild(item);
    });
}

// Event Listeners y Handlers al arrancar el DOM
document.addEventListener("DOMContentLoaded", () => {
    cargarDatosJSON();

    // Eventos de Navegación por pestañas
    document.querySelectorAll(".nav-btn[data-tab]").forEach(btn => {
        btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    // Filtros por año en dropdown Fechas
    document.querySelectorAll("[data-filter-year]").forEach(el => {
        el.addEventListener("click", (e) => {
            e.preventDefault();
            selectFechasFilter(el.dataset.filterYear);
        });
    });

    // Filtros por rol en dropdown Roles
    document.querySelectorAll("[data-filter-role]").forEach(el => {
        el.addEventListener("click", (e) => {
            e.preventDefault();
            selectRolesFilter(el.dataset.filterRole);
        });
    });

    // Toggles de filtros
    document.getElementById("btn-toggle-fechas-mode")?.addEventListener("click", cycleFechasFilterMode);
    document.getElementById("btn-toggle-old-badge")?.addEventListener("click", toggleOldBadgeView);
    document.getElementById("select-dates-order")?.addEventListener("change", renderFechasTimeline);
    document.getElementById("search-input")?.addEventListener("input", executeSearch);

    // Ajustes visuales
    document.getElementById("select-font-size")?.addEventListener("change", (e) => {
        document.documentElement.style.setProperty('--base-font-size', e.target.value);
    });

    document.getElementById("select-theme")?.addEventListener("change", (e) => {
        document.body.className = e.target.value === 'light' ? 'theme-light' : 'theme-dark';
    });

    // Panel lateral de Administrador
    const sidebar = document.getElementById("admin-panel-sidebar");
    document.getElementById("btn-side-admin-toggle")?.addEventListener("click", () => {
        sidebar?.classList.toggle("hidden");
    });

    document.getElementById("btn-close-admin-sidebar")?.addEventListener("click", () => {
        sidebar?.classList.add("hidden");
    });
});

// Exposición al objeto window para compatibilidad
window.switchTab = switchTab;
window.selectFechasFilter = selectFechasFilter;
window.cycleFechasFilterMode = cycleFechasFilterMode;
window.selectRolesFilter = selectRolesFilter;
window.toggleOldBadgeView = toggleOldBadgeView;
window.executeSearch = executeSearch;