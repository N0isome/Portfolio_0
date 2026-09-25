# Portfolio — Nicolás Cortez

Versión estática rediseñada, 25 de septiembre de 2026. HTML, CSS y JavaScript nativo; sin framework, servicios de pago, fuentes remotas, runtime de Node ni compilación para producción.

## Probar en Windows

1. Extrae el ZIP.
2. Abre una terminal en la carpeta `portfolio`, donde está `index.html`.
3. Ejecuta `py -m http.server 8000` (o `python -m http.server 8000`).
4. Abre http://localhost:8000.

No abras el HTML con doble clic: los módulos JavaScript y el JSON de términos necesitan HTTP. El puerto local solo se utiliza para la prueba; no es parte de Vercel.

## Qué cambió

- Fondo: se conserva literalmente el shader de color/movimiento del original y las capas de velo/grano. Solo se optimiza el ciclo de dibujo: 24 fps máximos, límite de píxeles adaptativo, suspensión al ocultar la pestaña y movimiento reducido. Se incluye alternativa CSS petróleo/oliva si WebGL falla y botón para pausar el fondo.
- Portada editorial: títulos grandes, aire, galería asimétrica, metadatos breves y hover de escala suave. Sin iframes de previsualización ni retrasos artificiales al navegar.
- Sobre mí: frase visual, perfil breve y capacidades. Sin numeración decorativa, retratos de terceros ni resultados inventados.
- Navegación: menú móvil desplegable, foco visible, enlaces nativos, detalles accesibles y modales `dialog`.
- Contacto flotante: esquina inferior derecha, área táctil y safe areas. Se oculta al coincidir con contenido legible/controles, footer o modales para no taparlos. El contacto sigue disponible en su sección.
- Términos: `terminos.html` consume `data/terms.json`, con manejo de error. Créditos e identificación de recursos incluidos.

## Cinco proyectos

| Proyecto | Recorrido implementado | Límite real |
| --- | --- | --- |
| NOISOME | Audio nativo con archivo local, play/pausa, progreso y duración reales; ficha de objetos; cantidades, eliminación y resumen de carrito persistente | Audio sintetizado de prueba, no es música de Nicolás. Sin catálogo musical propio ni ventas |
| NORTH / OBJECTS | Fotos locales, filtro, ficha, carrito persistente, cantidades, eliminación y cierre demostrativo con reconocimiento explícito | Sin pago, stock, despacho ni generación de pedidos |
| Clara | Siete días con fechas completas; semanas anterior/siguiente; creación, edición, eliminación con deshacer; filtros; duración y detección de cruces por profesional | Datos ficticios y locales. Sin agenda compartida ni notificaciones |
| NQ | Partidas editables, cantidades/precios validados, descuento proporcional antes del impuesto, cargo no gravado, guardado y recuperación de hasta 100 cotizaciones, impresión/PDF | No es facturación ni un cálculo tributario productivo |
| FuturoUno | Búsqueda sin sensibilidad a acentos, categorías, orientación por servicio, descarga de formulario ilustrativo, FAQ y edición persistente de portada | Sin institución real, autenticación, emisión de documentos ni recepción de solicitudes |

Todos los datos guardados son solo de ese navegador/origen. Cambiar de dominio o abrir otro navegador no comparte datos. Se recupera una base segura si los registros están dañados/incompatibles; antes de sobrescribir se muestra un aviso. Si el navegador bloquea guardar se comunica que solo quedan en la sesión. Los antiguos datos del ZIP original no se migran: ahora se utilizan claves `nc-*-v2` para evitar interpretar mal registros sin fecha o estructura incompatible.

## Configurar contacto antes de publicar

En `js/config.js`:

- `whatsappNumber`: confirmar el número real, solo dígitos y código de país.
- `whatsappVerified`: poner `true` únicamente después de confirmarlo.
- `whatsappMessage`: texto inicial editable.

El original contenía **+5694595857340**. No se ha corregido ni usado como destino porque falta confirmación. Por ahora el botón abre un diálogo con una alternativa de contacto.

El correo `ni.cortez@duocuc.cl` se preservó del archivo original: confirmar que esté vigente. Si cambia, actualizar también el enlace de `index.html` y los textos de contacto/términos. GitHub se conservó como `https://github.com/N0isome`; su consulta web no pudo verificarse desde este entorno.

## Vercel

Preparado técnicamente, **no desplegado**.

1. Sube el contenido a tu repositorio (incluye los archivos de `assets`, `data` y `js`).
2. Importa el repositorio en Vercel. Selecciona `portfolio` como Root Directory si mantienes esa carpeta; si subes su contenido a la raíz, usa la raíz.
3. Framework Preset: **Other**. No se necesita instalación ni Build Command. Output Directory: `.`. `vercel.json` ya configura estos valores y cabeceras.
4. Tras desplegar, abre directamente `/proyectos.html`, cada `/demo-*.html` y `/terminos.html`; recarga para confirmar rutas y JSON.
5. Revisa en navegador real los anchos y recorridos de `VALIDACION.md` antes de dar la versión por validada visualmente.

**Plan gratuito:** documentación oficial consultada el 25/09/2026: Vercel Hobby se limita a uso personal no comercial. Mostrar demos personales no equivale necesariamente a operar una tienda, pero este portfolio ofrece servicios y busca clientes, por lo que hay que aclarar su elegibilidad con Vercel antes de asumir que Hobby cubre el uso previsto. No se contrató un plan ni se cambió de plataforma.

Fuentes oficiales:
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/limits/fair-use-guidelines
- https://vercel.com/docs/project-configuration

## Recursos, peso y mantenimiento

Fotografía Unsplash descargada y optimizada en WebP; fuentes exactas en `data/assets.json`. Sin solicitudes a Unsplash al visitar la web. Audio WAV mono de 24 segundos (aprox. 1 MB), `preload="metadata"`; generador en `tools/generate-audio.py`, sin muestras de terceros. No se atribuye el audio ni las personas fotografiadas a Nicolás.

Las portadas de proyecto son **composiciones ilustradas con fotografía y elementos de sus interfaces**, no capturas de navegador. No existe previsualización en vivo. Las fotos y fichas son ilustrativas, sin asociación comercial con las marcas que puedan aparecer.

No se usan iconos decorativos en lugar de los productos. No se añadieron analítica, formularios de envío o rastreadores propios. El servidor de alojamiento puede mantener registros técnicos bajo sus propias condiciones.

- `portfolio.css`, `interactions.js`, `liquid.js`: portfolio.
- `demo.css`: estilos compartidos y variantes de los cinco proyectos.
- `js/common.js`: almacenamiento validado, formato y modales.
- `js/catalog.js`, `js/commerce.js`: catálogo y recorridos de compra.
- `js/dental.js`, `js/quote.js`, `js/portal.js`: lógica de cada herramienta.
- `data/terms.json`: términos editables.

La configuración de caché de assets usa una hora, sin `immutable` porque los nombres no llevan hash. Si cambias un recurso y necesitas invalidación inmediata, renómbralo y actualiza sus rutas. El `.vercelignore` excluye herramientas de pruebas y documentación interna del despliegue.

## Verificación

Lee `VALIDACION.md`: se realizaron pruebas de comportamiento en DOM emulado, sintaxis, datos y rutas. El entorno de navegador rechazó abrir el servidor local; **no se certifica el responsive, la ausencia de solapamientos ni la apariencia en navegadores reales**. No se generaron capturas de escritorio/móvil. Se entregan las pruebas reproducibles y un checklist preciso de lo pendiente.

Para repetir las pruebas de DOM (solo desarrollo, no necesario para alojar):

```sh
npm install --prefix tools/qa jsdom@26
node tools/functional-tests.cjs
```

Estas pruebas no sustituyen un navegador ni verifican sonido, WebGL, foco nativo o impresión renderizada.
