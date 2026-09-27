# Nicolás Cortez — nueva dirección editorial

Paleta principal: tinta #21090e, borgoña #4a1523, carmín #b83543, rosa mineral #e39b91, papel #ede4d6. Jerarquía con titulares de gran escala, contraste serif/sans, fotografía real y una retícula adaptable.

Identidades: NOISOME (música), MATERIA (objetos), ALBA (agenda dental), CIFRA (cotizaciones), ÁGORA (servicios). Son conceptos interactivos; no se presentan como clientes reales.

Referencias de composición y movimiento: colecciones de tipografía y portfolio de Awwwards; análisis editorial Swiss Portfolio de Curio (https://designbycurio.com/learn/awwwards-swiss-folio). Se reinterpretan principios, sin copiar código, marcas ni fotografías de estas referencias.

Interacciones: navegación móvil con cierre por Escape y clic exterior; filtros del archivo; estados hover/foco; órbitas de portada; fondo líquido borgoña con límite de píxeles y 30 fps, pausa persistente por sesión, suspensión en pestaña oculta, movimiento reducido y recuperación de contexto WebGL. El botón de WhatsApp mantiene posición fija y navegación nativa.

ÁGORA usa un módulo JavaScript externo compatible con la CSP de Vercel; se eliminaron el script inline bloqueado y las fuentes remotas. El buscador, las categorías, las orientaciones y el editor local vuelven a utilizar la lógica compartida y probada.

Validación: 74 aserciones funcionales con jsdom (dos carritos, agenda, cruces de horario, persistencia, cotizaciones e impuestos, recuperación de datos y editor); pruebas adicionales de menú, Escape, filtros, pausa, IDs únicos, rutas y scripts externos. Las pruebas DOM no certifican por sí solas el renderizado, WebGL o los dispositivos físicos.
