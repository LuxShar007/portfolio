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

    // 1. Initial visual slide-up for Section 1 immediately
    if (revealCards.length > 0) {
      revealCards[0].classList.add('is-revealed');
    }

    // 2. IntersectionObserver for Bi-directional Slide-Up on Scroll
    const observerOptions = {
      root: null,
      rootMargin: '20px 0px 20px 0px',
      threshold: 0.02
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
        }
      });
    }, observerOptions);

    revealCards.forEach((card) => {
      revealObserver.observe(card);
    });

    // 3. Ensure all videos loop and play seamlessly
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
