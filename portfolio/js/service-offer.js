(() => {
  'use strict';
  const root = document.documentElement;
  const $ = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const config = window.PORTFOLIO_CONFIG;
  const motionKey = 'nc-portfolio-motion';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const desktop = matchMedia('(min-width: 801px)');
  let preference = null;
  try { preference = localStorage.getItem(motionKey); } catch (_) {}
  if (preference !== 'on' && preference !== 'off') preference = null;
  let active = false;
  let frameId = 0;
  let skewReset = 0;
  let previousY = scrollY;
  let pointer = null;
  const hero = $('.hero');
  const header = $('#hd');
  const menu = $('#mn');
  const menuButton = $('#bur');
  const cursor = $('#cur');
  const cases = all('.caso');
  const panel = $('#servicios');
  const row = $('#hrow');
  const motionButton = $('#motion');
  const inertContent = [$('#contenido'), $('.wm'), $('.fo'), $('.float-wa')];
  let menuOpen = false;

  // El menú mantiene la navegación con teclado y devuelve el foco al cerrar.
  function setMenu(open, returnFocus = true) {
    menuOpen = open;
    menu.classList.toggle('on', open);
    menu.toggleAttribute('inert', !open);
    menuButton.classList.toggle('on', open);
    menuButton.setAttribute('aria-expanded', String(open));
    $('#bl').textContent = open ? 'CERRAR' : 'MENÚ';
    header.classList.toggle('menu-open', open);
    header.classList.remove('hide');
    root.style.overflowY = open ? 'hidden' : '';
    inertContent.forEach(element => element.toggleAttribute('inert', open));
    if (open) menu.querySelector('a').focus({ preventScroll: true });
    else if (returnFocus) menuButton.focus({ preventScroll: true });
  }
  menuButton.addEventListener('click', () => setMenu(!menuOpen));
  all('.menu a').forEach(link => link.addEventListener('click', () => setMenu(false, false)));
  document.addEventListener('keydown', event => {
    if (!menuOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); setMenu(false); }
    if (event.key === 'Tab') {
      const stops = [...header.querySelectorAll('a,button'), ...menu.querySelectorAll('a')];
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  // Los enlaces usan el contacto confirmado. El formulario prepara, no envía, la consulta.
  const contactReady = config && config.whatsappVerified && /^\d{10,15}$/.test(config.whatsappNumber);
  const contactURL = message => 'https://wa.me/' + config.whatsappNumber + '?text=' + encodeURIComponent(message);
  if (contactReady) all('[data-whatsapp]').forEach(link => {
    link.href = contactURL('Hola Nicolás, vi tu web y quiero conversar sobre un proyecto para mi negocio.');
  });
let selectedService='Una web nueva', selectedFeature='';
for(const input of all('input[name=service]'))input.addEventListener('change',()=>{selectedService=input.value;selectedFeature='';$('#selected-plan').textContent='';$('#ok').hidden=true;});
for(const link of all('[data-service]'))link.addEventListener('click',()=>{
 selectedService=link.dataset.service;selectedFeature=link.dataset.feature||'';
 const value=selectedService.includes('Carta')||selectedService.includes('Catálogo')?'Catálogo o carta QR':selectedService.includes('Automatización')?'Automatización o integración':selectedService.includes('Renovar')?'Renovar mi web':'Una web nueva';
 for(const input of all('input[name=service]'))input.checked=input.value===value;
 $('#selected-plan').textContent=`Seleccionado: ${selectedService}${selectedFeature?' / '+selectedFeature:''}`;
 $('#ok').hidden=true;
});
const number=window.PORTFOLIO_CONFIG?.whatsappVerified?window.PORTFOLIO_CONFIG.whatsappNumber:null;
function updateLink(){if(!number)return;$('#prepared-link').href=`https://wa.me/${number}?text=${encodeURIComponent($('#message-preview').value)}`;}
$('#message-preview').addEventListener('input',updateLink);
$('#f').addEventListener('submit',e=>{
 e.preventDefault();if(!number)return;
 const business=$('#business').value.trim(), details=$('#details').value.trim();
 $('#message-preview').value=['Hola Nicolás, vi tu portafolio.','Me interesa: '+selectedService+'.',selectedFeature?'Función: '+selectedFeature+'.':'',business?'Mi negocio o enlace: '+business:'',details?'Mi idea: '+details:''].filter(Boolean).join('\n\n');
 updateLink();$('#ok').hidden=false;$('#message-preview').focus();
});

  // Laboratorio: controles reales y respuestas orientativas, sin simular una IA.
  $('#wt').addEventListener('input', event => { $('#vt').style.fontWeight = event.target.value; });
  const palettes = all('.sw button');
  palettes.forEach(button => button.addEventListener('click', () => {
    root.style.setProperty('--acc', button.dataset.a);
    root.style.setProperty('--deep', button.dataset.d);
    root.style.setProperty('--accent-light', button.dataset.readable);
    palettes.forEach(item => {
      item.classList.toggle('on', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
  }));
  const answers = {
    new: ['Una web nueva', 'Partimos por tu negocio: qué ofreces, qué quieres mostrar y cómo prefieres recibir consultas.'],
    renew: ['Renovar mi web', 'Compárteme tu enlace. Podemos revisar el diseño, el contenido y el recorrido hasta el contacto.'],
    catalog: ['Un catálogo', 'Podemos presentar tus productos o tu carta con imágenes y categorías. Las funciones se definen según lo que necesitas.']
  };
  all('[data-answer]').forEach(button => button.addEventListener('click', () => {
    const chat = $('#chat');
    chat.replaceChildren();
    const answer = answers[button.dataset.answer];
    answer.forEach((text, index) => {
      const bubble = document.createElement('div');
      bubble.className = 'b ' + (index ? 'a' : 'u');
      bubble.textContent = text;
      chat.appendChild(bubble);
    });
    all('[data-answer]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));
  const tilt = $('#tilt');
  const card = tilt.querySelector('.card3d');
  card.addEventListener('click', () => {
    const turned = card.getAttribute('aria-pressed') !== 'true';
    card.setAttribute('aria-pressed', String(turned));
    card.classList.toggle('turned', turned);
  });
  tilt.addEventListener('pointermove', event => {
    if (!active || !fine.matches || event.pointerType === 'touch') return;
    const bounds = tilt.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    card.style.transform = 'rotateY(' + x * 28 + 'deg) rotateX(' + -y * 28 + 'deg)';
    card.style.setProperty('--gx', (x + .5) * 100 + '%');
    card.style.setProperty('--gy', (y + .5) * 100 + '%');
  });
  tilt.addEventListener('pointerleave', () => { card.style.transform = ''; });
  const magnet = $('#mag');
  magnet.addEventListener('pointermove', event => {
    if (!active || !fine.matches) return;
    const bounds = magnet.getBoundingClientRect();
    magnet.style.transform = 'translate(' + (event.clientX - bounds.left - bounds.width / 2) * .2 + 'px,' + (event.clientY - bounds.top - bounds.height / 2) * .25 + 'px)';
  });
  magnet.addEventListener('pointerleave', () => { magnet.style.transform = ''; });

  // Un solo cuadro por cambio de scroll o puntero: no hay bucles permanentes ocultos.
  const letters = [];
  const walker = document.createTreeWalker($('#hero-title'), NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) if (!walker.currentNode.parentElement.closest('em')) textNodes.push(walker.currentNode);
  textNodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    [...node.textContent].forEach(character => {
      const span = document.createElement('span');
      span.className = 'c';
      span.textContent = character;
      fragment.appendChild(span);
      letters.push(span);
    });
    node.replaceWith(fragment);
  });
  function schedule() { if (!frameId && !document.hidden) frameId = requestAnimationFrame(render); }
  function render() {
    frameId = 0;
    const y = scrollY;
    const maximum = root.scrollHeight - innerHeight;
    $('#bar').style.transform = 'scaleX(' + (maximum > 0 ? Math.max(0, Math.min(y / maximum, 1)) : 0) + ')';
    if (y !== previousY) {
      header.classList.toggle('hide', active && y > previousY && y > innerHeight * .6 && !menuOpen && !header.contains(document.activeElement));
    }
    const velocity = y - previousY;
    previousY = y;
    if (!active) return;
    root.style.setProperty('--sk', Math.max(-5, Math.min(5, velocity * .07)).toFixed(2));
    clearTimeout(skewReset);
    skewReset = setTimeout(() => { root.style.setProperty('--sk', '0'); }, 160);
    all('.band').forEach((band, index) => band.style.setProperty('--sx', (index ? 1 : -1) * Math.min(y, innerHeight) * .18 + 'px'));
    if (root.classList.contains('scroll-stage')) {
      const bounds = panel.getBoundingClientRect();
      const progress = Math.max(0, Math.min(-bounds.top / Math.max(bounds.height - innerHeight, 1), 1));
      row.style.transform = 'translateX(' + -progress * Math.max(row.scrollWidth - innerWidth + 50, 0) + 'px)';
      $('#bw').style.transform = 'translateX(' + -progress * 30 + 'vw)';
    }
    cases.forEach((item, index) => {
      const next = cases[index + 1];
      if (!next) return;
      const progress = 1 - Math.max(0, Math.min(next.getBoundingClientRect().top / innerHeight, 1));
      item.style.transform = 'scale(' + (1 - .04 * progress) + ')';
    });
    if (pointer && fine.matches) {
      cursor.style.transform = 'translate(' + pointer.x + 'px,' + pointer.y + 'px)';
      cursor.style.opacity = '1';
      cursor.classList.toggle('big', pointer.interactive);
      if (pointer.hero) {
        const bounds = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', pointer.x - bounds.left + 'px');
        hero.style.setProperty('--my', pointer.y - bounds.top + 'px');
        hero.style.setProperty('--ox', (pointer.x / innerWidth - .5) * -90 + 'px');
        hero.style.setProperty('--oy', (pointer.y / innerHeight - .5) * -90 + 'px');
        letters.forEach(letter => {
          const bounds = letter.getBoundingClientRect();
          const distance = Math.hypot(pointer.x - bounds.left - bounds.width / 2, pointer.y - bounds.top - bounds.height / 2);
          letter.style.fontWeight = String(Math.round(500 + Math.min(distance / 280, 1) * 300));
        });
      }
    }
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { updateStage(); schedule(); }, { passive: true });
  addEventListener('pointermove', event => {
    if (!active || !fine.matches || event.pointerType === 'touch') return;
    if (event.clientY < 85) header.classList.remove('hide');
    root.classList.add('hc');
    pointer = { x: event.clientX, y: event.clientY, hero: hero.contains(event.target), interactive: !!event.target.closest('a,button,.tile') };
    schedule();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { cursor.style.opacity = '0'; root.classList.remove('hc'); });
  hero.addEventListener('pointerleave', () => { letters.forEach(letter => { letter.style.fontWeight = ''; }); });
  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('tab-hidden', document.hidden);
    if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; }
    else schedule();
  });
  function updateStage() {
    root.classList.toggle('scroll-stage', active && desktop.matches);
    if (!active || !desktop.matches) { row.style.transform = ''; $('#bw').style.transform = ''; }
  }
  let observer = null;
  function applyMotion() {
    active = preference === 'on' || (preference !== 'off' && !reduced.matches);
    root.classList.toggle('motion-active', active);
    root.classList.toggle('motion-paused', !active);
    root.classList.toggle('js-motion', active && 'IntersectionObserver' in window);
    motionButton.textContent = active ? 'Pausar movimiento' : 'Activar movimiento';
    motionButton.setAttribute('aria-pressed', String(!active));
    if (observer) observer.disconnect();
    if (active && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); observer.unobserve(entry.target); }
      }), { threshold: .1 });
      all('.rv').filter(element => !element.classList.contains('in')).forEach(element => observer.observe(element));
    } else all('.rv').forEach(element => element.classList.add('in'));
    if (!active) {
      header.classList.remove('hide');
      root.classList.remove('hc');
      pointer = null;
      root.style.setProperty('--sk', '0');
      cases.forEach(item => { item.style.transform = ''; });
      letters.forEach(letter => { letter.style.fontWeight = ''; });
      card.style.transform = '';
      magnet.style.transform = '';
    }
    updateStage();
    schedule();
  }
  motionButton.addEventListener('click', () => {
    preference = active ? 'off' : 'on';
    try { localStorage.setItem(motionKey, preference); } catch (_) {}
    applyMotion();
  });
  reduced.addEventListener('change', () => { if (!preference) applyMotion(); });
  desktop.addEventListener('change', () => { updateStage(); schedule(); });
  fine.addEventListener('change', () => { root.classList.remove('hc'); pointer = null; });
  addEventListener('storage', event => {
    if (event.key !== motionKey && event.key !== null) return;
    preference = event.newValue === 'on' || event.newValue === 'off' ? event.newValue : null;
    applyMotion();
  });
  applyMotion();
})();
