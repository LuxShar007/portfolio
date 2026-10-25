/* ==========================================================================
   SHARVIN MHATRE PORTFOLIO — INTERACTIVE LOGIC & CIRCUIT SANDBOX ENGINE
   Highlights Electronics & Computer Science dual engineering fundamentals.
   ========================================================================== */

(function () {
  'use strict';

  class CircuitSandbox {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;

      this.state = {
        inA: true,
        inB: false,
        clk: false,
        clockInterval: null,
        gateType: 'AND' // 'AND', 'XOR', 'NAND'
      };

      this.init();
    }

    init() {
      this.render();
      this.bindEvents();
      this.startClock();
    }

    render() {
      this.container.innerHTML = `
        <div class="circuit-sandbox-card glass-panel">
          <div class="circuit-card-header">
            <div class="circuit-title-group">
              <span class="circuit-badge font-mono"><i data-lucide="cpu"></i> HARDWARE INTERACTIVE SIMULATOR</span>
              <h3>Electronics & Logic Gate Engine</h3>
              <p class="text-muted">Live micro-controller logic simulation. Toggle inputs & gates to pulse digital signals.</p>
            </div>
            <div class="circuit-gate-selector font-mono">
              <button class="gate-btn ${this.state.gateType === 'AND' ? 'active' : ''}" data-gate="AND">AND</button>
              <button class="gate-btn ${this.state.gateType === 'XOR' ? 'active' : ''}" data-gate="XOR">XOR</button>
              <button class="gate-btn ${this.state.gateType === 'NAND' ? 'active' : ''}" data-gate="NAND">NAND</button>
            </div>
          </div>

          <div class="circuit-workbench">
            <!-- SVG Circuit Wiring -->
            <svg class="circuit-svg" viewBox="0 0 700 240" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="glow-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#06b6d4" stop-opacity="1" />
                  <stop offset="100%" stop-color="#a855f7" stop-opacity="1" />
                </linearGradient>
                <filter id="circuit-glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <!-- Wire IN_A -->
              <path id="wire-a" d="M 120 60 L 280 60 L 320 95" class="circuit-wire ${this.state.inA ? 'active' : ''}" />
              <!-- Wire IN_B -->
              <path id="wire-b" d="M 120 180 L 280 180 L 320 145" class="circuit-wire ${this.state.inB ? 'active' : ''}" />
              <!-- Wire CLK -->
              <path id="wire-clk" d="M 120 120 L 320 120" class="circuit-wire ${this.state.clk ? 'active-clk' : ''}" />
              <!-- Wire Gate Output -->
              <path id="wire-out" d="M 440 120 L 580 120" class="circuit-wire ${this.evaluateOutput() ? 'active-out' : ''}" />

              <!-- Signal Pulses (Animated Circles) -->
              <circle id="pulse-a" r="4" class="circuit-pulse ${this.state.inA ? 'pulsing' : ''}" />
              <circle id="pulse-b" r="4" class="circuit-pulse ${this.state.inB ? 'pulsing' : ''}" />
              <circle id="pulse-out" r="5" class="circuit-pulse ${this.evaluateOutput() ? 'pulsing-out' : ''}" />

              <!-- IC Logic Box -->
              <rect x="310" y="80" width="130" height="80" rx="10" class="circuit-ic-box" />
              <text x="375" y="118" class="circuit-ic-label font-mono">${this.state.gateType} GATE</text>
              <text x="375" y="136" class="circuit-ic-sub font-mono">STM32 MCU</text>
            </svg>

            <!-- Control Nodes Overlay -->
            <div class="circuit-nodes">
              <!-- Node IN_A -->
              <div class="circuit-node node-in-a" style="left: 30px; top: 40px;">
                <span class="node-label font-mono">INPUT_A: [${this.state.inA ? '1 (HIGH)' : '0 (LOW)'}]</span>
                <button class="node-toggle-btn ${this.state.inA ? 'on' : ''}" id="btn-toggle-a">
                  ${this.state.inA ? 'HIGH (+5V)' : 'LOW (GND)'}
                </button>
              </div>

              <!-- Node IN_B -->
              <div class="circuit-node node-in-b" style="left: 30px; top: 160px;">
                <span class="node-label font-mono">INPUT_B: [${this.state.inB ? '1 (HIGH)' : '0 (LOW)'}]</span>
                <button class="node-toggle-btn ${this.state.inB ? 'on' : ''}" id="btn-toggle-b">
                  ${this.state.inB ? 'HIGH (+5V)' : 'LOW (GND)'}
                </button>
              </div>

              <!-- Output LED Register -->
              <div class="circuit-node node-output" style="right: 30px; top: 90px;">
                <div class="led-indicator ${this.evaluateOutput() ? 'lit' : ''}" id="led-out"></div>
                <div class="out-telemetry font-mono">
                  <span class="out-status">${this.evaluateOutput() ? 'SIGNAL_ACTIVE (HIGH)' : 'SIGNAL_IDLE (LOW)'}</span>
                  <span class="out-app">TARGET: Motor Servo PWM / SwarmDB Ring</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Truth Table HUD -->
          <div class="circuit-truth-table font-mono">
            <div class="tt-col"><span>CLK_GEN:</span> <strong class="text-cyan">${this.state.clk ? 'TICK (1Hz)' : 'TOCK'}</strong></div>
            <div class="tt-col"><span>LOGIC_FORMULA:</span> <strong class="text-violet">OUT = A ${this.getGateSymbol()} B</strong></div>
            <div class="tt-col"><span>RESULT_VOLTAGE:</span> <strong class="${this.evaluateOutput() ? 'text-magenta' : 'text-muted'}">${this.evaluateOutput() ? '3.3V TTL' : '0.0V GND'}</strong></div>
          </div>
        </div>
      `;

      if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
      }
    }

    getGateSymbol() {
      if (this.state.gateType === 'AND') return '∧';
      if (this.state.gateType === 'XOR') return '⊕';
      return '⊼';
    }

    evaluateOutput() {
      if (this.state.gateType === 'AND') return this.state.inA && this.state.inB;
      if (this.state.gateType === 'XOR') return (this.state.inA || this.state.inB) && !(this.state.inA && this.state.inB);
      if (this.state.gateType === 'NAND') return !(this.state.inA && this.state.inB);
      return false;
    }

    startClock() {
      if (this.state.clockInterval) clearInterval(this.state.clockInterval);
      this.state.clockInterval = setInterval(() => {
        this.state.clk = !this.state.clk;
        const clkWire = this.container.querySelector('#wire-clk');
        if (clkWire) {
          if (this.state.clk) clkWire.classList.add('active-clk');
          else clkWire.classList.remove('active-clk');
        }
      }, 1000);
    }

    bindEvents() {
      this.container.addEventListener('click', (e) => {
        if (e.target.closest('#btn-toggle-a')) {
          this.state.inA = !this.state.inA;
          this.render();
          if (window.AudioEngine) window.AudioEngine.playClick();
        } else if (e.target.closest('#btn-toggle-b')) {
          this.state.inB = !this.state.inB;
          this.render();
          if (window.AudioEngine) window.AudioEngine.playClick();
        } else if (e.target.closest('.gate-btn')) {
          const btn = e.target.closest('.gate-btn');
          this.state.gateType = btn.getAttribute('data-gate');
          this.render();
          if (window.AudioEngine) window.AudioEngine.playClick();
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('circuit-sandbox-container')) {
      window.circuitSandbox = new CircuitSandbox('circuit-sandbox-container');
    }
  });
})();
