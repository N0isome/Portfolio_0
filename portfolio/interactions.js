(() => {
  document.documentElement.classList.add("has-js");
  const toggle = document.querySelector(".menu-toggle"),
    nav = document.querySelector("#nav");
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  });
  nav?.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav?.classList.contains("open")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
  // No navigation interception or hover iframes. Links preserve native browser behavior.
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  if (!reduced.matches && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.05 },
    );
    document
      .querySelectorAll(".project-card,.profile-card")
      .forEach((e) => observer.observe(e));
  }
  const motion = document.querySelector(".motion-button");
  let paused = false;
  motion?.addEventListener("click", () => {
    paused = !paused;
    motion.textContent = paused ? "Reanudar fondo" : "Pausar fondo";
    motion.setAttribute("aria-pressed", String(paused));
    document.querySelector(".grain").style.animationPlayState = paused
      ? "paused"
      : "running";
    document.documentElement.classList.toggle("motion-paused", paused);
    dispatchEvent(new CustomEvent("portfolio-motion", { detail: paused }));
  });
  const cfg = window.PORTFOLIO_CONFIG;
  const bubble = document.createElement("button");
  bubble.className = "wa";
  bubble.setAttribute("aria-label", "Contactar por WhatsApp");
  bubble.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 0 1-12.8 7.3L3 20l1.3-4.1A8.5 8.5 0 1 1 20 11.5Z"/><path d="M8 7c-2 3 3 8 6 8l2-2-3-2-1 1-2-2 1-1-2-2Z"/></svg><span>Conversemos</span>';
  document.body.append(bubble);
  const contactDialog = document.createElement("dialog");
  contactDialog.setAttribute("aria-labelledby", "wa-title");
  contactDialog.innerHTML =
    '<h2 id="wa-title">Conversemos</h2><p>El contacto por WhatsApp estará disponible pronto. Mientras tanto, puedes encontrarme en GitHub.</p><p><a href="https://github.com/N0isome" target="_blank" rel="noopener noreferrer">Abrir perfil GitHub ↗</a></p><form method="dialog"><button class="pill">Cerrar</button></form>';
  document.body.append(contactDialog);
  const openWhatsapp = () => {
    if (cfg.whatsappVerified && /^\d{8,15}$/.test(cfg.whatsappNumber)) {
      window.open(
        "https://wa.me/" +
          cfg.whatsappNumber +
          "?text=" +
          encodeURIComponent(cfg.whatsappMessage),
        "_blank",
        "noopener,noreferrer",
      );
    } else contactDialog.showModal();
  };
  bubble.addEventListener("click", openWhatsapp);
  document
    .querySelectorAll("[data-whatsapp]")
    .forEach((b) => b.addEventListener("click", openWhatsapp));
  const footer = document.querySelector(".footer");
  if (footer && "IntersectionObserver" in window)
    new IntersectionObserver((es) =>
      bubble.classList.toggle("in-footer", es[0].isIntersecting),
    ).observe(footer);
  // Hide the floating control when its reserved corner intersects readable content.
  // Fixed placement stays stable; the visitor's current controls take precedence.
  const protectedElements = [
    ...document.querySelectorAll(
      ".site h1,.site h2,.site h3,.site p,.site summary,.site .pill,.site .open-label,.site .nav a",
    ),
  ];
  let pendingFrame = false;
  function clearContactCorner() {
    pendingFrame = false;
    const b = bubble.getBoundingClientRect();
    const collision = protectedElements.some((el) => {
      const r = el.getBoundingClientRect();
      return (
        r.width &&
        r.height &&
        r.right > b.left - 8 &&
        r.left < b.right + 8 &&
        r.bottom > b.top - 8 &&
        r.top < b.bottom + 8
      );
    });
    bubble.classList.toggle("obstructs", collision);
  }
  const scheduleCorner = () => {
    if (!pendingFrame) {
      pendingFrame = true;
      requestAnimationFrame(clearContactCorner);
    }
  };
  addEventListener("scroll", scheduleCorner, { passive: true });
  addEventListener("resize", scheduleCorner, { passive: true });
  scheduleCorner();
  const terms = document.querySelector("#terms-content");
  if (terms)
    fetch("data/terms.json")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data) => {
        terms.replaceChildren();
        const date = document.createElement("p");
        date.textContent = "Actualizado: " + data.updated;
        terms.append(date);
        for (const s of data.sections) {
          const h = document.createElement("h2"),
            p = document.createElement("p");
          h.textContent = s.title;
          p.textContent = s.body;
          terms.append(h, p);
        }
      })
      .catch(() => {
        terms.innerHTML =
          '<p>No se pudo cargar la información. <a href="data/terms.json">Abrir los términos en JSON</a>. Para una prueba local, ejecuta el servidor indicado en README.</p>';
      });
})();
