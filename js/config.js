// js/config.js

export const SPRITESHEETS = {
    sheet03: {
        plist: "assets/GJ_GameSheet03-uhd.plist",
        image: "assets/GJ_GameSheet03-uhd.png"
    },
    sheet04: {
        plist: "assets/GJ_GameSheet04-uhd.plist",
        image: "assets/GJ_GameSheet04-uhd.png"
    },
    particles: {
        plist: "assets/GJ_ParticleSheet-uhd.plist",
        image: "assets/GJ_ParticleSheet-uhd.png"
    }
};

export const SPRITE_MAPPINGS = {
    // Insignias y Roles (Sheet03)
    "Rating Advisor": { sheet: "sheet03", sprite: "modBadge_01_001.png" },
    "Moderator": { sheet: "sheet03", sprite: "modBadge_02_001.png" },
    "Leaderboard Mod": { sheet: "sheet03", sprite: "modBadge_03_001.png" },
    "Ex Rating Advisor": { sheet: "sheet03", sprite: "modBadge_01_001.png" },
    "Ex Moderator": { sheet: "sheet03", sprite: "modBadge_02_001.png" },

    // Botones barra superior (Sheet04 & Sheet03)
    "nav_gatekeepers": { sheet: "particles", sprite: "particle_340_001.png" },
    "nav_fechas": { sheet: "particles", sprite: "particle_218_001.png" },
    "nav_roles": { sheet: "sheet03", sprite: "modBadge_02_001.png" },
    // "nav_nacionalidad": { sheet: "particles", sprite: "particle_346_001.png" },
    // de la particula 227 a la 230 son fuegos.
    "nav_nacionalidad": { sheet: "particles", sprite: "particle_335_001.png" },
    "nav_buscador": { sheet: "sheet04", sprite: "GJ_searchIcon_001.png" },
    "nav_otros": { sheet: "particles", sprite: "particle_336_001.png" },
    "nav_ajustes": { sheet: "sheet04", sprite: "GJ_sSettingsIcon_001.png" },

    // Acciones y Admin
    "action_delete": { sheet: "sheet03", sprite: "GJ_trashBtn_001.png" },
    "action_edit": { sheet: "sheet03", sprite: "GJ_editModeBtn_001.png" },
    "admin_gear": { sheet: "sheet04", sprite: "GJ_sSettingsIcon_001.png" },

    // Indicadores / Emojis auxiliares
    "badge_old": { sheet: "sheet03", sprite: "modBadge_01_001.png" }
};

export const fallbackBadges = {
    "Rating Advisor": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffe600'><path d='M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z'/></svg>",
    "Moderator": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300ff66'><path d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8s0 .01 0 .01z'/></svg>",
    "Leaderboard Mod": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300f0ff'><path d='M7 19h2v-6H7v6zm4 0h2v-10h-2v10zm4 0h2v-14h-2v14zm4-16v18H3V3h16m2-2H1v22h20V1z'/></svg>"
};