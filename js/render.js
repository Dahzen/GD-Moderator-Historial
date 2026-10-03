/* ===================================================
   HELPERS & MAPPING DE ROLES
   =================================================== */

export function isPromoteRole(role) {
    if (!role) return true;
    return !role.trim().startsWith('Ex ');
}

export function getRoleBadge(role, useOld = false) {
    if (useOld && (role === 'Rating Advisor' || role === 'RatingAdvisor')) {
        return 'assets/old_badge.png';
    }

    const badges = {
        'Rating Advisor': 'assets/rating_advisor.png',
        'Moderator': 'assets/moderator.png',
        'Leaderboard Mod': 'assets/leaderboard_Mod.png',
        'Ex Rating Advisor': 'assets/ex_rating_advisor.png',
        'Ex Moderator': 'assets/ex_moderator.png',
        'Ex Leaderboard Mod': 'assets/ex_leaderboard_mod.png'
    };
    return badges[role] || 'assets/rating_advisor.png';
}

function groupRecordsByDate(records) {
    const grouped = {};

    records.forEach(item => {
        let year = item.year || 'Sin Año';
        let month = item.month || 'General';
        let day = item.day || '01';

        if (!isNaN(day) && String(day).length === 1) {
            day = '0' + day;
        }

        if (!grouped[year]) grouped[year] = {};
        if (!grouped[year][month]) grouped[year][month] = {};
        if (!grouped[year][month][day]) grouped[year][month][day] = [];

        grouped[year][month][day].push(item);
    });

    return grouped;
}

export function renderFechasTimeline(container, records, order = 'desc', isAdmin = false) {
    container.innerHTML = '';

    if (!records || records.length === 0) {
        container.innerHTML = '<div class="content-card"><p>No hay registros para este filtro.</p></div>';
        return;
    }

    const grouped = groupRecordsByDate(records);

    const sortedYears = Object.keys(grouped).sort((a, b) => {
        return order === 'desc' ? Number(b) - Number(a) : Number(a) - Number(b);
    });

    sortedYears.forEach(year => {
        const yearBlock = document.createElement('div');
        yearBlock.className = 'year-block';
        yearBlock.innerHTML = `<h2 class="year-title">Año ${year}</h2>`;

        Object.keys(grouped[year]).forEach(month => {
            const monthBlock = document.createElement('div');
            monthBlock.className = 'month-block';
            monthBlock.innerHTML = `<h3 class="month-title">${month}</h3>`;

            Object.keys(grouped[year][month]).forEach(day => {
                const dayBlock = document.createElement('div');
                dayBlock.className = 'day-block';
                dayBlock.innerHTML = `<h4 class="day-title">Día ${day}</h4>`;

                grouped[year][month][day].forEach(item => {
                    const isPromote = isPromoteRole(item.role);
                    const recordEl = document.createElement('div');
                    recordEl.className = `record-item ${isPromote ? 'record-promote' : 'record-demote'}`;

                    let adminBtns = '';
                    if (isAdmin) {
                        adminBtns = `
                            <div class="admin-card-actions">
                                <button class="btn-card-action btn-edit-record" data-id="${item.id}" title="Editar Registro">
                                    <img src="assets/edited.png" alt="Editar">
                                </button>
                                <button class="btn-card-action btn-delete-record" data-id="${item.id}" title="Eliminar Registro">
                                    <img src="assets/delete.png" alt="Eliminar">
                                </button>
                            </div>
                        `;
                    }

                    recordEl.innerHTML = `
                        <img src="${getRoleBadge(item.role, item.useOldBadge)}" class="badge-img" alt="${item.role}" title="${item.role}">
                        <span class="user-name">${item.name || item.user}</span>
                        <span class="user-id">(ID: ${item.id})</span>
                        ${adminBtns}
                    `;
                    dayBlock.appendChild(recordEl);
                });

                monthBlock.appendChild(dayBlock);
            });

            yearBlock.appendChild(monthBlock);
        });

        container.appendChild(yearBlock);
    });
}

export function renderSearchResults(container, results, isAdmin = false) {
    container.innerHTML = '';

    if (!results || results.length === 0) {
        container.innerHTML = '<div class="content-card"><p>No se encontraron resultados.</p></div>';
        return;
    }

    results.forEach(item => {
        const isPromote = isPromoteRole(item.role);
        const card = document.createElement('div');
        card.className = `content-card ${isPromote ? 'record-promote' : 'record-demote'}`;

        const prevNames = item.previousNames && item.previousNames.length > 0 
            ? `<p class="user-id" style="margin-top: 4px;">Nombres anteriores: ${item.previousNames.join(', ')}</p>` 
            : '';

        let adminBtns = '';
        if (isAdmin) {
            adminBtns = `
                <div class="admin-card-actions">
                    <button class="btn-card-action btn-edit-record" data-id="${item.id}" title="Editar Registro">
                        <img src="assets/edited.png" alt="Editar">
                    </button>
                    <button class="btn-card-action btn-delete-record" data-id="${item.id}" title="Eliminar Registro">
                        <img src="assets/delete.png" alt="Eliminar">
                    </button>
                </div>
            `;
        }

        card.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${getRoleBadge(item.role, item.useOldBadge)}" class="badge-img" alt="${item.role}" title="${item.role}">
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem;">${item.name || item.user} <span class="user-id">(ID: ${item.id})</span></h3>
                        ${prevNames}
                        <p style="margin-top: 4px; font-size: 0.9rem; color: var(--text-muted);">
                            Fecha: ${item.dateStr || item.date} ${item.time || ''}
                        </p>
                    </div>
                </div>
                ${adminBtns}
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderSimpleList(container, records, isAdmin = false) {
    container.innerHTML = '';

    if (!records || records.length === 0) {
        container.innerHTML = '<div class="content-card"><p>No hay registros disponibles.</p></div>';
        return;
    }

    records.forEach(item => {
        const isPromote = isPromoteRole(item.role);
        const recordEl = document.createElement('div');
        recordEl.className = `record-item ${isPromote ? 'record-promote' : 'record-demote'}`;

        let adminBtns = '';
        if (isAdmin) {
            adminBtns = `
                <div class="admin-card-actions">
                    <button class="btn-card-action btn-edit-record" data-id="${item.id}" title="Editar Registro">
                        <img src="assets/edited.png" alt="Editar">
                    </button>
                    <button class="btn-card-action btn-delete-record" data-id="${item.id}" title="Eliminar Registro">
                        <img src="assets/delete.png" alt="Eliminar">
                    </button>
                </div>
            `;
        }

        recordEl.innerHTML = `
            <img src="${getRoleBadge(item.role, item.useOldBadge)}" class="badge-img" alt="${item.role}" title="${item.role}">
            <span style="font-family: var(--font-heading); font-size: 0.9rem; color: var(--accent-cyan); margin-right: 8px;">
                ${item.dateStr || item.date}
            </span>
            <span class="user-name">${item.name || item.user}</span>
            <span class="user-id">(ID: ${item.id})</span>
            ${adminBtns}
        `;
        container.appendChild(recordEl);
    });
}