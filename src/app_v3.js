/* ==========================================================================
   SHARVIN MHATRE PORTFOLIO LOGIC & INTERACTION ENGINE
   ========================================================================== */

function initAppV3() {
  // Global search / console inputs declared at the top to prevent TDZ errors
  const consoleInput = document.getElementById('liquid-console-input');
  const consoleBtn   = document.getElementById('liquid-console-btn');
  const consoleOut   = document.getElementById('liquid-console-output');

  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // State Management
  const state = {
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
    system: { testsCount: 150, uptime: 0 },
    terminal: {
      step: 'idle', // 'idle', 'name', 'email', 'message', 'submitting', 'hack'
      data: { name: '', email: '', message: '' },
      hackGame: {
        words: ['PROJECT', 'ROBOTIC', 'SIESGST', 'SWARMDB', 'CONSOLE', 'REACTOR', 'AIRFORC', 'ACADEMY'],
        secret: '',
        attempts: 4
      }
    }
  };

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg")) return "Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Edg")) return "Edge";
    return "WebBrowser";
  };

  const getNeofetchHTML = () => {
    const uptimeSeconds = Math.floor(performance.now() / 1000);
    const mins = Math.floor(uptimeSeconds / 60);
    const secs = uptimeSeconds % 60;
    const uptimeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    const browserName = getBrowserName();
    const resolution = `${window.innerWidth}x${window.innerHeight}`;

    return `
<div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; margin-top: 10px; margin-bottom: 10px; line-height: 1.4;">
  <pre style="color: var(--accent-cyan); font-size: 11px; line-height: 1.1; margin: 0; font-family: 'JetBrains Mono', monospace;">
     /\\
    /  \\
   /\\  /\\
  /  \\/  \\
 /   /\\   \\
 \\  /  \\  /
  \\/    \\/
   \\    /
    \\  /
     \\/
  </pre>
  <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.5; color: rgba(255, 255, 255, 0.85); text-align: left;">
    <span class="text-green" style="font-weight: bold; color: #10b981;">sharvin@axiom-node</span><br>
    <span style="color: rgba(255, 255, 255, 0.4);">-------------------</span><br>
    <span style="color: #8b5cf6;">OS:</span> AxiomOS v2.6.7 (Virtual)<br>
    <span style="color: #8b5cf6;">Host:</span> SIES GST Dev Station<br>
    <span style="color: #8b5cf6;">Kernel:</span> WebEngine v3.5<br>
    <span style="color: #8b5cf6;">Uptime:</span> ${uptimeStr}<br>
    <span style="color: #8b5cf6;">Shell:</span> bash-portfolio v2.6.7<br>
    <span style="color: #8b5cf6;">Browser:</span> ${browserName}<br>
    <span style="color: #8b5cf6;">Resolution:</span> ${resolution}<br>
    <span style="color: #8b5cf6;">CPU:</span> Gemini 3.5 Flash DevEngine<br>
    <span style="color: #8b5cf6;">Memory:</span> 512MB / 16GB (Simulated)<br>
    <br>
    <span style="background: #10b981; color: #10b981; padding: 0 6px; margin-right: 4px;">██</span>
    <span style="background: #06b6d4; color: #06b6d4; padding: 0 6px; margin-right: 4px;">██</span>
    <span style="background: #8b5cf6; color: #8b5cf6; padding: 0 6px; margin-right: 4px;">██</span>
    <span style="background: #ec4899; color: #ec4899; padding: 0 6px; margin-right: 4px;">██</span>
    <span style="background: #f59e0b; color: #f59e0b; padding: 0 6px;">██</span>
  </div>
</div>`;
  };

  // ==========================================================================
  // CUSTOM MAGNETIC CURSOR (Optimized with translate3d)
  // ==========================================================================
  const cursor = document.getElementById('custom-cursor');
  const cursorDot = document.getElementById('custom-cursor-dot');
  
  if (cursor && cursorDot && !window.matchMedia('(pointer: coarse)').matches) {
    window.addEventListener('mousemove', (e) => {
      state.mouse.targetX = e.clientX;
      state.mouse.targetY = e.clientY;
    }, { passive: true });

    const renderCursor = () => {
      state.mouse.x += (state.mouse.targetX - state.mouse.x) * 0.16;
      state.mouse.y += (state.mouse.targetY - state.mouse.y) * 0.16;
      
      cursorDot.style.transform = `translate3d(${state.mouse.targetX}px, ${state.mouse.targetY}px, 0) translate(-50%, -50%)`;
      cursor.style.transform = `translate3d(${state.mouse.x}px, ${state.mouse.y}px, 0) translate(-50%, -50%)`;
      
      requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);

    const interactiveElements = document.querySelectorAll('a, button, .timeline-content, input, textarea');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('cursor-hovering');
        cursorDot.classList.add('cursor-hovering-dot');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('cursor-hovering');
        cursorDot.classList.remove('cursor-hovering-dot');
      });
    });
  }

  // ==========================================================================
  // BOOT SEQUENCE (PRELOADER)
  // ==========================================================================
  const preloader = document.getElementById('preloader');
  const preloaderLogs = document.getElementById('preloader-logs');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');

  const bootLogs = [
    { text: 'SYSTEM_BOOT: Initiating portfolio bootstrap loader...', type: 'info' },
    { text: 'CPU: Mapping ARM Cortex-M architecture parameters...', type: 'info' },
    { text: 'ESP32: Bootloader detected on COM05 (baud rate: 115200)...', type: 'info' },
    { text: 'IOT: Link verified with Firebase IoT real-time socket.', type: 'success' },
    { text: 'SENSORS: PIR, Ultrasonic, Flame, and IR calibrations... OK', type: 'success' },
    { text: 'ISOLATION: Dual-ground galvanic loops stability: OPTIMAL', type: 'info' },
    { text: 'COMPUTE: Initializing API frameworks (Spotify, YouTube Music)...', type: 'info' },
    { text: 'COMPUTE: Checking Nvidia CUDA Toolkit runtime environment...', type: 'info' },
    { text: 'AI_STUDIO: Linked Gemini AI node and token authorization parameters.', type: 'success' },
    { text: 'SYS_ONLINE: Boot sequence completed in 1.48s. Welcome, Sharvin.', type: 'success' }
  ];

  if (preloader && preloaderLogs && progressBar && progressPercent) {
    let currentLogIndex = 0;
    let progress = 0;
    
    // Disable scrolling on boot
    document.body.style.overflow = 'hidden';

    const logInterval = setInterval(() => {
      if (currentLogIndex < bootLogs.length) {
        const log = bootLogs[currentLogIndex];
        const logParagraph = document.createElement('p');
        
        if (log.type === 'success') {
          logParagraph.innerHTML = `<span class="log-green">[ OK ]</span> ${log.text}`;
        } else {
          logParagraph.innerHTML = `<span class="log-cyan">[ INFO ]</span> ${log.text}`;
        }
        
        preloaderLogs.appendChild(logParagraph);
        preloaderLogs.scrollTop = preloaderLogs.scrollHeight;
        
        currentLogIndex++;
      }
    }, 110);

    const progressInterval = setInterval(() => {
      if (progress < 100) {
        progress += Math.floor(Math.random() * 8) + 2;
        if (progress > 100) progress = 100;
        
        progressBar.style.width = `${progress}%`;
        progressPercent.textContent = `${String(progress).padStart(2, '0')}%`;
      } else {
        clearInterval(progressInterval);
        clearInterval(logInterval);
        
        // Wait briefly after completion then fade out preloader
        setTimeout(() => {
          preloader.classList.add('fade-out');
          document.body.style.overflow = '';
          
          // Trigger entry animations for hero
          const animElements = document.querySelectorAll('.hero-section .animate-fade, .hero-section .animate-title');
          animElements.forEach(el => el.classList.add('in-view'));
        }, 500);
      }
    }, 90);
  } else {
    // For pages without preloader, ensure body overflow is active and trigger immediate viewports
    document.body.style.overflow = '';
    setTimeout(() => {
      const headerAnims = document.querySelectorAll('.animate-title, .animate-fade');
      headerAnims.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('in-view');
        }
      });
    }, 150);
  }

  // ==========================================================================
  // MULTI-MODE INTERACTIVE BACKDROP CANVAS (Swarm / Matrix Rain / Warp)
  // ==========================================================================
  const canvas = document.getElementById('swarm-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, t = 0;
    let mx = -1, my = -1;
    let smoothMx = -1, smoothMy = -1;

    let backdropMode = localStorage.getItem('axiom_canvas_mode') || 'swarm';
    window.setBackdropMode = (mode) => {
      backdropMode = mode;
      localStorage.setItem('axiom_canvas_mode', mode);
    };

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    document.addEventListener('mouseleave', () => { mx = -1; my = -1; });

    // Matrix Rain Data
    const matrixChars = '01010101ABCDEFGHIJKLMNOPQRSTUVWXYZαβγδεζηθλμνξπρστυφχψω∑∏∫√';
    let matrixColumns = [];
    const fontSize = 14;

    // Warp Starfield Data
    let stars = [];
    const NUM_STARS = 400;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      if (smoothMx < 0) { smoothMx = W / 2; smoothMy = H / 2; }

      // Reset Matrix columns
      const cols = Math.floor(W / fontSize);
      matrixColumns = [];
      for (let i = 0; i < cols; i++) {
        matrixColumns.push(Math.floor(Math.random() * -100));
      }

      // Reset Warp stars
      stars = [];
      for (let i = 0; i < NUM_STARS; i++) {
        stars.push({
          x: (Math.random() - 0.5) * W,
          y: (Math.random() - 0.5) * H,
          z: Math.random() * W
        });
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const NUM_WAVES = 12;

    const animate = () => {
      t += 0.0045;

      const targetMx = mx > 0 ? mx : W / 2;
      const targetMy = my > 0 ? my : H / 2;
      smoothMx += (targetMx - smoothMx) * 0.035;
      smoothMy += (targetMy - smoothMy) * 0.035;

      if (backdropMode === 'matrix') {
        // --- CYBER MATRIX RAIN MODE ---
        ctx.fillStyle = 'rgba(4, 6, 13, 0.18)';
        ctx.fillRect(0, 0, W, H);

        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        for (let i = 0; i < matrixColumns.length; i++) {
          const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          const x = i * fontSize;
          const y = matrixColumns[i] * fontSize;

          const isHead = Math.random() > 0.85;
          ctx.fillStyle = isHead ? '#ffffff' : (i % 3 === 0 ? '#06b6d4' : '#10b981');
          ctx.fillText(char, x, y);

          if (y > H && Math.random() > 0.975) {
            matrixColumns[i] = 0;
          }
          matrixColumns[i]++;
        }

      } else if (backdropMode === 'warp') {
        // --- HYPERSPACE WARP STARFIELD MODE ---
        ctx.fillStyle = '#04060d';
        ctx.fillRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2;

        for (let i = 0; i < stars.length; i++) {
          const star = stars[i];
          star.z -= 12;
          if (star.z <= 0) star.z = W;

          const k = 256 / star.z;
          const px = star.x * k + cx;
          const py = star.y * k + cy;

          if (px >= 0 && px <= W && py >= 0 && py <= H) {
            const size = (1 - star.z / W) * 3;
            const opacity = (1 - star.z / W);
            ctx.fillStyle = i % 2 === 0 ? `rgba(6, 182, 212, ${opacity})` : `rgba(236, 72, 153, ${opacity})`;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

      } else {
        // --- DEFAULT QUANTUM SWARM LIQUID WAVES ---
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);

        ctx.lineWidth = 1.6;
        for (let i = 0; i < NUM_WAVES; i++) {
          ctx.beginPath();
          const baseY = (i / (NUM_WAVES - 1)) * (H + 120) - 60;

          for (let x = -50; x <= W + 50; x += 50) {
            const angle = x * 0.0015 + t * 0.35 + i * 0.12;
            let y = baseY 
              + Math.sin(angle) * 65 
              + Math.cos(x * 0.003 - t * 0.2 + i * 0.08) * 30;

            const dx = x - smoothMx;
            const dy = y - smoothMy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 260) {
              const force = (1.0 - dist / 260) * 38;
              y += (dy / (dist + 1)) * force;
            }

            x === -50 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }

          const progress = i / (NUM_WAVES - 1);
          let r, g, b;
          if (progress < 0.5) {
            const factor = progress * 2;
            r = Math.round(6 + (139 - 6) * factor);
            g = Math.round(182 + (92 - 182) * factor);
            b = Math.round(212 + (246 - 212) * factor);
          } else {
            const factor = (progress - 0.5) * 2;
            r = Math.round(139 + (236 - 139) * factor);
            g = Math.round(92 + (72 - 92) * factor);
            b = Math.round(246 + (153 - 246) * factor);
          }

          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.32)`;
          ctx.stroke();
        }

        if (mx > 0 && my > 0) {
          const radGrad = ctx.createRadialGradient(smoothMx, smoothMy, 0, smoothMx, smoothMy, 380);
          radGrad.addColorStop(0, 'rgba(6, 182, 212, 0.03)');
          radGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.01)');
          radGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = radGrad;
          ctx.fillRect(0, 0, W, H);
        }
      }

      requestAnimationFrame(animate);
    };
    animate();
  }

  // ==========================================================================
  // CAPABILITY CARD HOVER SPOTLIGHT (Glow tilt)
  // ==========================================================================
  const capCards = document.querySelectorAll('.capability-card');
  if (!window.matchMedia('(pointer: coarse)').matches) {
    capCards.forEach(card => {
      let cachedRect = null;
      let ticking = false;
      let x = 0;
      let y = 0;

      card.addEventListener('mouseenter', () => {
        cachedRect = card.getBoundingClientRect();
      });

      card.addEventListener('mousemove', (e) => {
        if (!cachedRect) cachedRect = card.getBoundingClientRect();
        x = e.clientX - cachedRect.left;
        y = e.clientY - cachedRect.top;

        if (!ticking) {
          requestAnimationFrame(() => {
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        cachedRect = null;
      });
    });
  }

  // ==========================================================================
  // INTERACTIVE BASH TERMINAL (CONTACT FORM)
  // ==========================================================================
  const terminalWindow = document.querySelector('.terminal-container');
  const terminalLogWrapper = document.querySelector('.terminal-window');
  const terminalOutput = document.getElementById('terminal-output-log');
  const terminalInputText = document.getElementById('terminal-current-line');
  const hiddenInput = document.getElementById('terminal-hidden-input');

  if (terminalWindow && terminalOutput && terminalInputText && hiddenInput) {
    // Focus hidden input on terminal click and toggle active borders without scrolling page
    terminalWindow.addEventListener('click', (e) => {
      hiddenInput.focus({ preventScroll: true });
      if (terminalLogWrapper) terminalLogWrapper.classList.add('focused');
    });

    hiddenInput.addEventListener('blur', () => {
      if (terminalLogWrapper) terminalLogWrapper.classList.remove('focused');
    });

    // Update screen text as user types without jumping or resetting scroll
    hiddenInput.addEventListener('input', (e) => {
      terminalInputText.textContent = e.target.value;
      const bodyContainer = terminalOutput.parentElement;
      if (bodyContainer) {
        bodyContainer.scrollTop = bodyContainer.scrollHeight;
      }
    });

    // Command submission
    hiddenInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const fullInput = hiddenInput.value.trim();
        const tokens = fullInput.split(' ');
        const command = tokens[0].toLowerCase();
        
        hiddenInput.value = '';
        terminalInputText.textContent = '';

        if (fullInput.length > 0) {
          appendLogLine(`<span class="prompt-prefix">sharvin@axiom-session:~$</span> ${fullInput}`);
          processTerminalCommand(command, tokens.slice(1).join(' '));
        } else {
          appendLogLine(`<span class="prompt-prefix">sharvin@axiom-session:~$</span>`);
        }
      }
    });

    const appendLogLine = (htmlContent) => {
      const p = document.createElement('p');
      p.innerHTML = htmlContent;
      // Insert before the input line
      const inputLine = terminalOutput.querySelector('.prompt-line');
      terminalOutput.insertBefore(p, inputLine);
      // Auto scroll to bottom
      const bodyContainer = terminalOutput.parentElement;
      bodyContainer.scrollTop = bodyContainer.scrollHeight;
    };

    // Auto-run commands based on URL search query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const launchParam = urlParams.get('launch');
    if (launchParam) {
      setTimeout(() => {
        if (launchParam === 'hack') {
          appendLogLine('<span class="prompt-prefix">sharvin@axiom-session:~$</span> hack');
          processTerminalCommand('hack');
        } else if (launchParam === 'neofetch') {
          appendLogLine('<span class="prompt-prefix">sharvin@axiom-session:~$</span> neofetch');
          processTerminalCommand('neofetch');
        }
      }, 500);
    }

    const processTerminalCommand = (cmd, arg) => {
      if (state.terminal.step === 'hack') {
        handleHackProcess(cmd + (arg ? ' ' + arg : ''));
        return;
      }
      if (state.terminal.step !== 'idle') {
        handleContactProcess(cmd + (arg ? ' ' + arg : ''));
        return;
      }

      switch (cmd) {
        case 'help':
          appendLogLine('<span class="text-violet">Console Commands:</span>');
          appendLogLine('  <span class="text-cyan">contact</span>    Initialize encrypted telemetry details form');
          appendLogLine('  <span class="text-cyan">about</span>      Show details on SIES GST and goals');
          appendLogLine('  <span class="text-cyan">clear</span>      Clear the current console logs');
          appendLogLine('  <span class="text-cyan">projects</span>   Show list of active embedded & software systems');
          appendLogLine('  <span class="text-cyan">neofetch</span>   Print system diagnostics and configurations');
          appendLogLine('  <span class="text-cyan">hack</span>       Initiate memory block decryption mini-game');
          break;
        
        case 'clear':
          terminalOutput.innerHTML = `
            <p>Welcome to Sharvin Mhatre Command Line Console [v2.6.7]</p>
            <p>Host location coordinates: Navi Mumbai / Panvel, Maharashtra, India.</p>
            <p class="text-green">Connection secured. Port forwarding enabled over TLS v1.3</p>
            <p class="help-text">Type 'help' to see console commands, or 'contact' to enter your transmission details.</p>
            <p class="prompt-line"><span class="prompt-prefix">sharvin@session:~$</span> <span id="terminal-current-line" class="terminal-input-active"></span><span class="cursor-blink">_</span></p>
          `;
          setTimeout(() => {
            const activeLine = document.getElementById('terminal-current-line');
            if (activeLine) activeLine.textContent = '';
          }, 0);
          break;

        case 'projects':
          appendLogLine('[LOG] Dynamic Repository List:');
          appendLogLine('  - <span class="text-cyan">Arduino Fighting Car</span>    (Flame firefighting logic, 150+ tests)');
          appendLogLine('  - <span class="text-cyan">Cubet Music API</span>        (Spotify/YouTube Music hosting platform)');
          break;


        case 'about':
          appendLogLine('[LOG] Student: Sharvin Sameer Mhatre');
          appendLogLine('[LOG] Institution: SIES GST (Navi Mumbai, India)');
          appendLogLine('[LOG] Tech Stack: C/C++, Embedded Sensors, Python, Full-Stack web JS');
          appendLogLine('[LOG] Long-Term Goals: Technical Branch (Indian Air Force) | Technical Entrepreneurship');
          break;

        case 'contact':
          state.terminal.step = 'name';
          appendLogLine('<span class="text-violet">[CONTACT PIPELINE SET]</span>');
          appendLogLine('<span class="text-cyan">Enter your NAME:</span>');
          break;

        case 'neofetch':
          appendLogLine(getNeofetchHTML());
          break;

        case 'hack':
          state.terminal.step = 'hack';
          const words = state.terminal.hackGame.words;
          state.terminal.hackGame.secret = words[Math.floor(Math.random() * words.length)];
          state.terminal.hackGame.attempts = 4;
          
          appendLogLine('<span class="text-violet">[AXIOM SECURITY PROTOCOL: ENGAGED]</span>');
          appendLogLine('<span class="text-cyan">ENTER PASSWORD DECRYPTION SEQUENCE</span>');
          appendLogLine('<span class="text-cyan">ATTEMPTS REMAINING: 4</span><br>');
          appendLogLine('<span class="text-green">CANDIDATE LOGICAL KEYS:</span>');
          words.forEach(w => {
            appendLogLine(`  · ${w}`);
          });
          appendLogLine('<br><span class="text-cyan">Enter candidate key to begin bypass (or type "exit" to abort):</span>');
          break;

        default:
          appendLogLine(`bash: command not found: ${cmd}. Type 'help' to show console actions.`);
          break;
      }
    };

    const handleHackProcess = (value) => {
      const val = value.trim().toUpperCase();
      if (!val) return;

      if (val === 'EXIT' || val === 'QUIT') {
        state.terminal.step = 'idle';
        appendLogLine('<span class="text-violet">[SYSTEM] Hacking session aborted.</span>');
        return;
      }

      const words = state.terminal.hackGame.words;
      if (!words.includes(val)) {
        appendLogLine(`<span class="text-red">ERROR: Invalid candidate key '${val}'.</span> Enter a candidate word or type 'exit' to abort.`);
        return;
      }

      const secret = state.terminal.hackGame.secret;
      if (val === secret) {
        appendLogLine('<span class="text-green">[SUCCESS] ACCESS GRANTED. DECRYPTION KEY MATCHED.</span>');
        appendLogLine('<span class="text-cyan">[PAYLOAD]: Welcome to AXIOM Core. Decrypted logs:</span>');
        appendLogLine('  - <span class="text-violet">Node coordinates:</span> LAT 19.0222° N | LON 73.0181° E (SIES GST)');
        appendLogLine('  - <span class="text-violet">Access Token:</span> SHARVIN_MHATRE_TERMINAL_BYPASS_2026');
        appendLogLine('<span class="text-green">[SYSTEM]: Connection restored. Hacking mode disengaged.</span>');
        state.terminal.step = 'idle';
      } else {
        state.terminal.hackGame.attempts--;
        if (state.terminal.hackGame.attempts <= 0) {
          appendLogLine('<span class="text-red">[LOCKOUT] INTRUSION COUNTERMEASURES ACTIVATED. SYSTEM LOCKED.</span>');
          appendLogLine('<span class="text-red">[SYSTEM]: Terminal locked out. Retry by running "hack" again.</span>');
          state.terminal.step = 'idle';
        } else {
          let likeness = 0;
          for (let i = 0; i < secret.length; i++) {
            if (val[i] === secret[i]) likeness++;
          }
          appendLogLine(`<span class="text-violet">ENTRY DENIED.</span> Likeness: ${likeness}/${secret.length}`);
          appendLogLine(`<span class="text-cyan">Attempts remaining: ${state.terminal.hackGame.attempts}</span>`);
        }
      }
    };

    const handleContactProcess = (value) => {
      if (!value) {
        appendLogLine('<span class="text-violet">Input cannot be blank. Retype:</span>');
        return;
      }

      switch (state.terminal.step) {
        case 'name':
          state.terminal.data.name = value;
          state.terminal.step = 'email';
          appendLogLine(`[LOG] Recorded Name: <span class="text-green">${value}</span>`);
          appendLogLine('<span class="text-cyan">Enter your EMAIL address:</span>');
          break;

        case 'email':
          if (!value.includes('@') || !value.includes('.')) {
            appendLogLine('<span class="text-violet">Format error. Re-enter valid email address:</span>');
            return;
          }
          state.terminal.data.email = value;
          state.terminal.step = 'message';
          appendLogLine(`[LOG] Recorded Email: <span class="text-green">${value}</span>`);
          appendLogLine('<span class="text-cyan">Enter your MESSAGE details:</span>');
          break;

        case 'message':
          state.terminal.data.message = value;
          state.terminal.step = 'submitting';
          appendLogLine(`[LOG] Log buffer allocated. Message length: ${value.length} characters.`);
          appendLogLine('<span class="text-violet">[INFO] ENCRYPTING TRANSMISSION PACKETS...</span>');
          
          setTimeout(() => {
            appendLogLine('<span class="text-violet">[INFO] ROUTING DATA LOGS TO SHARVIN...</span>');
            
            setTimeout(() => {
              appendLogLine('<span class="text-green">[SUCCESS] Telemetry message successfully synced!</span>');
              appendLogLine(`[LOG] Response: "Transmission acknowledged. Thank you, ${state.terminal.data.name}."`);
              
              state.terminal.step = 'idle';
              state.terminal.data = { name: '', email: '', message: '' };
            }, 1000);
          }, 800);
          break;
      }
    };
  }

  // ==========================================================================
  // METRIC TIMER HUD & UTC CLOCK
  // ==========================================================================
  const hudThreads = document.getElementById('hud-threads');
  setInterval(() => {
    if (hudThreads) {
      // Hardware tests fluctuate slightly showing active background logs
      const change = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      state.system.testsCount = Math.max(150, Math.min(165, state.system.testsCount + change));
      hudThreads.textContent = state.system.testsCount;
    }
  }, 2200);

  // Live UTC Clock in Footer
  const footerClock = document.getElementById('clock-metric');
  const updateClock = () => {
    if (footerClock) {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      footerClock.textContent = `${hours}:${minutes}:${seconds} UTC`;
    }
  };
  updateClock();
  setInterval(updateClock, 1000);

  // ==========================================================================
  // SCROLL-DRIVEN ANIMATIONS (INTERSECTION OBSERVER) & SCROLLSPY
  // ==========================================================================
  const animFades = document.querySelectorAll('.animate-fade');
  const animTitles = document.querySelectorAll('.animate-title');
  const animImages = document.querySelectorAll('.animate-image');
  const timelineItems = document.querySelectorAll('.timeline-item');
  const navElement = document.getElementById('main-nav');
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  // Nav height resize on scroll
  window.addEventListener('scroll', () => {
    if (navElement) {
      if (window.scrollY > 40) {
        navElement.classList.add('nav-scrolled');
      } else {
        navElement.classList.remove('nav-scrolled');
      }
    }
  });

  // Intersection Observer for entrance reveals
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target); // Reveal once
        }
      });
    }, observerOptions);

    animFades.forEach(el => revealObserver.observe(el));
    animTitles.forEach(el => revealObserver.observe(el));
    animImages.forEach(el => revealObserver.observe(el));
    timelineItems.forEach(el => revealObserver.observe(el));
  } else {
    const revealAll = [animFades, animTitles, animImages, timelineItems];
    revealAll.forEach(group => group.forEach(el => el.classList.add('in-view')));
  }

  // High-performance scroll-driven sync engine (Parallax scale/translate tracker)
  const scrollSyncElements = document.querySelectorAll('.animate-image, .capability-card, .timeline-content, .project-card, .glass-card, .terminal-container');
  let ticking = false;

  const updateScrollSync = () => {
    // Skip parallax on coarse pointers (mobile/tablet) to lock 60/120fps
    if (window.matchMedia('(pointer: coarse)').matches) {
      ticking = false;
      return;
    }

    const viewportHeight = window.innerHeight;
    const viewportCenter = viewportHeight / 2;

    // Phase 1: Batched Geometry Reads (No DOM writes)
    const updates = [];
    for (let i = 0; i < scrollSyncElements.length; i++) {
      const el = scrollSyncElements[i];
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportHeight && rect.bottom > 0) {
        const isRevealed = el.classList.contains('in-view') || el.classList.contains('revealed') || el.classList.contains('terminal-container') || el.classList.contains('glass-card');
        if (isRevealed) {
          const elementCenter = rect.top + rect.height / 2;
          const distanceFromCenter = elementCenter - viewportCenter;
          const ratio = Math.max(-1.0, Math.min(1.0, distanceFromCenter / (viewportHeight * 0.7)));
          const scale = 1.0 - Math.abs(ratio) * 0.035;
          const translateY = ratio * 16;
          updates.push({ el, translateY, scale });
        }
      }
    }

    // Phase 2: Batched Hardware-Accelerated Transforms (No DOM reads)
    for (let i = 0; i < updates.length; i++) {
      const u = updates[i];
      u.el.style.transform = `translate3d(0, ${u.translateY}px, 0) scale(${u.scale})`;
    }

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollSync);
      ticking = true;
    }
  });
  
  // Trigger initial placement
  setTimeout(() => {
    requestAnimationFrame(updateScrollSync);
  }, 200);

  // Mobile menu toggle
  const navToggle = document.getElementById('nav-toggle');
  const navLinksContainer = document.getElementById('nav-links');

  if (navToggle && navLinksContainer) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinksContainer.classList.toggle('active');
    });

    navLinksContainer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navLinksContainer.classList.remove('active');
      });
    });
  }

  // ==========================================================================
  // WEBGL LIQUID GLASS SHADER ENGINE (144Hz reactive fluid)
  // ==========================================================================
  const glassCanvas = document.getElementById('liquid-glass-canvas');
  if (glassCanvas) {
    const gl = glassCanvas.getContext('webgl') || glassCanvas.getContext('experimental-webgl');
    if (gl) {
      const vsSource = `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_hover;
        uniform float u_click;
        uniform float u_typing;

        float caustics(vec2 uv, float time, float hover, float typing) {
          vec2 p = uv * 6.0;
          float wave_speed = 1.0 + typing * 3.5;
          float t = time * wave_speed;
          
          float c = 0.0;
          c += sin(p.x + t) * 0.4;
          c += cos(p.y + t) * 0.4;
          c += sin(p.x - p.y + t * 0.7) * 0.3;
          c += cos(p.x + p.y * 1.5 - t * 0.5) * 0.3;
          
          vec2 warp = vec2(sin(p.x + c + t * 0.3), cos(p.y + c + t * 0.25)) * (0.12 + hover * 0.28);
          p += warp;
          
          c = sin(p.x + sin(p.y + t) + t * 0.2);
          c += cos(p.y + cos(p.x + t) + t * 0.15);
          
          return c * 0.5 + 0.5;
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          
          vec2 aspect_uv = uv;
          aspect_uv.x *= u_resolution.x / u_resolution.y;
          
          vec2 mouse_uv = u_mouse / u_resolution;
          mouse_uv.x *= u_resolution.x / u_resolution.y;
          
          float dist_to_mouse = distance(aspect_uv, mouse_uv);
          
          float ripple = sin(dist_to_mouse * 25.0 - u_time * 10.0) * exp(-dist_to_mouse * 5.0) * u_click;
          
          float mouse_warp = (1.0 - smoothstep(0.0, 0.4, dist_to_mouse)) * u_hover * 0.12;
          
          vec2 warped_uv = aspect_uv + ripple * (aspect_uv - mouse_uv) + mouse_warp * vec2(sin(u_time * 1.8), cos(u_time * 1.6));
          
          float light = caustics(warped_uv, u_time, u_hover, u_typing);
          
          vec3 cyan = vec3(0.024, 0.714, 0.831); // #06b6d4
          vec3 purple = vec3(0.659, 0.333, 0.969); // #a855f7
          vec3 magenta = vec3(0.925, 0.282, 0.599); // #ec4899
          vec3 bg = vec3(0.043, 0.059, 0.098); // #0B0F19 base
          
          vec3 color = bg;
          
          float c1 = pow(light, 2.2);
          float c2 = pow(1.0 - light, 1.8);
          
          color = mix(color, cyan, c1 * 0.55);
          color = mix(color, purple, c2 * 0.45);
          color = mix(color, magenta, (c1 * c2) * (0.75 + u_typing * 1.2));
          
          float glow = (1.0 - smoothstep(0.0, 0.25, dist_to_mouse)) * (0.12 + u_hover * 0.18 + u_click * 0.25);
          color += cyan * glow;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `;

      function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      }

      const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
      } else {
        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          -1, -1,  1, -1, -1,  1,
          -1,  1,  1, -1,  1,  1,
        ]), gl.STATIC_DRAW);

        const positionLoc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        const uTimeLoc = gl.getUniformLocation(program, 'u_time');
        const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
        const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
        const uHoverLoc = gl.getUniformLocation(program, 'u_hover');
        const uClickLoc = gl.getUniformLocation(program, 'u_click');
        const uTypingLoc = gl.getUniformLocation(program, 'u_typing');

        let targetHover = 0.0;
        let currentHover = 0.0;
        let targetClick = 0.0;
        let currentClick = 0.0;
        let targetTyping = 0.0;
        let currentTyping = 0.0;
        
        let mouseX = glassCanvas.clientWidth / 2;
        let mouseY = glassCanvas.clientHeight / 2;
        let targetMouseX = mouseX;
        let targetMouseY = mouseY;

        const resizeShaderCanvas = () => {
          const rect = glassCanvas.getBoundingClientRect();
          glassCanvas.width = rect.width;
          glassCanvas.height = rect.height;
          gl.viewport(0, 0, glassCanvas.width, glassCanvas.height);
        };
        resizeShaderCanvas();
        window.addEventListener('resize', resizeShaderCanvas);

        if (consoleInput) {
          const searchContainer = consoleInput.closest('.liquid-glass-container');
          if (searchContainer) {
            searchContainer.addEventListener('mousemove', (e) => {
              const rect = searchContainer.getBoundingClientRect();
              targetMouseX = (e.clientX - rect.left) * (glassCanvas.width / rect.width);
              targetMouseY = (rect.bottom - e.clientY) * (glassCanvas.height / rect.height);
            });

            searchContainer.addEventListener('mouseenter', () => { targetHover = 1.0; });
            searchContainer.addEventListener('mouseleave', () => { targetHover = 0.0; });
            consoleInput.addEventListener('focus', () => { targetHover = 1.25; });
            consoleInput.addEventListener('blur', () => { targetHover = 0.0; });
            consoleInput.addEventListener('click', () => { targetClick = 1.0; });
            
            consoleInput.addEventListener('input', () => {
              targetTyping = Math.min(1.0, targetTyping + 0.35);
            });
            consoleInput.addEventListener('keydown', () => {
              targetTyping = Math.min(1.0, targetTyping + 0.25);
            });
          }
        }

        let startTime = performance.now();
        const render = () => {
          const currentTime = (performance.now() - startTime) * 0.001;

          currentHover += (targetHover - currentHover) * 0.085;
          currentClick += (targetClick - currentClick) * 0.085;
          currentTyping += (targetTyping - currentTyping) * 0.05;
          
          targetClick *= 0.94;
          targetTyping *= 0.92;

          mouseX += (targetMouseX - mouseX) * 0.1;
          mouseY += (targetMouseY - mouseY) * 0.1;

          gl.uniform1f(uTimeLoc, currentTime);
          gl.uniform2f(uResolutionLoc, glassCanvas.width, glassCanvas.height);
          gl.uniform2f(uMouseLoc, mouseX, mouseY);
          gl.uniform1f(uHoverLoc, currentHover);
          gl.uniform1f(uClickLoc, currentClick);
          gl.uniform1f(uTypingLoc, currentTyping);

          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 6);

          requestAnimationFrame(render);
        };
        render();
      }
    }
  }

  // ==========================================================================
  // LIQUID GLASS COMMAND CONSOLE INTERACTION LOGIC
  // ==========================================================================

  if (consoleInput && consoleOut) {
    const handleCommand = () => {
      const cmd = consoleInput.value.trim().toLowerCase();
      if (!cmd) return;

      consoleInput.value = '';
      consoleOut.className = 'font-mono'; // reset output classes
      consoleOut.innerHTML = ''; // clear

      let outputText = '';
      let isSuccess = true;

      switch(cmd) {
        case '/help':
          outputText = 'AVAILABLE OPERATIONS:<br>' + 
                       ' · <span style="color:#06b6d4">/about</span> - Telemetry on Sharvin Sameer Mhatre<br>' +
                       ' · <span style="color:#06b6d4">/projects</span> - Pull list of verified live repositories<br>' +
                       ' · <span style="color:#06b6d4">/milestones</span> - List design & CTF contest archives<br>' +
                       ' · <span style="color:#06b6d4">/connect</span> - Launch connect interface<br>' +
                       ' · <span style="color:#06b6d4">/neofetch</span> - View system specifications<br>' +
                       ' · <span style="color:#06b6d4">/hack</span> - Launch decryption secure utility<br>' +
                       ' · <span style="color:#06b6d4">/clear</span> - Purge terminal output';
          break;
        case '/about':
          outputText = 'REDIRECTING TO INTRO BIO...';
          setTimeout(() => { window.location.href = 'about.html'; }, 1000);
          break;
        case '/projects':
          outputText = 'VERIFYING SWARMDB, MINDVANE, & ACCELERATORS... LOADING PROJECTS...';
          setTimeout(() => { window.location.href = 'projects.html'; }, 1000);
          break;
        case '/milestones':
          outputText = 'RETRIEVING PROMPT WARS & PIXELVERSE LOGS...';
          setTimeout(() => { window.location.href = 'milestones.html'; }, 1000);
          break;
        case '/connect':
          outputText = 'INITIALIZING ENCRYPTED TELEMETRY LINK...';
          setTimeout(() => { window.location.href = 'connect.html'; }, 1000);
          break;
        case '/neofetch':
          outputText = getNeofetchHTML();
          break;
        case '/hack':
          outputText = 'REDIRECTING TO SECURE DECRYPTION INTERFACE...';
          setTimeout(() => { window.location.href = 'connect.html?launch=hack'; }, 1000);
          break;
        case '/clear':
          outputText = '';
          break;
        default:
          outputText = `[ERROR]: Command '${cmd}' unrecognized. Type /help for available system operations.`;
          isSuccess = false;
      }

      // Print output with responsive typewriter logic
      if (outputText) {
        consoleOut.classList.add(isSuccess ? 'console-output-success' : 'console-output-error');
        consoleOut.innerHTML = outputText;
      }
    };

    consoleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCommand();
    });
    if (consoleBtn) {
      consoleBtn.addEventListener('click', handleCommand);
    }
  }
}

window.initAppV3 = initAppV3;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppV3);
} else {
  initAppV3();
}

