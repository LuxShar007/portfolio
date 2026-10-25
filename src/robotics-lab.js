/* ==========================================================================
   SHARVIN MHATRE PORTFOLIO — ROBOTIC ARM KINEMATICS & ROTARY KNOB CONTROLLER
   Derived from User Component: 72-Tick Precision Rotary Knob Slider,
   SlidingNumber Slot-Odometer with Motion Blur, Inverse & Forward Kinematics.
   ========================================================================== */

(function () {
  'use strict';

  const TICK_COUNT = 72;

  // Joint definitions & operational limits
  const JOINTS = {
    shoulder: {
      name: 'Shoulder Pitch',
      unit: 'DEG (°)',
      min: 0,
      max: 180,
      defaultVal: 45,
      linkLength: 120, // pixels
      massKg: 2.4,
      linkName: 'L1 (Upper Arm)'
    },
    elbow: {
      name: 'Elbow Flexion',
      unit: 'DEG (°)',
      min: 0,
      max: 160,
      defaultVal: 60,
      linkLength: 100, // pixels
      massKg: 1.6,
      linkName: 'L2 (Forearm)'
    },
    wrist: {
      name: 'Wrist Angle',
      unit: 'DEG (°)',
      min: -90,
      max: 90,
      defaultVal: 0,
      linkLength: 45, // pixels
      massKg: 0.8,
      linkName: 'L3 (End-Effector)'
    },
    gripper: {
      name: 'Gripper Torque',
      unit: 'TORQUE (N·m)',
      min: 0,
      max: 100,
      defaultVal: 35,
      linkLength: 25,
      massKg: 0.4,
      linkName: 'Grip Actuator'
    }
  };

  // State of all joints
  const state = {
    activeJoint: 'shoulder',
    angles: {
      shoulder: 45,
      elbow: 60,
      wrist: 0,
      gripper: 35
    },
    isDragging: false,
    prevVal: 45,
    blur: 0,
    autoCycleInterval: null
  };

  document.addEventListener('DOMContentLoaded', initRoboticsLab);
  if (document.readyState !== 'loading') initRoboticsLab();

  function initRoboticsLab() {
    const knobEl = document.getElementById('robotics-knob');
    const canvas = document.getElementById('robot-arm-canvas');
    if (!knobEl || !canvas) return;

    // 1. Build 72-Tick SVG Ring
    buildTickRing();

    // 2. Initialize Knob Interaction
    initKnobDrag(knobEl);

    // 3. Initialize Joint Selector Pills
    initJointSelector();

    // 4. Initialize Preset Buttons & Auto Scan
    initPresets();

    // 5. Initialize Canvas & Arm Kinematics
    initArmCanvas(canvas);

    // Initial render
    updateKnobDisplay(state.angles[state.activeJoint]);
  }

  /**
   * Generates 72 tick marks around the perimeter (User Component logic)
   */
  function buildTickRing() {
    const svg = document.getElementById('knob-ticks-svg');
    if (!svg) return;
    svg.innerHTML = '';

    for (let i = 0; i < TICK_COUNT; i++) {
      const angle = (i * 360) / TICK_COUNT;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '50');
      line.setAttribute('y1', '4');
      line.setAttribute('x2', '50');
      line.setAttribute('y2', i % 6 === 0 ? '11' : '8'); // Major & minor ticks
      line.setAttribute('transform', `rotate(${angle} 50 50)`);
      line.setAttribute('stroke', i % 6 === 0 ? 'rgba(75, 213, 238, 0.85)' : 'rgba(255, 255, 255, 0.22)');
      line.setAttribute('stroke-width', i % 6 === 0 ? '1.1' : '0.65');
      line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
    }
  }

  /**
   * Pointer/Mouse Rotary Drag Handler (User Component math)
   */
  function initKnobDrag(knobEl) {
    function updateFromPointer(clientX, clientY) {
      const rect = knobEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let angle = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;

      // Snap to nearest of 72 ticks
      const tickAngle = 360 / TICK_COUNT;
      const snappedAngle = Math.round(angle / tickAngle) * tickAngle;

      const currentJoint = JOINTS[state.activeJoint];
      const percent = snappedAngle / 360;
      const newValue = Math.round(percent * (currentJoint.max - currentJoint.min) + currentJoint.min);

      setJointValue(state.activeJoint, newValue, true);
    }

    // Mouse handlers
    knobEl.addEventListener('mousedown', (e) => {
      state.isDragging = true;
      stopAutoCycle();
      updateFromPointer(e.clientX, e.clientY);

      const onMove = (ev) => {
        if (state.isDragging) {
          updateFromPointer(ev.clientX, ev.clientY);
        }
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

    // Touch handlers for mobile
    knobEl.addEventListener('touchstart', (e) => {
      if (!e.touches.length) return;
      state.isDragging = true;
      stopAutoCycle();
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

  function setJointValue(jointKey, val, playTickSound = false) {
    const config = JOINTS[jointKey];
    const clamped = Math.min(Math.max(val, config.min), config.max);

    if (clamped !== state.angles[jointKey]) {
      // Calculate motion blur based on speed
      const diff = Math.abs(clamped - state.angles[jointKey]);
      state.blur = state.isDragging ? Math.min(6, diff * 0.4) : 0;
      state.angles[jointKey] = clamped;

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

  /**
   * Updates Rotary Knob Arrow and SlidingNumber Counter
   */
  function updateKnobDisplay(val) {
    const config = JOINTS[state.activeJoint];
    const percent = (val - config.min) / (config.max - config.min);
    const angleDeg = percent * 360;

    // 1. Rotate Arrow
    const arrow = document.getElementById('knob-arrow');
    if (arrow) {
      arrow.style.transform = `rotate(${angleDeg}deg)`;
    }

    // 2. SlidingNumber Rolling Slot Odometer (User Component Logic)
    const numberContainer = document.getElementById('knob-sliding-number');
    if (numberContainer) {
      renderSlidingNumber(numberContainer, val);
    }

    // 3. Unit Label
    const unitLabel = document.getElementById('knob-unit-label');
    if (unitLabel) {
      unitLabel.textContent = config.unit;
    }

    updateBlur();
  }

  /**
   * Mechanical Slot-Digit Rolling Odometer
   */
  function renderSlidingNumber(container, value) {
    const str = Math.abs(value).toString().padStart(value < 0 ? 3 : 2, '0');
    const digits = str.split('');

    container.innerHTML = '';

    // If negative, prepend minus sign
    if (value < 0) {
      const minus = document.createElement('span');
      minus.className = 'slot-digit-minus';
      minus.textContent = '-';
      container.appendChild(minus);
    }

    digits.forEach((char) => {
      const digitVal = parseInt(char, 10);
      const digitCol = document.createElement('div');
      digitCol.className = 'slot-digit-col';

      // Reel of 0-9
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

  /**
   * Joint Selector Tabs
   */
  function initJointSelector() {
    const pills = document.querySelectorAll('.joint-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        stopAutoCycle();
        const jointKey = pill.getAttribute('data-joint');
        if (!jointKey || !JOINTS[jointKey]) return;

        pills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        state.activeJoint = jointKey;
        updateKnobDisplay(state.angles[jointKey]);
        updateTelemetry();

        if (window.AudioEngine && typeof window.AudioEngine.playClick === 'function') {
          window.AudioEngine.playClick();
        }
      });
    });
  }

  /**
   * Presets & Auto Kinematic Cycle
   */
  function initPresets() {
    const presetBtns = document.querySelectorAll('.knob-preset-btn');
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        stopAutoCycle();
        const angle = parseInt(btn.getAttribute('data-angle'), 10);
        if (!isNaN(angle)) {
          presetBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          animateJointTo(state.activeJoint, angle);
        }
      });
    });

    const autoBtn = document.getElementById('knob-auto-cycle-btn');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        if (state.autoCycleInterval) {
          stopAutoCycle();
        } else {
          startAutoCycle();
        }
      });
    }
  }

  function animateJointTo(jointKey, targetAngle) {
    const startAngle = state.angles[jointKey];
    const diff = targetAngle - startAngle;
    const duration = 280; // ms
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Spring cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(startAngle + diff * ease);

      setJointValue(jointKey, val, false);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function startAutoCycle() {
    const autoBtn = document.getElementById('knob-auto-cycle-btn');
    if (autoBtn) autoBtn.classList.add('active');
    const icon = document.getElementById('knob-cycle-icon');
    if (icon) icon.setAttribute('data-lucide', 'pause');
    if (window.lucide) window.lucide.createIcons();

    let t = 0;
    state.autoCycleInterval = setInterval(() => {
      t += 0.08;
      // Oscillate shoulder, elbow, and wrist smoothly
      const s = Math.round(90 + Math.sin(t) * 60);
      const e = Math.round(70 + Math.cos(t * 1.2) * 50);
      const w = Math.round(Math.sin(t * 0.8) * 45);

      state.angles.shoulder = s;
      state.angles.elbow = e;
      state.angles.wrist = w;

      updateKnobDisplay(state.angles[state.activeJoint]);
      updateTelemetry();
    }, 40);
  }

  function stopAutoCycle() {
    if (state.autoCycleInterval) {
      clearInterval(state.autoCycleInterval);
      state.autoCycleInterval = null;
    }
    const autoBtn = document.getElementById('knob-auto-cycle-btn');
    if (autoBtn) autoBtn.classList.remove('active');
    const icon = document.getElementById('knob-cycle-icon');
    if (icon) icon.setAttribute('data-lucide', 'play');
    if (window.lucide) window.lucide.createIcons();
  }

  /**
   * Real-time Physics & Forward Kinematics (FK) Telemetry Calculations
   */
  function updateTelemetry() {
    const radShoulder = (state.angles.shoulder * Math.PI) / 180;
    const radElbow = ((state.angles.shoulder + state.angles.elbow) * Math.PI) / 180;
    const radWrist = ((state.angles.shoulder + state.angles.elbow + state.angles.wrist) * Math.PI) / 180;

    // Forward Kinematics (X, Y in millimeters)
    const L1 = 180; // mm
    const L2 = 140; // mm
    const L3 = 60;  // mm
    const endX = Math.round(L1 * Math.cos(radShoulder) + L2 * Math.cos(radElbow) + L3 * Math.cos(radWrist));
    const endY = Math.round(L1 * Math.sin(radShoulder) + L2 * Math.sin(radElbow) + L3 * Math.sin(radWrist));

    // Torque calculation: tau = m * g * L * sin(theta)
    const massTotal = JOINTS.shoulder.massKg + JOINTS.elbow.massKg;
    const holdingTorque = Math.abs((massTotal * 9.81 * 0.28 * Math.sin(radShoulder))).toFixed(2);

    // Motor current under FOC: I = tau / Kt (Kt = 0.82 N*m/A)
    const motorCurrent = (holdingTorque / 0.82 + 0.35).toFixed(2);

    // Update Telemetry Badges
    const statAngle = document.getElementById('stat-angle');
    const statTorque = document.getElementById('stat-torque');
    const statPid = document.getElementById('stat-pid');
    const statCurrent = document.getElementById('stat-current');
    const coordsBadge = document.getElementById('robot-coords-badge');

    if (statAngle) statAngle.textContent = `${state.angles[state.activeJoint]}.0°`;
    if (statTorque) statTorque.textContent = `${holdingTorque} N·m`;
    if (statPid) statPid.textContent = `12.4 ms (0.01° err)`;
    if (statCurrent) statCurrent.textContent = `${motorCurrent} A (24V FOC)`;
    if (coordsBadge) coordsBadge.textContent = `END-EFFECTOR: X: ${endX}mm | Y: ${endY}mm`;
  }

  /**
   * Interactive Robotic Arm 2D Canvas Renderer (Forward Kinematics 240Hz Loop)
   */
  function initArmCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    let W = canvas.width;
    let H = canvas.height;

    function renderArm() {
      ctx.clearRect(0, 0, W, H);

      // Base Pivot Point (grounded at bottom-left/center)
      const baseX = W * 0.26;
      const baseY = H * 0.78;

      // Draw Grid Backdrop
      drawGrid(ctx, W, H);

      // Draw Base Pedestal
      ctx.save();
      ctx.fillStyle = '#1c1f2e';
      ctx.strokeStyle = 'rgba(75, 213, 238, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(baseX - 45, baseY, 90, 24, 6);
      ctx.fill();
      ctx.stroke();

      // Base Turntable Joint
      ctx.beginPath();
      ctx.arc(baseX, baseY, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#0f121d';
      ctx.fill();
      ctx.strokeStyle = 'var(--accent-cyan)';
      ctx.stroke();
      ctx.restore();

      // Kinematics Link Lengths (visual scale)
      const l1 = JOINTS.shoulder.linkLength;
      const l2 = JOINTS.elbow.linkLength;
      const l3 = JOINTS.wrist.linkLength;

      // Angles in radians (0 deg = pointing straight up)
      const theta1 = (-(state.angles.shoulder) * Math.PI) / 180 + Math.PI / 2;
      const theta2 = (-(state.angles.elbow) * Math.PI) / 180;
      const theta3 = (-(state.angles.wrist) * Math.PI) / 180;

      // Joint 1: Elbow position
      const elbowX = baseX + l1 * Math.cos(theta1);
      const elbowY = baseY - l1 * Math.sin(theta1);

      // Joint 2: Wrist position
      const wristX = elbowX + l2 * Math.cos(theta1 + theta2);
      const wristY = elbowY - l2 * Math.sin(theta1 + theta2);

      // End-Effector: Gripper tip
      const tipX = wristX + l3 * Math.cos(theta1 + theta2 + theta3);
      const tipY = wristY - l3 * Math.sin(theta1 + theta2 + theta3);

      // --- Draw Reach Workspace Ghost Arc ---
      ctx.save();
      ctx.beginPath();
      ctx.arc(baseX, baseY, l1 + l2, -Math.PI * 0.85, 0.1);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // --- Draw Link 1: Upper Arm ---
      drawBone(ctx, baseX, baseY, elbowX, elbowY, 14, '#171b29', 'rgba(75, 213, 238, 0.8)');

      // Joint 1 Pivot Casing
      drawJointNode(ctx, baseX, baseY, 12, state.activeJoint === 'shoulder');

      // --- Draw Link 2: Forearm ---
      drawBone(ctx, elbowX, elbowY, wristX, wristY, 11, '#1b2033', 'rgba(168, 85, 247, 0.8)');

      // Joint 2 Pivot Casing
      drawJointNode(ctx, elbowX, elbowY, 10, state.activeJoint === 'elbow');

      // --- Draw Link 3: Wrist & Gripper ---
      drawBone(ctx, wristX, wristY, tipX, tipY, 7, '#131622', 'rgba(236, 72, 153, 0.8)');

      // Joint 3 Pivot Casing
      drawJointNode(ctx, wristX, wristY, 7, state.activeJoint === 'wrist');

      // Draw Two-Finger Gripper
      drawGripper(ctx, tipX, tipY, theta1 + theta2 + theta3, state.angles.gripper);

      requestAnimationFrame(renderArm);
    }

    renderArm();
  }

  function drawGrid(ctx, W, H) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const step = 28;
    for (let x = 0; x < W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBone(ctx, x1, y1, x2, y2, thickness, fillColor, strokeColor) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Internal Carbon-Fiber Accent Stripe
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawJointNode(ctx, x, y, radius, isActive) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#00e5ff' : '#0e111b';
    ctx.fill();
    ctx.lineWidth = isActive ? 3 : 2;
    ctx.strokeStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
    if (isActive) {
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 14;
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawGripper(ctx, x, y, angle, gripTorque) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const gripSpread = 16 - (gripTorque / 100) * 10; // closes under torque

    ctx.strokeStyle = 'var(--accent-cyan)';
    ctx.fillStyle = '#1c2237';
    ctx.lineWidth = 2.5;

    // Finger 1 (top)
    ctx.beginPath();
    ctx.moveTo(0, -gripSpread);
    ctx.lineTo(16, -gripSpread);
    ctx.lineTo(20, -gripSpread + 5);
    ctx.stroke();

    // Finger 2 (bottom)
    ctx.beginPath();
    ctx.moveTo(0, gripSpread);
    ctx.lineTo(16, gripSpread);
    ctx.lineTo(20, gripSpread - 5);
    ctx.stroke();

    ctx.restore();
  }

})();
