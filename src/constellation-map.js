/* ==========================================================================
   SHARVIN MHATRE PORTFOLIO — INTERACTIVE TECH CONSTELLATION ENGINE
   Visualizes skills, hardware protocols, and project nodes as an interactive
   glowing star map with real-time physics and vector connections.
   ========================================================================== */

(function () {
  'use strict';

  class TechConstellation {
    constructor(canvasId, containerId) {
      this.canvas = document.getElementById(canvasId);
      this.container = document.getElementById(containerId);
      if (!this.canvas || !this.container) return;

      this.ctx = this.canvas.getContext('2d');
      this.width = 0;
      this.height = 0;
      this.animId = null;
      this.mouse = { x: -1000, y: -1000, active: false };
      this.selectedNode = null;
      this.hoveredNode = null;

      // Defined Skill/Project Constellation Nodes
      this.nodesData = [
        { id: 'cpp', label: 'C / C++', category: 'Languages', level: 95, desc: 'Core low-level programming for microcontrollers, embedded firmware, memory management, and high-performance engines.', connections: ['stm32', 'swarmdb', 'cuda', 'ros2'] },
        { id: 'python', label: 'Python', category: 'Languages', level: 90, desc: 'Used for AI/ML modeling, script automation, data processing, and hardware testing suites.', connections: ['pytorch', 'cuda', 'ros2'] },
        { id: 'swarmdb', label: 'SwarmDB Engine', category: 'Projects', level: 98, desc: 'Distributed low-latency vector-clock database engine built for edge computing cluster consensus.', connections: ['cpp', 'python', 'cuda'] },
        { id: 'stm32', label: 'STM32 & Microcontrollers', category: 'Hardware', level: 88, desc: 'ARM Cortex-M architecture programming, registers configuration, SPI/I2C/UART bus communications.', connections: ['cpp', 'kicad', 'ltspice'] },
        { id: 'kicad', label: 'KiCad EDA & PCB', category: 'Hardware', level: 85, desc: 'Schematic design, multi-layer PCB layout routing, component footprints, and hardware power delivery.', connections: ['stm32', 'ltspice'] },
        { id: 'cuda', label: 'NVIDIA CUDA', category: 'Systems', level: 82, desc: 'Parallel GPU architecture acceleration, kernel optimization, memory hierarchy management.', connections: ['cpp', 'python', 'pytorch'] },
        { id: 'ros2', label: 'ROS 2 (Robot Operating System)', category: 'Robotics', level: 85, desc: 'Robotics nodes architecture, pub/sub messaging pipelines, sensor data telemetry integration.', connections: ['cpp', 'python', 'stm32'] },
        { id: 'pytorch', label: 'PyTorch & ML', category: 'AI & Data', level: 80, desc: 'Neural network training, computer vision pipelines, tensor compute operations.', connections: ['python', 'cuda'] },
        { id: 'ltspice', label: 'LTspice Simulation', category: 'Hardware', level: 84, desc: 'Analog signal analysis, operational amplifier filtering, transient voltage response modeling.', connections: ['kicad', 'stm32'] },
        { id: 'webtech', label: 'TypeScript / Modern Web', category: 'Languages', level: 92, desc: 'Vanilla JS/TS engines, WebGL shaders, Web Audio API, responsive liquid glass interfaces.', connections: ['swarmdb', 'cpp'] }
      ];

      this.nodes = [];

      this.init();
    }

    init() {
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.setupNodes();
      this.bindEvents();
      this.animate();
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      this.width = rect.width;
      this.height = Math.max(rect.height, 480);
      this.canvas.width = this.width * window.devicePixelRatio;
      this.canvas.height = this.height * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    setupNodes() {
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      const radius = Math.min(this.width, this.height) * 0.35;

      this.nodes = this.nodesData.map((d, index) => {
        const angle = (index / this.nodesData.length) * Math.PI * 2;
        const dist = radius * (0.6 + Math.random() * 0.5);
        return {
          ...d,
          x: centerX + Math.cos(angle) * dist,
          y: centerY + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          radius: 12 + (d.level / 100) * 8,
          pulse: Math.random() * Math.PI * 2
        };
      });
    }

    bindEvents() {
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.mouse.active = true;

        this.checkHover();
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.active = false;
        this.hoveredNode = null;
      });

      this.canvas.addEventListener('click', () => {
        if (this.hoveredNode) {
          this.selectedNode = this.hoveredNode;
          this.renderNodeDetails(this.selectedNode);
          if (window.AudioEngine) {
            window.AudioEngine.playActivate();
          }
        }
      });
    }

    checkHover() {
      let found = null;
      for (const node of this.nodes) {
        const dx = this.mouse.x - node.x;
        const dy = this.mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < node.radius + 10) {
          found = node;
          break;
        }
      }
      if (found !== this.hoveredNode) {
        this.hoveredNode = found;
        this.canvas.style.cursor = found ? 'pointer' : 'default';
        if (found && window.AudioEngine) {
          window.AudioEngine.playHover();
        }
      }
    }

    renderNodeDetails(node) {
      const detailsEl = document.getElementById('constellation-details');
      if (!detailsEl) return;

      const connLabels = node.connections
        .map(cid => {
          const match = this.nodes.find(n => n.id === cid);
          return match ? `<span class="const-tag font-mono">${match.label}</span>` : '';
        })
        .join(' ');

      detailsEl.innerHTML = `
        <div class="const-card glass-panel animate-fade">
          <div class="const-card-header">
            <span class="const-category font-mono text-cyan">${node.category.toUpperCase()} NODE</span>
            <span class="const-level font-mono">${node.level}% PROFICIENCY</span>
          </div>
          <h3 class="const-card-title">${node.label}</h3>
          <p class="const-card-desc">${node.desc}</p>
          <div class="const-connections">
            <span class="font-mono text-muted" style="font-size: 0.72rem;">VECTOR CONNECTIONS:</span>
            <div style="margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap;">
              ${connLabels}
            </div>
          </div>
        </div>
      `;
    }

    animate() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      // Update positions with soft physics & edge bouncing
      for (const node of this.nodes) {
        node.pulse += 0.03;

        node.x += node.vx;
        node.y += node.vy;

        const pad = 40;
        if (node.x < pad || node.x > this.width - pad) node.vx *= -1;
        if (node.y < pad || node.y > this.height - pad) node.vy *= -1;

        if (this.mouse.active) {
          const dx = node.x - this.mouse.x;
          const dy = node.y - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120 * 0.8;
            node.x += (dx / dist) * force;
            node.y += (dy / dist) * force;
          }
        }
      }

      // Draw Connection Lines
      for (let i = 0; i < this.nodes.length; i++) {
        const n1 = this.nodes[i];
        for (let j = i + 1; j < this.nodes.length; j++) {
          const n2 = this.nodes[j];
          const isConnected = n1.connections.includes(n2.id) || n2.connections.includes(n1.id);

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (isConnected || dist < 160) {
            const alpha = isConnected
              ? Math.max(0.2, 1 - dist / 350)
              : Math.max(0.05, 0.4 - dist / 200);

            const isHighlighted =
              (this.hoveredNode && (this.hoveredNode.id === n1.id || this.hoveredNode.id === n2.id)) ||
              (this.selectedNode && (this.selectedNode.id === n1.id || this.selectedNode.id === n2.id));

            this.ctx.beginPath();
            this.ctx.moveTo(n1.x, n1.y);
            this.ctx.lineTo(n2.x, n2.y);
            this.ctx.strokeStyle = isHighlighted
              ? `rgba(75, 213, 238, ${alpha * 1.5})`
              : `rgba(160, 120, 255, ${alpha * 0.5})`;
            this.ctx.lineWidth = isHighlighted ? 2 : 1;
            this.ctx.stroke();
          }
        }
      }

      // Draw Nodes
      for (const node of this.nodes) {
        const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;
        const isSelected = this.selectedNode && this.selectedNode.id === node.id;
        const pulseR = node.radius + Math.sin(node.pulse) * 3;

        const grad = this.ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, pulseR * 2.5
        );

        if (isHovered || isSelected) {
          grad.addColorStop(0, 'rgba(75, 213, 238, 0.8)');
          grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          grad.addColorStop(0, 'rgba(75, 213, 238, 0.4)');
          grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, pulseR * 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = grad;
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, isHovered ? node.radius * 1.2 : node.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = isHovered || isSelected ? '#ffffff' : '#4bd5ee';
        this.ctx.shadowColor = '#4bd5ee';
        this.ctx.shadowBlur = isHovered ? 15 : 8;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.font = `${isHovered ? '600' : '500'} 12px 'JetBrains Mono', monospace`;
        this.ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.label, node.x, node.y + node.radius + 18);
      }

      this.animId = requestAnimationFrame(() => this.animate());
    }
  }

  window.TechConstellation = TechConstellation;

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('constellation-canvas')) {
      new TechConstellation('constellation-canvas', 'constellation-container');
    }
  });
})();
