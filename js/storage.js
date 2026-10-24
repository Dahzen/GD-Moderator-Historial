// js/storage.js
import { APP_VERSION, setModerators, setAccounts, setUserSession } from './state.js';

const CACHE_KEY_DATA = `gd_mods_data_${APP_VERSION}`;

export async function initStorage() {
    // 1. Recuperar sesión previa de sessionStorage
    const savedSession = sessionStorage.getItem("gd_session");
    if (savedSession) {
        try {
            setUserSession(JSON.parse(savedSession));
        } catch {
            setUserSession({ username: "guest", role: "viewer" });
        }
    }

    // 2. Cargar cuentas
    try {
        const resAuth = await fetch('data/auth.json');
        const authData = await resAuth.json();
        setAccounts(authData.accounts || []);
    } catch (e) {
        console.warn("No se pudo cargar data/auth.json:", e);
    }

    // 3. Cargar moderadores con verificación de versión
    const cachedData = localStorage.getItem(CACHE_KEY_DATA);
    if (cachedData) {
        try {
            const parsed = JSON.parse(cachedData);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setModerators(parsed);
                return;
            }
        } catch {
            localStorage.removeItem(CACHE_KEY_DATA);
        }
    }

    // 4. Si no hay caché válido, cargar desde el JSON maestro
    try {
        const resMods = await fetch('data/moderators.json');
        const modsData = await resMods.json();
        setModerators(modsData);
        saveModeratorsToLocal(modsData);
    } catch (err) {
        console.error("Error al cargar data/moderators.json:", err);
    }
}

export function saveModeratorsToLocal(data) {
    try {
        localStorage.setItem(CACHE_KEY_DATA, JSON.stringify(data));
    } catch (e) {
        console.error("Error al guardar moderadores en localStorage:", e);
    }
}
