// storage.js
export function guardarEnLocalStorage(historyData, gatekeepersList) {
    try {
        localStorage.setItem("historyData", JSON.stringify(historyData));
        localStorage.setItem("gatekeepersList", JSON.stringify(gatekeepersList));
    } catch (e) {
        console.error("Error al guardar en localStorage:", e);
    }
}

export async function cargarDatosIniciales() {
    try {
        const localHistory = localStorage.getItem("historyData");
        const localGatekeepers = localStorage.getItem("gatekeepersList");

        if (localHistory && localGatekeepers) {
            const parsedHistory = JSON.parse(localHistory);
            const parsedGatekeepers = JSON.parse(localGatekeepers);
            
            if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
                return { historyData: parsedHistory, gatekeepersList: parsedGatekeepers };
            }
        }
    } catch (e) {
        console.warn("No se pudo leer localStorage, cargando desde JSON...", e);
    }

    try {
        // Cambia estas rutas según la ubicación exacta de tus JSONs
        const [resGeneral, resNaciones, resFechas] = await Promise.allSettled([
            fetch('./data/registro_general.json'),
            fetch('./data/nacionalidad.json'),
            fetch('./data/fechas_ascensos.json')
        ]);

        const generalData = resGeneral.status === 'fulfilled' && resGeneral.value.ok ? await resGeneral.value.json() : [];
        const nacionesData = resNaciones.status === 'fulfilled' && resNaciones.value.ok ? await resNaciones.value.json() : [];
        const fechasData = resFechas.status === 'fulfilled' && resFechas.value.ok ? await resFechas.value.json() : [];

        const gatekeepersList = generalData.map(u => ({
            name: u.name,
            id: u.id,
            role: u.role
        }));

        const historyData = fechasData.map(f => {
            const userGeneral = generalData.find(g => g.id === f.id) || {};
            const userNacion = nacionesData.find(n => n.id === f.id) || {};

            return {
                year: f.year,
                month: f.month,
                day: f.day,
                dateStr: f.dateStr,
                user: f.user || userGeneral.name || "Desconocido",
                oldNames: userGeneral.oldNames || [],
                id: f.id,
                role: f.role,
                type: f.type,
                country: userNacion.country || "Global"
            };
        });

        guardarEnLocalStorage(historyData, gatekeepersList);
        return { historyData, gatekeepersList };

    } catch (error) {
        console.error("Error en la carga de JSONs:", error);
        return { historyData: [], gatekeepersList: [] };
    }
}