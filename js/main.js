// main.js
import { cargarDatosIniciales } from './storage.js';
import { setHistoryData, setGatekeepersList } from './state.js';
import * as UI from './ui.js';
import * as Admin from './admin.js';

document.addEventListener("DOMContentLoaded", async () => {
    initEventListeners();

    try {
        const { historyData, gatekeepersList } = await cargarDatosIniciales();
        
        setHistoryData(historyData);
        setGatekeepersList(gatekeepersList);

        UI.renderGatekeepers();
        UI.renderFechasTimeline();
        UI.renderRolesTimeline();
    } catch (error) {
        console.error("Error al renderizar los datos iniciales:", error);
    }
});

function initEventListeners() {
    // Inicializar selectores visuales de roles
    Admin.setupRoleSelectors();

    // Pestañas principales
    document.querySelectorAll("[data-tab]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const targetTab = e.currentTarget.getAttribute("data-tab");
            UI.switchTab(targetTab);
        });
    });

    // Filtros de Fechas
    document.querySelectorAll("[data-filter-year]").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const year = e.currentTarget.getAttribute("data-filter-year");
            UI.selectFechasFilter(year);
        });
    });

    // Filtros de Roles
    document.querySelectorAll("[data-filter-role]").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const role = e.currentTarget.getAttribute("data-filter-role");
            UI.selectRolesFilter(role);
        });
    });

    // Alternar vistas y modos
    document.getElementById("btn-toggle-fechas-mode")?.addEventListener("click", UI.cycleFechasFilterMode);
    document.getElementById("btn-toggle-old-badge")?.addEventListener("click", UI.toggleOldBadgeView);

    // Buscador interactivo
    document.getElementById("search-input")?.addEventListener("input", UI.executeSearch);

    // Ajustes visuales
    document.getElementById("select-font-size")?.addEventListener("change", (e) => UI.changeFontSize(e.target.value));
    document.getElementById("select-theme")?.addEventListener("change", (e) => UI.changeTheme(e.target.value));
    document.getElementById("select-font-family")?.addEventListener("change", (e) => UI.changeFontFamily(e.target.value));

    // Panel Administrador
    document.getElementById("toggle-admin-switch")?.addEventListener("change", (e) => Admin.toggleAdminPanel(e.target.checked));
    document.getElementById("btn-admin-asset")?.addEventListener("click", Admin.adminUpdateAsset);
    document.getElementById("btn-admin-info")?.addEventListener("click", Admin.adminUpdateInfo);
    document.getElementById("btn-admin-edit")?.addEventListener("click", Admin.adminEditMember);
    document.getElementById("btn-admin-add")?.addEventListener("click", Admin.adminAddMember);
    document.getElementById("btn-admin-delete")?.addEventListener("click", Admin.adminDeleteMember);
}