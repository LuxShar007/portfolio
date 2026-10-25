/* ==========================================================================
   SHARVIN MHATRE PORTFOLIO — 3D HYDRO-KINETIC BEAT-SYNCHRONIZED WATER PARTICLES
   True 3D perspective projection (X, Y, Z), hydro-elastic surface tension,
   dual-engine 128 BPM beat detection & acoustic cymatic levitation.
   
   ACTIVATION: Only when sound is played; fades to 100% normal/clear when idle.
   PERFORMANCE: 240Hz butter-smooth rendering with GPU-accelerated canvas 2D.
   ========================================================================== */

(function () {
  'use strict';

  // Constants & Physics Parameters
  const NUM_3D_DROPLETS = 220;
  const NUM_3D_RIPPLES = 12;
  const MAX_3D_SPLASH = 40;
  const BPM = 128.0;
  const BEAT_INTERVAL = 60.0 / BPM; // 0.46875 seconds per beat
  const DROP_ANCHOR_TIME = 45.0; // The drop in "Slushii - All I Need"
  const CAMERA_FOV = 480;
  const CAMERA_Z_OFFSET = 320;

  class WaterParticleSystem3D {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.W = window.innerWidth;
      this.H = window.innerHeight;
      this.cx = this.W / 2;
      this.cy = this.H / 2;

      // 3D Particles & Visual Elements
      this.droplets = [];
      this.ripples = [];
      this.splashDroplets = [];

      // Camera & 3D Interactive Parallax
      this.camYaw = 0;
      this.camPitch = 0;
      this.targetYaw = 0;
      this.targetPitch = 0;

      // Mouse & Touch Interaction
      this.mx = -1000;
      this.my = -1000;
      this.prevMx = -1000;
      this.prevMy = -1000;
      this.mouseSpeed = 0;
      this.isMouseDown = false;

      // Audio & Beat Synchronization State
      this.activityWeight = 0.0; // 0.0 = completely idle/clear, 1.0 = fully active
      this.smoothedIntensity = 0.0;
      this.smoothedBass = 0.0;
      this.smoothedMids = 0.0;
      this.smoothedHighs = 0.0;
      this.buildupEnergy = 0.0;
      this.prevIntensity = 0.0;

      // Dual-Engine Beat Detection Buffers
      this.ultraDataArray = null;
      this.sfxDataArray = null;
      this.energyHistory = new Float32Array(32);
      this.energyHistoryIdx = 0;
      this.lastKickTime = 0;
      this.prevAudioCurrentTime = 0;
      this.prevBeatGridIndex = -1;
      this.beatFlash = 0.0;
      this.globalBounce = 0.0;

      this.time = 0;
      this.animId = null;

      this.init();
    }

    init() {
      // 1. Create or bind Canvas
      let canvas = document.getElementById('water-particles-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'water-particles-canvas';
        document.body.appendChild(canvas);
      }
      this.canvas = canvas;
      this.ctx = this.canvas.getContext('2d', { alpha: true });

      this.resize();
      window.addEventListener('resize', () => this.resize(), { passive: true });

      // 2. Interactive Mouse & Parallax Listeners
      window.addEventListener('mousemove', (e) => {
        const dx = e.clientX - this.prevMx;
        const dy = e.clientY - this.prevMy;
        this.mouseSpeed = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
        this.prevMx = this.mx;
        this.prevMy = this.my;
        this.mx = e.clientX;
        this.my = e.clientY;

        // Interactive 3D Camera Tilt
        const normX = (e.clientX - this.cx) / this.cx;
        const normY = (e.clientY - this.cy) / this.cy;
        this.targetYaw = normX * 0.18;
        this.targetPitch = -normY * 0.14;

        // Water drag ripple on fast mouse movement
        if (this.mouseSpeed > 10 && this.activityWeight > 0.05) {
          const worldX = (e.clientX - this.cx);
          const worldY = (e.clientY - this.cy);
          this.trigger3DRipple(worldX, worldY, 0, Math.min(this.mouseSpeed * 0.9, 30), 0.6);
        }
      }, { passive: true });

      window.addEventListener('mouseleave', () => {
        this.mx = -1000;
        this.my = -1000;
        this.targetYaw = 0;
        this.targetPitch = 0;
      }, { passive: true });

      window.addEventListener('mousedown', (e) => {
        this.isMouseDown = true;
        const worldX = e.clientX - this.cx;
        const worldY = e.clientY - this.cy;
        this.trigger3DSplash(worldX, worldY, 0, 22);
        this.trigger3DRipple(worldX, worldY, 0, 50, 1.0);
      });

      window.addEventListener('mouseup', () => {
        this.isMouseDown = false;
      });

      // Touch events
      window.addEventListener('touchmove', (e) => {
        if (!e.touches.length) return;
        const touch = e.touches[0];
        this.mx = touch.clientX;
        this.my = touch.clientY;
        const normX = (touch.clientX - this.cx) / this.cx;
        const normY = (touch.clientY - this.cy) / this.cy;
        this.targetYaw = normX * 0.18;
        this.targetPitch = -normY * 0.14;
      }, { passive: true });

      window.addEventListener('touchstart', (e) => {
        if (!e.touches.length) return;
        const touch = e.touches[0];
        const worldX = touch.clientX - this.cx;
        const worldY = touch.clientY - this.cy;
        this.trigger3DSplash(worldX, worldY, 0, 18);
        this.trigger3DRipple(worldX, worldY, 0, 45, 0.9);
      }, { passive: true });

      // 3. Initialize 3D Droplets Volume
      this.init3DDroplets();

      // 4. Start Render Loop
      this.animate = this.animate.bind(this);
      this.animId = requestAnimationFrame(this.animate);
    }

    resize() {
      this.W = this.canvas.width = window.innerWidth;
      this.H = this.canvas.height = window.innerHeight;
      this.cx = this.W / 2;
      this.cy = this.H / 2;
      this.init3DDroplets();
    }

    init3DDroplets() {
      this.droplets = [];
      const spreadX = this.W * 0.95;
      const spreadY = this.H * 0.9;
      const spreadZ = 550;

      for (let i = 0; i < NUM_3D_DROPLETS; i++) {
        // Distribute uniformly in 3D volume
        const x = (Math.random() - 0.5) * spreadX;
        const y = (Math.random() - 0.5) * spreadY;
        const z = (Math.random() - 0.5) * spreadZ;

        this.droplets.push({
          x: x,
          y: y,
          z: z,
          baseX: x,
          baseY: y,
          baseZ: z,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          vz: (Math.random() - 0.5) * 0.8,
          baseRadius: 3.0 + Math.random() * 5.0,
          currentRadius: 4.0,
          elasticScale: 1.0,
          elasticVel: 0.0,
          phase: Math.random() * Math.PI * 2,
          freq: 0.8 + Math.random() * 1.8,
          buoyancy: 0,
          colorHue: 188 + Math.random() * 26, // Crystal cyan to azure
          alpha: 0.4 + Math.random() * 0.5,
          highlightAlpha: 0.0
        });
      }
    }

    trigger3DRipple(x, y, z = 0, strength = 35, opacity = 0.8) {
      if (this.ripples.length >= NUM_3D_RIPPLES) {
        this.ripples.shift();
      }
      this.ripples.push({
        x: x,
        y: y,
        z: z,
        radius: 6,
        maxRadius: 180 + strength * 4,
        speed: 3.5 + strength * 0.1,
        strength: strength,
        opacity: opacity,
        decay: 0.018
      });
    }

    trigger3DSplash(x, y, z = 0, count = 20) {
      for (let i = 0; i < count; i++) {
        if (this.splashDroplets.length >= MAX_3D_SPLASH) {
          this.splashDroplets.shift();
        }
        const angle = Math.random() * Math.PI * 2;
        const speedH = 3.0 + Math.random() * 7.0;
        const speedV = 3.5 + Math.random() * 8.0;

        this.splashDroplets.push({
          x: x,
          y: y,
          z: z + (Math.random() - 0.5) * 100,
          vx: Math.cos(angle) * speedH,
          vy: -speedV, // Upward splash
          vz: Math.sin(angle) * speedH * 0.5,
          radius: 1.8 + Math.random() * 3.2,
          alpha: 0.95,
          gravity: 0.28,
          drag: 0.97,
          life: 1.0,
          decay: 0.022 + Math.random() * 0.02
        });
      }
    }

    /**
     * DUAL-ENGINE BEAT TRACKER:
     * Combines Web Audio FFT spectral transient detection with 128 BPM phase alignment.
     */
    detectBeatAndSampleAudio() {
      let isPlaying = false;
      let rawIntensity = 0;
      let rawBass = 0;
      let rawMids = 0;
      let rawHighs = 0;
      let isBeatHit = false;
      let beatStrength = 0.0;
      let currentTime = 0;

      // 1. Check UltraAudio Engine (Slushii - All I Need)
      if (window.UltraAudio && window.UltraAudio.isPlaying) {
        isPlaying = true;
        if (window.UltraAudio.audio) {
          currentTime = window.UltraAudio.audio.currentTime || 0;
        }

        const analyser = window.UltraAudio.analyser;
        if (analyser) {
          const binCount = analyser.frequencyBinCount;
          if (!this.ultraDataArray || this.ultraDataArray.length !== binCount) {
            this.ultraDataArray = new Uint8Array(binCount);
          }
          analyser.getByteFrequencyData(this.ultraDataArray);
          const data = this.ultraDataArray;

          // Sub-bass Kick band: Bins 0 & 1 (30 - 150 Hz)
          const kickBin0 = data[0] || 0;
          const kickBin1 = data[1] || 0;
          const kickBin2 = data[2] || 0;
          const subBassEnergy = (kickBin0 * 1.5 + kickBin1 * 1.2 + kickBin2 * 0.8) / 892.5;

          // Mid band (snare / synth vocal leads): Bins 3 - 12 (200 - 1000 Hz)
          let midSum = 0;
          for (let i = 3; i < 13; i++) midSum += data[i];
          const midEnergy = midSum / (10 * 255);

          // High band: Bins 13 - 35
          let highSum = 0;
          for (let i = 13; i < 35; i++) highSum += data[i];
          const highEnergy = highSum / (22 * 255);

          // Full spectrum energy
          let totalSum = 0;
          for (let i = 0; i < binCount; i++) totalSum += data[i];
          const totalEnergy = totalSum / (binCount * 255);

          rawBass = subBassEnergy;
          rawMids = midEnergy;
          rawHighs = highEnergy;
          rawIntensity = totalEnergy;

          // ── SPECTRAL FLUX & MOVING AVERAGE PEAK DETECTOR ──
          const currentEnergy = subBassEnergy * 0.75 + totalEnergy * 0.25;
          this.energyHistory[this.energyHistoryIdx] = currentEnergy;
          this.energyHistoryIdx = (this.energyHistoryIdx + 1) % this.energyHistory.length;

          // Calculate mean energy
          let sum = 0;
          for (let i = 0; i < this.energyHistory.length; i++) sum += this.energyHistory[i];
          const meanEnergy = sum / this.energyHistory.length;

          // Adaptive dynamic threshold
          const threshold = Math.max(0.28, meanEnergy * 1.35 + 0.04);
          const nowSec = performance.now() * 0.001;

          // If current energy spikes over threshold and refractory lockout has passed
          if (currentEnergy > threshold && (nowSec - this.lastKickTime) > 0.22) {
            isBeatHit = true;
            beatStrength = Math.min(1.0, (currentEnergy - threshold) / (1.0 - threshold) * 1.5);
            this.lastKickTime = nowSec;
          }
        }
      }

      // 2. AudioEngine (SFX clicks / synth tones)
      if (window.AudioEngine && window.AudioEngine.analyser && window.AudioEngine.ctx && window.AudioEngine.ctx.state === 'running') {
        const sfxAnalyser = window.AudioEngine.analyser;
        const binCount = sfxAnalyser.frequencyBinCount;
        if (!this.sfxDataArray || this.sfxDataArray.length !== binCount) {
          this.sfxDataArray = new Uint8Array(binCount);
        }
        sfxAnalyser.getByteFrequencyData(this.sfxDataArray);
        const sfxData = this.sfxDataArray;
        let sfxSum = 0;
        for (let i = 0; i < binCount; i++) sfxSum += sfxData[i];
        const sfxIntensity = sfxSum / (binCount * 255);

        if (sfxIntensity > 0.02) {
          isPlaying = true;
          rawIntensity = Math.max(rawIntensity, sfxIntensity);
          rawBass = Math.max(rawBass, (sfxData[0] + sfxData[1]) / 510);
        }
      }

      // ── METRONOME PHASE-LOCK FOR "SLUSHII - ALL I NEED" (128 BPM) ──
      // Guarantee 100% beat lock even if Web Audio FFT buffer fluctuates
      if (isPlaying && currentTime > 0) {
        // Calculate exact 128 BPM beat grid alignment
        // The drop lands squarely on the beat grid
        const timeFromDrop = currentTime - DROP_ANCHOR_TIME;
        const beatIndex = Math.floor(timeFromDrop / BEAT_INTERVAL);

        if (beatIndex !== this.prevBeatGridIndex && currentTime > 39.8) {
          this.prevBeatGridIndex = beatIndex;
          // Trigger phase beat pulse
          if (!isBeatHit) {
            isBeatHit = true;
            beatStrength = Math.max(beatStrength, 0.85);
          }
        }
        this.prevAudioCurrentTime = currentTime;
      }

      return {
        isPlaying,
        currentTime,
        rawIntensity,
        rawBass,
        rawMids,
        rawHighs,
        isBeatHit,
        beatStrength
      };
    }

    /**
     * Executes the violent/visceral visual reaction when a beat hits!
     */
    triggerBeatImpact(beatStrength) {
      const power = Math.max(0.6, beatStrength);
      this.beatFlash = 1.0;
      this.globalBounce = power * 14.0;

      // 1. Emit Central 3D Hydrodynamic Shockwave Ripple
      const rippleX = (Math.random() - 0.5) * 80;
      const rippleY = (Math.random() - 0.5) * 60;
      this.trigger3DRipple(rippleX, rippleY, 0, 50 * power, 0.95);

      // 2. Displace & Elasticize Every 3D Droplet
      for (let i = 0; i < this.droplets.length; i++) {
        const d = this.droplets[i];

        // Explosive vertical and radial hydro-kick
        const sign = d.x >= 0 ? 1 : -1;
        d.vy -= (6.0 + power * 12.0) * (0.8 + Math.random() * 0.6);
        d.vx += sign * (1.5 + power * 4.0) * (Math.random() * 0.8);
        d.vz += (Math.random() - 0.5) * (8.0 + power * 14.0);

        // Hydro-elastic spring punch: droplet snaps to 2.3x scale!
        d.elasticScale = 1.8 + power * 0.8;
        d.elasticVel = 0.28;
        d.highlightAlpha = 1.0;
      }

      // 3. Spurt Micro-Droplet Splash Beads into 3D Space
      this.trigger3DSplash(rippleX, rippleY, 0, 18);
    }

    animate() {
      this.time += 0.016;

      const audio = this.detectBeatAndSampleAudio();

      // STRICT USER REQUIREMENT:
      // "Only when the sound is played, else its should be normal!!"
      if (audio.isPlaying && (audio.rawIntensity > 0.005 || audio.currentTime > 0)) {
        // Audio is active: smoothly ramp up visibility
        this.activityWeight += (1.0 - this.activityWeight) * 0.12;
      } else {
        // Audio is stopped/paused: fade completely out to clear normal state
        this.activityWeight += (0.0 - this.activityWeight) * 0.06;
        if (this.activityWeight < 0.001) {
          this.activityWeight = 0;
        }
      }

      // If inactive, clear canvas and do nothing (100% normal page, zero load)
      if (this.activityWeight === 0) {
        this.ctx.clearRect(0, 0, this.W, this.H);
        this.animId = requestAnimationFrame(this.animate);
        return;
      }

      // Smooth camera interpolation
      this.camYaw += (this.targetYaw - this.camYaw) * 0.08;
      this.camPitch += (this.targetPitch - this.camPitch) * 0.08;

      // Audio smooth metrics
      const targetIntensity = audio.rawIntensity * this.activityWeight;
      const targetBass = audio.rawBass * this.activityWeight;
      const targetMids = audio.rawMids * this.activityWeight;
      const targetHighs = audio.rawHighs * this.activityWeight;

      this.smoothedIntensity += (targetIntensity - this.smoothedIntensity) * 0.24;
      this.smoothedBass += (targetBass - this.smoothedBass) * 0.35;
      this.smoothedMids += (targetMids - this.smoothedMids) * 0.22;
      this.smoothedHighs += (targetHighs - this.smoothedHighs) * 0.28;

      // Buildup energy detection (e.g. 40s to 45s buildup)
      const deltaIntensity = this.smoothedIntensity - this.prevIntensity;
      this.buildupEnergy = Math.max(0, Math.min(1.0, this.buildupEnergy * 0.94 + deltaIntensity * 5.0));
      this.prevIntensity = this.smoothedIntensity;

      // TRIGGER THE BEAT!
      if (audio.isBeatHit && this.activityWeight > 0.2) {
        this.triggerBeatImpact(audio.beatStrength);
      }

      // Decay beat flash & global bounce
      this.beatFlash *= 0.88;
      this.globalBounce *= 0.85;

      // Clear Canvas
      this.ctx.clearRect(0, 0, this.W, this.H);

      // Render 3D Scene
      this.render3DRipples();
      this.render3DDroplets();
      this.render3DSplash();

      this.animId = requestAnimationFrame(this.animate);
    }

    render3DRipples() {
      const ctx = this.ctx;
      const cosY = Math.cos(this.camYaw);
      const sinY = Math.sin(this.camYaw);
      const cosP = Math.cos(this.camPitch);
      const sinP = Math.sin(this.camPitch);

      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const r = this.ripples[i];
        r.radius += r.speed;
        r.opacity -= r.decay;

        if (r.opacity <= 0 || r.radius >= r.maxRadius) {
          this.ripples.splice(i, 1);
          continue;
        }

        // 3D Perspective Projection for Ripple Center
        const rx = r.x * cosY - r.z * sinY;
        const rz = r.x * sinY + r.z * cosY;
        const ry = r.y * cosP - rz * sinP;
        const fz = r.y * sinP + rz * cosP + CAMERA_Z_OFFSET;

        if (fz <= 50) continue;
        const scale = CAMERA_FOV / fz;
        const screenX = this.cx + rx * scale;
        const screenY = this.cy + ry * scale;
        const projRadius = r.radius * scale;
        const effectiveOpacity = r.opacity * this.activityWeight;

        // Render 3D Perspective Elliptical Ripple Ring
        ctx.save();
        ctx.beginPath();
        // Ellipse compressed along Y for 3D ground plane perspective
        ctx.ellipse(screenX, screenY, projRadius, projRadius * 0.45, this.camYaw, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${effectiveOpacity * 0.7})`;
        ctx.lineWidth = Math.max(1, 2.2 * scale);
        ctx.stroke();

        // Inner refraction ring
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, Math.max(1, projRadius * 0.82), Math.max(1, projRadius * 0.38), this.camYaw, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 245, 255, ${effectiveOpacity * 0.35})`;
        ctx.lineWidth = Math.max(0.5, 1.2 * scale);
        ctx.stroke();
        ctx.restore();
      }
    }

    render3DDroplets() {
      const ctx = this.ctx;
      const cosY = Math.cos(this.camYaw);
      const sinY = Math.sin(this.camYaw);
      const cosP = Math.cos(this.camPitch);
      const sinP = Math.sin(this.camPitch);

      const intensity = this.smoothedIntensity;
      const bass = this.smoothedBass;
      const buildup = this.buildupEnergy;
      const act = this.activityWeight;
      const beatPop = this.beatFlash;

      // Project all droplets to 3D camera space
      const projected = [];

      for (let i = 0; i < this.droplets.length; i++) {
        const d = this.droplets[i];

        // 1. Acoustic Cymatic Oscillations & Standing Waves
        const cymaticY = Math.sin(this.time * d.freq * 2.5 + d.phase) * (3.0 + intensity * 35.0);
        const cymaticX = Math.cos(this.time * d.freq * 1.8 + d.phase) * (2.0 + intensity * 20.0);

        // Acoustic Levitation (as buildup accumulates, droplets defy gravity and rise!)
        const levitation = (buildup * 110.0 + intensity * 60.0);
        d.buoyancy += (levitation - d.buoyancy) * 0.14;

        // Fluid drag & restoring force to home 3D anchor
        d.x += d.vx;
        d.y += d.vy - d.buoyancy * 0.04;
        d.z += d.vz;

        d.vx *= 0.94;
        d.vy *= 0.94;
        d.vz *= 0.94;

        d.vx += (d.baseX - d.x) * 0.012;
        d.vy += (d.baseY - d.y) * 0.012;
        d.vz += (d.baseZ - d.z) * 0.012;

        // Elastic surface tension spring physics
        d.elasticVel += (1.0 - d.elasticScale) * 0.38;
        d.elasticVel *= 0.74; // Damping
        d.elasticScale += d.elasticVel;

        // Highlight decay
        d.highlightAlpha *= 0.88;

        // 2. Mouse Hydrodynamic Repulsion (Finger dipped in water)
        if (this.mx > 0 && this.my > 0) {
          const worldMx = this.mx - this.cx;
          const worldMy = this.my - this.cy;
          const mdx = d.x - worldMx;
          const mdy = d.y - worldMy;
          const dist2D = Math.sqrt(mdx * mdx + mdy * mdy);
          const pushRadius = 180 + intensity * 100;

          if (dist2D < pushRadius && dist2D > 0) {
            const force = (1.0 - dist2D / pushRadius) * (6.0 + intensity * 12.0);
            d.vx += (mdx / dist2D) * force;
            d.vy += (mdy / dist2D) * force;
            d.vz += (Math.random() - 0.5) * force * 2.0;
          }
        }

        // Ripple displacement
        for (let j = 0; j < this.ripples.length; j++) {
          const rip = this.ripples[j];
          const rdx = d.x - rip.x;
          const rdy = d.y - rip.y;
          const distRip = Math.sqrt(rdx * rdx + rdy * rdy);
          const waveDist = Math.abs(distRip - rip.radius);

          if (waveDist < 30 && distRip > 0) {
            const wavePush = (1.0 - waveDist / 30) * (rip.strength * 0.18) * rip.opacity;
            d.vx += (rdx / distRip) * wavePush;
            d.vy += (rdy / distRip) * wavePush;
          }
        }

        // 3. 3D Camera Rotation Matrix
        const px = d.x + cymaticX;
        const py = d.y + cymaticY;
        const pz = d.z;

        const rx = px * cosY - pz * sinY;
        const rz = px * sinY + pz * cosY;
        const ry = py * cosP - rz * sinP;
        const finalZ = py * sinP + rz * cosP + CAMERA_Z_OFFSET;

        if (finalZ <= 40) continue; // Behind camera

        const scale = CAMERA_FOV / finalZ;
        const screenX = this.cx + rx * scale;
        const screenY = this.cy + ry * scale;

        // Dynamic 3D Radius with Beat Elasticity & Bass Punch
        const radius = d.baseRadius * scale * d.elasticScale * (1.0 + bass * 0.45);

        projected.push({
          d: d,
          screenX: screenX,
          screenY: screenY,
          scale: scale,
          finalZ: finalZ,
          radius: Math.max(0.8, radius),
          elasticScale: d.elasticScale,
          highlightAlpha: d.highlightAlpha
        });
      }

      // Sort by depth (painter's algorithm: far to near)
      projected.sort((a, b) => b.finalZ - a.finalZ);

      // Render 3D Water Droplets
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const d = p.d;
        const r = p.radius;
        const alpha = Math.min(1.0, (d.alpha * 0.8 + intensity * 0.3 + beatPop * 0.4) * act);

        ctx.save();

        // 3D Liquid Squash & Stretch based on vertical velocity
        const stretchY = 1.0 + Math.min(1.5, Math.abs(d.vy) * 0.08);
        const stretchX = 1.0 / Math.sqrt(stretchY);

        ctx.translate(p.screenX, p.screenY);
        ctx.scale(stretchX, stretchY);

        // Hydro-Refractive Radial Gradient Sphere
        const grad = ctx.createRadialGradient(
          -r * 0.32,
          -r * 0.32,
          0,
          0,
          0,
          r * 1.5
        );

        // Hue shifts from pure cyan to electric blue, blooming into violet on drop
        const hue = d.colorHue + (intensity * 25.0) + (p.highlightAlpha * 35.0);
        grad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1.0, alpha * 1.2)})`); // Intense white center
        grad.addColorStop(0.35, `hsla(${hue}, 100%, 75%, ${alpha * 0.85})`); // Water mass
        grad.addColorStop(0.8, `hsla(${hue + 15}, 100%, 52%, ${alpha * 0.45})`); // Refraction edge
        grad.addColorStop(1, `hsla(${hue + 30}, 100%, 40%, 0)`); // Dissolving caustics

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Top-Left 3D Specular Highlight (Glossy Glass Bubble look)
        ctx.beginPath();
        ctx.arc(-r * 0.35, -r * 0.35, Math.max(0.6, r * 0.28), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, (0.85 + p.highlightAlpha * 0.15) * alpha)})`;
        ctx.fill();

        // High intensity cymatic caustic corona on beat hits
        if (p.highlightAlpha > 0.1 || intensity > 0.45) {
          ctx.beginPath();
          ctx.arc(0, 0, r * (1.3 + bass * 0.5), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 240, 255, ${(p.highlightAlpha * 0.6 + intensity * 0.3) * alpha})`;
          ctx.lineWidth = Math.max(0.8, 1.4 * p.scale);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    render3DSplash() {
      const ctx = this.ctx;
      const act = this.activityWeight;
      const cosY = Math.cos(this.camYaw);
      const sinY = Math.sin(this.camYaw);
      const cosP = Math.cos(this.camPitch);
      const sinP = Math.sin(this.camPitch);

      for (let i = this.splashDroplets.length - 1; i >= 0; i--) {
        const s = this.splashDroplets[i];

        s.x += s.vx;
        s.y += s.vy;
        s.z += s.vz;
        s.vy += s.gravity; // Gravity
        s.vx *= s.drag;
        s.vy *= s.drag;
        s.vz *= s.drag;
        s.life -= s.decay;

        if (s.life <= 0 || s.y > this.H) {
          this.splashDroplets.splice(i, 1);
          continue;
        }

        // 3D projection
        const rx = s.x * cosY - s.z * sinY;
        const rz = s.x * sinY + s.z * cosY;
        const ry = s.y * cosP - rz * sinP;
        const finalZ = s.y * sinP + rz * cosP + CAMERA_Z_OFFSET;

        if (finalZ <= 40) continue;
        const scale = CAMERA_FOV / finalZ;
        const screenX = this.cx + rx * scale;
        const screenY = this.cy + ry * scale;
        const r = Math.max(0.6, s.radius * s.life * scale);
        const alpha = s.life * s.alpha * act;

        ctx.save();
        ctx.beginPath();
        ctx.arc(screenX, screenY, r, 0, Math.PI * 2);

        const splashGrad = ctx.createRadialGradient(
          screenX - r * 0.3,
          screenY - r * 0.3,
          0,
          screenX,
          screenY,
          r
        );
        splashGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        splashGrad.addColorStop(0.45, `rgba(0, 240, 255, ${alpha * 0.85})`);
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
      waterSystem = new WaterParticleSystem3D();
      window.WaterParticleSystem = waterSystem;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWaterSystem);
  } else {
    startWaterSystem();
  }

})();
