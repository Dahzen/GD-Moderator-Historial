// components.js
import { assetPaths, fallbackBadges } from './config.js';

export function getBadgeHTML(role, useOld = false) {
    let key;
    
    switch (role) {
        case "Rating Advisor":
            key = useOld ? "old_badge.png" : "rating_advisor.png";
            break;
        case "Moderator":
            key = "moderator.png";
            break;
        case "Leaderboard Mod":
            key = "leaderboard_Mod.png";
            break;
        case "Ex Rating Advisor":
            key = "ex_rating_advisor.png";
            break;
        case "Ex Moderator":
            key = "ex_moderator.png";
            break;
        default:
            key = "moderator.png";
    }

    let src = assetPaths[key] || key;
    let fallback = fallbackBadges[role] || fallbackBadges["Moderator"];
    return `<img src="${src}" class="badge-img" alt="${role}" onerror="this.onerror=null; this.src='${fallback}';">`;
}