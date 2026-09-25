import { $, esc, money, read, save, dateISO, validDate } from "./common.js";
const key = "nc-quotes-v2",
  form = $("#quote-form");
let currentID = null;
const integer = (n, min, max) =>
  Number.isSafeInteger(n) && n >= min && n <= max;
function valid(q) {
  return (
    q &&
    typeof q.id === "string" &&
    ["number", "company", "client", "note"].every(
      (k) => typeof q[k] === "string",
    ) &&
    q.number.trim() &&
    q.company.trim() &&
    q.client.trim() &&
    q.number.length <= 32 &&
    q.company.length <= 100 &&
    q.client.length <= 100 &&
    q.note.length <= 2000 &&
    validDate(q.date) &&
    integer(q.discount, 0, 1e9) &&
    integer(q.charge, 0, 1e9) &&
    Array.isArray(q.items) &&
    q.items.length > 0 &&
    q.items.length <= 50 &&
    q.items.every(
      (i) =>
        typeof i.description === "string" &&
        i.description.trim() &&
        i.description.length <= 160 &&
        integer(i.qty, 1, 10000) &&
        integer(i.price, 0, 1e8) &&
        [0, 19].includes(i.tax),
    ) &&
    q.items.reduce((n, i) => n + i.qty * i.price, 0) >= q.discount
  );
}
let quotes = read(
  key,
  [],
  (x) =>
    Array.isArray(x) &&
    x.length <= 100 &&
    x.every(valid) &&
    new Set(x.map((q) => q.id)).size === x.length,
);
function row(
  item = { description: "Nueva partida", qty: 1, price: 0, tax: 0 },
) {
  const div = document.createElement("div");
  div.className = "quote-item";
  div.innerHTML = `<label>Descripción<input class="description" required maxlength="160" value="${esc(item.description)}"></label><label>Cantidad<input class="qty" type="number" min="1" max="10000" step="1" required value="${item.qty}"></label><label>Precio unitario<input class="price" type="number" min="0" max="100000000" step="1" required value="${item.price}"></label><label>Impuesto<select class="tax"><option value="0">Sin impuesto</option><option value="19">19%</option></select></label><button class="btn danger remove" type="button" aria-label="Quitar partida">Quitar</button>`;
  $(".tax", div).value = item.tax;
  $(".remove", div).onclick = () => {
    if ($("#quote-items").children.length === 1) {
      status("Debes conservar al menos una partida.", true);
      return;
    }
    div.remove();
    calc();
  };
  $("#quote-items").append(div);
}
function payload() {
  return {
    id: currentID || "draft",
    number: $("#quote-number").value.trim(),
    date: $("#quote-date").value,
    company: $("#quote-company").value.trim(),
    client: $("#quote-client").value.trim(),
    note: $("#quote-note").value,
    discount: Number($("#discount").value),
    charge: Number($("#charge").value),
    items: [...document.querySelectorAll(".quote-item")].map((el) => ({
      description: $(".description", el).value.trim(),
      qty: Number($(".qty", el).value),
      price: Number($(".price", el).value),
      tax: Number($(".tax", el).value),
    })),
  };
}
// Allocate integer discount proportionally with the largest remainder method.
// Sum of line discounts always equals entered discount, including rounding.
export function calculate(q) {
  const subtotal = q.items.reduce((s, i) => s + i.qty * i.price, 0);
  const raw = q.items.map((i) =>
    subtotal ? (q.discount * i.qty * i.price) / subtotal : 0,
  );
  const discounts = raw.map(Math.floor);
  let remainder = q.discount - discounts.reduce((a, b) => a + b, 0);
  raw
    .map((r, i) => ({ i, f: r - discounts[i] }))
    .sort((a, b) => b.f - a.f)
    .slice(0, remainder)
    .forEach((x) => discounts[x.i]++);
  const lines = q.items.map((i, index) => {
    const net = i.qty * i.price - discounts[index];
    const tax = Math.round((net * i.tax) / 100);
    return {
      ...i,
      discount: discounts[index],
      net,
      taxAmount: tax,
      total: net + tax,
    };
  });
  const taxes = lines.reduce((s, i) => s + i.taxAmount, 0);
  return {
    subtotal,
    discount: q.discount,
    taxes,
    charge: q.charge,
    total: subtotal - q.discount + taxes + q.charge,
    lines,
  };
}
function status(t, error = false) {
  $("#quote-status").textContent = t;
  $("#quote-status").classList.toggle("error", error);
}
function totals(t) {
  return `<p><span>Subtotal</span><strong>${money(t.subtotal)}</strong></p><p><span>Descuento</span><strong>− ${money(t.discount)}</strong></p><p><span>Impuestos</span><strong>${money(t.taxes)}</strong></p><p><span>Cargo no gravado</span><strong>${money(t.charge)}</strong></p><p><span>Total</span><strong>${money(t.total)}</strong></p>`;
}
function calc() {
  const q = payload();
  const discount = $("#discount");
  discount.setCustomValidity("");
  const sub = q.items.reduce((s, i) => s + i.qty * i.price, 0);
  if (q.discount > sub)
    discount.setCustomValidity("El descuento no puede superar el subtotal.");
  if (!valid(q) || !form.checkValidity()) {
    $("#quote-totals").textContent =
      "Completa valores válidos para calcular. El descuento no puede superar el subtotal.";
    $("#print-sheet").replaceChildren();
    return;
  }
  const t = calculate(q);
  $("#quote-totals").innerHTML = totals(t);
  $("#print-sheet").innerHTML =
    `<h2>Cotización ${esc(q.number)}</h2><p>${esc(q.company)} · ${esc(q.date)}<br>Cliente: ${esc(q.client)}</p><table><thead><tr><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Descuento</th><th>Impuesto</th><th>Total</th></tr></thead><tbody>${t.lines.map((i) => `<tr><td>${esc(i.description)}</td><td>${i.qty}</td><td>${money(i.price)}</td><td>${money(i.discount)}</td><td>${money(i.taxAmount)}</td><td>${money(i.total)}</td></tr>`).join("")}</tbody></table><div class="totals">${totals(t)}</div><h3>Condiciones</h3><p>${esc(q.note)}</p><footer>Documento demostrativo. No constituye factura. Moneda: CLP. Descuento proporcional antes de impuestos; cargo no gravado.</footer>`;
}
function savedList() {
  $("#saved-quotes").innerHTML =
    '<option value="">Seleccionar</option>' +
    quotes
      .map(
        (q) =>
          `<option value="${esc(q.id)}">${esc(q.number)} · ${esc(q.client)} · ${esc(q.date)}</option>`,
      )
      .join("");
  if (currentID) $("#saved-quotes").value = currentID;
}
function fill(q) {
  currentID = q.id === "draft" ? null : q.id;
  for (const [id, key] of [
    ["quote-number", "number"],
    ["quote-date", "date"],
    ["quote-company", "company"],
    ["quote-client", "client"],
    ["quote-note", "note"],
    ["discount", "discount"],
    ["charge", "charge"],
  ])
    $("#" + id).value = q[key];
  $("#quote-items").replaceChildren();
  q.items.forEach(row);
  calc();
}
form.addEventListener("input", calc);
form.addEventListener("change", calc);
form.onsubmit = (e) => {
  e.preventDefault();
  calc();
  if (!form.reportValidity() || !valid(payload())) return;
  const q = payload();
  q.id = currentID || crypto.randomUUID();
  if (!currentID && quotes.length >= 100) {
    status("Límite de 100 cotizaciones. Elimina una antes de continuar.", true);
    return;
  }
  quotes = currentID
    ? quotes.map((x) => (x.id === currentID ? q : x))
    : [...quotes, q];
  currentID = q.id;
  const stored = save(key, quotes);
  savedList();
  status(
    stored
      ? "Cotización guardada en este navegador."
      : "Cotización disponible solo durante esta sesión.",
    !stored,
  );
};
$("#add-item").onclick = () => {
  if ($("#quote-items").children.length >= 50) {
    status("Máximo 50 partidas.", true);
    return;
  }
  row();
  calc();
};
$("#load-quote").onclick = () => {
  const q = quotes.find((q) => q.id === $("#saved-quotes").value);
  if (!q) {
    status("Selecciona una cotización guardada.", true);
    return;
  }
  fill(q);
  status("Cotización recuperada. Puedes editarla y volver a guardar.");
};
$("#delete-quote").onclick = () => {
  const id = $("#saved-quotes").value;
  if (!id) {
    status("Selecciona una cotización.", true);
    return;
  }
  const deleted = quotes.find((q) => q.id === id);
  quotes = quotes.filter((q) => q.id !== id);
  if (currentID === id) currentID = null;
  save(key, quotes);
  savedList();
  status("Cotización eliminada. ");
  const undo = document.createElement("button");
  undo.className = "btn";
  undo.type = "button";
  undo.textContent = "Deshacer";
  $("#quote-status").append(undo);
  undo.onclick = () => {
    quotes.push(deleted);
    save(key, quotes);
    savedList();
    status("Cotización restaurada.");
  };
};
$("#new-quote").onclick = () => {
  fill({
    id: "draft",
    number: "COT-" + Date.now().toString().slice(-6),
    date: dateISO(new Date()),
    company: "Estudio Demo",
    client: "Cliente Ejemplo",
    note: "Cotización demostrativa. Vigencia: 15 días.",
    discount: 0,
    charge: 0,
    items: [
      {
        description: "Desarrollo e implementación",
        qty: 1,
        price: 90000,
        tax: 0,
      },
    ],
  });
  savedList();
  status("Nuevo borrador. Guarda para conservarlo.");
};
$("#print-quote").onclick = () => {
  calc();
  if (form.reportValidity() && valid(payload())) window.print();
};
$("#quote-date").value = dateISO(new Date());
row({
  description: "Desarrollo e implementación",
  qty: 1,
  price: 90000,
  tax: 0,
});
calc();
savedList();
