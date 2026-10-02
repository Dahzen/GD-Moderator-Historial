// BANCO DE IMÁGENES / ASSETS CON NOMBRES EXACTOS
let assetPaths = {
    "calendary.png": "calendary.png",
    "rating_advisor.png": "rating_advisor.png",
    "country.png": "country.png",
    "search.png": "search.png",
    "other.png": "other.png",
    "settings.png": "settings.png",
    "moderator.png": "moderator.png",
    "leaderboard_Mod.png": "leaderboard_Mod.png",
    "ex_rating_advisor.png": "ex_rating_advisor.png",
    "ex_moderator.png": "ex_moderator.png",
    "old_badge.png": "old_badge.png",
};

const fallbackBadges = {
    "Rating Advisor": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffe600'><path d='M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z'/></svg>",
    "Moderator": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300ff66'><path d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8s0 .01 0 .01z'/></svg>",
    "Leaderboard Mod": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300f0ff'><path d='M7 19h2v-6H7v6zm4 0h2v-10h-2v10zm4 0h2v-14h-2v14zm4-16v18H3V3h16m2-2H1v22h20V1z'/></svg>"
};

function getBadgeHTML(role, useOld = false) {
    let key;
    
    switch (role) {
        case "Rating Advisor":
            key = useOld ? "old_badge.png" : "rating_advisor.png";
            break;
        case "Moderator":
            key = "moderator.png";
            break;
        case "Leaderboard Mod":
            key = "leaderboard_Mod.png";
            break;
        case "Ex Rating Advisor":
            key = "ex_rating_advisor.png";
            break;
        case "Ex Moderator":
            key = "ex_moderator.png";
            break;
        default:
            key = "moderator.png";
    }

    let src = assetPaths[key] || key;
    let fallback = fallbackBadges[role] || fallbackBadges["Moderator"];
    return `<img src="${src}" class="badge-img" alt="${role}" onerror="this.onerror=null; this.src='${fallback}';">`;
}

// BASE DE DATOS LOCAL
let gatekeepersList = [];
let historyData = [];

// ESTADOS DE NAVEGACIÓN Y FILTROS
let currentFechasYear = "all";
let fechasFilterState = 0; // 0: Todos, 1: Solo Ascensos, 2: Solo Descensos
let currentRoleFilter = "all";
let useOldBadgeInRoles = false;



function guardarEnLocalStorage() {
    localStorage.setItem("historyData", JSON.stringify(historyData));
    localStorage.setItem("gatekeepersList", JSON.stringify(gatekeepersList));
}

async function cargarDatosJSON() {
    try {
        // Verificar si existen datos guardados localmente
        const localHistory = localStorage.getItem("historyData");
        const localGatekeepers = localStorage.getItem("gatekeepersList");

        if (localHistory && localGatekeepers) {
            historyData = JSON.parse(localHistory);
            gatekeepersList = JSON.parse(localGatekeepers);
        } else {
            const [resGeneral, resNaciones, resFechas] = await Promise.all([
                fetch('registro_general.json'),
                fetch('nacionalidad.json'),
                fetch('fechas_ascensos.json')
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
        console.error("Error al cargar las bases de datos JSON:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarDatosJSON();
});

// CAMBIO DE PESTAÑAS
function switchTab(tabId) {
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    document.getElementById(tabId)?.classList.add("active");

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
    const imgBtn = document.getElementById("img-toggle-fechas");
    const labelBtn = document.getElementById("label-toggle-fechas");

    if (fechasFilterState === 0) {
        if (imgBtn) imgBtn.src = assetPaths["rating_advisor.png"];
        if (labelBtn) labelBtn.textContent = "Ver solo Ascensos";
    } else if (fechasFilterState === 1) {
        if (imgBtn) imgBtn.src = assetPaths["ex_rating_advisor.png"];
        if (labelBtn) labelBtn.textContent = "Ver solo Descensos";
    } else if (fechasFilterState === 2) {
        if (imgBtn) imgBtn.src = assetPaths["moderator.png"];
        if (labelBtn) labelBtn.textContent = "Ver todos los registros";
    }
    renderFechasTimeline();
}

function renderFechasTimeline() {
    const container = document.getElementById("fechas-timeline-container");
    if (!container) return;
    container.innerHTML = "";

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

    Object.keys(grouped).forEach(yr => {
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
    
    const imgToggle = document.getElementById("img-old-badge-toggle");
    const lblToggle = document.getElementById("lbl-old-badge-toggle");

    if (useOldBadgeInRoles) {
        if (imgToggle) imgToggle.src = assetPaths["rating_advisor.png"] || "rating_advisor.png";
        if (lblToggle) lblToggle.textContent = "Ver con Insignia Actual";
    } else {
        if (imgToggle) imgToggle.src = assetPaths["old_badge.png"] || "old_badge.png";
        if (lblToggle) lblToggle.textContent = "Ver con Insignia Antigua";
    }

    renderRolesTimeline();
}

// Renderizado de Roles corregido
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

function renderRolesTimeline() {
    const container = document.getElementById("roles-timeline-container");
    const oldBadgeWrapper = document.getElementById("old-badge-wrapper");
    if (!container) return;
    container.innerHTML = "";

    if (oldBadgeWrapper) {
    // Se muestra si el filtro es "all" o "Rating Advisor"
    oldBadgeWrapper.classList.toggle("hidden", !(currentRoleFilter === "all" || currentRoleFilter === "Rating Advisor"));
    }

    let list = historyData.filter(i => currentRoleFilter === "all" || i.role === currentRoleFilter);

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

// 3. NACIONALIDAD
function renderNacionalidades() {
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

function showCountryRecords(country) {
    const container = document.getElementById("country-timeline-container");
    if (!container) return;
    container.innerHTML = `<h3 style="color:var(--border-glow)">Registros de: ${country}</h3>`;

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
        i.id.includes(q) || 
        i.oldNames.some(old => old.toLowerCase().includes(q))
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
                ${rec.oldNames.length ? `<br><small style='color:var(--text-muted)'>Nombres anteriores: ${rec.oldNames.join(", ")}</small>` : ""}
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

// 6. AJUSTES Y PANEL DE ADMINISTRACIÓN
function changeFontSize(sz) { document.documentElement.style.setProperty('--base-font-size', sz); }
function changeTheme(th) { document.body.className = th === 'light' ? 'theme-light' : 'theme-dark'; }
function changeFontFamily(fn) { document.body.style.fontFamily = fn; }

function toggleAdminPanel(enabled) {
    document.getElementById("admin-panel")?.classList.toggle("hidden", !enabled);
}

function adminUpdateAsset() {
    let k = document.getElementById("asset-key")?.value.trim();
    let u = document.getElementById("asset-url")?.value.trim();
    if (k && u) {
        assetPaths[k] = u;
        alert(`Asset ${k} actualizado.`);
    }
}

function adminUpdateInfo() {
    let t = document.getElementById("admin-info-title")?.value;
    let st = document.getElementById("admin-info-subtitle")?.value;
    let d = document.getElementById("admin-info-desc")?.value;

    if (t) document.getElementById("display-title").textContent = t;
    if (st) document.getElementById("display-subtitle").textContent = st;
    if (d) document.getElementById("desc-intro").textContent = d;

    alert("Información actualizada correctamente.");
}

function adminEditMember() {
    let id = document.getElementById("edit-member-id")?.value;
    let newName = document.getElementById("edit-member-newname")?.value;
    let newRole = document.getElementById("edit-member-newrole")?.value;
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

// Asignar dateFormatted a dateStr al crear o modificar el registro:
// dateStr: dateFormatted
        historyData.push({
            year: d.getFullYear().toString(),
            month: monthNames[d.getMonth()],
            day: d.getDate().toString(),
            dateStr: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} 00:00`,
            user: target.user,
            oldNames: target.oldNames,
            id: target.id,
            role: newRole,
            type: "promote",
            country: target.country
        });
    }

    alert("Miembro actualizado.");
}

function adminAddMember() {
    let role = document.getElementById("add-role")?.value;
    let name = document.getElementById("add-name")?.value;
    let id = document.getElementById("add-id")?.value;
    let dateVal = document.getElementById("add-date")?.value;
    let country = document.getElementById("add-country")?.value || "Global";

    if (!name || !id || !dateVal) return alert("Por favor completa los campos requeridos (Nombre, ID, Fecha).");

    let d = new Date(dateVal);
    let monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    let hours = d.getHours().toString().padStart(2, '0');
    let minutes = d.getMinutes().toString().padStart(2, '0');
    let dateFormatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()} ${hours}:${minutes}`;

    // Asignar dateFormatted a dateStr al crear o modificar el registro:
    // dateStr: dateFormatted

    historyData.push({
        year: d.getFullYear().toString(),
        month: monthNames[d.getMonth()],
        day: d.getDate().toString(),
        dateStr: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} 00:00`,
        user: name,
        oldNames: [],
        id: id,
        role: role,
        type: "promote",
        country: country
    });

    gatekeepersList.push({ name: name, id: id, role: role });
    renderGatekeepers();

    alert("Nuevo miembro agregado correctamente.");
}

// Exposición global para llamados directos desde el DOM
window.switchTab = switchTab;
window.selectFechasFilter = selectFechasFilter;
window.cycleFechasFilterMode = cycleFechasFilterMode;
window.selectRolesFilter = selectRolesFilter;
window.toggleOldBadgeView = toggleOldBadgeView;
window.executeSearch = executeSearch;
window.changeFontSize = changeFontSize;
window.changeTheme = changeTheme;
window.changeFontFamily = changeFontFamily;
window.toggleAdminPanel = toggleAdminPanel;
window.adminUpdateAsset = adminUpdateAsset;
window.adminUpdateInfo = adminUpdateInfo;
window.adminEditMember = adminEditMember;
window.adminAddMember = adminAddMember;