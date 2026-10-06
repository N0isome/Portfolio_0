# Verificación del MVP

Fecha: 6 de octubre de 2026.

52 comprobaciones exitosas sobre el Worker compilado, ejecutado con Miniflare y D1/R2 locales nuevos. La prueba utiliza identidades sintéticas y no crea datos en producción.

- Acceso anónimo y usuarios ajenos: denegación de escrituras, solicitudes y fotos privadas.
- Publicación: fotografías privadas, propiedad del archivo, estado controlado por servidor, formato real del contenido y origen de la petición.
- Ofertas: rol de reparador, prohibición de ofertar sobre solicitudes propias, una oferta por reparador, y visibilidad de sus propuestas.
- Aceptación concurrente: dos propuestas intentan aceptarse a la vez; una operación gana, la otra devuelve conflicto. Estados finales consistentes.
- Seguimiento: cancelación, retiro, finalización solo por el dueño, rechazo de ofertas retiradas y aceptación repetida.
- Reseñas: solo después de terminar, una por oferta aceptada, reputación calculada desde trabajos reales.
- Ejemplos: creación, aceptación, finalización y reseña en casos identificados como ficticios; sin exposición como talleres reales.
- Lectura posterior: estados y reseñas persisten; los perfiles públicos no incluyen correo.
- Renderizado del documento HTML principal.

Compilación de TypeScript y producción exitosas. Puede reproducirse con `node scripts/verify-mvp.mjs` después de construir el proyecto.

No se pudo realizar inspección visual en un navegador compatible ni validar las herramientas WebMCP en el contexto del navegador. Se inspeccionaron las imágenes integradas y las reglas de diseño adaptable, enfoque visible y movimiento reducido del código. Esto no equivale a una comprobación visual completa.

Las migraciones de Supabase se revisaron como código; no se ejecutaron contra un proyecto Supabase. No hay verificación de IA, Stripe ni CAD: no están conectados.
