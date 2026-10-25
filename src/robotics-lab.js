/* ==========================================================================
   SHARVIN MHATRE PORTFOLIO — AUTONOMOUS DRONE FLIGHT & 360° LIDAR SCANNER
   Real-time 360° LiDAR raycasting, point-cloud terrain mapping, and drone flight
   manipulated via precision 72-tick rotary encoder with SlidingNumber odometer.
   ========================================================================== */

(function () {
  'use strict';

  const TICK_COUNT = 72;

  // Drone & LiDAR Sensor Modes
  const MODES = {
    lidar: {
      name: 'LiDAR Sweep Azimuth',
      unit: 'AZIMUTH (°)',
      min: 0,
      max: 360,
      defaultVal: 120,
      badge: '360° OPTICAL LASER'
    },
    altitude: {
      name: 'Drone Altitude (AGL)',
      unit: 'ALTITUDE (m)',
      min: 0,
      max: 60,
      defaultVal: 18,
      badge: 'BARO & TOF SENSOR'
    },
    yaw: {
      name: 'Flight Heading / Yaw',
      unit: 'HEADING (°)',
      min: 0,
      max: 360,
      defaultVal: 45,
      badge: 'IMU COMPASS LOCK'
    },
    frequency: {
      name: 'LiDAR Scan Frequency',
      unit: 'PULSE RATE (Hz)',
      min: 10,
      max: 50,
      defaultVal: 25,
      badge: 'ROTATING PUCK RPM'
    }
  };

  const state = {
    activeMode: 'lidar',
    values: {
      lidar: 120,
      altitude: 18,
      yaw: 45,
      frequency: 25
    },
    isDragging: false,
    prevVal: 120,
    blur: 0,
    autoScan: true,
    scanAngle: 0,
    pointCloud: [],
    dronePos: { x: 0, y: 0, targetX: 0, targetY: 0 }
  };

  // Simulated 2D/3D Obstacles in surrounding spatial environment
  const OBSTACLES = [
    { type: 'box', x: 80, y: 70, w: 55, h: 45, label: 'Building A' },
    { type: 'box', x: 340, y: 60, w: 70, h: 60, label: 'Telecom Tower' },
    { type: 'circle', x: 110, y: 210, r: 28, label: 'Tree Cluster' },
    { type: 'box', x: 320, y: 200, w: 85, h: 40, label: 'Warehouse B' },
    { type: 'circle', x: 240, y: 40, r: 22, label: 'Pylon' },
    { type: 'wall', x1: 30, y1: 260, x2: 450, y2: 260, label: 'Perimeter Barrier' }
  ];

  document.addEventListener('DOMContentLoaded', initDroneLidarLab);
  if (document.readyState !== 'loading') initDroneLidarLab();

  function initDroneLidarLab() {
    const knobEl = document.getElementById('robotics-knob');
    const canvas = document.getElementById('robot-arm-canvas');
    if (!knobEl || !canvas) return;

    // 1. Build 72-Tick SVG Ring
    buildTickRing();

    // 2. Rotary Knob Interaction
    initKnobDrag(knobEl);

    // 3. Mode Selector Pills
    initModeSelector();

    // 4. Presets & Controls
    initPresets();

    // 5. Start Canvas Drone & LiDAR Simulation Loop
    initLidarCanvas(canvas);

    // Initial render
    updateKnobDisplay(state.values[state.activeMode]);
  }

  function buildTickRing() {
    const svg = document.getElementById('knob-ticks-svg');
    if (!svg) return;
    svg.innerHTML = '';

    for (let i = 0; i < TICK_COUNT; i++) {
      const angle = (i * 360) / TICK_COUNT;
      const isMajor = i % 6 === 0;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '50');
      line.setAttribute('y1', '4');
      line.setAttribute('x2', '50');
      line.setAttribute('y2', isMajor ? '11' : '8');
      line.setAttribute('transform', `rotate(${angle} 50 50)`);
      line.setAttribute('stroke', isMajor ? 'rgba(75, 213, 238, 0.9)' : 'rgba(255, 255, 255, 0.22)');
      line.setAttribute('stroke-width', isMajor ? '1.15' : '0.65');
      line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
    }
  }

  function initKnobDrag(knobEl) {
    function updateFromPointer(clientX, clientY) {
      const rect = knobEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let angle = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;

      const tickAngle = 360 / TICK_COUNT;
      const snappedAngle = Math.round(angle / tickAngle) * tickAngle;

      const currentMode = MODES[state.activeMode];
      const percent = snappedAngle / 360;
      const newValue = Math.round(percent * (currentMode.max - currentMode.min) + currentMode.min);

      setModeValue(state.activeMode, newValue, true);
    }

    knobEl.addEventListener('mousedown', (e) => {
      state.isDragging = true;
      updateFromPointer(e.clientX, e.clientY);

      const onMove = (ev) => {
        if (state.isDragging) updateFromPointer(ev.clientX, ev.clientY);
      };
      const onUp = () => {
        state.isDragging = false;
        state.blur = 0;
        updateBlur();
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });

    knobEl.addEventListener('touchstart', (e) => {
      if (!e.touches.length) return;
      state.isDragging = true;
      updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);

      const onTouchMove = (ev) => {
        if (state.isDragging && ev.touches.length) {
          updateFromPointer(ev.touches[0].clientX, ev.touches[0].clientY);
        }
      };
      const onTouchEnd = () => {
        state.isDragging = false;
        state.blur = 0;
        updateBlur();
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };

      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd);
    }, { passive: true });
  }

  function setModeValue(modeKey, val, playTickSound = false) {
    const config = MODES[modeKey];
    const clamped = Math.min(Math.max(val, config.min), config.max);

    if (clamped !== state.values[modeKey]) {
      const diff = Math.abs(clamped - state.values[modeKey]);
      state.blur = state.isDragging ? Math.min(6, diff * 0.4) : 0;
      state.values[modeKey] = clamped;

      if (modeKey === 'lidar') {
        state.scanAngle = (clamped * Math.PI) / 180;
      }

      if (playTickSound && window.AudioEngine && typeof window.AudioEngine.playClick === 'function') {
        window.AudioEngine.playClick();
      }
    }

    updateKnobDisplay(clamped);
    updateTelemetry();
  }

  function updateBlur() {
    const container = document.getElementById('knob-sliding-number');
    if (container) {
      container.style.filter = state.blur > 0.5 ? `blur(${state.blur}px)` : 'none';
    }
  }

  function updateKnobDisplay(val) {
    const config = MODES[state.activeMode];
    const percent = (val - config.min) / (config.max - config.min);
    const angleDeg = percent * 360;

    const arrow = document.getElementById('knob-arrow');
    if (arrow) arrow.style.transform = `rotate(${angleDeg}deg)`;

    const numberContainer = document.getElementById('knob-sliding-number');
    if (numberContainer) renderSlidingNumber(numberContainer, val);

    const unitLabel = document.getElementById('knob-unit-label');
    if (unitLabel) unitLabel.textContent = config.unit;

    updateBlur();
  }

  /**
   * Slot-Digit Odometer (User Component SlidingNumber logic)
   */
  function renderSlidingNumber(container, value) {
    const str = Math.abs(value).toString().padStart(value < 0 ? 3 : 2, '0');
    const digits = str.split('');

    container.innerHTML = '';
    digits.forEach((char) => {
      const digitVal = parseInt(char, 10);
      const digitCol = document.createElement('div');
      digitCol.className = 'slot-digit-col';

      const reel = document.createElement('div');
      reel.className = 'slot-digit-reel';
      reel.style.transform = `translateY(-${digitVal * 10}%)`;

      for (let i = 0; i <= 9; i++) {
        const slot = document.createElement('span');
        slot.className = 'slot-digit-num';
        slot.textContent = i.toString();
        reel.appendChild(slot);
      }

      digitCol.appendChild(reel);
      container.appendChild(digitCol);
    });
  }

  function initModeSelector() {
    const pills = document.querySelectorAll('.joint-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const modeKey = pill.getAttribute('data-joint');
        if (!modeKey || !MODES[modeKey]) return;

        pills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        state.activeMode = modeKey;
        updateKnobDisplay(state.values[modeKey]);
        updateTelemetry();

        if (window.AudioEngine && typeof window.AudioEngine.playClick === 'function') {
          window.AudioEngine.playClick();
        }
      });
    });
  }

  function initPresets() {
    const presetBtns = document.querySelectorAll('.knob-preset-btn');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const angle = parseInt(btn.getAttribute('data-angle'), 10);
        if (!isNaN(angle)) {
          presetBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          animateModeTo(state.activeMode, angle);
        }
      });
    });

    const autoBtn = document.getElementById('knob-auto-cycle-btn');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        state.autoScan = !state.autoScan;
        autoBtn.classList.toggle('active', state.autoScan);
        const icon = document.getElementById('knob-cycle-icon');
        if (icon) icon.setAttribute('data-lucide', state.autoScan ? 'pause' : 'play');
        if (window.lucide) window.lucide.createIcons();
      });
    }
  }

  function animateModeTo(modeKey, targetVal) {
    const startVal = state.values[modeKey];
    const diff = targetVal - startVal;
    const duration = 260;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(startVal + diff * ease);

      setModeValue(modeKey, val, false);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function updateTelemetry() {
    const statAngle = document.getElementById('stat-angle');
    const statTorque = document.getElementById('stat-torque');
    const statPid = document.getElementById('stat-pid');
    const statCurrent = document.getElementById('stat-current');
    const coordsBadge = document.getElementById('robot-coords-badge');

    const ptsSec = (state.values.frequency * 720).toLocaleString();
    const altMeters = state.values.altitude;
    const headingDeg = state.values.yaw;
    const scanAzimuth = state.values.lidar;

    if (statAngle) statAngle.textContent = `${scanAzimuth}° AZIMUTH`;
    if (statTorque) statTorque.textContent = `${ptsSec} PTS/SEC`;
    if (statPid) statPid.textContent = `${altMeters}.0m AGL (±0.02m TOF)`;
    if (statCurrent) statCurrent.textContent = `${headingDeg}° COMPASS HDG`;
    if (coordsBadge) coordsBadge.textContent = `POINT CLOUD: ${state.pointCloud.length} RETURNS | STATUS: ACTIVE SCAN`;
  }

  /**
   * Real-time 360° LiDAR Ray-Caster and Autonomous Drone Flight Renderer
   */
  function initLidarCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    state.dronePos.x = W / 2;
    state.dronePos.y = H / 2;
    state.dronePos.targetX = W / 2;
    state.dronePos.targetY = H / 2;

    // Interactive Mouse Target for Drone Flight
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      state.dronePos.targetX = (e.clientX - rect.left) * scaleX;
      state.dronePos.targetY = (e.clientY - rect.top) * scaleY;
    });

    let time = 0;

    function renderLidar() {
      time += 0.02;

      // 1. Drone Hover Physics (smooth spring towards target)
      state.dronePos.x += (state.dronePos.targetX - state.dronePos.x) * 0.04;
      state.dronePos.y += (state.dronePos.targetY - state.dronePos.y) * 0.04;

      // Subtle aerodynamic hover bobbing
      const hoverY = state.dronePos.y + Math.sin(time * 3) * 2.5;
      const droneX = state.dronePos.x;
      const droneY = hoverY;

      // 2. Clear Screen
      ctx.clearRect(0, 0, W, H);

      // 3. Draw Tactical Radar Rings & HUD Grid
      drawRadarHUD(ctx, W, H, droneX, droneY);

      // 4. Draw Physical Obstacles in Environment
      drawObstacles(ctx);

      // 5. Cast 360° LiDAR Rays & Update Persistent Point Cloud
      if (state.autoScan) {
        const sweepSpeed = (state.values.frequency / 25) * 0.06;
        state.scanAngle += sweepSpeed;
        if (state.scanAngle > Math.PI * 2) state.scanAngle -= Math.PI * 2;
        
        // Sync knob if active mode is lidar
        if (state.activeMode === 'lidar' && !state.isDragging) {
          const deg = Math.round((state.scanAngle * 180) / Math.PI);
          state.values.lidar = deg;
          updateKnobDisplay(deg);
        }
      }

      castLidarRays(ctx, droneX, droneY, state.scanAngle);

      // 6. Draw Accumulated Point Cloud Returns
      drawPointCloud(ctx);

      // 7. Draw The Flying Drone Chassis, Rotors & LiDAR Puck
      drawFlyingDrone(ctx, droneX, droneY, time);

      requestAnimationFrame(renderLidar);
    }

    renderLidar();
  }

  function drawRadarHUD(ctx, W, H, cx, cy) {
    ctx.save();

    // Radar distance range rings
    const radii = [45, 95, 155, 220];
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(75, 213, 238, 0.08)';
    ctx.setLineDash([3, 5]);

    radii.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Range text
      ctx.fillStyle = 'rgba(75, 213, 238, 0.35)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`${(idx + 1) * 5}m`, cx + r + 3, cy - 3);
    });

    // Crosshairs
    ctx.setLineDash([2, 8]);
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
    ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    ctx.stroke();

    ctx.restore();
  }

  function drawObstacles(ctx) {
    ctx.save();
    OBSTACLES.forEach((obs) => {
      ctx.fillStyle = 'rgba(28, 33, 48, 0.7)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.2;

      if (obs.type === 'box') {
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 4);
        ctx.fill();
        ctx.stroke();
      } else if (obs.type === 'circle') {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (obs.type === 'wall') {
        ctx.beginPath();
        ctx.moveTo(obs.x1, obs.y1);
        ctx.lineTo(obs.x2, obs.y2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  /**
   * Casts dense optical laser rays outward and detects spatial surface hits
   */
  function castLidarRays(ctx, cx, cy, centerAngle) {
    const numBeams = 32;
    const fov = Math.PI * 0.45; // 80 deg active laser fan cone
    const maxRange = 240;

    ctx.save();

    for (let i = 0; i < numBeams; i++) {
      const angle = centerAngle - fov / 2 + (i / (numBeams - 1)) * fov;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      let closestHitDist = maxRange;
      let hitType = null;

      // Ray-box and Ray-circle intersection tests
      OBSTACLES.forEach((obs) => {
        if (obs.type === 'box') {
          const dist = rayIntersectsBox(cx, cy, cosA, sinA, obs.x, obs.y, obs.w, obs.h);
          if (dist > 0 && dist < closestHitDist) {
            closestHitDist = dist;
            hitType = 'building';
          }
        } else if (obs.type === 'circle') {
          const dist = rayIntersectsCircle(cx, cy, cosA, sinA, obs.x, obs.y, obs.r);
          if (dist > 0 && dist < closestHitDist) {
            closestHitDist = dist;
            hitType = 'vegetation';
          }
        }
      });

      const hitX = cx + cosA * closestHitDist;
      const hitY = cy + sinA * closestHitDist;

      // Draw faint laser sweep beam
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hitX, hitY);
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.12 * (1 - closestHitDist / maxRange)})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Record point cloud return if hit before max range
      if (closestHitDist < maxRange - 5) {
        state.pointCloud.push({
          x: hitX + (Math.random() - 0.5) * 2,
          y: hitY + (Math.random() - 0.5) * 2,
          dist: closestHitDist,
          life: 1.0,
          decay: 0.012
        });
      }
    }

    // Limit maximum point cloud memory
    if (state.pointCloud.length > 320) {
      state.pointCloud.splice(0, state.pointCloud.length - 320);
    }

    ctx.restore();
  }

  function rayIntersectsCircle(cx, cy, dx, dy, ox, oy, r) {
    const fx = cx - ox;
    const fy = cy - oy;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return -1;
    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
    return t > 0 ? t : -1;
  }

  function rayIntersectsBox(cx, cy, dx, dy, bx, by, bw, bh) {
    let tmin = 0;
    let tmax = 500;

    const invDx = dx !== 0 ? 1 / dx : 1e9;
    const invDy = dy !== 0 ? 1 / dy : 1e9;

    let t1 = (bx - cx) * invDx;
    let t2 = (bx + bw - cx) * invDx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return -1;

    t1 = (by - cy) * invDy;
    t2 = (by + bh - cy) * invDy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return -1;

    return tmin > 0 ? tmin : -1;
  }

  function drawPointCloud(ctx) {
    ctx.save();
    for (let i = state.pointCloud.length - 1; i >= 0; i--) {
      const pt = state.pointCloud[i];
      pt.life -= pt.decay;

      if (pt.life <= 0) {
        state.pointCloud.splice(i, 1);
        continue;
      }

      // Point cloud elevation coloring (distance heatmap)
      let color;
      if (pt.dist < 60) color = `rgba(255, 68, 102, ${pt.life})`; // Red (dangerously close)
      else if (pt.dist < 120) color = `rgba(245, 158, 11, ${pt.life})`; // Amber
      else color = `rgba(0, 229, 255, ${pt.life * 0.9})`; // Cyan

      ctx.fillStyle = color;
      ctx.fillRect(pt.x - 1.2, pt.y - 1.2, 2.4, 2.4);
    }
    ctx.restore();
  }

  /**
   * Draws the Quadcopter Drone with spinning rotors & center LiDAR puck
   */
  function drawFlyingDrone(ctx, x, y, time) {
    const yawAngle = (state.values.yaw * Math.PI) / 180;
    const armLength = 22;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(yawAngle);

    // 1. Carbon-Fiber X-Frame Arms
    ctx.strokeStyle = '#1d2334';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-armLength, -armLength);
    ctx.lineTo(armLength, armLength);
    ctx.moveTo(-armLength, armLength);
    ctx.lineTo(armLength, -armLength);
    ctx.stroke();

    // Subtle cyan accent stripes along arms
    ctx.strokeStyle = 'rgba(75, 213, 238, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. 4 Spinning Brushless Rotors
    const rotorSpeed = time * 24;
    const rotorOffsets = [
      { rx: -armLength, ry: -armLength },
      { rx: armLength, ry: -armLength },
      { rx: -armLength, ry: armLength },
      { rx: armLength, ry: armLength }
    ];

    rotorOffsets.forEach((pos, idx) => {
      // Motor Bell
      ctx.beginPath();
      ctx.arc(pos.rx, pos.ry, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0d16';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Spinning Propeller Disc (Translucent Blur)
      ctx.beginPath();
      ctx.arc(pos.rx, pos.ry, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 3. Central Drone Avionics Pod
    ctx.beginPath();
    ctx.roundRect(-10, -12, 20, 24, 5);
    ctx.fillStyle = '#111522';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. Rotating LiDAR Optical Sensor Puck
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Laser diode emitter dot
    const puckEmitterAngle = state.scanAngle - yawAngle;
    ctx.beginPath();
    ctx.arc(Math.cos(puckEmitterAngle) * 5, Math.sin(puckEmitterAngle) * 5, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 5. Blinking Flight Beacon LED (Green & Red Aviation Lights)
    const blink = Math.sin(time * 6) > 0;
    ctx.beginPath();
    ctx.arc(armLength, -armLength, 2, 0, Math.PI * 2);
    ctx.fillStyle = blink ? '#22c55e' : 'rgba(34, 197, 94, 0.2)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-armLength, -armLength, 2, 0, Math.PI * 2);
    ctx.fillStyle = blink ? '#ef4444' : 'rgba(239, 68, 68, 0.2)';
    ctx.fill();

    ctx.restore();
  }

})();
