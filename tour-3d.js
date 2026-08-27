/**
 * SpotLIGHT 3D / 360° Immersive Photosphere & Walkthrough Tour Engine
 * 
 * Powered by Three.js WebGL Rectilinear Projection
 * 
 * Features:
 * - True Rectilinear 360° Photosphere Rendering (Zero fisheye / circular distortion, 100% natural perspective like Kuula, ThingLink, Matterport)
 * - Universal URL Normalizer (Kuula, ThingLink, Matterport, 360Cities, Momento360, Polycam, YouTube 360, Google Maps, direct 360 photos)
 * - Interactive Hotspot Engine with exact 3D Vector Projection
 * - Add/Edit/Delete Hotspot Doors with Live Camera Orientation Capture
 * - Add New 360 Rooms via File Upload (Supabase Cloud Storage), Preset Photospheres, or Custom 360 URLs
 * - Cloud Persistence via Supabase for all visitors ("SAVE TOUR FOR EVERYONE")
 * - Inertial Touch Drag, Mouse Drag, Keyboard (WASD / Arrows), Gyroscope & Pinch/Wheel Zoom (FOV 35° to 95°)
 */

(function () {
  'use strict';

  /**
   * Universal URL Normalizer for 360 VR & Photosphere Providers
   */
  function normalize3dTourUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { isEmbed: false, isImage: false, url: '', provider: 'none', originalUrl: '' };
    }
    let trimmed = rawUrl.trim();
    if (!trimmed) {
      return { isEmbed: false, isImage: false, url: '', provider: 'none', originalUrl: '' };
    }

    // 0. Extract src from <iframe> snippet if user pasted embed HTML
    if (trimmed.includes('<iframe') || trimmed.includes('<IFRAME')) {
      const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        trimmed = srcMatch[1].trim();
      }
    }

    // 1. Kuula (e.g. https://kuula.co/share/XXXX or https://kuula.co/post/XXXX)
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

    // 2. ThingLink (e.g. https://www.thinglink.com/scene/XXXX, https://www.thinglink.com/mediacard/XXXX, https://www.thinglink.com/card/XXXX)
    const matchThingLink = trimmed.match(/thinglink\.com\/(scene|mediacard|card)\/([a-zA-Z0-9_-]+)/i);
    if (matchThingLink) {
      const id = matchThingLink[2];
      return {
        isEmbed: true,
        isImage: false,
        url: `https://www.thinglink.com/card/${id}`,
        provider: 'ThingLink',
        originalUrl: trimmed
      };
    }

    // 3. 360Cities (e.g. https://www.360cities.net/image/ensign-peak-01-salt-lake-city-utah-usa)
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

    // 4. Matterport (e.g. https://my.matterport.com/show/?m=XXXXX)
    if (trimmed.includes('matterport.com')) {
      let embedUrl = trimmed;
      if (!embedUrl.includes('&play=1') && !embedUrl.includes('?play=1')) {
        embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'play=1&qs=1';
      }
      return { isEmbed: true, isImage: false, url: embedUrl, provider: 'Matterport', originalUrl: trimmed };
    }

    // 5. Polycam (e.g. https://poly.cam/capture/XXXXX or https://poly.cam/embed/XXXXX)
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

    // 6. Momento360 (e.g. https://momento360.com/e/u/XXXX or https://momento360.com/e/p/XXXX)
    if (trimmed.includes('momento360.com')) {
      let embedUrl = trimmed;
      if (!embedUrl.includes('autostart=')) {
        embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'autostart=true';
      }
      return { isEmbed: true, isImage: false, url: embedUrl, provider: 'Momento360', originalUrl: trimmed };
    }

    // 7. Pannellum (Free Open-Source 360 & Tour Viewer)
    if (trimmed.includes('pannellum.org') || trimmed.includes('pannellum.htm')) {
      return { isEmbed: true, isImage: false, url: trimmed, provider: 'Pannellum', originalUrl: trimmed };
    }

    // 8. YouTube 360 / VR Videos
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

    // 9. Google Maps / Street View / Photosphere
    if (trimmed.includes('google.com/maps') || trimmed.includes('goo.gl/maps')) {
      return { isEmbed: true, isImage: false, url: trimmed, provider: 'Google Maps', originalUrl: trimmed };
    }

    // 10. Direct 360 Equirectangular Image (Stored in Supabase, Cloudinary, Imgur, Unsplash, etc.)
    if (/\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i.test(trimmed) || trimmed.startsWith('data:image/') || trimmed.startsWith('blob:') || trimmed.includes('images.unsplash.com') || trimmed.includes('cloudinary.com') || trimmed.includes('imgur.com') || trimmed.includes('supabase.co/storage')) {
      return { isEmbed: false, isImage: true, url: trimmed, provider: 'Equirectangular Photo', originalUrl: trimmed };
    }

    // Generic web embed fallback
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { isEmbed: true, isImage: false, url: trimmed, provider: '360 Interactive Space', originalUrl: trimmed };
    }

    return { isEmbed: false, isImage: false, url: trimmed, provider: 'unknown', originalUrl: trimmed };
  }

  // 360° Walk-In Tour Scenes with High-Definition Equirectangular Spherical Panoramas
  const SLC_WALK_SCENES = [
    {
      id: 'slc-entrance',
      name: 'SpotLIGHT SLC · Street Entrance & Walk-In',
      location: 'Downtown Salt Lake City, UT',
      tag: 'Walk-In Entrance · Step Inside',
      panoUrl: 'https://pannellum.org/images/alma.jpg',
      blurb: 'Exterior entrance to SpotLIGHT Salt Lake City. Look toward the doorway marker to step inside.',
      hotspots: [
        { pitch: -3, yaw: -85, label: '🚪 Step Inside Studio', targetScene: 'slc-studio' },
        { pitch: 4, yaw: 65, label: '🌴 Wasatch Sky Patio', targetScene: 'slc-patio' }
      ]
    },
    {
      id: 'slc-studio',
      name: 'SpotLIGHT SLC · Main Studio & Workspace',
      location: 'Downtown Salt Lake City, UT',
      tag: 'Creative Studio · Interior',
      panoUrl: 'https://pannellum.org/images/bma-0.jpg',
      blurb: 'Creative production floor, high ceilings, desks, and gallery walls.',
      hotspots: [
        { pitch: -2, yaw: 175, label: '🚪 Walk Back to Street', targetScene: 'slc-entrance' },
        { pitch: -1, yaw: 75, label: '🍸 VIP Speakeasy & Lounge', targetScene: 'slc-lounge' }
      ]
    },
    {
      id: 'slc-lounge',
      name: 'SpotLIGHT SLC · VIP Speakeasy & Bar',
      location: 'Downtown Salt Lake City, UT',
      tag: 'Curated Seating & Bar',
      panoUrl: 'https://pannellum.org/images/cerro-toco-0.jpg',
      blurb: 'Craft mixology, leather booths, and curated ambient lighting.',
      hotspots: [
        { pitch: 0, yaw: -85, label: '📍 Back to Main Studio', targetScene: 'slc-studio' }
      ]
    },
    {
      id: 'slc-patio',
      name: 'SpotLIGHT SLC · Sky Patio & Mountain Views',
      location: 'Downtown Salt Lake City, UT',
      tag: 'Wasatch Mountain Overlook',
      panoUrl: 'https://pannellum.org/images/jfk.jpg',
      blurb: 'Panoramic open-air terrace with views of the Wasatch Front peaks.',
      hotspots: [
        { pitch: 0, yaw: 110, label: '🚪 Step Inside Studio', targetScene: 'slc-studio' }
      ]
    }
  ];

  // Preset 360 equirectangular photospheres for quick selection in modal
  const PRESET_360_PANOS = [
    { name: '🏛️ Modern Walk-In Entrance', url: 'https://pannellum.org/images/alma.jpg', tag: 'Exterior & Street' },
    { name: '🎨 Creative Studio & Workspace', url: 'https://pannellum.org/images/bma-0.jpg', tag: 'Indoor Studio' },
    { name: '🍸 Speakeasy Bar & Lounge', url: 'https://pannellum.org/images/cerro-toco-0.jpg', tag: 'Lounge & Bar' },
    { name: '🌄 Wasatch Sky Patio Overlook', url: 'https://pannellum.org/images/jfk.jpg', tag: 'Outdoor Vista' }
  ];

  // Global Tour Viewer State
  let activeSceneList = JSON.parse(JSON.stringify(SLC_WALK_SCENES));
  let activeSceneIndex = 0;
  let currentTourData = null;
  let isEditorMode = false;

  // Camera & Navigation State
  let yaw = 0;
  let pitch = 0;
  let fov = 75;
  let targetYaw = 0;
  let targetPitch = 0;
  let targetFov = 75;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let velX = 0;
  let velY = 0;
  let lastPinchDist = null;

  let isAutoRotating = false;
  let autoRotateSpeed = 0.12;
  let gyroEnabled = false;
  let animFrameId = null;
  let currentPanoUrl = null;

  // Three.js Core Objects
  let threeRenderer = null;
  let threeScene = null;
  let threeCamera = null;
  let threeSphere = null;
  let threeTextureLoader = null;
  let currentTexture = null;

  // Fallback 2D Canvas Context
  let canvas2d = null;
  let ctx2d = null;

  // Procedural Canvas Cache
  const proceduralPanoCache = {};

  /**
   * Generates a rich 2048x1024 360° Equirectangular texture
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

    // Ambient Space Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    skyGrad.addColorStop(0, '#0a0812');
    skyGrad.addColorStop(0.5, '#161324');
    skyGrad.addColorStop(1, '#2c2242');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.5);

    const floorGrad = ctx.createLinearGradient(0, h * 0.5, 0, h);
    floorGrad.addColorStop(0, '#1c1724');
    floorGrad.addColorStop(0.5, '#120f18');
    floorGrad.addColorStop(1, '#08060c');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);

    // Architectural Perspective Grid
    ctx.strokeStyle = 'rgba(255, 210, 63, 0.15)';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Horizon Line
    ctx.strokeStyle = '#FFD23F';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();

    // Studio Banner in Panorama
    ctx.fillStyle = '#FFD23F';
    ctx.font = 'bold 44px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FFD23F';
    ctx.shadowBlur = 18;
    ctx.fillText('SpotLIGHT · 360° IMMERSIVE STUDIO', w * 0.5, h * 0.38);
    ctx.font = '22px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#3FDDE0';
    ctx.fillText('📍 Wasatch Front · Move Camera or Tap Doors to Walk Around', w * 0.5, h * 0.44);
    ctx.shadowBlur = 0;

    proceduralPanoCache[sceneId] = c;
    return c;
  }

  /**
   * Initializes Three.js WebGL Rectilinear Renderer
   */
  function initThreeEngine() {
    if (typeof THREE === 'undefined') {
      console.warn('[SpotLIGHT 360] Three.js not found in global scope.');
      return false;
    }

    const canvas = document.getElementById('tour3dCanvas');
    const container = document.getElementById('tourViewportContainer');
    if (!canvas || !container) return false;

    if (threeRenderer) return true;

    try {
      const rect = container.getBoundingClientRect();
      const width = Math.max(100, Math.floor(rect.width || window.innerWidth || 800));
      const height = Math.max(100, Math.floor(rect.height || window.innerHeight || 600));

      threeRenderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      threeRenderer.setSize(width, height);

      threeScene = new THREE.Scene();
      threeCamera = new THREE.PerspectiveCamera(targetFov, width / height, 1, 1500);

      // Inverted Sphere Geometry (inside of sphere faces the camera)
      const geometry = new THREE.SphereGeometry(500, 64, 32);
      geometry.scale(-1, 1, 1);

      const material = new THREE.MeshBasicMaterial();
      threeSphere = new THREE.Mesh(geometry, material);
      threeScene.add(threeSphere);

      threeTextureLoader = new THREE.TextureLoader();
      threeTextureLoader.crossOrigin = 'anonymous';

      return true;
    } catch (err) {
      console.error('[SpotLIGHT 360] WebGL Three.js init error:', err);
      return false;
    }
  }

  /**
   * Loads Equirectangular Texture into Three.js Sphere
   */
  function loadThreePanoTexture(urlOrCanvas) {
    if (!threeSphere) {
      if (!initThreeEngine()) return;
    }
    const loader = document.getElementById('tourLoader');

    if (typeof urlOrCanvas === 'string' && urlOrCanvas) {
      threeTextureLoader.load(
        urlOrCanvas,
        (texture) => {
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          
          if (currentTexture) currentTexture.dispose();
          currentTexture = texture;
          threeSphere.material.map = texture;
          threeSphere.material.needsUpdate = true;

          if (loader) loader.classList.add('hidden');
        },
        undefined,
        (err) => {
          console.warn('[SpotLIGHT 360] Remote texture load notice, using procedural backdrop:', err);
          const fallbackCanvas = getSceneProceduralCanvas(activeSceneList[activeSceneIndex]?.id || '360-fallback');
          const texture = new THREE.CanvasTexture(fallbackCanvas);
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;

          if (currentTexture) currentTexture.dispose();
          currentTexture = texture;
          threeSphere.material.map = texture;
          threeSphere.material.needsUpdate = true;

          if (loader) loader.classList.add('hidden');
        }
      );
    } else {
      const srcCanvas = (urlOrCanvas instanceof HTMLCanvasElement) ? urlOrCanvas : getSceneProceduralCanvas(activeSceneList[activeSceneIndex]?.id || '360-main');
      const texture = new THREE.CanvasTexture(srcCanvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      if (currentTexture) currentTexture.dispose();
      currentTexture = texture;
      threeSphere.material.map = texture;
      threeSphere.material.needsUpdate = true;

      if (loader) loader.classList.add('hidden');
    }
  }

  /**
   * Injects HTML UI & CSS Modal into DOM
   */
  function injectTourModalHtml() {
    if (document.getElementById('tour3dModal')) return;

    const style = document.createElement('style');
    style.id = 'tour3dStyles';
    style.textContent = `
      #tour3dModal {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: #09080e;
        display: none;
        flex-direction: column;
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        overflow: hidden;
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        color: #F5F1E8;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
      }
      #tour3dModal.active {
        display: flex;
      }

      /* Top HUD */
      .tour-hud-top {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 20;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: linear-gradient(180deg, rgba(14, 12, 19, 0.95) 0%, rgba(14, 12, 19, 0.6) 70%, transparent 100%);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .tour-brand-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .tour-badge-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tour-live-badge {
        background: #FF4D6D;
        color: #fff;
        font-size: 9px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 999px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        animation: tourPulse 2s infinite ease-in-out;
      }
      @keyframes tourPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(0.96); }
      }
      .tour-type-badge {
        background: rgba(255, 210, 63, 0.15);
        color: #FFD23F;
        border: 1px solid rgba(255, 210, 63, 0.35);
        font-size: 9px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        letter-spacing: 0.05em;
      }
      .tour-spot-title {
        font-family: 'Syne', 'Anton', sans-serif;
        font-size: 15px;
        font-weight: 800;
        color: #F5F1E8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 260px;
        margin: 0;
      }
      .tour-spot-tag {
        font-size: 11px;
        color: rgba(245, 241, 232, 0.75);
      }

      .tour-top-controls {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .tour-hud-btn {
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #F5F1E8;
        padding: 6px 11px;
        border-radius: 8px;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: all 0.15s;
        touch-action: manipulation;
        min-height: 36px;
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
        font-size: 13px;
        font-weight: 800;
        padding: 6px 12px;
      }
      .tour-close-btn:hover {
        background: #e03353;
        color: #fff;
      }
      @media (max-width: 640px) {
        .hud-btn-lbl { display: none; }
        .tour-hud-btn { padding: 6px 8px; }
      }

      /* Viewport Container */
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
        width: 42px;
        height: 42px;
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

      /* Compass Dial */
      .tour-compass-indicator {
        position: absolute;
        top: 75px;
        right: 18px;
        z-index: 15;
        background: rgba(14, 12, 19, 0.75);
        border: 1px solid rgba(255, 210, 63, 0.4);
        border-radius: 50%;
        width: 38px;
        height: 38px;
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

      /* Hotspots in 3D Scene */
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
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(14, 12, 19, 0.92);
        border: 2px solid #FFD23F;
        color: #fff;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.03em;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.75), 0 0 14px rgba(255, 210, 63, 0.4);
        transition: transform 0.12s ease, background 0.12s ease;
        white-space: nowrap;
      }
      .tour-hotspot-pin:hover {
        transform: translate(-50%, -50%) scale(1.08);
        background: #FFD23F;
        color: #14121A;
      }
      .tour-hotspot-pin.editor-pin {
        border-color: #06D6A0;
        background: rgba(6, 214, 160, 0.25);
        color: #fff;
      }
      .hotspot-del-btn {
        background: #FF4D6D;
        color: #fff;
        border: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        font-size: 10px;
        font-weight: 900;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: 4px;
        transition: background 0.15s, transform 0.15s;
      }
      .hotspot-del-btn:hover {
        background: #ff1c45;
        transform: scale(1.15);
      }
      .tour-hotspot-pulse {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #FFD23F;
        box-shadow: 0 0 8px #FFD23F;
        animation: hsPulse 1.5s infinite;
      }
      @keyframes hsPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.4); opacity: 0.6; }
      }

      /* Editor Tool Bar Overlay */
      .tour-editor-bar {
        position: absolute;
        top: 70px;
        left: 16px;
        z-index: 25;
        background: rgba(14, 12, 19, 0.94);
        border: 1.5px solid #06D6A0;
        border-radius: 10px;
        padding: 8px 12px;
        display: none;
        align-items: center;
        gap: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        animation: slideInBar 0.2s ease-out;
      }
      @keyframes slideInBar {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .tour-editor-bar.active {
        display: flex;
        flex-wrap: wrap;
      }
      .tour-editor-pill {
        background: rgba(6, 214, 160, 0.2);
        color: #06D6A0;
        border: 1px solid rgba(6, 214, 160, 0.4);
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        font-family: monospace;
      }
      .tour-editor-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tour-ed-btn {
        background: #06D6A0;
        color: #0d1b1e;
        border: none;
        padding: 6px 11px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.15s;
        letter-spacing: 0.03em;
        white-space: nowrap;
      }
      .tour-ed-btn:hover {
        background: #05b386;
        transform: translateY(-1px);
      }
      .tour-ed-btn.tour-ed-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.25);
      }
      .tour-ed-btn.tour-ed-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .tour-ed-btn.tour-ed-danger {
        background: rgba(255, 77, 109, 0.2);
        color: #FF4D6D;
        border: 1px solid rgba(255, 77, 109, 0.5);
      }
      .tour-ed-btn.tour-ed-danger:hover {
        background: #FF4D6D;
        color: #fff;
      }
      .tour-ed-btn.tour-ed-save {
        background: linear-gradient(135deg, #FFD23F 0%, #FF4D6D 100%);
        color: #14121A;
        font-weight: 900;
      }
      .tour-ed-btn.tour-ed-save:hover {
        transform: translateY(-1px) scale(1.03);
        box-shadow: 0 4px 14px rgba(255, 77, 109, 0.4);
      }

      /* Modal Dialog Overlays & Cards */
      .tour-dialog-overlay {
        position: absolute;
        inset: 0;
        z-index: 50;
        background: rgba(10, 8, 14, 0.82);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: fadeInDialog 0.2s ease-out;
      }
      @keyframes fadeInDialog {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
      .tour-dialog-card {
        background: #14121A;
        border: 2px solid #06D6A0;
        border-radius: 14px;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 214, 160, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .tour-dialog-header {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(255, 255, 255, 0.03);
      }
      .tour-dialog-title {
        font-size: 13px;
        font-weight: 800;
        color: #FFD23F;
        letter-spacing: 0.03em;
      }
      .tour-dialog-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 16px;
        font-weight: 800;
        cursor: pointer;
        padding: 4px 8px;
      }
      .tour-dialog-close:hover {
        color: #FF4D6D;
      }
      .tour-dialog-body {
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 70vh;
        overflow-y: auto;
      }
      .tour-dialog-info {
        font-size: 11px;
        font-weight: 700;
        color: #06D6A0;
        background: rgba(6, 214, 160, 0.1);
        padding: 6px 10px;
        border-radius: 6px;
        border: 1px solid rgba(6, 214, 160, 0.25);
      }
      .tour-field-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .tour-field-label {
        font-size: 11px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.9);
      }
      .tour-dialog-input, .tour-dialog-select {
        width: 100%;
        background: rgba(255, 255, 255, 0.07);
        border: 1.5px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        padding: 9px 11px;
        border-radius: 8px;
        font-size: 12px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s;
      }
      .tour-dialog-input:focus, .tour-dialog-select:focus {
        border-color: #FFD23F;
        background: rgba(255, 255, 255, 0.1);
      }
      .tour-dialog-select option {
        background: #14121A;
        color: #fff;
      }
      .tour-quick-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      .tour-chip {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s;
      }
      .tour-chip:hover {
        background: #FFD23F;
        color: #14121A;
        border-color: #FFD23F;
      }
      .tour-source-tabs {
        display: flex;
        gap: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        padding-bottom: 8px;
      }
      .tour-src-tab {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.8);
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
      }
      .tour-src-tab.active {
        background: #FFD23F;
        color: #14121A;
        border-color: #FFD23F;
        font-weight: 800;
      }
      .tour-dropzone {
        border: 2px dashed rgba(255, 210, 63, 0.5);
        background: rgba(255, 210, 63, 0.04);
        border-radius: 10px;
        padding: 18px 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .tour-dropzone:hover {
        border-color: #FFD23F;
        background: rgba(255, 210, 63, 0.1);
      }
      .dropzone-icon {
        font-size: 22px;
      }
      .dropzone-text {
        font-size: 11px;
        font-weight: 700;
        color: #FFD23F;
      }
      .dropzone-hint {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
      }
      .tour-upload-status {
        font-size: 11px;
        font-weight: 700;
        padding: 7px 10px;
        border-radius: 6px;
        margin-top: 6px;
        text-align: center;
      }
      .tour-presets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 8px;
      }
      .preset-card-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1.5px solid rgba(255, 255, 255, 0.15);
        color: #fff;
        padding: 9px;
        border-radius: 8px;
        text-align: left;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 3px;
        transition: all 0.15s;
      }
      .preset-card-btn:hover {
        border-color: #FFD23F;
        background: rgba(255, 210, 63, 0.12);
      }
      .preset-card-btn.selected {
        border-color: #06D6A0;
        background: rgba(6, 214, 160, 0.18);
      }
      .preset-card-name {
        font-size: 11px;
        font-weight: 800;
        color: #FFD23F;
      }
      .preset-card-tag {
        font-size: 9px;
        color: rgba(255, 255, 255, 0.6);
      }
      .tour-dialog-footer {
        padding: 10px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        background: rgba(255, 255, 255, 0.02);
      }
      .tour-dialog-btn {
        padding: 7px 14px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        border: none;
        transition: all 0.15s;
      }
      .tour-dialog-btn-cancel {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      .tour-dialog-btn-cancel:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .tour-dialog-btn-confirm {
        background: #06D6A0;
        color: #0d1b1e;
      }
      .tour-dialog-btn-confirm:hover {
        background: #05b386;
        transform: translateY(-1px);
      }
      .tour-dialog-btn-secondary {
        background: rgba(6, 214, 160, 0.15);
        color: #06D6A0;
        border: 1px solid rgba(6, 214, 160, 0.3);
        width: 100%;
      }
      .tour-dialog-btn-secondary:hover {
        background: rgba(6, 214, 160, 0.25);
      }
      .tour-dialog-btn-danger {
        background: rgba(255, 77, 109, 0.2);
        color: #FF4D6D;
        border: 1px solid rgba(255, 77, 109, 0.4);
      }
      .tour-dialog-btn-danger:hover {
        background: #FF4D6D;
        color: #fff;
      }

      /* Bottom HUD */
      .tour-hud-bottom {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 20;
        padding: 12px 16px max(12px, env(safe-area-inset-bottom));
        background: linear-gradient(0deg, rgba(14, 12, 19, 0.96) 0%, rgba(14, 12, 19, 0.7) 65%, transparent 100%);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        flex-direction: column;
        gap: 8px;
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
        padding: 5px 12px;
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
      .tour-scene-pill-wrap {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        background: rgba(255, 255, 255, 0.05);
        padding: 2px 4px 2px 2px;
        border-radius: 999px;
      }
      .tour-pill-edit-btn, .tour-pill-del-btn {
        background: rgba(14, 12, 19, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.25);
        color: #fff;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        font-size: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s;
      }
      .tour-pill-edit-btn:hover {
        background: #FFD23F;
        color: #14121A;
        border-color: #FFD23F;
        transform: scale(1.15);
      }
      .tour-pill-del-btn:hover {
        background: #FF4D6D;
        color: #fff;
        border-color: #FF4D6D;
        transform: scale(1.15);
      }
      .manage-room-row {
        background: rgba(255, 255, 255, 0.05);
        border: 1.5px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        transition: all 0.15s;
      }
      .manage-room-row.current-scene {
        border-color: #06D6A0;
        background: rgba(6, 214, 160, 0.08);
      }
      .manage-room-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }
      .manage-room-title {
        font-size: 12px;
        font-weight: 800;
        color: #FFD23F;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .manage-room-tag {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.65);
      }
      .manage-room-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tour-hs-item {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 6px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
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
        padding: 7px 16px;
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

      /* ========================================================= */
      /* 360 ROOM SCANNER & EQUIRECTANGULAR STITCHER HUD STYLES    */
      /* ========================================================= */
      .tour-camera-scanner-container {
        width: 100vw;
        height: 100vh;
        max-width: 100%;
        max-height: 100%;
        background: #0d0b12;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
      }
      .scan-header {
        padding: 10px 16px;
        background: rgba(14, 12, 19, 0.95);
        border-bottom: 1.5px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        z-index: 20;
      }
      .scan-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .scan-title {
        font-size: 13px;
        font-weight: 900;
        color: #FFD23F;
        letter-spacing: 0.05em;
      }
      .scan-pill {
        font-size: 10px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #06D6A0;
      }
      .scan-header-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .scan-btn-small {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.25);
        color: #fff;
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.15s;
      }
      .scan-btn-small:hover {
        background: #FFD23F;
        color: #14121A;
      }
      .scan-btn-close {
        background: rgba(255, 77, 109, 0.2);
        border: 1px solid rgba(255, 77, 109, 0.4);
        color: #FF4D6D;
        font-size: 14px;
        font-weight: 900;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
      }
      .scan-btn-close:hover {
        background: #FF4D6D;
        color: #fff;
      }
      .scan-viewfinder-area {
        flex: 1;
        position: relative;
        overflow: hidden;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #scanVideoFeed {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .scan-reticle-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .scan-center-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 110px;
        height: 110px;
        transform: translate(-50%, -50%);
        border: 2.5px solid rgba(255, 210, 63, 0.75);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.12);
      }
      .scan-center-ring.aligned {
        border-color: #06D6A0;
        border-style: solid;
        border-width: 3.5px;
        box-shadow: 0 0 28px rgba(6, 214, 160, 0.75), 0 0 0 9999px rgba(0,0,0,0.08);
        transform: translate(-50%, -50%) scale(1.08);
      }
      .scan-crosshair-h {
        position: absolute;
        width: 24px;
        height: 2px;
        background: rgba(255, 255, 255, 0.6);
      }
      .scan-crosshair-v {
        position: absolute;
        width: 2px;
        height: 24px;
        background: rgba(255, 255, 255, 0.6);
      }
      .scan-center-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #FFD23F;
      }
      .scan-center-ring.aligned .scan-center-dot {
        background: #06D6A0;
        box-shadow: 0 0 10px #06D6A0;
      }
      .scan-ring-status {
        position: absolute;
        bottom: -28px;
        font-size: 10px;
        font-weight: 800;
        color: #FFD23F;
        background: rgba(14, 12, 19, 0.85);
        padding: 2px 8px;
        border-radius: 999px;
        white-space: nowrap;
        border: 1px solid rgba(255, 210, 63, 0.3);
      }
      .scan-center-ring.aligned .scan-ring-status {
        color: #06D6A0;
        border-color: #06D6A0;
        background: rgba(6, 214, 160, 0.15);
      }
      .scan-nodes-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .scan-node-marker {
        position: absolute;
        left: 0;
        top: 0;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 900;
        /* JS drives transform: translate3d(x,y,0) translate(-50%,-50%) — zero layout thrash */
        transition: opacity 0.2s ease, background 0.2s, border-color 0.2s, box-shadow 0.2s, width 0.15s, height 0.15s;
        box-shadow: 0 1px 8px rgba(0, 0, 0, 0.55);
        will-change: transform, opacity;
        z-index: 5;
      }
      .scan-node-marker.pending {
        background: rgba(255, 255, 255, 0.92);
        border: 2.5px solid rgba(255, 255, 255, 0.95);
        color: #14121A;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.25), 0 2px 10px rgba(0,0,0,0.4);
      }
      .scan-node-marker.captured {
        background: #06D6A0;
        border: 2.5px solid #fff;
        color: #0d1b1e;
        width: 26px;
        height: 26px;
      }
      .scan-node-marker.aligned {
        width: 42px;
        height: 42px;
        background: rgba(255, 210, 63, 0.95);
        border: 3px solid #fff;
        color: #14121A;
        box-shadow: 0 0 20px rgba(255, 210, 63, 0.85), 0 0 0 3px rgba(255, 210, 63, 0.35);
        z-index: 8;
      }
      .scan-center-ring {
        width: 120px;
        height: 120px;
      }
      .scan-guide-arrow {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(14, 12, 19, 0.9);
        border: 1.5px solid #FFD23F;
        border-radius: 999px;
        padding: 5px 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
      }
      .guide-arrow-icon {
        font-size: 14px;
        color: #FFD23F;
        font-weight: 900;
      }
      .guide-arrow-text {
        font-size: 11px;
        font-weight: 800;
        color: #fff;
      }
      .scan-floating-hud {
        position: absolute;
        top: 14px;
        left: 14px;
        right: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        pointer-events: auto;
      }
      .scan-progress-box {
        background: rgba(14, 12, 19, 0.88);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 6px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 170px;
      }
      .scan-progress-bar-bg {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
      }
      .scan-progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #FFD23F 0%, #06D6A0 100%);
        transition: width 0.3s;
      }
      .scan-auto-snap-toggle {
        background: rgba(14, 12, 19, 0.88);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 6px 10px;
        display: flex;
        align-items: center;
        gap: 6px;
        color: #fff;
        user-select: none;
      }
      .scan-flash-fx {
        position: absolute;
        inset: 0;
        background: #fff;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.05s ease-out;
      }
      .scan-flash-fx.flash {
        opacity: 0.9;
        transition: none;
      }
      .scan-ribbon-section {
        background: rgba(14, 12, 19, 0.95);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding: 8px 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        z-index: 15;
      }
      .scan-ribbon-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .scan-strip-container {
        width: 100%;
        height: 70px;
        background: #000;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        overflow: hidden;
      }
      #panoStitchPreviewCanvas {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .scan-slots-track {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 2px;
      }
      .scan-slot-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.6);
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.15s;
      }
      .scan-slot-pill.active {
        border-color: #FFD23F;
        color: #FFD23F;
        background: rgba(255, 210, 63, 0.15);
      }
      .scan-slot-pill.captured {
        border-color: #06D6A0;
        color: #06D6A0;
        background: rgba(6, 214, 160, 0.15);
      }
      .scan-bottom-bar {
        background: #14121A;
        border-top: 1.5px solid rgba(255, 255, 255, 0.1);
        padding: 10px 16px max(10px, env(safe-area-inset-bottom));
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        z-index: 20;
        flex-wrap: wrap;
      }
      .scan-bottom-left, .scan-bottom-right {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .scan-ctrl-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.15s;
      }
      .scan-ctrl-btn:hover {
        background: rgba(255, 255, 255, 0.16);
      }
      .scan-btn-danger {
        background: rgba(255, 77, 109, 0.15);
        color: #FF4D6D;
        border-color: rgba(255, 77, 109, 0.35);
      }
      .scan-btn-danger:hover {
        background: #FF4D6D;
        color: #fff;
      }
      .scan-btn-success {
        background: linear-gradient(135deg, #FFD23F 0%, #06D6A0 100%);
        color: #14121A;
        border: none;
        padding: 10px 18px;
        font-weight: 900;
        font-size: 12px;
        box-shadow: 0 2px 12px rgba(6, 214, 160, 0.3);
      }
      .scan-btn-success:hover {
        transform: translateY(-1px) scale(1.02);
        box-shadow: 0 4px 18px rgba(6, 214, 160, 0.5);
      }
      .scan-shutter-btn {
        background: radial-gradient(circle, #fff 40%, #e2e8f0 70%);
        border: 4px solid #FFD23F;
        color: #14121A;
        border-radius: 999px;
        padding: 8px 22px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.15s;
        box-shadow: 0 4px 16px rgba(255, 210, 63, 0.5);
      }
      .scan-shutter-btn:hover {
        transform: scale(1.06);
        background: #fff;
      }
      .scan-shutter-btn:active {
        transform: scale(0.95);
      }
      .shutter-inner {
        font-size: 18px;
      }
      .shutter-text {
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.04em;
      }
    `;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.id = 'tour3dModal';
    modal.innerHTML = `
      <!-- Top HUD Bar -->
      <div class="tour-hud-top">
        <div class="tour-brand-group">
          <div class="tour-badge-row">
            <span class="tour-live-badge">● 360° LIVE VIEW</span>
            <span class="tour-type-badge" id="tourTypeBadge">360° PHOTOSPHERE</span>
          </div>
          <h2 class="tour-spot-title" id="tourSpotTitle">SpotLIGHT 360° Tour</h2>
          <span class="tour-spot-tag" id="tourSpotTag">Downtown Salt Lake City, UT</span>
        </div>

        <div class="tour-top-controls">
          <button type="button" class="tour-hud-btn" id="tourEditModeBtn" title="Place & Edit Navigation Hotspots">
            <span>✏️</span><span class="hud-btn-lbl">BUILD TOUR</span>
          </button>
          <button type="button" class="tour-hud-btn" id="tourAutoRotateBtn" title="Toggle 360 Auto-Pan">
            <span>🔄</span><span class="hud-btn-lbl">AUTO-PAN</span>
          </button>
          <button type="button" class="tour-hud-btn" id="tourGyroBtn" title="Device Gyro Look">
            <span>🧭</span><span class="hud-btn-lbl">GYRO</span>
          </button>
          <button type="button" class="tour-hud-btn" id="tourResetBtn" title="Center View">
            <span>🎯</span><span class="hud-btn-lbl">CENTER</span>
          </button>
          <button type="button" class="tour-hud-btn" id="tourFullscreenBtn" title="Toggle Fullscreen">
            <span>⛶</span>
          </button>
          <a href="#" target="_blank" rel="noopener noreferrer" class="tour-hud-btn" id="tourExternalLaunchBtn" style="display:none;" title="Open in External App">
            <span>↗</span><span class="hud-btn-lbl">EXTERNAL</span>
          </a>
          <button type="button" class="tour-hud-btn tour-close-btn" id="tourCloseBtn" title="Exit 3D Tour">
            ✕
          </button>
        </div>
      </div>

      <!-- Live Editor Action Bar (When in Tour Builder Mode) -->
      <div class="tour-editor-bar" id="tourEditorBar">
        <span class="tour-editor-pill">🛠️ TOUR BUILDER</span>
        <span id="tourCamAnglePill" class="tour-editor-pill" style="color:#FFD23F;border-color:#FFD23F;">YAW: 0° · PITCH: 0°</span>
        <div class="tour-editor-actions">
          <button type="button" class="tour-ed-btn" onclick="window.openPlaceHotspotDialog()" title="Place interactive door hotspot at camera angle">
            📍 PLACE DOOR PIN
          </button>
          <button type="button" class="tour-ed-btn" style="background:#FFD23F;color:#14121A;font-weight:900;" onclick="window.open360CameraScanner('new_room')" title="Scan room with your device camera and stitch into 360 photo">
            📸 360 CAMERA SCAN
          </button>
          <button type="button" class="tour-ed-btn tour-ed-secondary" onclick="window.openAddRoomDialog()" title="Add another 360 space">
            + NEW ROOM
          </button>
          <button type="button" class="tour-ed-btn tour-ed-secondary" onclick="window.openEditRoomDialog()" title="Edit current room name, 360 photo, or blurb">
            ✏️ EDIT THIS ROOM
          </button>
          <button type="button" class="tour-ed-btn tour-ed-danger" onclick="window.confirmDeleteCurrentRoom()" title="Delete this room from tour">
            🗑️ DELETE THIS ROOM
          </button>
          <button type="button" class="tour-ed-btn tour-ed-secondary" onclick="window.openManageRoomsDialog()" title="View and organize all rooms">
            📑 ALL ROOMS
          </button>
          <button type="button" class="tour-ed-btn tour-ed-save" id="tourSaveEveryoneBtn" onclick="window.saveTourChangesToMagazine()" title="Save tour live to cloud for all visitors">
            💾 SAVE TOUR FOR EVERYONE
          </button>
        </div>
      </div>

      <!-- Main 3D Viewport -->
      <div class="tour-viewport-container" id="tourViewportContainer">
        <!-- Three.js Canvas -->
        <canvas class="tour-3d-canvas" id="tour3dCanvas"></canvas>

        <!-- External Embed Frame (Kuula, ThingLink, Matterport, 360Cities, YouTube VR) -->
        <iframe class="tour-embed-frame" id="tourEmbedFrame" style="display:none;" allow="xr-spatial-tracking; vr; accelerometer; gyroscope; fullscreen" allowfullscreen></iframe>

        <!-- Hotspots Layer -->
        <div class="tour-hotspots-layer" id="tourHotspotsLayer"></div>

        <!-- Compass Overlay -->
        <div class="tour-compass-indicator" id="tourCompass">
          <span class="compass-dial" id="compassDial">▲ N</span>
        </div>

        <!-- Loading Overlay -->
        <div class="tour-loader" id="tourLoader">
          <div class="tour-spinner"></div>
          <div class="tour-loader-text" id="tourLoaderTitle">INITIALIZING 360° SPACE...</div>
          <div class="tour-loader-sub" id="tourLoaderSub">Rendering realistic spherical photosphere</div>
        </div>

        <!-- 1. PLACE HOTSPOT DIALOG -->
        <div class="tour-dialog-overlay" id="tourPlaceHotspotModal" style="display:none;">
          <div class="tour-dialog-card">
            <div class="tour-dialog-header">
              <span class="tour-dialog-title">📍 Place Interactive Hotspot</span>
              <button type="button" class="tour-dialog-close" onclick="window.closePlaceHotspotDialog()">✕</button>
            </div>
            <div class="tour-dialog-body">
              <div class="tour-dialog-info" id="placeHsAngleInfo">
                📐 Targeting Camera: Yaw 0°, Pitch 0°
              </div>
              <div class="tour-field-group">
                <label class="tour-field-label">Hotspot Label (Text shown on marker)</label>
                <input type="text" class="tour-dialog-input" id="newHsLabelInput" placeholder="e.g., 🚪 Step Inside Studio" value="🚪 Step Inside Space">
                <div class="tour-quick-chips">
                  <span class="tour-chip" onclick="window.setQuickHsLabel('🚪 Step Inside Studio')">🚪 Step Inside</span>
                  <span class="tour-chip" onclick="window.setQuickHsLabel('☕ Espresso Bar')">☕ Coffee Bar</span>
                  <span class="tour-chip" onclick="window.setQuickHsLabel('📍 Mountain View Patio')">📍 Sky Patio</span>
                  <span class="tour-chip" onclick="window.setQuickHsLabel('🍸 VIP Speakeasy')">🍸 VIP Lounge</span>
                  <span class="tour-chip" onclick="window.setQuickHsLabel('🚪 Walk Back Outside')">🚪 Walk Back</span>
                </div>
              </div>
              <div class="tour-field-group">
                <label class="tour-field-label">Destination (Which 360 Room does this open?)</label>
                <select class="tour-dialog-select" id="newHsTargetSceneSelect"></select>
              </div>
            </div>
            <div class="tour-dialog-footer">
              <button type="button" class="tour-dialog-btn tour-dialog-btn-cancel" onclick="window.closePlaceHotspotDialog()">CANCEL</button>
              <button type="button" class="tour-dialog-btn tour-dialog-btn-confirm" onclick="window.confirmPlaceHotspot()">📍 DROP PIN HERE</button>
            </div>
          </div>
        </div>

        <!-- 2. ADD NEW 360 ROOM DIALOG -->
        <div class="tour-dialog-overlay" id="tourAddRoomModal" style="display:none;">
          <div class="tour-dialog-card">
            <div class="tour-dialog-header">
              <span class="tour-dialog-title">🚪 Add New 360° Room / Space</span>
              <button type="button" class="tour-dialog-close" onclick="window.closeAddRoomDialog()">✕</button>
            </div>
            <div class="tour-dialog-body">
              <div class="tour-field-group">
                <label class="tour-field-label">Room / Space Name</label>
                <input type="text" class="tour-dialog-input" id="newRoomNameInput" placeholder="e.g. VIP Speakeasy & Lounge" value="New 360° Room">
              </div>

              <!-- Source Tabs -->
              <div class="tour-source-tabs">
                <button type="button" class="tour-src-tab active" id="tabBtnUpload" onclick="window.switchAddRoomTab('upload')">📸 Upload 360 Photo</button>
                <button type="button" class="tour-src-tab" id="tabBtnCamera" onclick="window.switchAddRoomTab('camera')">📷 360 Camera Scan</button>
                <button type="button" class="tour-src-tab" id="tabBtnPreset" onclick="window.switchAddRoomTab('preset')">🌄 Utah 360 Presets</button>
                <button type="button" class="tour-src-tab" id="tabBtnUrl" onclick="window.switchAddRoomTab('url')">🔗 Paste 360 URL / Embed</button>
              </div>

              <!-- Tab 1: Upload File -->
              <div id="roomTabUpload">
                <div class="tour-dropzone" onclick="document.getElementById('roomFileInput').click()">
                  <span class="dropzone-icon">☁️</span>
                  <span class="dropzone-text">Tap or Drop 360° Equirectangular Photo</span>
                  <span class="dropzone-hint">JPG, PNG, or WEBP panoramic photos supported</span>
                  <input type="file" id="roomFileInput" accept="image/*" style="display:none;" onchange="window.handleRoomFileUpload(event)">
                </div>
                <div id="roomUploadStatus" class="tour-upload-status" style="display:none;"></div>
              </div>

              <!-- Tab 1.5: In-Room Camera Scanner -->
              <div id="roomTabCamera" style="display:none;text-align:center;padding:16px 8px;">
                <div style="font-size:36px;margin-bottom:8px;">📸</div>
                <div style="font-size:13px;font-weight:800;color:#FFD23F;margin-bottom:6px;">Scan & Stitch Room with Device Camera</div>
                <p style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:14px;line-height:1.4;">
                  Rotate your phone or laptop camera all around the room following the 18 target circles (like Teleport/HDReye). Our in-browser engine captures each angle and seamlessly stitches them into a full 360° photosphere!
                </p>
                <button type="button" class="tour-dialog-btn tour-dialog-btn-confirm" style="background:#FFD23F;color:#14121A;font-size:12px;padding:9px 18px;font-weight:900;" onclick="window.closeAddRoomDialog(); window.open360CameraScanner('new_room');">
                  ⚡ LAUNCH 360 CAMERA SCANNER
                </button>
              </div>

              <!-- Tab 2: Presets -->
              <div id="roomTabPreset" style="display:none;">
                <div class="tour-presets-grid" id="presetPanosGrid"></div>
              </div>

              <!-- Tab 3: URL -->
              <div id="roomTabUrl" style="display:none;">
                <div class="tour-field-group">
                  <label class="tour-field-label">360° Photo URL, Kuula, ThingLink, or Matterport Link</label>
                  <input type="text" class="tour-dialog-input" id="newRoomUrlInput" placeholder="Paste Kuula, ThingLink, Matterport, or 360° image URL">
                  <small style="color:rgba(255,255,255,0.6);font-size:10px;">Supports Kuula, ThingLink, 360Cities, Matterport, Momento360, Polycam, YouTube 360, and direct 360 image URLs</small>
                </div>
              </div>
            </div>
            <div class="tour-dialog-footer">
              <button type="button" class="tour-dialog-btn tour-dialog-btn-cancel" onclick="window.closeAddRoomDialog()">CANCEL</button>
              <button type="button" class="tour-dialog-btn tour-dialog-btn-confirm" onclick="window.confirmAdd360Room()">🚪 CREATE & STEP INSIDE ROOM</button>
            </div>
          </div>
        </div>

        <!-- 3. EDIT EXISTING 360 ROOM DIALOG -->
        <div class="tour-dialog-overlay" id="tourEditRoomModal" style="display:none;">
          <div class="tour-dialog-card">
            <div class="tour-dialog-header">
              <span class="tour-dialog-title" id="editRoomModalTitle">✏️ Edit 360° Room</span>
              <button type="button" class="tour-dialog-close" onclick="window.closeEditRoomDialog()">✕</button>
            </div>
            <div class="tour-dialog-body">
              <input type="hidden" id="editRoomTargetIndex" value="0">
              
              <div class="tour-field-group">
                <label class="tour-field-label">Room / Space Name</label>
                <input type="text" class="tour-dialog-input" id="editRoomNameInput" placeholder="e.g. VIP Speakeasy & Lounge">
              </div>

              <div class="tour-field-group">
                <label class="tour-field-label">Tag / Subtitle</label>
                <input type="text" class="tour-dialog-input" id="editRoomTagInput" placeholder="e.g. Creative Studio · Interior">
              </div>

              <div class="tour-field-group">
                <label class="tour-field-label">Change 360° Photo / Panorama Source</label>
                <!-- Source Tabs -->
                <div class="tour-source-tabs">
                  <button type="button" class="tour-src-tab active" id="editTabBtnUpload" onclick="window.switchEditRoomTab('upload')">📸 Upload New 360</button>
                  <button type="button" class="tour-src-tab" id="editTabBtnCamera" onclick="window.switchEditRoomTab('camera')">📷 360 Camera Scan</button>
                  <button type="button" class="tour-src-tab" id="editTabBtnPreset" onclick="window.switchEditRoomTab('preset')">🌄 Utah Presets</button>
                  <button type="button" class="tour-src-tab" id="editTabBtnUrl" onclick="window.switchEditRoomTab('url')">🔗 Paste URL / Embed</button>
                </div>

                <!-- Tab 1: Upload File -->
                <div id="editRoomTabUpload">
                  <div class="tour-dropzone" onclick="document.getElementById('editRoomFileInput').click()">
                    <span class="dropzone-icon">☁️</span>
                    <span class="dropzone-text">Tap or Drop New 360° Photo</span>
                    <span class="dropzone-hint">Uploads directly to your Supabase Cloud Storage</span>
                    <input type="file" id="editRoomFileInput" accept="image/*" style="display:none;" onchange="window.handleEditRoomFileUpload(event)">
                  </div>
                  <div id="editRoomUploadStatus" class="tour-upload-status" style="display:none;"></div>
                </div>

                <!-- Tab 1.5: In-Room Camera Scanner -->
                <div id="editRoomTabCamera" style="display:none;text-align:center;padding:16px 8px;">
                  <div style="font-size:36px;margin-bottom:8px;">📸</div>
                  <div style="font-size:13px;font-weight:800;color:#FFD23F;margin-bottom:6px;">Re-Scan This Room with Camera</div>
                  <p style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:14px;line-height:1.4;">
                    Take pictures all around the space to replace this room's 360° photo with a fresh real-time stitched photosphere.
                  </p>
                  <button type="button" class="tour-dialog-btn tour-dialog-btn-confirm" style="background:#FFD23F;color:#14121A;font-size:12px;padding:9px 18px;font-weight:900;" onclick="window.closeEditRoomDialog(); window.open360CameraScanner('replace_room');">
                    ⚡ LAUNCH 360 CAMERA SCANNER
                  </button>
                </div>

                <!-- Tab 2: Presets -->
                <div id="editRoomTabPreset" style="display:none;">
                  <div class="tour-presets-grid" id="editPresetPanosGrid"></div>
                </div>

                <!-- Tab 3: URL -->
                <div id="editRoomTabUrl" style="display:none;">
                  <input type="text" class="tour-dialog-input" id="editRoomUrlInput" placeholder="Paste Kuula, ThingLink, Matterport, or 360° image URL">
                  <small style="color:rgba(255,255,255,0.6);font-size:10px;margin-top:4px;display:block;">Supports Kuula, ThingLink, 360Cities, Matterport, Momento360, Polycam, YouTube 360, and direct 360 image URLs</small>
                </div>
              </div>

              <div class="tour-field-group">
                <label class="tour-field-label">Description / Blurb</label>
                <textarea class="tour-dialog-input" id="editRoomBlurbInput" rows="2" placeholder="Brief blurb about this 360° space..."></textarea>
              </div>

              <!-- Hotspots in this room -->
              <div class="tour-field-group">
                <label class="tour-field-label" style="display:flex;justify-content:space-between;align-items:center;">
                  <span>🚪 Doors / Hotspots in This Room (<span id="editRoomHsCount">0</span>)</span>
                </label>
                <div id="editRoomHotspotsList" style="max-height:110px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:2px 0;"></div>
              </div>
            </div>
            <div class="tour-dialog-footer" style="justify-content:space-between;">
              <button type="button" class="tour-dialog-btn tour-dialog-btn-danger" id="editRoomDeleteBtn" onclick="window.confirmDeleteFromEditModal()" title="Delete this room permanently">
                🗑️ DELETE THIS ROOM
              </button>
              <div style="display:flex;gap:8px;">
                <button type="button" class="tour-dialog-btn tour-dialog-btn-cancel" onclick="window.closeEditRoomDialog()">CANCEL</button>
                <button type="button" class="tour-dialog-btn tour-dialog-btn-confirm" onclick="window.confirmSaveEditRoom()">💾 SAVE ROOM CHANGES</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. MANAGE ALL ROOMS DIALOG -->
        <div class="tour-dialog-overlay" id="tourManageRoomsModal" style="display:none;">
          <div class="tour-dialog-card" style="max-width:520px;">
            <div class="tour-dialog-header">
              <span class="tour-dialog-title">📑 All 360° Rooms in Tour</span>
              <button type="button" class="tour-dialog-close" onclick="window.closeManageRoomsDialog()">✕</button>
            </div>
            <div class="tour-dialog-body">
              <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:4px;">
                Switch to any room, edit details & 360 photos, or delete old/messed up rooms:
              </div>
              <div id="manageRoomsList" style="display:flex;flex-direction:column;gap:8px;max-height:50vh;overflow-y:auto;"></div>
            </div>
            <div class="tour-dialog-footer" style="justify-content:space-between;">
              <button type="button" class="tour-dialog-btn tour-dialog-btn-confirm" style="background:#06D6A0;color:#0d1b1e;" onclick="window.closeManageRoomsDialog(); window.openAddRoomDialog();">
                + ADD ANOTHER ROOM
              </button>
              <button type="button" class="tour-dialog-btn tour-dialog-btn-cancel" onclick="window.closeManageRoomsDialog()">CLOSE</button>
            </div>
          </div>
        </div>

        <!-- 5. ADMIN AUTH DIALOG FOR SAVING TO CLOUD -->
        <div class="tour-dialog-overlay" id="tourAdminAuthModal" style="display:none;">
          <div class="tour-dialog-card" style="border-color:#FFD23F;max-width:440px;">
            <div class="tour-dialog-header">
              <span class="tour-dialog-title" style="color:#FFD23F;">🔐 Save Tour Live to Cloud</span>
              <button type="button" class="tour-dialog-close" onclick="window.closeTourAdminAuthModal()">✕</button>
            </div>
            <div class="tour-dialog-body">
              <div style="font-size:12px;color:rgba(255,255,255,0.9);line-height:1.5;">
                To publish this 360° Walkthrough live to Supabase Cloud for all visitors across the world, enter your administrator password:
              </div>
              <div class="tour-field-group" style="margin-top:6px;">
                <label class="tour-field-label">Admin Password</label>
                <input type="password" class="tour-dialog-input" id="tourAdminPasswordInput" placeholder="Enter admin password..." onkeydown="if(event.key==='Enter') window.submitTourAdminUnlock()">
              </div>
              <div id="tourAdminAuthStatus" style="display:none;font-size:11px;padding:6px 10px;border-radius:6px;"></div>
            </div>
            <div class="tour-dialog-footer">
              <button type="button" class="tour-dialog-btn tour-dialog-btn-cancel" onclick="window.closeTourAdminAuthModal()">CANCEL</button>
              <button type="button" class="tour-dialog-btn tour-dialog-btn-confirm" id="tourAdminUnlockBtn" style="background:#FFD23F;color:#14121A;font-weight:900;" onclick="window.submitTourAdminUnlock()">
                🔐 UNLOCK & SAVE TO CLOUD
              </button>
            </div>
          </div>
        </div>

        <!-- 6. EDIT / DELETE HOTSPOT MODAL -->
        <div class="tour-dialog-overlay" id="tourEditHotspotModal" style="display:none;">
          <div class="tour-dialog-card">
            <div class="tour-dialog-header">
              <span class="tour-dialog-title">✏️ Edit Hotspot Pin</span>
              <button type="button" class="tour-dialog-close" onclick="window.closeEditHotspotDialog()">✕</button>
            </div>
            <div class="tour-dialog-body">
              <input type="hidden" id="editHsIndex" value="-1">
              <div class="tour-field-group">
                <label class="tour-field-label">Label</label>
                <input type="text" class="tour-dialog-input" id="editHsLabelInput">
              </div>
              <div class="tour-field-group">
                <label class="tour-field-label">Target Room</label>
                <select class="tour-dialog-select" id="editHsTargetSceneSelect"></select>
              </div>
              <button type="button" class="tour-dialog-btn tour-dialog-btn-secondary" onclick="window.realignHotspotToCurrentCamera()">
                🎯 Re-Align to Current View Angle
              </button>
            </div>
            <div class="tour-dialog-footer" style="justify-content:space-between;">
              <button type="button" class="tour-dialog-btn tour-dialog-btn-danger" onclick="window.confirmDeleteHotspot()">🗑️ DELETE HOTSPOT</button>
              <div style="display:flex;gap:8px;">
                <button type="button" class="tour-dialog-btn tour-dialog-btn-cancel" onclick="window.closeEditHotspotDialog()">CANCEL</button>
                <button type="button" class="tour-dialog-btn tour-dialog-btn-confirm" onclick="window.saveHotspotEdit()">SAVE</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 7. IN-ROOM 360 CAMERA SCANNER & EQUIRECTANGULAR STITCHER MODAL -->
        <div class="tour-dialog-overlay" id="tourCameraScanModal" style="display:none; z-index:100; padding:0; background:rgba(0,0,0,0.95);">
          <div class="tour-camera-scanner-container">
            <!-- Scanner Header -->
            <div class="scan-header">
              <div class="scan-header-left">
                <span class="scan-title">📸 360° ROOM SCANNER & STITCHER</span>
                <span class="scan-pill" id="scanSensorModePill">📳 GYRO SENSOR ACTIVE</span>
                <span class="scan-pill" id="scanAnglePill" style="color:#FFD23F;border-color:#FFD23F;">YAW: 0° · PITCH: 0°</span>
              </div>
              <div class="scan-header-right">
                <button type="button" class="scan-btn-small" onclick="window.toggleCameraFacingMode()" title="Switch Front/Rear Camera">
                  🔄 SWITCH CAMERA
                </button>
                <button type="button" class="scan-btn-close" onclick="window.close360CameraScanner()">✕</button>
              </div>
            </div>

            <!-- Viewfinder Area -->
            <div class="scan-viewfinder-area" id="scanViewfinderArea">
              <!-- Live Video Feed -->
              <video id="scanVideoFeed" autoplay playsinline muted></video>
              <canvas id="scanWorkCanvas" style="display:none;"></canvas>

              <!-- Target Reticle & 360 Orbit Nodes Overlay -->
              <div class="scan-reticle-overlay" id="scanReticleOverlay">
                <!-- Center Target Ring -->
                <div class="scan-center-ring" id="scanCenterRing">
                  <div class="scan-crosshair-h"></div>
                  <div class="scan-crosshair-v"></div>
                  <div class="scan-center-dot"></div>
                  <span class="scan-ring-status" id="scanRingStatus">ROTATE PHONE TO DOT</span>
                </div>

                <!-- 360 Target Node Dots Layer -->
                <div class="scan-nodes-layer" id="scanNodesLayer"></div>

                <!-- Guidance Arrow -->
                <div class="scan-guide-arrow" id="scanGuideArrow">
                  <span class="guide-arrow-icon" id="scanGuideIcon">➔</span>
                  <span class="guide-arrow-text" id="scanGuideText">Point at the white circles · tilt up & down to get them all</span>
                </div>

                <!-- Flash Animation -->
                <div class="scan-flash-fx" id="scanFlashFx"></div>
              </div>

              <!-- Live Floating Stats -->
              <div class="scan-floating-hud">
                <div class="scan-progress-box">
                  <span style="font-size:11px;font-weight:800;color:#06D6A0;" id="scanProgressLabel">0 / 28 CAPTURED (0%)</span>
                  <div class="scan-progress-bar-bg">
                    <div class="scan-progress-bar-fill" id="scanProgressBarFill" style="width:0%;"></div>
                  </div>
                </div>
                <div class="scan-auto-snap-toggle" onclick="window.toggleAutoCaptureOnAlign()">
                  <input type="checkbox" id="scanAutoSnapCheck" checked>
                  <label for="scanAutoSnapCheck" style="cursor:pointer;font-size:11px;font-weight:700;">⚡ Auto-Snap on Align</label>
                </div>
              </div>
            </div>

            <!-- Live Panoramic Stitched Strip Preview -->
            <div class="scan-ribbon-section">
              <div class="scan-ribbon-header">
                <span style="font-size:11px;font-weight:800;color:#FFD23F;">🖼️ LIVE 360° EQUIRECTANGULAR PANORAMA PREVIEW</span>
                <span style="font-size:10px;color:rgba(255,255,255,0.6);" id="scanRibbonHint">Watch your room seamlessly stitch together in real-time</span>
              </div>
              <div class="scan-strip-container">
                <canvas id="panoStitchPreviewCanvas" width="1024" height="200"></canvas>
              </div>
              <!-- Angle Slots Ribbon -->
              <div class="scan-slots-track" id="scanSlotsTrack"></div>
            </div>

            <!-- Bottom Action Controls -->
            <div class="scan-bottom-bar">
              <div class="scan-bottom-left">
                <button type="button" class="scan-ctrl-btn scan-btn-danger" onclick="window.resetCurrent360Scan()">
                  🗑️ RESET SCAN
                </button>
                <button type="button" class="scan-ctrl-btn" onclick="window.manualStepAngle(-30)">
                  ◀ PREV ANGLE
                </button>
                <button type="button" class="scan-ctrl-btn" onclick="window.manualStepAngle(30)">
                  NEXT ANGLE ▶
                </button>
              </div>

              <div class="scan-bottom-center">
                <button type="button" class="scan-shutter-btn" id="scanShutterBtn" onclick="window.captureCurrentScanAngle()">
                  <span class="shutter-inner">📸</span>
                  <span class="shutter-text">SNAP ANGLE</span>
                </button>
              </div>

              <div class="scan-bottom-right">
                <button type="button" class="scan-ctrl-btn scan-btn-success" id="scanFinishUseBtn" onclick="window.finishAndUse360Stitch()">
                  ✨ STITCH & USE 360° ROOM (SAVE)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom HUD Controls & Room Switcher -->
      <div class="tour-hud-bottom">
        <div class="tour-scene-selector" id="tourSceneSelector"></div>
        <div class="tour-gesture-hint" id="tourGestureHint">
          <span>👆 Drag to Look Around</span>
          <span>•</span>
          <span>🚪 Tap Door Markers to Walk Through</span>
          <span>•</span>
          <span>🔍 Pinch or Scroll to Zoom</span>
        </div>
        <div class="tour-bottom-actions">
          <div class="tour-zoom-pill" id="tourZoomPill">
            <button type="button" class="zoom-btn" id="tourZoomOut" title="Zoom Out">−</button>
            <span class="zoom-level" id="tourZoomLevel">75%</span>
            <button type="button" class="zoom-btn" id="tourZoomIn" title="Zoom In">+</button>
          </div>
          <a href="#" target="_blank" rel="noopener noreferrer" class="tour-cta-btn" id="tourCtaBtn" style="display:none;">
            VISIT WEBSITE ↗
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    bindViewerEvents();
  }

  /**
   * Event Listeners & Interaction Binding
   */
  function bindViewerEvents() {
    const modal = document.getElementById('tour3dModal');
    if (!modal) return;

    const closeBtn = document.getElementById('tourCloseBtn');
    const autoRotateBtn = document.getElementById('tourAutoRotateBtn');
    const gyroBtn = document.getElementById('tourGyroBtn');
    const editModeBtn = document.getElementById('tourEditModeBtn');
    const resetBtn = document.getElementById('tourResetBtn');
    const fullscreenBtn = document.getElementById('tourFullscreenBtn');
    const zoomInBtn = document.getElementById('tourZoomIn');
    const zoomOutBtn = document.getElementById('tourZoomOut');
    const container = document.getElementById('tourViewportContainer');

    if (closeBtn) closeBtn.onclick = () => window.close3dTourModal();
    if (editModeBtn) editModeBtn.onclick = () => window.toggleTourEditorMode();

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
        targetPitch = Math.min(85, targetPitch + 10);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        targetPitch = Math.max(-85, targetPitch - 10);
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
        if (e.target.closest('.tour-hotspot-pin') || e.target.closest('button') || e.target.closest('iframe') || e.target.closest('.tour-dialog-overlay')) return;
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
        if (document.getElementById('tourEmbedFrame')?.style.display === 'block') return;
        e.preventDefault();
        adjustZoom(e.deltaY * 0.05);
      }, { passive: false });

      container.addEventListener('touchstart', (e) => {
        if (e.target.closest('.tour-hotspot-pin') || e.target.closest('button') || e.target.closest('iframe') || e.target.closest('.tour-dialog-overlay')) return;
        isAutoRotating = false;

        if (e.touches.length === 1) {
          isDragging = true;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          lastX = startX;
          lastY = startY;
          velX = 0;
          velY = 0;
        } else if (e.touches.length === 2) {
          isDragging = false;
          lastPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      }, { passive: true });

      container.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
          const dx = e.touches[0].clientX - lastX;
          const dy = e.touches[0].clientY - lastY;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;

          const sensitivity = fov / 500;
          targetYaw -= dx * sensitivity;
          targetPitch = Math.max(-85, Math.min(85, targetPitch + dy * sensitivity));
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

      window.addEventListener('resize', () => {
        resizeThreeViewport();
      });
    }
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

  function resizeThreeViewport() {
    const container = document.getElementById('tourViewportContainer');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(100, Math.floor(rect.width || window.innerWidth || 800));
    const height = Math.max(100, Math.floor(rect.height || window.innerHeight || 600));

    if (threeRenderer && threeCamera) {
      threeRenderer.setSize(width, height);
      threeCamera.aspect = width / height;
      threeCamera.updateProjectionMatrix();
    }
  }

  /**
   * Main High-Performance Animation Loop
   */
  function renderFrame() {
    const modal = document.getElementById('tour3dModal');
    if (!modal || !modal.classList.contains('active')) {
      animFrameId = null;
      return;
    }

    const embedFrame = document.getElementById('tourEmbedFrame');
    if (embedFrame && embedFrame.style.display === 'block') {
      animFrameId = requestAnimationFrame(renderFrame);
      return;
    }

    if (!threeRenderer || !threeCamera || !threeScene) {
      initThreeEngine();
    }

    // Smooth Camera Inertia
    yaw += (targetYaw - yaw) * 0.15;
    pitch += (targetPitch - pitch) * 0.15;
    fov += (targetFov - fov) * 0.15;

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

    const camAnglePill = document.getElementById('tourCamAnglePill');
    if (camAnglePill && isEditorMode) {
      camAnglePill.textContent = `YAW: ${Math.round(yaw)}° · PITCH: ${Math.round(pitch)}° · FOV: ${Math.round(fov)}°`;
    }

    if (threeCamera && threeRenderer && threeScene) {
      threeCamera.fov = fov;
      threeCamera.updateProjectionMatrix();

      // Convert spherical yaw & pitch to 3D Cartesian look-at vector
      const phi = THREE.MathUtils.degToRad(90 - pitch);
      const theta = THREE.MathUtils.degToRad(yaw);

      const target = new THREE.Vector3(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      );

      threeCamera.lookAt(target);
      threeRenderer.render(threeScene, threeCamera);

      // Project Hotspot 3D Vectors onto 2D Screen with Zero Distortion
      updateHotspotPositions3D(threeCamera);
    }

    animFrameId = requestAnimationFrame(renderFrame);
  }

  /**
   * Synchronizes Persistent Hotspot DOM Nodes (Called on Scene Load / Edit)
   */
  function syncHotspotsDom() {
    const layer = document.getElementById('tourHotspotsLayer');
    if (!layer) return;
    layer.innerHTML = '';

    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene || !Array.isArray(curScene.hotspots)) return;

    curScene.hotspots.forEach((hs, idx) => {
      const pin = document.createElement('div');
      pin.className = 'tour-hotspot-pin' + (isEditorMode ? ' editor-pin' : '');
      pin.dataset.hsIndex = idx;
      pin.style.display = 'none';

      const pulse = document.createElement('span');
      pulse.className = 'tour-hotspot-pulse';
      pin.appendChild(pulse);

      const lbl = document.createElement('span');
      lbl.textContent = hs.label;
      pin.appendChild(lbl);

      if (isEditorMode) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'hotspot-del-btn';
        delBtn.textContent = '✕';
        delBtn.title = 'Delete Hotspot';
        delBtn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          window.deleteHotspot(idx, e);
        };
        pin.appendChild(delBtn);

        pin.onclick = (e) => {
          if (e.target.closest('.hotspot-del-btn')) return;
          window.editHotspotDetails(idx, e);
        };
      } else {
        pin.onclick = (e) => {
          e.stopPropagation();
          window.switchTourScene(hs.targetScene);
        };
      }

      layer.appendChild(pin);
    });
  }

  /**
   * Updates Hotspot Screen Coordinates with 3D Vector Math
   */
  function updateHotspotPositions3D(camera) {
    const layer = document.getElementById('tourHotspotsLayer');
    const container = document.getElementById('tourViewportContainer');
    if (!layer || !container) return;

    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene || !Array.isArray(curScene.hotspots)) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const pins = layer.querySelectorAll('.tour-hotspot-pin');

    curScene.hotspots.forEach((hs, idx) => {
      const pin = pins[idx];
      if (!pin) return;

      const phi = THREE.MathUtils.degToRad(90 - hs.pitch);
      const theta = THREE.MathUtils.degToRad(hs.yaw);

      const v = new THREE.Vector3(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      );

      // Project onto Camera Screen Space (-1 to +1)
      v.project(camera);

      // Check if within view frustum in front of camera
      if (v.z < 1) {
        const screenX = (v.x * 0.5 + 0.5) * w;
        const screenY = (-v.y * 0.5 + 0.5) * h;

        if (screenX >= -80 && screenX <= w + 80 && screenY >= -80 && screenY <= h + 80) {
          pin.style.display = 'inline-flex';
          pin.style.left = `${screenX}px`;
          pin.style.top = `${screenY}px`;
        } else {
          pin.style.display = 'none';
        }
      } else {
        pin.style.display = 'none';
      }
    });
  }

  /**
   * Loads a Scene into View
   */
  function loadScene(index) {
    if (!activeSceneList || activeSceneList.length === 0) return;
    if (index < 0) index = 0;
    if (index >= activeSceneList.length) index = activeSceneList.length - 1;

    activeSceneIndex = index;
    const scene = activeSceneList[index];
    if (!scene) return;

    const titleEl = document.getElementById('tourSpotTitle');
    const tagEl = document.getElementById('tourSpotTag');
    const badgeEl = document.getElementById('tourTypeBadge');
    const ctaEl = document.getElementById('tourCtaBtn');
    const externalLaunchBtn = document.getElementById('tourExternalLaunchBtn');
    const loader = document.getElementById('tourLoader');
    const loaderTitle = document.getElementById('tourLoaderTitle');
    const loaderSub = document.getElementById('tourLoaderSub');
    const compassEl = document.getElementById('tourCompass');
    const zoomPill = document.getElementById('tourZoomPill');
    const gestureHint = document.getElementById('tourGestureHint');
    const embedFrame = document.getElementById('tourEmbedFrame');
    const canvasEl = document.getElementById('tour3dCanvas');

    const norm = normalize3dTourUrl(scene.tourUrl || scene.panoUrl || currentTourData?.tourUrl || currentTourData?.panoUrl || '');

    if (titleEl) titleEl.textContent = scene.name || currentTourData?.title || 'SpotLIGHT 360° Space';
    if (tagEl) tagEl.textContent = `📍 ${scene.location || 'Wasatch Front, UT'} · ${scene.tag || norm.provider || '360° Spatial Photosphere'}`;
    if (badgeEl) badgeEl.textContent = norm.provider && norm.provider !== 'none' ? `360° ${norm.provider.toUpperCase()}` : '360° PHOTOSPHERE';

    if (ctaEl) {
      if (currentTourData?.link && currentTourData.link !== '#') {
        ctaEl.href = currentTourData.link;
        ctaEl.textContent = `${currentTourData.cta || 'Visit Website'} ↗`;
        ctaEl.style.display = 'inline-flex';
      } else {
        ctaEl.style.display = 'none';
      }
    }

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

    if (norm.isEmbed) {
      // 1. External Embed (Kuula, ThingLink, Matterport, 360Cities, Momento360, YouTube VR)
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

        setTimeout(() => {
          if (loader) loader.classList.add('hidden');
        }, 1200);
      }
      return;
    }

    // 2. Three.js High-Definition 360 Photosphere
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

    initThreeEngine();
    resizeThreeViewport();

    const targetUrl = norm.isImage ? norm.url : (scene.panoUrl || currentTourData?.panoUrl);
    if (targetUrl && (targetUrl.startsWith('http') || targetUrl.startsWith('data:') || targetUrl.startsWith('blob:') || targetUrl.startsWith('/'))) {
      currentPanoUrl = targetUrl;
      loadThreePanoTexture(targetUrl);
    } else {
      const procCanvas = getSceneProceduralCanvas(scene.id);
      loadThreePanoTexture(procCanvas);
    }

    syncHotspotsDom();

    if (!animFrameId) {
      animFrameId = requestAnimationFrame(renderFrame);
    }
  }

  function renderSceneSelector() {
    const sel = document.getElementById('tourSceneSelector');
    if (!sel) return;

    if (activeSceneList.length <= 1 && !isEditorMode) {
      sel.style.display = 'none';
      return;
    }

    sel.style.display = 'flex';
    sel.innerHTML = activeSceneList.map((sc, i) => `
      <div class="tour-scene-pill-wrap">
        <button type="button" class="tour-scene-pill ${i === activeSceneIndex ? 'active' : ''}" onclick="window.switchTourSceneIndex(${i})">
          ${sc.name.split('·')[1]?.trim() || sc.name}
        </button>
        ${isEditorMode ? `
          <button type="button" class="tour-pill-edit-btn" onclick="event.stopPropagation(); window.openEditRoomDialog(${i})" title="Edit Room: ${sc.name}">✏️</button>
          ${activeSceneList.length > 1 ? `
            <button type="button" class="tour-pill-del-btn" onclick="event.stopPropagation(); window.deleteTourRoom(${i})" title="Delete Room: ${sc.name}">🗑️</button>
          ` : ''}
        ` : ''}
      </div>
    `).join('') + (isEditorMode ? `
      <button type="button" class="tour-scene-pill" style="border-style:dashed;border-color:#06D6A0;color:#06D6A0;background:rgba(6,214,160,0.1);display:inline-flex;align-items:center;gap:4px;" onclick="window.openAddRoomDialog()">
        <span>+</span> Add Room
      </button>
    ` : '');
  }

  // ==========================================
  // TOUR BUILDER & HOTSPOT ACTIONS
  // ==========================================

  window.toggleTourEditorMode = function (forceState) {
    const unlocked = !!(window.isEditorUnlocked || (typeof isEditorUnlocked !== 'undefined' && isEditorUnlocked));
    if (!unlocked) {
      if (typeof showToast === 'function') showToast('🔒 Unlock the magazine editor with your password first.');
      // Open main password modal if present
      const pw = document.getElementById('passwordModal');
      if (pw) pw.classList.add('show');
      return;
    }

    if (typeof forceState === 'boolean') {
      isEditorMode = forceState;
    } else {
      isEditorMode = !isEditorMode;
    }

    const editBtn = document.getElementById('tourEditModeBtn');
    const editorBar = document.getElementById('tourEditorBar');

    if (editBtn) editBtn.classList.toggle('active', isEditorMode);
    if (editorBar) editorBar.classList.toggle('active', isEditorMode);

    syncHotspotsDom();
    window.__spotlightRefreshEditorVisibility && window.__spotlightRefreshEditorVisibility();

    if (typeof showToast === 'function') {
      showToast(isEditorMode ? '🛠️ Tour Builder Mode: Look around, add rooms & drop doors!' : '👁️ View Mode Active');
    }
  };

  // 1. PLACE HOTSPOT
  window.openPlaceHotspotDialog = function () {
    const modal = document.getElementById('tourPlaceHotspotModal');
    if (!modal) return;

    const angleInfo = document.getElementById('placeHsAngleInfo');
    if (angleInfo) {
      angleInfo.textContent = `📐 Targeting Camera Orientation: Yaw ${Math.round(yaw)}°, Pitch ${Math.round(pitch)}°`;
    }

    const select = document.getElementById('newHsTargetSceneSelect');
    if (select) {
      select.innerHTML = activeSceneList.map((sc, i) => `
        <option value="${sc.id}" ${i !== activeSceneIndex ? 'selected' : ''}>
          ${sc.name} (${sc.tag || 'Room'})
        </option>
      `).join('');
    }

    modal.style.display = 'flex';
  };

  window.closePlaceHotspotDialog = function () {
    const modal = document.getElementById('tourPlaceHotspotModal');
    if (modal) modal.style.display = 'none';
  };

  window.setQuickHsLabel = function (label) {
    const inp = document.getElementById('newHsLabelInput');
    if (inp) inp.value = label;
  };

  window.confirmPlaceHotspot = function () {
    const labelInp = document.getElementById('newHsLabelInput');
    const select = document.getElementById('newHsTargetSceneSelect');

    const label = (labelInp && labelInp.value.trim()) ? labelInp.value.trim() : '🚪 Step Inside Room';
    const targetScene = select ? select.value : (activeSceneList[0]?.id || 'slc-entrance');

    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;

    if (!Array.isArray(curScene.hotspots)) {
      curScene.hotspots = [];
    }

    curScene.hotspots.push({
      pitch: Math.round(pitch),
      yaw: Math.round(yaw),
      label: label,
      targetScene: targetScene
    });

    window.closePlaceHotspotDialog();
    syncHotspotsDom();
    window.saveTourChangesToMagazine();

    if (typeof showToast === 'function') {
      showToast(`📍 Placed hotspot "${label}" at Yaw ${Math.round(yaw)}°, Pitch ${Math.round(pitch)}°!`);
    }
  };

  // 2. ADD NEW ROOM
  window.openAddRoomDialog = function () {
    const modal = document.getElementById('tourAddRoomModal');
    if (!modal) return;

    window._lastUploadedRoomPanoUrl = null;
    window._selectedPresetPanoUrl = null;

    const nameInp = document.getElementById('newRoomNameInput');
    if (nameInp) nameInp.value = `Room ${activeSceneList.length + 1}`;

    const urlInp = document.getElementById('newRoomUrlInput');
    if (urlInp) urlInp.value = '';

    const statusEl = document.getElementById('roomUploadStatus');
    if (statusEl) {
      statusEl.style.display = 'none';
      statusEl.textContent = '';
    }

    // Populate Presets Grid
    const grid = document.getElementById('presetPanosGrid');
    if (grid) {
      grid.innerHTML = PRESET_360_PANOS.map((p, idx) => `
        <button type="button" class="preset-card-btn" onclick="window.selectPreset360Pano(${idx}, this)">
          <span class="preset-card-name">${p.name}</span>
          <span class="preset-card-tag">${p.tag}</span>
        </button>
      `).join('');
    }

    window.switchAddRoomTab('upload');
    modal.style.display = 'flex';
  };

  window.closeAddRoomDialog = function () {
    const modal = document.getElementById('tourAddRoomModal');
    if (modal) modal.style.display = 'none';
  };

  window.switchAddRoomTab = function (tab) {
    const tabUpload = document.getElementById('roomTabUpload');
    const tabCamera = document.getElementById('roomTabCamera');
    const tabPreset = document.getElementById('roomTabPreset');
    const tabUrl = document.getElementById('roomTabUrl');

    const btnUpload = document.getElementById('tabBtnUpload');
    const btnCamera = document.getElementById('tabBtnCamera');
    const btnPreset = document.getElementById('tabBtnPreset');
    const btnUrl = document.getElementById('tabBtnUrl');

    if (tabUpload) tabUpload.style.display = (tab === 'upload') ? 'block' : 'none';
    if (tabCamera) tabCamera.style.display = (tab === 'camera') ? 'block' : 'none';
    if (tabPreset) tabPreset.style.display = (tab === 'preset') ? 'block' : 'none';
    if (tabUrl) tabUrl.style.display = (tab === 'url') ? 'block' : 'none';

    if (btnUpload) btnUpload.classList.toggle('active', tab === 'upload');
    if (btnCamera) btnCamera.classList.toggle('active', tab === 'camera');
    if (btnPreset) btnPreset.classList.toggle('active', tab === 'preset');
    if (btnUrl) btnUrl.classList.toggle('active', tab === 'url');
  };

  window.handleRoomFileUpload = async function (e) {
    const file = e.target?.files?.[0];
    if (!file) return;

    const statusEl = document.getElementById('roomUploadStatus');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.style.background = 'rgba(255, 210, 63, 0.15)';
      statusEl.style.color = '#FFD23F';
      statusEl.textContent = `⏳ Uploading "${file.name}" to Cloud Storage...`;
    }

    try {
      let uploadFn = window.uploadToSupabaseStorage;
      if (typeof uploadFn === 'function') {
        const result = await uploadFn(file);
        window._lastUploadedRoomPanoUrl = result.url;
        if (statusEl) {
          statusEl.style.background = 'rgba(6, 214, 160, 0.15)';
          statusEl.style.color = '#06D6A0';
          statusEl.textContent = `✅ 360° Photo Ready: ${file.name}`;
        }
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          window._lastUploadedRoomPanoUrl = ev.target.result;
          if (statusEl) {
            statusEl.style.background = 'rgba(6, 214, 160, 0.15)';
            statusEl.style.color = '#06D6A0';
            statusEl.textContent = `✅ 360° Photo Ready: ${file.name}`;
          }
        };
        reader.readAsDataURL(file);
      }

      const nameInp = document.getElementById('newRoomNameInput');
      if (nameInp && !nameInp.value.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        nameInp.value = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }
    } catch (err) {
      console.error('[SpotLIGHT 360] Upload error:', err);
      if (statusEl) {
        statusEl.style.background = 'rgba(255, 77, 109, 0.15)';
        statusEl.style.color = '#FF4D6D';
        statusEl.textContent = '❌ Upload failed. Please try another image or paste URL.';
      }
    }
  };

  window.selectPreset360Pano = function (idx, btn) {
    document.querySelectorAll('.preset-card-btn').forEach(b => b.classList.remove('selected'));
    if (btn) btn.classList.add('selected');
    const preset = PRESET_360_PANOS[idx];
    if (preset) {
      window._selectedPresetPanoUrl = preset.url;
      const nameInp = document.getElementById('newRoomNameInput');
      if (nameInp && (!nameInp.value.trim() || nameInp.value.startsWith('Room '))) {
        nameInp.value = preset.name.replace(/^[^\s]+\s+/, '');
      }
    }
  };

  window.confirmAdd360Room = function () {
    const nameInp = document.getElementById('newRoomNameInput');
    const urlInp = document.getElementById('newRoomUrlInput');

    const name = (nameInp && nameInp.value.trim()) ? nameInp.value.trim() : 'Custom 360° Room';

    let panoUrl = '';
    const tabUpload = document.getElementById('roomTabUpload');
    const tabPreset = document.getElementById('roomTabPreset');

    if (tabUpload && tabUpload.style.display !== 'none' && window._lastUploadedRoomPanoUrl) {
      panoUrl = window._lastUploadedRoomPanoUrl;
    } else if (tabPreset && tabPreset.style.display !== 'none' && window._selectedPresetPanoUrl) {
      panoUrl = window._selectedPresetPanoUrl;
    } else if (urlInp && urlInp.value.trim()) {
      panoUrl = urlInp.value.trim();
    } else if (window._lastUploadedRoomPanoUrl) {
      panoUrl = window._lastUploadedRoomPanoUrl;
    } else if (window._selectedPresetPanoUrl) {
      panoUrl = window._selectedPresetPanoUrl;
    }

    const newId = 'scene-' + Date.now().toString(36);
    const newScene = {
      id: newId,
      name: name,
      location: currentTourData?.location || 'Salt Lake City, UT',
      tag: 'Custom 360° Space',
      panoUrl: panoUrl,
      tourUrl: panoUrl.includes('kuula.co') || panoUrl.includes('thinglink.com') || panoUrl.includes('matterport.com') || panoUrl.includes('360cities.net') || panoUrl.includes('momento360.com') ? panoUrl : '',
      blurb: 'Interactive 360° walk-in space',
      hotspots: [
        { pitch: 0, yaw: 180, label: '🚪 Back to Previous Room', targetScene: activeSceneList[activeSceneIndex]?.id || activeSceneList[0]?.id }
      ]
    };

    activeSceneList.push(newScene);
    window.closeAddRoomDialog();
    window.saveTourChangesToMagazine();
    renderSceneSelector();
    loadScene(activeSceneList.length - 1);

    if (typeof showToast === 'function') {
      showToast(`🎉 New 360° Room "${name}" added! Look around and place doors.`);
    }
  };

  // ==========================================
  // 3. EDIT EXISTING ROOM / SPACE
  // ==========================================

  window.openEditRoomDialog = function (sceneIdx) {
    const modal = document.getElementById('tourEditRoomModal');
    if (!modal) return;

    const idx = (typeof sceneIdx === 'number' && sceneIdx >= 0 && sceneIdx < activeSceneList.length) ? sceneIdx : activeSceneIndex;
    const scene = activeSceneList[idx];
    if (!scene) return;

    window._lastUploadedEditRoomPanoUrl = null;
    window._selectedEditPresetPanoUrl = null;

    const idxInp = document.getElementById('editRoomTargetIndex');
    const titleEl = document.getElementById('editRoomModalTitle');
    const nameInp = document.getElementById('editRoomNameInput');
    const tagInp = document.getElementById('editRoomTagInput');
    const urlInp = document.getElementById('editRoomUrlInput');
    const blurbInp = document.getElementById('editRoomBlurbInput');
    const delBtn = document.getElementById('editRoomDeleteBtn');
    const statusEl = document.getElementById('editRoomUploadStatus');

    if (idxInp) idxInp.value = idx;
    if (titleEl) titleEl.textContent = `✏️ Edit Room: ${scene.name}`;
    if (nameInp) nameInp.value = scene.name || '';
    if (tagInp) tagInp.value = scene.tag || '';
    if (urlInp) urlInp.value = scene.tourUrl || scene.panoUrl || '';
    if (blurbInp) blurbInp.value = scene.blurb || '';
    if (statusEl) { statusEl.style.display = 'none'; statusEl.textContent = ''; }

    // Delete button logic (cannot delete if it's the only room)
    if (delBtn) {
      if (activeSceneList.length <= 1) {
        delBtn.style.opacity = '0.4';
        delBtn.style.cursor = 'not-allowed';
        delBtn.title = 'Cannot delete the only room in a tour';
      } else {
        delBtn.style.opacity = '1';
        delBtn.style.cursor = 'pointer';
        delBtn.title = `Delete "${scene.name}" permanently`;
      }
    }

    // Populate Presets Grid
    const grid = document.getElementById('editPresetPanosGrid');
    if (grid) {
      grid.innerHTML = PRESET_360_PANOS.map((p, pIdx) => `
        <button type="button" class="preset-card-btn ${scene.panoUrl === p.url ? 'selected' : ''}" onclick="window.selectEditPreset360Pano(${pIdx}, this)">
          <span class="preset-card-name">${p.name}</span>
          <span class="preset-card-tag">${p.tag}</span>
        </button>
      `).join('');
    }

    // Populate Hotspots in this room
    const hsList = document.getElementById('editRoomHotspotsList');
    const hsCount = document.getElementById('editRoomHsCount');
    const hotspots = Array.isArray(scene.hotspots) ? scene.hotspots : [];
    if (hsCount) hsCount.textContent = hotspots.length;
    if (hsList) {
      if (hotspots.length === 0) {
        hsList.innerHTML = `<div style="font-size:10px;color:rgba(255,255,255,0.45);font-style:italic;">No door pins in this room yet. Use "+ PLACE DOOR PIN" in builder mode.</div>`;
      } else {
        hsList.innerHTML = hotspots.map((h, hIdx) => {
          const targetSc = activeSceneList.find(s => s.id === h.targetScene);
          const targetName = targetSc ? targetSc.name : 'Another Room';
          return `
            <div class="tour-hs-item">
              <span style="font-weight:700;color:#FFD23F;">${h.label || '🚪 Door Pin'}</span>
              <span style="font-size:10px;color:rgba(255,255,255,0.6);">➔ ${targetName}</span>
              <button type="button" class="tour-pill-del-btn" style="width:20px;height:20px;font-size:9px;" onclick="window.deleteHotspotFromEditDialog(${idx}, ${hIdx})" title="Delete this door pin">✕</button>
            </div>
          `;
        }).join('');
      }
    }

    window.switchEditRoomTab(scene.panoUrl && scene.panoUrl.startsWith('http') ? 'preset' : 'upload');
    modal.style.display = 'flex';
  };

  window.closeEditRoomDialog = function () {
    const modal = document.getElementById('tourEditRoomModal');
    if (modal) modal.style.display = 'none';
  };

  window.switchEditRoomTab = function (tab) {
    const tabUpload = document.getElementById('editRoomTabUpload');
    const tabCamera = document.getElementById('editRoomTabCamera');
    const tabPreset = document.getElementById('editRoomTabPreset');
    const tabUrl = document.getElementById('editRoomTabUrl');

    const btnUpload = document.getElementById('editTabBtnUpload');
    const btnCamera = document.getElementById('editTabBtnCamera');
    const btnPreset = document.getElementById('editTabBtnPreset');
    const btnUrl = document.getElementById('editTabBtnUrl');

    if (tabUpload) tabUpload.style.display = (tab === 'upload') ? 'block' : 'none';
    if (tabCamera) tabCamera.style.display = (tab === 'camera') ? 'block' : 'none';
    if (tabPreset) tabPreset.style.display = (tab === 'preset') ? 'block' : 'none';
    if (tabUrl) tabUrl.style.display = (tab === 'url') ? 'block' : 'none';

    if (btnUpload) btnUpload.classList.toggle('active', tab === 'upload');
    if (btnCamera) btnCamera.classList.toggle('active', tab === 'camera');
    if (btnPreset) btnPreset.classList.toggle('active', tab === 'preset');
    if (btnUrl) btnUrl.classList.toggle('active', tab === 'url');
  };

  window.handleEditRoomFileUpload = async function (e) {
    const file = e.target?.files?.[0];
    if (!file) return;

    const statusEl = document.getElementById('editRoomUploadStatus');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.style.background = 'rgba(255, 210, 63, 0.15)';
      statusEl.style.color = '#FFD23F';
      statusEl.textContent = `⏳ Uploading "${file.name}" to Cloud Storage...`;
    }

    try {
      let uploadFn = window.uploadToSupabaseStorage;
      if (typeof uploadFn === 'function') {
        const result = await uploadFn(file);
        window._lastUploadedEditRoomPanoUrl = result.url;
        if (statusEl) {
          statusEl.style.background = 'rgba(6, 214, 160, 0.15)';
          statusEl.style.color = '#06D6A0';
          statusEl.textContent = `✅ 360° Photo Ready: ${file.name}`;
        }
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          window._lastUploadedEditRoomPanoUrl = ev.target.result;
          if (statusEl) {
            statusEl.style.background = 'rgba(6, 214, 160, 0.15)';
            statusEl.style.color = '#06D6A0';
            statusEl.textContent = `✅ 360° Photo Ready: ${file.name}`;
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('[SpotLIGHT 360 Edit] Upload error:', err);
      if (statusEl) {
        statusEl.style.background = 'rgba(255, 77, 109, 0.15)';
        statusEl.style.color = '#FF4D6D';
        statusEl.textContent = '❌ Upload failed. Try another image or paste URL.';
      }
    }
  };

  window.selectEditPreset360Pano = function (idx, btn) {
    document.querySelectorAll('#editPresetPanosGrid .preset-card-btn').forEach(b => b.classList.remove('selected'));
    if (btn) btn.classList.add('selected');
    const preset = PRESET_360_PANOS[idx];
    if (preset) {
      window._selectedEditPresetPanoUrl = preset.url;
    }
  };

  window.deleteHotspotFromEditDialog = function (roomIdx, hsIdx) {
    const scene = activeSceneList[roomIdx];
    if (!scene || !Array.isArray(scene.hotspots) || !scene.hotspots[hsIdx]) return;
    scene.hotspots.splice(hsIdx, 1);
    syncHotspotsDom();
    window.openEditRoomDialog(roomIdx);
    window.saveTourChangesToMagazine();
  };

  window.confirmSaveEditRoom = function () {
    const idxInp = document.getElementById('editRoomTargetIndex');
    const idx = parseInt(idxInp ? idxInp.value : '0', 10);
    const scene = activeSceneList[idx];
    if (!scene) return;

    const nameInp = document.getElementById('editRoomNameInput');
    const tagInp = document.getElementById('editRoomTagInput');
    const urlInp = document.getElementById('editRoomUrlInput');
    const blurbInp = document.getElementById('editRoomBlurbInput');

    if (nameInp && nameInp.value.trim()) scene.name = nameInp.value.trim();
    if (tagInp && tagInp.value.trim()) scene.tag = tagInp.value.trim();
    if (blurbInp) scene.blurb = blurbInp.value.trim();

    // Check updated 360 photo source
    const tabUpload = document.getElementById('editRoomTabUpload');
    const tabPreset = document.getElementById('editRoomTabPreset');

    if (tabUpload && tabUpload.style.display !== 'none' && window._lastUploadedEditRoomPanoUrl) {
      scene.panoUrl = window._lastUploadedEditRoomPanoUrl;
      scene.tourUrl = '';
    } else if (tabPreset && tabPreset.style.display !== 'none' && window._selectedEditPresetPanoUrl) {
      scene.panoUrl = window._selectedEditPresetPanoUrl;
      scene.tourUrl = '';
    } else if (urlInp && urlInp.value.trim()) {
      const u = urlInp.value.trim();
      if (u.includes('kuula.co') || u.includes('thinglink.com') || u.includes('matterport.com') || u.includes('360cities.net') || u.includes('momento360.com')) {
        scene.tourUrl = u;
        scene.panoUrl = '';
      } else {
        scene.panoUrl = u;
        scene.tourUrl = '';
      }
    } else if (window._lastUploadedEditRoomPanoUrl) {
      scene.panoUrl = window._lastUploadedEditRoomPanoUrl;
      scene.tourUrl = '';
    } else if (window._selectedEditPresetPanoUrl) {
      scene.panoUrl = window._selectedEditPresetPanoUrl;
      scene.tourUrl = '';
    }

    window.closeEditRoomDialog();
    renderSceneSelector();

    // If currently viewing this room, refresh view
    if (idx === activeSceneIndex) {
      loadScene(activeSceneIndex);
    }

    window.saveTourChangesToMagazine();

    if (typeof showToast === 'function') {
      showToast(`✅ Room "${scene.name}" updated!`);
    }
  };

  // ==========================================
  // 4. DELETE ROOM / SPACE
  // ==========================================

  window.deleteTourRoom = function (idx) {
    if (typeof idx !== 'number' || idx < 0 || idx >= activeSceneList.length) {
      idx = activeSceneIndex;
    }

    if (activeSceneList.length <= 1) {
      if (typeof showToast === 'function') {
        showToast('⚠️ A tour must have at least 1 room. Create another room first before deleting this one!');
      } else {
        alert('A tour must have at least 1 room. Create another room first before deleting this one!');
      }
      return;
    }

    const roomToDelete = activeSceneList[idx];
    const roomName = roomToDelete ? roomToDelete.name : `Room ${idx + 1}`;
    const deletedId = roomToDelete?.id;

    if (!confirm(`Are you sure you want to delete "${roomName}"? This will permanently remove this room and any door pins pointing to it.`)) {
      return;
    }

    // 1. Remove room from list
    activeSceneList.splice(idx, 1);

    // 2. Clean up any hotspots in other rooms pointing to the deleted room
    if (deletedId) {
      activeSceneList.forEach(sc => {
        if (Array.isArray(sc.hotspots)) {
          sc.hotspots = sc.hotspots.filter(h => h.targetScene !== deletedId);
        }
      });
    }

    // 3. Compute new active scene index
    if (idx === activeSceneIndex) {
      activeSceneIndex = Math.max(0, idx > 0 ? idx - 1 : 0);
    } else if (activeSceneIndex > idx) {
      activeSceneIndex = Math.max(0, activeSceneIndex - 1);
    }
    if (activeSceneIndex >= activeSceneList.length) {
      activeSceneIndex = activeSceneList.length - 1;
    }

    window.closeEditRoomDialog();
    window.closeManageRoomsDialog();

    loadScene(activeSceneIndex);
    renderSceneSelector();
    window.saveTourChangesToMagazine();

    if (typeof showToast === 'function') {
      showToast(`🗑️ Deleted "${roomName}" from tour!`);
    }
  };

  window.confirmDeleteCurrentRoom = function () {
    window.deleteTourRoom(activeSceneIndex);
  };

  window.confirmDeleteFromEditModal = function () {
    const idxInp = document.getElementById('editRoomTargetIndex');
    const idx = parseInt(idxInp ? idxInp.value : '-1', 10);
    if (idx >= 0) {
      window.deleteTourRoom(idx);
    }
  };

  // ==========================================
  // 5. MANAGE ALL ROOMS MODAL
  // ==========================================

  window.openManageRoomsDialog = function () {
    const modal = document.getElementById('tourManageRoomsModal');
    if (!modal) return;

    const listEl = document.getElementById('manageRoomsList');
    if (listEl) {
      listEl.innerHTML = activeSceneList.map((sc, i) => {
        const isCur = (i === activeSceneIndex);
        const hsCount = Array.isArray(sc.hotspots) ? sc.hotspots.length : 0;
        return `
          <div class="manage-room-row ${isCur ? 'current-scene' : ''}">
            <div class="manage-room-info">
              <div class="manage-room-title">
                ${isCur ? '📍 ' : ''}${sc.name}
              </div>
              <div class="manage-room-tag">
                ${sc.tag || '360° Space'} · ${hsCount} door pin${hsCount === 1 ? '' : 's'}
              </div>
            </div>
            <div class="manage-room-actions">
              ${!isCur ? `
                <button type="button" class="tour-dialog-btn" style="background:rgba(255,255,255,0.1);color:#fff;padding:5px 10px;font-size:10px;" onclick="window.closeManageRoomsDialog(); window.switchTourSceneIndex(${i})">
                  👁️ JUMP
                </button>
              ` : `
                <span style="font-size:10px;font-weight:800;color:#06D6A0;padding:4px 8px;">CURRENT</span>
              `}
              <button type="button" class="tour-dialog-btn" style="background:#FFD23F;color:#14121A;padding:5px 10px;font-size:10px;" onclick="window.closeManageRoomsDialog(); window.openEditRoomDialog(${i})">
                ✏️ EDIT
              </button>
              ${activeSceneList.length > 1 ? `
                <button type="button" class="tour-dialog-btn tour-dialog-btn-danger" style="padding:5px 10px;font-size:10px;" onclick="window.deleteTourRoom(${i})">
                  🗑️
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    modal.style.display = 'flex';
  };

  window.closeManageRoomsDialog = function () {
    const modal = document.getElementById('tourManageRoomsModal');
    if (modal) modal.style.display = 'none';
  };

  // ==========================================
  // 6. ADMIN AUTH UNLOCK DIALOG (FOR SAVING TO CLOUD)
  // ==========================================

  window.openTourAdminAuthModal = function () {
    const modal = document.getElementById('tourAdminAuthModal');
    if (!modal) return;
    const statusEl = document.getElementById('tourAdminAuthStatus');
    if (statusEl) { statusEl.style.display = 'none'; statusEl.textContent = ''; }
    const pwd = document.getElementById('tourAdminPasswordInput');
    if (pwd) { pwd.value = ''; }
    modal.style.display = 'flex';
    setTimeout(() => { if (pwd) pwd.focus(); }, 100);
  };

  window.closeTourAdminAuthModal = function () {
    const modal = document.getElementById('tourAdminAuthModal');
    if (modal) modal.style.display = 'none';
  };

  window.submitTourAdminUnlock = async function () {
    const pwdInput = document.getElementById('tourAdminPasswordInput');
    const statusEl = document.getElementById('tourAdminAuthStatus');
    const unlockBtn = document.getElementById('tourAdminUnlockBtn');
    const password = pwdInput ? pwdInput.value.trim() : '';

    if (!password) {
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.background = 'rgba(255, 77, 109, 0.2)';
        statusEl.style.color = '#FF4D6D';
        statusEl.textContent = 'Please enter your admin password.';
      }
      return;
    }

    if (unlockBtn) { unlockBtn.textContent = 'AUTHENTICATING...'; unlockBtn.disabled = true; }

    try {
      const adminEmail = (typeof ADMIN_EMAIL !== 'undefined') ? ADMIN_EMAIL : 'lfsm111@icloud.com';
      const sbClient = (typeof sb !== 'undefined') ? sb : (window.sb || (window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)));
      
      const { data, error } = await sbClient.auth.signInWithPassword({ email: adminEmail, password });
      if (error || !data.session) {
        throw new Error(error?.message || 'Incorrect password');
      }

      window.isEditorUnlocked = true;
      if (typeof isEditorUnlocked !== 'undefined') isEditorUnlocked = true;
      const editorToggleEl = document.getElementById('editorToggle');
      if (editorToggleEl) editorToggleEl.style.display = 'block';

      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.background = 'rgba(6, 214, 160, 0.2)';
        statusEl.style.color = '#06D6A0';
        statusEl.textContent = '✅ Authenticated! Saving tour live to Supabase Cloud...';
      }

      // Perform cloud save
      if (typeof window.saveMagazineData === 'function' && window.MAGAZINE) {
        await window.saveMagazineData(window.MAGAZINE);
      }

      setTimeout(() => {
        window.closeTourAdminAuthModal();
        const saveBtn = document.getElementById('tourSaveEveryoneBtn');
        if (saveBtn) {
          saveBtn.textContent = '✅ SAVED FOR EVERYONE!';
          setTimeout(() => { saveBtn.textContent = '💾 SAVE TOUR FOR EVERYONE'; }, 2500);
        }
        if (typeof showToast === 'function') {
          showToast('☁️ 360° Walkthrough Tour Saved to Cloud for Everyone!');
        }
      }, 500);
    } catch (err) {
      console.error('[SpotLIGHT Auth]', err);
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.background = 'rgba(255, 77, 109, 0.2)';
        statusEl.style.color = '#FF4D6D';
        statusEl.textContent = '❌ Incorrect password. Please try again.';
      }
      if (pwdInput) { pwdInput.value = ''; pwdInput.focus(); }
    } finally {
      if (unlockBtn) { unlockBtn.textContent = '🔐 UNLOCK & SAVE TO CLOUD'; unlockBtn.disabled = false; }
    }
  };

  // ==========================================
  // 7. EDIT / DELETE HOTSPOT DIALOG
  // ==========================================
  window.editHotspotDetails = function (index, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene || !curScene.hotspots || !curScene.hotspots[index]) return;
    const hs = curScene.hotspots[index];

    const modal = document.getElementById('tourEditHotspotModal');
    if (!modal) return;

    const idxInp = document.getElementById('editHsIndex');
    const labelInp = document.getElementById('editHsLabelInput');
    const select = document.getElementById('editHsTargetSceneSelect');

    if (idxInp) idxInp.value = index;
    if (labelInp) labelInp.value = hs.label;

    if (select) {
      select.innerHTML = activeSceneList.map(sc => `
        <option value="${sc.id}" ${sc.id === hs.targetScene ? 'selected' : ''}>
          ${sc.name}
        </option>
      `).join('');
    }

    modal.style.display = 'flex';
  };

  window.closeEditHotspotDialog = function () {
    const modal = document.getElementById('tourEditHotspotModal');
    if (modal) modal.style.display = 'none';
  };

  window.realignHotspotToCurrentCamera = function () {
    const idxInp = document.getElementById('editHsIndex');
    const idx = parseInt(idxInp ? idxInp.value : '-1', 10);
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene || !curScene.hotspots || !curScene.hotspots[idx]) return;

    curScene.hotspots[idx].pitch = Math.round(pitch);
    curScene.hotspots[idx].yaw = Math.round(yaw);

    syncHotspotsDom();
    if (typeof showToast === 'function') {
      showToast(`🎯 Hotspot aligned to Yaw ${Math.round(yaw)}°, Pitch ${Math.round(pitch)}°!`);
    }
  };

  window.saveHotspotEdit = function () {
    const idxInp = document.getElementById('editHsIndex');
    const labelInp = document.getElementById('editHsLabelInput');
    const select = document.getElementById('editHsTargetSceneSelect');

    const idx = parseInt(idxInp ? idxInp.value : '-1', 10);
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene || !curScene.hotspots || !curScene.hotspots[idx]) return;

    const hs = curScene.hotspots[idx];
    if (labelInp) hs.label = labelInp.value.trim() || hs.label;
    if (select) hs.targetScene = select.value;

    window.closeEditHotspotDialog();
    syncHotspotsDom();
    window.saveTourChangesToMagazine();

    if (typeof showToast === 'function') {
      showToast('✅ Hotspot updated!');
    }
  };

  window.confirmDeleteHotspot = function () {
    const idxInp = document.getElementById('editHsIndex');
    const idx = parseInt(idxInp ? idxInp.value : '-1', 10);
    window.deleteHotspot(idx);
    window.closeEditHotspotDialog();
  };

  window.deleteHotspot = function (index, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene || !curScene.hotspots || index < 0 || index >= curScene.hotspots.length) return;
    
    curScene.hotspots.splice(index, 1);
    syncHotspotsDom();
    window.saveTourChangesToMagazine();

    if (typeof showToast === 'function') {
      showToast('🗑️ Hotspot deleted');
    }
  };

  /**
   * Universal Cloud Persistence for 360 Tours
   * Updates Magazine, Supabase, LocalCache and Live Views
   */
  window.saveTourChangesToMagazine = async function () {
    const saveBtn = document.getElementById('tourSaveEveryoneBtn');
    if (saveBtn) {
      saveBtn.textContent = '⏳ SAVING TO CLOUD...';
      saveBtn.disabled = true;
    }

    const tourJson = JSON.stringify({ scenes: activeSceneList });

    // 1. Update active editing ad reference
    if (window.currentEditingAdRef) {
      window.currentEditingAdRef.tourConfig = { scenes: activeSceneList };
      window.currentEditingAdRef.tour3d = tourJson;
      window.currentEditingAdRef.tourUrl = tourJson;
    }

    // 2. Update magazine city ad if indices or title match
    if (window.MAGAZINE && Array.isArray(window.MAGAZINE.cities)) {
      let matchedAd = false;
      if (typeof window.currentEditingCityIdx === 'number' && typeof window.currentEditingAdIdx === 'number') {
        const cIdx = window.currentEditingCityIdx;
        const aIdx = window.currentEditingAdIdx;
        if (window.MAGAZINE.cities[cIdx] && Array.isArray(window.MAGAZINE.cities[cIdx].ads) && window.MAGAZINE.cities[cIdx].ads[aIdx]) {
          window.MAGAZINE.cities[cIdx].ads[aIdx].tour3d = tourJson;
          window.MAGAZINE.cities[cIdx].ads[aIdx].tourUrl = tourJson;
          window.MAGAZINE.cities[cIdx].ads[aIdx].tourConfig = { scenes: activeSceneList };
          matchedAd = true;
        }
      }
      // If not matched by index, find matching ad by title/tag across all cities
      if (!matchedAd && currentTourData && currentTourData.title) {
        const searchTitle = currentTourData.title.toLowerCase();
        for (let ci = 0; ci < window.MAGAZINE.cities.length; ci++) {
          const city = window.MAGAZINE.cities[ci];
          if (city && Array.isArray(city.ads)) {
            for (let ai = 0; ai < city.ads.length; ai++) {
              const ad = city.ads[ai];
              if (ad && ad.name && ad.name.toLowerCase() === searchTitle) {
                ad.tour3d = tourJson;
                ad.tourUrl = tourJson;
                ad.tourConfig = { scenes: activeSceneList };
                matchedAd = true;
                break;
              }
            }
          }
          if (matchedAd) break;
        }
      }
    }

    // 3. Update community post if editing community spot
    if (window.currentEditingSpotId && typeof window.saveCommunitySpotTour === 'function') {
      try {
        await window.saveCommunitySpotTour(window.currentEditingSpotId, tourJson);
      } catch (e) {}
    }

    // 4. Update local caches
    try {
      localStorage.setItem('spotlight_tour_' + (currentTourData?.title || 'active'), tourJson);
      localStorage.setItem('spotlight_latest_tour', tourJson);
      if (window.MAGAZINE) {
        localStorage.setItem('spotlight_magazine_content_v5', JSON.stringify(window.MAGAZINE));
      }
    } catch (e) {}

    // 5. Update open input fields in Admin Editor
    try {
      const tourInputs = document.querySelectorAll('input[data-ad="tour3d"]');
      tourInputs.forEach(inp => {
        const adEl = inp.closest('.ad-editor');
        if (adEl && typeof window.currentEditingAdIdx === 'number' && +adEl.dataset.ai === window.currentEditingAdIdx) {
          inp.value = tourJson;
        } else if (!adEl) {
          inp.value = tourJson;
        }
      });
    } catch (e) {}

    // 6. Refresh live views
    if (typeof window.applyMagazineUpdates === 'function') {
      try { window.applyMagazineUpdates(); } catch (e) {}
    }
    if (typeof window.render === 'function') {
      try { window.render(); } catch (e) {}
    }

    // 7. Check if user has active admin session or if password unlock modal is needed for Supabase
    let savedToCloud = false;
    if (typeof window.saveMagazineData === 'function' && window.MAGAZINE) {
      try {
        await window.saveMagazineData(window.MAGAZINE);
        savedToCloud = true;
      } catch (err) {
        console.warn('[SpotLIGHT Tour] Direct Supabase save error:', err);
        // If save failed because admin authentication is needed:
        if (!window.isEditorUnlocked) {
          if (saveBtn) {
            saveBtn.textContent = '💾 SAVE TOUR FOR EVERYONE';
            saveBtn.disabled = false;
          }
          window.openTourAdminAuthModal();
          return;
        }
      }
    }

    if (saveBtn) {
      saveBtn.textContent = savedToCloud ? '✅ SAVED FOR EVERYONE!' : '💾 SAVED LOCALLY';
      setTimeout(() => {
        saveBtn.textContent = '💾 SAVE TOUR FOR EVERYONE';
        saveBtn.disabled = false;
      }, 2500);
    }

    if (typeof showToast === 'function') {
      showToast(savedToCloud ? '☁️ 360° Walkthrough Tour Saved to Cloud for Everyone!' : '💾 360° Tour Saved Locally!');
    }
  };

  // =========================================================================
  // 360° CAMERA CAPTURE & REAL-TIME EQUIRECTANGULAR STITCHER ENGINE
  // (In-browser spatial panorama scanner inspired by Teleport & HDReye)
  // =========================================================================

  // HDReye / Street View style multi-row spherical capture grid
  // Upper row + lower row + horizon = full up/down coverage
  const SCAN_ROWS = [
    { pitch:  38, count: 8  },  // look up
    { pitch:   0, count: 12 },  // horizon
    { pitch: -38, count: 8  }   // look down
  ];
  let SCAN_TOTAL_NODES = 0;

  let scanMode = 'new_room'; // 'new_room' or 'replace_room'
  let scanStream = null;
  let scanCameraFacing = 'environment'; // rear camera by default
  let scanSlots = [];
  let scanCurrentYaw = 0;
  let scanCurrentPitch = 0;
  let scanBaseYawOffset = 0;
  let scanHasGyro = false;
  let scanAutoSnap = true;
  let scanAlignTimer = null;
  let scanAlignedAngleIdx = -1;
  let scanIsDragging = false;
  let scanDragStartX = 0;
  let scanDragStartY = 0;
  let scanDragStartYaw = 0;
  let scanDragStartPitch = 0;
  let scanLoopAnimId = null;
  let scanSmoothYaw = 0;
  let scanSmoothPitch = 0;
  let scanNodeEls = [];          // persistent DOM nodes — never recreate
  let scanNodesInitialized = false;

  function initScanSlots() {
    scanSlots = [];
    SCAN_ROWS.forEach(row => {
      const step = 360 / row.count;
      for (let i = 0; i < row.count; i++) {
        scanSlots.push({
          yaw: i * step,
          pitch: row.pitch,
          captured: false,
          imgCanvas: null,
          timestamp: 0
        });
      }
    });
    SCAN_TOTAL_NODES = scanSlots.length; // 28
  }

  function normalizeAngle360(deg) {
    let d = deg % 360;
    if (d < 0) d += 360;
    return d;
  }

  function angleDiffSigned(target, current) {
    let diff = (target - current + 180) % 360 - 180;
    return diff < -180 ? diff + 360 : diff;
  }

  window.open360CameraScanner = async function (mode = 'new_room') {
    const unlocked = !!(window.isEditorUnlocked || (typeof isEditorUnlocked !== 'undefined' && isEditorUnlocked));
    if (!unlocked) {
      if (typeof showToast === 'function') showToast('🔒 360 scanner is only available after unlocking the editor.');
      const pw = document.getElementById('passwordModal');
      if (pw) pw.classList.add('show');
      return;
    }
    scanMode = mode;
    initScanSlots();
    scanCurrentYaw = 0;
    scanCurrentPitch = 0;
    scanSmoothYaw = 0;
    scanSmoothPitch = 0;
    scanBaseYawOffset = 0;
    scanHasGyro = false;
    scanAlignedAngleIdx = -1;
    scanNodesInitialized = false;
    scanNodeEls = [];
    const nodesLayerReset = document.getElementById('scanNodesLayer');
    if (nodesLayerReset) nodesLayerReset.innerHTML = '';

    const modal = document.getElementById('tourCameraScanModal');
    if (!modal) return;
    modal.style.display = 'flex';

    renderScanSlotsRibbon();
    updateScanProgressBar();
    clearStitchPreviewCanvas();

    // Start video camera feed
    await startScannerCameraFeed();

    // Setup Gyroscope & Interactive Drag
    bindScannerSensors();

    // Start UI Animation Loop
    if (scanLoopAnimId) cancelAnimationFrame(scanLoopAnimId);
    runScannerLoop();

    if (typeof showToast === 'function') {
      showToast('📸 360° Scanner active! Rotate your camera to point at the white circles (tilt up & down too).');
    }
  };

  async function startScannerCameraFeed() {
    const video = document.getElementById('scanVideoFeed');
    if (!video) return;

    if (scanStream) {
      scanStream.getTracks().forEach(t => t.stop());
      scanStream = null;
    }

    try {
      const constraints = {
        video: {
          facingMode: scanCameraFacing,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        },
        audio: false
      };

      scanStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = scanStream;
      await video.play().catch(e => console.warn('Video play deferred:', e));
    } catch (err) {
      console.warn('[SpotLIGHT 360 Scanner] Camera stream error with high-res, fallback to standard video:', err);
      try {
        scanStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = scanStream;
        await video.play().catch(e => console.warn('Video play deferred fallback:', e));
      } catch (err2) {
        console.error('[SpotLIGHT 360 Scanner] Camera access failed:', err2);
        const ringStatus = document.getElementById('scanRingStatus');
        if (ringStatus) {
          ringStatus.textContent = 'CAMERA BLOCKED · ALLOW PERMISSIONS';
          ringStatus.style.color = '#FF4D6D';
        }
        if (typeof showToast === 'function') {
          showToast('⚠️ Camera permission needed to scan. Please allow camera in browser settings.');
        }
      }
    }
  }

  window.toggleCameraFacingMode = async function () {
    scanCameraFacing = (scanCameraFacing === 'environment') ? 'user' : 'environment';
    await startScannerCameraFeed();
    if (typeof showToast === 'function') {
      showToast(`🔄 Camera switched to: ${scanCameraFacing === 'environment' ? 'Rear / World' : 'Front / Self'}`);
    }
  };

  function bindScannerSensors() {
    const sensorPill = document.getElementById('scanSensorModePill');
    const viewfinder = document.getElementById('scanViewfinderArea');

    // Request iOS 13+ DeviceOrientation permission if required
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(resp => {
        if (resp === 'granted') {
          setupDeviceOrientationListener();
        } else {
          setupVirtualDragControls();
        }
      }).catch(() => setupVirtualDragControls());
    } else if (window.DeviceOrientationEvent) {
      setupDeviceOrientationListener();
    } else {
      setupVirtualDragControls();
    }

    function setupDeviceOrientationListener() {
      let firstReading = true;
      const handleOrientation = (e) => {
        if (e.alpha !== null && e.beta !== null) {
          scanHasGyro = true;
          if (sensorPill) {
            sensorPill.textContent = '📳 GYRO SENSOR ACTIVE';
            sensorPill.style.color = '#06D6A0';
            sensorPill.style.borderColor = '#06D6A0';
          }

          // Prefer webkitCompassHeading (true compass) when available — far more stable than alpha
          let rawYaw;
          if (typeof e.webkitCompassHeading === 'number' && !isNaN(e.webkitCompassHeading)) {
            rawYaw = e.webkitCompassHeading; // 0 = North, clockwise
          } else {
            rawYaw = 360 - (e.alpha || 0);
          }
          // beta: 90 = phone upright vertical → pitch 0
          let rawPitch = (e.beta || 90) - 90;
          rawPitch = Math.max(-80, Math.min(80, rawPitch));

          if (firstReading) {
            scanBaseYawOffset = rawYaw;
            scanSmoothYaw = 0;
            scanSmoothPitch = rawPitch;
            firstReading = false;
          }

          const targetYaw = normalizeAngle360(rawYaw - scanBaseYawOffset);
          const targetPitch = rawPitch;

          // Very strong low-pass so circles stay glued to walls / floor / ceiling
          let dy = angleDiffSigned(targetYaw, scanSmoothYaw);
          // Ignore compass noise under 1.2°
          if (Math.abs(dy) < 1.2) dy = 0;
          // 0.05 = heavily damped (anchored); pitch a bit freer for aiming up/down
          scanSmoothYaw = normalizeAngle360(scanSmoothYaw + dy * 0.05);
          scanSmoothPitch = scanSmoothPitch + (targetPitch - scanSmoothPitch) * 0.14;
          scanCurrentYaw = scanSmoothYaw;
          scanCurrentPitch = scanSmoothPitch;
        }
      };

      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }

    function setupVirtualDragControls() {
      if (sensorPill) {
        sensorPill.textContent = '👆 TOUCH / DRAG SCAN ACTIVE';
        sensorPill.style.color = '#FFD23F';
        sensorPill.style.borderColor = '#FFD23F';
      }
    }

    // Always attach mouse/touch listeners for manual view dragging or desktop use
    if (viewfinder && !viewfinder._hasDragListeners) {
      viewfinder._hasDragListeners = true;

      const onStart = (clientX, clientY) => {
        scanIsDragging = true;
        scanDragStartX = clientX;
        scanDragStartY = clientY;
        scanDragStartYaw = scanCurrentYaw;
        scanDragStartPitch = scanCurrentPitch;
      };

      const onMove = (clientX, clientY) => {
        if (!scanIsDragging) return;
        const dx = clientX - scanDragStartX;
        const dy = clientY - scanDragStartY;

        scanCurrentYaw = normalizeAngle360(scanDragStartYaw - dx * 0.35);
        scanCurrentPitch = Math.max(-80, Math.min(80, scanDragStartPitch + dy * 0.35));
        scanSmoothYaw = scanCurrentYaw;
        scanSmoothPitch = scanCurrentPitch;
      };

      const onEnd = () => {
        scanIsDragging = false;
      };

      viewfinder.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
      window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
      window.addEventListener('mouseup', onEnd);

      viewfinder.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          onStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && scanIsDragging) {
          onMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      window.addEventListener('touchend', onEnd);
    }
  }

  function runScannerLoop() {
    const anglePill = document.getElementById('scanAnglePill');
    const centerRing = document.getElementById('scanCenterRing');
    const ringStatus = document.getElementById('scanRingStatus');
    const nodesLayer = document.getElementById('scanNodesLayer');
    const guideArrow = document.getElementById('scanGuideArrow');
    const guideIcon = document.getElementById('scanGuideIcon');
    const guideText = document.getElementById('scanGuideText');
    const viewfinder = document.getElementById('scanViewfinderArea');

    if (anglePill) {
      anglePill.textContent = `YAW: ${Math.round(scanCurrentYaw)}° · PITCH: ${Math.round(scanCurrentPitch)}°`;
    }

    if (viewfinder && nodesLayer) {
      const vw = viewfinder.clientWidth || window.innerWidth;
      const vh = viewfinder.clientHeight || (window.innerHeight * 0.6);
      const centerX = vw / 2;
      const centerY = vh / 2;
      // Approximate horizontal & vertical FOV of phone camera on screen
      const hFov = 64; // match stitch CAM_HFOV so circles map the room accurately
      const vFov = hFov * (vh / Math.max(vw, 1));

      // Create nodes ONCE
      if (!scanNodesInitialized) {
        nodesLayer.innerHTML = '';
        scanNodeEls = scanSlots.map((slot, idx) => {
          const el = document.createElement('div');
          el.className = 'scan-node-marker pending';
          el.dataset.idx = String(idx);
          el.innerHTML = '<span></span>';
          el.style.pointerEvents = 'auto';
          el.onclick = () => window.captureSpecificScanAngle(idx);
          nodesLayer.appendChild(el);
          return el;
        });
        scanNodesInitialized = true;
      }

      let closestUncapturedIdx = -1;
      let minAngularDistance = 999;
      let alignedTargetIdx = -1;

      // Update every node with pure transform (GPU, no layout jump)
      for (let idx = 0; idx < scanSlots.length; idx++) {
        const slot = scanSlots[idx];
        const el = scanNodeEls[idx];
        if (!el) continue;

        const diffYaw = angleDiffSigned(slot.yaw, scanCurrentYaw);
        const diffPitch = slot.pitch - scanCurrentPitch;
        const angularDist = Math.hypot(diffYaw, diffPitch);

        if (!slot.captured && angularDist < minAngularDistance) {
          minAngularDistance = angularDist;
          closestUncapturedIdx = idx;
        }

        // Project onto viewfinder
        const screenX = centerX + (diffYaw / hFov) * vw;
        const screenY = centerY - (diffPitch / vFov) * vh;
        const isVisible = Math.abs(diffYaw) < hFov * 0.95 && Math.abs(diffPitch) < vFov * 0.95;

        if (angularDist < 8) {
          alignedTargetIdx = idx;
        }

        // GPU-only positioning — zero glitch
        el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%)`;
        el.style.opacity = isVisible ? '1' : '0';
        el.style.visibility = isVisible ? 'visible' : 'hidden';
        el.style.pointerEvents = isVisible ? 'auto' : 'none';

        // State classes (HDReye-style: clean white dots → green when done)
        const span = el.querySelector('span');
        el.classList.remove('pending', 'aligned', 'captured');
        if (slot.captured) {
          el.classList.add('captured');
          if (span) span.textContent = '✓';
        } else if (angularDist < 8) {
          el.classList.add('aligned');
          if (span) span.textContent = '';
        } else {
          el.classList.add('pending');
          if (span) span.textContent = '';
        }
      }

      // Center reticle
      if (alignedTargetIdx !== -1) {
        const slot = scanSlots[alignedTargetIdx];
        if (centerRing) {
          centerRing.classList.add('aligned');
          centerRing.classList.toggle('captured', !!slot.captured);
        }
        if (ringStatus) {
          const rowLabel = slot.pitch > 15 ? 'UP' : (slot.pitch < -15 ? 'DOWN' : 'LEVEL');
          ringStatus.textContent = slot.captured
            ? `✓ CAPTURED (${rowLabel})`
            : `LOCK · HOLD STEADY (${rowLabel})`;
          ringStatus.style.color = slot.captured ? '#06D6A0' : '#FFD23F';
        }

        if (scanAutoSnap && !slot.captured) {
          if (scanAlignedAngleIdx !== alignedTargetIdx) {
            scanAlignedAngleIdx = alignedTargetIdx;
            clearTimeout(scanAlignTimer);
            scanAlignTimer = setTimeout(() => {
              if (alignedTargetIdx === scanAlignedAngleIdx && !scanSlots[alignedTargetIdx].captured) {
                window.captureCurrentScanAngle();
              }
            }, 450);
          }
        }
      } else {
        scanAlignedAngleIdx = -1;
        clearTimeout(scanAlignTimer);
        if (centerRing) {
          centerRing.classList.remove('aligned', 'captured');
        }
        if (ringStatus) {
          ringStatus.textContent = 'AIM AT A CIRCLE';
          ringStatus.style.color = 'rgba(255,255,255,0.75)';
        }
      }

      // Guidance
      if (closestUncapturedIdx !== -1 && guideArrow && guideText && guideIcon) {
        const t = scanSlots[closestUncapturedIdx];
        const dYaw = angleDiffSigned(t.yaw, scanCurrentYaw);
        const dPitch = t.pitch - scanCurrentPitch;
        const absYaw = Math.abs(dYaw);
        const absPitch = Math.abs(dPitch);

        if (absYaw > 10 || absPitch > 10) {
          guideArrow.style.display = 'flex';
          let dir = '';
          if (absPitch > absYaw) {
            dir = dPitch > 0 ? 'TILT UP ↑' : 'TILT DOWN ↓';
            guideIcon.textContent = dPitch > 0 ? '↑' : '↓';
          } else {
            dir = dYaw > 0 ? 'TURN RIGHT ➔' : '⬅ TURN LEFT';
            guideIcon.textContent = dYaw > 0 ? '➔' : '⬅';
          }
          guideText.textContent = `${dir}  ·  next target`;
        } else {
          guideArrow.style.display = 'none';
        }
      } else if (guideArrow) {
        guideArrow.style.display = 'none';
      }
    }

    const modal = document.getElementById('tourCameraScanModal');
    if (modal && modal.style.display !== 'none') {
      scanLoopAnimId = requestAnimationFrame(runScannerLoop);
    }
  }

  window.toggleAutoCaptureOnAlign = function () {
    const chk = document.getElementById('scanAutoSnapCheck');
    scanAutoSnap = chk ? chk.checked : !scanAutoSnap;
  };

  window.manualStepAngle = function (delta) {
    scanCurrentYaw = normalizeAngle360(scanCurrentYaw + delta);
    scanSmoothYaw = scanCurrentYaw;
  };

  window.captureCurrentScanAngle = function () {
    let closestIdx = 0;
    let minDiff = 999;

    scanSlots.forEach((slot, idx) => {
      const dYaw = angleDiffSigned(slot.yaw, scanCurrentYaw);
      const dPitch = slot.pitch - scanCurrentPitch;
      const diff = Math.hypot(dYaw, dPitch);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    window.captureSpecificScanAngle(closestIdx);
  };

  window.captureSpecificScanAngle = function (slotIdx) {
    const video = document.getElementById('scanVideoFeed');
    const workCanvas = document.getElementById('scanWorkCanvas');
    const flashFx = document.getElementById('scanFlashFx');
    if (!video || !workCanvas || slotIdx < 0 || slotIdx >= scanSlots.length) return;

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    if (vw === 0 || vh === 0) return;

    workCanvas.width = vw;
    workCanvas.height = vh;
    const ctx = workCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0, vw, vh);

    // Save frame in memory canvas
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = vw;
    sliceCanvas.height = vh;
    const sliceCtx = sliceCanvas.getContext('2d');
    sliceCtx.drawImage(workCanvas, 0, 0);

    scanSlots[slotIdx].captured = true;
    scanSlots[slotIdx].imgCanvas = sliceCanvas;
    scanSlots[slotIdx].timestamp = Date.now();

    // Trigger Visual Flash & Haptics
    if (flashFx) {
      flashFx.classList.add('flash');
      setTimeout(() => flashFx.classList.remove('flash'), 220);
    }

    if (navigator.vibrate) {
      navigator.vibrate([40]);
    }

    // Update real-time panorama preview ribbon
    updateStitchPreviewRibbon();
    renderScanSlotsRibbon();
    updateScanProgressBar();

    if (typeof showToast === 'function') {
      const capturedCount = scanSlots.filter(s => s.captured).length;
      const s = scanSlots[slotIdx]; const row = s.pitch > 15 ? 'UP' : (s.pitch < -15 ? 'DOWN' : 'LEVEL');
      showToast(`📸 ${row} ${Math.round(s.yaw)}° captured! (${capturedCount}/${SCAN_TOTAL_NODES})`);
    }
  };

  function updateScanProgressBar() {
    const capturedCount = scanSlots.filter(s => s.captured).length;
    const percent = Math.round((capturedCount / SCAN_TOTAL_NODES) * 100);

    const label = document.getElementById('scanProgressLabel');
    const barFill = document.getElementById('scanProgressBarFill');
    const finishBtn = document.getElementById('scanFinishUseBtn');

    if (label) label.textContent = `${capturedCount} / ${SCAN_TOTAL_NODES} ANGLES CAPTURED (${percent}%)`;
    if (barFill) barFill.style.width = `${percent}%`;

    if (finishBtn) {
      if (capturedCount >= 8) {
        finishBtn.style.opacity = '1';
        finishBtn.style.pointerEvents = 'auto';
        finishBtn.disabled = false;
        finishBtn.textContent = `✨ STITCH & USE 360° ROOM (${capturedCount}/${SCAN_TOTAL_NODES})`;
      } else {
        finishBtn.style.opacity = '0.6';
        finishBtn.disabled = false;
        finishBtn.textContent = `✨ STITCH (need ${8 - capturedCount} more · aim for all 28)`;
      }
    }
  }

  function renderScanSlotsRibbon() {
    const track = document.getElementById('scanSlotsTrack');
    if (!track) return;

    track.innerHTML = scanSlots.map((slot, idx) => {
      const isCaptured = slot.captured;
      const row = slot.pitch > 15 ? '↑' : (slot.pitch < -15 ? '↓' : '•');
      return `
        <div class="scan-slot-chip ${isCaptured ? 'captured' : ''}" onclick="window.manualJumpToSlot(${idx})">
          <span style="font-size:10px;font-weight:800;">${row}${Math.round(slot.yaw)}°</span>
          <span style="font-size:9px;">${isCaptured ? '✓' : '○'}</span>
        </div>
      `;
    }).join('');
  }

  window.manualJumpToSlot = function (idx) {
    const slot = scanSlots[idx];
    if (!slot) return;
    scanCurrentYaw = slot.yaw;
    scanSmoothYaw = slot.yaw;
    scanCurrentPitch = slot.pitch;
    scanSmoothPitch = slot.pitch;
  };

  function clearStitchPreviewCanvas() {
    const canvas = document.getElementById('panoStitchPreviewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1A1822';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Live 360° Equirectangular Preview · Snap angles to build room panorama', canvas.width / 2, canvas.height / 2);
  }

  function updateStitchPreviewRibbon() {
    const canvas = document.getElementById('panoStitchPreviewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pw = canvas.width;
    const ph = canvas.height;

    ctx.fillStyle = '#14121A';
    ctx.fillRect(0, 0, pw, ph);

    const sliceWidth = pw / SCAN_TOTAL_NODES;
    const blendOverlap = sliceWidth * 0.28;

    scanSlots.forEach((slot, idx) => {
      if (slot.captured && slot.imgCanvas) {
        const destX = idx * sliceWidth;

        // Draw with smooth horizontal overlap
        ctx.save();
        ctx.drawImage(slot.imgCanvas, 0, 0, slot.imgCanvas.width, slot.imgCanvas.height, destX - blendOverlap / 2, 0, sliceWidth + blendOverlap, ph);
        ctx.restore();
      } else {
        // Empty angle placeholder
        ctx.fillStyle = 'rgba(255, 210, 63, 0.04)';
        ctx.fillRect(idx * sliceWidth + 1, 0, sliceWidth - 2, ph);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeRect(idx * sliceWidth + 1, 0, sliceWidth - 2, ph);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(slot.yaw)}°`, idx * sliceWidth + sliceWidth / 2, ph / 2);
      }
    });
  }

  window.resetCurrent360Scan = function () {
    if (confirm('Reset and clear all current captured angles for this room?')) {
      initScanSlots();
      renderScanSlotsRibbon();
      updateScanProgressBar();
      clearStitchPreviewCanvas();
      if (typeof showToast === 'function') {
        showToast('🗑️ 360° Scanner reset. You can start capturing from 0° again.');
      }
    }
  };

  window.close360CameraScanner = function () {
    const modal = document.getElementById('tourCameraScanModal');
    if (modal) modal.style.display = 'none';

    if (scanStream) {
      scanStream.getTracks().forEach(t => t.stop());
      scanStream = null;
    }

    if (scanLoopAnimId) {
      cancelAnimationFrame(scanLoopAnimId);
      scanLoopAnimId = null;
    }
  };

  /**
   * Stitches all captured slices into a seamless 2:1 High-Resolution Equirectangular Photosphere
   * and saves it directly to the tour room!
   */
  window.finishAndUse360Stitch = async function () {
    var capturedList = scanSlots.filter(function(s) { return s.captured && s.imgCanvas; });
    if (capturedList.length < 6) {
      alert('Please capture at least 6 targets (include some UP and DOWN). More = cleaner 360°.');
      return;
    }

    var finishBtn = document.getElementById('scanFinishUseBtn');
    if (finishBtn) {
      finishBtn.textContent = '⏳ STITCHING 360°…';
      finishBtn.disabled = true;
    }

    await new Promise(function(r) { requestAnimationFrame(function() { requestAnimationFrame(r); }); });

    try {
      var PANO_W = 2048;
      var PANO_H = 1024;
      var panoCanvas = document.createElement('canvas');
      panoCanvas.width = PANO_W;
      panoCanvas.height = PANO_H;
      var pCtx = panoCanvas.getContext('2d');
      pCtx.fillStyle = '#1a1822';
      pCtx.fillRect(0, 0, PANO_W, PANO_H);

      // Simple reliable placement: each photo goes to its yaw column + pitch row
      // with soft edge blending — no complex projection vars that can clash
      var rowDefs = [
        { key: 'up',   pitchMin: 15,  y0: 0,                    h: Math.round(PANO_H * 0.30) },
        { key: 'mid',  pitchMin: -15, y0: Math.round(PANO_H * 0.28), h: Math.round(PANO_H * 0.44) },
        { key: 'down', pitchMin: -999, y0: Math.round(PANO_H * 0.70), h: Math.round(PANO_H * 0.30) }
      ];

      function rowForPitch(p) {
        if (p > 15) return rowDefs[0];
        if (p < -15) return rowDefs[2];
        return rowDefs[1];
      }

      var fi;
      for (fi = 0; fi < capturedList.length; fi++) {
        if (finishBtn) finishBtn.textContent = '⏳ STITCHING ' + (fi + 1) + '/' + capturedList.length + '…';
        await new Promise(function(r) { setTimeout(r, 0); });

        var slot = capturedList[fi];
        var srcCanvas = slot.imgCanvas;
        if (!srcCanvas) continue;

        var row = rowForPitch(slot.pitch);
        var colW = (row.key === 'mid') ? (PANO_W / 12) : (PANO_W / 8);
        var centerX = (slot.yaw / 360) * PANO_W;
        var drawW = Math.round(colW * 1.55);
        var drawH = row.h;
        var drawX = Math.round(centerX - drawW / 2);
        var drawY = row.y0;

        // Soft-edge temp canvas
        var tmp = document.createElement('canvas');
        tmp.width = drawW;
        tmp.height = drawH;
        var tCtx = tmp.getContext('2d');
        var srcW = srcCanvas.width;
        var srcH = srcCanvas.height;
        var cropTop = Math.round(srcH * 0.08);
        var cropH = Math.round(srcH * 0.84);
        tCtx.drawImage(srcCanvas, 0, cropTop, srcW, cropH, 0, 0, drawW, drawH);

        // Fade left/right edges
        var imgData = tCtx.getImageData(0, 0, drawW, drawH);
        var pix = imgData.data;
        var fade = Math.max(10, Math.round(drawW * 0.22));
        var yy, xx, a, pi;
        for (yy = 0; yy < drawH; yy++) {
          for (xx = 0; xx < drawW; xx++) {
            a = 1;
            if (xx < fade) a = xx / fade;
            else if (xx > drawW - fade) a = (drawW - xx) / fade;
            if (yy < 8) a *= yy / 8;
            if (yy > drawH - 8) a *= (drawH - yy) / 8;
            pi = (yy * drawW + xx) * 4 + 3;
            pix[pi] = Math.round(255 * Math.max(0, Math.min(1, a)));
          }
        }
        tCtx.putImageData(imgData, 0, 0);

        // Draw (and wrap around 0/360 seam)
        pCtx.drawImage(tmp, drawX, drawY);
        if (drawX < 0) pCtx.drawImage(tmp, drawX + PANO_W, drawY);
        if (drawX + drawW > PANO_W) pCtx.drawImage(tmp, drawX - PANO_W, drawY);
      }

      if (finishBtn) finishBtn.textContent = '⏳ SAVING…';
      await new Promise(function(r) { setTimeout(r, 0); });

      var stitchedDataUrl = panoCanvas.toDataURL('image/jpeg', 0.88);
      var finalPanoUrl = stitchedDataUrl;

      if (typeof window.uploadToSupabaseStorage === 'function') {
        try {
          var blob = await new Promise(function(resolve) { panoCanvas.toBlob(resolve, 'image/jpeg', 0.88); });
          var scanFile = new File([blob], '360_scan_' + Date.now() + '.jpg', { type: 'image/jpeg' });
          var uploaded = await window.uploadToSupabaseStorage(scanFile);
          if (uploaded && uploaded.url) finalPanoUrl = uploaded.url;
        } catch (upErr) {
          console.warn('[SpotLIGHT 360] Upload failed, using data URL:', upErr);
        }
      }

      if (scanMode === 'replace_room') {
        var curScene = activeSceneList[activeSceneIndex];
        if (curScene) {
          curScene.panoUrl = finalPanoUrl;
          curScene.tourUrl = '';
          curScene.tag = '360° Real-Time Camera Scan';
        }
      } else {
        var newId = 'scan-room-' + Date.now().toString(36);
        var roomNum = activeSceneList.length + 1;
        var newScene = {
          id: newId,
          name: '📸 Scanned Room ' + roomNum,
          location: (currentTourData && currentTourData.location) || 'Salt Lake City, UT',
          tag: '360° Camera Photosphere',
          panoUrl: finalPanoUrl,
          tourUrl: '',
          blurb: 'Full 360° walk-in space captured and stitched with device camera',
          hotspots: [
            { pitch: 0, yaw: 180, label: '🚪 Back to Previous Room', targetScene: (activeSceneList[activeSceneIndex] && activeSceneList[activeSceneIndex].id) || (activeSceneList[0] && activeSceneList[0].id) }
          ]
        };
        activeSceneList.push(newScene);
        activeSceneIndex = activeSceneList.length - 1;
      }

      window.close360CameraScanner();
      if (typeof window.saveTourChangesToMagazine === 'function') {
        window.saveTourChangesToMagazine();
      }
      renderSceneSelector();
      loadScene(activeSceneIndex);

      if (typeof showToast === 'function') {
        showToast('🎉 360° Photosphere Stitched & Saved!');
      }
    } catch (err) {
      console.error('[SpotLIGHT 360 Scanner] Stitch failed:', err);
      alert('Stitch failed: ' + (err && err.message ? err.message : String(err)));
    } finally {
      if (finishBtn) {
        finishBtn.textContent = '✨ STITCH & USE 360° ROOM (SAVE)';
        finishBtn.disabled = false;
      }
    }
  };

  window.switchTourSceneIndex = function (idx) {
    if (idx >= 0 && idx < activeSceneList.length) {
      loadScene(idx);
    }
  };

  /**
   * Opens the 3D / 360° Tour Modal
   */
  window.open3dTourModal = function (options = {}) {
    injectTourModalHtml();
    currentTourData = options;

    const modal = document.getElementById('tour3dModal');
    if (!modal) return;

    modal.classList.add('active');

    // Parse custom scenes or stored tour config
    let loadedScenes = null;

    if (options.scenes && Array.isArray(options.scenes) && options.scenes.length > 0) {
      loadedScenes = JSON.parse(JSON.stringify(options.scenes));
    } else if (options.tourUrl && options.tourUrl.startsWith('{')) {
      try {
        const parsed = JSON.parse(options.tourUrl);
        if (parsed.scenes && Array.isArray(parsed.scenes)) {
          loadedScenes = parsed.scenes;
        }
      } catch (e) {}
    }

    if (!loadedScenes && (options.tourUrl || options.panoUrl)) {
      const directNorm = normalize3dTourUrl(options.tourUrl || options.panoUrl);
      loadedScenes = [
        {
          id: 'custom-spot',
          name: options.title || '360° Interactive Space',
          location: options.location || 'Wasatch Front, UT',
          tag: options.tag || directNorm.provider || '360° Scan',
          tourUrl: directNorm.isEmbed ? directNorm.url : '',
          panoUrl: directNorm.isImage ? directNorm.url : '',
          blurb: options.blurb || '',
          hotspots: []
        }
      ];
    }

    if (!loadedScenes || loadedScenes.length === 0) {
      if (options.location && options.location.toLowerCase().includes('west jordan')) {
        loadedScenes = JSON.parse(JSON.stringify(SLC_WALK_SCENES));
      } else {
        loadedScenes = JSON.parse(JSON.stringify(SLC_WALK_SCENES));
      }
    }

    activeSceneList = loadedScenes;
    targetYaw = 0;
    targetPitch = 0;
    targetFov = 75;
    yaw = 0;
    pitch = 0;
    fov = 75;
    isAutoRotating = false;

    loadScene(0);

    const autoRotateBtn = document.getElementById('tourAutoRotateBtn');
    if (autoRotateBtn) autoRotateBtn.classList.remove('active');

    // Visitors: hide build/edit controls. Admin (password unlocked): show them.
    if (typeof window.__spotlightRefreshEditorVisibility === 'function') {
      window.__spotlightRefreshEditorVisibility();
    } else {
      const unlocked = !!(window.isEditorUnlocked || (typeof isEditorUnlocked !== 'undefined' && isEditorUnlocked));
      const editBtn = document.getElementById('tourEditModeBtn');
      const editorBar = document.getElementById('tourEditorBar');
      if (editBtn) editBtn.style.display = unlocked ? 'inline-flex' : 'none';
      if (editorBar && !unlocked) {
        editorBar.classList.remove('active');
        isEditorMode = false;
      }
    }
  };

  // Keep tour builder button + bar in sync with magazine editor unlock state
  window.__spotlightRefreshEditorVisibility = function () {
    const unlocked = !!(window.isEditorUnlocked || (typeof isEditorUnlocked !== 'undefined' && isEditorUnlocked));
    const editBtn = document.getElementById('tourEditModeBtn');
    const editorBar = document.getElementById('tourEditorBar');
    if (editBtn) editBtn.style.display = unlocked ? 'inline-flex' : 'none';
    if (!unlocked) {
      isEditorMode = false;
      if (editBtn) editBtn.classList.remove('active');
      if (editorBar) editorBar.classList.remove('active');
    }
  };

  window.close3dTourModal = function () {
    const modal = document.getElementById('tour3dModal');
    if (modal) {
      modal.classList.remove('active');
    }
    const embedFrame = document.getElementById('tourEmbedFrame');
    if (embedFrame) {
      embedFrame.src = 'about:blank';
      embedFrame.style.display = 'none';
    }
    disableGyro();
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  };

  // Auto-initialize UI on load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    injectTourModalHtml();
  } else {
    window.addEventListener('DOMContentLoaded', injectTourModalHtml);
  }
})();
