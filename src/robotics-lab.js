/* ==========================================================================
   SHARVIN MHATRE PORTFOLIO — 3D LIDAR POINT CLOUD SCANNER (BLACK & WHITE)
   Inspired by DIY 3D LiDAR (D800): Proper 3D perspective projection,
   dense laser point-cloud spatial scan, pure monochrome aesthetics,
   manipulated via precision 72-tick rotary encoder with SlidingNumber odometer.
   ========================================================================== */

(function () {
  'use strict';

  const TICK_COUNT = 72;

  // 3D LiDAR Modes
  const MODES = {
    yaw: {
      name: '3D Orbit Azimuth',
      unit: 'YAW (°)',
      min: 0,
      max: 360,
      defaultVal: 135,
      badge: '360° SPATIAL ROTATION'
    },
    pitch: {
      name: 'LiDAR Tilt / Pitch',
      unit: 'PITCH (°)',
      min: -45,
      max: 45,
      defaultVal: 18,
      badge: 'VERTICAL SCAN MIRROR'
    },
    density: {
      name: 'Point Cloud Density',
      unit: 'RETURNS (K)',
      min: 1,
      max: 20,
      defaultVal: 12,
      badge: 'LASER PULSE SAMPLES'
    },
    zoom: {
      name: 'LiDAR Sensor Range',
      unit: 'RANGE (m)',
      min: 5,
      max: 50,
      defaultVal: 24,
      badge: 'TIME-OF-FLIGHT DEPTH'
    }
  };

  const state = {
    activeMode: 'yaw',
    values: {
      yaw: 135,
      pitch: 18,
      density: 12,
      zoom: 24
    },
    isDraggingKnob: false,
    prevVal: 135,
    blur: 0,
    autoRotate: true,

    // 3D Camera & Orientation
    camYaw: (135 * Math.PI) / 180,
    camPitch: (18 * Math.PI) / 180,
    camDist: 340,
    isOrbitingCanvas: false,
    lastMouseX: 0,
    lastMouseY: 0,

    // 3D Laser Beam Sweep
    beamAngle: 0,
    sweepSpeed: 0.04,
    points: []
  };

  /**
   * Pre-generates realistic 3D Point Cloud geometry:
   * Ground plane grid, central autonomous drone, surrounding columns, walls, and obstacles.
   */
  function generate3DPointCloud() {
    const pts = [];

    // 1. 3D Ground Plane Grid (Z from -180 to 180, X from -180 to 180, Y = 70)
    for (let x = -180; x <= 180; x += 18) {
      for (let z = -180; z <= 180; z += 18) {
        pts.push({
          x: x + (Math.random() - 0.5) * 3,
          y: 70 + (Math.random() - 0.5) * 2,
          z: z + (Math.random() - 0.5) * 3,
          intensity: 0.4 + Math.random() * 0.35,
          hitTime: 0
        });
      }
    }

    // 2. Central Autonomous Drone & Scanner Pod at (0, -25, 0)
    // Chassis frame
    for (let t = 0; t <= Math.PI * 2; t += 0.25) {
      const rx = Math.cos(t) * 22;
      const rz = Math.sin(t) * 22;
      pts.push({ x: rx, y: -25, z: rz, intensity: 1.0, hitTime: 0 });
      pts.push({ x: rx * 0.6, y: -30, z: rz * 0.6, intensity: 1.0, hitTime: 0 });
    }
    // 4 Quadcopter Arms
    [-1, 1].forEach((sx) => {
      [-1, 1].forEach((sz) => {
        for (let d = 8; d <= 48; d += 6) {
          pts.push({ x: sx * d, y: -25, z: sz * d, intensity: 0.95, hitTime: 0 });
        }
        // Rotor rings
        for (let a = 0; a < Math.PI * 2; a += 0.45) {
          pts.push({
            x: sx * 48 + Math.cos(a) * 16,
            y: -25,
            z: sz * 48 + Math.sin(a) * 16,
            intensity: 0.85,
            hitTime: 0
          });
        }
      });
    });

    // 3. 3D Cylindrical Structural Columns / Pillars
    const columns = [
      { cx: -100, cz: -90, r: 24, h: 140 },
      { cx: 110, cz: -80, r: 20, h: 140 },
      { cx: -90, cz: 90, r: 18, h: 130 },
      { cx: 120, cz: 95, r: 26, h: 150 }
    ];

    columns.forEach((col) => {
      for (let y = 70; y >= 70 - col.h; y -= 8) {
        for (let a = 0; a < Math.PI * 2; a += 0.35) {
          pts.push({
            x: col.cx + Math.cos(a) * col.r + (Math.random() - 0.5) * 2,
            y: y + (Math.random() - 0.5) * 2,
            z: col.cz + Math.sin(a) * col.r + (Math.random() - 0.5) * 2,
            intensity: 0.55 + Math.random() * 0.4,
            hitTime: 0
          });
        }
      }
    });

    // 4. Perimeter Walls & Geometry Obstacles
    for (let x = -170; x <= 170; x += 10) {
      for (let y = 70; y >= -40; y -= 12) {
        // Back wall (z = -180)
        pts.push({ x: x, y: y, z: -180 + (Math.random() - 0.5) * 2, intensity: 0.45, hitTime: 0 });
        // Right wall (x = 180)
        pts.push({ x: 180 + (Math.random() - 0.5) * 2, y: y, z: x, intensity: 0.45, hitTime: 0 });
      }
    }

    // 5. Test Sphere / Calibration Target at (40, 10, -30)
    for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += 0.28) {
      for (let lon = 0; lon <= Math.PI * 2; lon += 0.38) {
        const sr = 22;
        pts.push({
          x: 40 + sr * Math.cos(lat) * Math.cos(lon),
          y: 10 + sr * Math.sin(lat),
          z: -30 + sr * Math.cos(lat) * Math.sin(lon),
          intensity: 0.9,
          hitTime: 0
        });
      }
    }

    state.points = pts;
  }

  document.addEventListener('DOMContentLoaded', init3DLidarLab);
  if (document.readyState !== 'loading') init3DLidarLab();

  function init3DLidarLab() {
    const knobEl = document.getElementById('robotics-knob');
    const canvas = document.getElementById('robot-arm-canvas');
    if (!knobEl || !canvas) return;

    // 1. Generate 3D Spatial Geometry
    generate3DPointCloud();

    // 2. Build 72-Tick SVG Ring
    buildTickRing();

    // 3. Rotary Knob Drag & Math
    initKnobDrag(knobEl);

    // 4. Mode Selector Pills
    initModeSelector();

    // 5. Quick Presets & Controls
    initPresets();

    // 6. 3D Canvas Orbit & Rendering Loop
    initCanvasOrbit(canvas);

    // Initial Knob UI
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
      line.setAttribute('stroke', isMajor ? '#ffffff' : 'rgba(255, 255, 255, 0.25)');
      line.setAttribute('stroke-width', isMajor ? '1.2' : '0.65');
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
      state.isDraggingKnob = true;
      state.autoRotate = false;
      updateAutoBtnState();
      updateFromPointer(e.clientX, e.clientY);

      const onMove = (ev) => {
        if (state.isDraggingKnob) updateFromPointer(ev.clientX, ev.clientY);
      };
      const onUp = () => {
        state.isDraggingKnob = false;
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
      state.isDraggingKnob = true;
      state.autoRotate = false;
      updateAutoBtnState();
      updateFromPointer(e.touches[0].clientX, e.touches[0].clientY);

      const onTouchMove = (ev) => {
        if (state.isDraggingKnob && ev.touches.length) {
          updateFromPointer(ev.touches[0].clientX, ev.touches[0].clientY);
        }
      };
      const onTouchEnd = () => {
        state.isDraggingKnob = false;
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
      state.blur = state.isDraggingKnob ? Math.min(6, diff * 0.4) : 0;
      state.values[modeKey] = clamped;

      // Update 3D Camera Angles
      if (modeKey === 'yaw') {
        state.camYaw = (clamped * Math.PI) / 180;
      } else if (modeKey === 'pitch') {
        state.camPitch = (clamped * Math.PI) / 180;
      } else if (modeKey === 'zoom') {
        state.camDist = 180 + (clamped / 50) * 320;
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

  function renderSlidingNumber(container, value) {
    const isNeg = value < 0;
    const str = Math.abs(value).toString().padStart(isNeg ? 3 : 2, '0');
    const digits = str.split('');

    container.innerHTML = '';
    if (isNeg) {
      const minus = document.createElement('span');
      minus.className = 'slot-digit-minus';
      minus.textContent = '-';
      container.appendChild(minus);
    }

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
        state.autoRotate = false;
        updateAutoBtnState();
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
        state.autoRotate = !state.autoRotate;
        updateAutoBtnState();
      });
    }
  }

  function updateAutoBtnState() {
    const autoBtn = document.getElementById('knob-auto-cycle-btn');
    if (!autoBtn) return;
    autoBtn.classList.toggle('active', state.autoRotate);
    const icon = document.getElementById('knob-cycle-icon');
    if (icon) icon.setAttribute('data-lucide', state.autoRotate ? 'pause' : 'play');
    if (window.lucide) window.lucide.createIcons();
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

    const totalPts = Math.min(state.points.length, state.values.density * 180);
    const rangeMeters = state.values.zoom;

    if (statAngle) statAngle.textContent = `${state.values.yaw}° AZIMUTH`;
    if (statTorque) statTorque.textContent = `${totalPts.toLocaleString()} CLOUD PTS`;
    if (statPid) statPid.textContent = `PITCH: ${state.values.pitch}° (3D TOF)`;
    if (statCurrent) statCurrent.textContent = `RANGE: ${rangeMeters}.0m FOV`;
    if (coordsBadge) coordsBadge.textContent = `3D LIDAR: ${totalPts.toLocaleString()} POINTS | SCANNER: 360° ACTIVE`;
  }

  /**
   * Interactive 3D Canvas Orbit Controls (Mouse Drag Directly on the 3D Canvas)
   */
  function initCanvasOrbit(canvas) {
    canvas.addEventListener('mousedown', (e) => {
      state.isOrbitingCanvas = true;
      state.autoRotate = false;
      updateAutoBtnState();
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.isOrbitingCanvas) return;
      const dx = e.clientX - state.lastMouseX;
      const dy = e.clientY - state.lastMouseY;
      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;

      state.camYaw += dx * 0.008;
      state.camPitch = Math.min(Math.max(state.camPitch - dy * 0.008, -Math.PI * 0.35), Math.PI * 0.35);

      // Sync knob if active mode is yaw
      const degYaw = Math.round(((state.camYaw % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI));
      state.values.yaw = degYaw;
      if (state.activeMode === 'yaw') {
        updateKnobDisplay(degYaw);
      }
      updateTelemetry();
    });

    window.addEventListener('mouseup', () => {
      state.isOrbitingCanvas = false;
    });

    // Touch support for 3D orbit
    canvas.addEventListener('touchstart', (e) => {
      if (!e.touches.length) return;
      state.isOrbitingCanvas = true;
      state.autoRotate = false;
      updateAutoBtnState();
      state.lastMouseX = e.touches[0].clientX;
      state.lastMouseY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!state.isOrbitingCanvas || !e.touches.length) return;
      const dx = e.touches[0].clientX - state.lastMouseX;
      const dy = e.touches[0].clientY - state.lastMouseY;
      state.lastMouseX = e.touches[0].clientX;
      state.lastMouseY = e.touches[0].clientY;

      state.camYaw += dx * 0.008;
      state.camPitch = Math.min(Math.max(state.camPitch - dy * 0.008, -Math.PI * 0.35), Math.PI * 0.35);

      const degYaw = Math.round(((state.camYaw % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI));
      state.values.yaw = degYaw;
      if (state.activeMode === 'yaw') updateKnobDisplay(degYaw);
      updateTelemetry();
    }, { passive: true });

    window.addEventListener('touchend', () => {
      state.isOrbitingCanvas = false;
    });

    // Mouse wheel zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      state.camDist = Math.min(Math.max(state.camDist + e.deltaY * 0.3, 160), 550);
    }, { passive: false });

    // Start 3D Rendering Loop
    start3DRenderLoop(canvas);
  }

  /**
   * 3D LiDAR Projection & Monochrome Rendering Loop (240Hz High Refresh)
   */
  function start3DRenderLoop(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const focalLength = 320;

    function render3D() {
      // 1. Auto rotation if enabled
      if (state.autoRotate && !state.isDraggingKnob && !state.isOrbitingCanvas) {
        state.camYaw += 0.006;
        const degYaw = Math.round(((state.camYaw % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI));
        state.values.yaw = degYaw;
        if (state.activeMode === 'yaw') {
          updateKnobDisplay(degYaw);
        }
      }

      // 2. Clear to Pure Pitch Black void
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);

      // 3. Update Rotating 3D Laser Beam Sweep
      state.beamAngle += state.sweepSpeed;
      if (state.beamAngle > Math.PI * 2) state.beamAngle -= Math.PI * 2;

      // Precompute camera trigonometry
      const cosYaw = Math.cos(state.camYaw);
      const sinYaw = Math.sin(state.camYaw);
      const cosPitch = Math.cos(state.camPitch);
      const sinPitch = Math.sin(state.camPitch);

      // 4. Project and Draw 3D Ground Grid (Pure Monochrome Lines)
      draw3DGrid(ctx, W, H, focalLength, cosYaw, sinYaw, cosPitch, sinPitch, state.camDist);

      // 5. Draw 3D LiDAR Laser Sweep Beam
      draw3DScanBeam(ctx, W, H, focalLength, cosYaw, sinYaw, cosPitch, sinPitch, state.camDist, state.beamAngle);

      // 6. Project & Draw Point Cloud
      const maxPts = Math.min(state.points.length, state.values.density * 180);
      draw3DPoints(ctx, W, H, focalLength, cosYaw, sinYaw, cosPitch, sinPitch, state.camDist, maxPts, state.beamAngle);

      // 7. Tactical Black & White HUD Overlay
      drawMonochromeHUD(ctx, W, H);

      requestAnimationFrame(render3D);
    }

    render3D();
  }

  /**
   * Projects a 3D point (x, y, z) into 2D screen coordinates (sx, sy, depth)
   */
  function project3D(x, y, z, W, H, focalLength, cosYaw, sinYaw, cosPitch, sinPitch, camDist) {
    // 1. Rotate around Y axis (Yaw)
    const x1 = x * cosYaw - z * sinYaw;
    const z1 = x * sinYaw + z * cosYaw;

    // 2. Rotate around X axis (Pitch)
    const y2 = y * cosPitch - z1 * sinPitch;
    const z2 = y * sinPitch + z1 * cosPitch + camDist;

    if (z2 <= 20) return null; // Behind camera plane

    // 3. Perspective projection
    const scale = focalLength / z2;
    const sx = W / 2 + x1 * scale;
    const sy = H / 2 + y2 * scale;

    return { sx, sy, scale, z: z2 };
  }

  function draw3DGrid(ctx, W, H, focal, cosY, sinY, cosP, sinP, dist) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.8;

    const step = 40;
    const limit = 160;
    const groundY = 70;

    // Grid lines along X
    for (let x = -limit; x <= limit; x += step) {
      const p1 = project3D(x, groundY, -limit, W, H, focal, cosY, sinY, cosP, sinP, dist);
      const p2 = project3D(x, groundY, limit, W, H, focal, cosY, sinY, cosP, sinP, dist);
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }
    }

    // Grid lines along Z
    for (let z = -limit; z <= limit; z += step) {
      const p1 = project3D(-limit, groundY, z, W, H, focal, cosY, sinY, cosP, sinP, dist);
      const p2 = project3D(limit, groundY, z, W, H, focal, cosY, sinY, cosP, sinP, dist);
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function draw3DScanBeam(ctx, W, H, focal, cosY, sinY, cosP, sinP, dist, beamAngle) {
    const origin = project3D(0, -25, 0, W, H, focal, cosY, sinY, cosP, sinP, dist);
    if (!origin) return;

    ctx.save();

    // Active 3D Laser Fan Plane
    const beamLen = 220;
    const beamEnd1 = project3D(
      Math.cos(beamAngle - 0.06) * beamLen,
      -25 + Math.sin(beamAngle * 2) * 15,
      Math.sin(beamAngle - 0.06) * beamLen,
      W, H, focal, cosY, sinY, cosP, sinP, dist
    );
    const beamEnd2 = project3D(
      Math.cos(beamAngle + 0.06) * beamLen,
      70,
      Math.sin(beamAngle + 0.06) * beamLen,
      W, H, focal, cosY, sinY, cosP, sinP, dist
    );

    if (beamEnd1 && beamEnd2) {
      // Laser triangle sweep fan (White luminescence)
      ctx.beginPath();
      ctx.moveTo(origin.sx, origin.sy);
      ctx.lineTo(beamEnd1.sx, beamEnd1.sy);
      ctx.lineTo(beamEnd2.sx, beamEnd2.sy);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();

      // Sharp central laser line
      ctx.beginPath();
      ctx.moveTo(origin.sx, origin.sy);
      ctx.lineTo((beamEnd1.sx + beamEnd2.sx) / 2, (beamEnd1.sy + beamEnd2.sy) / 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Central LiDAR Scanner Head Hub
    ctx.beginPath();
    ctx.arc(origin.sx, origin.sy, 4 * origin.scale, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.restore();
  }

  function draw3DPoints(ctx, W, H, focal, cosY, sinY, cosP, sinP, dist, maxPts, beamAngle) {
    ctx.save();

    for (let i = 0; i < maxPts; i++) {
      const pt = state.points[i];
      const p = project3D(pt.x, pt.y, pt.z, W, H, focal, cosY, sinY, cosP, sinP, dist);
      if (!p) continue;

      // Angular proximity to laser sweep for active scan flash
      const ptAngle = Math.atan2(pt.z, pt.x);
      const angleDiff = Math.abs(((beamAngle - ptAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (angleDiff < 0.12) {
        pt.hitTime = 1.0; // Flash bright white on laser contact
      } else {
        pt.hitTime = Math.max(0, pt.hitTime - 0.025);
      }

      // Depth Falloff: close = bright white (1.0), distant = muted gray (0.2)
      const depthRatio = Math.max(0, Math.min(1, 1 - (p.z - 120) / 480));
      const baseAlpha = (0.2 + depthRatio * 0.7) * pt.intensity;
      const hitBonus = pt.hitTime * 0.45;
      const alpha = Math.min(1.0, baseAlpha + hitBonus);

      // Point size based on perspective scale & laser hit
      const ptSize = Math.max(1.1, (1.2 + hitBonus * 1.5) * p.scale);

      // Render Crisp Black & White Point
      ctx.fillStyle = pt.hitTime > 0.5 ? '#ffffff' : `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(p.sx - ptSize / 2, p.sy - ptSize / 2, ptSize, ptSize);

      // Soft white halo for actively illuminated points
      if (pt.hitTime > 0.6) {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, ptSize * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${pt.hitTime * 0.35})`;
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawMonochromeHUD(ctx, W, H) {
    ctx.save();
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';

    // Coordinate axis indicator (Bottom Left)
    const axX = 36;
    const axY = H - 36;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;

    // X axis
    ctx.beginPath(); ctx.moveTo(axX, axY); ctx.lineTo(axX + 22, axY); ctx.stroke();
    ctx.fillText('X', axX + 26, axY + 3);

    // Y axis
    ctx.beginPath(); ctx.moveTo(axX, axY); ctx.lineTo(axX, axY - 22); ctx.stroke();
    ctx.fillText('Z', axX - 4, axY - 26);

    ctx.restore();
  }

})();
