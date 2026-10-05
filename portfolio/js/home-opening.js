
    (() => {
      const canvas = document.getElementById('waveCanvas');
      if (!canvas) return;
      const hero = canvas.closest('.hero');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Esfera pulsante: parámetros de la animación proporcionada.
      const CONFIG = {
        algo: 'sphere',
        color: '#180109',
        secondaryColor: '#3d0000',
        lineWidth: 1,
        showPoints: false,
        gridDensity: 56,
        amplitude: 85,
        frequency: 0.8,
        meshScale: 2.2,
        speed: 1,
        autoRotate: true,
        rotX: 0.30,
        rotY: 10.84,
        zoom: 1.0
      };

      let width = 0, height = 0, time = 0;
      let active = true, raf = 0, previousTime = 0;
      let isDragging = false, prevMouseX = 0, prevMouseY = 0;
      const density = CONFIG.gridDensity;
      const stride = density + 1;
      const points = new Float32Array(stride * stride * 2);
      const geometry = new Float32Array(stride * stride * 4);

      // Precalcula la esfera; la deformación se calcula en cada cuadro.
      for (let lat = 0; lat <= density; lat++) {
        const theta = lat / density * Math.PI;
        for (let lon = 0; lon <= density; lon++) {
          const phi = lon / density * Math.PI * 2;
          const index = (lat * stride + lon) * 4;
          geometry[index] = Math.sin(theta) * Math.cos(phi);
          geometry[index + 1] = Math.cos(theta);
          geometry[index + 2] = Math.sin(theta) * Math.sin(phi);
          geometry[index + 3] = Math.cos(phi) * Math.sin(theta);
        }
      }

      function calculateHeight(u, v, t) {
        return Math.sin(u * CONFIG.frequency * 6 + t * 3)
          * Math.cos(v * CONFIG.frequency * 6 + t * 2)
          * (CONFIG.amplitude * 0.4);
      }

      function render() {
        if (!width || !height) return;
        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = CONFIG.lineWidth;

        const cosY = Math.cos(CONFIG.rotY), sinY = Math.sin(CONFIG.rotY);
        const cosX = Math.cos(CONFIG.rotX), sinX = Math.sin(CONFIG.rotX);
        const size = Math.min(width, height) * 0.55;
        const fov = 600 * CONFIG.meshScale * CONFIG.zoom;
        // Sitúa la esfera detrás de la zona derecha del título.
        const centerX = width * (width < 760 ? 0.69 : 0.78);
        const centerY = height * 0.48;

        for (let i = 0; i < stride * stride; i++) {
          const g = i * 4;
          const radius = size * 0.35 + calculateHeight(geometry[g + 3], geometry[g + 1], time);
          const x = radius * geometry[g];
          const y = radius * geometry[g + 1];
          const z = radius * geometry[g + 2];
          const x1 = x * cosY + z * sinY;
          const z1 = -x * sinY + z * cosY;
          const y2 = y * cosX - z1 * sinX;
          const z2 = y * sinX + z1 * cosX;
          const scale = fov / Math.max(120, 700 + z2);
          points[i * 2] = centerX + x1 * scale;
          points[i * 2 + 1] = centerY + y2 * scale;
        }

        // Agrupa los trazos por color para reducir el trabajo del canvas.
        for (let parity = 0; parity < 2; parity++) {
          ctx.strokeStyle = parity === 0 ? CONFIG.color : CONFIG.secondaryColor;
          ctx.beginPath();
          for (let lat = parity; lat < density; lat += 2) {
            for (let lon = 0; lon < density; lon++) {
              const i = (lat * stride + lon) * 2;
              const below = ((lat + 1) * stride + lon) * 2;
              const next = i + 2;
              ctx.moveTo(points[i], points[i + 1]);
              ctx.lineTo(points[below], points[below + 1]);
              ctx.moveTo(points[i], points[i + 1]);
              ctx.lineTo(points[next], points[next + 1]);
            }
          }
          ctx.stroke();
        }
      }

      function animate(timestamp) {
        raf = 0;
        if (!active || document.hidden || document.body.classList.contains('paused')) {
          previousTime = 0;
          return;
        }
        // Mantiene la misma velocidad en pantallas de 60, 120 o 144 Hz.
        const delta = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.05) : 0;
        previousTime = timestamp;
        time += delta * 0.9 * CONFIG.speed;
        if (CONFIG.autoRotate && !isDragging) CONFIG.rotY += delta * 0.24 * CONFIG.speed;
        render();
        raf = requestAnimationFrame(animate);
      }

      function stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        previousTime = 0;
      }

      function resume() {
        if (!raf && active && !document.hidden && !document.body.classList.contains('paused')) {
          raf = requestAnimationFrame(animate);
        }
      }

      function resize() {
        const box = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = box.width;
        height = box.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        render();
      }

      // Arrastre únicamente en el espacio libre del hero con mouse.
      // El scroll táctil, los enlaces y la selección de texto siguen funcionando.
      hero.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || event.target !== hero || document.body.classList.contains('paused')) return;
        isDragging = true;
        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
        hero.setPointerCapture(event.pointerId);
      });
      hero.addEventListener('pointermove', event => {
        if (!isDragging) return;
        CONFIG.rotY += (event.clientX - prevMouseX) * 0.008;
        CONFIG.rotX += (event.clientY - prevMouseY) * 0.008;
        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
        render();
      });
      const endDrag = () => { isDragging = false; };
      hero.addEventListener('pointerup', endDrag);
      hero.addEventListener('pointercancel', endDrag);
      hero.addEventListener('lostpointercapture', endDrag);

      const visibility = new IntersectionObserver(entries => {
        active = entries[0].isIntersecting;
        if (active) { render(); resume(); } else stop();
      });
      visibility.observe(canvas);
      new ResizeObserver(resize).observe(canvas);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else resume();
      });
      new MutationObserver(() => { if(document.body.classList.contains('paused')) stop(); else resume(); }).observe(document.body,{attributes:true,attributeFilter:['class']});
      function updatePalette() {
        const palette = getComputedStyle(canvas.closest('.opening'));
        CONFIG.color = palette.getPropertyValue('--wire-primary').trim() || '#754637';
        CONFIG.secondaryColor = palette.getPropertyValue('--wire-secondary').trim() || '#646e60';
        render();
      }
      document.addEventListener('portfolio-theme-change', updatePalette);
      updatePalette();
      resize();
      resume();
    })();
  