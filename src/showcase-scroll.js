/* ==========================================================================
   SHARVIN PORTFOLIO — ASCENSION-STYLE BI-DIRECTIONAL SLIDE-UP ENGINE
   Smooth slide-up reveals from bottom whenever scrolling DOWN or UP!
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const revealCards = document.querySelectorAll('.slide-up-reveal');
    const videos = document.querySelectorAll('.showcase-video');
    let hasEngagedAudio = false;

    // 1. Initial visual slide-up for Section 1 after brief intro pause
    if (revealCards.length > 0) {
      setTimeout(() => {
        revealCards[0].classList.add('is-revealed');
      }, 300);
    }

    // 2. IntersectionObserver for Bi-directional Slide-Up on Scroll
    // rootMargin triggers slightly before entering viewport for silky responsiveness
    const observerOptions = {
      root: null,
      rootMargin: '-4% 0px -6% 0px',
      threshold: 0.1
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

          // Trigger Slushii audio on first scroll past section 1
          if (!hasEngagedAudio && entry.target !== revealCards[0]) {
            hasEngagedAudio = true;
            if (window.UltraAudio && !window.UltraAudio.isPlaying) {
              window.UltraAudio.playFrom40s();
            }
          }
        } else {
          // BI-DIRECTIONAL FIX: Reset when element leaves viewport in either direction
          // (whether scrolled above or below) so scrolling back up re-triggers the slide-up animation!
          entry.target.classList.remove('is-revealed');
        }
      });
    }, observerOptions);

    revealCards.forEach((card) => {
      revealObserver.observe(card);
    });

    // 3. User interaction audio trigger
    const onFirstUserScroll = () => {
      if (!hasEngagedAudio) {
        hasEngagedAudio = true;
        if (window.UltraAudio && !window.UltraAudio.isPlaying) {
          window.UltraAudio.playFrom40s();
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
  });
})();
