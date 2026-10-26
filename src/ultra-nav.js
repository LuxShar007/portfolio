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
      this.audio = new Audio();
      this.audio.crossOrigin = 'anonymous';
      this.audio.src = this.audioSrc;
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
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.15; // Lightning-fast transient kick punch for beat detection
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
  }

  // Keyboard arrow keys for previous / next navigation (zero lag)
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const pathname = window.location.pathname;
    const page = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';
    if (page === '' || page === 'index.html') return;

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

    if (e.key === 'ArrowLeft') {
      instantNavigate(prevPage.url);
    } else if (e.key === 'ArrowRight') {
      instantNavigate(nextPage.url);
    }
  });

  // ==========================================================================
  // 5. 240Hz INSTANT SPA NAVIGATION & ZERO-LATENCY PREFETCH ENGINE
  // ==========================================================================
  const pageCache = new Map();
  const KNOWN_PAGES = [
    'index.html',
    'about.html',
    'expertise.html',
    'milestones.html',
    'projects.html',
    'connect.html'
  ];

  async function prefetchPage(url) {
    if (!url) return null;
    const cleanUrl = url.split('#')[0].split('?')[0];
    let path = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1) || 'index.html';
    if (!path.endsWith('.html')) path = path + '.html';
    if (!KNOWN_PAGES.includes(path)) return null;
    if (pageCache.has(path)) return pageCache.get(path);

    try {
      const res = await fetch('/' + path);
      if (!res.ok) return null;
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const entry = { doc, html };
      pageCache.set(path, entry);
      return entry;
    } catch (e) {
      return null;
    }
  }

  // Pre-load all site pages into in-memory RAM right after load
  function prefetchAllPages() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        KNOWN_PAGES.forEach(p => prefetchPage(p));
      });
    } else {
      setTimeout(() => {
        KNOWN_PAGES.forEach(p => prefetchPage(p));
      }, 200);
    }
  }

  const loadedScriptSrcs = new Set();
  document.querySelectorAll('script[src]').forEach(s => {
    const src = s.getAttribute('src');
    if (src) {
      const clean = src.split('?')[0].replace(/^.*\/\/[^\/]+/, '');
      loadedScriptSrcs.add(clean);
      loadedScriptSrcs.add(src);
    }
  });

  async function loadPageScripts(doc) {
    if (!doc) return;
    const scripts = Array.from(doc.querySelectorAll('script[src]'));
    for (const s of scripts) {
      const rawSrc = s.getAttribute('src');
      if (!rawSrc) continue;
      if (rawSrc.includes('lucide') && window.lucide) continue;
      const clean = rawSrc.split('?')[0].replace(/^.*\/\/[^\/]+/, '');
      if (loadedScriptSrcs.has(clean) || loadedScriptSrcs.has(rawSrc)) continue;

      await new Promise((resolve) => {
        const scriptEl = document.createElement('script');
        scriptEl.src = rawSrc;
        scriptEl.async = false;
        scriptEl.onload = () => {
          loadedScriptSrcs.add(clean);
          loadedScriptSrcs.add(rawSrc);
          resolve();
        };
        scriptEl.onerror = () => {
          console.warn('Failed to dynamically load script:', rawSrc);
          resolve();
        };
        document.body.appendChild(scriptEl);
      });
    }
  }

  let isTransitioning = false;

  async function instantNavigate(targetUrl, updateHistory = true) {
    if (isTransitioning) return;
    const cleanTarget = targetUrl.split('#')[0].split('?')[0];
    let targetPath = cleanTarget.substring(cleanTarget.lastIndexOf('/') + 1) || 'index.html';
    if (!targetPath.endsWith('.html')) targetPath = targetPath + '.html';
    let currentPath = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1) || 'index.html';
    if (!currentPath.endsWith('.html')) currentPath = currentPath + '.html';

    if (targetPath === currentPath) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    isTransitioning = true;
    let cached = pageCache.get(targetPath);
    if (!cached) {
      cached = await prefetchPage(targetPath);
    }

    if (!cached || !cached.doc) {
      // Fallback
      window.location.href = targetUrl;
      return;
    }

    const newDoc = cached.doc;
    const newMain = newDoc.querySelector('main');
    const currentMain = document.querySelector('main');

    if (!newMain || !currentMain) {
      window.location.href = targetUrl;
      return;
    }

    // Micro-fade out with 240Hz hardware acceleration
    currentMain.classList.add('page-transitioning-out');

    // Dynamically load any missing scripts required by target page before mounting
    await loadPageScripts(newDoc);

    setTimeout(() => {
      // Swap content and document metadata
      document.title = newDoc.title || 'Sharvin Mhatre';
      currentMain.innerHTML = newMain.innerHTML;
      currentMain.className = newMain.className;
      if (newMain.getAttribute('style')) {
        currentMain.setAttribute('style', newMain.getAttribute('style'));
      } else {
        currentMain.removeAttribute('style');
      }

      // Snap viewport to top instantly with zero lag
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Update browser history with clean URL format
      if (updateHistory) {
        const historyUrl = targetPath === 'index.html' ? '/' : '/' + targetPath.replace(/\.html$/, '');
        window.history.pushState({ path: targetPath }, '', historyUrl);
      }

      // Transition in smoothly
      currentMain.classList.remove('page-transitioning-out');
      currentMain.classList.add('page-transitioning-in');

      // Force composition
      void currentMain.offsetWidth;
      currentMain.classList.add('is-entered');

      setTimeout(() => {
        currentMain.classList.remove('page-transitioning-in', 'is-entered');
        isTransitioning = false;
      }, 220);

      // Re-run page initializers
      buildPageFlowNav();
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }

      // Autoplay videos
      const videos = currentMain.querySelectorAll('video');
      videos.forEach(v => {
        v.play().catch(() => {});
      });

      // App Core interaction engine (terminal, contact form, hover cards, icons)
      if (typeof window.initAppV3 === 'function') {
        window.initAppV3();
      }

      // Page-specific module lifecycles
      if (targetPath === 'index.html') {
        if (typeof window.initShowcaseScroll === 'function') window.initShowcaseScroll();
      } else if (targetPath === 'expertise.html') {
        if (typeof window.init3DLidarLab === 'function') window.init3DLidarLab();
        if (typeof window.initAdaptiveSlider === 'function') window.initAdaptiveSlider();
      } else if (targetPath === 'milestones.html') {
        if (typeof window.TrophyHall === 'function') new window.TrophyHall();
      }

      // Trigger reveal in-view
      const headerAnims = currentMain.querySelectorAll('.animate-title, .animate-fade, .slide-up-reveal');
      headerAnims.forEach(el => el.classList.add('in-view', 'is-revealed'));

      // Re-bind interactive links on newly injected DOM
      bindLinkInterceptors(currentMain);
    }, 100);
  }

  function bindLinkInterceptors(container = document) {
    const links = container.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http://') || href.startsWith('https://')) return;

      const clean = href.split('#')[0].split('?')[0];
      const filename = clean.substring(clean.lastIndexOf('/') + 1) || 'index.html';
      if (!KNOWN_PAGES.includes(filename)) return;

      // Prefetch on hover or touchstart
      link.addEventListener('mouseenter', () => prefetchPage(filename), { passive: true });
      link.addEventListener('touchstart', () => prefetchPage(filename), { passive: true });

      // Click handler for instant SPA navigation
      link.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        instantNavigate(href, true);
      });
    });
  }

  // Handle browser Back / Forward buttons with instant swap
  window.addEventListener('popstate', () => {
    const path = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1) || 'index.html';
    instantNavigate(path, false);
  });

  window.instantNavigate = instantNavigate;

  // Initialize on DOM ready
  function initNav() {
    buildAudioToggle();
    buildPageFlowNav();
    bindLinkInterceptors(document);
    prefetchAllPages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
