/* ==========================================================================
   SHARVIN PORTFOLIO — HERO CINEMATIC 3D ENGINE (HOMEPAGE)
   Handles After Effects Liquid Flow Text Video, Pull-Down 3D Zoom Effect,
   Audio-Reactive Beat Pulsing, Specular Parallax, and Minimal Hero State.
   ========================================================================== */

(function () {
  'use strict';

  class HeroCinematicEngine {
    constructor() {
      this.card = document.getElementById('hero-video-card');
      this.video = document.getElementById('hero-liquid-video');
      this.glow = document.getElementById('hero-ambient-glow');
      this.indicator = document.getElementById('hero-pull-indicator');
      this.pullBar = document.getElementById('hero-pull-bar');
      this.stage = document.getElementById('hero-cinematic-stage');
      this.tagline = document.getElementById('hero-identity-tag');

      if (!this.card || !this.video) return;

      // Interaction physics state
      this.targetPull = 0.0;    // 0.0 to 1.0 (or up to 1.2)
      this.currentPull = 0.0;
      this.targetTiltX = 0;
      this.targetTiltY = 0;
      this.currentTiltX = 0;
      this.currentTiltY = 0;
      this.hasTriggeredAudio = false;

      // Drag state
      this.isDragging = false;
      this.startY = 0;
      this.startPull = 0;

      this.initEvents();
      this.loop();
    }

    initEvents() {
      // 1. Wheel scroll / Trackpad pull
      window.addEventListener('wheel', (e) => {
        // Pulling down increases zoom
        const delta = e.deltaY * 0.0018;
        this.targetPull = Math.max(0, Math.min(1.2, this.targetPull + delta));
        
        // Auto-trigger audio from 40s on first deliberate pull down
        if (delta > 0.02 && !this.hasTriggeredAudio) {
          this.triggerAudioFirstTime();
        }
      }, { passive: true });

      // 2. Mouse move for 3D parallax tilt & spotlight reflection
      window.addEventListener('mousemove', (e) => {
        const xNorm = (e.clientX / window.innerWidth) - 0.5; // -0.5 to 0.5
        const yNorm = (e.clientY / window.innerHeight) - 0.5;

        this.targetTiltY = xNorm * 18; // degrees
        this.targetTiltX = -yNorm * 14;

        if (this.stage) {
          this.stage.style.setProperty('--mouse-x', `${(e.clientX / window.innerWidth) * 100}%`);
          this.stage.style.setProperty('--mouse-y', `${(e.clientY / window.innerHeight) * 100}%`);
        }
      });

      // 3. Touch Pull / Swipe for mobile devices
      window.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          this.isDragging = true;
          this.startY = e.touches[0].clientY;
          this.startPull = this.targetPull;
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (!this.isDragging || e.touches.length !== 1) return;
        const currentY = e.touches[0].clientY;
        const diff = (currentY - this.startY) * -0.004; // pull down zooms in
        this.targetPull = Math.max(0, Math.min(1.2, this.startPull + diff));

        if (Math.abs(diff) > 0.05 && !this.hasTriggeredAudio) {
          this.triggerAudioFirstTime();
        }
      }, { passive: true });

      window.addEventListener('touchend', () => {
        this.isDragging = false;
      }, { passive: true });

      // 4. Click / Tap toggle between regular and full cinematic zoom
      this.card.addEventListener('click', () => {
        if (this.targetPull > 0.6) {
          this.targetPull = 0.0;
        } else {
          this.targetPull = 1.0;
          this.triggerAudioFirstTime();
        }
      });

      // 5. Spacebar / Arrow Key Navigation
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ') {
          e.preventDefault();
          this.targetPull = this.targetPull > 0.5 ? 0.0 : 1.0;
          this.triggerAudioFirstTime();
        } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
          this.targetPull = Math.min(1.2, this.targetPull + 0.25);
          this.triggerAudioFirstTime();
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
          this.targetPull = Math.max(0, this.targetPull - 0.25);
        }
      });

      // 6. Ensure video autoplays smoothly
      this.video.play().catch(() => {
        // Fallback: muted autoplay retry
        this.video.muted = true;
        this.video.play();
      });
    }

    triggerAudioFirstTime() {
      if (this.hasTriggeredAudio) return;
      this.hasTriggeredAudio = true;
      if (window.UltraAudio && !window.UltraAudio.isPlaying) {
        window.UltraAudio.playFrom40s();
      }
    }

    loop() {
      requestAnimationFrame(() => this.loop());

      // Silky spring damping interpolation
      this.currentPull += (this.targetPull - this.currentPull) * 0.09;
      this.currentTiltX += (this.targetTiltX - this.currentTiltX) * 0.08;
      this.currentTiltY += (this.targetTiltY - this.currentTiltY) * 0.08;

      // Audio-reactive bass pulse
      let bassBoost = 0;
      if (window.UltraAudio) {
        const bass = window.UltraAudio.getBassLevel();
        bassBoost = bass * 0.06; // subtle pulse
      }

      // Proximity zoom values
      // Scale: 1.0 at rest -> 2.15 at max pull
      const scale = 1.0 + (this.currentPull * 1.15) + bassBoost;
      // Z-translation into camera
      const translateZ = this.currentPull * 280; // px
      // Y-translation subtle depth
      const translateY = this.currentPull * -10;

      // Apply 3D transform
      this.card.style.transform = `
        translate3d(0px, ${translateY}px, ${translateZ}px)
        rotateX(${this.currentTiltX}deg)
        rotateY(${this.currentTiltY}deg)
        scale(${scale})
      `;

      // Ambient Glow Reaction
      if (this.glow) {
        const glowScale = 1.0 + (this.currentPull * 0.7) + (bassBoost * 2.5);
        const glowOpacity = 0.5 + (this.currentPull * 0.5);
        this.glow.style.transform = `translate(-50%, -50%) scale(${glowScale})`;
        this.glow.style.opacity = glowOpacity;
      }

      // Kinetic Tagline Expansion & Depth
      if (this.tagline) {
        const tracking = 3.5 + (this.currentPull * 4); // expands letter spacing
        const tagOpacity = Math.max(0.4, 0.85 - (this.currentPull * 0.45));
        this.tagline.style.letterSpacing = `${tracking}px`;
        this.tagline.style.opacity = tagOpacity;
      }

      // Update pull-down prompt bar and opacity
      if (this.pullBar) {
        const percent = Math.min(100, Math.round(this.currentPull * 100));
        this.pullBar.style.width = `${percent}%`;
      }

      if (this.indicator) {
        // Fades away as user zooms in past 0.4
        const fade = Math.max(0, 1.0 - (this.currentPull * 1.8));
        this.indicator.style.opacity = fade;
        this.indicator.style.transform = `translateX(-50%) translateY(${this.currentPull * 15}px)`;
      }
    }
  }

  // Mount on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new HeroCinematicEngine());
  } else {
    new HeroCinematicEngine();
  }
})();
