// Small shared primitives. User-entered strings are always escaped or inserted as text.
export const $ = (s, root = document) => root.querySelector(s);
export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const money = (n) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
export function notice(text, error = false) {
  let n = $("#global-status");
  if (!n) {
    n = document.createElement("p");
    n.id = "global-status";
    n.className = "notice";
    n.setAttribute("role", "status");
    $("main").prepend(n);
  }
  n.textContent = text;
  n.classList.toggle("error", error);
}
// Versioned keys do not migrate incompatible original demo arrays silently.
export function read(key, fallback, valid) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return structuredClone(fallback);
    const data = JSON.parse(raw);
    if (!valid(data)) throw Error("shape");
    return data;
  } catch {
    notice(
      "No se pudieron recuperar los datos locales. Se abrió una base segura; al guardar se reemplazará el registro incompatible.",
      true,
    );
    return structuredClone(fallback);
  }
}
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    notice(
      "El navegador bloqueó el guardado. Los cambios estarán disponibles solo durante esta sesión.",
      true,
    );
    return false;
  }
}
export function dialog(id, title) {
  const el = document.createElement("dialog");
  el.id = id;
  el.setAttribute("aria-labelledby", id + "-title");
  el.innerHTML = `<div class="dialog-head"><h2 id="${id}-title">${esc(title)}</h2><button class="btn" data-close aria-label="Cerrar ventana">Cerrar ×</button></div><div class="dialog-body"></div>`;
  document.body.append(el);
  el.querySelector("[data-close]").addEventListener("click", () => el.close());
  return el;
}
export const dateISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const validDate = (s) =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !isNaN(new Date(s + "T12:00:00")) &&
  dateISO(new Date(s + "T12:00:00")) === s;
export const normalized = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
