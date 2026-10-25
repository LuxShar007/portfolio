/* ==========================================================================
   SHARVIN MHATRE PORTFOLIO — VIRTUAL 3D TROPHY HALL & CERTIFICATE LIGHTBOX
   Provides 3D card tilt physics, category filtering, and certificate lightbox modal.
   ========================================================================== */

(function () {
  'use strict';

  class TrophyHall {
    constructor() {
      this.cards = document.querySelectorAll('.trophy-card');
      this.lightbox = null;
      this.init();
    }

    init() {
      this.setup3DTilt();
      this.setupFilters();
      this.setupLightbox();
    }

    setup3DTilt() {
      // Skip on touch/mobile devices to save battery and GPU overhead
      if (window.matchMedia('(pointer: coarse)').matches) return;

      this.cards.forEach(card => {
        let cachedRect = null;
        let ticking = false;
        let mouseX = 0;
        let mouseY = 0;

        card.addEventListener('mouseenter', () => {
          cachedRect = card.getBoundingClientRect();
        });

        card.addEventListener('mousemove', (e) => {
          if (!cachedRect) cachedRect = card.getBoundingClientRect();
          mouseX = e.clientX - cachedRect.left;
          mouseY = e.clientY - cachedRect.top;

          if (!ticking) {
            requestAnimationFrame(() => {
              if (!cachedRect) return;
              const centerX = cachedRect.width / 2;
              const centerY = cachedRect.height / 2;

              const rotateX = (mouseY - centerY) / 12 * -1;
              const rotateY = (mouseX - centerX) / 12;

              card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;

              const glare = card.querySelector('.trophy-glare');
              if (glare) {
                glare.style.background = `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)`;
              }
              ticking = false;
            });
            ticking = true;
          }
        }, { passive: true });

        card.addEventListener('mouseleave', () => {
          cachedRect = null;
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
          const glare = card.querySelector('.trophy-glare');
          if (glare) {
            glare.style.background = 'none';
          }
        });
      });
    }

    setupFilters() {
      const filterBtns = document.querySelectorAll('.trophy-filter-btn');
      if (!filterBtns.length) return;

      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const category = btn.getAttribute('data-filter');

          this.cards.forEach(card => {
            const cardCat = card.getAttribute('data-category');
            if (category === 'all' || cardCat === category) {
              card.style.display = 'flex';
              card.classList.add('animate-fade');
            } else {
              card.style.display = 'none';
            }
          });

          if (window.AudioEngine) {
            window.AudioEngine.playClick();
          }
        });
      });
    }

    setupLightbox() {
      let modal = document.getElementById('cert-lightbox');
      if (!modal) {
        modal = document.createElement('div');
        modal.className = 'cert-lightbox-modal';
        modal.id = 'cert-lightbox';
        modal.innerHTML = `
          <div class="cert-lightbox-backdrop"></div>
          <div class="cert-lightbox-content glass-panel font-mono">
            <button class="cert-lightbox-close" id="cert-lightbox-close" aria-label="Close certificate">&times;</button>
            <div class="cert-lightbox-header">
              <span class="text-cyan font-mono" style="font-size: 0.76rem; letter-spacing: 1.5px; display: inline-flex; align-items: center; gap: 6px;">
                <i data-lucide="award"></i> OFFICIAL VERIFIED CREDENTIAL
              </span>
              <h3 id="cert-modal-title" style="color: #fff; margin-top: 6px; font-size: 1.15rem; font-family: var(--font-display);">Certificate Title</h3>
            </div>
            <div class="cert-image-wrapper">
              <img id="cert-modal-img" src="" alt="Certificate Preview">
            </div>
            <div class="cert-lightbox-footer" style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 4px;">
              <a id="cert-modal-download" href="" target="_blank" class="cta-button primary" style="padding: 8px 18px; font-size: 0.8rem; text-decoration: none;">
                <span class="btn-content"><i data-lucide="external-link"></i> Open Full High-Res</span>
              </a>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      this.lightbox = modal;

      const closeBtn = modal.querySelector('#cert-lightbox-close');
      const backdrop = modal.querySelector('.cert-lightbox-backdrop');

      const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (window.AudioEngine) window.AudioEngine.playClick();
      };

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (backdrop) backdrop.addEventListener('click', closeModal);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          closeModal();
        }
      });

      // Bind all certificate links
      document.addEventListener('click', (e) => {
        const certLink = e.target.closest('.cert-lightbox-trigger, .milestone-cert-link');
        if (certLink) {
          e.preventDefault();
          const imgUrl = certLink.getAttribute('href');
          const title = certLink.getAttribute('data-title') || certLink.textContent.trim();

          const modalImg = modal.querySelector('#cert-modal-img');
          const modalTitle = modal.querySelector('#cert-modal-title');
          const modalDownload = modal.querySelector('#cert-modal-download');

          if (modalImg) modalImg.src = imgUrl;
          if (modalTitle) modalTitle.textContent = title;
          if (modalDownload) modalDownload.href = imgUrl;

          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
          if (window.lucide) window.lucide.createIcons();
          if (window.AudioEngine) window.AudioEngine.playActivate();
        }
      });

      if (window.lucide) window.lucide.createIcons();
    }
  }

  window.TrophyHall = TrophyHall;

  document.addEventListener('DOMContentLoaded', () => {
    new TrophyHall();
  });
})();
