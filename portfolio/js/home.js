(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = document.getElementById('motion');
  const motionKey = 'nc-portfolio-motion';
  let choice = null;
  try { const saved = localStorage.getItem(motionKey); if (saved === 'on' || saved === 'off') choice = saved === 'on'; } catch (_) {}
  function updateMotion() {
    const off = choice === null ? reduced.matches : !choice;
    document.body.classList.toggle('paused', off);
    document.body.classList.toggle('motion-enabled', !off);
    motion.setAttribute('aria-pressed', String(off));
    motion.textContent = off ? 'Activar movimiento' : 'Pausar movimiento';
  }
  motion.addEventListener('click', () => { choice = document.body.classList.contains('paused'); try { localStorage.setItem(motionKey, choice ? 'on' : 'off'); } catch (_) {} updateMotion(); });
  reduced.addEventListener('change', () => { choice = null; try { localStorage.removeItem(motionKey); } catch (_) {} updateMotion(); });
  updateMotion();
  const filters = [...document.querySelectorAll('[data-filter]')];
  const projects = [...document.querySelectorAll('.project')];
  const status = document.querySelector('.status');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    projects.forEach(project => { project.hidden = button.dataset.filter !== 'all' && project.dataset.category !== button.dataset.filter; project.classList.remove('reveal-pending'); });
    const count = projects.filter(project => !project.hidden).length;
    status.textContent = count + (count === 1 ? ' ejemplo para explorar.' : ' ejemplos para explorar.');
    updateProgress();
  }));
  const config = window.PORTFOLIO_CONFIG;
  const number = config && config.whatsappVerified && /^\d{10,15}$/.test(config.whatsappNumber) ? config.whatsappNumber : null;
  if (number) document.querySelectorAll('[data-whatsapp]').forEach(link => { link.href = 'https://wa.me/' + number + '?text=' + encodeURIComponent(link.dataset.whatsapp); });
  const contact = document.getElementById('contact-whatsapp');
  const topics = [...document.querySelectorAll('[data-topic]')];
  const note = document.getElementById('contact-choice');
  const notes = {
    'Una web nueva': 'Cuéntame qué hace tu negocio y qué te gustaría mostrar en tu primera web.',
    'Renovar mi web': 'Puedes compartirme tu página actual y contarme qué te gustaría mejorar.',
    'Un catálogo o herramienta': 'Cuéntame qué tarea necesitas facilitar: productos, cotizaciones, pedidos o seguimiento.',
    'Necesito orientación': 'Podemos partir por tu idea, aunque todavía no sepas qué tipo de web necesitas.'
  };
  topics.forEach(button => button.addEventListener('click', () => {
    topics.forEach(topic => topic.setAttribute('aria-pressed', String(topic === button)));
    const message = 'Hola Nicolás, vi tu portafolio y me gustaría conversar sobre una web para mi negocio. Me interesa: ' + button.dataset.topic + '.';
    if (number) contact.href = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
    note.textContent = notes[button.dataset.topic];
  }));
  const progress = document.createElement('div');
  progress.className = 'scroll-progress'; progress.setAttribute('aria-hidden', 'true'); document.body.append(progress);
  let ticking = false;
  function updateProgress() { const max = document.documentElement.scrollHeight - innerHeight; progress.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')'; ticking = false; }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  addEventListener('resize', updateProgress); updateProgress();
  if (!reduced.matches && !document.body.classList.contains('paused') && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (!entry.isIntersecting) return; entry.target.classList.remove('reveal-pending'); entry.target.classList.add('reveal-visible'); observer.unobserve(entry.target); }), { threshold: .06 });
    document.querySelectorAll('.service,.project,.process-grid li,.about-grid,.faq,.contact-grid').forEach(element => { element.classList.add('reveal-pending'); observer.observe(element); });
    reduced.addEventListener('change', () => { if (reduced.matches) document.querySelectorAll('.reveal-pending').forEach(element => element.classList.remove('reveal-pending')); });
  }
})();
