// state.js

// 1. REGISTROS (Eventos de ascensos/descensos)
// Estructura: { idRecord, userId, userName, role, type ("promote" | "demote"), day, month, year, hours, minutes, dateStr, country }
export let registros = [];

// 2. USUARIOS (Perfiles activos o históricos de moderadores)
// Estructura: { userId, currentName, oldNames: [], currentRole, country }
export let usuarios = [];

// Filtros y estados globales
export let currentFechasYear = "all";
export let fechasFilterState = 0; // 0: Todos, 1: Solo Ascensos, 2: Solo Descensos
export let currentRoleFilter = "all";
export let useOldBadgeInRoles = false;

// Setters
export function setRegistros(data) {
    registros = data;
}

export function setUsuarios(data) {
    usuarios = data;
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

/**
 * Recalcula automáticamente la lista de Usuarios basándose en los Registros existentes.
 * Si un usuario se queda sin registros, desaparece de la lista.
 */
export function syncUsuariosFromRegistros() {
    const usuariosMap = new Map();

    // Ordenar por fecha cronológica para reflejar el estado actual y los nombres viejos
    const sortedRecords = [...registros].sort((a, b) => {
        const dA = new Date(a.year, getMonthIndex(a.month), a.day, a.hours || 0, a.minutes || 0);
        const dB = new Date(b.year, getMonthIndex(b.month), b.day, b.hours || 0, b.minutes || 0);
        return dA - dB;
    });

    sortedRecords.forEach(reg => {
        const uId = String(reg.userId);
        if (!usuariosMap.has(uId)) {
            usuariosMap.set(uId, {
                userId: reg.userId,
                currentName: reg.userName,
                oldNames: [],
                currentRole: reg.role,
                country: reg.country || 'Global'
            });
        } else {
            const user = usuariosMap.get(uId);
            // Registrar cambio de nombre si difiere
            if (reg.userName !== user.currentName && !user.oldNames.includes(user.currentName)) {
                user.oldNames.push(user.currentName);
            }
            user.currentName = reg.userName;
            user.currentRole = reg.role;
            if (reg.country) user.country = reg.country;
        }
    });

    usuarios = Array.from(usuariosMap.values());
}

function getMonthIndex(monthName) {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const idx = months.indexOf(monthName);
    return idx !== -1 ? idx : 0;
}