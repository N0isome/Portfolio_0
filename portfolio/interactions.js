(() => {
  document.documentElement.classList.add('has-js');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#nav');
  const closeMenu = () => { nav?.classList.remove('open'); toggle?.setAttribute('aria-expanded', 'false'); };
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open)); nav?.classList.toggle('open', open);
  });
  nav?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('click', e => { if (!e.target.closest('.topbar')) closeMenu(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav?.classList.contains('open')) { closeMenu(); toggle?.focus(); }
  });
  matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
  nav?.querySelectorAll('a').forEach(a => {
    const url = new URL(a.href);
    if (!url.hash && url.pathname === location.pathname) a.setAttribute('aria-current', 'page');
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = document.querySelector('.motion-button');
  let paused = false;
  try { paused = sessionStorage.getItem('nc-motion-paused') === 'true'; } catch {}
  function updateMotion() {
    const stopped = paused || reduced.matches;
    document.documentElement.classList.toggle('motion-paused', stopped);
    if (motion) {
      motion.disabled = reduced.matches;
      motion.textContent = reduced.matches ? 'Movimiento reducido' : paused ? 'Reanudar movimiento' : 'Pausar movimiento';
      motion.setAttribute('aria-pressed', String(stopped));
    }
    dispatchEvent(new CustomEvent('portfolio-motion', { detail: stopped }));
  }
  motion?.addEventListener('click', () => { paused = !paused; try { sessionStorage.setItem('nc-motion-paused', String(paused)); } catch {} updateMotion(); });
  reduced.addEventListener('change', updateMotion);
  updateMotion();
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('reveal'); observer.unobserve(e.target); }
    }), { threshold: .08 });
    document.querySelectorAll('.project-card,.about-copy').forEach(e => observer.observe(e));
  }
  const filters = document.querySelector('.project-filters');
  if (filters) {
    filters.hidden = false;
    const cards = [...document.querySelectorAll('.project-card')];
    filters.addEventListener('click', e => {
      const button = e.target.closest('[data-project-filter]');
      if (!button) return;
      filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      cards.forEach(card => { card.hidden = button.dataset.projectFilter !== 'todos' && card.dataset.category !== button.dataset.projectFilter; });
      document.querySelector('#filter-status').textContent = cards.filter(c => !c.hidden).length + ' proyectos disponibles';
    });
  }
  const cfg = window.PORTFOLIO_CONFIG || {};
  const verified = cfg.whatsappVerified && /^\d{8,15}$/.test(cfg.whatsappNumber || '');
  const url = verified ? 'https://wa.me/' + cfg.whatsappNumber + '?text=' + encodeURIComponent(cfg.whatsappMessage || '') : 'mailto:' + (cfg.email || 'ni.cortez@duocuc.cl');
  const bubble = document.createElement('a');
  bubble.className = 'wa'; bubble.href = url; bubble.setAttribute('aria-label', verified ? 'Contactar por WhatsApp' : 'Contactar por correo');
  if (verified) { bubble.target = '_blank'; bubble.rel = 'noopener noreferrer'; }
  bubble.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 0 1-12.8 7.3L3 20l1.3-4.1A8.5 8.5 0 1 1 20 11.5Z"/><path d="M8 7c-2 3 3 8 6 8l2-2-3-2-1 1-2-2 1-1-2-2Z"/></svg><span>Conversemos</span>';
  document.body.append(bubble);
  document.querySelectorAll('[data-whatsapp]').forEach(b => b.addEventListener('click', () => {
    if (verified) window.open(url, '_blank', 'noopener,noreferrer'); else location.href = url;
  }));
  const terms = document.querySelector('#terms-content');
  if (terms) fetch('data/terms.json').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => {
    terms.replaceChildren();
    const date = document.createElement('p'); date.textContent = 'Actualizado: ' + data.updated; terms.append(date);
    data.sections.forEach(s => { const h = document.createElement('h2'), p = document.createElement('p'); h.textContent = s.title; p.textContent = s.body; terms.append(h, p); });
  }).catch(() => { terms.innerHTML = '<p>No se pudo cargar la información. <a href="data/terms.json">Consultar los términos</a>.</p>'; });
})();
