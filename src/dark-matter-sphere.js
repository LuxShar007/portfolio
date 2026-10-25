// ═══════════════════════════════════════════════════════════════════
//  STAR WARS REALISTIC LIGHTSABER CLASH & HYPERJUMP BOOTLOADER
//  Anakin (Blue) vs Vader (Red) 3D Sabers with Hilts + Lightsaber Smack
// ═══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const loader = document.getElementById('dm-loader');
  const canvas = document.getElementById('sphere-canvas');
  const nameEl = document.getElementById('dm-name');
  const tagEl = document.getElementById('dm-tagline');
  const skipBtn = document.getElementById('dm-skip');

  if (!loader || !canvas) return;

  // Intercept navigation-based visits to skip the preloader (only runs on direct load or reload)
  if (window.location.search.includes('skipLoader=true')) {
    loader.remove();
    document.body.style.overflow = '';
    // Silently remove the query parameter from the address bar to keep a clean URL
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    return;
  }

  const W = canvas.width = window.innerWidth;
  const H = canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const cx = W / 2;
  const cy = H / 2;

  document.body.style.overflow = 'hidden';

  const NUM_STARS = 220;
  const DURATION = 4800;
  const startTime = performance.now();

  let exiting = false;
  let engaged = false;
  let hasSmacked = false;
  let smackAlpha = 0;
  let smackRadius = 0;

  // Initialize stars for the lightspeed sequence
  const stars = [];
  for (let i = 0; i < NUM_STARS; i++) {
    stars.push({
      x: (Math.random() - 0.5) * W * 1.5,
      y: (Math.random() - 0.5) * H * 1.5,
      z: Math.random() * 1000,
      pz: 0
    });
  }

  // Initialize sparks for lightsaber clash
  const sparks = [];
  function spawnSparks(x, y, count = 6, force = 12) {
    for (let i = 0; i < count; i++) {
      sparks.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * force,
        vy: (Math.random() - 0.5) * force,
        size: 1.2 + Math.random() * 2.2,
        color: Math.random() > 0.5 ? '#4bd5ee' : '#ff3b30', // Anakin blue, Vader red
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  // Draw 3D cylindrical hilt with metallic highlights
  function drawHilt(x1, y1, ux, uy, size = 30) {
    const hx = x1 + ux * size;
    const hy = y1 + uy * size;

    // Metallic gradient perpendicular to hilt path
    const px = -uy;
    const py = ux;
    const grad = ctx.createLinearGradient(x1 - px * 4, y1 - py * 4, x1 + px * 4, y1 + py * 4);
    grad.addColorStop(0, '#555555');
    grad.addColorStop(0.3, '#cccccc');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(0.7, '#888888');
    grad.addColorStop(1, '#333333');

    ctx.shadowBlur = 0; // Hilts don't glow
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(hx, hy);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 6;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // Hilt emitter guard rim
    ctx.beginPath();
    ctx.moveTo(hx - px * 4, hy - py * 4);
    ctx.lineTo(hx + px * 4, hy + py * 4);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Draw realistic glowing lightsaber blade (flickers and 3-layered smooth glows)
  function drawRealisticSaber(x1, y1, x2, y2, glowColor, now) {
    // Plasma heat vibration pulse
    const pulse = 1.0 + Math.sin(now * 0.08) * 0.05;

    // 1. Softer large background energy aura
    ctx.shadowBlur = 35 * pulse;
    ctx.shadowColor = glowColor;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 20 * pulse;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.15;
    ctx.stroke();

    // 2. Focused mid-glow plasma tube
    ctx.globalAlpha = 0.55;
    ctx.shadowBlur = 15;
    ctx.lineWidth = 9 * pulse;
    ctx.stroke();

    // 3. Ultra-bright solid white core
    ctx.globalAlpha = 0.98;
    ctx.shadowBlur = 0; // disable shadow for white core to keep edges sharp
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    
    // Reset global settings
    ctx.globalAlpha = 1.0;
  }

  function draw(now) {
    const elapsed = now - startTime;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    // ── PHASE 1: LIGHTSABER DUEL (0ms - 1700ms) ──
    if (elapsed < 1700) {
      // Starfield drifts very slowly in background
      stars.forEach(star => {
        star.z -= 0.6;
        if (star.z <= 0) star.z = 1000;
        const sx = (star.x / star.z) * 350 + cx;
        const sy = (star.y / star.z) * 350 + cy;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0 - star.z / 1000, 0.4)})`;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      });

      // Render Star Wars blue opening text
      const opacity = Math.sin((elapsed / 1700) * Math.PI);
      nameEl.style.opacity = opacity;

      // Saber emergence progression
      const progress = Math.min(elapsed / 1100, 1.0);

      // Saber hilts origins (bottom-left vs top-right)
      const vaderOrigin  = { x: cx + 240, y: cy - 240 };
      const anakinOrigin = { x: cx - 240, y: cy + 240 };

      // Clash intersection coordinates with a high-fidelity vibration shake
      const shakeX = (Math.random() - 0.5) * 5;
      const shakeY = (Math.random() - 0.5) * 5;
      const clashPt = { x: cx + shakeX, y: cy + shakeY };

      // Vader saber vectors
      const vdx = clashPt.x - vaderOrigin.x;
      const vdy = clashPt.y - vaderOrigin.y;
      const vDist = Math.sqrt(vdx*vdx + vdy*vdy);
      const vux = vdx / vDist;
      const vuy = vdy / vDist;

      // Anakin saber vectors
      const adx = clashPt.x - anakinOrigin.x;
      const ady = clashPt.y - anakinOrigin.y;
      const aDist = Math.sqrt(adx*adx + ady*ady);
      const aux = adx / aDist;
      const auy = ady / aDist;

      // Position along the length depending on ignition progress
      const vx = vaderOrigin.x + vdx * progress;
      const vy = vaderOrigin.y + vdy * progress;
      const ax = anakinOrigin.x + adx * progress;
      const ay = anakinOrigin.y + ady * progress;

      // Draw Vader's Hilt and Saber
      drawHilt(vaderOrigin.x, vaderOrigin.y, vux, vuy, 30);
      if (progress > 0.1) {
        const bladeStart = { x: vaderOrigin.x + vux * 30, y: vaderOrigin.y + vuy * 30 };
        drawRealisticSaber(bladeStart.x, bladeStart.y, vx, vy, '#ff3b30', now); // Vader Crimson
      }

      // Draw Anakin's Hilt and Saber
      drawHilt(anakinOrigin.x, anakinOrigin.y, aux, auy, 30);
      if (progress > 0.1) {
        const bladeStart = { x: anakinOrigin.x + aux * 30, y: anakinOrigin.y + auy * 30 };
        drawRealisticSaber(bladeStart.x, bladeStart.y, ax, ay, '#00bfff', now); // Anakin Blue
      }

      // Clash effects when ignited
      if (progress >= 0.95) {
        spawnSparks(clashPt.x, clashPt.y);
      }

      // Draw and update active sparks
      sparks.forEach((s, idx) => {
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;
        if (s.alpha <= 0) {
          sparks.splice(idx, 1);
        } else {
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.alpha;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;

    } else {
      // ── PHASE 2: SABER SMACK & HYPERJUMP (1700ms - DURATION) ──
      nameEl.style.opacity = '0';

      // Lightspeed acceleration
      const factor = Math.min((elapsed - 1700) / 1800, 1.0);
      const speed = 0.8 + Math.pow(factor, 4.5) * 85;

      if (!engaged && factor > 0.4) {
        engaged = true;
        tagEl.style.opacity = '0';
      }

      // Trigger Lightsaber Smack (shockwave circle explosion)
      if (!hasSmacked) {
        hasSmacked = true;
        smackAlpha = 1.0;
        smackRadius = 10;
        spawnSparks(cx, cy, 40, 22); // Spawn large burst of sparks
      }

      // Camera vibration on Lightsaber smack
      if (smackAlpha > 0.01) {
        ctx.save();
        const shockShake = (Math.random() - 0.5) * 22 * smackAlpha;
        ctx.translate(shockShake, shockShake);
      }

      // Update and draw stars
      stars.forEach(star => {
        star.pz = star.z;
        star.z -= speed;

        if (star.z <= 0) {
          star.z = 1000;
          star.pz = 1000;
          star.x = (Math.random() - 0.5) * W * 1.5;
          star.y = (Math.random() - 0.5) * H * 1.5;
        }

        const fov = 350;
        const sx = (star.x / star.z) * fov + cx;
        const sy = (star.y / star.z) * fov + cy;

        const px = (star.x / star.pz) * fov + cx;
        const py = (star.y / star.pz) * fov + cy;

        const opacity = Math.min(1.0 - star.z / 1000, 1.0);

        if (speed < 12) {
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          
          const lineGrad = ctx.createLinearGradient(px, py, sx, sy);
          lineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
          lineGrad.addColorStop(0.7, 'rgba(0, 191, 255, 0.45)');
          lineGrad.addColorStop(1, `rgba(255, 255, 255, ${opacity * 0.95})`);
          
          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = 1.0 + (speed / 38);
          ctx.stroke();
        }
      });

      // Render smack shockwave ring gradient (mixing Anakin blue + Vader red)
      if (smackAlpha > 0.02) {
        smackRadius += 30;
        smackAlpha -= 0.025;

        ctx.strokeStyle = `rgba(75, 213, 238, ${smackAlpha})`;
        ctx.lineWidth = 8;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00bfff';
        ctx.beginPath();
        ctx.arc(cx, cy, smackRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 59, 48, ${smackAlpha * 0.7})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff3b30';
        ctx.beginPath();
        ctx.arc(cx, cy, smackRadius * 0.9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset shadow
      }

      if (hasSmacked && smackAlpha > 0.01) {
        ctx.restore();
      }

      // Draw and update smack explosion sparks
      sparks.forEach((s, idx) => {
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;
        if (s.alpha <= 0) {
          sparks.splice(idx, 1);
        } else {
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.alpha;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;
    }

    // Exit transition
    if (elapsed > 3550 && !exiting) {
      exiting = true;
      triggerExit();
    }

    if (!exiting) {
      requestAnimationFrame(draw);
    }
  }

  function triggerExit() {
    exiting = true;
    loader.classList.add('exit');
    document.body.style.overflow = '';

    document.querySelectorAll('.animate-title, .animate-fade').forEach(el => {
      el.classList.add('in-view');
    });

    setTimeout(() => {
      loader.remove();
    }, 1100);
  }

  skipBtn.addEventListener('click', triggerExit);
  requestAnimationFrame(draw);
})();
