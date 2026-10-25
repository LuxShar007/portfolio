/* ==========================================================================
   SHARVIN MHATRE PORTFOLIO — INTERACTIVE SOUND-REACTIVE WATER PARTICLES
   Liquid droplet physics, acoustic cymatic levitation & hydro-kinetics.
   ACTIVATION: Only when sound is played; fades to 100% normal when idle.
   Engineered for 240Hz butter-smooth GPU rendering with Web Audio API.
   ========================================================================== */

(function () {
  'use strict';

  // Particle configuration
  const NUM_DROPLETS = 180;
  const NUM_RIPPLES = 12;
  const MAX_SPLASH_DROPLETS = 40;

  class WaterParticleSystem {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.W = window.innerWidth;
      this.H = window.innerHeight;
      this.droplets = [];
      this.ripples = [];
      this.splashDroplets = [];
      
      // Interactive mouse state
      this.mx = -1000;
      this.my = -1000;
      this.prevMx = -1000;
      this.prevMy = -1000;
      this.mouseSpeed = 0;
      this.isMouseDown = false;

      // Audio reactive state
      this.activityWeight = 0.0; // 0.0 = completely idle/normal, 1.0 = fully audio active
      this.smoothedIntensity = 0.0;
      this.smoothedBass = 0.0;
      this.smoothedMids = 0.0;
      this.smoothedHighs = 0.0;
      this.buildupEnergy = 0.0;
      this.prevIntensity = 0.0;

      // Audio analysis buffers
      this.ultraDataArray = null;
      this.sfxDataArray = null;

      this.time = 0;
      this.animId = null;

      this.init();
    }

    init() {
      // 1. Ensure Canvas Exists
      let canvas = document.getElementById('water-particles-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'water-particles-canvas';
        document.body.appendChild(canvas);
      }
      this.canvas = canvas;
      this.ctx = this.canvas.getContext('2d');

      this.resize();
      window.addEventListener('resize', () => this.resize(), { passive: true });

      // 2. Mouse & Touch Listeners
      window.addEventListener('mousemove', (e) => {
        const dx = e.clientX - this.prevMx;
        const dy = e.clientY - this.prevMy;
        this.mouseSpeed = Math.min(Math.sqrt(dx * dx + dy * dy), 35);
        this.prevMx = this.mx;
        this.prevMy = this.my;
        this.mx = e.clientX;
        this.my = e.clientY;

        // Create fluid ripples if mouse moves fast
        if (this.mouseSpeed > 8 && this.activityWeight > 0.05) {
          this.triggerRipple(this.mx, this.my, Math.min(this.mouseSpeed * 0.8, 25), 0.5);
        }
      }, { passive: true });

      window.addEventListener('mouseleave', () => {
        this.mx = -1000;
        this.my = -1000;
      }, { passive: true });

      window.addEventListener('mousedown', (e) => {
        this.isMouseDown = true;
        this.triggerSplash(e.clientX, e.clientY, 18);
        this.triggerRipple(e.clientX, e.clientY, 45, 1.0);
      });

      window.addEventListener('mouseup', () => {
        this.isMouseDown = false;
      });

      // Touch support
      window.addEventListener('touchmove', (e) => {
        if (!e.touches.length) return;
        const touch = e.touches[0];
        this.mx = touch.clientX;
        this.my = touch.clientY;
        if (this.activityWeight > 0.05) {
          this.triggerRipple(this.mx, this.my, 20, 0.4);
        }
      }, { passive: true });

      window.addEventListener('touchstart', (e) => {
        if (!e.touches.length) return;
        const touch = e.touches[0];
        this.triggerSplash(touch.clientX, touch.clientY, 16);
        this.triggerRipple(touch.clientX, touch.clientY, 40, 0.9);
      }, { passive: true });

      // 3. Spawn Initial Droplets
      this.initDroplets();

      // 4. Start 240Hz Animation Loop
      this.animate = this.animate.bind(this);
      this.animId = requestAnimationFrame(this.animate);
    }

    resize() {
      this.W = this.canvas.width = window.innerWidth;
      this.H = this.canvas.height = window.innerHeight;
      this.initDroplets();
    }

    initDroplets() {
      this.droplets = [];
      for (let i = 0; i < NUM_DROPLETS; i++) {
        const x = Math.random() * this.W;
        const y = Math.random() * this.H;
        this.droplets.push({
          x: x,
          y: y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          radius: 2.0 + Math.random() * 4.5,
          baseRadius: 2.0 + Math.random() * 4.5,
          phase: Math.random() * Math.PI * 2,
          frequency: 0.8 + Math.random() * 1.6,
          alpha: 0.2 + Math.random() * 0.5,
          depth: 0.3 + Math.random() * 0.7,
          buoyancy: 0,
          colorHue: 190 + Math.random() * 25 // Aquamarine to Azure
        });
      }
    }

    triggerRipple(x, y, strength = 30, opacity = 0.8) {
      if (this.ripples.length >= NUM_RIPPLES) {
        this.ripples.shift();
      }
      this.ripples.push({
        x: x,
        y: y,
        radius: 4,
        maxRadius: 120 + strength * 4,
        speed: 2.4 + strength * 0.08,
        strength: strength,
        opacity: opacity,
        decay: 0.016
      });
    }

    triggerSplash(x, y, count = 20) {
      for (let i = 0; i < count; i++) {
        if (this.splashDroplets.length >= MAX_SPLASH_DROPLETS) {
          this.splashDroplets.shift();
        }
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 6.5;
        this.splashDroplets.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (1.5 + Math.random() * 3), // Initial upward leap
          radius: 1.5 + Math.random() * 3.0,
          alpha: 0.9,
          gravity: 0.18,
          drag: 0.96,
          life: 1.0,
          decay: 0.02 + Math.random() * 0.02
        });
      }
    }

    /**
     * Polls both UltraAudio (Slushii) and AudioEngine (SFX/Synth) for real-time Web Audio analysis
     */
    sampleAudioMetrics() {
      let isPlaying = false;
      let rawIntensity = 0;
      let rawBass = 0;
      let rawMids = 0;
      let rawHighs = 0;

      // 1. UltraAudio Engine (Music track)
      if (window.UltraAudio && window.UltraAudio.isPlaying && window.UltraAudio.analyser) {
        isPlaying = true;
        const analyser = window.UltraAudio.analyser;
        const binCount = analyser.frequencyBinCount;
        if (!this.ultraDataArray || this.ultraDataArray.length !== binCount) {
          this.ultraDataArray = new Uint8Array(binCount);
        }
        analyser.getByteFrequencyData(this.ultraDataArray);
        const data = this.ultraDataArray;

        let bassSum = 0, bassCount = 0;
        let midSum = 0, midCount = 0;
        let highSum = 0, highCount = 0;
        let total = 0;

        for (let i = 0; i < binCount; i++) {
          const val = data[i];
          total += val;
          if (i < 4) { bassSum += val; bassCount++; }
          else if (i < 16) { midSum += val; midCount++; }
          else { highSum += val; highCount++; }
        }

        rawBass = bassCount ? (bassSum / (bassCount * 255)) : 0;
        rawMids = midCount ? (midSum / (midCount * 255)) : 0;
        rawHighs = highCount ? (highSum / (highCount * 255)) : 0;
        rawIntensity = total / (binCount * 255);
      }

      // 2. AudioEngine (SFX / Synth / Pad activations)
      if (window.AudioEngine && window.AudioEngine.analyser && window.AudioEngine.ctx && window.AudioEngine.ctx.state === 'running') {
        const analyser = window.AudioEngine.analyser;
        const binCount = analyser.frequencyBinCount;
        if (!this.sfxDataArray || this.sfxDataArray.length !== binCount) {
          this.sfxDataArray = new Uint8Array(binCount);
        }
        analyser.getByteFrequencyData(this.sfxDataArray);
        const data = this.sfxDataArray;

        let sfxSum = 0;
        for (let i = 0; i < binCount; i++) sfxSum += data[i];
        const sfxIntensity = sfxSum / (binCount * 255);

        if (sfxIntensity > 0.02) {
          isPlaying = true;
          rawIntensity = Math.max(rawIntensity, sfxIntensity);
          rawBass = Math.max(rawBass, (data[0] + data[1]) / 510);
          rawMids = Math.max(rawMids, (data[2] + data[3]) / 510);
          rawHighs = Math.max(rawHighs, (data[4] + data[5]) / 510);
        }
      }

      return { isPlaying, rawIntensity, rawBass, rawMids, rawHighs };
    }

    animate() {
      this.time += 0.016;

      const audio = this.sampleAudioMetrics();

      // STRICT USER REQUIREMENT:
      // "Only when the sound is played, else its should be normal!!"
      if (audio.isPlaying && audio.rawIntensity > 0.01) {
        // Sound is playing: smoothly transition to active hydro-kinetic state
        this.activityWeight += (1.0 - this.activityWeight) * 0.08;
      } else {
        // Sound is stopped/paused/normal: smoothly dampen back to 0.0
        this.activityWeight += (0.0 - this.activityWeight) * 0.045;
        if (this.activityWeight < 0.001) {
          this.activityWeight = 0;
        }
      }

      // If activityWeight is 0, canvas is completely clear (100% normal site state)
      if (this.activityWeight === 0) {
        this.ctx.clearRect(0, 0, this.W, this.H);
        this.animId = requestAnimationFrame(this.animate);
        return;
      }

      // Smooth audio values
      const targetIntensity = audio.rawIntensity * this.activityWeight;
      const targetBass = audio.rawBass * this.activityWeight;
      const targetMids = audio.rawMids * this.activityWeight;
      const targetHighs = audio.rawHighs * this.activityWeight;

      this.smoothedIntensity += (targetIntensity - this.smoothedIntensity) * 0.18;
      this.smoothedBass += (targetBass - this.smoothedBass) * 0.22;
      this.smoothedMids += (targetMids - this.smoothedMids) * 0.16;
      this.smoothedHighs += (targetHighs - this.smoothedHighs) * 0.25;

      // Track buildup: rate of energy accumulation
      const deltaIntensity = this.smoothedIntensity - this.prevIntensity;
      this.buildupEnergy = Math.max(0, Math.min(1.0, this.buildupEnergy * 0.95 + deltaIntensity * 4.0));
      this.prevIntensity = this.smoothedIntensity;

      // Bass kick detector -> auto trigger shockwave ripple on heavy beats
      if (this.smoothedBass > 0.65 && Math.random() < 0.25) {
        const cx = this.W / 2 + (Math.random() - 0.5) * 300;
        const cy = this.H / 2 + (Math.random() - 0.5) * 200;
        this.triggerRipple(cx, cy, this.smoothedBass * 55, 0.7);
      }

      // Clear with slight trailing blend for fluid motion blur
      this.ctx.clearRect(0, 0, this.W, this.H);

      // Render layers
      this.renderRipples();
      this.renderDroplets();
      this.renderSplashDroplets();

      this.animId = requestAnimationFrame(this.animate);
    }

    renderRipples() {
      const ctx = this.ctx;
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const r = this.ripples[i];
        r.radius += r.speed;
        r.opacity -= r.decay;

        if (r.opacity <= 0 || r.radius >= r.maxRadius) {
          this.ripples.splice(i, 1);
          continue;
        }

        const effectiveOpacity = r.opacity * this.activityWeight;
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 229, 255, ${effectiveOpacity * 0.6})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Secondary subtle inner refraction ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, Math.max(1, r.radius - 8), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(75, 213, 238, ${effectiveOpacity * 0.25})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
        ctx.restore();
      }
    }

    renderDroplets() {
      const ctx = this.ctx;
      const intensity = this.smoothedIntensity;
      const bass = this.smoothedBass;
      const buildup = this.buildupEnergy;
      const act = this.activityWeight;

      for (let i = 0; i < this.droplets.length; i++) {
        const d = this.droplets[i];

        // 1. Fluid Physics & Wave Oscillations
        const waveOffset = Math.sin(this.time * d.frequency + d.phase) * (4 + intensity * 28);
        const waveCos = Math.cos(this.time * (d.frequency * 0.8) + d.phase) * (3 + intensity * 18);

        // Acoustic Levitation: as sound builds up, droplets lift up against gravity!
        const levitation = (buildup * 85 + intensity * 45) * d.depth;
        d.buoyancy += (levitation - d.buoyancy) * 0.12;

        // Apply velocities with fluid drag
        d.x += d.vx * (1 + intensity * 3);
        d.y += d.vy * (1 + intensity * 3) - (d.buoyancy * 0.05);

        // Gentle restoring force back to home mesh
        d.vx += (d.baseX - d.x) * 0.008;
        d.vy += (d.baseY - d.y) * 0.008;

        // Interactive mouse displacement (finger dipping in water)
        if (this.mx > 0 && this.my > 0) {
          const dx = d.x - this.mx;
          const dy = d.y - this.my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const pushRadius = 160 + (intensity * 120);

          if (dist < pushRadius && dist > 0) {
            const force = (1.0 - dist / pushRadius) * (4.5 + intensity * 8);
            d.x += (dx / dist) * force;
            d.y += (dy / dist) * force;
          }
        }

        // Ripple influence: displace droplets along passing wavefronts
        for (let j = 0; j < this.ripples.length; j++) {
          const rip = this.ripples[j];
          const rx = d.x - rip.x;
          const ry = d.y - rip.y;
          const rDist = Math.sqrt(rx * rx + ry * ry);
          const waveDist = Math.abs(rDist - rip.radius);

          if (waveDist < 25 && rDist > 0) {
            const wavePush = (1.0 - waveDist / 25) * (rip.strength * 0.12) * rip.opacity;
            d.x += (rx / rDist) * wavePush;
            d.y += (ry / rDist) * wavePush;
          }
        }

        // Screen boundary wrap
        if (d.x < -30) d.x = this.W + 30;
        if (d.x > this.W + 30) d.x = -30;
        if (d.y < -30) d.y = this.H + 30;
        if (d.y > this.H + 30) d.y = -30;

        // 2. Dynamic Size & Liquid Glow
        const currentRadius = d.baseRadius * (1.0 + bass * 1.4 + buildup * 0.8);
        const alpha = Math.min(1.0, (d.alpha + intensity * 0.5) * act);

        // 3. Render Translucent 3D Water Droplet
        ctx.save();
        ctx.beginPath();
        ctx.arc(d.x + waveCos, d.y + waveOffset, currentRadius, 0, Math.PI * 2);

        // Hydro-luminescent radial gradient
        const grad = ctx.createRadialGradient(
          d.x + waveCos - currentRadius * 0.35,
          d.y + waveOffset - currentRadius * 0.35,
          0,
          d.x + waveCos,
          d.y + waveOffset,
          currentRadius * 1.8
        );

        // Color shifts from deep azure to neon cyan as sound intensifies
        const hue = d.colorHue + (intensity * 20);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`); // Specular highlight
        grad.addColorStop(0.35, `hsla(${hue}, 100%, 72%, ${alpha * 0.75})`); // Water body
        grad.addColorStop(0.85, `hsla(${hue + 15}, 100%, 50%, ${alpha * 0.4})`); // Refraction rim
        grad.addColorStop(1, `hsla(${hue + 25}, 100%, 40%, 0)`); // Soft caustic glow

        ctx.fillStyle = grad;
        ctx.fill();

        // High intensity cymatic corona around droplets
        if (intensity > 0.4) {
          ctx.beginPath();
          ctx.arc(d.x + waveCos, d.y + waveOffset, currentRadius * (1.3 + bass * 0.6), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.25})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    renderSplashDroplets() {
      const ctx = this.ctx;
      const act = this.activityWeight;

      for (let i = this.splashDroplets.length - 1; i >= 0; i--) {
        const s = this.splashDroplets[i];

        s.x += s.vx;
        s.y += s.vy;
        s.vy += s.gravity; // Gravity pull
        s.vx *= s.drag;
        s.vy *= s.drag;
        s.life -= s.decay;

        if (s.life <= 0 || s.y > this.H + 20) {
          this.splashDroplets.splice(i, 1);
          continue;
        }

        const alpha = s.life * s.alpha * act;
        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * s.life, 0, Math.PI * 2);

        const splashGrad = ctx.createRadialGradient(
          s.x - s.radius * 0.3,
          s.y - s.radius * 0.3,
          0,
          s.x,
          s.y,
          s.radius
        );
        splashGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        splashGrad.addColorStop(0.5, `rgba(0, 229, 255, ${alpha * 0.8})`);
        splashGrad.addColorStop(1, `rgba(0, 119, 182, 0)`);

        ctx.fillStyle = splashGrad;
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // Initialize on DOM load
  let waterSystem = null;
  function startWaterSystem() {
    if (!waterSystem) {
      waterSystem = new WaterParticleSystem();
      window.WaterParticleSystem = waterSystem;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWaterSystem);
  } else {
    startWaterSystem();
  }

})();
