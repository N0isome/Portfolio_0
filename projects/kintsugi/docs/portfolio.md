# Kintsugi en el portafolio

La presentación pública explica el MVP y enlaza su código. El frontend operativo está en `projects/kintsugi`; la presentación estática está en `portfolio/proyectos/kintsugi.html`. Son dos superficies distintas: Vercel sirve el portafolio y el MVP necesita Workers, D1, R2 y su proveedor de identidad.

## Dirección visual

Paleta: Porcelana `#FFFFFF`, Esmalte `#234CD1`, Taller `#17242F`, Bruma `#E9EEF5`, Unión `#B9914D`, Grafito `#596672`.

Tipografía: Trebuchet MS para el nombre y los títulos; Verdana para lectura, navegación y botones, en coherencia con el producto. Texto alineado a la izquierda y párrafos de menos de 70 caracteres de ancho.

Composición propuesta: encabezado sencillo con regreso al portafolio; nombre y descripción en una columna azul; fotografía del jarrón en la segunda columna; recorrido secuencial; capacidades reales y límites; enlace al código. En móvil, el texto precede a la fotografía.

Alternativa comparada: una cuadrícula de capturas pequeñas. Se descarta porque todavía no hay capturas verificadas y fragmenta el recorrido. La fotografía del objeto tiene una función concreta: hace visible el problema que inicia una reparación. Una figura y su leyenda identifican el caso como ficticio, sin presentarlo como trabajo de un cliente.

## Revisión antes de construir

Se mantiene la tarjeta existente de los proyectos en la portada para respetar el portafolio actual. La página de Kintsugi conserva el azul del producto, el objeto y sus tipos; se elimina la posible cursiva dorada en el título y cualquier animación decorativa. La fotografía será el único gesto de gran escala. Los números aparecen solamente en el recorrido porque sus etapas sí son una secuencia.

El acceso privado del despliegue no se anuncia como una demo pública. El visitante tiene acceso al código y al caso completo sin iniciar sesión. Los estados y las pruebas documentadas corresponden al MVP real; IA, pagos y CAD figuran como trabajo pendiente.
