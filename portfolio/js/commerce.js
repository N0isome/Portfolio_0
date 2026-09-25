import { $, esc, money, read, save, dialog } from "./common.js";
import { shop, merch } from "./catalog.js";
const artist = document.body.classList.contains("artist"),
  products = artist ? merch : shop,
  key = artist ? "nc-artist-v2" : "nc-shop-v2";
const valid = (c) =>
  Array.isArray(c) &&
  c.length <= products.length &&
  new Set(c.map((x) => x?.id)).size === c.length &&
  c.every(
    (x) =>
      x &&
      products.some((p) => p.id === x.id) &&
      Number.isInteger(x.qty) &&
      x.qty > 0 &&
      x.qty <= 99,
  );
let cart = read(key, [], valid),
  filter = "Todo";
const cartDialog = dialog("cart", "Tu selección"),
  detail = dialog("product-detail", "Detalle de producto");
const count = () => cart.reduce((n, x) => n + x.qty, 0),
  total = () =>
    cart.reduce(
      (n, x) => n + x.qty * products.find((p) => p.id === x.id).price,
      0,
    );
function sync() {
  save(key, cart);
  updateBadge();
}
function updateBadge() {
  $("#cart-count").textContent = count();
}
function add(id) {
  const item = cart.find((x) => x.id === id);
  if (item) {
    if (item.qty < 99) item.qty++;
  } else cart.push({ id, qty: 1 });
  sync();
  if (detail.open) detail.close();
  renderCart();
  if (!cartDialog.open) cartDialog.showModal();
}
function renderProducts() {
  const found = products.filter(
    (p) => filter === "Todo" || p.category === filter,
  );
  $("#products").innerHTML = found
    .map(
      (p) =>
        `<article class="product"><button class="detail" data-detail="${p.id}" aria-label="Ver detalle de ${esc(p.name)}"><span class="image-wrap"><img src="assets/${p.image}.webp" alt="${esc(p.name)} — fotografía ilustrativa" width="900" height="900" loading="lazy"></span><h3>${esc(p.name)}</h3></button><div class="row between"><span class="small muted">${p.category}</span><span class="price">${money(p.price)}</span></div><button class="btn" data-add="${p.id}">Agregar a la selección +</button></article>`,
    )
    .join("");
  $("#result-count").textContent = found.length + " productos";
}
function renderCart() {
  const content = $(".dialog-body", cartDialog);
  content.innerHTML = `<p class="small">Carrito demostrativo · guardado solo en este navegador.</p>${
    cart.length
      ? cart
          .map((x) => {
            const p = products.find((p) => p.id === x.id);
            return `<div class="cart-row"><img src="assets/${p.image}.webp" alt=""><div><h3>${p.name}</h3><span>${money(p.price)} / unidad</span><div class="quantity"><button class="btn" data-minus="${p.id}" aria-label="Reducir cantidad de ${p.name}" ${x.qty === 1 ? "disabled" : ""}>−</button><span aria-label="Cantidad">${x.qty}</span><button class="btn" data-plus="${p.id}" aria-label="Aumentar cantidad de ${p.name}" ${x.qty === 99 ? "disabled" : ""}>+</button><button class="btn" data-remove="${p.id}">Quitar</button></div></div></div>`;
          })
          .join("")
      : '<p class="empty">Tu selección está vacía. Explora el catálogo y agrega un objeto.</p>'
  }<div class="total-row"><span>Total ilustrativo</span><strong>${money(total())}</strong></div><button class="btn primary" id="checkout" ${cart.length ? "" : "disabled"}>Revisar compra demo →</button><p class="small muted">Sin pagos, pedidos reales ni costos de envío. Los precios son ficticios.</p>`;
  $("#checkout", content).addEventListener("click", renderCheckout);
}
function renderCheckout() {
  const content = $(".dialog-body", cartDialog);
  content.innerHTML = `<span class="eyebrow">Resumen de compra · demostración</span><p>No solicitamos dirección ni datos bancarios porque esta tienda no procesa pedidos.</p>${cart
    .map((x) => {
      const p = products.find((p) => p.id === x.id);
      return `<p>${x.qty} × ${p.name} <strong>${money(x.qty * p.price)}</strong></p>`;
    })
    .join(
      "",
    )}<div class="total-row"><span>Total</span><strong>${money(total())}</strong></div><label><input id="demo-ack" type="checkbox"> Entiendo que es una prueba y no se realizará ningún cobro.</label><div class="dialog-actions"><button class="btn" id="back-cart">Volver al carrito</button><button class="btn primary" id="finish-demo" disabled>Finalizar recorrido demo</button></div>`;
  $("#demo-ack").onchange = (e) =>
    ($("#finish-demo").disabled = !e.target.checked);
  $("#back-cart").onclick = renderCart;
  $("#finish-demo").onclick = () => {
    content.innerHTML =
      '<h3>Recorrido terminado</h3><p>No se creó un pedido ni se procesó un pago. Tu selección sigue guardada para que puedas continuar probando.</p><button class="btn primary" id="continue">Seguir explorando</button>';
    $("#continue").onclick = () => cartDialog.close();
  };
}
function openProduct(id) {
  const p = products.find((p) => p.id === id);
  $(".dialog-body", detail).innerHTML =
    `<img class="detail-photo" src="assets/${p.image}.webp" alt="${esc(p.name)}"><h3>${p.name}</h3><p>${p.description}</p><p><strong>${money(p.price)}</strong></p><button class="btn primary" data-add="${p.id}">Agregar a la selección +</button>`;
  detail.showModal();
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.add) add(b.dataset.add);
  if (b.dataset.detail) openProduct(b.dataset.detail);
  const id = b.dataset.plus || b.dataset.minus || b.dataset.remove;
  if (id) {
    const item = cart.find((x) => x.id === id);
    if (!item) return;
    let focusAttr = "";
    if (b.dataset.remove) {
      cart = cart.filter((x) => x.id !== id);
    } else if (b.dataset.plus) {
      item.qty = Math.min(99, item.qty + 1);
      focusAttr = item.qty === 99 ? "minus" : "plus";
    } else {
      item.qty = Math.max(1, item.qty - 1);
      focusAttr = item.qty === 1 ? "plus" : "minus";
    }
    sync();
    renderCart();
    (focusAttr
      ? $(`[data-${focusAttr}="${id}"]`, cartDialog)
      : $("#checkout", cartDialog)
    )?.focus();
  }
});
$("#cart-open").onclick = () => {
  renderCart();
  cartDialog.showModal();
};
document.querySelectorAll("[data-filter]").forEach(
  (b) =>
    (b.onclick = () => {
      filter = b.dataset.filter;
      document
        .querySelectorAll("[data-filter]")
        .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      renderProducts();
    }),
);
renderProducts();
updateBadge();
const audio = $("audio");
if (audio)
  audio.addEventListener("error", () => {
    $("#audio-status").textContent =
      "El archivo de audio no pudo cargarse. Revisa que assets/estudio-senal.wav esté junto al proyecto.";
  });
