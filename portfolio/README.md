# Portfolio — Nicolás Cortez

Diseño editorial en borgoña, carmín y papel. Sitio estático: HTML, CSS y JavaScript nativo.

## Desarrollo

Desde `portfolio`, ejecutar `python -m http.server 8000` y abrir http://localhost:8000.

## Despliegue

Vercel: Root Directory `portfolio`, Framework `Other`, sin compilación. `vercel.json` mantiene la política CSP y las cabeceras. Los cambios de main se despliegan automáticamente.

## Proyectos

NOISOME: audio y selección de objetos. MATERIA: catálogo, filtros y carrito. ALBA: agenda y validación de horarios. CIFRA: cotizaciones con guardado e impresión. ÁGORA: servicios y edición de portada.

Todos son conceptos funcionales con datos locales. No procesan pagos, reservas ni trámites reales.

## Mantenimiento

- `portfolio.css`, `interactions.js`, `liquid.js`: portfolio y fondo.
- `demo.css`: base funcional de proyectos.
- `commerce-brand.css`: NOISOME y MATERIA.
- `workspaces.css`: ALBA, CIFRA y ÁGORA.
- `js/config.js`: contacto, conservado de la configuración del propietario.
- `data/assets.json` y `creditos.html`: autoría de recursos.

## Validación

`DESIGN-2026.md` documenta la dirección y sus límites. Para pruebas DOM, instalar `jsdom@26` en un directorio de desarrollo y ejecutar con ese NODE_PATH:

```sh
node tools/functional-tests.cjs
node tools/interface-tests.cjs
```

Las pruebas DOM no sustituyen la revisión visual ni las pruebas en dispositivos físicos.



## Kintsugi: caso de ejemplo

Kintsugi se incorpora como quinto proyecto en la portada y tiene una presentación pública en `proyectos/kintsugi.html`. El código completo del MVP se conserva en [`../projects/kintsugi`](../projects/kintsugi), fuera de la carpeta que Vercel publica.

La aplicación utiliza React, TypeScript, Vinext, Workers, D1 y R2. El caso del portafolio enlaza su código y documentación; no intenta ejecutar un Worker dentro del hosting estático de Vercel. El despliegue operativo mantiene acceso privado. IA, pagos Stripe y CAD quedan pendientes.
