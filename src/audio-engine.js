/* ==========================================================================
   SHARVIN MHATRE PORTFOLIO — AUDIO SYNTHESIZER & SPECTRUM VISUALIZER ENGINE
   Zero external dependencies. Web Audio API real-time synthesis & spectrum.
   ========================================================================== */

(function () {
  'use strict';

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.mode = 'off';
      localStorage.removeItem('axiom_sound_mode');
      this.initialized = false;
      this.ambientNode = null;
      this.ambientGain = null;
      this.isAmbientPlaying = false;
      this.analyser = null;
      this.masterGain = null;
      this.visualizerAnimId = null;
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.ctx = new AudioContext();
        
        // Master Gain & Analyser Node Setup
        this.masterGain = this.ctx.createGain();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        this.initialized = true;
      } catch (e) {
        console.warn('Web Audio API not supported on this browser.');
      }
    }

    ensureContext() {
      if (!this.initialized) this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    getDestination() {
      return this.masterGain || (this.ctx ? this.ctx.destination : null);
    }

    setMode(mode) {
      this.mode = mode;
      localStorage.setItem('axiom_sound_mode', mode);
      this.updateHUD();

      if (mode === 'full') {
        this.startAmbient();
      } else {
        this.stopAmbient();
      }

      if (mode !== 'off') {
        this.playActivate();
      }
    }

    toggleMode() {
      this.ensureContext();
      if (this.mode === 'off') {
        this.setMode('sfx');
      } else if (this.mode === 'sfx') {
        this.setMode('full');
      } else {
        this.setMode('off');
      }
    }

    updateHUD() {
      const label = document.getElementById('sound-hud-mode');
      const icon = document.getElementById('sound-hud-icon');
      if (label) {
        if (this.mode === 'off') label.textContent = 'MUTED';
        else if (this.mode === 'sfx') label.textContent = 'SFX ONLY';
        else if (this.mode === 'full') label.textContent = 'FULL AMBIENT';
      }
      if (icon) {
        if (this.mode === 'off') {
          icon.setAttribute('data-lucide', 'volume-x');
        } else if (this.mode === 'sfx') {
          icon.setAttribute('data-lucide', 'volume-1');
        } else {
          icon.setAttribute('data-lucide', 'volume-2');
        }
        if (window.lucide && window.lucide.createIcons) {
          window.lucide.createIcons();
        }
      }
    }

    // Sound FX: Soft Futuristic Click
    playClick() {
      if (this.mode === 'off') return;
      this.ensureContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.getDestination());

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    }

    // Sound FX: Hover subtle harmonics
    playHover() {
      if (this.mode === 'off') return;
      this.ensureContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(520, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.getDestination());

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    }

    // Sound FX: Terminal Keyboard Tap
    playTyping() {
      if (this.mode === 'off') return;
      this.ensureContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 1200 + Math.random() * 400;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(this.getDestination());

      osc.start();
      osc.stop(this.ctx.currentTime + 0.025);
    }

    // Sound FX: System Activation / Dual-Chime
    playActivate() {
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.getDestination());
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(this.getDestination());
      osc2.start(now + 0.08);
      osc2.stop(now + 0.25);
    }

    // --- 6-PAD SCI-FI SYNTHESIZER PADS ---
    triggerSynthPad(padIndex) {
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      switch (padIndex) {
        case 1: { // Laser Pulse
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1800, now);
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.connect(gain);
          gain.connect(this.getDestination());
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }
        case 2: { // Sub Resonant Drone
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(55, now); // A1
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(this.getDestination());
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        }
        case 3: { // Warp Shift (Glissando)
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          gain.connect(this.getDestination());
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }
        case 4: { // Data Burst
          for (let i = 0; i < 4; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            const freq = 600 + Math.random() * 1200;
            osc.frequency.setValueAtTime(freq, now + i * 0.04);
            gain.gain.setValueAtTime(0.05, now + i * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.03);
            osc.connect(gain);
            gain.connect(this.getDestination());
            osc.start(now + i * 0.04);
            osc.stop(now + i * 0.04 + 0.03);
          }
          break;
        }
        case 5: { // Cyber Chime
          const freqs = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
          freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * 0.06);
            gain.gain.setValueAtTime(0.08, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
            osc.connect(gain);
            gain.connect(this.getDestination());
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.3);
          });
          break;
        }
        case 6: { // Harmonic Crystal Bell
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(1479.98, now); // F#6
          osc2.frequency.setValueAtTime(1760.00, now); // A6
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.getDestination());
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.6);
          osc2.stop(now + 0.6);
          break;
        }
      }
    }

    // Ambient Synth Background Pad
    startAmbient() {
      if (this.isAmbientPlaying || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.001, now);
        this.ambientGain.gain.linearRampToValueAtTime(0.015, now + 2);

        const sub = this.ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(65.41, now);

        const mid = this.ctx.createOscillator();
        mid.type = 'triangle';
        mid.frequency.setValueAtTime(130.81, now);

        sub.connect(this.ambientGain);
        mid.connect(this.ambientGain);
        this.ambientGain.connect(this.getDestination());

        sub.start(now);
        mid.start(now);

        this.ambientNode = { sub, mid };
        this.isAmbientPlaying = true;
      } catch (e) {
        console.warn('Failed to start ambient pad:', e);
      }
    }

    stopAmbient() {
      if (!this.isAmbientPlaying || !this.ambientGain || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
        setTimeout(() => {
          if (this.ambientNode) {
            try {
              this.ambientNode.sub.stop();
              this.ambientNode.mid.stop();
            } catch (e) {}
            this.ambientNode = null;
          }
          this.isAmbientPlaying = false;
        }, 500);
      } catch (e) {}
    }

    // --- REAL-TIME AUDIO VISUALIZER DRAW LOOP ---
    startVisualizerCanvas(canvasId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bufferLength = this.analyser ? this.analyser.frequencyBinCount : 16;
        const dataArray = new Uint8Array(bufferLength);

        if (this.analyser && (this.isAmbientPlaying || this.mode !== 'off')) {
          this.analyser.getByteFrequencyData(dataArray);
        } else {
          // Idle low amplitude animation
          for (let i = 0; i < bufferLength; i++) {
            dataArray[i] = Math.sin(Date.now() * 0.003 + i * 0.4) * 8 + 12;
          }
        }

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;

          const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
          grad.addColorStop(0, 'rgba(75, 213, 238, 0.2)');
          grad.addColorStop(0.7, 'rgba(168, 85, 247, 0.8)');
          grad.addColorStop(1, '#ff3b30');

          ctx.fillStyle = grad;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

          x += barWidth;
        }

        this.visualizerAnimId = requestAnimationFrame(render);
      };

      render();
    }
  }

  // Global instance
  const audio = new SoundEngine();
  window.AudioEngine = audio;

  document.addEventListener('DOMContentLoaded', () => {
    // User interaction unlocker
    const unlockAudio = () => {
      audio.ensureContext();
      if (audio.mode === 'full') {
        audio.startAmbient();
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    // Auto-bind sound effects to interactive elements
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button, .cta-button, .nav-link, .project-card, .filter-btn');
      if (target && !target.classList.contains('synth-pad-btn')) {
        audio.playClick();
      }
    });

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('a, button, .cta-button, .nav-link, .project-card, .skill-card');
      if (target && !target.classList.contains('synth-pad-btn')) {
        audio.playHover();
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target.matches('input, textarea')) {
        audio.playTyping();
      }
    });

    // Synth Dock removed per user request
    if (audio.updateHUD) audio.updateHUD();
  });
})();
