/**
 * SpotLIGHT 3D / 360° Immersive Location Viewer
 * 
 * Features:
 * - "STEP INSIDE · 3D / 360°" full-screen immersive viewer
 * - Equirectangular 360° sphere projection with WebGL & 2D fallback
 * - Inertial touch drag & mouse drag look-around (360° Yaw & 180° Pitch)
 * - Pinch-to-zoom & mouse wheel zoom (FOV 35° to 100°)
 * - Mobile Gyroscope / DeviceOrientation camera look (with iOS permission request)
 * - Auto-rotation ambient pan mode with toggle
 * - Interactive hotspot pins & room switching (Main Floor, Lounge, Patio, VIP)
 * - Native iframe embed support for Matterport, Kuula, Polycam, Google Maps Photosphere
 * - Keyboard navigation (Arrow keys / WASD, + / - for zoom, Escape to close)
 * - Seamless integration with SpotLIGHT Magazine & Editor
 */

(function () {
  'use strict';

  // Demo 360° Scenes (High resolution equirectangular indoor & venue environments)
  const DEMO_SCENES = [
    {
      id: 'rush-main',
      name: 'The Rush · Main Stage & Floor',
      location: 'Salt Lake City, UT',
      tag: 'Entertainment & Lounge',
      panoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2000&q=85',
      blurb: 'Step inside The Rush — Utah\'s premier multi-level lounge and entertainment hub.',
      hotspots: [
        { pitch: -5, yaw: 85, label: '🍸 VIP Bar & Lounge', targetScene: 'rush-lounge' },
        { pitch: 0, yaw: -90, label: '🌴 Outdoor Terrace', targetScene: 'rush-patio' }
      ]
    },
    {
      id: 'rush-lounge',
      name: 'The Rush · VIP Speakeasy & Bar',
      location: 'Salt Lake City, UT',
      tag: 'Craft Cocktails & Seating',
      panoUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=2000&q=85',
      blurb: 'Craft mixology, leather booths, and curated ambient soundscapes.',
      hotspots: [
        { pitch: 5, yaw: -80, label: '📍 Back to Main Stage', targetScene: 'rush-main' }
      ]
    },
    {
      id: 'rush-patio',
      name: 'The Rush · Sky Lounge & Patio',
      location: 'Salt Lake City, UT',
      tag: 'Wasatch Mountain Views',
      panoUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=2000&q=85',
      blurb: 'Open-air views of the Wasatch Front peaks with fireside lounge tables.',
      hotspots: [
        { pitch: 0, yaw: 110, label: '🚪 Step Inside', targetScene: 'rush-main' }
      ]
    },
    {
      id: 'coffee-roaster',
      name: 'Peak & Pine Coffee Roasters',
      location: 'Granary District · SLC',
      tag: 'Artisan Cafe & Roastery',
      panoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=2000&q=85',
      blurb: 'Single-origin espresso bar with handcrafted walnut seating and vinyl music.',
      hotspots: []
    }
  ];

  let currentTourData = null;
  let activeSceneIndex = 0;
  let activeSceneList = DEMO_SCENES;
  
  // Camera state
  let yaw = 0; // Horizontal angle in degrees (-180 to 180)
  let pitch = 0; // Vertical angle in degrees (-85 to 85)
  let fov = 75; // Field of view in degrees (35 to 95)
  let targetYaw = 0;
  let targetPitch = 0;
  let targetFov = 75;

  // Interaction state
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let velX = 0;
  let velY = 0;
  let lastPinchDist = null;
  let isAutoRotating = true;
  let autoRotateSpeed = 0.12;
  let gyroEnabled = false;
  let gyroAlpha = 0, gyroBeta = 0, gyroGamma = 0;
  let animFrameId = null;

  // Canvas & Image
  let canvas = null;
  let ctx = null;
  let currentImage = null;
  let imageLoaded = false;
  let imageLoading = false;

  // Audio ambient effect
  let audioContext = null;
  let isMuted = true;

  function initViewerElements() {
    if (document.getElementById('tour3dModal')) return;

    const modal = document.createElement('div');
    modal.id = 'tour3dModal';
    modal.className = 'tour-3d-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', '3D Virtual Tour Viewer');

    modal.innerHTML = `
      <div class="tour-hud-top">
        <div class="tour-brand-group">
          <div class="tour-live-badge">
            <span class="tour-radar-dot"></span>
            <span>360° 3D IMMERSIVE SPACE</span>
          </div>
          <div class="tour-title-wrap">
            <h2 id="tourSpotTitle" class="tour-spot-title">The Rush · Salt Lake City</h2>
            <div id="tourSpotTag" class="tour-spot-tag">📍 Wasatch Front · 3D Scan</div>
          </div>
        </div>

        <div class="tour-top-controls">
          <button type="button" id="tourGyroBtn" class="tour-hud-btn" title="Toggle Phone Gyroscope Look" aria-label="Toggle Gyroscope">
            🧭 <span class="hud-btn-lbl">GYRO</span>
          </button>
          <button type="button" id="tourAutoRotateBtn" class="tour-hud-btn active" title="Toggle Auto-Rotation" aria-label="Toggle Auto-Rotation">
            🔄 <span class="hud-btn-lbl">ROTATE</span>
          </button>
          <button type="button" id="tourResetBtn" class="tour-hud-btn" title="Reset View Angle" aria-label="Reset View">
            🎯
          </button>
          <button type="button" id="tourFullscreenBtn" class="tour-hud-btn" title="Full Screen" aria-label="Toggle Fullscreen">
            ⛶
          </button>
          <button type="button" id="tourCloseBtn" class="tour-hud-btn tour-close-btn" title="Exit 3D View (Esc)" aria-label="Close 3D Tour">
            ✕
          </button>
        </div>
      </div>

      <div class="tour-viewport-container" id="tourViewportContainer">
        <canvas id="tour3dCanvas" class="tour-3d-canvas"></canvas>
        <iframe id="tourEmbedFrame" class="tour-embed-frame" allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer; autoplay" style="display:none;"></iframe>
        
        <div class="tour-loader" id="tourLoader">
          <div class="tour-spinner"></div>
          <div class="tour-loader-text">ENTERING 3D SPACE...</div>
          <div class="tour-loader-sub">Generating 360° Equirectangular Sphere</div>
        </div>

        <div class="tour-compass-indicator" id="tourCompass">
          <div class="compass-dial" id="compassDial">▲ N</div>
        </div>

        <div class="tour-hotspots-layer" id="tourHotspotsLayer"></div>
      </div>

      <div class="tour-hud-bottom">
        <div class="tour-scene-selector" id="tourSceneSelector"></div>

        <div class="tour-gesture-hint">
          <span class="hint-icon">👆</span>
          <span>Drag to look 360° · Pinch or scroll to zoom · Tap 🧭 for phone motion</span>
        </div>

        <div class="tour-bottom-actions">
          <div class="tour-zoom-pill">
            <button type="button" class="zoom-btn" id="tourZoomOut" title="Zoom Out">-</button>
            <span class="zoom-level" id="tourZoomLevel">100%</span>
            <button type="button" class="zoom-btn" id="tourZoomIn" title="Zoom In">+</button>
          </div>
          <a id="tourCtaLink" href="#" target="_blank" rel="noopener noreferrer" class="tour-cta-btn">
            Visit Website ↗
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    bindViewerEvents();
  }

  function injectViewerStyles() {
    if (document.getElementById('tour3dStyles')) return;
    const style = document.createElement('style');
    style.id = 'tour3dStyles';
    style.textContent = `
      /* ==========================================================================
         STEP INSIDE 3D / 360° STYLES
         ========================================================================== */
      .step-inside-3d-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        background: linear-gradient(135deg, #14121A 0%, #291b3e 50%, #14121A 100%);
        color: #FFD23F !important;
        border: 1.5px solid rgba(255, 210, 63, 0.7);
        border-radius: 8px;
        padding: 9px 12px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
        margin: 8px 0 4px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 16px rgba(255, 210, 63, 0.15);
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        text-decoration: none;
      }
      .step-inside-3d-btn:hover, .step-inside-3d-btn:active {
        background: linear-gradient(135deg, #FFD23F 0%, #FF4D6D 100%);
        color: #14121A !important;
        border-color: #fff;
        transform: translateY(-1px) scale(1.02);
        box-shadow: 0 6px 20px rgba(255, 77, 109, 0.4);
      }
      .btn-3d-pulse {
        font-size: 14px;
        animation: pulseIcon 1.8s infinite;
      }
      .btn-3d-badge {
        background: #FF4D6D;
        color: #fff;
        font-size: 9px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        letter-spacing: 0.05em;
        margin-left: 2px;
      }
      @keyframes pulseIcon {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0px #FFD23F); }
        50% { transform: scale(1.2); filter: drop-shadow(0 0 6px #FFD23F); }
      }

      /* 3D Fullscreen Modal Overlay */
      .tour-3d-modal {
        position: fixed;
        inset: 0;
        z-index: 100010;
        background: #09080d;
        display: none;
        flex-direction: column;
        justify-content: space-between;
        user-select: none;
        -webkit-user-select: none;
        overflow: hidden;
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        color: #F5F1E8;
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      .tour-3d-modal.active {
        display: flex;
        opacity: 1;
      }

      /* Top HUD */
      .tour-hud-top {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 20;
        padding: max(12px, env(safe-area-inset-top)) 16px 14px;
        background: linear-gradient(180deg, rgba(14, 12, 19, 0.95) 0%, rgba(14, 12, 19, 0.6) 70%, transparent 100%);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .tour-brand-group {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .tour-live-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #3FDDE0;
        margin-bottom: 2px;
      }
      .tour-radar-dot {
        width: 7px;
        height: 7px;
        background: #3FDDE0;
        border-radius: 50%;
        box-shadow: 0 0 8px #3FDDE0;
        animation: radarPulse 1.4s infinite;
      }
      @keyframes radarPulse {
        0% { transform: scale(0.9); opacity: 1; }
        50% { transform: scale(1.4); opacity: 0.5; }
        100% { transform: scale(0.9); opacity: 1; }
      }
      .tour-spot-title {
        font-family: 'Space Grotesk', sans-serif;
        font-size: clamp(14px, 4vw, 20px);
        font-weight: 700;
        color: #fff;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }
      .tour-spot-tag {
        font-size: 11px;
        color: rgba(245, 241, 232, 0.7);
      }

      .tour-top-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .tour-hud-btn {
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #F5F1E8;
        padding: 7px 11px;
        border-radius: 8px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: all 0.15s;
        touch-action: manipulation;
        min-height: 38px;
      }
      .tour-hud-btn:hover {
        background: rgba(255, 210, 63, 0.25);
        border-color: #FFD23F;
        color: #FFD23F;
      }
      .tour-hud-btn.active {
        background: #FFD23F;
        color: #14121A;
        border-color: #FFD23F;
      }
      .tour-close-btn {
        background: #FF4D6D;
        color: #fff;
        border-color: #FF4D6D;
        font-size: 14px;
        font-weight: 800;
        padding: 7px 14px;
      }
      .tour-close-btn:hover {
        background: #e03353;
        color: #fff;
      }
      @media (max-width: 600px) {
        .hud-btn-lbl { display: none; }
        .tour-hud-btn { padding: 7px 10px; }
      }

      /* Viewport */
      .tour-viewport-container {
        position: relative;
        width: 100%;
        height: 100%;
        flex: 1;
        overflow: hidden;
        cursor: grab;
        background: #000;
      }
      .tour-viewport-container:active {
        cursor: grabbing;
      }
      .tour-3d-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
      .tour-embed-frame {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: none;
        z-index: 10;
      }

      /* Loader */
      .tour-loader {
        position: absolute;
        inset: 0;
        background: #0d0b13;
        z-index: 30;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        transition: opacity 0.4s ease;
      }
      .tour-loader.hidden {
        opacity: 0;
        pointer-events: none;
      }
      .tour-spinner {
        width: 44px;
        height: 44px;
        border: 3px solid rgba(255, 210, 63, 0.2);
        border-top-color: #FFD23F;
        border-right-color: #FF4D6D;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .tour-loader-text {
        font-weight: 800;
        font-size: 13px;
        letter-spacing: 0.15em;
        color: #FFD23F;
      }
      .tour-loader-sub {
        font-size: 11px;
        color: rgba(245, 241, 232, 0.6);
      }

      /* Compass */
      .tour-compass-indicator {
        position: absolute;
        top: 80px;
        right: 18px;
        z-index: 15;
        background: rgba(14, 12, 19, 0.7);
        border: 1px solid rgba(255, 210, 63, 0.4);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        backdrop-filter: blur(6px);
      }
      .compass-dial {
        font-size: 10px;
        font-weight: 800;
        color: #FFD23F;
        transition: transform 0.1s linear;
      }

      /* Hotspots in 3D scene */
      .tour-hotspots-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 12;
      }
      .tour-hotspot-pin {
        position: absolute;
        transform: translate(-50%, -50%);
        pointer-events: auto;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(14, 12, 19, 0.88);
        border: 2px solid #FFD23F;
        color: #fff;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.04em;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7), 0 0 14px rgba(255, 210, 63, 0.4);
        transition: transform 0.15s, background 0.15s;
        white-space: nowrap;
      }
      .tour-hotspot-pin:hover {
        transform: translate(-50%, -50%) scale(1.08);
        background: #FFD23F;
        color: #14121A;
      }
      .tour-hotspot-pulse {
        width: 8px;
        height: 8px;
        background: #FF4D6D;
        border-radius: 50%;
        box-shadow: 0 0 6px #FF4D6D;
      }

      /* Bottom HUD */
      .tour-hud-bottom {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 20;
        padding: 14px 16px max(14px, env(safe-area-inset-bottom));
        background: linear-gradient(0deg, rgba(14, 12, 19, 0.95) 0%, rgba(14, 12, 19, 0.6) 70%, transparent 100%);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .tour-scene-selector {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: none;
      }
      .tour-scene-selector::-webkit-scrollbar { display: none; }
      .tour-scene-pill {
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #F5F1E8;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s;
        touch-action: manipulation;
        flex-shrink: 0;
      }
      .tour-scene-pill.active {
        background: #FFD23F;
        color: #14121A;
        border-color: #FFD23F;
        font-weight: 800;
      }
      .tour-gesture-hint {
        font-size: 10px;
        color: rgba(245, 241, 232, 0.65);
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
      }
      .tour-bottom-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .tour-zoom-pill {
        display: inline-flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 999px;
        padding: 2px 6px;
      }
      .zoom-btn {
        background: none;
        border: none;
        color: #FFD23F;
        font-size: 16px;
        font-weight: 800;
        width: 28px;
        height: 28px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .zoom-level {
        font-size: 10px;
        font-weight: 700;
        padding: 0 4px;
        color: #fff;
      }
      .tour-cta-btn {
        background: #3FDDE0;
        color: #14121A;
        padding: 8px 18px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        text-decoration: none;
        transition: transform 0.15s, background 0.15s;
        white-space: nowrap;
      }
      .tour-cta-btn:hover {
        transform: scale(1.04);
        background: #fff;
      }
    `;
    document.head.appendChild(style);
  }

  function bindViewerEvents() {
    const modal = document.getElementById('tour3dModal');
    const container = document.getElementById('tourViewportContainer');
    const closeBtn = document.getElementById('tourCloseBtn');
    const autoRotateBtn = document.getElementById('tourAutoRotateBtn');
    const gyroBtn = document.getElementById('tourGyroBtn');
    const resetBtn = document.getElementById('tourResetBtn');
    const fullscreenBtn = document.getElementById('tourFullscreenBtn');
    const zoomInBtn = document.getElementById('tourZoomIn');
    const zoomOutBtn = document.getElementById('tourZoomOut');

    // Close on button & keydown
    if (closeBtn) closeBtn.onclick = close3dTourModal;
    window.addEventListener('keydown', (e) => {
      if (modal && modal.classList.contains('active')) {
        if (e.key === 'Escape') {
          close3dTourModal();
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          targetYaw -= 6;
          isAutoRotating = false;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          targetYaw += 6;
          isAutoRotating = false;
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          targetPitch = Math.min(85, targetPitch + 5);
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          targetPitch = Math.max(-85, targetPitch - 5);
        } else if (e.key === '+' || e.key === '=') {
          adjustZoom(-8);
        } else if (e.key === '-' || e.key === '_') {
          adjustZoom(8);
        }
      }
    });

    // Auto rotate toggle
    if (autoRotateBtn) {
      autoRotateBtn.onclick = () => {
        isAutoRotating = !isAutoRotating;
        autoRotateBtn.classList.toggle('active', isAutoRotating);
      };
    }

    // Reset view
    if (resetBtn) {
      resetBtn.onclick = () => {
        targetYaw = 0;
        targetPitch = 0;
        targetFov = 75;
        if (typeof showToast === 'function') showToast('🎯 View Angle Centered');
      };
    }

    // Fullscreen toggle
    if (fullscreenBtn) {
      fullscreenBtn.onclick = () => {
        if (!document.fullscreenElement) {
          if (modal.requestFullscreen) modal.requestFullscreen();
          else if (modal.webkitRequestFullscreen) modal.webkitRequestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      };
    }

    // Zoom buttons
    if (zoomInBtn) zoomInBtn.onclick = () => adjustZoom(-10);
    if (zoomOutBtn) zoomOutBtn.onclick = () => adjustZoom(10);

    // Gyroscope look toggle (iOS / Android)
    if (gyroBtn) {
      gyroBtn.onclick = async () => {
        if (!gyroEnabled) {
          if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
              const res = await DeviceOrientationEvent.requestPermission();
              if (res === 'granted') {
                enableGyro();
              } else {
                if (typeof showToast === 'function') showToast('Motion permission denied');
              }
            } catch (err) {
              enableGyro();
            }
          } else {
            enableGyro();
          }
        } else {
          disableGyro();
        }
      };
    }

    // Mouse Controls (Drag, Momentum, Wheel)
    if (container) {
      container.addEventListener('mousedown', (e) => {
        if (e.target.closest('.tour-hotspot-pin') || e.target.closest('button')) return;
        isDragging = true;
        isAutoRotating = false;
        startX = e.clientX;
        startY = e.clientY;
        lastX = e.clientX;
        lastY = e.clientY;
        velX = 0;
        velY = 0;
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        const sensitivity = fov / 500;
        targetYaw -= dx * sensitivity;
        targetPitch = Math.max(-85, Math.min(85, targetPitch + dy * sensitivity));

        velX = -dx * sensitivity;
        velY = dy * sensitivity;
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
      });

      container.addEventListener('wheel', (e) => {
        e.preventDefault();
        adjustZoom(e.deltaY * 0.05);
      }, { passive: false });

      // Touch Controls (Drag, Inertia, Pinch to Zoom)
      container.addEventListener('touchstart', (e) => {
        if (e.target.closest('.tour-hotspot-pin') || e.target.closest('button')) return;
        isAutoRotating = false;

        if (e.touches.length === 1) {
          isDragging = true;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          lastX = startX;
          lastY = startY;
          velX = 0;
          velY = 0;
          lastPinchDist = null;
        } else if (e.touches.length === 2) {
          isDragging = false;
          lastPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      }, { passive: true });

      container.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isDragging) {
          const x = e.touches[0].clientX;
          const y = e.touches[0].clientY;
          const dx = x - lastX;
          const dy = y - lastY;
          lastX = x;
          lastY = y;

          const sensitivity = fov / 450;
          targetYaw -= dx * sensitivity;
          targetPitch = Math.max(-85, Math.min(85, targetPitch + dy * sensitivity));

          velX = -dx * sensitivity;
          velY = dy * sensitivity;
        } else if (e.touches.length === 2 && lastPinchDist !== null) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const diff = lastPinchDist - dist;
          adjustZoom(diff * 0.2);
          lastPinchDist = dist;
        }
      }, { passive: true });

      container.addEventListener('touchend', () => {
        isDragging = false;
        lastPinchDist = null;
      }, { passive: true });
    }

    // Window resize
    window.addEventListener('resize', () => {
      resizeCanvas();
    });
  }

  function adjustZoom(delta) {
    targetFov = Math.max(35, Math.min(95, targetFov + delta));
    const zoomLevelEl = document.getElementById('tourZoomLevel');
    if (zoomLevelEl) {
      const pct = Math.round(((95 - targetFov) / 60) * 100) + 50;
      zoomLevelEl.textContent = pct + '%';
    }
  }

  function enableGyro() {
    gyroEnabled = true;
    const btn = document.getElementById('tourGyroBtn');
    if (btn) btn.classList.add('active');
    isAutoRotating = false;

    window.addEventListener('deviceorientation', handleOrientation, true);
    if (typeof showToast === 'function') showToast('🧭 Gyroscope Look Enabled — Tilt Device');
  }

  function disableGyro() {
    gyroEnabled = false;
    const btn = document.getElementById('tourGyroBtn');
    if (btn) btn.classList.remove('active');
    window.removeEventListener('deviceorientation', handleOrientation, true);
  }

  function handleOrientation(event) {
    if (!gyroEnabled) return;
    const { beta, gamma, alpha } = event;
    if (beta === null || gamma === null) return;

    // Portrait mode orientation calculation
    const orientation = window.orientation || 0;
    if (orientation === 0) {
      targetPitch = Math.max(-85, Math.min(85, beta - 45));
      targetYaw += gamma * 0.05;
    } else if (orientation === 90) {
      targetPitch = Math.max(-85, Math.min(85, -gamma));
      targetYaw += beta * 0.05;
    } else if (orientation === -90) {
      targetPitch = Math.max(-85, Math.min(85, gamma));
      targetYaw -= beta * 0.05;
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    const container = document.getElementById('tourViewportContainer');
    if (!container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }

  /**
   * High-Performance 360° Equirectangular Sphere Projection Renderer
   * Maps an equirectangular panorama onto a virtual sphere viewport
   */
  function renderFrame() {
    if (!canvas) return;

    // Smooth damping / inertia for camera
    yaw += (targetYaw - yaw) * 0.12;
    pitch += (targetPitch - pitch) * 0.12;
    fov += (targetFov - fov) * 0.12;

    // Auto rotate
    if (isAutoRotating && !isDragging && !gyroEnabled) {
      targetYaw += autoRotateSpeed;
      yaw += autoRotateSpeed;
    }

    // Keep yaw normalized between -180 and 180
    while (yaw > 180) { yaw -= 360; targetYaw -= 360; }
    while (yaw < -180) { yaw += 360; targetYaw += 360; }

    // Compass update
    const compassDial = document.getElementById('compassDial');
    if (compassDial) {
      compassDial.style.transform = `rotate(${Math.round(yaw)}deg)`;
    }

    const w = canvas.width;
    const h = canvas.height;

    if (!ctx) ctx = canvas.getContext('2d');

    if (imageLoaded && currentImage) {
      const imgW = currentImage.naturalWidth || currentImage.width;
      const imgH = currentImage.naturalHeight || currentImage.height;

      // Project equirectangular window
      // Horizontal angle -> X coordinate in panorama
      const fovH = fov * (Math.PI / 180);
      const fovV = fovH * (h / w);

      const normYaw = ((yaw + 180) % 360 + 360) % 360; // 0 to 360
      const centerU = normYaw / 360;
      const centerV = 0.5 - (pitch / 180);

      const spanU = (fovH / (2 * Math.PI));
      const spanV = (fovV / Math.PI);

      const srcW = spanU * imgW;
      const srcH = spanV * imgH;
      const srcX = (centerU * imgW) - (srcW / 2);
      const srcY = Math.max(0, Math.min(imgH - srcH, (centerV * imgH) - (srcH / 2)));

      ctx.clearRect(0, 0, w, h);

      // Handle wrapping horizontally across equirectangular boundary
      if (srcX < 0) {
        const leftWidth = -srcX;
        const leftRatio = leftWidth / srcW;
        ctx.drawImage(
          currentImage,
          imgW - leftWidth, srcY, leftWidth, srcH,
          0, 0, w * leftRatio, h
        );
        ctx.drawImage(
          currentImage,
          0, srcY, srcW - leftWidth, srcH,
          w * leftRatio, 0, w * (1 - leftRatio), h
        );
      } else if (srcX + srcW > imgW) {
        const rightWidth = (srcX + srcW) - imgW;
        const mainWidth = srcW - rightWidth;
        const mainRatio = mainWidth / srcW;
        ctx.drawImage(
          currentImage,
          srcX, srcY, mainWidth, srcH,
          0, 0, w * mainRatio, h
        );
        ctx.drawImage(
          currentImage,
          0, srcY, rightWidth, srcH,
          w * mainRatio, 0, w * (1 - mainRatio), h
        );
      } else {
        ctx.drawImage(
          currentImage,
          srcX, srcY, srcW, srcH,
          0, 0, w, h
        );
      }

      // Add high-end subtle vignette & depth lighting
      const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.85);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(10,8,16,0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

    } else {
      // Placeholder ambient grid when image is loading
      ctx.fillStyle = '#14121A';
      ctx.fillRect(0, 0, w, h);
    }

    updateHotspotsPositions(w, h);

    animFrameId = requestAnimationFrame(renderFrame);
  }

  function updateHotspotsPositions(canvasW, canvasH) {
    const layer = document.getElementById('tourHotspotsLayer');
    if (!layer) return;

    const currentScene = activeSceneList[activeSceneIndex];
    if (!currentScene || !currentScene.hotspots || currentScene.hotspots.length === 0) {
      layer.innerHTML = '';
      return;
    }

    const container = document.getElementById('tourViewportContainer');
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const fovH = fov * (Math.PI / 180);
    const fovV = fovH * (rect.height / rect.width);

    let html = '';
    currentScene.hotspots.forEach((hs, idx) => {
      // Calculate delta angle
      let dYaw = hs.yaw - yaw;
      while (dYaw > 180) dYaw -= 360;
      while (dYaw < -180) dYaw += 360;

      const dPitch = hs.pitch - pitch;

      // Check if inside field of view
      const radYaw = dYaw * (Math.PI / 180);
      const radPitch = dPitch * (Math.PI / 180);

      if (Math.abs(radYaw) < fovH / 1.7 && Math.abs(radPitch) < fovV / 1.7) {
        const screenX = (rect.width / 2) + (radYaw / fovH) * rect.width;
        const screenY = (rect.height / 2) - (radPitch / fovV) * rect.height;

        html += `
          <div class="tour-hotspot-pin" style="left:${screenX}px; top:${screenY}px;" onclick="window.switchTourScene('${hs.targetScene}')">
            <span class="tour-hotspot-pulse"></span>
            <span>${hs.label}</span>
          </div>
        `;
      }
    });

    layer.innerHTML = html;
  }

  function loadScene(sceneIndex) {
    if (sceneIndex < 0 || sceneIndex >= activeSceneList.length) sceneIndex = 0;
    activeSceneIndex = sceneIndex;
    const scene = activeSceneList[sceneIndex];
    if (!scene) return;

    const loader = document.getElementById('tourLoader');
    if (loader) loader.classList.remove('hidden');

    const titleEl = document.getElementById('tourSpotTitle');
    const tagEl = document.getElementById('tourSpotTag');
    const ctaEl = document.getElementById('tourCtaLink');

    if (titleEl) titleEl.textContent = scene.name || currentTourData?.title || '3D Location Scan';
    if (tagEl) tagEl.textContent = `📍 ${scene.location || 'Wasatch Front, UT'} · ${scene.tag || '3D Spatial Scan'}`;
    if (ctaEl) {
      if (currentTourData?.link && currentTourData.link !== '#') {
        ctaEl.href = currentTourData.link;
        ctaEl.textContent = `${currentTourData.cta || 'Visit Website'} ↗`;
        ctaEl.style.display = 'inline-flex';
      } else {
        ctaEl.style.display = 'none';
      }
    }

    renderSceneSelector();

    // Check if custom embed (Matterport, Kuula, Polycam, Google Photosphere, etc.)
    const embedFrame = document.getElementById('tourEmbedFrame');
    const canvasEl = document.getElementById('tour3dCanvas');

    const tourUrl = scene.tourUrl || currentTourData?.tourUrl;
    if (tourUrl && (tourUrl.includes('matterport.com') || tourUrl.includes('kuula.co') || tourUrl.includes('poly.cam') || tourUrl.includes('google.com/maps') || tourUrl.includes('youtube.com/embed') || tourUrl.includes('luma.ai'))) {
      if (embedFrame && canvasEl) {
        canvasEl.style.display = 'none';
        embedFrame.style.display = 'block';
        embedFrame.src = tourUrl;
        if (loader) setTimeout(() => loader.classList.add('hidden'), 1200);
      }
      return;
    }

    // Equirectangular 360° Sphere
    if (embedFrame && canvasEl) {
      embedFrame.style.display = 'none';
      embedFrame.src = 'about:blank';
      canvasEl.style.display = 'block';
    }

    imageLoaded = false;
    imageLoading = true;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      currentImage = img;
      imageLoaded = true;
      imageLoading = false;
      if (loader) loader.classList.add('hidden');
    };
    img.onerror = () => {
      // Fallback to default high-res demo panorama
      console.warn('Custom pano load failed, falling back to default scene');
      img.src = DEMO_SCENES[0].panoUrl;
    };
    img.src = scene.panoUrl || DEMO_SCENES[0].panoUrl;
  }

  function renderSceneSelector() {
    const sel = document.getElementById('tourSceneSelector');
    if (!sel) return;

    if (activeSceneList.length <= 1) {
      sel.style.display = 'none';
      return;
    }

    sel.style.display = 'flex';
    sel.innerHTML = activeSceneList.map((sc, idx) => `
      <button type="button" class="tour-scene-pill ${idx === activeSceneIndex ? 'active' : ''}" onclick="window.setTourSceneIndex(${idx})">
        ${sc.name.split('·')[1]?.trim() || sc.name}
      </button>
    `).join('');
  }

  window.setTourSceneIndex = function (idx) {
    loadScene(idx);
  };

  window.switchTourScene = function (sceneId) {
    const idx = activeSceneList.findIndex(s => s.id === sceneId);
    if (idx !== -1) {
      loadScene(idx);
      if (typeof showToast === 'function') {
        showToast(`📍 Stepped into: ${activeSceneList[idx].name}`);
      }
    }
  };

  /**
   * Opens the 3D / 360° Tour Modal
   * @param {Object} options - { title, tag, location, tourUrl, panoUrl, link, cta, blurb }
   */
  window.open3dTourModal = function (options = {}) {
    initViewerElements();
    injectViewerStyles();

    currentTourData = options;
    const modal = document.getElementById('tour3dModal');
    if (!modal) return;

    // Check if custom tour URL or panorama provided
    if (options.panoUrl || options.tourUrl) {
      activeSceneList = [
        {
          id: 'custom-spot',
          name: options.title || 'Location 3D View',
          location: options.location || 'Salt Lake City, UT',
          tag: options.tag || '3D Virtual Space',
          panoUrl: options.panoUrl || options.tourUrl,
          tourUrl: options.tourUrl,
          blurb: options.blurb || '',
          hotspots: []
        },
        ...DEMO_SCENES.slice(0, 2)
      ];
    } else {
      activeSceneList = DEMO_SCENES;
    }

    activeSceneIndex = 0;
    yaw = 0;
    pitch = 0;
    fov = 75;
    targetYaw = 0;
    targetPitch = 0;
    targetFov = 75;
    isAutoRotating = true;

    canvas = document.getElementById('tour3dCanvas');
    resizeCanvas();

    modal.classList.add('active');
    loadScene(0);

    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(renderFrame);

    if (typeof showToast === 'function') {
      showToast(`🔦 Stepped Inside 3D Space: ${options.title || 'The Rush SLC'}`);
    }
  };

  window.close3dTourModal = function () {
    const modal = document.getElementById('tour3dModal');
    if (modal) modal.classList.remove('active');

    const embedFrame = document.getElementById('tourEmbedFrame');
    if (embedFrame) embedFrame.src = 'about:blank';

    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    disableGyro();

    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  };

  // Pre-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initViewerElements();
      injectViewerStyles();
    });
  } else {
    initViewerElements();
    injectViewerStyles();
  }

  console.log('[SpotLIGHT] 3D / 360° Immersive Viewer Engine initialized');
})();
