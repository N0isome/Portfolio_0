import { $, esc, read, save, dialog, normalized } from "./common.js";
const defaults = {
  title: "Lo que necesitas. Más cerca.",
  copy: "Información clara y servicios fáciles de encontrar. Un concepto de portal institucional centrado en las personas.",
  banner:
    "Encuentra documentos, conoce los pasos y resuelve tus dudas desde un mismo lugar.",
};
const key = "nc-portal-v2";
let content = read(
  key,
  defaults,
  (x) =>
    x &&
    ["title", "copy", "banner"].every(
      (k) => typeof x[k] === "string" && x[k].trim(),
    ) &&
    x.title.length <= 100 &&
    x.copy.length <= 500 &&
    x.banner.length <= 300,
);
function renderContent() {
  $("#hero-title").textContent = content.title;
  $("#hero-copy").textContent = content.copy;
  $("#banner-copy").textContent = content.banner;
  $("#edit-title").value = content.title;
  $("#edit-copy").value = content.copy;
  $("#edit-banner").value = content.banner;
}
$("#editor-form").onsubmit = (e) => {
  e.preventDefault();
  const next = {
    title: $("#edit-title").value.trim(),
    copy: $("#edit-copy").value.trim(),
    banner: $("#edit-banner").value.trim(),
  };
  if (Object.values(next).some((v) => !v)) {
    $("#editor-status").textContent = "Los textos no pueden quedar vacíos.";
    return;
  }
  content = next;
  const stored = save(key, content);
  renderContent();
  $("#editor-status").textContent = stored
    ? "Cambios guardados. La portada ya muestra tus textos."
    : "Cambios visibles solo en esta sesión.";
};
$("#reset-editor").onclick = () => {
  content = { ...defaults };
  const stored = save(key, content);
  renderContent();
  $("#editor-status").textContent = stored
    ? "Textos iniciales restaurados y guardados."
    : "Textos restaurados para esta sesión.";
};
const services = [
  {
    id: "certificates",
    title: "Certificados",
    category: "Documentos",
    text: "Conoce qué información necesitarías para solicitar un documento.",
    steps: [
      "Identificar el documento requerido.",
      "Acceder a una cuenta verificada en el servicio real.",
      "Revisar y descargar el documento emitido.",
    ],
    note: "Aquí no se emiten certificados ni se solicitan credenciales.",
  },
  {
    id: "forms",
    title: "Formularios",
    category: "Documentos",
    text: "Descarga una estructura de ejemplo para preparar una solicitud.",
    steps: [
      "Descargar el ejemplo.",
      "Completar solo datos ficticios para probarlo.",
      "Un servicio real requeriría un canal seguro para su envío.",
    ],
    note: "El archivo no es un formulario oficial y no se envía desde este portal.",
  },
  {
    id: "security",
    title: "Acceso y seguridad",
    category: "Ayuda",
    text: "Encuentra orientación para proteger tus accesos.",
    steps: [
      "Usar contraseñas únicas.",
      "Activar un segundo factor cuando esté disponible.",
      "Verificar la dirección del servicio antes de ingresar.",
    ],
    note: "Este portal no gestiona cuentas ni recupera contraseñas.",
  },
  {
    id: "channels",
    title: "Canales de atención",
    category: "Ayuda",
    text: "Entiende cómo se organizaría la atención en un portal real.",
    steps: [
      "Seleccionar el tipo de consulta.",
      "Elegir un canal verificado por la institución.",
      "Revisar horarios y requisitos.",
    ],
    note: "No existe un centro de atención conectado a esta demostración.",
  },
  {
    id: "status",
    title: "Estado de solicitudes",
    category: "Ayuda",
    text: "Conoce las etapas de seguimiento de un trámite.",
    steps: [
      "Recibida: se registró la solicitud.",
      "En revisión: se comprueban los antecedentes.",
      "Resuelta: el servicio informa el resultado.",
    ],
    note: "Estas son etapas ilustrativas. No se consultan solicitudes reales.",
  },
  {
    id: "guide",
    title: "Guía de documentos",
    category: "Documentos",
    text: "Organiza los antecedentes antes de comenzar.",
    steps: [
      "Revisar la lista de documentos del trámite.",
      "Comprobar fechas y legibilidad.",
      "Conservar una copia en un lugar seguro.",
    ],
    note: "Los requisitos concretos deben confirmarse con la institución responsable.",
  },
];
let category = "Todos";
const modal = dialog("service-detail", "Detalle del servicio");
function render() {
  const q = normalized($("#service-search").value);
  const found = services.filter(
    (s) =>
      (category === "Todos" || s.category === category) &&
      normalized(s.title + " " + s.text + " " + s.category).includes(q),
  );
  $("#service-count").textContent = found.length + " servicios";
  $("#services-grid").innerHTML = found.length
    ? found
        .map(
          (s) =>
            `<article class="service-card"><span class="eyebrow">${s.category}</span><h3>${s.title}</h3><p>${s.text}</p><button class="btn" data-service="${s.id}">Ver orientación ↗</button></article>`,
        )
        .join("")
    : '<p class="empty">No encontramos resultados. Prueba con otra palabra o categoría.</p>';
}
$("#service-search").oninput = render;
document.querySelectorAll("[data-category]").forEach(
  (b) =>
    (b.onclick = () => {
      category = b.dataset.category;
      document
        .querySelectorAll("[data-category]")
        .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    }),
);
$("#services-grid").onclick = (e) => {
  const b = e.target.closest("[data-service]");
  if (!b) return;
  const s = services.find((s) => s.id === b.dataset.service);
  $("#service-detail-title").textContent = s.title;
  $(".dialog-body", modal).innerHTML =
    `<p>${s.text}</p><ol>${s.steps.map((t) => `<li>${esc(t)}</li>`).join("")}</ol><p class="notice">${s.note}</p>${s.id === "forms" ? '<a class="btn primary" href="data/formulario-ejemplo.txt" download>Descargar formulario de ejemplo</a>' : ""}`;
  modal.showModal();
};
renderContent();
render();
