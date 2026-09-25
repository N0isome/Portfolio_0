# Validación y pendientes

## Ejecutado

- 74 aserciones funcionales de DOM emulado (jsdom), todas aprobadas; resultados en `functional-results.json` y código reproducible en `tools/functional-tests.cjs`.
- Carritos: agregar, incrementar/reducir, total, persistencia al reinicializar la página, quitar, vacío, ficha, filtros, checkout sin transacción y tratamiento de JSON corrupto o IDs inválidos.
- Agenda: agrupación en siete fechas, navegación semanal sin repetición, validación de cruces y duración, límites 08:00–19:00, creación/edición, filtro, persistencia, eliminación con deshacer y texto escapado.
- Cotizador: descuento antes de impuestos, cargo, redondeo, guardado/recuperación, valores negativos y fraccionarios rechazados, descuento excesivo bloqueado, generación de contenido imprimible y llamada a impresión solo cuando la cotización es válida.
- Portal: seis servicios, búsqueda, filtro, estado vacío, contenido por servicio, editor con persistencia/restauración, cadenas escapadas y almacenamiento bloqueado.
- Revisión de fotografías mediante hoja de contacto. Los objetos de las imágenes coinciden con las fichas; fotografía de concierto y estudio identificada como ambiente.
- El fragment shader original se conserva; la diferencia se limita a inicialización/rendimiento/control del ciclo. Revisión estática de movimiento reducido, pausa y pestaña oculta.
- Revisión de sintaxis JavaScript, integridad JSON, archivos locales, anclas, WAV y respuesta HTTP de las rutas. Véase el informe técnico al final.

## Referencias: alcance de observación

AOI: navegación de escritorio y capturas antes/después de scroll; composición fotográfica en dos columnas, identidad central grande y texto superpuesto durante el recorrido. Se tomó el principio de fotografía protagonista, no su superposición.

adammount.org: lectura del contenido público y vista de escritorio de la apertura animada con tipografía y figuras. No se completó un recorrido visual del sitio ni se verificó su versión móvil. No se atribuyen efectos específicos a secciones no observadas.

Nick Ho: vista de escritorio con fotografía amplia, contraste fuerte, retícula y títulos contundentes. No se verificaron exhaustivamente transiciones o controles táctiles.

Las referencias se reinterpretaron en jerarquía, espacio y escala. No se copiaron marcas, fotografías ni código.

## No ejecutado: navegador real

El navegador de revisión bloqueó el acceso al servidor local (ERR_BLOCKED_BY_CLIENT). No se usó otro mecanismo de navegador para eludir esa limitación. Las pruebas jsdom prueban comportamiento de código, no pintan pantallas.

Queda por ejecutar en 360, 390, 768, 1024 y 1440 px:

- Revisar portada, galería, menú, contacto y footer a cada ancho, incluyendo zoom 200% y texto largo.
- Confirmar que no haya scroll horizontal, colisiones ni recortes.
- Confirmar foco con Tab, Escape y retorno al disparador de cada diálogo nativo. jsdom usa un reemplazo mínimo de open/close y no prueba el confinamiento de foco real.
- Verificar audio audible, seek, duración, pausa y reproducción en Chrome, Firefox y Safari.
- Verificar visualmente el shader, alternativa sin WebGL, movimiento reducido, botón de pausa y suspensión con pestaña oculta.
- Revisar la hoja impresa / Guardar como PDF, saltos de página y tipografía. Se generó el contenido, no se inspeccionó un PDF renderizado.
- Confirmar posición y ocultamiento preventivo de WhatsApp al acercarse a texto, controles, footer o diálogos.
- Medir carga/Lighthouse si se requiere una puntuación: no se midieron Core Web Vitals ni se garantiza una puntuación.
- Verificar cabeceras, 404 y rutas después del despliegue efectivo en Vercel, que no se realizó.

No se generaron capturas de pantalla del sitio rediseñado. Las portadas entregadas son ilustraciones editoriales, identificadas como tales; no pruebas de renderizado.

## Datos e integraciones pendientes

- Confirmar número real de WhatsApp y vigencia del correo conservado.
- Incorporar música, lanzamientos, fotografías y productos propios si se desea convertir el concepto de artista en una web real.
- Para operaciones reales: autenticación/autorización, backend/base de datos compartida, validación en servidor, inventario, pagos, pedidos, notificaciones o canal de solicitudes según el proyecto.
- Confirmar elegibilidad del uso previsto en Vercel Hobby. No se ha asumido autorización comercial del plan gratuito.

## Informe técnico estático

```json
{
  "local_references": 145,
  "html_http_routes": 10,
  "js_syntax": "pass",
  "json": "pass",
  "original_fragment_shader": "identical",
  "audio_seconds": 24.0,
  "errors": []
}
```
