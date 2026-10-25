/* ==========================================================================
   WHAT IS AN API? TACTILE ADAPTIVE SLIDER & INTERACTIVE LIFECYCLE SCRUBBER
   Derived from User Component: Spring Physics, Dynamic Color Gradients,
   5-Stage API Roundtrip Telemetry & 240Hz Hardware-Accelerated Rendering.
   ========================================================================== */

(function () {
  'use strict';

  const DEFAULT_MIN = 1;
  const DEFAULT_MAX = 5;
  const DEFAULT_STEP = 1;

  // 5 Real-World API Lifecycle Milestones
  const API_STAGES = {
    1: {
      step: 1,
      title: 'CLIENT DISPATCH',
      unit: 'STEP 1',
      badge: 'HTTP/2 GET',
      method: 'HTTP GET',
      path: '/api/v1/system/telemetry',
      statusText: 'CLIENT DISPATCH',
      statusClass: 'pending',
      latency: '0.4ms',
      activeNode: 'client',
      wirePulse: 'wire1-fwd',
      desc: 'The user clicks an action or loads a view. The browser / mobile client constructs an asynchronous HTTP Request with headers (Accept: application/json, Bearer Auth) and fires it across the internet to the backend.',
      code: `GET /api/v1/system/telemetry HTTP/2
Host: api.sharvinmhatre.com
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUz...
User-Agent: AxiomClient/v2.4 (240Hz-Ultra)`
    },
    2: {
      step: 2,
      title: 'GATEWAY ROUTER',
      unit: 'STEP 2',
      badge: 'DNS & AUTH',
      method: 'ROUTER',
      path: '/api/v1/gateway/validate',
      statusText: '200 AUTH OK',
      statusClass: 'success',
      latency: '1.2ms',
      activeNode: 'gateway',
      wirePulse: null,
      desc: 'The request hits the edge API Gateway (Node.js/FastAPI). The server validates CORS headers, applies rate-limiting algorithms, verifies cryptographic JWT signatures, and routes the request to the matching controller.',
      code: `{
  "edge_cluster": "aws-us-east-1",
  "client_ip": "157.240.22.35",
  "jwt_signature": "VERIFIED_VALID",
  "rate_limit_remaining": 992,
  "route_target": "TelemetryController.getRealtimeStream"
}`
    },
    3: {
      step: 3,
      title: 'DATABASE & CACHE',
      unit: 'STEP 3',
      badge: 'SQL & REDIS',
      method: 'DATA POOL',
      path: 'QUERY /telemetry_db',
      statusText: 'CACHE HIT (REDIS)',
      statusClass: 'success',
      latency: '2.0ms',
      activeNode: 'database',
      wirePulse: 'wire2-fwd',
      desc: 'The backend controller talks to the persistence layer. It checks ultra-fast in-memory Redis cache (sub-millisecond hit). If uncached, it executes an indexed SQL query on PostgreSQL to retrieve the raw system telemetry.',
      code: `-- Redis Cache Check: tele:user:95 -> CACHE_HIT (0.35ms)
-- Fallback Index Scan on PostgreSQL:
SELECT telemetry_id, cpu_temp, imu_yaw, pitch, roll, status
FROM aerospace_telemetry
WHERE user_id = 95
ORDER BY timestamp_ms DESC LIMIT 1;`
    },
    4: {
      step: 4,
      title: 'JSON PACKET',
      unit: 'STEP 4',
      badge: 'STATUS 200 OK',
      method: 'HTTP 200',
      path: '/api/v1/system/telemetry',
      statusText: '200 OK (2.8ms)',
      statusClass: 'success',
      latency: '2.8ms',
      activeNode: 'gateway',
      wirePulse: 'wire2-bwd',
      desc: 'The backend serializes raw database rows into lightweight, universal JSON format. It attaches HTTP response status 200 OK and Brotli compression headers before transmitting back to the client application.',
      code: `HTTP/2 200 OK
Content-Type: application/json
Content-Encoding: br

{
  "status": "healthy",
  "cluster": "axiom-edge-node-01",
  "uptime": "99.98%",
  "latency_ms": 2.8,
  "data": { "imu_yaw": 14.2, "velocity": "42.8 m/s" }
}`
    },
    5: {
      step: 5,
      title: 'UI DOM RENDER',
      unit: 'STEP 5',
      badge: 'STATE SYNC',
      method: 'DOM SYNC',
      path: 'CLIENT RENDER',
      statusText: 'CYCLE COMPLETE',
      statusClass: 'success',
      latency: '3.4ms',
      activeNode: 'client',
      wirePulse: 'wire1-bwd',
      desc: 'The browser receives the JSON packet in under 4ms! JavaScript asynchronously parses response.json(), updates reactive component states, and triggers a hardware-accelerated 240Hz DOM repaint without reloading the browser page!',
      code: `// Asynchronous client fulfillment:
const response = await fetch('/api/v1/system/telemetry');
const payload = await response.json();

// Reactive State Update (Zero Page Reload):
updateDashboardTelemetry(payload.data);
window.AudioEngine?.playBeep(880, 0.08); // Success chime`
    }
  };

  /**
   * Color calculation directly matching user's component specification
   */
  function getColorSettings(value, min, max) {
    const percentage = (value - min) / (max - min);

    if (percentage < 0.5) {
      return {
        text: '#10B981',
        gradient: 'linear-gradient(to right, #FEB101, #FE7C09)',
        thumbBorder: '#10B981',
        glow: 'rgba(254, 124, 9, 0.35)'
      };
    } else if (percentage < 0.7) {
      return {
        text: '#FE55B7',
        gradient: 'linear-gradient(to right, rgba(254, 85, 183, 0.3), #FE55B7)',
        thumbBorder: '#F97316',
        glow: 'rgba(254, 85, 183, 0.4)'
      };
    } else {
      return {
        text: '#D946EF',
        gradient: 'linear-gradient(to right, #DAB0FE, #4946FF)',
        thumbBorder: '#D946EF',
        glow: 'rgba(73, 70, 255, 0.45)'
      };
    }
  }

  let currentValue = 1;
  let autoPlayInterval = null;

  document.addEventListener('DOMContentLoaded', initAdaptiveSlider);
  if (document.readyState !== 'loading') initAdaptiveSlider();

  function initAdaptiveSlider() {
    const rangeInput = document.getElementById('api-adaptive-range');
    if (!rangeInput) return;

    const fill = document.getElementById('api-slider-fill');
    const thumb = document.getElementById('api-slider-thumb');
    const animatedTextEl = document.getElementById('api-slider-text');
    const unitEl = document.getElementById('api-slider-unit');
    const badgeEl = document.getElementById('api-slider-stage-badge');
    const dotsContainer = document.getElementById('api-slider-dots');
    const autoPlayBtn = document.getElementById('api-slider-autoplay-btn');
    const stepPills = document.querySelectorAll('.slider-step-pill');

    // Live Inspector Elements
    const methodBadge = document.getElementById('api-method-badge');
    const pathText = document.getElementById('api-path-text');
    const latencyVal = document.getElementById('api-latency-val');
    const statusBadge = document.getElementById('api-status-badge');
    const descText = document.getElementById('api-desc-text');
    const jsonOutput = document.getElementById('api-json-output');

    // Architecture Nodes
    const clientNode = document.getElementById('api-node-client');
    const gatewayNode = document.getElementById('api-node-gateway');
    const dbNode = document.getElementById('api-node-db');
    const pulse1 = document.getElementById('api-packet-pulse-1');
    const pulse2 = document.getElementById('api-packet-pulse-2');

    function updateSlider(val, userInitiated = false) {
      currentValue = Math.min(Math.max(val, DEFAULT_MIN), DEFAULT_MAX);
      rangeInput.value = currentValue;

      const percentage = (currentValue - DEFAULT_MIN) / (DEFAULT_MAX - DEFAULT_MIN);
      const colorSettings = getColorSettings(currentValue, DEFAULT_MIN, DEFAULT_MAX);
      const stageData = API_STAGES[currentValue];

      // Exact user formula: width = calc((percentage) * (100% - 52px) + 52px)
      // Exact user formula: left  = calc((percentage) * (100% - 52px))
      if (fill) {
        fill.style.width = `calc(${percentage} * (100% - 52px) + 52px)`;
        fill.style.background = colorSettings.gradient;
        fill.style.boxShadow = `0 0 24px ${colorSettings.glow}`;
      }

      if (thumb) {
        thumb.style.left = `calc(${percentage} * (100% - 52px))`;
      }

      // Dynamic Animated Text with Pop Spans
      if (animatedTextEl) {
        renderAnimatedText(animatedTextEl, stageData.title);
        animatedTextEl.style.color = colorSettings.text;
      }

      if (unitEl) {
        unitEl.textContent = stageData.unit;
      }

      if (badgeEl) {
        badgeEl.textContent = stageData.badge;
        badgeEl.style.color = colorSettings.text;
        badgeEl.style.borderColor = colorSettings.text;
        badgeEl.style.background = `rgba(255, 255, 255, 0.05)`;
      }

      // Update Milestone Dots
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, idx) => {
          if (idx + 1 <= currentValue) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      }

      // Update Quick Jump Pills
      if (stepPills.length) {
        stepPills.forEach((pill) => {
          const stepNum = Number(pill.getAttribute('data-step'));
          if (stepNum === currentValue) {
            pill.classList.add('active');
          } else {
            pill.classList.remove('active');
          }
        });
      }

      // Update Live Telemetry Inspector
      if (methodBadge) methodBadge.textContent = stageData.method;
      if (pathText) pathText.textContent = stageData.path;
      if (latencyVal) latencyVal.textContent = stageData.latency;
      if (statusBadge) {
        statusBadge.textContent = stageData.statusText;
        statusBadge.className = `api-status-badge font-mono ${stageData.statusClass}`;
      }
      if (descText) descText.textContent = stageData.desc;
      if (jsonOutput) jsonOutput.textContent = stageData.code;

      // Update 3-Node Diagram Highlight
      [clientNode, gatewayNode, dbNode].forEach((node) => {
        if (node) {
          node.classList.remove('pulse-active', 'pulse-glow');
        }
      });

      if (stageData.activeNode === 'client' && clientNode) {
        clientNode.classList.add('pulse-active');
      } else if (stageData.activeNode === 'gateway' && gatewayNode) {
        gatewayNode.classList.add('pulse-active');
      } else if (stageData.activeNode === 'database' && dbNode) {
        dbNode.classList.add('pulse-glow');
      }

      // Animate packet pulse according to stage
      animateWirePulses(stageData.wirePulse, pulse1, pulse2);

      // Play audio feedback
      if (userInitiated && window.AudioEngine && typeof window.AudioEngine.playBeep === 'function') {
        const freqMap = { 1: 520, 2: 640, 3: 760, 4: 880, 5: 1040 };
        window.AudioEngine.playBeep(freqMap[currentValue] || 600, 0.04);
      }
    }

    // Input event on the native range
    rangeInput.addEventListener('input', (e) => {
      stopAutoPlay();
      updateSlider(Number(e.target.value), true);
    });

    // Quick-jump pills click
    stepPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        stopAutoPlay();
        const stepNum = Number(pill.getAttribute('data-step'));
        if (stepNum) updateSlider(stepNum, true);
      });
    });

    // Auto-Play Feature
    if (autoPlayBtn) {
      autoPlayBtn.addEventListener('click', () => {
        if (autoPlayInterval) {
          stopAutoPlay();
        } else {
          startAutoPlay();
        }
      });
    }

    function startAutoPlay() {
      autoPlayBtn.classList.add('playing');
      const icon = document.getElementById('api-play-icon');
      const text = document.getElementById('api-play-text');
      if (text) text.textContent = 'Pause';
      if (icon) icon.setAttribute('data-lucide', 'pause');
      if (window.lucide) window.lucide.createIcons();

      autoPlayInterval = setInterval(() => {
        let nextVal = currentValue + 1;
        if (nextVal > DEFAULT_MAX) nextVal = DEFAULT_MIN;
        updateSlider(nextVal, true);
      }, 1600);
    }

    function stopAutoPlay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
      }
      if (autoPlayBtn) {
        autoPlayBtn.classList.remove('playing');
        const icon = document.getElementById('api-play-icon');
        const text = document.getElementById('api-play-text');
        if (text) text.textContent = 'Auto Play';
        if (icon) icon.setAttribute('data-lucide', 'play');
        if (window.lucide) window.lucide.createIcons();
      }
    }

    // Initialize with Stage 1
    updateSlider(1, false);
  }

  /**
   * Helper to animate character pop spans (matching user's AnimatedText spring component)
   */
  function renderAnimatedText(container, text) {
    container.innerHTML = '';
    const chars = text.split('');
    chars.forEach((char, index) => {
      const span = document.createElement('span');
      span.className = 'char-pop';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.animationDelay = `${index * 0.015}s`;
      container.appendChild(span);
    });
  }

  /**
   * Triggers hardware-accelerated wire packet laser pulses
   */
  function animateWirePulses(wirePulseType, pulse1, pulse2) {
    if (pulse1) pulse1.className = 'api-packet-pulse';
    if (pulse2) pulse2.className = 'api-packet-pulse pulse-violet';

    // Force reflow
    void pulse1?.offsetWidth;
    void pulse2?.offsetWidth;

    if (!wirePulseType) return;

    if (wirePulseType === 'wire1-fwd' && pulse1) {
      pulse1.classList.add('animate-forward');
    } else if (wirePulseType === 'wire2-fwd' && pulse2) {
      pulse2.classList.add('animate-forward');
    } else if (wirePulseType === 'wire2-bwd' && pulse2) {
      pulse2.classList.add('animate-backward');
    } else if (wirePulseType === 'wire1-bwd' && pulse1) {
      pulse1.classList.add('animate-backward');
    }
  }

})();
