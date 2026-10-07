'use strict';
(() => {
  const products = [
    { id: 'orbit', name: 'Aro', type: 'ambient', category: 'Luz difusa', subtitle: 'Luz difusa · 42 cm de alto', price: 289000, dimensions: '42 × 28 × 18 cm', watts: '12 W · LED regulable', story: 'Un anillo de metal con iluminación continua. Su luz difusa acompaña mesas auxiliares y repisas.', imageWidth: 933, imageHeight: 1400 },
    { id: 'fold', name: 'Pliegue', type: 'directed', category: 'Luz dirigida', subtitle: 'Luz dirigida · 38 cm de alto', price: 249000, dimensions: '38 × 24 × 16 cm', watts: '10 W · LED regulable', story: 'Una lámina de metal plegada orienta la luz hacia la superficie de la mesa. Pensada para escritorios y zonas de lectura.', imageWidth: 1000, imageHeight: 1200 },
    { id: 'pulse', name: 'Cúpula', type: 'ambient', category: 'Luz ambiental', subtitle: 'Luz suave · 30 cm de alto', price: 219000, dimensions: '30 × 32 × 32 cm', watts: '8 W · LED regulable', story: 'Una pantalla de metal en forma de cúpula proyecta luz suave hacia abajo. Una opción para veladores y mesas auxiliares.', imageWidth: 1000, imageHeight: 1000 },
  ];
  const finishes = { chrome: 'Cromo', graphite: 'Grafito', copper: 'Cobre' };
  const money = value => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const findProduct = id => products.find(product => product.id === id);
  const preview = Object.fromEntries(products.map(p => [p.id, { finish: 'chrome', power: true, intensity: 70 }]));
  let currentProduct = null;
  let labProduct = 'orbit';
  let labMood = 'warm';
  let lampTransition;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionSetting = 'auto';
  try {
    const saved = localStorage.getItem('vanta-motion-mode');
    if (['auto', 'full', 'reduced'].includes(saved)) motionSetting = saved;
    else if (localStorage.getItem('vanta-motion-paused') === 'true') motionSetting = 'reduced';
  } catch {}
  const canAnimate = () => !document.hidden && (motionSetting === 'full' || (motionSetting === 'auto' && !reducedMotion.matches));
  let toastTimer;
  let bag = [];
  try {
    const saved = JSON.parse(localStorage.getItem('vanta-selection') || '[]');
    if (Array.isArray(saved)) bag = saved.map(item => item?.finish === 'acid' ? { ...item, finish: 'copper' } : item).filter(item => item && findProduct(item.id) && Object.hasOwn(finishes, item.finish) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99).slice(0, 9);
  } catch { /* Selection remains available when browser storage is restricted. */ }

  const powerIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v8M7.2 5.7a8 8 0 1 0 9.6 0"/></svg>';
  const swatches = id => `<div class="finish-chips detail-finishes" role="group" aria-label="Acabado de ${findProduct(id).name}">${Object.entries(finishes).map(([key, name]) => `<button class="${preview[id].finish === key ? 'selected' : ''}" data-finish="${key}" data-id="${id}" aria-pressed="${preview[id].finish === key}"><i class="finish-dot ${key === 'copper' ? 'copper-finish' : key}" aria-hidden="true"></i>${name}</button>`).join('')}</div>`;

  function renderCatalog() {
    $('#product-grid').innerHTML = products.map((p, index) => `<article class="product-card" data-type="${p.type}" aria-labelledby="title-${p.id}" style="--card-index:${index}">
      <div class="card-visual product-scene" data-product="${p.id}" data-finish="${preview[p.id].finish}" data-power="${preview[p.id].power ? 'on' : 'off'}">
        <div class="card-top"><span>${p.category}</span><button class="card-light" data-toggle-power="${p.id}" aria-label="Apagar lámpara ${p.name}" aria-pressed="true">${powerIcon}<span>Apagar luz</span></button></div>
        <div class="lamp-aura" aria-hidden="true"></div><img class="lamp-image" src="assets/${p.id}.webp" alt="Lámpara ${p.name} de metal" width="${p.imageWidth}" height="${p.imageHeight}" loading="lazy">
      </div><div class="card-description"><div><h3 id="title-${p.id}"><button data-open-product="${p.id}">${p.name}</button></h3><p>${p.subtitle}</p></div><span class="card-price">${money(p.price)}</span></div>
      <p class="card-finish" data-current-finish="${p.id}">Acabado: ${finishes[preview[p.id].finish]}</p>
      <div class="card-bottom"><button class="text-button" data-open-product="${p.id}">Ver detalles <span aria-hidden="true">↗</span></button><button class="add-button" data-add="${p.id}" aria-pressed="false">Guardar lámpara <span aria-hidden="true">+</span></button></div>
    </article>`).join('');
  }

  function syncSavedButtons() {
    $$('[data-add]').forEach(button => {
      const saved = bag.some(item => item.id === button.dataset.add && item.finish === preview[button.dataset.add].finish);
      button.setAttribute('aria-pressed', String(saved));
      button.innerHTML = `${saved ? 'Guardada' : 'Guardar lámpara'} <span aria-hidden="true">${saved ? '✓' : '+'}</span>`;
    });
    const saved = bag.some(item => item.id === labProduct && item.finish === preview[labProduct].finish);
    $('#lab-add').setAttribute('aria-pressed', String(saved));
    $('#lab-add').innerHTML = `${saved ? 'Actualizar en mi lista' : 'Guardar lámpara'} <span aria-hidden="true">${saved ? '✓' : '+'}</span>`;
  }

  function syncPreview(id) {
    const state = preview[id];
    $$(`.product-scene[data-product="${id}"]`).forEach(scene => {
      scene.dataset.finish = state.finish;
      scene.dataset.power = state.power ? 'on' : 'off';
      scene.style.setProperty('--intensity', state.intensity / 100);
      scene.style.setProperty('--lamp-brightness', state.power ? .65 + state.intensity / 160 : .48);
    });
    $$(`[data-finish][data-id="${id}"]`).forEach(button => {
      const active = button.dataset.finish === state.finish;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $$(`[data-toggle-power="${id}"]`).forEach(button => {
      button.setAttribute('aria-pressed', String(state.power));
      button.setAttribute('aria-label', `${state.power ? 'Apagar' : 'Encender'} lámpara ${findProduct(id).name}`);
      const label = button.querySelector('span');
      if (label) label.textContent = state.power ? 'Apagar luz' : 'Encender luz';
    });
    if (id === 'orbit') {
      $('#hero-finish-label').textContent = finishes[state.finish];
      $('#hero-display').dataset.finish = state.finish;
      $('#hero-power').setAttribute('aria-pressed', String(state.power));
      $('#hero-power').setAttribute('aria-label', `${state.power ? 'Apagar' : 'Encender'} lámpara Aro`);
      $('#hero-intensity').value = state.intensity;
      $('#hero-intensity-value').textContent = state.intensity + '%';
      $$('[data-hero-finish]').forEach(button => {
        const active = button.dataset.heroFinish === state.finish;
        button.classList.toggle('selected', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }
    $$(`[data-current-finish="${id}"]`).forEach(label => label.textContent = `Acabado: ${finishes[state.finish]}`);
    if (id === labProduct) syncLabControls();
    syncSavedButtons();
    if (id === currentProduct) {
      $('#detail-finish-label').textContent = finishes[state.finish];
      $('#detail-intensity').value = state.intensity;
      $('#detail-intensity-value').textContent = state.intensity + '%';
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    try { if ($('#toast').showPopover && !$('#toast').matches(':popover-open')) $('#toast').showPopover(); } catch { /* Keep the live announcement in older browsers. */ }
    $('#toast').classList.add('show');
    toastTimer = setTimeout(() => { $('#toast').classList.remove('show'); try { $('#toast').hidePopover?.(); } catch {} }, 2700);
  }

  function openDialog(dialog) {
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
  }

  function openProduct(id) {
    const p = findProduct(id);
    if (!p) throw new Error('Pieza no disponible.');
    currentProduct = id;
    $('#product-detail').innerHTML = `<div class="detail-layout"><div class="detail-scene product-scene" data-product="${id}"><div class="lamp-aura" aria-hidden="true"></div><img class="lamp-image" src="assets/${id}.webp" alt="Lámpara ${p.name}, vista de detalle" width="${p.imageWidth}" height="${p.imageHeight}"><button class="power-button" data-toggle-power="${id}" aria-pressed="true" aria-label="Apagar lámpara ${p.name}">${powerIcon}</button></div><div class="detail-copy"><p class="eyebrow">${p.category}</p><h2 id="detail-title">${p.name}</h2><p class="detail-subtitle">${p.subtitle}</p><p class="detail-story">${p.story}</p><fieldset class="finish-field"><legend>Acabado <span id="detail-finish-label">${finishes[preview[id].finish]}</span></legend>${swatches(id)}</fieldset><label class="intensity-control detail-intensity" for="detail-intensity"><span>Intensidad <output id="detail-intensity-value">${preview[id].intensity}%</output></span><input id="detail-intensity" data-detail-id="${id}" type="range" min="10" max="100" value="${preview[id].intensity}"></label><div class="detail-specs"><div><span>DIMENSIONES</span>${p.dimensions}</div><div><span>ILUMINACIÓN</span>${p.watts}</div></div><p class="detail-price">${money(p.price)}</p><button class="button primary" data-add="${id}">Guardar lámpara <span class="button-icon" aria-hidden="true">+</span></button><button class="text-button" data-start-lab="${id}">Probar en el simulador <span aria-hidden="true">↗</span></button><p class="detail-note">Colección conceptual. Precio de referencia. El acabado y la luz en pantalla son una simulación visual.</p></div></div>`;
    syncPreview(id);
    openDialog($('#product-dialog'));
  }

  function persistBag() {
    try { localStorage.setItem('vanta-selection', JSON.stringify(bag)); } catch { /* No external storage needed. */ }
    $('#bag-count').textContent = bag.reduce((sum, item) => sum + item.quantity, 0);
    $('#open-bag').setAttribute('aria-label', `Abrir mi lista, ${$('#bag-count').textContent} lámparas`);
    syncSavedButtons();
  }

  function addToBag(id, captureScene = false) {
    const product = findProduct(id);
    if (!product) return;
    const finish = preview[id].finish;
    const item = bag.find(item => item.id === id && item.finish === finish);
    const reference = captureScene ? { mood: labMood, intensity: preview[id].intensity, power: preview[id].power } : undefined;
    if (item) {
      if (captureScene) item.reference = reference;
      showToast(captureScene ? `${product.name} · Vista previa actualizada en tu lista` : `${product.name} en ${finishes[finish].toLowerCase()} ya está en tu lista`);
    } else {
      bag.push({ id, finish, quantity: 1, ...(reference ? { reference } : {}) });
      showToast(`${product.name} en ${finishes[finish].toLowerCase()} · Guardada en mi lista`);
    }
    persistBag();
    if ($('#bag-dialog').open) renderBag();
  }

  function renderBag() {
    $('#bag-items').innerHTML = bag.length ? bag.map((item, index) => {
      const p = findProduct(item.id);
      return `<article class="bag-item"><img src="assets/${p.id}.webp" alt="${p.name}" width="93" height="115"><div class="bag-item-copy"><h3>${p.name}</h3><p>${finishes[item.finish]}</p>${item.reference && Object.hasOwn(moods, item.reference.mood) && Number.isInteger(item.reference.intensity) ? `<p class="bag-reference">Referencia visual: ${item.reference.mood === 'warm' ? 'Cálida' : item.reference.mood === 'cyan' ? 'Cian' : item.reference.mood === 'magenta' ? 'Magenta' : 'Violeta'} · ${item.reference.intensity}%${item.reference.power ? '' : ' · apagada'}</p>` : ''}<div class="bag-item-meta"><div class="quantity" role="group" aria-label="Cantidad de ${p.name}, ${finishes[item.finish]}"><button data-quantity="-1" data-index="${index}" aria-label="Quitar una ${p.name}" ${item.quantity === 1 ? 'disabled' : ''}>−</button><span>${item.quantity}</span><button data-quantity="1" data-index="${index}" aria-label="Añadir una ${p.name}" ${item.quantity === 99 ? 'disabled' : ''}>+</button></div><span class="bag-item-price">${money(p.price * item.quantity)}</span></div><button class="remove-item" data-remove="${index}" aria-label="Eliminar ${p.name}, ${finishes[item.finish]}">Eliminar</button></div></article>`;
    }).join('') : '<div class="empty-bag"><div class="empty-icon" aria-hidden="true">+</div><h3>Tu lista está vacía.</h3><p>Pulsa «Guardar lámpara» en un modelo para añadirlo aquí.</p><button class="button primary" data-close-dialog data-browse-collection>Ver lámparas</button></div>';
    const total = bag.reduce((sum, item) => sum + findProduct(item.id).price * item.quantity, 0);
    $('#bag-summary').innerHTML = bag.length ? `<div class="bag-total"><span>Total de referencia</span><strong>${money(total)}</strong></div><button class="button primary" id="download-selection">Descargar mi lista <span class="button-icon" aria-hidden="true">+</span></button><p>Tu lista se guarda en este dispositivo. Descarga el resumen con modelos, acabados y cantidades. Esta colección conceptual no admite compras.</p>` : '';
  }

  function downloadSelection() {
    if (!bag.length) return;
    const total = bag.reduce((sum, item) => sum + findProduct(item.id).price * item.quantity, 0);
    const summary = ['VANTA — Mi lista de lámparas', 'Colección 2026', '', ...bag.map(item => `${findProduct(item.id).name} · ${finishes[item.finish]} · Cantidad: ${item.quantity} · ${money(findProduct(item.id).price * item.quantity)}${item.reference && Object.hasOwn(moods, item.reference.mood) && Number.isInteger(item.reference.intensity) ? `\nReferencia visual: ${moods[item.reference.mood].label} · ${item.reference.intensity}% · ${item.reference.power ? 'encendida' : 'apagada'}` : ''}`), '', `Total: ${money(total)}`, '', 'Colección conceptual. Precios de referencia en CLP. Este resumen no es una orden de compra.'].join('\n');
    const url = URL.createObjectURL(new Blob([summary], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'VANTA-mi-lista.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Tu lista se ha descargado.');
  }

  const moods = {
    violet: { label: 'Luz violeta' }, cyan: { label: 'Luz cian' },
    magenta: { label: 'Luz magenta' }, warm: { label: 'Luz cálida' },
  };

  function updateSceneCaption() {
    const state = preview[labProduct];
    $('#mood-name').textContent = `${findProduct(labProduct).name} · ${finishes[state.finish]}`;
    $('#mood-kelvin').textContent = state.power ? `${moods[labMood].label} · ${state.intensity}%` : 'Luz apagada';
  }

  function syncLabControls() {
    const state = preview[labProduct];
    $('#lab-finish-label').textContent = finishes[state.finish];
    $('#lab-intensity').value = state.intensity;
    $('#lab-intensity-value').textContent = state.intensity + '%';
    $('#lab-power').setAttribute('aria-pressed', String(state.power));
    $('#lab-power').setAttribute('aria-label', `${state.power ? 'Apagar' : 'Encender'} luz de ${findProduct(labProduct).name} en el simulador`);
    $('#lab-power-label').textContent = state.power ? 'Apagar' : 'Encender';
    updateSceneCaption();
    $$('[data-lab-product]').forEach(button => {
      const active = button.dataset.labProduct === labProduct;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    $$('[data-lab-finish]').forEach(button => {
      const active = button.dataset.labFinish === state.finish;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
  }

  function setLabProduct(id) {
    const product = findProduct(id);
    if (!product) throw new Error('Pieza no disponible.');
    const changed = labProduct !== id;
    labProduct = id;
    $('#lab-scene').dataset.product = id;
    $('#lab-image').src = `assets/${id}.webp`;
    $('#lab-image').alt = `Lámpara ${product.name} en el simulador`;
    $('#lab-image').width = product.imageWidth;
    $('#lab-image').height = product.imageHeight;
    syncPreview(id);
    if (changed && canAnimate() && $('#lab-image').animate) {
      lampTransition?.cancel();
      lampTransition = $('#lab-image').animate([{ opacity: .25, transform: 'translateY(12px) scale(.97)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 440, easing: 'cubic-bezier(.2,.75,.25,1)' });
    }
  }

  function setLabMood(key) {
    if (!Object.hasOwn(moods, key)) throw new Error('Atmósfera no disponible.');
    labMood = key;
    $('#lab-scene').dataset.mood = key;
    updateSceneCaption();
    $$('.mood-option').forEach(button => {
      const active = button.dataset.mood === key;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button?.disabled) return;
    const heroFinish = event.target.closest('[data-hero-finish]');
    const finish = event.target.closest('[data-finish][data-id]');
    const power = event.target.closest('[data-toggle-power]');
    const add = event.target.closest('[data-add]');
    const open = event.target.closest('[data-open-product]');
    const startLab = event.target.closest('[data-start-lab]');
    const close = event.target.closest('[data-close-dialog]');
    const filter = event.target.closest('[data-filter]');
    const mood = event.target.closest('[data-mood].mood-option');
    const quantity = event.target.closest('[data-quantity]');
    const remove = event.target.closest('[data-remove]');
    if (heroFinish) { preview.orbit.finish = heroFinish.dataset.heroFinish; syncPreview('orbit'); }
    if (finish) { preview[finish.dataset.id].finish = finish.dataset.finish; syncPreview(finish.dataset.id); }
    if (power) { const id = power.dataset.togglePower; preview[id].power = !preview[id].power; syncPreview(id); }
    if (add) addToBag(add.dataset.add);
    if (open) openProduct(open.dataset.openProduct);
    if (startLab) { setLabProduct(startLab.dataset.startLab); $('#product-dialog').close(); $('#atmosfera').scrollIntoView({ behavior: canAnimate() ? 'smooth' : 'auto' }); }
    if (close) { const browse = close.hasAttribute('data-browse-collection'); close.closest('dialog').close(); if (browse) $('#coleccion').scrollIntoView({ behavior: canAnimate() ? 'smooth' : 'auto' }); }
    if (filter) {
      $$('[data-filter]').forEach(btn => { const active = btn === filter; btn.classList.toggle('active', active); btn.setAttribute('aria-pressed', String(active)); });
      $$('.product-card').forEach(card => { card.hidden = filter.dataset.filter !== 'all' && card.dataset.type !== filter.dataset.filter; if (!card.hidden && canAnimate() && card.animate) { card._filterAnimation?.cancel(); card._filterAnimation = card.animate([{ opacity: .3, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'ease-out' }); } });
    }
    if (mood) setLabMood(mood.dataset.mood);
    const labPiece = event.target.closest('[data-lab-product]');
    const labFinish = event.target.closest('[data-lab-finish]');
    if (labPiece) setLabProduct(labPiece.dataset.labProduct);
    if (labFinish) { preview[labProduct].finish = labFinish.dataset.labFinish; syncPreview(labProduct); }
    if (quantity) { const index = Number(quantity.dataset.index); if (bag[index]) { bag[index].quantity = Math.min(99, Math.max(1, bag[index].quantity + Number(quantity.dataset.quantity))); persistBag(); renderBag(); } }
    if (remove) { bag.splice(Number(remove.dataset.remove), 1); persistBag(); renderBag(); }
    if (button?.id === 'download-selection') downloadSelection();
    if (!button && event.target.closest('.card-visual')) openProduct(event.target.closest('.card-visual').dataset.product);
    if (button?.matches('.button,.filter,.mood-option,.add-button') && canAnimate()) {
      const bounds = button.getBoundingClientRect();
      const size = Math.max(bounds.width, bounds.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (event.clientX ? event.clientX - bounds.left : bounds.width / 2) - size / 2 + 'px';
      ripple.style.top = (event.clientY ? event.clientY - bounds.top : bounds.height / 2) - size / 2 + 'px';
      button.append(ripple); setTimeout(() => ripple.remove(), 700);
    }
  });

  $('#hero-power').addEventListener('click', () => { preview.orbit.power = !preview.orbit.power; syncPreview('orbit'); });
  document.addEventListener('input', event => {
    const id = event.target.id === 'hero-intensity' ? 'orbit' : event.target.id === 'lab-intensity' ? labProduct : event.target.dataset.detailId;
    if (!id || !preview[id]) return;
    preview[id].intensity = Number(event.target.value);
    preview[id].power = true;
    syncPreview(id);
  });
  $('#lab-power').addEventListener('click', () => { preview[labProduct].power = !preview[labProduct].power; syncPreview(labProduct); });
  $('#lab-add').addEventListener('click', () => addToBag(labProduct, true));
  $('#lab-reset').addEventListener('click', () => { Object.assign(preview.orbit, { finish: 'chrome', power: true, intensity: 70 }); setLabProduct('orbit'); setLabMood('warm'); showToast('Vista previa restablecida.'); });
  $('#open-bag').addEventListener('click', () => { renderBag(); openDialog($('#bag-dialog')); });
  $('#back-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: canAnimate() ? 'smooth' : 'auto' }));
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => { if (!$$('dialog').some(d => d.open)) document.body.classList.remove('modal-open'); if (dialog.id === 'product-dialog') currentProduct = null; });
    dialog.addEventListener('click', event => { if (event.target !== dialog) return; const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); });
  });

  renderCatalog();
  setLabProduct('orbit');
  setLabMood('warm');
  products.forEach(p => syncPreview(p.id));
  persistBag();

  function syncMotion() {
    const enabled = motionSetting === 'full' || (motionSetting === 'auto' && !reducedMotion.matches);
    document.body.classList.toggle('motion-enabled', enabled);
    document.body.classList.toggle('motion-paused', !enabled || document.hidden);
    document.documentElement.style.scrollBehavior = enabled ? 'smooth' : 'auto';
    $('#motion-toggle').setAttribute('aria-pressed', String(!enabled));
    $('#motion-toggle').textContent = enabled ? 'Pausar animaciones' : 'Activar animaciones';
    $('#header-motion').setAttribute('aria-pressed', String(!enabled));
    $('#header-motion').setAttribute('aria-label', enabled ? 'Pausar animaciones' : 'Activar animaciones');
    $('#header-motion').title = enabled ? 'Pausar animaciones' : 'Activar animaciones';
    $('#header-motion').innerHTML = `<span aria-hidden="true">${enabled ? 'Ⅱ' : '▷'}</span>`;
    if (!enabled || document.hidden) { lampTransition?.cancel(); $$('.magnetic').forEach(element => element.style.transform = ''); }
  }
  function toggleMotion() {
    motionSetting = canAnimate() ? 'reduced' : 'full';
    try { localStorage.setItem('vanta-motion-mode', motionSetting); localStorage.removeItem('vanta-motion-paused'); } catch {}
    syncMotion();
  }
  $('#motion-toggle').addEventListener('click', toggleMotion);
  $('#header-motion').addEventListener('click', toggleMotion);
  document.addEventListener('visibilitychange', syncMotion);
  reducedMotion.addEventListener?.('change', syncMotion);
  syncMotion();

  const navLinks = $$('#main-nav a');
  function activateNav(href) {
    const index = navLinks.findIndex(link => link.getAttribute('href') === href);
    if (index < 0) return;
    $('#main-nav').style.setProperty('--nav-index', index);
    navLinks.forEach((link, i) => { link.classList.toggle('active', i === index); if (i === index) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }
  activateNav('#coleccion');
  navLinks.forEach(link => link.addEventListener('click', () => activateNav(link.getAttribute('href'))));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .08 });
    $$('.section-top,.product-card,.lab-heading,.studio-heading,.studio-detail').forEach(element => { element.classList.add('reveal'); observer.observe(element); });
    const animationObserver = new IntersectionObserver(entries => entries.forEach(entry => entry.target.style.setProperty('--ambient-state', entry.isIntersecting ? 'running' : 'paused')));
    $$('.kinetic-wash,.hero-symbol,.marquee,.edition-tag,.lab-scene').forEach(element => animationObserver.observe(element));
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) activateNav('#' + entry.target.id); }), { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    $$('#coleccion,#atmosfera,#estudio').forEach(section => navObserver.observe(section));
  }
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.magnetic').forEach(element => {
      let frame;
      element.addEventListener('pointermove', event => {
        if (!canAnimate()) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => { if (!canAnimate()) return; const bounds = element.getBoundingClientRect(); const x = (event.clientX - bounds.left - bounds.width / 2) * .06; const y = (event.clientY - bounds.top - bounds.height / 2) * .12; element.style.transform = `translate(${x}px, ${y}px)`; });
      });
      element.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); element.style.transform = ''; });
    });
  }

  const modelContext = document.modelContext;
  if (modelContext?.registerTool) {
    const lifecycle = new AbortController();
    const tools = [
      { name: 'read_lamp_collection', title: 'Consultar colección VANTA', description: 'Read the available lamp models, prices in Chilean pesos, finishes, and current preview settings. Does not change the page.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute(input) { if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Expected an empty object.'); return { products: products.map(p => ({ id: p.id, name: p.name, priceCLP: p.price, finishes: Object.keys(finishes), preview: { ...preview[p.id] } })) }; } },
      { name: 'configure_lamp_preview', title: 'Configurar luz y acabado', description: 'Open a VANTA lamp detail and set its finish, light power and intensity. Only configures the on-screen preview; does not add to the bag or purchase.', inputSchema: { type: 'object', properties: { productId: { type: 'string', enum: products.map(p => p.id) }, finish: { type: 'string', enum: Object.keys(finishes) }, power: { type: 'boolean' }, intensity: { type: 'integer', minimum: 10, maximum: 100 } }, required: ['productId', 'finish', 'power', 'intensity'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute(input) { if (!input || !findProduct(input.productId) || !Object.hasOwn(finishes, input.finish) || typeof input.power !== 'boolean' || !Number.isInteger(input.intensity) || input.intensity < 10 || input.intensity > 100 || Object.keys(input).some(key => !['productId', 'finish', 'power', 'intensity'].includes(key))) throw new Error('Invalid preview settings.'); Object.assign(preview[input.productId], { finish: input.finish, power: input.power, intensity: input.intensity }); openProduct(input.productId); return { productId: input.productId, ...preview[input.productId] }; } },
    ];
    tools.forEach(tool => { try { Promise.resolve(modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Feature detection keeps unsupported browsers working. */ } });
    window.addEventListener('pagehide', event => { if (!event.persisted) lifecycle.abort(); });
  }
})();
