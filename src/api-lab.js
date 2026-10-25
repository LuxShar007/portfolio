/* ==========================================================================
   WHAT IS AN API? INTERACTIVE TELEMETRY & DATA-FLOW SIMULATOR
   Demonstrates Client <-> API Gateway <-> Database request-response lifecycle
   Engineered for 240Hz buttery-smooth hardware-accelerated animations.
   ========================================================================== */

(function () {
  'use strict';

  const API_ENDPOINTS = {
    health: {
      method: 'GET',
      path: '/api/v1/system/health',
      desc: 'The client requests server operational metrics. The API checks host CPU & memory, returning status in real-time.',
      clientPayload: 'No Body (Standard GET Request)',
      gatewayAction: 'Routing to HealthCheck Controller -> MemCheck',
      dbAction: 'Cache hit in Redis memory store (0.4ms)',
      status: 200,
      statusText: '200 OK',
      latency: '3.8ms',
      response: {
        status: 'healthy',
        uptime: '99.98%',
        cluster: 'axiom-edge-node-01',
        kernel: 'v2.6-hardened',
        memory_usage_mb: 48.2
      }
    },
    telemetry: {
      method: 'POST',
      path: '/api/v1/robotics/telemetry',
      desc: 'The client transmits a batch of 6-DOF robotic servo telemetry coordinates. The API validates the JSON schema and writes the record to PostgreSQL.',
      clientPayload: JSON.stringify({ deviceId: 'ROBO-6DOF-09', jointAngles: [34.2, 72.8, -12.4], torqueNm: 4.8 }, null, 2),
      gatewayAction: 'Validating JSON payload schema -> Schema OK',
      dbAction: 'INSERT INTO robot_telemetry VALUES (...) -> Committed',
      status: 201,
      statusText: '201 Created',
      latency: '6.4ms',
      response: {
        success: true,
        record_id: 'rec_89b21f98e',
        rows_affected: 1,
        spatial_index_updated: true
      }
    },
    database: {
      method: 'GET',
      path: '/api/v1/users/profile?id=95',
      desc: 'The client requests user profile information with a query parameter. The API verifies the session and executes a SQL query on PostgreSQL.',
      clientPayload: 'Query param: id=95',
      gatewayAction: 'Resolving session token -> Executing SQL Query',
      dbAction: 'SELECT * FROM users WHERE id = 95 -> 1 row returned',
      status: 200,
      statusText: '200 OK',
      latency: '5.2ms',
      response: {
        id: 95,
        username: 'sharvin_mhatre',
        role: 'Aerospace & Systems Engineer',
        verified: true,
        hackathons_completed: 6
      }
    },
    auth: {
      method: 'POST',
      path: '/api/v1/auth/jwt-handshake',
      desc: 'The client initiates a secure handshake with API credentials. The server verifies cryptographic signatures and mints an ephemeral JWT token.',
      clientPayload: JSON.stringify({ client_id: 'axiom-web-portal', grant_type: 'client_credentials' }, null, 2),
      gatewayAction: 'Verifying SHA-256 HMAC signature -> Minting JWT',
      dbAction: 'Audit log appended to session_auth table',
      status: 200,
      statusText: '200 OK',
      latency: '8.1ms',
      response: {
        token_type: 'Bearer',
        expires_in: 3600,
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.9d8F1b8...',
        scope: 'read:systems write:telemetry'
      }
    }
  };

  let isRunning = false;

  document.addEventListener('DOMContentLoaded', initApiLab);
  if (document.readyState !== 'loading') initApiLab();

  function initApiLab() {
    const buttons = document.querySelectorAll('.api-action-pill');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (isRunning) return;
        const key = btn.getAttribute('data-endpoint');
        if (!key || !API_ENDPOINTS[key]) return;

        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        dispatchSimulatedApi(key);
      });
    });

    // Run healthcheck on initial load
    setTimeout(() => {
      dispatchSimulatedApi('health', true);
    }, 400);
  }

  function dispatchSimulatedApi(key, isSilent) {
    const data = API_ENDPOINTS[key];
    if (!data) return;
    isRunning = true;

    if (!isSilent && window.AudioEngine && window.AudioEngine.playClick) {
      window.AudioEngine.playClick();
    }

    const nodeClient = document.getElementById('api-node-client');
    const nodeGateway = document.getElementById('api-node-gateway');
    const nodeDb = document.getElementById('api-node-db');

    const pulse1 = document.getElementById('api-packet-pulse-1');
    const pulse2 = document.getElementById('api-packet-pulse-2');

    const statusBadge = document.getElementById('api-status-badge');
    const latencyVal = document.getElementById('api-latency-val');
    const methodBadge = document.getElementById('api-method-badge');
    const pathText = document.getElementById('api-path-text');
    const descText = document.getElementById('api-desc-text');
    const jsonOutput = document.getElementById('api-json-output');

    // Reset nodes
    [nodeClient, nodeGateway, nodeDb].forEach((node) => {
      if (node) node.classList.remove('pulse-active', 'pulse-glow');
    });

    // Update inspector header immediately
    if (methodBadge) {
      methodBadge.textContent = data.method;
      methodBadge.className = `api-method-pill ${data.method.toLowerCase()}`;
    }
    if (pathText) pathText.textContent = data.path;
    if (descText) descText.textContent = data.desc;

    if (statusBadge) {
      statusBadge.textContent = 'TRANSMITTING...';
      statusBadge.className = 'api-status-badge pending font-mono';
    }
    if (latencyVal) latencyVal.textContent = '...';

    // Step 1: Client sends request to Gateway
    if (nodeClient) nodeClient.classList.add('pulse-active');
    if (pulse1) {
      pulse1.classList.remove('animate-forward', 'animate-backward');
      void pulse1.offsetWidth; // Trigger reflow for restart
      pulse1.classList.add('animate-forward');
    }

    setTimeout(() => {
      // Step 2: Gateway receives request, processes, sends to DB
      if (nodeClient) nodeClient.classList.remove('pulse-active');
      if (nodeGateway) nodeGateway.classList.add('pulse-active');

      if (pulse2) {
        pulse2.classList.remove('animate-forward', 'animate-backward');
        void pulse2.offsetWidth;
        pulse2.classList.add('animate-forward');
      }

      setTimeout(() => {
        // Step 3: Database executes query and returns data to Gateway
        if (nodeGateway) nodeGateway.classList.remove('pulse-active');
        if (nodeDb) nodeDb.classList.add('pulse-active');

        if (pulse2) {
          pulse2.classList.remove('animate-forward');
          void pulse2.offsetWidth;
          pulse2.classList.add('animate-backward');
        }

        setTimeout(() => {
          // Step 4: Gateway sends response back to Client
          if (nodeDb) nodeDb.classList.remove('pulse-active');
          if (nodeGateway) nodeGateway.classList.add('pulse-active');

          if (pulse1) {
            pulse1.classList.remove('animate-forward');
            void pulse1.offsetWidth;
            pulse1.classList.add('animate-backward');
          }

          setTimeout(() => {
            // Step 5: Client receives 200 OK / 201 Created response
            if (nodeGateway) nodeGateway.classList.remove('pulse-active');
            if (nodeClient) {
              nodeClient.classList.add('pulse-glow');
              setTimeout(() => nodeClient.classList.remove('pulse-glow'), 600);
            }

            if (statusBadge) {
              statusBadge.textContent = data.statusText;
              statusBadge.className = 'api-status-badge success font-mono';
            }
            if (latencyVal) latencyVal.textContent = data.latency;

            // Render syntax-highlighted JSON response
            if (jsonOutput) {
              jsonOutput.innerHTML = highlightJson(data.response);
            }

            if (!isSilent && window.AudioEngine && window.AudioEngine.playActivate) {
              window.AudioEngine.playActivate();
            }

            isRunning = false;
          }, 240);
        }, 220);
      }, 240);
    }, 240);
  }

  function highlightJson(obj) {
    const raw = JSON.stringify(obj, null, 2);
    return raw.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    });
  }
})();
