// js/main.js
import { initSpriteSheets } from './spriteSheet.js';
import { initStorage } from './storage.js';
import { 
    setupNavbarIcons, 
    switchTab, 
    renderGatekeepers, 
    renderFechasTimeline, 
    renderRolesTimeline, 
    renderEstadisticas, 
    executeSearch 
} from './ui.js';
import { setupAdminAuth } from './admin.js';
import { currentFilters, updateFilters } from './state.js';
import { particleEngine } from './particles.js';

document.addEventListener("DOMContentLoaded", async () => {
    // 0. Iniciar motor de partículas de fondo GD
    particleEngine.init();

    // 1. Cargar hojas de sprites y storage
    await initSpriteSheets();
    await initStorage();

    // 2. Montar interfaz inicial
    setupNavbarIcons();
    setupAdminAuth();
    renderGatekeepers();
    renderFechasTimeline();
    renderRolesTimeline();

    // 3. Listeners de navegación por pestañas en cabecera (Delegación segura contra clics en iconos/textos)
    document.querySelectorAll(".nav-btn[data-tab]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const targetBtn = e.target.closest(".nav-btn[data-tab]");
            if (targetBtn && targetBtn.dataset.tab) {
                switchTab(targetBtn.dataset.tab);
            }
        });
    });

    // 4. Conectar botón flotante inferior de Cuenta estilo GD
    document.getElementById("btn-gd-profile")?.addEventListener("click", () => {
        switchTab("tab-cuenta");
    });

    // 5. Filtros de Fechas
    document.querySelectorAll("[data-filter-year]").forEach(el => {
        el.addEventListener("click", (e) => {
            e.preventDefault();
            updateFilters({ year: el.dataset.filterYear });
            switchTab("tab-fechas");
            renderFechasTimeline();
        });
    });

    document.getElementById("select-dates-order")?.addEventListener("change", (e) => {
        updateFilters({ order: e.target.value });
        renderFechasTimeline();
    });

    document.getElementById("btn-toggle-fechas-mode")?.addEventListener("click", () => {
        const nextState = (currentFilters.movementType + 1) % 3;
        updateFilters({ movementType: nextState });

        const lbl = document.getElementById("label-toggle-fechas");
        if (lbl) {
            if (nextState === 0) lbl.textContent = "Ver solo Ascensos";
            else if (nextState === 1) lbl.textContent = "Ver solo Descensos";
            else lbl.textContent = "Ver todos los registros";
        }
        renderFechasTimeline();
    });

    // 6. Filtros de Roles
    document.querySelectorAll("[data-filter-role]").forEach(el => {
        el.addEventListener("click", (e) => {
            e.preventDefault();
            updateFilters({ role: el.dataset.filterRole });
            switchTab("tab-roles");
            renderRolesTimeline();
        });
    });

    document.getElementById("btn-toggle-old-badge")?.addEventListener("click", () => {
        updateFilters({ useOldBadge: !currentFilters.useOldBadge });
        const lbl = document.getElementById("lbl-old-badge-toggle");
        if (lbl) {
            lbl.textContent = currentFilters.useOldBadge ? "Ver con Insignia Actual" : "Ver con Insignia Antigua";
        }
        renderRolesTimeline();
    });

    // 7. Buscador interactivo
    document.getElementById("search-input")?.addEventListener("input", executeSearch);

    // 8. Ajustes visuales
    document.getElementById("select-font-size")?.addEventListener("change", (e) => {
        document.documentElement.style.setProperty('--base-font-size', e.target.value);
    });

    const selectTheme = document.getElementById("select-theme");
    if (selectTheme) {
        selectTheme.value = document.body.classList.contains("theme-light") ? "light" : "dark";
        selectTheme.addEventListener("change", (e) => {
            document.body.className = e.target.value === 'light' ? 'theme-light' : 'theme-dark';
        });
    }

    // Control del interruptor de partículas
    const toggleParticles = document.getElementById("toggle-particles");
    if (toggleParticles) {
        const savedPref = localStorage.getItem('gd_particles_enabled');
        if (savedPref !== null) {
            toggleParticles.checked = savedPref === 'true';
        }
        toggleParticles.addEventListener("change", (e) => {
            particleEngine.toggle(e.target.checked);
        });
    }
});
