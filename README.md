# GD Promoted History

Sitio web interactivo diseñado para recopilar, consultar y preservar la cronología y los cambios de rango (ascensos, descensos y transiciones de rol) de los moderadores dentro de la comunidad de **Geometry Dash**.

---

## Características principales

* **Línea de tiempo cronológica:** Consulta organizada por años, meses y días, con diferenciación visual interactiva entre ascensos (*promotions*) y degradaciones (*demotions*).
* **Filtros por roles e insignias:** Exploración clasificada por rangos oficiales (*Rating Advisor*, *Moderator*, *Leaderboard Mod*), incluyendo soporte para insignias retro (*Old Badge*) y estados de ex-moderadores.
* **Buscador global en tiempo real:** Búsqueda rápida e insensible a mayúsculas por nombre actual, nombres históricos (*alias anteriores*) o ID de cuenta de Geometry Dash.
* **Métricas y estadísticas anuales:** Desglose analítico del volumen de movimientos de moderación registrados a lo largo de los años.
* **Panel de administración:** Herramientas para actualizar rutas de recursos gráficos, modificar información general y registrar nuevos miembros o cambios de rango.

---

## Tecnologías utilizadas

* **HTML5:** Estructura semántica adaptada a componentes interactivos.
* **CSS3:** Variables personalizadas, tema Geometry Dash (Dark Mode) y diseño adaptable.
* **JavaScript (Vanilla):** Lógica asíncrona mediante `fetch()`, manipulación dinámica del DOM y algoritmos de filtrado/búsqueda.
* **JSON:** Almacenamiento estructurado y desacoplado de las bases de datos locales.

---

## Estructura del proyecto

```text
GD-Moderator-Historial/
├── assets/                  # Recursos gráficos (iconos de interfaz e insignias)
│   ├── calendary.png
│   ├── country.png
│   ├── delete.png
│   ├── edited.png
│   ├── moderator.png
│   ├── rating_advisor.png
│   └── ...
├── data/                    # Bases de datos en formato JSON
│   ├── fechas_ascensos.json
│   ├── nacionalidad.json
│   └── registro_general.json
├── js/                      # Lógica y scripts de la aplicación
│   └── script.js
├── styles.css               # Estilos globales y temas
├── index.html               # Punto de entrada principal de la web
├── README.md                # Documentación del proyecto
└── .gitignore               # Archivos excluidos del control de versiones
