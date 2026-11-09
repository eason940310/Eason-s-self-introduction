/**
 * LI YING-SHUO (李英碩) PORTFOLIO SCRIPT
 * Interactive Canvas Engine:
 * - Light Mode: Artistic Stationery (Paintbrushes, Erasers, Rulers, Watercolor Trails)
 * - Dark Mode: F1 Racing (Speed Lines, Apex Kerbs, Aerodynamic Trails, DRS Pulses)
 * Works Gallery Filtering & Lightbox Modal
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Management
  initThemeManager();

  // 2. Interactive Background Canvas
  initBackgroundCanvas();

  // 3. Portfolio Works & Lightbox
  initPortfolioWorks();

  // 4. Smooth Navigation & Scroll Spy
  initNavigation();
});

/* ===================================================================
   1. THEME MANAGER
=================================================================== */
function initThemeManager() {
  const toggleBtn = document.getElementById('theme-toggle');
  const toggleText = document.getElementById('theme-toggle-text');
  const toggleIcon = document.getElementById('theme-toggle-icon');
  
  // Check persisted theme or default to 'light'
  let currentTheme = localStorage.getItem('portfolio_theme') || 'light';
  applyTheme(currentTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(currentTheme);
      localStorage.setItem('portfolio_theme', currentTheme);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (toggleText && toggleIcon) {
      if (theme === 'dark') {
        toggleIcon.textContent = '🏎️';
        toggleText.textContent = 'F1 極速模式';
        toggleBtn.setAttribute('title', '點擊切換為藝術工坊主題');
      } else {
        toggleIcon.textContent = '🎨';
        toggleText.textContent = '藝術工坊模式';
        toggleBtn.setAttribute('title', '點擊切換為 F1 賽車極速主題');
      }
    }
    // Notify canvas engine if initialized
    if (window.canvasEngine) {
      window.canvasEngine.setTheme(theme);
    }
  }
}

/* ===================================================================
   2. INTERACTIVE BACKGROUND CANVAS
=================================================================== */
function initBackgroundCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Fallback for roundRect if not supported in older engines
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r = 4) {
      if (typeof r === 'number') {
        r = Math.min(r, w / 2, h / 2);
      }
      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
      this.closePath();
      return this;
    };
  }

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  let mouse = {
    x: width / 2,
    y: height / 2,
    prevX: width / 2,
    prevY: height / 2,
    vx: 0,
    vy: 0,
    speed: 0,
    isHovering: false,
    down: false
  };

  let currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

  // Resize handler
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initThemeElements();
  });

  function handlePointerMove(clientX, clientY) {
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x = clientX;
    mouse.y = clientY;
    mouse.vx = mouse.x - mouse.prevX;
    mouse.vy = mouse.y - mouse.prevY;
    mouse.speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
    mouse.isHovering = true;

    // Emit interaction particles on move
    if (currentTheme === 'light') {
      spawnWatercolorRibbon(mouse.x, mouse.y, mouse.vx, mouse.vy, mouse.speed);
    } else {
      spawnF1Trail(mouse.x, mouse.y, mouse.vx, mouse.vy, mouse.speed);
    }
  }

  // Mouse / Touch tracking
  window.addEventListener('mousemove', (e) => {
    handlePointerMove(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouse.isHovering = false;
  });

  window.addEventListener('mousedown', (e) => {
    mouse.down = true;
    if (currentTheme === 'light') {
      spawnPaintSplatter(e.clientX, e.clientY);
    } else {
      spawnDrsPulse(e.clientX, e.clientY);
    }
  });

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      mouse.down = true;
      const t = e.touches[0];
      if (currentTheme === 'light') {
        spawnPaintSplatter(t.clientX, t.clientY);
      } else {
        spawnDrsPulse(t.clientX, t.clientY);
      }
    }
  }, { passive: true });

  window.addEventListener('mouseup', () => {
    mouse.down = false;
  });

  window.addEventListener('touchend', () => {
    mouse.down = false;
  });

  /* ---------------- Light Theme Entities (Stationery) ---------------- */
  let stationeryItems = [];
  let watercolorRibbons = [];
  let paintSplatters = [];

  class StationeryItem {
    constructor(type) {
      this.type = type; // 'brush', 'eraser', 'ruler-triangle', 'ruler-straight', 'pencil'
      this.reset(true);
    }

    reset(initial = false) {
      this.x = initial ? Math.random() * width : Math.random() < 0.5 ? -60 : width + 60;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.6;
      this.vy = (Math.random() - 0.5) * 0.6;
      this.rotation = Math.random() * Math.PI * 2;
      this.vRot = (Math.random() - 0.5) * 0.008;
      this.size = Math.random() * 20 + 45;
      this.alpha = Math.random() * 0.35 + 0.25;
      this.repelX = 0;
      this.repelY = 0;
    }

    update() {
      // Natural floating
      this.x += this.vx + this.repelX;
      this.y += this.vy + this.repelY;
      this.rotation += this.vRot;

      // Soft decay of mouse repulsion
      this.repelX *= 0.92;
      this.repelY *= 0.92;

      // Mouse repulsion / sway
      if (mouse.isHovering) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 180;
        if (dist < maxDist && dist > 1) {
          const force = (1 - dist / maxDist) * 3.5;
          this.repelX += (dx / dist) * force;
          this.repelY += (dy / dist) * force;
          this.rotation += (dx / dist) * 0.02;
        }
      }

      // Screen wrapping
      const margin = 100;
      if (this.x < -margin) this.x = width + margin;
      if (this.x > width + margin) this.x = -margin;
      if (this.y < -margin) this.y = height + margin;
      if (this.y > height + margin) this.y = -margin;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.alpha;

      switch (this.type) {
        case 'brush':
          this.drawBrush(ctx);
          break;
        case 'eraser':
          this.drawEraser(ctx);
          break;
        case 'ruler-triangle':
          this.drawTriangleRuler(ctx);
          break;
        case 'ruler-straight':
          this.drawStraightRuler(ctx);
          break;
        case 'pencil':
          this.drawPencil(ctx);
          break;
      }
      ctx.restore();
    }

    drawBrush(ctx) {
      const s = this.size * 0.7;
      // Handle
      ctx.fillStyle = '#b7895b';
      ctx.beginPath();
      ctx.roundRect(-4, -s * 0.6, 8, s * 1.2, 4);
      ctx.fill();

      // Metal Ferrule
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(-5, s * 0.6, 10, 14);

      // Bristle tip
      ctx.fillStyle = '#2b6cb0'; // Ink dipped
      ctx.beginPath();
      ctx.moveTo(-5, s * 0.6 + 14);
      ctx.quadraticCurveTo(0, s * 0.6 + 32, 5, s * 0.6 + 14);
      ctx.closePath();
      ctx.fill();
    }

    drawEraser(ctx) {
      const w = this.size * 0.9;
      const h = this.size * 0.55;
      // Eraser body
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 6);
      ctx.fill();
      ctx.stroke();

      // Eraser Sleeve (Classic Blue/White Mono style sleeve)
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-w / 2, -h / 2, w * 0.6, h);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-w / 2, -h / 2 + 5, w * 0.6, 4);
    }

    drawTriangleRuler(ctx) {
      const s = this.size * 1.2;
      ctx.fillStyle = 'rgba(186, 230, 253, 0.35)'; // translucent acrylic
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(-s / 2, s / 2);
      ctx.lineTo(s / 2, s / 2);
      ctx.lineTo(-s / 2, -s / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cutout in center
      ctx.beginPath();
      ctx.moveTo(-s / 3.5, s / 3);
      ctx.lineTo(s / 6, s / 3);
      ctx.lineTo(-s / 3.5, -s / 8);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
      ctx.stroke();

      // Tick marks on base
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      for (let i = -s / 2 + 8; i < s / 2 - 8; i += 7) {
        ctx.beginPath();
        ctx.moveTo(i, s / 2);
        ctx.lineTo(i, s / 2 - 5);
        ctx.stroke();
      }
    }

    drawStraightRuler(ctx) {
      const w = this.size * 1.6;
      const h = this.size * 0.42;
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)'; // warm acrylic
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 3);
      ctx.fill();
      ctx.stroke();

      // Centimeter tick marks
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      for (let i = -w / 2 + 6; i < w / 2 - 6; i += 8) {
        const tickH = (Math.abs(i) % 16 === 0) ? 9 : 5;
        ctx.beginPath();
        ctx.moveTo(i, -h / 2);
        ctx.lineTo(i, -h / 2 + tickH);
        ctx.stroke();
      }
    }

    drawPencil(ctx) {
      const w = 9;
      const l = this.size * 1.3;
      // Wooden body
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-w / 2, -l / 2, w, l * 0.75);

      // Eraser top
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-w / 2, -l / 2 - 8, w, 8);
      ctx.fillStyle = '#9ca3af'; // metal band
      ctx.fillRect(-w / 2, -l / 2 - 3, w, 3);

      // Sharpened cone
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.moveTo(-w / 2, -l / 2 + l * 0.75);
      ctx.lineTo(w / 2, -l / 2 + l * 0.75);
      ctx.lineTo(0, l / 2);
      ctx.closePath();
      ctx.fill();

      // Graphite tip
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-3, l / 2 - 6);
      ctx.lineTo(3, l / 2 - 6);
      ctx.lineTo(0, l / 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  function spawnWatercolorRibbon(x, y, vx, vy, speed) {
    if (speed < 1.5) return;
    const colors = [
      'rgba(43, 108, 176, ',
      'rgba(224, 109, 83, ',
      'rgba(16, 185, 129, ',
      'rgba(168, 85, 247, '
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    watercolorRibbons.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      radius: Math.min(speed * 0.8 + 6, 28),
      color: color,
      alpha: 0.35,
      decay: 0.012 + Math.random() * 0.008
    });
    if (watercolorRibbons.length > 90) watercolorRibbons.shift();
  }

  function spawnPaintSplatter(x, y) {
    const palette = ['#2b6cb0', '#e06d53', '#10b981', '#f59e0b', '#8b5cf6'];
    const chosen = palette[Math.floor(Math.random() * palette.length)];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      paintSplatters.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 6 + 3,
        color: chosen,
        alpha: 0.85,
        decay: 0.018 + Math.random() * 0.015
      });
    }
  }

  /* ---------------- Dark Theme Entities (F1 Racing) ---------------- */
  let f1Particles = [];
  let f1Trails = [];
  let drsPulses = [];
  let f1SpeedLines = [];

  class F1SpeedLine {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.length = Math.random() * 120 + 80;
      this.speed = Math.random() * 8 + 6;
      this.alpha = Math.random() * 0.4 + 0.15;
      this.angle = -0.15; // aerodynamic slant
      this.color = Math.random() > 0.6 ? '#e10600' : '#ffffff';
    }

    update(mouseSpeed) {
      const currentSpeed = this.speed + mouseSpeed * 0.4;
      this.x -= Math.cos(this.angle) * currentSpeed;
      this.y -= Math.sin(this.angle) * currentSpeed;

      if (this.x < -this.length || this.y < -this.length) {
        this.x = width + Math.random() * 80;
        this.y = Math.random() * height;
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x + Math.cos(this.angle) * this.length,
        this.y + Math.sin(this.angle) * this.length
      );
      ctx.stroke();
      ctx.restore();
    }
  }

  function spawnF1Trail(x, y, vx, vy, speed) {
    if (speed < 1.2) return;
    // Dual tyre streak & red tail light
    const angle = Math.atan2(vy, vx) + Math.PI / 2;
    const trackWidth = 14;

    // Left tyre
    f1Trails.push({
      x: x + Math.cos(angle) * trackWidth,
      y: y + Math.sin(angle) * trackWidth,
      color: '#ffffff',
      width: 2.5,
      alpha: 0.4,
      decay: 0.02
    });

    // Right tyre
    f1Trails.push({
      x: x - Math.cos(angle) * trackWidth,
      y: y - Math.sin(angle) * trackWidth,
      color: '#ffffff',
      width: 2.5,
      alpha: 0.4,
      decay: 0.02
    });

    // Rear Rain Light (F1 intense flashing red pulse & sparks)
    f1Trails.push({
      x: x,
      y: y,
      color: '#e10600',
      width: 5.5,
      alpha: 0.8,
      decay: 0.03
    });

    // High-speed spark particles
    if (speed > 8) {
      for (let i = 0; i < 2; i++) {
        f1Particles.push({
          x: x,
          y: y,
          vx: -vx * 0.3 + (Math.random() - 0.5) * 4,
          vy: -vy * 0.3 + (Math.random() - 0.5) * 4,
          radius: Math.random() * 2.5 + 1,
          color: Math.random() > 0.4 ? '#ff9800' : '#e10600',
          alpha: 1,
          decay: 0.035
        });
      }
    }

    if (f1Trails.length > 120) f1Trails.splice(0, 3);
  }

  function spawnDrsPulse(x, y) {
    drsPulses.push({
      x: x,
      y: y,
      radius: 10,
      maxRadius: 180,
      alpha: 0.9,
      speed: 6.5
    });
  }

  // Draw F1 Apex Kerbs (Corner Red/White Curbs) in Dark Mode
  function drawApexKerbs(ctx) {
    const kerbLength = 260;
    const kerbWidth = 14;
    const segmentWidth = 24;

    // Top Right Kerb
    ctx.save();
    for (let i = 0; i < kerbLength; i += segmentWidth) {
      const isRed = Math.floor(i / segmentWidth) % 2 === 0;
      ctx.fillStyle = isRed ? '#e10600' : '#ffffff';
      ctx.globalAlpha = 0.35;
      ctx.fillRect(width - kerbLength + i, 0, segmentWidth, kerbWidth);
    }
    // Bottom Left Kerb
    for (let i = 0; i < kerbLength; i += segmentWidth) {
      const isRed = Math.floor(i / segmentWidth) % 2 === 0;
      ctx.fillStyle = isRed ? '#e10600' : '#ffffff';
      ctx.globalAlpha = 0.35;
      ctx.fillRect(i, height - kerbWidth, segmentWidth, kerbWidth);
    }
    ctx.restore();
  }

  /* ---------------- Init Canvas State ---------------- */
  function initThemeElements() {
    stationeryItems = [];
    f1SpeedLines = [];

    // Initialize 16 floating stationery items in Light Mode
    const stationeryTypes = ['brush', 'eraser', 'ruler-triangle', 'ruler-straight', 'pencil'];
    for (let i = 0; i < 18; i++) {
      const type = stationeryTypes[i % stationeryTypes.length];
      stationeryItems.push(new StationeryItem(type));
    }

    // Initialize 24 F1 Speed Lines in Dark Mode
    for (let i = 0; i < 28; i++) {
      f1SpeedLines.push(new F1SpeedLine());
    }
  }

  initThemeElements();

  /* ---------------- Main Render Loop ---------------- */
  function animate() {
    ctx.clearRect(0, 0, width, height);

    if (currentTheme === 'light') {
      // 1. Draw Watercolor ribbons
      for (let i = watercolorRibbons.length - 1; i >= 0; i--) {
        const r = watercolorRibbons[i];
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.fillStyle = r.color + r.alpha + ')';
        ctx.fill();
        ctx.restore();
        r.alpha -= r.decay;
        if (r.alpha <= 0) watercolorRibbons.splice(i, 1);
      }

      // 2. Draw Floating Stationery Items (Brush, Eraser, Rulers, Pencil)
      for (let item of stationeryItems) {
        item.update();
        item.draw(ctx);
      }

      // 3. Draw Paint Splatters
      for (let i = paintSplatters.length - 1; i >= 0; i--) {
        const p = paintSplatters[i];
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) paintSplatters.splice(i, 1);
      }
    } else {
      // Dark Mode (F1 Racing)
      drawApexKerbs(ctx);

      // 1. Draw Speed Lines
      for (let line of f1SpeedLines) {
        line.update(mouse.speed);
        line.draw(ctx);
      }

      // 2. Draw F1 Tyre & Rain light trails
      for (let i = f1Trails.length - 1; i >= 0; i--) {
        const t = f1Trails[i];
        ctx.save();
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.alpha;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.width, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        t.alpha -= t.decay;
        if (t.alpha <= 0) f1Trails.splice(i, 1);
      }

      // 3. Draw Spark Particles
      for (let i = f1Particles.length - 1; i >= 0; i--) {
        const sp = f1Particles[i];
        ctx.save();
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = sp.alpha;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.alpha -= sp.decay;
        if (sp.alpha <= 0) f1Particles.splice(i, 1);
      }

      // 4. Draw DRS Pulses
      for (let i = drsPulses.length - 1; i >= 0; i--) {
        const pulse = drsPulses[i];
        ctx.save();
        ctx.strokeStyle = '#e10600';
        ctx.lineWidth = 3;
        ctx.globalAlpha = pulse.alpha;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#e10600';
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        pulse.radius += pulse.speed;
        pulse.alpha -= 0.025;
        if (pulse.alpha <= 0) drsPulses.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  }

  animate();

  // Expose API for theme change
  window.canvasEngine = {
    setTheme: (newTheme) => {
      currentTheme = newTheme;
    }
  };
}

/* ===================================================================
   3. PORTFOLIO WORKS & LIGHTBOX MODAL
=================================================================== */
function initPortfolioWorks() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const workCards = document.querySelectorAll('.work-card');
  const modal = document.getElementById('lightbox-modal');
  const modalClose = document.getElementById('modal-close');
  const modalViewport = document.getElementById('modal-viewport');
  const modalTitle = document.getElementById('modal-title');
  const modalCategory = document.getElementById('modal-category');
  const modalDesc = document.getElementById('modal-desc');
  const modalTool = document.getElementById('modal-tool');

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      workCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  // Video hover preview (mute & play small snippet)
  document.querySelectorAll('.work-card video').forEach(video => {
    video.muted = true;
    const card = video.closest('.work-card');
    card.addEventListener('mouseenter', () => {
      video.play().catch(() => {});
    });
    card.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  });

  // Helper: Extract YouTube Video ID from various URL formats
  function extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  }

  // Modal Open
  workCards.forEach(card => {
    card.addEventListener('click', () => {
      const title = card.getAttribute('data-title');
      const category = card.getAttribute('data-category-label');
      const desc = card.getAttribute('data-desc');
      const tool = card.getAttribute('data-tool');
      const mediaType = card.getAttribute('data-media-type'); // 'image' or 'video'
      const mediaSrc = card.getAttribute('data-media-src');
      const metaStatus = document.getElementById('modal-meta-status');

      if (!modal) return;

      modalTitle.textContent = title;
      modalCategory.textContent = category;
      modalDesc.textContent = desc;
      modalTool.innerHTML = `<i class="fa-solid fa-paintbrush"></i> 使用軟體：${tool}`;

      modalViewport.innerHTML = '';
      const ytId = extractYouTubeId(mediaSrc);

      if (ytId) {
        // Embed YouTube Player
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`;
        iframe.title = title;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        modalViewport.appendChild(iframe);

        if (metaStatus) {
          metaStatus.innerHTML = `<a href="https://youtu.be/${ytId}" target="_blank" rel="noopener noreferrer" class="modal-yt-btn"><i class="fa-brands fa-youtube"></i> 在 YouTube 開啟觀看 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem;"></i></a>`;
        }
      } else if (mediaType === 'video') {
        const videoElem = document.createElement('video');
        videoElem.src = mediaSrc;
        videoElem.controls = true;
        videoElem.autoplay = true;
        videoElem.loop = true;
        videoElem.style.maxHeight = '60vh';
        videoElem.style.maxWidth = '100%';
        modalViewport.appendChild(videoElem);

        if (metaStatus) {
          metaStatus.innerHTML = `<i class="fa-regular fa-circle-check"></i> 李英碩 個人原創/動態作品`;
        }
      } else {
        const imgElem = document.createElement('img');
        imgElem.src = mediaSrc;
        imgElem.alt = title;
        modalViewport.appendChild(imgElem);

        if (metaStatus) {
          metaStatus.innerHTML = `<i class="fa-regular fa-circle-check"></i> 李英碩 個人原創/動態作品`;
        }
      }

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // Modal Close
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // Pause any playing HTML5 video & remove iframe to stop playback instantly
    const vid = modalViewport.querySelector('video');
    if (vid) vid.pause();
    modalViewport.innerHTML = '';
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* ===================================================================
   4. NAVIGATION & SCROLL
=================================================================== */
function initNavigation() {
  const navbar = document.querySelector('.navbar');
  const backToTopBtn = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
