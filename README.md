# GD Promoted History

Sitio web interactivo diseñado para recopilar, consultar y documentar la cronología y los cambios de rango (ascensos y descensos) de los moderadores dentro de la comunidad de **Geometry Dash**.

## Características
* **Línea de tiempo por fechas:** Filtrado cronológico por año, mes y tipo de evento (ascensos/descensos).
* **Filtros por roles:** Visualización de registros clasificados por rangos (*Rating Advisor*, *Moderator*, *Leaderboard Mod*), incluyendo insignias retro.
* **Buscador integrado:** Búsqueda rápida por nombre de usuario, nombres anteriores o ID de cuenta.
* **Estadísticas y métricas:** Resumen global y desglose anual de movimientos de personal.
* **Panel de administración:** Herramientas para actualizar recursos, modificar descripciones o registrar nuevos miembros.

## Tecnologías utilizadas
* HTML5 semántico
* CSS3 (variables personalizadas y diseño responsivo)
* JavaScript vanilla (consumo asíncrono de datos con `fetch`)
* Bases de datos locales en formato JSON

## Estructura de datos
* `registro_general.json`: Datos base del usuario (ID, alias, historial de nombres, estado).
* `fechas_ascensos.json`: Registro cronológico detallado de cada ascenso o descenso.
* `nacionalidad.json`: Relación de países asignados a cada moderador.
