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

// Mapeo automático de nombres de países a códigos ISO (para FlagCDN)
export const COUNTRY_CODES = {
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
    'Países Bajos': 'nl', 'Netherlands': 'nl', 'Holanda': 'nl',
    'Uruguay': 'uy', 'Paraguay': 'py', 'Ecuador': 'ec', 'Venezuela': 've',
    'Bolivia': 'bo', 'Guatemala': 'gt', 'Costa Rica': 'cr', 'Panamá': 'pa'
};

// Almacén para URLs personalizadas de banderas
export const customFlags = {};

/**
 * Obtiene la URL de la bandera e información para Tooltip según el país
 */
export function getCountryFlagData(countryName) {
    if (!countryName || countryName === 'Global' || countryName === 'Desconocido') {
        return {
            url: 'assets/country.png',
            name: countryName || 'Global',
            isDefault: true
        };
    }

    if (customFlags[countryName]) {
        return {
            url: customFlags[countryName],
            name: countryName,
            isDefault: false
        };
    }

    const code = COUNTRY_CODES[countryName] || COUNTRY_CODES[countryName.trim()];
    if (code) {
        return {
            url: `https://flagcdn.com/w40/${code.toLowerCase()}.png`,
            name: countryName,
            isDefault: false
        };
    }

    return {
        url: 'assets/country.png',
        name: countryName,
        isDefault: true
    };
}

/**
 * Añade o actualiza una bandera personalizada
 */
export function setCountryFlag(countryName, code = null, customUrl = null) {
    if (code) {
        COUNTRY_CODES[countryName] = code.toLowerCase();
    }
    if (customUrl) {
        customFlags[countryName] = customUrl;
    }
}

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
 * Agrega un usuario nuevo o actualiza las propiedades de uno existente sin borrar su historial.
 */
export function updateOrAddUser(userObj) {
    const idx = usuarios.findIndex(u => String(u.userId) === String(userObj.userId));
    if (idx !== -1) {
        usuarios[idx] = { ...usuarios[idx], ...userObj };
    } else {
        usuarios.push({
            userId: userObj.userId,
            currentName: userObj.currentName,
            oldNames: userObj.oldNames || [],
            currentRole: userObj.currentRole || 'Rating Advisor',
            country: userObj.country || 'Global'
        });
    }
}

/**
 * Recalcula automáticamente la lista de Usuarios basándose en los Registros existentes.
 */
export function syncUsuariosFromRegistros() {
    const usuariosMap = new Map(usuarios.map(u => [String(u.userId), u]));

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