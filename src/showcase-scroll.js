/* ==========================================================================
   SHARVIN PORTFOLIO — ASCENSION-STYLE BI-DIRECTIONAL SLIDE-UP ENGINE
   Smooth slide-up reveals from bottom whenever scrolling DOWN or UP!
   ========================================================================== */

(function () {
  'use strict';

  function initShowcaseScroll() {
    const revealCards = document.querySelectorAll('.slide-up-reveal');
    const videos = document.querySelectorAll('.showcase-video');
    if (!revealCards.length && !videos.length) return;

    // 1. Initial entrance slide-up for Position 1 ("Sharvin Mhatre") & scroll cue
    // Allow the initial unrevealed translateY/opacity to paint, then trigger the upward slide
    setTimeout(() => {
      const pos1Elements = document.querySelectorAll('#pos-1 .slide-up-reveal');
      pos1Elements.forEach((el) => el.classList.add('is-revealed'));
    }, 70);

    // 2. IntersectionObserver for Bi-directional Slide-Up on Scroll (Up and Down)
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -5% 0px',
      threshold: 0.08
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');

          // Ensure video autoplays smoothly
          const video = entry.target.querySelector('video') || (entry.target.tagName === 'VIDEO' ? entry.target : null);
          if (video && video.paused) {
            video.play().catch(() => {});
          }
        } else {
          // When scrolling away (either down or up), un-reveal the element so that
          // whenever the user scrolls back, it triggers the smooth slide-up effect again!
          // Only stay revealed if resting at the very top of the page (< 80px) for pos-1
          if (entry.target.closest('#pos-1') && window.scrollY < 80) {
            return;
          }
          entry.target.classList.remove('is-revealed');
        }
      });
    }, observerOptions);

    revealCards.forEach((card) => {
      revealObserver.observe(card);
    });

    // 3. Homepage user-interaction audio trigger (Slushii 0:45 - 1:45)
    let hasEngagedAudio = false;
    const onFirstUserScroll = () => {
      if (!hasEngagedAudio) {
        hasEngagedAudio = true;
        if (window.UltraAudio && !window.UltraAudio.isPlaying && !window.UltraAudio.userManuallyPaused) {
          window.UltraAudio.playSegment();
        }
      }
      window.removeEventListener('scroll', onFirstUserScroll);
      window.removeEventListener('wheel', onFirstUserScroll);
      window.removeEventListener('touchmove', onFirstUserScroll);
    };

    window.addEventListener('scroll', onFirstUserScroll, { passive: true });
    window.addEventListener('wheel', onFirstUserScroll, { passive: true });
    window.addEventListener('touchmove', onFirstUserScroll, { passive: true });

    // 4. Ensure all videos loop and play seamlessly
    videos.forEach((vid) => {
      vid.play().catch(() => {
        vid.muted = true;
        vid.play().catch(() => {});
      });
    });
  }

  window.initShowcaseScroll = initShowcaseScroll;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShowcaseScroll);
  } else {
    initShowcaseScroll();
  }
})();
