// state.js

// Base de datos global en memoria
export let gatekeepersList = [];
export let historyData = [];

// Filtros y estados globales
export let currentFechasYear = "all";
export let fechasFilterState = 0; // 0: Todos, 1: Solo Ascensos, 2: Solo Descensos
export let currentRoleFilter = "all";
export let useOldBadgeInRoles = false;

// Setters para mutar el estado cuando sea necesario desde otros módulos
export function setHistoryData(data) {
    historyData = data;
}

export function setGatekeepersList(data) {
    gatekeepersList = data;
}

export function setCurrentFechasYear(year) {
    currentFechasYear = year;
}

export function setFechasFilterState(state) {
    fechasFilterState = state;
}

export function setCurrentRoleFilter(role) {
    currentRoleFilter = role;
}

export function setUseOldBadgeInRoles(value) {
    useOldBadgeInRoles = value;
}