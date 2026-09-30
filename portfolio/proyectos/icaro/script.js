const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const cartDialog = document.querySelector('#cart-dialog');
const cartItems = document.querySelector('.cart-items');
const cartEmpty = document.querySelector('.cart-empty');
const cartTotal = document.querySelector('.cart-total strong');
const cartCount = document.querySelector('.cart-count');
const cartButton = document.querySelector('[data-open-cart]');
const toast = document.querySelector('.toast');

document.querySelector('#year').textContent = new Date().getFullYear();

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  navigation.classList.toggle('is-open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  navigation?.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

navigation?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 1050) closeMenu();
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.product-card').forEach((card) => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
    });
  });
});

let cart = [];
try {
  cart = JSON.parse(localStorage.getItem('icaro-cart')) || [];
} catch {
  cart = [];
}

const productCatalog = new Map(
  [...document.querySelectorAll('.product-card')].map((card) => [card.dataset.id, {
    id: card.dataset.id,
    name: card.dataset.name,
    price: Number(card.dataset.price),
  }]),
);

cart = cart
  .filter((item) => item && productCatalog.has(item.id))
  .map((item) => ({
    ...productCatalog.get(item.id),
    quantity: Math.min(Math.max(Number.parseInt(item.quantity, 10) || 1, 1), 99),
  }));

const money = new Intl.NumberFormat('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
});

function persistCart() {
  try { localStorage.setItem('icaro-cart', JSON.stringify(cart)); } catch { /* Demo remains usable in memory. */ }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartCount.textContent = count;
  cartButton.setAttribute('aria-label', `Abrir carrito, ${count} ${count === 1 ? 'producto' : 'productos'}`);
  cartTotal.textContent = money.format(total);
  cartEmpty.hidden = cart.length > 0;
  document.querySelector('.checkout').disabled = cart.length === 0;
  cartItems.replaceChildren();
  cart.forEach((item) => {
    const row = document.createElement('div');
    const name = document.createElement('span');
    const subtotal = document.createElement('strong');
    const remove = document.createElement('button');
    row.className = 'cart-item';
    name.textContent = `${item.name} × ${item.quantity}`;
    subtotal.textContent = money.format(item.price * item.quantity);
    remove.type = 'button';
    remove.dataset.remove = item.id;
    remove.setAttribute('aria-label', `Quitar ${item.name}`);
    remove.textContent = '×';
    row.append(name, subtotal, remove);
    cartItems.append(row);
  });
  cartItems.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      cart = cart.filter((item) => item.id !== button.dataset.remove);
      persistCart();
      renderCart();
    });
  });
}

document.querySelectorAll('.add-to-cart').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.product-card');
    const existing = cart.find((item) => item.id === card.dataset.id);
    if (existing) existing.quantity = Math.min(existing.quantity + 1, 99);
    else cart.push({ ...productCatalog.get(card.dataset.id), quantity: 1 });
    persistCart();
    renderCart();
    showToast(`${card.dataset.name} añadido.`);
  });
});

document.querySelectorAll('[data-open-cart]').forEach((button) => {
  button.addEventListener('click', () => cartDialog.showModal());
});
document.querySelector('[data-close-cart]')?.addEventListener('click', () => cartDialog.close());
cartDialog?.addEventListener('click', (event) => {
  if (event.target === cartDialog) cartDialog.close();
});
renderCart();

document.querySelector('.checkout')?.addEventListener('click', () => {
  if (!cart.length) return;
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const body = 'ÍCARO / SELECCIÓN DE DEMOSTRACIÓN\n\n' +
    cart.map(item => `${item.quantity} × ${item.name} — ${money.format(item.price * item.quantity)}`).join('\n') +
    `\n\nTotal de referencia: ${money.format(total)}\nSin pedido ni pago real.`;
  const url = URL.createObjectURL(new Blob([body], {type:'text/plain;charset=utf-8'}));
  const a = document.createElement('a');
  a.href = url; a.download = 'icaro-seleccion.txt'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Selección preparada para descargar.');
});

document.querySelector('.newsletter-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = event.currentTarget.elements.email;
  const status = event.currentTarget.querySelector('.form-status');
  if (!email.validity.valid) {
    status.textContent = 'Ingresa un correo válido para continuar.';
    email.focus();
    return;
  }
  status.textContent = 'Listo. Esta demostración guardó tu intención, sin enviar datos.';
  event.currentTarget.reset();
});

document.querySelector('.audio-toggle')?.addEventListener('click', (event) => {
  showToast('Abriendo búsqueda de videos oficiales.');
});

document.querySelectorAll('[data-legal]').forEach((button) => {
  button.addEventListener('click', () => {
    const isShipping = button.dataset.legal === 'shipping';
    showToast(isShipping ? 'Demo: módulo preparado para políticas de envío reales.' : 'Demo: términos listos para reemplazar por texto legal final.');
  });
});
