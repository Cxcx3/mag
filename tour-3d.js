/**
 * SpotLIGHT 3D / 360° Immersive Location Viewer
 * 
 * Features:
 * - "STEP INSIDE · 3D / 360°" full-screen immersive viewer
 * - Universal URL Normalizer: 360Cities, Kuula, Matterport, Polycam, Google Maps Photospheres, Momento360, YouTube VR, Luma AI, Roundme
 * - Equirectangular 360° sphere projection with instantaneous procedural fallback
 * - Inertial touch drag & mouse drag look-around (360° Yaw & 180° Pitch)
 * - Pinch-to-zoom & mouse wheel zoom (FOV 35° to 95°)
 * - Mobile Gyroscope / DeviceOrientation camera look (with iOS permission request)
 * - Auto-rotation ambient pan mode with toggle
 * - Interactive hotspot pins & room switching (Main Stage & Floor, VIP Speakeasy, Sky Patio, Ensign Peak)
 * - Direct iframe embed with cross-origin safeguards & external view launcher
 * - Keyboard navigation (Arrow keys / WASD, + / - for zoom, Escape to close)
 * - Seamless integration with SpotLIGHT Magazine & Editor
 */

(function () {
  'use strict';

  /**
   * Normalizes any 360 tour, VR, photosphere, or 360 image URL into a ready-to-embed format.
   */
  function normalize3dTourUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { isEmbed: false, isImage: false, url: '', provider: 'none', originalUrl: '' };
    }
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      return { isEmbed: false, isImage: false, url: '', provider: 'none', originalUrl: '' };
    }

    // 1. 360Cities (e.g. https://www.360cities.net/image/ensign-peak-01-salt-lake-city-utah-usa#33.56,0.31,110.0)
    const match360Cities = trimmed.match(/360cities\.net\/(image|embed_iframe|paid_embed_iframe)\/([^\/?#]+)/i);
    if (match360Cities) {
      const slug = match360Cities[2];
      if (trimmed.includes('paid_embed_iframe') || trimmed.includes('embed_iframe')) {
        return { isEmbed: true, isImage: false, url: trimmed, provider: '360Cities', originalUrl: trimmed };
      }
      return {
        isEmbed: true,
        isImage: false,
        url: `https://www.360cities.net/embed_iframe/${slug}`,
        provider: '360Cities',
        originalUrl: trimmed
      };
    }

    // 2. Kuula (e.g. https://kuula.co/post/XXXX or https://kuula.co/share/XXXX)
    const matchKuula = trimmed.match(/kuula\.co\/(post|share)\/([a-zA-Z0-9_-]+)/i);
    if (matchKuula) {
      const id = matchKuula[2];
      return {
        isEmbed: true,
        isImage: false,
        url: `https://kuula.co/share/${id}?logo=1&info=1&fs=1&vr=1&sd=1&thumbs=1`,
        provider: 'Kuula',
        originalUrl: trimmed
      };
    }

    // 3. Matterport (e.g. https://my.matterport.com/show/?m=XXXXX)
    if (trimmed.includes('matterport.com')) {
      let embedUrl = trimmed;
      if (!embedUrl.includes('&play=1') && !embedUrl.includes('?play=1')) {
        embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'play=1&qs=1';
      }
      return { isEmbed: true, isImage: false, url: embedUrl, provider: 'Matterport', originalUrl: trimmed };
    }

    // 4. Polycam (e.g. https://poly.cam/capture/XXXXX or https://poly.cam/embed/XXXXX)
    const matchPolycam = trimmed.match(/poly\.cam\/(capture|embed)\/([a-zA-Z0-9_-]+)/i);
    if (matchPolycam) {
      const id = matchPolycam[2];
      return {
        isEmbed: true,
        isImage: false,
        url: `https://poly.cam/embed/${id}`,
        provider: 'Polycam',
        originalUrl: trimmed
      };
    }

    // 5. Momento360
    if (trimmed.includes('momento360.com')) {
      return { isEmbed: true, isImage: false, url: trimmed, provider: 'Momento360', originalUrl: trimmed };
    }

    // 6. YouTube 360 / VR Videos
    const matchYT = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (matchYT) {
      const ytId = matchYT[1];
      return {
        isEmbed: true,
        isImage: false,
        url: `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1`,
        provider: 'YouTube VR',
        originalUrl: trimmed
      };
    }

    // 7. Google Maps / Street View / Photosphere
    if (trimmed.includes('google.com/maps') || trimmed.includes('goo.gl/maps')) {
      return { isEmbed: true, isImage: false, url: trimmed, provider: 'Google Maps', originalUrl: trimmed };
    }

    // 8. Luma AI
    if (trimmed.includes('lumalabs.ai') || trimmed.includes('luma.ai')) {
      return { isEmbed: true, isImage: false, url: trimmed, provider: 'Luma AI', originalUrl: trimmed };
    }

    // 9. Roundme
    if (trimmed.includes('roundme.com')) {
      return { isEmbed: true, isImage: false, url: trimmed, provider: 'Roundme', originalUrl: trimmed };
    }

    // 10. Direct 360 Equirectangular Image
    if (/\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i.test(trimmed) || trimmed.startsWith('data:image/') || trimmed.startsWith('blob:') || trimmed.includes('images.unsplash.com') || trimmed.includes('cloudinary.com') || trimmed.includes('imgur.com')) {
      return { isEmbed: false, isImage: true, url: trimmed, provider: 'Equirectangular Photo', originalUrl: trimmed };
    }

    // Generic web embed fallback
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { isEmbed: true, isImage: false, url: trimmed, provider: '360 Interactive Space', originalUrl: trimmed };
    }

    return { isEmbed: false, isImage: false, url: trimmed, provider: 'unknown', originalUrl: trimmed };
  }

  // 360° Scenes (Equirectangular indoor & outdoor spaces + Utah 360 spots)
  const DEMO_SCENES = [
    {
      id: '360-main',
      name: '360 · Main Stage & Floor',
      location: 'Salt Lake City, UT',
      tag: 'Entertainment & Lounge',
      panoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2000&q=85',
      blurb: 'Step inside 360 — Utah\'s premier multi-level lounge and immersive entertainment venue.',
      hotspots: [
        { pitch: -4, yaw: 80, label: '🍸 VIP Speakeasy & Bar', targetScene: '360-lounge' },
        { pitch: 0, yaw: -90, label: '🌴 Sky Lounge & Patio', targetScene: '360-patio' }
      ]
    },
    {
      id: '360-lounge',
      name: '360 · VIP Speakeasy & Bar',
      location: 'Salt Lake City, UT',
      tag: 'Craft Cocktails & Seating',
      panoUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=2000&q=85',
      blurb: 'Craft mixology, leather booths, and curated ambient soundscapes.',
      hotspots: [
        { pitch: 4, yaw: -80, label: '📍 Back to Main Stage', targetScene: '360-main' }
      ]
    },
    {
      id: '360-patio',
      name: '360 · Sky Lounge & Patio',
      location: 'Salt Lake City, UT',
      tag: 'Wasatch Mountain Views',
      panoUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=2000&q=85',
      blurb: 'Open-air views of the Wasatch Front peaks with fireside lounge tables.',
      hotspots: [
        { pitch: 0, yaw: 110, label: '🚪 Step Inside', targetScene: '360-main' }
      ]
    },
    {
      id: 'ensign-peak',
      name: 'Ensign Peak · Panoramic View',
      location: 'Salt Lake City, UT',
      tag: '360Cities · Panoramic Peak',
      tourUrl: 'https://www.360cities.net/embed_iframe/ensign-peak-01-salt-lake-city-utah-usa',
      blurb: 'Iconic scenic lookout overlooking Salt Lake City, the Capitol building, and the Great Salt Lake.',
      hotspots: []
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

  // Cache for generated procedural 360 panoramas so they never fail
  const proceduralPanoCache = {};

  /**
   * Generates a rich, crisp 2048x1024 360° Equirectangular texture
   * Ensures instant, stunning rendering with zero black screen latency.
   */
  function getSceneProceduralCanvas(sceneId) {
    if (proceduralPanoCache[sceneId]) {
      return proceduralPanoCache[sceneId];
    }

    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 1024;
    const ctx = c.getContext('2d');
    const w = c.width;
    const h = c.height;

    if (sceneId === '360-lounge') {
      // Warm Amber Speakeasy Bar 360 Panorama
      const ceilGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
      ceilGrad.addColorStop(0, '#100c14');
      ceilGrad.addColorStop(1, '#2b1a1c');
      ctx.fillStyle = ceilGrad;
      ctx.fillRect(0, 0, w, h * 0.45);

      const floorGrad = ctx.createLinearGradient(0, h * 0.45, 0, h);
      floorGrad.addColorStop(0, '#261510');
      floorGrad.addColorStop(1, '#0e0807');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, h * 0.45, w, h * 0.55);

      const barX = w * 0.25;
      const barW = w * 0.22;
      ctx.fillStyle = 'rgba(255, 180, 70, 0.25)';
      ctx.fillRect(barX, h * 0.28, barW, h * 0.22);
      ctx.fillStyle = '#FFB84D';
      ctx.fillRect(barX - 10, h * 0.5, barW + 20, 14);

      ctx.fillStyle = '#FFD23F';
      ctx.font = 'bold 36px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FFD23F';
      ctx.shadowBlur = 24;
      ctx.fillText('360 · SPEAKEASY & COCKTAILS', barX + barW / 2, h * 0.24);
      ctx.shadowBlur = 0;

      const lampX = [w * 0.1, w * 0.35, w * 0.6, w * 0.85];
      lampX.forEach(lx => {
        const rad = ctx.createRadialGradient(lx, h * 0.22, 6, lx, h * 0.22, 120);
        rad.addColorStop(0, 'rgba(255, 210, 80, 0.9)');
        rad.addColorStop(0.3, 'rgba(255, 150, 40, 0.3)');
        rad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rad;
        ctx.fillRect(lx - 120, h * 0.1, 240, 240);
      });

      ctx.fillStyle = 'rgba(20, 14, 18, 0.85)';
      ctx.fillRect(0, h * 0.56, w, h * 0.44);

    } else if (sceneId === '360-patio' || sceneId === 'ensign-peak') {
      // Mountain Twilight Sky Lounge 360 Panorama
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
      skyGrad.addColorStop(0, '#090817');
      skyGrad.addColorStop(0.5, '#20163B');
      skyGrad.addColorStop(0.85, '#68294B');
      skyGrad.addColorStop(1, '#FF7A59');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.5);

      // Wasatch Mountains Ridge Silhouettes
      ctx.fillStyle = '#161024';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.46);
      for (let x = 0; x <= w; x += 40) {
        const peak = Math.sin(x * 0.008) * 60 + Math.cos(x * 0.02) * 35;
        ctx.lineTo(x, h * 0.44 - peak);
      }
      ctx.lineTo(w, h * 0.55);
      ctx.lineTo(0, h * 0.55);
      ctx.closePath();
      ctx.fill();

      // Deck / Patio Floor
      const deckGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
      deckGrad.addColorStop(0, '#1c1822');
      deckGrad.addColorStop(1, '#0c0a10');
      ctx.fillStyle = deckGrad;
      ctx.fillRect(0, h * 0.5, w, h * 0.5);

      // Glass Fire Pit Glow
      const fireRad = ctx.createRadialGradient(w * 0.5, h * 0.65, 10, w * 0.5, h * 0.65, 200);
      fireRad.addColorStop(0, 'rgba(255, 120, 50, 0.95)');
      fireRad.addColorStop(0.4, 'rgba(255, 77, 109, 0.35)');
      fireRad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fireRad;
      ctx.fillRect(w * 0.5 - 200, h * 0.5, 400, 300);

      // String bulb dots
      for (let x = 30; x < w; x += 70) {
        const by = (x < w * 0.5) 
          ? (h * 0.18 + Math.sin((x / (w * 0.5)) * Math.PI) * (h * 0.08))
          : (h * 0.18 + Math.sin(((x - w * 0.5) / (w * 0.5)) * Math.PI) * (h * 0.08));
        ctx.fillStyle = '#FFD23F';
        ctx.beginPath();
        ctx.arc(x, by, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#F5F1E8';
      ctx.font = 'bold 32px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sceneId === 'ensign-peak' ? 'ENSIGN PEAK · SALT LAKE CITY 360°' : '360 · WASATCH SKY LOUNGE & PATIO', w * 0.5, h * 0.12);

    } else if (sceneId === 'coffee-roaster') {
      // Artisan Cafe 360 Panorama
      ctx.fillStyle = '#1e1614';
      ctx.fillRect(0, 0, w, h * 0.45);
      ctx.fillStyle = '#2c221e';
      ctx.fillRect(0, h * 0.45, w, h * 0.55);

      ctx.fillStyle = 'rgba(255, 200, 120, 0.2)';
      ctx.fillRect(w * 0.3, h * 0.3, w * 0.4, h * 0.3);

      ctx.fillStyle = '#FFD23F';
      ctx.font = 'bold 36px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PEAK & PINE COFFEE ROASTERS · GRANARY SLC', w * 0.5, h * 0.25);

    } else {
      // Default: '360-main' (High-Energy Immersive Venue & Main Stage)
      const ceilGrad = ctx.createLinearGradient(0, 0, 0, h * 0.46);
      ceilGrad.addColorStop(0, '#0a0810');
      ceilGrad.addColorStop(0.6, '#180d28');
      ceilGrad.addColorStop(1, '#2d1445');
      ctx.fillStyle = ceilGrad;
      ctx.fillRect(0, 0, w, h * 0.46);

      const floorGrad = ctx.createLinearGradient(0, h * 0.46, 0, h);
      floorGrad.addColorStop(0, '#1c102a');
      floorGrad.addColorStop(0.3, '#100b1a');
      floorGrad.addColorStop(1, '#08060c');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, h * 0.46, w, h * 0.54);

      // Floor Grid Lines
      ctx.strokeStyle = 'rgba(63, 221, 224, 0.15)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < w; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, h * 0.46);
        ctx.lineTo((x - w * 0.5) * 2.5 + w * 0.5, h);
        ctx.stroke();
      }

      // Stage LED Backdrop
      const stageX = w * 0.38;
      const stageW = w * 0.24;
      const stageH = h * 0.28;
      const stageY = h * 0.18;

      const screenGrad = ctx.createLinearGradient(stageX, stageY, stageX + stageW, stageY + stageH);
      screenGrad.addColorStop(0, '#FF4D6D');
      screenGrad.addColorStop(0.5, '#7928CA');
      screenGrad.addColorStop(1, '#3FDDE0');
      ctx.fillStyle = screenGrad;
      ctx.fillRect(stageX, stageY, stageW, stageH);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 52px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#3FDDE0';
      ctx.shadowBlur = 30;
      ctx.fillText('360', stageX + stageW / 2, stageY + stageH * 0.45);

      ctx.font = 'bold 20px "Space Grotesk", sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('IMMERSIVE VENUE & LOUNGE', stageX + stageW / 2, stageY + stageH * 0.7);
      ctx.shadowBlur = 0;

      const spots = [
        { x: stageX + 40, color: 'rgba(255, 77, 109, 0.35)' },
        { x: stageX + stageW / 2, color: 'rgba(255, 210, 63, 0.35)' },
        { x: stageX + stageW - 40, color: 'rgba(63, 221, 224, 0.35)' }
      ];
      spots.forEach(sp => {
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.moveTo(sp.x, 40);
        ctx.lineTo(sp.x - 140, h * 0.58);
        ctx.lineTo(sp.x + 140, h * 0.58);
        ctx.closePath();
        ctx.fill();
      });

      const sideNeons = [w * 0.08, w * 0.18, w * 0.78, w * 0.9];
      sideNeons.forEach((sx, i) => {
        const col = (i % 2 === 0) ? '#3FDDE0' : '#FFD23F';
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 18;
        ctx.fillRect(sx, h * 0.22, 6, h * 0.28);
      });
      ctx.shadowBlur = 0;
    }

    proceduralPanoCache[sceneId] = c;
    return c;
  }

  let currentTourData = null;
  let activeSceneIndex = 0;
  let activeSceneList = DEMO_SCENES;
  
  // Camera state
  let yaw = 0;
  let pitch = 0;
  let fov = 75;
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
  let animFrameId = null;
  let resizeObserver = null;

  // Canvas & Image
  let canvas = null;
  let ctx = null;
  let currentImage = null;
  let imageLoaded = false;
  let currentPanoUrl = '';

  function initViewerElements() {
    if (document.getElementById('tour3dModal')) return;

    const modal = document.createElement('div');
    modal.id = 'tour3dModal';
    modal.className = 'tour-3d-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', '360° Virtual Tour Viewer');

    modal.innerHTML = `
      <div class="tour-hud-top">
        <div class="tour-brand-group">
          <div class="tour-live-badge">
            <span class="tour-radar-dot"></span>
            <span id="tourProviderBadge">360° 3D IMMERSIVE SPACE</span>
          </div>
          <div class="tour-title-wrap">
            <h2 id="tourSpotTitle" class="tour-spot-title">360 · Salt Lake City</h2>
            <div id="tourSpotTag" class="tour-spot-tag">📍 Wasatch Front · 3D Scan</div>
          </div>
        </div>

        <div class="tour-top-controls">
          <a id="tourExternalLaunchBtn" href="#" target="_blank" rel="noopener noreferrer" class="tour-hud-btn" style="display:none;" title="Open directly in new tab">
            ↗ <span class="hud-btn-lbl">OPEN SITE</span>
          </a>
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
        <iframe id="tourEmbedFrame" class="tour-embed-frame" allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer; autoplay; clipboard-write; web-share" style="display:none;"></iframe>
        
        <div class="tour-loader" id="tourLoader">
          <div class="tour-spinner"></div>
          <div class="tour-loader-text" id="tourLoaderTitle">ENTERING 360° SPACE...</div>
          <div class="tour-loader-sub" id="tourLoaderSub">Loading Virtual Tour View</div>
        </div>

        <div class="tour-compass-indicator" id="tourCompass">
          <div class="compass-dial" id="compassDial">▲ N</div>
        </div>

        <div class="tour-hotspots-layer" id="tourHotspotsLayer"></div>
      </div>

      <div class="tour-hud-bottom">
        <div class="tour-scene-selector" id="tourSceneSelector"></div>

        <div class="tour-gesture-hint" id="tourGestureHint">
          <span class="hint-icon">👆</span>
          <span>Drag to look 360° · Pinch or scroll to zoom · Tap 🧭 for phone motion</span>
        </div>

        <div class="tour-bottom-actions">
          <div class="tour-zoom-pill" id="tourZoomPill">
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
        text-decoration: none;
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
        background: #09080e;
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
        background: #000;
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
        transition: opacity 0.3s ease;
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
        background: linear-gradient(0deg, rgba(14, 12, 19, 0.96) 0%, rgba(14, 12, 19, 0.7) 65%, transparent 100%);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .tour-scene-selector {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 2px;
        scrollbar-width: none;
      }
      .tour-scene-selector::-webkit-scrollbar { display: none; }
      .tour-scene-pill {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #F5F1E8;
        padding: 6px 14px;
        border-radius: 999px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s;
      }
      .tour-scene-pill:hover {
        border-color: #FFD23F;
        color: #FFD23F;
      }
      .tour-scene-pill.active {
        background: #FFD23F;
        color: #14121A;
        border-color: #FFD23F;
        font-weight: 800;
        box-shadow: 0 2px 10px rgba(255, 210, 63, 0.3);
      }
      .tour-gesture-hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 10px;
        font-weight: 600;
        color: rgba(245, 241, 232, 0.6);
        text-align: center;
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
        background: rgba(20, 18, 26, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 999px;
        padding: 3px 8px;
        gap: 6px;
      }
      .zoom-btn {
        background: none;
        border: none;
        color: #FFD23F;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        padding: 2px 6px;
        line-height: 1;
      }
      .zoom-level {
        font-size: 10px;
        font-weight: 700;
        min-width: 36px;
        text-align: center;
        color: rgba(245, 241, 232, 0.85);
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
        background: #FFD23F;
        transform: translateY(-1px);
      }
    `;
    document.head.appendChild(style);
  }

  function bindViewerEvents() {
    const modal = document.getElementById('tour3dModal');
    if (!modal) return;

    const closeBtn = document.getElementById('tourCloseBtn');
    const autoRotateBtn = document.getElementById('tourAutoRotateBtn');
    const gyroBtn = document.getElementById('tourGyroBtn');
    const resetBtn = document.getElementById('tourResetBtn');
    const fullscreenBtn = document.getElementById('tourFullscreenBtn');
    const zoomInBtn = document.getElementById('tourZoomIn');
    const zoomOutBtn = document.getElementById('tourZoomOut');
    const container = document.getElementById('tourViewportContainer');

    if (closeBtn) closeBtn.onclick = () => window.close3dTourModal();

    window.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') {
        window.close3dTourModal();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        targetYaw -= 15;
        isAutoRotating = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        targetYaw += 15;
        isAutoRotating = false;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        targetPitch = Math.min(80, targetPitch + 10);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        targetPitch = Math.max(-80, targetPitch - 10);
      } else if (e.key === '+' || e.key === '=') {
        adjustZoom(-8);
      } else if (e.key === '-' || e.key === '_') {
        adjustZoom(8);
      }
    });

    if (autoRotateBtn) {
      autoRotateBtn.onclick = () => {
        isAutoRotating = !isAutoRotating;
        autoRotateBtn.classList.toggle('active', isAutoRotating);
        if (typeof showToast === 'function') {
          showToast(isAutoRotating ? '🔄 Auto-Rotation ON' : '⏸️ Auto-Rotation Paused');
        }
      };
    }

    if (resetBtn) {
      resetBtn.onclick = () => {
        targetYaw = 0;
        targetPitch = 0;
        targetFov = 75;
        if (typeof showToast === 'function') showToast('🎯 View Angle Centered');
      };
    }

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

    if (zoomInBtn) zoomInBtn.onclick = () => adjustZoom(-10);
    if (zoomOutBtn) zoomOutBtn.onclick = () => adjustZoom(10);

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

    if (container) {
      container.addEventListener('mousedown', (e) => {
        if (e.target.closest('.tour-hotspot-pin') || e.target.closest('button') || e.target.closest('iframe')) return;
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

        const sensitivity = fov / 480;
        targetYaw -= dx * sensitivity;
        targetPitch = Math.max(-80, Math.min(80, targetPitch + dy * sensitivity));

        velX = -dx * sensitivity;
        velY = dy * sensitivity;
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
      });

      container.addEventListener('wheel', (e) => {
        if (document.getElementById('tourEmbedFrame')?.style.display === 'block') return;
        e.preventDefault();
        adjustZoom(e.deltaY * 0.05);
      }, { passive: false });

      container.addEventListener('touchstart', (e) => {
        if (e.target.closest('.tour-hotspot-pin') || e.target.closest('button') || e.target.closest('iframe')) return;
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

          const sensitivity = fov / 440;
          targetYaw -= dx * sensitivity;
          targetPitch = Math.max(-80, Math.min(80, targetPitch + dy * sensitivity));

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

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          resizeCanvas();
        });
        resizeObserver.observe(container);
      }
    }

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
    const { beta, gamma } = event;
    if (beta === null || gamma === null) return;

    const orientation = window.orientation || 0;
    if (orientation === 0) {
      targetPitch = Math.max(-80, Math.min(80, beta - 45));
      targetYaw += gamma * 0.05;
    } else if (orientation === 90) {
      targetPitch = Math.max(-80, Math.min(80, -gamma));
      targetYaw += beta * 0.05;
    } else if (orientation === -90) {
      targetPitch = Math.max(-80, Math.min(80, gamma));
      targetYaw -= beta * 0.05;
    }
  }

  function resizeCanvas() {
    if (!canvas) canvas = document.getElementById('tour3dCanvas');
    if (!canvas) return;
    const container = document.getElementById('tourViewportContainer');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    let rectW = 0;
    let rectH = 0;
    if (container) {
      const rect = container.getBoundingClientRect();
      rectW = rect.width;
      rectH = rect.height;
    }
    if (!rectW || !rectH) {
      rectW = window.innerWidth || 800;
      rectH = window.innerHeight || 600;
    }

    const w = Math.max(100, Math.floor(rectW * dpr));
    const h = Math.max(100, Math.floor(rectH * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  /**
   * High-Performance 360° Equirectangular Sphere Projection Renderer
   */
  function renderFrame() {
    if (!canvas) canvas = document.getElementById('tour3dCanvas');
    if (!canvas) return;

    const embedFrame = document.getElementById('tourEmbedFrame');
    if (embedFrame && embedFrame.style.display === 'block') {
      // Embed iframe active: do not render WebGL/Canvas loop
      return;
    }

    if (canvas.width <= 10 || canvas.height <= 10) {
      resizeCanvas();
    }

    yaw += (targetYaw - yaw) * 0.14;
    pitch += (targetPitch - pitch) * 0.14;
    fov += (targetFov - fov) * 0.14;

    if (isAutoRotating && !isDragging && !gyroEnabled) {
      targetYaw += autoRotateSpeed;
      yaw += autoRotateSpeed;
    }

    while (yaw > 180) { yaw -= 360; targetYaw -= 360; }
    while (yaw < -180) { yaw += 360; targetYaw += 360; }

    const compassDial = document.getElementById('compassDial');
    if (compassDial) {
      compassDial.style.transform = `rotate(${Math.round(yaw)}deg)`;
    }

    const w = canvas.width || 800;
    const h = canvas.height || 600;

    if (!ctx) ctx = canvas.getContext('2d');

    const renderImg = (imageLoaded && currentImage) ? currentImage : getSceneProceduralCanvas(activeSceneList[activeSceneIndex]?.id || '360-main');

    if (renderImg) {
      const imgW = renderImg.naturalWidth || renderImg.width || 2048;
      const imgH = renderImg.naturalHeight || renderImg.height || 1024;

      const fovH = fov * (Math.PI / 180);
      const fovV = fovH * (h / w);

      const normYaw = ((yaw + 180) % 360 + 360) % 360;
      const centerU = normYaw / 360;
      const clampedPitch = Math.max(-80, Math.min(80, pitch));
      const centerV = 0.5 - (clampedPitch / 180);

      const spanU = Math.min(0.99, fovH / (2 * Math.PI));
      const spanV = Math.min(0.92, fovV / Math.PI);

      const srcW = spanU * imgW;
      const srcH = spanV * imgH;
      const srcX = (centerU * imgW) - (srcW / 2);
      const srcY = Math.max(0, Math.min(imgH - srcH, (centerV * imgH) - (srcH / 2)));

      ctx.clearRect(0, 0, w, h);

      if (srcX < 0) {
        const leftWidth = -srcX;
        const leftRatio = leftWidth / srcW;
        ctx.drawImage(
          renderImg,
          imgW - leftWidth, srcY, leftWidth, srcH,
          0, 0, w * leftRatio, h
        );
        ctx.drawImage(
          renderImg,
          0, srcY, srcW - leftWidth, srcH,
          w * leftRatio, 0, w * (1 - leftRatio), h
        );
      } else if (srcX + srcW > imgW) {
        const rightWidth = (srcX + srcW) - imgW;
        const mainWidth = srcW - rightWidth;
        const mainRatio = mainWidth / srcW;
        ctx.drawImage(
          renderImg,
          srcX, srcY, mainWidth, srcH,
          0, 0, w * mainRatio, h
        );
        ctx.drawImage(
          renderImg,
          0, srcY, rightWidth, srcH,
          w * mainRatio, 0, w * (1 - mainRatio), h
        );
      } else {
        ctx.drawImage(
          renderImg,
          srcX, srcY, srcW, srcH,
          0, 0, w, h
        );
      }

      const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.88);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(8,6,12,0.3)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

    } else {
      ctx.fillStyle = '#14121A';
      ctx.fillRect(0, 0, w, h);
    }

    updateHotspotsPositions(w, h);

    animFrameId = requestAnimationFrame(renderFrame);
  }

  function updateHotspotsPositions() {
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
    if (rect.width === 0 || rect.height === 0) return;

    const fovH = fov * (Math.PI / 180);
    const fovV = fovH * (rect.height / rect.width);

    let html = '';
    currentScene.hotspots.forEach((hs) => {
      let dYaw = hs.yaw - yaw;
      while (dYaw > 180) dYaw -= 360;
      while (dYaw < -180) dYaw += 360;

      const dPitch = hs.pitch - pitch;

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
    const loaderTitle = document.getElementById('tourLoaderTitle');
    const loaderSub = document.getElementById('tourLoaderSub');
    if (loader) loader.classList.remove('hidden');

    const titleEl = document.getElementById('tourSpotTitle');
    const tagEl = document.getElementById('tourSpotTag');
    const badgeEl = document.getElementById('tourProviderBadge');
    const ctaEl = document.getElementById('tourCtaLink');
    const externalLaunchBtn = document.getElementById('tourExternalLaunchBtn');
    const compassEl = document.getElementById('tourCompass');
    const zoomPill = document.getElementById('tourZoomPill');
    const gestureHint = document.getElementById('tourGestureHint');

    const rawTour = scene.tourUrl || currentTourData?.tourUrl || scene.panoUrl || currentTourData?.panoUrl || '';
    const norm = normalize3dTourUrl(rawTour);

    if (titleEl) titleEl.textContent = scene.name || currentTourData?.title || '360° Location Scan';
    if (tagEl) tagEl.textContent = `📍 ${scene.location || 'Wasatch Front, UT'} · ${scene.tag || norm.provider || '360° Spatial Scan'}`;
    if (badgeEl) badgeEl.textContent = norm.provider && norm.provider !== 'none' ? `360° ${norm.provider.toUpperCase()} SPACE` : '360° 3D IMMERSIVE SPACE';

    if (ctaEl) {
      if (currentTourData?.link && currentTourData.link !== '#') {
        ctaEl.href = currentTourData.link;
        ctaEl.textContent = `${currentTourData.cta || 'Visit Website'} ↗`;
        ctaEl.style.display = 'inline-flex';
      } else {
        ctaEl.style.display = 'none';
      }
    }

    // Direct external launch button for provider links
    if (externalLaunchBtn) {
      const orig = scene.originalUrl || norm.originalUrl || norm.url;
      if (orig && (orig.startsWith('http://') || orig.startsWith('https://'))) {
        externalLaunchBtn.href = orig;
        externalLaunchBtn.style.display = 'inline-flex';
        externalLaunchBtn.querySelector('.hud-btn-lbl').textContent = norm.provider === '360Cities' ? '360CITIES ↗' : 'EXTERNAL ↗';
      } else {
        externalLaunchBtn.style.display = 'none';
      }
    }

    renderSceneSelector();

    const embedFrame = document.getElementById('tourEmbedFrame');
    const canvasEl = document.getElementById('tour3dCanvas');

    if (norm.isEmbed) {
      // External 360 / VR Embed (360Cities, Kuula, Matterport, Polycam, etc.)
      if (loaderTitle) loaderTitle.textContent = `LOADING ${norm.provider.toUpperCase()} 360°...`;
      if (loaderSub) loaderSub.textContent = 'Launching interactive immersive viewer';

      if (compassEl) compassEl.style.display = 'none';
      if (zoomPill) zoomPill.style.display = 'none';
      if (gestureHint) gestureHint.style.display = 'none';

      if (canvasEl) canvasEl.style.display = 'none';
      if (embedFrame) {
        embedFrame.style.display = 'block';
        embedFrame.src = norm.url;

        embedFrame.onload = () => {
          if (loader) loader.classList.add('hidden');
        };

        // Safety timeout in case provider iframe blocks onload event
        setTimeout(() => {
          if (loader) loader.classList.add('hidden');
        }, 1200);
      }

      // Stop canvas animation frame
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      return;
    }

    // Equirectangular 360° Photo / Canvas Sphere
    if (compassEl) compassEl.style.display = 'flex';
    if (zoomPill) zoomPill.style.display = 'inline-flex';
    if (gestureHint) gestureHint.style.display = 'flex';

    if (embedFrame) {
      embedFrame.style.display = 'none';
      embedFrame.src = 'about:blank';
    }
    if (canvasEl) {
      canvasEl.style.display = 'block';
    }

    currentImage = getSceneProceduralCanvas(scene.id);
    imageLoaded = true;

    if (loader) {
      setTimeout(() => loader.classList.add('hidden'), 200);
    }

    const targetUrl = norm.isImage ? norm.url : (scene.panoUrl || currentTourData?.panoUrl);
    if (targetUrl && targetUrl !== currentPanoUrl && (targetUrl.startsWith('http') || targetUrl.startsWith('data:') || targetUrl.startsWith('blob:') || targetUrl.startsWith('/'))) {
      currentPanoUrl = targetUrl;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        currentImage = img;
        imageLoaded = true;
      };
      img.onerror = () => {
        currentImage = getSceneProceduralCanvas(scene.id);
      };
      img.src = targetUrl;
    }

    if (!animFrameId) {
      animFrameId = requestAnimationFrame(renderFrame);
    }
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

    const rawTour = options.tourUrl || options.panoUrl || '';
    if (rawTour) {
      const norm = normalize3dTourUrl(rawTour);
      activeSceneList = [
        {
          id: 'custom-spot',
          name: options.title || '360° Location View',
          location: options.location || 'Salt Lake City, UT',
          tag: options.tag || (norm.provider ? `360° ${norm.provider}` : '360° Virtual Space'),
          panoUrl: norm.isImage ? norm.url : '',
          tourUrl: norm.isEmbed ? norm.url : '',
          originalUrl: norm.originalUrl || rawTour,
          blurb: options.blurb || '',
          hotspots: []
        },
        ...DEMO_SCENES.slice(0, 3)
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
    
    modal.classList.add('active');
    
    resizeCanvas();
    requestAnimationFrame(() => resizeCanvas());
    setTimeout(() => resizeCanvas(), 60);
    setTimeout(() => resizeCanvas(), 250);

    loadScene(0);

    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(renderFrame);

    if (typeof showToast === 'function') {
      showToast(`🔦 Stepped Inside 360° Space: ${options.title || '360 · Salt Lake City'}`);
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

  window.normalize3dTourUrl = normalize3dTourUrl;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initViewerElements();
      injectViewerStyles();
    });
  } else {
    initViewerElements();
    injectViewerStyles();
  }

  console.log('[SpotLIGHT] 360° Immersive Viewer Engine initialized with 360Cities & Multi-Provider Embed Normalizer');
})();
