# Kintsugi

MVP de una plataforma para reparar objetos. Una persona publica una fotografía y describe el problema; un reparador envía una propuesta; el dueño la acepta, sigue el estado y deja una reseña al terminar.

Este proyecto se incluye como ejemplo de desarrollo en el portafolio de Nicolás Cortez. La presentación estática está en [`../../portfolio/proyectos/kintsugi.html`](../../portfolio/proyectos/kintsugi.html); esta carpeta contiene el frontend y el servidor completos de la aplicación.

## Funciones implementadas

- Interfaz adaptable con porcelana, azul cobalto y uniones doradas.
- Identidad con ChatGPT y autorización en las operaciones del servidor.
- Datos persistentes en D1 y fotos privadas en R2.
- Publicación con foto JPG/PNG/WebP de hasta 6 MB y validación del contenido en servidor.
- Perfiles de reparador, especialidades y búsqueda por distancia desde una comuna o ubicación del dispositivo.
- Propuestas con precio en CLP, plazo y alcance. Una propuesta por reparador y una aceptada por solicitud.
- Aceptación atómica, cierre de otras propuestas, cancelación, retiro, finalización y reseñas vinculadas al trabajo.
- Recorrido de ejemplo con dos propuestas ficticias y sin cobro. Sus reseñas no alteran la reputación real.
- Tres fotografías generadas para casos ficticios, incluidas en `public/assets/`.

La ubicación de los perfiles es el centro aproximado de la comuna, no una dirección exacta. La distancia es en línea recta. El despliegue operativo conserva acceso privado; el código y la presentación del portafolio son públicos.

## Stack y estructura

React, TypeScript y Vinext; Cloudflare Workers, D1 y R2. Los componentes de interfaz proceden de la base incluida y se conservan sus archivos de licencia.

| Ruta | Responsabilidad |
| --- | --- |
| `app/kintsugi.tsx` | Interfaz y recorrido de reparación |
| `app/api/kintsugi/route.ts` | Perfiles, solicitudes, propuestas, estados y reseñas |
| `app/api/images/route.ts` | Validación, almacenamiento y acceso a fotografías |
| `db/schema.ts` y `drizzle/` | Esquema y migración de D1 |
| `lib/data.ts` | Casos ficticios, categorías, comunas y cálculo de distancia |
| `scripts/verify-mvp.mjs` | Pruebas de integración en un Worker local |
| `supabase/migrations/` | Referencia del esquema inicial y refuerzo para una futura adaptación |

## Desarrollo local

Requisitos: Node 22.13 o superior y pnpm 11.25.0. Ejecutar desde esta carpeta:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm db:apply:local
pnpm dev
```

`build` genera el Worker y su configuración en `dist/server/`. `db:apply:local` aplica el SQL a D1 local; ejecutarlo una sola vez sobre una base nueva. `dev` abre el desarrollo en el puerto 5173 con los bindings locales y la simulación local de inicio de sesión. `pnpm start` permite revisar el build con persistencia en `.wrangler/state`, pero no añade un proveedor de inicio de sesión.

La copia publicada declara solamente los bindings lógicos `DB` y `BUCKET` en `.openai/hosting.json`: no incluye el identificador del despliegue original ni una base de datos, fotografías de usuarios o credenciales. Los recursos de producción los administra Sites en el despliegue operativo.

La simulación de identidad del plugin funciona únicamente en desarrollo local. En producción, los encabezados de identidad `oai-authenticated-*` deben proceder del gateway de autenticación de Sites. **No publicar este Worker directamente en un dominio que permita al visitante inyectar esos encabezados**: una adaptación a otro proveedor debe implementar una sesión verificada en servidor.

## Verificación

```sh
pnpm typecheck
pnpm build
pnpm test:integration
```

Las 52 comprobaciones de integración utilizan Miniflare, D1 y R2 de prueba e identidades sintéticas. Cubren permisos, subida y lectura privada, ofertas, aceptación concurrente, estados, reseñas y persistencia. No usan datos ni servicios de producción. Consultar [`docs/verification.md`](docs/verification.md).

La compilación y las comprobaciones del servidor no sustituyen una revisión visual en navegador ni validan WebMCP.

## Alcance pendiente

No se implementaron diagnóstico automático con IA, pagos Stripe, generación CAD ni descarga de piezas. La interfaz lo informa. Aceptar una propuesta asigna una reparación y no procesa un pago.

El MVP utiliza D1/R2, no Supabase. Se conserva el SQL adjunto en `supabase/migrations/0001_original.sql` y se agrega `0002_hardening.sql` para una futura implementación: grants explícitos, acceso restringido a fotografías y bloqueo consistente de solicitudes y ofertas. Estas migraciones requieren un proyecto Supabase nuevo con sus esquemas `auth`/`storage`; no son migraciones de D1 ni conectan automáticamente el frontend a Supabase.
