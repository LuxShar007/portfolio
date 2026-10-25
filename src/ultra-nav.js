/* ==========================================================================
   SHARVIN PORTFOLIO — PURE DARK MODE & AUDIO ENGINE
   - Top navbar and bright mode removed per user request.
   - Pure pitch black (#000000) permanently active.
   - Slushii - "All I Need" (40s timestamp) interactive audio.
   - Sequential Previous / Next page flow navigation dock on inner pages.
   ========================================================================== */

(function () {
  'use strict';

  // 1. Hard Reset & Page Refresh Redirection Protocol
  // Intercept Shift+R for hard reset and page reload to immediately redirect to start of home page
  window.addEventListener('keydown', function (e) {
    if (e.shiftKey && (e.key === 'R' || e.key === 'r')) {
      e.preventDefault();
      sessionStorage.clear();
      sessionStorage.setItem('portfolio_hard_reset', 'true');
      window.location.href = '/index.html?reset=true';
    }
  });

  try {
    const navEntries = performance.getEntriesByType && performance.getEntriesByType('navigation');
    const isReload = (navEntries && navEntries[0] && navEntries[0].type === 'reload') ||
                     (window.performance && window.performance.navigation && window.performance.navigation.type === 1);
    if (isReload) {
      const pathname = window.location.pathname;
      const isInnerPage = !pathname.endsWith('index.html') && pathname !== '/' && pathname !== '';
      if (isInnerPage) {
        sessionStorage.setItem('portfolio_hard_reset', 'true');
        window.location.replace('/index.html?reset=true');
        return;
      } else {
        sessionStorage.setItem('portfolio_hard_reset', 'true');
        window.scrollTo(0, 0);
      }
    }
  } catch (err) {
    // Navigation timing fallback
  }

  // 2. Permanently lock theme to Pitch Black Dark Mode (#000000)
  document.documentElement.setAttribute('data-theme', 'dark');
  localStorage.removeItem('axiom_theme');

  // 2. Global Audio Manager for Slushii - "All I Need" [40s timestamp]
  class UltraAudioEngine {
    constructor() {
      this.audio = null;
      this.ctx = null;
      this.analyser = null;
      this.source = null;
      this.dataArray = null;
      this.isPlaying = false;
      this.startTime = 40.0; // 40 seconds timestamp requested by user
      this.audioSrc = '/assets/media/audio/All I Need - Slushii.mp3';
      this.listeners = [];
      
      this.initAudioElement();
    }

    initAudioElement() {
      this.audio = new Audio(this.audioSrc);
      this.audio.preload = 'auto';
      this.audio.loop = true;

      this.audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.notify();
      });

      this.audio.addEventListener('pause', () => {
        this.isPlaying = false;
        this.notify();
      });

      this.audio.addEventListener('ended', () => {
        this.audio.currentTime = this.startTime;
        this.audio.play();
      });
    }

    setupWebAudio() {
      if (this.ctx) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.ctx = new AudioContext();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.source = this.ctx.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      } catch (e) {
        // Fallback if cross-origin or already connected
      }
    }

    async playFrom40s() {
      try {
        this.setupWebAudio();
        if (this.ctx && this.ctx.state === 'suspended') {
          await this.ctx.resume();
        }
        
        // If audio isn't at or past start time, set to 40s
        if (this.audio.currentTime < this.startTime || this.audio.currentTime > this.startTime + 180) {
          this.audio.currentTime = this.startTime;
        }

        // Cinematic smooth sound fade-in over 800ms
        this.audio.volume = 0;
        await this.audio.play();
        this.isPlaying = true;
        this.notify();

        const fadeDuration = 800; // ms
        const startFade = performance.now();
        const targetVol = 0.85;

        const rampIn = (now) => {
          const progress = Math.min(1, (now - startFade) / fadeDuration);
          this.audio.volume = progress * targetVol;
          if (progress < 1 && this.isPlaying) {
            requestAnimationFrame(rampIn);
          }
        };
        requestAnimationFrame(rampIn);
      } catch (err) {
        console.warn('Audio autoplay blocked or user gesture required:', err);
      }
    }

    pause() {
      if (this.audio && this.isPlaying) {
        // Cinematic smooth sound fade-out over 300ms
        const fadeDuration = 300;
        const initialVol = this.audio.volume;
        const startFade = performance.now();

        const rampOut = (now) => {
          const progress = Math.min(1, (now - startFade) / fadeDuration);
          this.audio.volume = Math.max(0, initialVol * (1 - progress));
          if (progress < 1) {
            requestAnimationFrame(rampOut);
          } else {
            this.audio.pause();
            this.isPlaying = false;
            this.notify();
          }
        };
        requestAnimationFrame(rampOut);
      }
    }

    toggle() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.playFrom40s();
      }
    }

    getBassLevel() {
      if (!this.analyser || !this.dataArray || !this.isPlaying) return 0;
      this.analyser.getByteFrequencyData(this.dataArray);
      // Low bass frequencies (bins 0-3)
      let sum = 0;
      for (let i = 0; i < 4; i++) {
        sum += this.dataArray[i];
      }
      return sum / (4 * 255); // returns 0.0 to 1.0
    }

    subscribe(fn) {
      this.listeners.push(fn);
    }

    notify() {
      this.listeners.forEach(fn => fn(this.isPlaying));
    }
  }

  // Expose singleton
  window.UltraAudio = window.UltraAudio || new UltraAudioEngine();

  // 3. Floating Bottom-Right Audio Pill (Unobtrusive)
  function buildAudioToggle() {
    if (document.getElementById('floating-audio-pill')) return;

    const btn = document.createElement('button');
    btn.id = 'floating-audio-pill';
    btn.className = 'floating-audio-pill';
    btn.title = "Play / Pause Slushii - All I Need (40s)";
    btn.innerHTML = `
      <div class="ultra-eq-bars">
        <div class="ultra-eq-bar"></div>
        <div class="ultra-eq-bar"></div>
        <div class="ultra-eq-bar"></div>
        <div class="ultra-eq-bar"></div>
      </div>
      <span class="ultra-music-tag">SLUSHII [0:40]</span>
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.UltraAudio.toggle();
    });

    window.UltraAudio.subscribe((isPlaying) => {
      if (isPlaying) {
        btn.classList.add('is-playing');
      } else {
        btn.classList.remove('is-playing');
      }
    });

    document.body.appendChild(btn);
  }

  // 4. Sequential Previous / Next Page Flow Navigator on Inner Pages
  function buildPageFlowNav() {
    const pathname = window.location.pathname;
    const page = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';

    // Only inject on inner pages, not homepage
    if (page === '' || page === 'index.html') return;
    if (document.getElementById('page-flow-nav')) return;

    const pageSequence = [
      { url: 'index.html', title: 'Home' },
      { url: 'about.html', title: 'About Me' },
      { url: 'expertise.html', title: 'Expertise' },
      { url: 'milestones.html', title: 'Milestones' },
      { url: 'projects.html', title: 'Projects' },
      { url: 'connect.html', title: 'Connect' }
    ];

    const currentIndex = pageSequence.findIndex(p => p.url === page);
    if (currentIndex === -1) return;

    const prevPage = currentIndex > 0 ? pageSequence[currentIndex - 1] : pageSequence[pageSequence.length - 1];
    const nextPage = currentIndex < pageSequence.length - 1 ? pageSequence[currentIndex + 1] : pageSequence[0];

    const flowNav = document.createElement('div');
    flowNav.id = 'page-flow-nav';
    flowNav.className = 'page-flow-nav';
    flowNav.innerHTML = `
      <a href="${prevPage.url}" class="flow-btn prev" title="Previous: ${prevPage.title}">
        <span style="color: var(--accent-cyan); font-size: 1.1rem;">←</span>
        <div>
          <div class="flow-btn-tag">Previous</div>
          <div style="font-weight: 600;">${prevPage.title}</div>
        </div>
      </a>

      <a href="${nextPage.url}" class="flow-btn next" title="Next: ${nextPage.title}">
        <div style="text-align: right;">
          <div class="flow-btn-tag">Next</div>
          <div style="font-weight: 600;">${nextPage.title}</div>
        </div>
        <span style="color: var(--accent-cyan); font-size: 1.1rem;">→</span>
      </a>
    `;

    const targetContainer = document.querySelector('.section-container') || document.querySelector('main');
    if (targetContainer) {
      targetContainer.appendChild(flowNav);
    }

    // Keyboard arrow keys for previous / next navigation
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowLeft') {
        window.location.href = prevPage.url;
      } else if (e.key === 'ArrowRight') {
        window.location.href = nextPage.url;
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      buildAudioToggle();
      buildPageFlowNav();
    });
  } else {
    buildAudioToggle();
    buildPageFlowNav();
  }
})();
