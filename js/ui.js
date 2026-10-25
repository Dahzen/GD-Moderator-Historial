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
        return `<img src="https://flagcdn.com/w80/${code}.png" class="flag-hd" alt="${country}" title="${country}">`;
    }
    return '';
}

export function getBadgeHTML(role, useOld = false) {
    let key = role;
    if (role === "Rating Advisor" && useOld) {
        key = "badge_old";
    }
    const sprite = getSpriteImage(key, 40, "badge-img");
    return sprite ? sprite.outerHTML : '';
}

export function applySessionUI() {
    const isAdmin = currentUserSession.role === "admin";
    const adminToggle = document.getElementById("btn-side-admin-toggle");
    if (adminToggle) {
        adminToggle.style.display = isAdmin ? "flex" : "none";
        if (isAdmin) {
            adminToggle.innerHTML = "";
            const optionsSprite = getSpriteImage("GJ_optionsBtn02_001", 54, "admin-gear-img");
            if (optionsSprite) {
                adminToggle.appendChild(optionsSprite);
            } else {
                const img = document.createElement("img");
                img.src = "assets/GJ_optionsBtn02_001.png";
                img.alt = "Admin Options";
                img.className = "admin-gear-img";
                adminToggle.appendChild(img);
            }
        }
    }

    const closeBtn = document.getElementById("btn-close-admin-sidebar");
    if (closeBtn && !closeBtn.querySelector("img, canvas")) {
        const closeSprite = getSpriteImage("GJ_deleteSongBtn_001", 34, "icon-close") 
                         || getSpriteImage("GJ_closeBtn_001", 34, "icon-close")
                         || getSpriteImage("btn_delete", 34, "icon-close");
        if (closeSprite) {
            closeBtn.innerHTML = "";
            closeBtn.appendChild(closeSprite);
        } else {
            closeBtn.innerHTML = '<span class="fallback-close-gd">&times;</span>';
        }
    }
}

export function setupNavbarIcons() {
    try {
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
            if (sprite) {
                const existing = btn.querySelector("img.icon-small, canvas.icon-small");
                if (existing) {
                    existing.replaceWith(sprite);
                } else {
                    btn.prepend(sprite);
                }
            }
        });

        const btnRoles = document.getElementById('btn-roles');
        const rolesDropdown = btnRoles ? btnRoles.closest('.dropdown') : null;

        if (rolesDropdown) {
            const roleLinks = rolesDropdown.querySelectorAll('.dropdown-content a');
            roleLinks.forEach(link => {
                const role = link.getAttribute('data-filter-role');
                let sprite = null;

                if (role === 'all') {
                    sprite = getSpriteImage('nav_nacionalidad', 20, 'icon-small');
                } else if (role) {
                    sprite = getSpriteImage(role, 20, 'badge-img');
                }

                if (sprite) {
                    const existingIcon = link.querySelector('img, canvas');
                    if (existingIcon) {
                        existingIcon.replaceWith(sprite);
                    } else {
                        link.prepend(sprite);
                    }
                }
            });

            btnRoles.addEventListener('click', () => {
                rolesDropdown.classList.toggle('open');
            });

            roleLinks.forEach(item => {
                item.addEventListener('click', () => {
                    rolesDropdown.classList.remove('open');
                });
            });

            document.addEventListener('click', (e) => {
                if (!rolesDropdown.contains(e.target)) {
                    rolesDropdown.classList.remove('open');
                }
            });
        }

        const profileSlot = document.getElementById("gd-profile-icon-slot");
        if (profileSlot) {
            profileSlot.innerHTML = "";
            const profileIcon = getSpriteImage("nav_cuenta", 50, "badge-img");
            if (profileIcon) {
                profileSlot.appendChild(profileIcon);
            }
        }

        applySessionUI();
    } catch (err) {
        console.error("Error al configurar la barra superior:", err);
    }
}

export function switchTab(tabId) {
    if (!tabId) return;

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

export function renderGatekeepers() {
    const mList = document.getElementById("gk-list-moderators");
    const aList = document.getElementById("gk-list-advisors");
    const lList = document.getElementById("gk-list-lbmods");

    if (!mList) return;
    mList.innerHTML = "";
    if (aList) aList.innerHTML = "";
    if (lList) lList.innerHTML = "";

    const isAdmin = currentUserSession.role === "admin";

    const editSprite = getSpriteImage("GJ_viewLevelsBtn_001", 48, "icon-small")?.outerHTML 
                    || getSpriteImage("btn_edit", 48, "icon-small")?.outerHTML 
                    || '✎';

    const delSprite = getSpriteImage("GJ_resetBtn_001", 48, "icon-small")?.outerHTML 
                   || getSpriteImage("btn_delete", 48, "icon-small")?.outerHTML 
                   || '✕';

    moderatorsList.forEach(mod => {
        const card = document.createElement("div");
        card.className = "gk-item";

        let adminControls = '';
        if (isAdmin) {
            adminControls = `
                <div style="display:flex; align-items:center; gap:8px; margin-left:auto;">
                    <button class="btn-card-action btn-edit-user" data-id="${mod.id}" title="Editar Moderador">
                        ${editSprite}
                    </button>
                    <button class="btn-card-action btn-delete-user" data-id="${mod.id}" data-name="${mod.name}" title="Eliminar Moderador">
                        ${delSprite}
                    </button>
                </div>
            `;
        }

        card.innerHTML = `
            ${getBadgeHTML(mod.currentRole)}
            <div style="flex:1;">
                <div style="font-family: var(--font-gd); color: var(--text-pure); font-size: 1.15rem; letter-spacing: 0.8px; line-height: 1.2;">${mod.name}</div>
                <div style="font-size: 0.88rem; color: var(--text-muted); margin-top: 4px;">ID: ${mod.id}</div>
            </div>
            ${adminControls}
        `;

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

    const allEvents = getFlattenedEvents();
    const yearsAvailable = ["all", ...new Set(allEvents.map(e => e.year))].sort((a, b) => {
        if (a === "all") return -1;
        if (b === "all") return 1;
        return Number(b) - Number(a);
    });

    const typeLabels = { 0: 'TODOS', 1: 'ASCENSOS', 2: 'DESCENSOS' };

    let controlsBar = document.getElementById("timeline-controls-bar");
    if (!controlsBar) {
        controlsBar = document.createElement("div");
        controlsBar.id = "timeline-controls-bar";
        controlsBar.className = "timeline-controls-bar";

        const isYearActive = currentFilters.year !== "all";
        const isTypeActive = currentFilters.movementType !== 0;

        const filterIconElement = getSpriteImage("GJ_filterIcon_001", 24, "icon-filter-order") 
                               || getSpriteImage("GJ_sortIcon_001", 24, "icon-filter-order");

        controlsBar.innerHTML = `
            <div class="controls-group">
                <label>AÑO:</label>
                <select id="fecha-filter-year" class="gd-control-btn ${isYearActive ? 'is-active' : ''}">
                    ${yearsAvailable.map(yr => `
                        <option value="${yr}" ${currentFilters.year == yr ? 'selected' : ''}>
                            ${yr === 'all' ? 'TODOS' : yr}
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="controls-group">
                <label>TIPO:</label>
                <button id="fecha-single-type-btn" class="gd-control-btn btn-type-fixed ${isTypeActive ? 'is-active' : ''}">
                    ${typeLabels[currentFilters.movementType || 0]}
                </button>
            </div>

            <div class="controls-group">
                <label>ORDEN:</label>
                <button id="fecha-toggle-order" class="btn-gd-icon-square" title="Alternar orden">
                </button>
                <span id="fecha-order-label" class="order-status-text">
                    ${currentFilters.order === 'desc' ? 'RECIENTES' : 'ANTIGUOS'}
                </span>
            </div>
        `;

        if (filterIconElement) {
            controlsBar.querySelector('#fecha-toggle-order').appendChild(filterIconElement);
        }

        const selectYearEl = controlsBar.querySelector('#fecha-filter-year');
        const btnTypeEl = controlsBar.querySelector('#fecha-single-type-btn');

        selectYearEl.addEventListener('change', (e) => {
            updateFilters({ year: e.target.value });
            selectYearEl.classList.toggle('is-active', e.target.value !== 'all');
            updateEventsList();
        });

        btnTypeEl.addEventListener('click', () => {
            const nextType = ((currentFilters.movementType || 0) + 1) % 3;
            updateFilters({ movementType: nextType });
            btnTypeEl.textContent = typeLabels[nextType];
            btnTypeEl.classList.toggle('is-active', nextType !== 0);
            updateEventsList();
        });

        controlsBar.querySelector('#fecha-toggle-order').addEventListener('click', () => {
            const newOrder = currentFilters.order === 'desc' ? 'asc' : 'desc';
            updateFilters({ order: newOrder });
            const labelEl = document.getElementById("fecha-order-label");
            if (labelEl) labelEl.textContent = newOrder === 'desc' ? 'RECIENTES' : 'ANTIGUOS';
            updateEventsList();
        });

        container.parentNode.insertBefore(controlsBar, container);
    }

    function updateEventsList() {
        container.innerHTML = "";

        const isAdmin = currentUserSession.role === "admin";
        const delSprite = getSpriteImage("GJ_resetBtn_001", 26, "icon-small")?.outerHTML 
                       || getSpriteImage("btn_delete", 26, "icon-small")?.outerHTML 
                       || '✕';

        let events = allEvents.filter(ev => {
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
                        adminBtn = `<button class="btn-card-action btn-del-event" data-event-id="${rec.eventId}" style="margin-left:auto;" title="Eliminar Registro">${delSprite}</button>`;
                    }

                    item.innerHTML = `
                        ${getBadgeHTML(rec.role)}
                        <div style="flex:1;">
                            <strong>Día ${rec.day}</strong> - <strong>${rec.modName}</strong> (ID: ${rec.modId})
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

    updateEventsList();
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
                <strong>${rec.dateStr}</strong> - <strong>${rec.modName}</strong> (ID: ${rec.modId})
                - Rol: <strong>${rec.role}</strong> (${rec.type === 'promote' ? 'Ascenso' : 'Descenso'})
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderNacionalidades() {
    const grid = document.getElementById("country-grid");
    if (!grid) return;

    const allEvents = getFlattenedEvents();
    const countryCounts = {};

    allEvents.forEach(ev => {
        if (ev.country) {
            countryCounts[ev.country] = (countryCounts[ev.country] || 0) + 1;
        }
    });

    const countries = Object.keys(countryCounts).sort((a, b) => a.localeCompare(b));

    let searchInput = document.getElementById("country-search-input");
    if (!searchInput) {
        const searchWrapper = document.createElement("div");
        searchWrapper.className = "country-search-bar";
        searchWrapper.innerHTML = `
            <input type="text" id="country-search-input" placeholder="Buscar país..." autocomplete="off">
        `;
        grid.parentNode.insertBefore(searchWrapper, grid);
        searchInput = document.getElementById("country-search-input");

        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            document.querySelectorAll(".country-btn").forEach(btn => {
                const name = btn.getAttribute("data-country-name").toLowerCase();
                btn.style.display = name.includes(query) ? "inline-flex" : "none";
            });
        });
    }

    grid.innerHTML = "";
    countries.forEach(c => {
        const btn = document.createElement("button");
        btn.className = "country-btn";
        btn.setAttribute("data-country-name", c);
        btn.innerHTML = `
            <span>${c} ${getFlagElement(c)}</span>
            <span class="country-count-tag">${countryCounts[c]}</span>
        `;
        btn.onclick = () => showCountryRecords(c);
        grid.appendChild(btn);
    });
}

export function showCountryRecords(country) {
    const container = document.getElementById("country-timeline-container");
    if (!container) return;

    const countryEvents = getFlattenedEvents().filter(ev => ev.country === country);

    container.innerHTML = `
        <h3 style="color:var(--accent-primary); margin-bottom: 14px; font-family:var(--font-gd); font-size:1.05rem;">
            Registros de: ${country} ${getFlagElement(country)} (${countryEvents.length})
        </h3>
    `;

    countryEvents.forEach(rec => {
        const isPromote = rec.type === 'promote';
        const card = document.createElement("div");
        card.className = `record-item ${isPromote ? 'record-promote' : 'record-demote'}`;
        card.innerHTML = `
            ${getBadgeHTML(rec.role)}
            <div>
                <strong>${rec.dateStr}</strong> - <strong>${rec.modName}</strong> 
                - <span style="color:${isPromote ? 'var(--accent-green)' : 'var(--accent-red)'}">
                    ${isPromote ? 'ASCENSO' : 'DESCENSO'}
                </span> 
                - Rol: <strong>${rec.role}</strong>
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

    const isAdmin = currentUserSession.role === "admin";
    const delSprite = getSpriteImage("GJ_resetBtn_001", 26, "icon-small")?.outerHTML 
                || getSpriteImage("btn_delete", 26, "icon-small")?.outerHTML 
                || '✕';

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
        const isPromote = rec.type === 'promote';
        card.className = `record-item ${isPromote ? 'record-promote' : 'record-demote'}`;

        let adminBtn = '';
        if (isAdmin && rec.eventId) {
            adminBtn = `<button class="btn-card-action btn-del-event" data-event-id="${rec.eventId}" style="margin-left:auto;" title="Eliminar Registro">${delSprite}</button>`;
        }

        card.innerHTML = `
            ${getBadgeHTML(rec.role)}
            <div style="flex:1;">
                <strong style="color:var(--text-pure); font-size:0.95rem;">${rec.modName}</strong> (ID: ${rec.modId})
                ${rec.aliases && rec.aliases.length ? `<br><small style='color:var(--text-muted)'>Alias: ${rec.aliases.join(", ")}</small>` : ""}
                <div style="font-size:0.82rem; margin-top:2px;">
                    <span>Fecha: ${rec.dateStr}</span> · 
                    <span style="color:${isPromote ? 'var(--accent-green)' : 'var(--accent-red)'}; font-weight:600;">
                        ${isPromote ? 'ASCENSO' : 'DESCENSO'}
                    </span> 
                    [${rec.role}]
                </div>
            </div>
            ${adminBtn}
        `;

        if (isAdmin && rec.eventId) {
            card.querySelector('.btn-del-event')?.addEventListener('click', (e) => {
                e.stopPropagation();
                openDeleteModal(rec.eventId, 'event');
            });
        }

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
