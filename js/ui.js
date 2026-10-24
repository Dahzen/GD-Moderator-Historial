// js/ui.js
import { getSpriteImage } from './spriteSheet.js';
import { 
    moderatorsList, 
    currentUserSession, 
    currentFilters, 
    updateFilters, 
    getFlattenedEvents 
} from './state.js';
import { openEditUserModal, openDeleteModal } from './admin.js';

// Mapeo automático de códigos de bandera
const COUNTRY_CODES = {
    'México': 'mx', 'Mexico': 'mx',
    'Estados Unidos': 'us', 'USA': 'us', 'United States': 'us',
    'España': 'es', 'Spain': 'es', 'Espana': 'es',
    'Argentina': 'ar', 'Brasil': 'br', 'Brazil': 'br',
    'Chile': 'cl', 'Colombia': 'co', 'Perú': 'pe', 'Peru': 'pe',
    'Reino Unido': 'gb', 'UK': 'gb', 'United Kingdom': 'gb',
    'Alemania': 'de', 'Germany': 'de', 'Francia': 'fr', 'France': 'fr',
    'Canadá': 'ca', 'Canada': 'ca', 'Italia': 'it', 'Italy': 'it',
    'Rusia': 'ru', 'Russia': 'ru', 'Japón': 'jp', 'Japan': 'jp',
    'Corea del Sur': 'kr', 'South Korea': 'kr', 'Australia': 'au',
    'Polonia': 'pl', 'Poland': 'pl', 'Suecia': 'se', 'Sweden': 'se',
    'Noruega': 'no', 'Norway': 'no', 'Finlandia': 'fi', 'Finland': 'fi',
    'Países Bajos': 'nl', 'Netherlands': 'nl',
    'Uruguay': 'uy', 'Paraguay': 'py', 'Ecuador': 'ec', 'Venezuela': 've',
    'Guatemala': 'gt', 'Costa Rica': 'cr', 'Panamá': 'pa'
};

export function getFlagElement(country) {
    const code = COUNTRY_CODES[country] || COUNTRY_CODES[country?.trim()];
    if (code) {
        // Pedimos w80 (alta resolución) y le damos estilo con renderizado suave
        return `<img src="https://flagcdn.com/w80/${code}.png" class="flag-hd" alt="${country}" title="${country}">`;
    }
    return '';
}

export function getBadgeHTML(role, useOld = false) {
    let key = role;
    if (role === "Rating Advisor" && useOld) {
        key = "badge_old";
    }
    const sprite = getSpriteImage(key, 32, "badge-img");
    return sprite.outerHTML;
}

export function setupNavbarIcons() {
    const navItems = [
        { id: "btn-gatekeepers", key: "nav_gatekeepers" },
        { id: "btn-fechas", key: "nav_fechas" },
        { id: "btn-roles", key: "nav_roles" },
        { id: "btn-nacionalidad", key: "nav_nacionalidad" },
        { id: "btn-buscador", key: "nav_buscador" },
        { id: "btn-otros", key: "nav_otros" },
        { id: "btn-ajustes", key: "nav_ajustes" }
    ];

    navItems.forEach(item => {
        const btn = document.getElementById(item.id);
        if (!btn) return;

        const sprite = getSpriteImage(item.key, 26, "icon-small");
        const existing = btn.querySelector("img, canvas");
        if (existing) {
            existing.replaceWith(sprite);
        } else {
            btn.prepend(sprite);
        }
    });

    const profileSlot = document.getElementById("gd-profile-icon-slot");
    if (profileSlot) {
        profileSlot.innerHTML = "";
        profileSlot.appendChild(getSpriteImage("nav_cuenta", 50, "badge-img"));
    }

    applySessionUI();
}

export function applySessionUI() {
    const isAdmin = currentUserSession.role === "admin";
    const adminToggle = document.getElementById("btn-side-admin-toggle");
    if (adminToggle) {
        adminToggle.style.display = isAdmin ? "flex" : "none";
        if (isAdmin) {
            adminToggle.innerHTML = "";
            adminToggle.appendChild(getSpriteImage("admin_gear", 28, "icon-small"));
        }
    }
}

export function switchTab(tabId) {
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add("active");

    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    const subTitleEl = document.getElementById("display-subtitle");
    if (subTitleEl) {
        const titles = {
            'tab-intro': 'Gatekeepers',
            'tab-fechas': 'Fechas',
            'tab-roles': 'Roles',
            'tab-nacionalidad': 'Nacionalidad',
            'tab-buscador': 'Buscador',
            'tab-otros': 'Estadísticas',
            'tab-ajustes': 'Ajustes',
            'tab-cuenta': 'Cuenta'
        };
        subTitleEl.textContent = titles[tabId] || 'Gatekeepers';
    }

    if (tabId === "tab-intro") renderGatekeepers();
    if (tabId === "tab-fechas") renderFechasTimeline();
    if (tabId === "tab-roles") renderRolesTimeline();
    if (tabId === "tab-nacionalidad") renderNacionalidades();
    if (tabId === "tab-otros") renderEstadisticas();
    if (tabId === "tab-cuenta") {
        import('./admin.js').then(m => m.renderAccountTab());
    }
}

// Renderiza el Grid Modular de Gatekeepers con acordeón desplegable
export function renderGatekeepers() {
    const mList = document.getElementById("gk-list-moderators");
    const aList = document.getElementById("gk-list-advisors");
    const lList = document.getElementById("gk-list-lbmods");

    if (!mList) return;
    mList.innerHTML = "";
    if (aList) aList.innerHTML = "";
    if (lList) lList.innerHTML = "";

    const isAdmin = currentUserSession.role === "admin";

    moderatorsList.forEach(mod => {
        const card = document.createElement("div");
        card.className = "gk-item";
        card.style.flexDirection = "column";
        card.style.alignItems = "stretch";

        let adminControls = '';
        if (isAdmin) {
            adminControls = `
                <div style="display:flex; gap:6px; margin-left:auto;">
                    <button class="btn-card-action btn-edit-user" data-id="${mod.id}" title="Editar Moderador" style="width:26px; height:26px;">✎</button>
                    <button class="btn-card-action btn-delete-user" data-id="${mod.id}" data-name="${mod.name}" title="Eliminar Moderador" style="width:26px; height:26px; color:var(--accent-red);">✕</button>
                </div>
            `;
        }

        const eventsCount = mod.history ? mod.history.length : 0;
        const aliasesText = mod.aliases && mod.aliases.length ? `<div style="font-size:0.75rem; color:var(--text-muted);">Alias: ${mod.aliases.join(", ")}</div>` : '';

        // Encabezado de la tarjeta
        const headerHtml = `
            <div style="display:flex; align-items:center; gap:12px; width:100%;">
                ${getBadgeHTML(mod.currentRole)}
                <div style="flex:1;">
                    <strong style="color:var(--text-pure); font-size:1rem;">${mod.name}</strong> ${getFlagElement(mod.country)}
                    <div style="font-size:0.8rem; color:var(--text-muted);">ID: ${mod.id} · ${mod.country}</div>
                    ${aliasesText}
                </div>
                ${adminControls}
            </div>
        `;

        // Acordeón de Historial
        let historyListHtml = '<div style="font-size:0.8rem; color:var(--text-muted); padding:6px 0;">Sin registros históricos.</div>';
        if (eventsCount > 0) {
            historyListHtml = mod.history.map(ev => `
                <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.8rem; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                    <span>${ev.dateStr}</span>
                    <span style="color:${ev.type === 'promote' ? 'var(--accent-green)' : 'var(--accent-red)'}; font-weight:600;">
                        ${ev.type === 'promote' ? '↑' : '↓'} ${ev.role}
                    </span>
                </div>
            `).join('');
        }

        const toggleBtnHtml = `
            <button class="btn-toggle-mod-history" style="background:transparent; border:none; color:var(--text-link); font-size:0.78rem; cursor:pointer; text-align:left; padding:6px 0 0; margin-top:6px; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
                <span>Historial de promociones (${eventsCount})</span>
                <span class="history-arrow">▼</span>
            </button>
            <div class="mod-history-drawer hidden" style="margin-top:8px; padding-top:4px;">
                ${historyListHtml}
            </div>
        `;

        card.innerHTML = headerHtml + toggleBtnHtml;

        // Toggle del acordeón
        const toggleBtn = card.querySelector('.btn-toggle-mod-history');
        const historyDrawer = card.querySelector('.mod-history-drawer');
        const arrow = card.querySelector('.history-arrow');

        toggleBtn?.addEventListener('click', () => {
            const isHidden = historyDrawer.classList.toggle('hidden');
            arrow.textContent = isHidden ? '▼' : '▲';
        });

        // Eventos Admin
        if (isAdmin) {
            card.querySelector('.btn-edit-user')?.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditUserModal(mod.id);
            });
            card.querySelector('.btn-delete-user')?.addEventListener('click', (e) => {
                e.stopPropagation();
                openDeleteModal(mod.id, 'moderator', mod.name);
            });
        }

        if (mod.currentRole === "Moderator") mList.appendChild(card);
        else if (mod.currentRole === "Rating Advisor" && aList) aList.appendChild(card);
        else if (mod.currentRole === "Leaderboard Mod" && lList) lList.appendChild(card);
    });
}

export function renderFechasTimeline() {
    const container = document.getElementById("fechas-timeline-container");
    if (!container) return;
    container.innerHTML = "";

    const isAdmin = currentUserSession.role === "admin";

    let events = getFlattenedEvents().filter(ev => {
        if (currentFilters.year !== "all" && String(ev.year) !== String(currentFilters.year)) return false;
        if (currentFilters.movementType === 1 && ev.type !== "promote") return false;
        if (currentFilters.movementType === 2 && ev.type !== "demote") return false;
        return true;
    });

    if (events.length === 0) {
        container.innerHTML = "<div class='content-card'><p>No hay registros para este filtro.</p></div>";
        return;
    }

    const grouped = {};
    events.forEach(ev => {
        if (!grouped[ev.year]) grouped[ev.year] = {};
        if (!grouped[ev.year][ev.month]) grouped[ev.year][ev.month] = [];
        grouped[ev.year][ev.month].push(ev);
    });

    const years = Object.keys(grouped).sort((a, b) => 
        currentFilters.order === "desc" ? Number(b) - Number(a) : Number(a) - Number(b)
    );

    years.forEach(yr => {
        const yearBlock = document.createElement("div");
        yearBlock.className = "year-block";
        yearBlock.innerHTML = `<h2 class="year-title">Año ${yr}</h2>`;

        Object.keys(grouped[yr]).forEach(mth => {
            const monthBlock = document.createElement("div");
            monthBlock.className = "month-block";
            monthBlock.innerHTML = `<h3 class="month-title">${mth}</h3>`;

            grouped[yr][mth].forEach(rec => {
                const item = document.createElement("div");
                item.className = `record-item ${rec.type === 'promote' ? 'record-promote' : 'record-demote'}`;

                let adminBtn = '';
                if (isAdmin) {
                    adminBtn = `<button class="btn-card-action btn-del-event" data-event-id="${rec.eventId}" style="margin-left:auto; width:26px; height:26px; color:var(--accent-red);" title="Eliminar Registro">✕</button>`;
                }

                item.innerHTML = `
                    ${getBadgeHTML(rec.role)}
                    <div style="flex:1;">
                        <strong>Día ${rec.day}</strong> - <strong>${rec.modName}</strong> (ID: ${rec.modId}) ${getFlagElement(rec.country)}
                        - <span style="color:${rec.type === 'promote' ? 'var(--accent-green)' : 'var(--accent-red)'}">
                            ${rec.type === 'promote' ? 'ASCENSO' : 'DESCENSO'}
                          </span>
                        [${rec.role}]
                    </div>
                    ${adminBtn}
                `;

                if (isAdmin) {
                    item.querySelector('.btn-del-event')?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openDeleteModal(rec.eventId, 'event');
                    });
                }

                monthBlock.appendChild(item);
            });
            yearBlock.appendChild(monthBlock);
        });
        container.appendChild(yearBlock);
    });
}

export function renderRolesTimeline() {
    const container = document.getElementById("roles-timeline-container");
    const oldBadgeWrapper = document.getElementById("old-badge-wrapper");
    if (!container) return;
    container.innerHTML = "";

    if (oldBadgeWrapper) {
        const isAdvisorOrAll = (currentFilters.role === "all" || currentFilters.role.toLowerCase() === "rating advisor");
        oldBadgeWrapper.classList.toggle("hidden", !isAdvisorOrAll);
    }

    const events = getFlattenedEvents().filter(ev => {
        if (currentFilters.role === "all") return true;
        return ev.role.toLowerCase() === currentFilters.role.toLowerCase();
    });

    if (events.length === 0) {
        container.innerHTML = "<div class='content-card'><p>No hay registros para este rol.</p></div>";
        return;
    }

    events.forEach(rec => {
        const card = document.createElement("div");
        card.className = "record-item";
        card.innerHTML = `
            ${getBadgeHTML(rec.role, currentFilters.useOldBadge && rec.role === "Rating Advisor")}
            <div>
                <strong>${rec.dateStr}</strong> - <strong>${rec.modName}</strong> (ID: ${rec.modId}) ${getFlagElement(rec.country)}
                - Rol: <strong>${rec.role}</strong> (${rec.type === 'promote' ? 'Ascenso' : 'Descenso'})
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderNacionalidades() {
    const grid = document.getElementById("country-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const countries = [...new Set(moderatorsList.map(m => m.country).filter(Boolean))];
    countries.forEach(c => {
        const btn = document.createElement("button");
        btn.className = "country-btn";
        btn.innerHTML = `${c} ${getFlagElement(c)}`;
        btn.onclick = () => showCountryRecords(c);
        grid.appendChild(btn);
    });
}

export function showCountryRecords(country) {
    const container = document.getElementById("country-timeline-container");
    if (!container) return;
    container.innerHTML = `<h3 style="color:var(--accent-primary); margin-bottom: 12px;">Registros de: ${country} ${getFlagElement(country)}</h3>`;

    getFlattenedEvents().filter(ev => ev.country === country).forEach(rec => {
        const card = document.createElement("div");
        card.className = "record-item";
        card.innerHTML = `
            ${getBadgeHTML(rec.role)}
            <div>
                <strong>${rec.dateStr}</strong> - <strong>${rec.modName}</strong> (${rec.type}) - Rol: ${rec.role}
            </div>
        `;
        container.appendChild(card);
    });
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

    const results = getFlattenedEvents().filter(ev => 
        ev.modName.toLowerCase().includes(q) ||
        String(ev.modId).includes(q) ||
        (ev.aliases && ev.aliases.some(a => a.toLowerCase().includes(q)))
    );

    if (results.length === 0) {
        container.innerHTML = "<div class='content-card'><p>No se encontraron moderadores.</p></div>";
        return;
    }

    container.innerHTML = "";
    results.forEach(rec => {
        const card = document.createElement("div");
        card.className = "record-item";
        card.innerHTML = `
            ${getBadgeHTML(rec.role)}
            <div>
                <strong>${rec.modName}</strong> (ID: ${rec.modId}) ${getFlagElement(rec.country)}
                ${rec.aliases.length ? `<br><small style='color:var(--text-muted)'>Alias: ${rec.aliases.join(", ")}</small>` : ""}
                <br><span>Fecha: ${rec.dateStr} | Estado: ${rec.type} [${rec.role}]</span>
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderEstadisticas() {
    const totalProm = document.getElementById("stat-total-promotes");
    const totalDem = document.getElementById("stat-total-demotes");
    const events = getFlattenedEvents();

    if (totalProm) totalProm.textContent = events.filter(e => e.type === "promote").length;
    if (totalDem) totalDem.textContent = events.filter(e => e.type === "demote").length;

    const breakdown = document.getElementById("stats-yearly-breakdown");
    if (!breakdown) return;
    breakdown.innerHTML = "";

    const counts = {};
    events.forEach(e => {
        if (!counts[e.year]) counts[e.year] = { promote: 0, demote: 0 };
        counts[e.year][e.type]++;
    });

    Object.keys(counts).sort((a, b) => b - a).forEach(yr => {
        const div = document.createElement("div");
        div.style.marginBottom = "0.8rem";
        div.innerHTML = `
            <strong>Año ${yr}:</strong> 
            <span style="color:var(--accent-green)">${counts[yr].promote || 0} Ascensos</span> | 
            <span style="color:var(--accent-red)">${counts[yr].demote || 0} Descensos</span>
        `;
        breakdown.appendChild(div);
    });
}
