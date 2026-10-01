# Analítica del portfolio en Vercel

La medición está conectada a **Vercel Web Analytics** para el proyecto `nicolas-cortez` y su dominio público:

`https://nicolas-cortez.vercel.app`

Vercel Web Analytics se activa en cada página mediante:

- `js/vercel-analytics.js`: inicializa la cola de eventos de Vercel.
- `/_vercel/insights/script.js`: script servido por Vercel después del despliegue.

## Dónde revisar los datos

Abre el proyecto **nicolas-cortez** en Vercel y entra en **Analytics**. Selecciona el entorno **Production** para excluir las visitas a previews.

El panel muestra:

- visitantes y páginas vistas;
- páginas y proyectos más visitados;
- referentes y parámetros UTM;
- país aproximado;
- dispositivo, navegador y sistema operativo;
- tasa de rebote.

Los eventos personalizados requieren un plan Pro. En Hobby, las aperturas de proyectos se distinguen por la ruta de cada página.

## Saber qué enlace fue abierto

Genera un enlace distinto para cada envío mediante `utm_content`. Ejemplos:

```text
https://nicolas-cortez.vercel.app/?utm_source=linkedin&utm_medium=mensaje&utm_campaign=portfolio&utm_content=empresa_a
https://nicolas-cortez.vercel.app/?utm_source=email&utm_medium=cv&utm_campaign=portfolio&utm_content=empresa_b
```

Después abre **Analytics > UTM Parameters** y filtra por `utm_content`.

`utm_content` permite saber qué enlace se usó. No confirma la identidad de la persona si el enlace fue reenviado.

## Verificación

Después de cada despliegue:

1. Abre `https://nicolas-cortez.vercel.app` en una ventana privada.
2. Navega a dos proyectos.
3. Espera aproximadamente 30 segundos.
4. Revisa **Vercel > nicolas-cortez > Analytics** con el entorno **Production**.
