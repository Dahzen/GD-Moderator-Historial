// js/state.js

export const APP_VERSION = "1.7.0";

// Datos maestros
export let moderatorsList = [];
export let accountsList = [];

// Sesión actual ('viewer' | 'admin')
export let currentUserSession = {
    username: "guest",
    role: "viewer"
};

// Filtros globales
export let currentFilters = {
    year: "all",
    role: "all",
    movementType: 0, // 0: Todos, 1: Solo Ascensos, 2: Solo Descensos
    order: "desc",
    useOldBadge: false,
    searchQuery: ""
};

// Setters
export function setModerators(data) {
    moderatorsList = data;
}

export function setAccounts(data) {
    accountsList = data;
}

export function setUserSession(session) {
    currentUserSession = session;
    sessionStorage.setItem("gd_session", JSON.stringify(session));
}

export function updateFilters(newFilters) {
    currentFilters = { ...currentFilters, ...newFilters };
}

// Helpers para obtener registros planos ordenados
export function getFlattenedEvents() {
    const events = [];
    moderatorsList.forEach(mod => {
        if (!mod.history) return;
        mod.history.forEach(evt => {
            events.push({
                ...evt,
                modId: mod.id,
                modName: mod.name,
                country: mod.country,
                aliases: mod.aliases || []
            });
        });
    });
    return events;
}
