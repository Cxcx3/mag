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
  let fov = 65;
  let targetYaw = 0;
  let targetPitch = 0;
  let targetFov = 65;

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
      threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
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
   * Loads Equirectangular or Cylindrical (iPhone Pano) Texture into Three.js Sphere
   * with Zero-Distortion Auto Aspect Processing, Matterport Pro Multi-Band Ambient Diffusion, and 16x Anisotropic Filtering.
   */
  function loadThreePanoTexture(urlOrCanvas, sceneOverride) {
    if (!threeSphere) {
      if (!initThreeEngine()) return;
    }
    const loader = document.getElementById('tourLoader');
    if (loader) loader.classList.remove('hidden');

    const curScene = sceneOverride || activeSceneList[activeSceneIndex] || {};
    // Aspect Modes: 'matterport-arc' (0% seam natural arc), '360-loop' / 'iphone-pano' (continuous loop), 'full-360' (2:1 sphere)
    const aspectMode = curScene.aspectMode || 'matterport-arc';
    const vScale = typeof curScene.vScale === 'number' ? curScene.vScale : 1.0;
    const vOffset = typeof curScene.vOffset === 'number' ? curScene.vOffset : 0;
    const hShift = typeof curScene.hShift === 'number' ? curScene.hShift : 0; // 0° to 360° horizontal seam rotation
    const seamBlend = typeof curScene.seamBlend === 'number' ? curScene.seamBlend : 0.08; // 0.0 to 0.20 seam feather width
    const seamVOffset = typeof curScene.seamVOffset === 'number' ? curScene.seamVOffset : 0; // -50px to +50px vertical tilt trim
    const hSpan = typeof curScene.hSpan === 'number' ? curScene.hSpan : 1.0; // 0.70 to 1.05 horizontal sweep crop/span
    const typeBadge = document.getElementById('tourTypeBadge');

    if (typeof urlOrCanvas === 'string' && urlOrCanvas) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const nw = img.naturalWidth || img.width || 2048;
        const nh = img.naturalHeight || img.height || 1024;
        const ar = nw / nh;
        
        const isWidePano = (aspectMode === 'matterport-arc') || (aspectMode === 'iphone-pano') || (aspectMode === '360-loop') || (aspectMode !== 'full-360' && ar > 2.0);

        if (typeBadge) {
          if (aspectMode === 'matterport-arc' || (isWidePano && aspectMode !== '360-loop' && aspectMode !== 'full-360')) {
            typeBadge.textContent = '✨ MATTERPORT PRO (0% SEAM)';
            typeBadge.style.background = 'rgba(6, 214, 160, 0.18)';
            typeBadge.style.borderColor = '#06D6A0';
            typeBadge.style.color = '#06D6A0';
          } else if (aspectMode === '360-loop' || aspectMode === 'iphone-pano') {
            typeBadge.textContent = '🔄 360° LOOP WALKTHROUGH';
            typeBadge.style.background = 'rgba(255, 210, 63, 0.18)';
            typeBadge.style.borderColor = '#FFD23F';
            typeBadge.style.color = '#FFD23F';
          } else {
            typeBadge.textContent = '🌐 360° PHOTOSPHERE (2:1)';
            typeBadge.style.background = 'rgba(255, 210, 63, 0.15)';
            typeBadge.style.borderColor = 'rgba(255, 210, 63, 0.35)';
            typeBadge.style.color = '#FFD23F';
          }
        }

        let finalTexture = null;

        if (isWidePano) {
          // Construct Ultra-HD 2:1 Master Canvas to eliminate vertical stretching
          const maxGpuSize = threeRenderer ? Math.min(threeRenderer.capabilities.maxTextureSize || 4096, 4096) : 4096;
          const canvasW = Math.min(Math.max(nw, 2048), maxGpuSize);
          const canvasH = Math.floor(canvasW / 2); // Exact 2:1 Equirectangular Sphere Ratio

          const canvas = document.createElement('canvas');
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          const isArcMode = (aspectMode === 'matterport-arc');

          // Compute exact natural vertical height to maintain 1:1 real-world physical room proportions
          let panoH = Math.min(canvasH, Math.round((canvasW / Math.max(ar, 1.8)) * vScale));
          if (isArcMode) {
            panoH = Math.min(canvasH - 60, Math.max(Math.floor(canvasH * 0.45), Math.round(canvasH * 0.52 * vScale)));
          }
          const panoY = Math.max(0, Math.min(canvasH - panoH, Math.round((canvasH - panoH) / 2) + vOffset));

          // Sample edge and wall colors for intelligent ambient room fill
          const sampleC = document.createElement('canvas');
          sampleC.width = 64;
          sampleC.height = 64;
          const sCtxSample = sampleC.getContext('2d');
          sCtxSample.drawImage(img, 0, 0, 64, 64);

          let tr = 235, tg = 235, tb = 235; // top ceiling
          let br = 65, bg = 55, bb = 50;    // bottom floor
          let lr = 220, lg = 215, lb = 210; // left wall (door side)
          let rr = 220, rg = 215, rb = 210; // right wall (window side)

          try {
            const topData = sCtxSample.getImageData(0, 0, 64, 4).data;
            let sumR = 0, sumG = 0, sumB = 0, count = topData.length / 4;
            for (let i = 0; i < topData.length; i += 4) {
              sumR += topData[i]; sumG += topData[i+1]; sumB += topData[i+2];
            }
            tr = Math.round(sumR / count); tg = Math.round(sumG / count); tb = Math.round(sumB / count);

            const btmData = sCtxSample.getImageData(0, 60, 64, 4).data;
            sumR = 0; sumG = 0; sumB = 0;
            for (let i = 0; i < btmData.length; i += 4) {
              sumR += btmData[i]; sumG += btmData[i+1]; sumB += btmData[i+2];
            }
            br = Math.round(sumR / count); bg = Math.round(sumG / count); bb = Math.round(sumB / count);

            const leftData = sCtxSample.getImageData(0, 16, 4, 32).data;
            sumR = 0; sumG = 0; sumB = 0; count = leftData.length / 4;
            for (let i = 0; i < leftData.length; i += 4) {
              sumR += leftData[i]; sumG += leftData[i+1]; sumB += leftData[i+2];
            }
            lr = Math.round(sumR / count); lg = Math.round(sumG / count); lb = Math.round(sumB / count);

            const rightData = sCtxSample.getImageData(60, 16, 4, 32).data;
            sumR = 0; sumG = 0; sumB = 0; count = rightData.length / 4;
            for (let i = 0; i < rightData.length; i += 4) {
              sumR += rightData[i]; sumG += rightData[i+1]; sumB += rightData[i+2];
            }
            rr = Math.round(sumR / count); rg = Math.round(sumG / count); rb = Math.round(sumB / count);
          } catch(e) {}

          // 1. Render Realistic Multi-Band Ceiling Ambient Gradient
          const topGrad = ctx.createLinearGradient(0, 0, 0, panoY + 8);
          topGrad.addColorStop(0, `rgb(${Math.round(tr * 0.9)}, ${Math.round(tg * 0.9)}, ${Math.round(tb * 0.9)})`);
          topGrad.addColorStop(0.7, `rgb(${tr}, ${tg}, ${tb})`);
          topGrad.addColorStop(1, `rgb(${tr}, ${tg}, ${tb})`);
          ctx.fillStyle = topGrad;
          ctx.fillRect(0, 0, canvasW, panoY + 8);

          // 2. Render Realistic Floor Ambient Gradient
          const btmGrad = ctx.createLinearGradient(0, panoY + panoH - 8, 0, canvasH);
          btmGrad.addColorStop(0, `rgb(${br}, ${bg}, ${bb})`);
          btmGrad.addColorStop(0.5, `rgb(${Math.round(br * 0.85)}, ${Math.round(bg * 0.85)}, ${Math.round(bb * 0.85)})`);
          btmGrad.addColorStop(1, `rgb(${Math.round(br * 0.7)}, ${Math.round(bg * 0.7)}, ${Math.round(bb * 0.7)})`);
          ctx.fillStyle = btmGrad;
          ctx.fillRect(0, panoY + panoH - 8, canvasW, canvasH - (panoY + panoH - 8));

          if (isArcMode) {
            // ==============================================================
            // ✨ MATTERPORT PRO ARC PROJECTION (0% SEAM · ZERO COLLISION)
            // ==============================================================
            // Map the panorama to its natural physical horizontal span
            const naturalPanoW = Math.min(Math.round(canvasW * 0.85), Math.max(Math.round(canvasW * 0.45), Math.round((panoH * ar) * hSpan)));
            const arcSpanDeg = Math.round((naturalPanoW / canvasW) * 360);
            curScene.arcSpanDeg = arcSpanDeg;

            const panoX = Math.round((canvasW - naturalPanoW) / 2);

            // Fill left and right ambient wall extensions
            const lWallGrad = ctx.createLinearGradient(0, panoY, panoX + 30, panoY);
            lWallGrad.addColorStop(0, `rgb(${lr}, ${lg}, ${lb})`);
            lWallGrad.addColorStop(1, `rgb(${lr}, ${lg}, ${lb})`);
            ctx.fillStyle = lWallGrad;
            ctx.fillRect(0, panoY, panoX + 30, panoH);

            const rWallGrad = ctx.createLinearGradient(panoX + naturalPanoW - 30, panoY, canvasW, panoY);
            rWallGrad.addColorStop(0, `rgb(${rr}, ${rg}, ${rb})`);
            rWallGrad.addColorStop(1, `rgb(${rr}, ${rg}, ${rb})`);
            ctx.fillStyle = rWallGrad;
            ctx.fillRect(panoX + naturalPanoW - 30, panoY, canvasW - (panoX + naturalPanoW - 30), panoH);

            // Draw undistorted panorama in center of arc
            ctx.drawImage(img, 0, 0, nw, nh, panoX, panoY, naturalPanoW, panoH);

            // Soft Horizontal Side Edge Feathering (eliminates any harsh side lines)
            const sideFeatherW = 36;
            const lFeather = ctx.createLinearGradient(panoX, panoY, panoX + sideFeatherW, panoY);
            lFeather.addColorStop(0, `rgba(${lr}, ${lg}, ${lb}, 0.9)`);
            lFeather.addColorStop(1, `rgba(${lr}, ${lg}, ${lb}, 0)`);
            ctx.fillStyle = lFeather;
            ctx.fillRect(panoX, panoY, sideFeatherW, panoH);

            const rFeather = ctx.createLinearGradient(panoX + naturalPanoW - sideFeatherW, panoY, panoX + naturalPanoW, panoY);
            rFeather.addColorStop(0, `rgba(${rr}, ${rg}, ${rb}, 0)`);
            rFeather.addColorStop(1, `rgba(${rr}, ${rg}, ${rb}, 0.9)`);
            ctx.fillStyle = rFeather;
            ctx.fillRect(panoX + naturalPanoW - sideFeatherW, panoY, sideFeatherW, panoH);

          } else {
            // ==============================================================
            // 🔄 360° CONTINUOUS LOOP PROJECTION (Overlap Trim & Seam Feathering)
            // ==============================================================
            const stripCanvas = document.createElement('canvas');
            stripCanvas.width = canvasW;
            stripCanvas.height = panoH;
            const sCtx = stripCanvas.getContext('2d', { willReadFrequently: true });
            sCtx.imageSmoothingEnabled = true;
            sCtx.imageSmoothingQuality = 'high';

            const srcW = Math.min(nw, Math.max(100, Math.round(nw * hSpan)));
            const srcH = nh;

            // Handle vertical tilt/drift alignment across sweep
            if (Math.abs(seamVOffset) > 0.5) {
              const slices = 64;
              const sliceW = canvasW / slices;
              const srcSliceW = srcW / slices;
              for (let s = 0; s < slices; s++) {
                const t = s / (slices - 1);
                const dy = Math.round(t * seamVOffset);
                sCtx.drawImage(
                  img,
                  s * srcSliceW, 0, srcSliceW, srcH,
                  s * sliceW, Math.max(0, dy), sliceW, panoH - Math.abs(seamVOffset)
                );
              }
            } else {
              sCtx.drawImage(img, 0, 0, srcW, srcH, 0, 0, canvasW, panoH);
            }

            // Handle Seam Rotation (hShift: 0° to 360°)
            let processedStrip = stripCanvas;
            const normShift = ((hShift % 360) + 360) % 360;
            if (normShift > 0.5) {
              const shiftPx = Math.round((normShift / 360) * canvasW);
              const shiftedCanvas = document.createElement('canvas');
              shiftedCanvas.width = canvasW;
              shiftedCanvas.height = panoH;
              const shCtx = shiftedCanvas.getContext('2d');
              shCtx.imageSmoothingEnabled = true;
              shCtx.imageSmoothingQuality = 'high';

              shCtx.drawImage(stripCanvas, shiftPx, 0, canvasW - shiftPx, panoH, 0, 0, canvasW - shiftPx, panoH);
              shCtx.drawImage(stripCanvas, 0, 0, shiftPx, panoH, canvasW - shiftPx, 0, shiftPx, panoH);
              processedStrip = shiftedCanvas;
            }

            // Intelligent Seamless Edge Feathering / Cross-Dissolve
            if (seamBlend > 0.005) {
              const blendPx = Math.max(24, Math.min(Math.floor(canvasW * 0.18), Math.round(canvasW * seamBlend)));
              const blendedCanvas = document.createElement('canvas');
              blendedCanvas.width = canvasW;
              blendedCanvas.height = panoH;
              const bCtx = blendedCanvas.getContext('2d', { willReadFrequently: true });
              bCtx.drawImage(processedStrip, 0, 0);

              // Extract rightmost edge strip
              const rightStrip = document.createElement('canvas');
              rightStrip.width = blendPx;
              rightStrip.height = panoH;
              const rCtx = rightStrip.getContext('2d');
              rCtx.drawImage(processedStrip, canvasW - blendPx, 0, blendPx, panoH, 0, 0, blendPx, panoH);

              // Create smooth cosine gradient mask
              const maskC = document.createElement('canvas');
              maskC.width = blendPx;
              maskC.height = panoH;
              const mCtx = maskC.getContext('2d');
              const mGrad = mCtx.createLinearGradient(0, 0, blendPx, 0);
              mGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
              mGrad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
              mGrad.addColorStop(1, 'rgba(255,255,255,0)');
              mCtx.fillStyle = mGrad;
              mCtx.fillRect(0, 0, blendPx, panoH);

              rCtx.globalCompositeOperation = 'destination-in';
              rCtx.drawImage(maskC, 0, 0);

              bCtx.globalCompositeOperation = 'source-over';
              bCtx.drawImage(rightStrip, 0, 0);

              processedStrip = blendedCanvas;
            }

            ctx.drawImage(processedStrip, 0, panoY);
          }

          // 4. Soft Edge Feathering (Seam Blend)
          const featherH = Math.min(28, Math.max(8, Math.floor(panoH * 0.04)));
          // Top Seam Feather
          const fTop = ctx.createLinearGradient(0, panoY, 0, panoY + featherH);
          fTop.addColorStop(0, `rgba(${tr}, ${tg}, ${tb}, 0.85)`);
          fTop.addColorStop(1, `rgba(${tr}, ${tg}, ${tb}, 0)`);
          ctx.fillStyle = fTop;
          ctx.fillRect(0, panoY, canvasW, featherH);

          // Bottom Seam Feather
          const fBtm = ctx.createLinearGradient(0, panoY + panoH - featherH, 0, panoY + panoH);
          fBtm.addColorStop(0, `rgba(${br}, ${bg}, ${bb}, 0)`);
          fBtm.addColorStop(1, `rgba(${br}, ${bg}, ${bb}, 0.85)`);
          ctx.fillStyle = fBtm;
          ctx.fillRect(0, panoY + panoH - featherH, canvasW, featherH);

          finalTexture = new THREE.CanvasTexture(canvas);
        } else {
          finalTexture = new THREE.Texture(img);
          finalTexture.needsUpdate = true;
        }

        // Ultra-HD Crisp Texture Filtering Setup
        finalTexture.generateMipmaps = true;
        finalTexture.minFilter = THREE.LinearMipmapLinearFilter;
        finalTexture.magFilter = THREE.LinearFilter;
        if (threeRenderer) {
          finalTexture.anisotropy = Math.min(16, threeRenderer.capabilities.getMaxAnisotropy() || 1);
        }

        if (currentTexture) currentTexture.dispose();
        currentTexture = finalTexture;
        threeSphere.material.map = finalTexture;
        threeSphere.material.needsUpdate = true;

        if (loader) loader.classList.add('hidden');
      };

      img.onerror = (err) => {
        console.warn('[SpotLIGHT 360] Image load fallback:', err);
        const fallbackCanvas = getSceneProceduralCanvas(activeSceneList[activeSceneIndex]?.id || '360-fallback');
        const texture = new THREE.CanvasTexture(fallbackCanvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        if (currentTexture) currentTexture.dispose();
        currentTexture = texture;
        threeSphere.material.map = texture;
        threeSphere.material.needsUpdate = true;
        if (loader) loader.classList.add('hidden');
      };

      img.src = urlOrCanvas;
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
        top: 64px;
        left: 10px;
        right: 10px;
        max-width: calc(100vw - 20px);
        z-index: 35;
        background: rgba(14, 12, 19, 0.96);
        border: 1.5px solid #06D6A0;
        border-radius: 12px;
        padding: 6px 10px;
        display: none;
        flex-direction: column;
        gap: 6px;
        box-shadow: 0 10px 32px rgba(0,0,0,0.75);
        animation: slideInBar 0.2s ease-out;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      @keyframes slideInBar {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .tour-editor-bar.active {
        display: flex;
      }
      .tour-editor-bar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
      }
      .tour-editor-header-left {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: nowrap;
        overflow-x: hidden;
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
        white-space: nowrap;
      }
      .tour-editor-header-right {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      .tour-tools-menu-btn {
        background: rgba(255, 210, 63, 0.2);
        border: 1.5px solid #FFD23F;
        color: #FFD23F;
        font-weight: 900;
        padding: 4px 9px;
        font-size: 11px;
        border-radius: 6px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      }
      .tour-tools-menu-btn:hover {
        background: #FFD23F;
        color: #14121A;
      }
      .tour-editor-actions-scroll-wrap {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
      }
      .tour-editor-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: rgba(6, 214, 160, 0.4) transparent;
        padding: 2px 2px 4px 2px;
        width: 100%;
      }
      .tour-editor-actions::-webkit-scrollbar {
        height: 4px;
      }
      .tour-editor-actions::-webkit-scrollbar-thumb {
        background: rgba(6, 214, 160, 0.4);
        border-radius: 4px;
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
        flex-shrink: 0;
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

      /* Mobile Full Dropdown Menu */
      .tour-tools-dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 6px;
        background: #14121A;
        border: 2px solid #FFD23F;
        border-radius: 12px;
        padding: 12px;
        z-index: 50;
        box-shadow: 0 16px 40px rgba(0,0,0,0.85);
        display: none;
        flex-direction: column;
        gap: 10px;
        max-height: calc(100vh - 160px);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      .tour-tools-dropdown-menu.show {
        display: flex;
      }
      .tour-tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
      }
      .tour-tool-grid-item {
        background: rgba(255, 255, 255, 0.06);
        border: 1.5px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        padding: 8px 10px;
        color: #fff;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 3px;
        text-align: left;
        transition: all 0.15s;
      }
      .tour-tool-grid-item:hover {
        border-color: #FFD23F;
        background: rgba(255, 210, 63, 0.15);
      }
      .tour-tool-grid-item.primary {
        border-color: #06D6A0;
        background: rgba(6, 214, 160, 0.15);
        color: #06D6A0;
      }
      .tour-tool-grid-item.highlight {
        border-color: #FFD23F;
        background: rgba(255, 210, 63, 0.2);
        color: #FFD23F;
      }
      .tour-tool-grid-item.danger {
        border-color: #FF4D6D;
        background: rgba(255, 77, 109, 0.15);
        color: #FF4D6D;
      }
      .tour-tool-grid-item-desc {
        font-size: 9px;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
      }

      /* Proportions & Seam Alignment Popover */
      .tour-proportions-popover {
        position: absolute;
        top: 110px;
        left: 10px;
        right: 10px;
        z-index: 40;
        background: rgba(20, 18, 26, 0.98);
        border: 2px solid #FFD23F;
        border-radius: 12px;
        width: 380px;
        max-width: calc(100vw - 20px);
        max-height: calc(100vh - 130px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.88), 0 0 25px rgba(255, 210, 63, 0.25);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        animation: fadeInDialog 0.15s ease-out;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        display: flex;
        flex-direction: column;
      }
      .prop-popover-header {
        padding: 10px 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(255, 210, 63, 0.08);
        position: sticky;
        top: 0;
        z-index: 2;
      }
      .prop-popover-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        cursor: pointer;
        padding: 2px 6px;
      }
      .prop-popover-close:hover {
        color: #FF4D6D;
      }
      .prop-popover-body {
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .prop-section-label {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: rgba(255, 255, 255, 0.65);
      }
      .prop-mode-btns {
        display: grid;
        grid-template-columns: 1fr;
        gap: 6px;
      }
      .prop-mode-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1.5px solid rgba(255, 255, 255, 0.15);
        color: #F5F1E8;
        padding: 8px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        text-align: left;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.15s;
      }
      .prop-mode-btn:hover {
        background: rgba(255, 210, 63, 0.15);
        border-color: #FFD23F;
      }
      .prop-mode-btn.active {
        background: rgba(6, 214, 160, 0.18);
        border-color: #06D6A0;
        color: #06D6A0;
      }
      .prop-scale-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .prop-adj-btn {
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .prop-adj-btn:hover {
        background: #FFD23F;
        color: #14121A;
      }
      .prop-range-slider {
        flex: 1;
        accent-color: #06D6A0;
        cursor: pointer;
      }
      .prop-reset-btn {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.7);
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 9px;
        font-weight: 800;
        cursor: pointer;
      }
      .prop-reset-btn:hover {
        color: #fff;
        border-color: #fff;
      }
      .prop-sharp-btn {
        background: rgba(6, 214, 160, 0.1);
        border: 1.5px solid #06D6A0;
        color: #F5F1E8;
        padding: 8px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .prop-save-room-btn {
        background: linear-gradient(135deg, #06D6A0 0%, #05b386 100%);
        color: #0d1b1e;
        border: none;
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 900;
        cursor: pointer;
        margin-top: 4px;
        transition: all 0.15s;
        text-align: center;
        letter-spacing: 0.03em;
        box-shadow: 0 4px 12px rgba(6, 214, 160, 0.3);
      }
      .prop-save-room-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(6, 214, 160, 0.45);
      }
      .prop-tool-box {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
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
        width: 48px;
        height: 48px;
        background: rgba(6, 214, 160, 0.95);
        border: 3px solid #fff;
        color: #0d1b1e;
        box-shadow: 0 0 24px rgba(6, 214, 160, 0.9), 0 0 0 4px rgba(6, 214, 160, 0.35);
        z-index: 9;
      }
      /* HDReye-style primary target (next blue/white dot to aim at) */
      .scan-node-marker.next-target {
        width: 36px;
        height: 36px;
        background: #fff;
        border: 3px solid #3B9EFF;
        box-shadow: 0 0 0 6px rgba(59, 158, 255, 0.35), 0 0 22px rgba(59, 158, 255, 0.7);
        z-index: 8;
        animation: hdreyePulse 1.2s ease-in-out infinite;
      }
      @keyframes hdreyePulse {
        0%, 100% { box-shadow: 0 0 0 4px rgba(59, 158, 255, 0.3), 0 0 16px rgba(59, 158, 255, 0.55); }
        50% { box-shadow: 0 0 0 10px rgba(59, 158, 255, 0.2), 0 0 28px rgba(59, 158, 255, 0.8); }
      }
      .scan-mode-tabs {
        display: inline-flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 999px;
        padding: 2px;
        gap: 2px;
      }
      .scan-mode-tab {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 10px;
        font-weight: 800;
        padding: 4px 10px;
        border-radius: 999px;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .scan-mode-tab:hover {
        color: #fff;
      }
      .scan-mode-tab.active {
        background: #FFD23F;
        color: #14121A;
        font-weight: 900;
        box-shadow: 0 2px 8px rgba(255, 210, 63, 0.4);
      }
      .scan-sweep-compass-wrap {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 180px;
        height: 180px;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .scan-sweep-dial-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
      .scan-sweep-center-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(14, 12, 19, 0.85);
        border: 1.5px solid rgba(255, 210, 63, 0.4);
        border-radius: 50%;
        width: 116px;
        height: 116px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
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

      <!-- Floating Proportions & Seam Alignment Popover (Editor Only) -->
      <div class="tour-proportions-popover" id="tourProportionsPopover" style="display:none;">
        <div class="prop-popover-header">
          <span style="font-weight:800;font-size:12px;color:#FFD23F;">📐 Room Proportions & Matterport Alignment</span>
          <button type="button" class="prop-popover-close" onclick="window.toggleTourProportionsMenu(false)">✕</button>
        </div>
        <div class="prop-popover-body">
          <div style="background:rgba(6,214,160,0.12);border:1px solid rgba(6,214,160,0.35);border-radius:8px;padding:8px 10px;font-size:10.5px;color:#06D6A0;line-height:1.4;margin-bottom:8px;">
            <strong style="color:#FFD23F;">💡 Why phone panoramas don't line up in 360°:</strong><br>
            A phone panorama is a wide sweep (~180°–220°) from the left wall (door) to the right wall (window). Because they are two different sides of the room, they cannot loop into each other in a circle.
            <br><span style="font-weight:800;color:#fff;">👉 Tap "✨ Matterport Pro Arc" below to eliminate the seam split and view your room in real-world 1:1 perspective!</span>
          </div>

          <div class="prop-section-label">1. PROJECTION FORMAT</div>
          <div class="prop-mode-btns" style="display:flex;flex-direction:column;gap:5px;">
            <button type="button" class="prop-mode-btn active" id="propModeMatterport" onclick="window.setTourAspectMode('matterport-arc')">
              <span style="font-weight:800;">✨ Matterport Pro Arc (0% Seam · No Split)</span>
              <span style="color:#06D6A0;font-size:10px;font-weight:800;">RECOMMENDED FOR PHONE PANOS</span>
            </button>
            <button type="button" class="prop-mode-btn" id="propMode360Loop" onclick="window.setTourAspectMode('360-loop')">
              <span>🔄 360° Continuous Loop (Full 360° Sweep Required)</span>
            </button>
            <button type="button" class="prop-mode-btn" id="propModeFull" onclick="window.setTourAspectMode('full-360')">
              <span>🌐 Full 360° Photosphere (2:1 Spherical)</span>
            </button>
          </div>

          <div style="margin-top:4px;">
            <button type="button" class="tour-dialog-btn" style="width:100%;background:linear-gradient(135deg, rgba(6,214,160,0.25) 0%, rgba(255,210,63,0.2) 100%);border:1.5px solid #06D6A0;color:#06D6A0;font-weight:900;padding:8px 10px;font-size:11px;border-radius:8px;" onclick="window.applyMatterportPreset()">
              🪄 1-CLICK FIX: APPLY MATTERPORT PRO PRESET
            </button>
          </div>

          <div class="prop-tool-box">
            <div class="prop-section-label" style="display:flex;justify-content:space-between;align-items:center;">
              <span>VERTICAL ROOM HEIGHT (HUMAN PERSPECTIVE)</span>
              <span id="propVScaleVal" style="color:#06D6A0;font-family:monospace;font-weight:800;">100%</span>
            </div>
            <div class="prop-scale-controls">
              <button type="button" class="prop-adj-btn" onclick="window.adjustTourVScale(-0.05)">−</button>
              <input type="range" id="propVScaleSlider" min="50" max="180" value="100" class="prop-range-slider" oninput="window.setTourVScale(this.value / 100)">
              <button type="button" class="prop-adj-btn" onclick="window.adjustTourVScale(0.05)">+</button>
              <button type="button" class="prop-reset-btn" onclick="window.resetTourVScale()">RESET</button>
            </div>
          </div>

          <div class="prop-tool-box">
            <div class="prop-section-label" style="display:flex;justify-content:space-between;align-items:center;">
              <span>2. OVERLAP CROP TRIM (ELIMINATE DUPLICATE OBJECTS)</span>
              <span id="propHSpanVal" style="color:#06D6A0;font-family:monospace;font-weight:800;">100%</span>
            </div>
            <div style="font-size:10px;color:rgba(255,255,255,0.6);line-height:1.3;">
              Trims duplicate furniture/vest if camera rotated past 360°:
            </div>
            <div class="prop-scale-controls">
              <input type="range" id="propHSpanSlider" min="70" max="105" value="100" step="1" class="prop-range-slider" oninput="window.setTourHSpan(this.value / 100)">
              <button type="button" class="prop-reset-btn" onclick="window.setTourHSpan(1.0)">100%</button>
            </div>
          </div>

          <div class="prop-tool-box">
            <div class="prop-section-label" style="display:flex;justify-content:space-between;align-items:center;">
              <span>3. ROTATE 360° SEAM POSITION</span>
              <span id="propHShiftVal" style="color:#FFD23F;font-family:monospace;font-weight:800;">0°</span>
            </div>
            <div style="font-size:10px;color:rgba(255,255,255,0.6);line-height:1.3;">
              Move the seam off chairs/objects onto an empty wall or corner:
            </div>
            <div class="prop-scale-controls">
              <button type="button" class="prop-adj-btn" onclick="window.adjustTourHShift(-15)" title="Rotate seam -15°">◀</button>
              <input type="range" id="propHShiftSlider" min="0" max="360" value="0" step="2" class="prop-range-slider" style="accent-color:#FFD23F;" oninput="window.setTourHShift(this.value)">
              <button type="button" class="prop-adj-btn" onclick="window.adjustTourHShift(15)" title="Rotate seam +15°">▶</button>
              <button type="button" class="prop-reset-btn" onclick="window.setTourHShift(0)">0°</button>
            </div>
          </div>

          <div class="prop-tool-box">
            <div class="prop-section-label" style="display:flex;justify-content:space-between;align-items:center;">
              <span>4. SEAMLESS EDGE FEATHER / BLEND</span>
              <span id="propSeamBlendVal" style="color:#06D6A0;font-family:monospace;font-weight:800;">8%</span>
            </div>
            <div style="font-size:10px;color:rgba(255,255,255,0.6);line-height:1.3;">
              Smooth cross-dissolve to eliminate visible hard cut lines:
            </div>
            <div class="prop-scale-controls">
              <input type="range" id="propSeamBlendSlider" min="0" max="20" value="8" step="1" class="prop-range-slider" oninput="window.setTourSeamBlend(this.value / 100)">
              <button type="button" class="prop-reset-btn" onclick="window.setTourSeamBlend(0.08)">8%</button>
            </div>
          </div>

          <div class="prop-tool-box">
            <div class="prop-section-label" style="display:flex;justify-content:space-between;align-items:center;">
              <span>5. VERTICAL TILT TRIM (CAMERA DRIFT)</span>
              <span id="propSeamVOffsetVal" style="color:#06D6A0;font-family:monospace;font-weight:800;">0 px</span>
            </div>
            <div style="font-size:10px;color:rgba(255,255,255,0.6);line-height:1.3;">
              Fix camera height step where the sweep starts & ends:
            </div>
            <div class="prop-scale-controls">
              <button type="button" class="prop-adj-btn" onclick="window.adjustTourSeamVOffset(-2)">−</button>
              <input type="range" id="propSeamVOffsetSlider" min="-40" max="40" value="0" step="1" class="prop-range-slider" oninput="window.setTourSeamVOffset(parseInt(this.value, 10))">
              <button type="button" class="prop-adj-btn" onclick="window.adjustTourSeamVOffset(2)">+</button>
              <button type="button" class="prop-reset-btn" onclick="window.setTourSeamVOffset(0)">RESET</button>
            </div>
          </div>

          <div style="display:flex;gap:6px;">
            <button type="button" class="tour-dialog-btn" style="flex:1;background:rgba(255,210,63,0.15);border:1.5px solid #FFD23F;color:#FFD23F;font-weight:800;padding:8px 10px;font-size:11px;" onclick="window.autoAlignRoomSeam()">
              🪄 AUTO-ALIGN & FEATHER
            </button>
            <button type="button" class="prop-sharp-btn" id="propSharpBtn" style="flex:1;padding:8px 10px;" onclick="window.toggleHdSharpness()">
              <span>✨ 16x HD Filter</span>
              <span id="propSharpBadge" style="color:#06D6A0;font-weight:800;font-size:10px;">ON</span>
            </button>
          </div>

          <div style="margin-top:2px;">
            <button type="button" class="tour-dialog-btn" style="width:100%;background:rgba(255,210,63,0.2);border:1.5px solid #FFD23F;color:#FFD23F;font-weight:900;padding:8px 10px;font-size:11px;border-radius:8px;" onclick="window.setTourStartingView()">
              📍 LOCK CURRENT CAMERA AS STARTING VIEW
            </button>
          </div>

          <button type="button" class="prop-save-room-btn" onclick="window.saveCurrentRoomProportions()">
            💾 SAVE ALL SETTINGS FOR EVERYONE
          </button>
        </div>
      </div>

      <!-- Live Editor Action Bar (When in Tour Builder Mode) -->
      <div class="tour-editor-bar" id="tourEditorBar">
        <div class="tour-editor-bar-header">
          <div class="tour-editor-header-left">
            <span class="tour-editor-pill">🛠️ BUILDER</span>
            <span id="tourCamAnglePill" class="tour-editor-pill" style="color:#FFD23F;border-color:#FFD23F;">YAW: 0° · PITCH: 0°</span>
          </div>
          <div class="tour-editor-header-right">
            <button type="button" class="tour-tools-menu-btn" id="tourToolsMenuToggleBtn" onclick="window.toggleTourToolsDropdown()" title="Open full tools menu">
              <span>📋 ALL TOOLS ▾</span>
            </button>
            <button type="button" class="tour-ed-btn tour-ed-save" id="tourSaveEveryoneHeaderBtn" onclick="window.saveTourChangesToMagazine()" title="Save tour live to cloud for all visitors" style="padding:4px 9px;font-size:11px;">
              💾 SAVE
            </button>
          </div>
        </div>

        <div class="tour-editor-actions-scroll-wrap">
          <div class="tour-editor-actions" id="tourEditorActionsTrack">
            <button type="button" class="tour-ed-btn" id="tourEditorProportionsBtn" onclick="window.toggleTourProportionsMenu()" title="Adjust Photo Proportions & Seam Stitching Alignment" style="background:rgba(255,210,63,0.18);border:1.5px solid #FFD23F;color:#FFD23F;font-weight:900;">
              📐 PROPORTIONS & SEAM
            </button>
            <button type="button" class="tour-ed-btn" onclick="window.setTourStartingView()" title="Lock current camera angle as the starting view when entering this room" style="background:rgba(6,214,160,0.18);border:1.5px solid #06D6A0;color:#06D6A0;font-weight:900;">
              📍 SET STARTING VIEW
            </button>
            <button type="button" class="tour-ed-btn" onclick="window.openPlaceHotspotDialog()" title="Place interactive door hotspot at camera angle">
              🚪 PLACE DOOR PIN
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

        <!-- Full Mobile Tools Dropdown Menu -->
        <div class="tour-tools-dropdown-menu" id="tourToolsDropdownMenu">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:6px;">
            <span style="font-size:12px;font-weight:900;color:#FFD23F;">🛠️ ALL TOUR BUILDER TOOLS</span>
            <button type="button" style="background:none;border:none;color:#fff;font-size:14px;cursor:pointer;" onclick="window.toggleTourToolsDropdown(false)">✕</button>
          </div>
          <div class="tour-tools-grid">
            <div class="tour-tool-grid-item highlight" onclick="window.toggleTourProportionsMenu(); window.toggleTourToolsDropdown(false);">
              <span>📐 Proportions & Seam</span>
              <span class="tour-tool-grid-item-desc">Adjust height & blend 360 seam</span>
            </div>
            <div class="tour-tool-grid-item primary" onclick="window.setTourStartingView(); window.toggleTourToolsDropdown(false);">
              <span>📍 Set Starting View</span>
              <span class="tour-tool-grid-item-desc">Lock current angle as default</span>
            </div>
            <div class="tour-tool-grid-item" onclick="window.openPlaceHotspotDialog(); window.toggleTourToolsDropdown(false);">
              <span>🚪 Place Door Pin</span>
              <span class="tour-tool-grid-item-desc">Drop portal to another room</span>
            </div>
            <div class="tour-tool-grid-item highlight" onclick="window.open360CameraScanner('new_room'); window.toggleTourToolsDropdown(false);">
              <span>📸 360 Camera Scan</span>
              <span class="tour-tool-grid-item-desc">Matterport-style room scan</span>
            </div>
            <div class="tour-tool-grid-item" onclick="window.openAddRoomDialog(); window.toggleTourToolsDropdown(false);">
              <span>➕ Add New Room</span>
              <span class="tour-tool-grid-item-desc">Upload or preset 360 space</span>
            </div>
            <div class="tour-tool-grid-item" onclick="window.openEditRoomDialog(); window.toggleTourToolsDropdown(false);">
              <span>✏️ Edit This Room</span>
              <span class="tour-tool-grid-item-desc">Rename, swap photo, or blurb</span>
            </div>
            <div class="tour-tool-grid-item" onclick="window.openManageRoomsDialog(); window.toggleTourToolsDropdown(false);">
              <span>📑 Manage All Rooms</span>
              <span class="tour-tool-grid-item-desc">List, reorder, and review rooms</span>
            </div>
            <div class="tour-tool-grid-item danger" onclick="window.confirmDeleteCurrentRoom(); window.toggleTourToolsDropdown(false);">
              <span>🗑️ Delete This Room</span>
              <span class="tour-tool-grid-item-desc">Remove current space</span>
            </div>
          </div>
          <button type="button" class="prop-save-room-btn" style="margin-top:4px;" onclick="window.saveTourChangesToMagazine(); window.toggleTourToolsDropdown(false);">
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

              <!-- Photo Proportions & Distortion settings for this space -->
              <div class="tour-field-group">
                <label class="tour-field-label">📐 Photo Proportions & Clarity</label>
                <div style="display:flex;gap:8px;margin-bottom:8px;">
                  <button type="button" class="tour-dialog-btn" id="editRoomModeIphone" style="flex:1;font-size:10px;padding:6px 10px;background:rgba(6,214,160,0.2);color:#06D6A0;border:1.5px solid #06D6A0;font-weight:800;" onclick="window.setEditRoomAspectMode('iphone-pano')">
                    📱 iPhone Pano (Zero-Distortion)
                  </button>
                  <button type="button" class="tour-dialog-btn" id="editRoomModeFull" style="flex:1;font-size:10px;padding:6px 10px;background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.2);font-weight:800;" onclick="window.setEditRoomAspectMode('full-360')">
                    🌐 360° Photosphere (2:1)
                  </button>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:4px;">
                  <span>Vertical Height Stretch:</span>
                  <span id="editRoomVScaleLabel" style="font-family:monospace;color:#06D6A0;font-weight:800;">100%</span>
                </div>
                <input type="range" id="editRoomVScaleSlider" min="50" max="180" value="100" class="prop-range-slider" style="width:100%;" oninput="window.setEditRoomVScaleSlider(this.value)">
                <input type="hidden" id="editRoomAspectModeInput" value="iphone-pano">
                <input type="hidden" id="editRoomVScaleInput" value="1.0">
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
        <div class="tour-dialog-overlay" id="tourCameraScanModal" style="display:none; z-index:100; padding:0; background:rgba(0,0,0,0.96);">
          <div class="tour-camera-scanner-container">
            <!-- Scanner Header -->
            <div class="scan-header">
              <div class="scan-header-left">
                <span class="scan-title">📸 360° MATTERPORT SCANNER</span>
                <!-- Mode Switcher Tabs -->
                <div class="scan-mode-tabs">
                  <button type="button" class="scan-mode-tab active" id="scanTabSweep" onclick="window.switchScanCaptureMode('sweep')" title="Turn in a continuous 360° circle (Fast & Seamless)">
                    ⚡ 1-SWEEP 360°
                  </button>
                  <button type="button" class="scan-mode-tab" id="scanTabRadar" onclick="window.switchScanCaptureMode('radar')" title="Matterport-style guided radar stops">
                    🎯 12-STOP RADAR
                  </button>
                </div>
                <span class="scan-pill" id="scanSensorModePill">📳 GYRO READY</span>
                <span class="scan-pill" id="scanAnglePill" style="color:#FFD23F;border-color:#FFD23F;">0° / 360°</span>
              </div>
              <div class="scan-header-right">
                <button type="button" class="scan-btn-small" onclick="window.simulateDemo360Scan()" title="Simulate / Test full 360 scan" style="background:#06D6A0;color:#0d1b1e;font-weight:900;">
                  🧪 DEMO SCAN
                </button>
                <button type="button" class="scan-btn-small" onclick="window.recenterScannerGyro()" title="Recenter current heading to 0°">
                  🎯 RECENTER
                </button>
                <button type="button" class="scan-btn-small" onclick="window.toggleCameraFacingMode()" title="Switch Front/Rear Camera">
                  🔄 CAMERA
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
                  <span class="scan-ring-status" id="scanRingStatus">HOLD LEVEL & ROTATE</span>
                </div>

                <!-- 360 Target Node Dots Layer (for 12-stop radar) -->
                <div class="scan-nodes-layer" id="scanNodesLayer"></div>

                <!-- Continuous Sweep Compass Dial Overlay -->
                <div class="scan-sweep-compass-wrap" id="scanSweepCompassWrap">
                  <svg class="scan-sweep-dial-svg" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="8" />
                    <circle id="scanSweepProgressCircle" cx="100" cy="100" r="85" fill="none" stroke="#06D6A0" stroke-width="9" stroke-linecap="round" stroke-dasharray="534" stroke-dashoffset="534" transform="rotate(-90 100 100)" />
                    <circle id="scanSweepIndicatorDot" cx="100" cy="15" r="7" fill="#FFD23F" stroke="#fff" stroke-width="2" />
                  </svg>
                  <div class="scan-sweep-center-info">
                    <span id="scanSweepDegLabel" style="font-size:24px;font-weight:900;color:#FFD23F;font-family:monospace;">0°</span>
                    <span id="scanSweepSubLabel" style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.85);letter-spacing:0.04em;">TURN SLOWLY</span>
                  </div>
                </div>

                <!-- Guidance Arrow -->
                <div class="scan-guide-arrow" id="scanGuideArrow">
                  <span class="guide-arrow-icon" id="scanGuideIcon">➔</span>
                  <span class="guide-arrow-text" id="scanGuideText">Rotate your body slowly in a circle to capture the room</span>
                </div>

                <!-- Flash Animation -->
                <div class="scan-flash-fx" id="scanFlashFx"></div>
              </div>

              <!-- Live Floating Stats -->
              <div class="scan-floating-hud">
                <div class="scan-progress-box">
                  <span style="font-size:11px;font-weight:800;color:#06D6A0;" id="scanProgressLabel">0 / 12 ANGLES (0%)</span>
                  <div class="scan-progress-bar-bg">
                    <div class="scan-progress-bar-fill" id="scanProgressBarFill" style="width:0%;"></div>
                  </div>
                </div>
                <button type="button" id="scanEnableGyroBtn" onclick="window.enableScannerGyroAim()"
                  style="background:#FFD23F;color:#14121A;border:none;border-radius:8px;padding:8px 12px;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 2px 12px rgba(255,210,63,0.45);">
                  🧭 ENABLE MOTION GYRO
                </button>
                <div class="scan-auto-snap-toggle" onclick="window.toggleAutoCaptureOnAlign()">
                  <input type="checkbox" id="scanAutoSnapCheck" checked>
                  <label for="scanAutoSnapCheck" style="cursor:pointer;font-size:11px;font-weight:700;">⚡ Auto-Snap</label>
                </div>
              </div>
            </div>

            <!-- Live Panoramic Stitched Strip Preview -->
            <div class="scan-ribbon-section">
              <div class="scan-ribbon-header">
                <span style="font-size:11px;font-weight:800;color:#FFD23F;">🖼️ LIVE 360° PANORAMA STRIP</span>
                <span style="font-size:10px;color:rgba(255,255,255,0.7);" id="scanRibbonHint">Rotates seamlessly as you turn</span>
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
                  🗑️ RESET
                </button>
                <button type="button" class="scan-ctrl-btn" id="scanSweepStartBtn" onclick="window.toggleContinuousSweep()" style="background:#06D6A0;color:#0d1b1e;font-weight:900;">
                  ▶ START SWEEP
                </button>
              </div>

              <div class="scan-bottom-center">
                <button type="button" class="scan-shutter-btn" id="scanShutterBtn" onclick="window.captureCurrentScanAngle()">
                  <span class="shutter-inner">📸</span>
                  <span class="shutter-text">SNAP</span>
                </button>
              </div>

              <div class="scan-bottom-right">
                <button type="button" class="scan-ctrl-btn scan-btn-success" id="scanFinishUseBtn" onclick="window.finishAndUse360Stitch()">
                  ✨ STITCH & SAVE 360°
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
        const curSc = activeSceneList[activeSceneIndex];
        targetYaw = (curSc && typeof curSc.startYaw === 'number') ? curSc.startYaw : 0;
        targetPitch = (curSc && typeof curSc.startPitch === 'number') ? curSc.startPitch : 0;
        targetFov = (curSc && typeof curSc.startFov === 'number') ? curSc.startFov : 65;
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

    // Smooth Camera Inertia & Matterport Perspective
    const curScene = activeSceneList[activeSceneIndex] || {};
    const aspectMode = curScene.aspectMode || 'matterport-arc';
    const isMatterportArc = (aspectMode === 'matterport-arc');

    // Camera inertia
    yaw += (targetYaw - yaw) * 0.14;
    pitch += (targetPitch - pitch) * 0.14;
    fov += (targetFov - fov) * 0.14;

    if (isAutoRotating && !isDragging && !gyroEnabled) {
      if (isMatterportArc) {
        const spanDeg = curScene.arcSpanDeg || 220;
        const halfSpan = (spanDeg / 2) - 15;
        const center = curScene.startYaw || 0;
        if (targetYaw >= center + halfSpan) {
          autoRotateSpeed = -Math.abs(autoRotateSpeed || 0.12);
        } else if (targetYaw <= center - halfSpan) {
          autoRotateSpeed = Math.abs(autoRotateSpeed || 0.12);
        }
      }
      targetYaw += autoRotateSpeed;
      yaw += autoRotateSpeed;
    }

    if (isMatterportArc) {
      // Natural room boundary containment: 0% Seam, No Split Furniture, No Repetition!
      const spanDeg = curScene.arcSpanDeg || 220;
      const halfLimit = Math.max(20, (spanDeg / 2) - 25);
      const center = curScene.startYaw || 0;
      const minYaw = center - halfLimit;
      const maxYaw = center + halfLimit;

      if (targetYaw < minYaw) {
        targetYaw += (minYaw - targetYaw) * 0.18;
      } else if (targetYaw > maxYaw) {
        targetYaw += (maxYaw - targetYaw) * 0.18;
      }
      targetPitch = Math.max(-50, Math.min(50, targetPitch));
      pitch = Math.max(-52, Math.min(52, pitch));
    } else {
      while (yaw > 180) { yaw -= 360; targetYaw -= 360; }
      while (yaw < -180) { yaw += 360; targetYaw += 360; }
    }

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
      // Offset by 180° so yaw=0 faces the center of the panorama image
      const phi = THREE.MathUtils.degToRad(90 - pitch);
      const theta = THREE.MathUtils.degToRad(yaw + 180);

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
      const theta = THREE.MathUtils.degToRad(hs.yaw + 180);

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

    // Set Initial Human Perspective / Room Starting View
    if (typeof scene.startYaw === 'number') {
      yaw = scene.startYaw;
      targetYaw = scene.startYaw;
    } else {
      yaw = 0;
      targetYaw = 0;
    }
    if (typeof scene.startPitch === 'number') {
      pitch = scene.startPitch;
      targetPitch = scene.startPitch;
    } else {
      pitch = 0;
      targetPitch = 0;
    }
    if (typeof scene.startFov === 'number') {
      fov = scene.startFov;
      targetFov = scene.startFov;
    } else {
      fov = 65;
      targetFov = 65;
    }

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

    // Populate Proportions settings
    const curMode = scene.aspectMode || 'iphone-pano';
    const curVScale = typeof scene.vScale === 'number' ? scene.vScale : 1.0;
    const modeInp = document.getElementById('editRoomAspectModeInput');
    const vScaleInp = document.getElementById('editRoomVScaleInput');
    const vScaleSlider = document.getElementById('editRoomVScaleSlider');
    const vScaleLbl = document.getElementById('editRoomVScaleLabel');
    if (modeInp) modeInp.value = curMode;
    if (vScaleInp) vScaleInp.value = curVScale;
    if (vScaleSlider) vScaleSlider.value = Math.round(curVScale * 100);
    if (vScaleLbl) vScaleLbl.textContent = `${Math.round(curVScale * 100)}%`;
    if (typeof window.setEditRoomAspectMode === 'function') {
      window.setEditRoomAspectMode(curMode);
    }

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

    // Save Proportions settings
    const modeInp = document.getElementById('editRoomAspectModeInput');
    const vScaleInp = document.getElementById('editRoomVScaleInput');
    if (modeInp && modeInp.value) {
      scene.aspectMode = modeInp.value;
    }
    if (vScaleInp && vScaleInp.value) {
      scene.vScale = parseFloat(vScaleInp.value) || 1.0;
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
  // TOUR BUILDER MOBILE TOOLS DROPDOWN
  // ==========================================
  window.toggleTourToolsDropdown = function (forceState) {
    const menu = document.getElementById('tourToolsDropdownMenu');
    if (!menu) return;
    const isShowing = menu.classList.contains('show');
    const newState = (typeof forceState === 'boolean') ? forceState : !isShowing;
    menu.classList.toggle('show', newState);
  };

  // ==========================================
  // PROPORTIONS & MATTERPORT ALIGNMENT CONTROLS
  // ==========================================
  window.toggleTourProportionsMenu = function (forceState) {
    const pop = document.getElementById('tourProportionsPopover');
    if (!pop) return;
    const isVisible = (pop.style.display !== 'none');
    const newState = (typeof forceState === 'boolean') ? forceState : !isVisible;
    pop.style.display = newState ? 'flex' : 'none';

    if (newState) {
      // Sync current scene values to popover controls
      const curScene = activeSceneList[activeSceneIndex] || {};
      const mode = curScene.aspectMode || 'matterport-arc';
      const scale = typeof curScene.vScale === 'number' ? curScene.vScale : 1.0;
      const hShift = typeof curScene.hShift === 'number' ? curScene.hShift : 0;
      const seamBlend = typeof curScene.seamBlend === 'number' ? curScene.seamBlend : 0.08;
      const seamVOffset = typeof curScene.seamVOffset === 'number' ? curScene.seamVOffset : 0;
      const hSpan = typeof curScene.hSpan === 'number' ? curScene.hSpan : 1.0;

      const btnMat = document.getElementById('propModeMatterport');
      const btnLoop = document.getElementById('propMode360Loop');
      const btnFull = document.getElementById('propModeFull');
      if (btnMat) btnMat.classList.toggle('active', mode === 'matterport-arc' || (!mode && mode !== '360-loop' && mode !== 'full-360'));
      if (btnLoop) btnLoop.classList.toggle('active', mode === '360-loop' || mode === 'iphone-pano');
      if (btnFull) btnFull.classList.toggle('active', mode === 'full-360');

      const vScaleSlider = document.getElementById('propVScaleSlider');
      const vScaleLabel = document.getElementById('propVScaleVal');
      if (vScaleSlider) vScaleSlider.value = Math.round(scale * 100);
      if (vScaleLabel) vScaleLabel.textContent = `${Math.round(scale * 100)}%`;

      const hShiftSlider = document.getElementById('propHShiftSlider');
      const hShiftLabel = document.getElementById('propHShiftVal');
      if (hShiftSlider) hShiftSlider.value = Math.round(hShift);
      if (hShiftLabel) hShiftLabel.textContent = `${Math.round(hShift)}°`;

      const seamBlendSlider = document.getElementById('propSeamBlendSlider');
      const seamBlendLabel = document.getElementById('propSeamBlendVal');
      if (seamBlendSlider) seamBlendSlider.value = Math.round(seamBlend * 100);
      if (seamBlendLabel) seamBlendLabel.textContent = `${Math.round(seamBlend * 100)}%`;

      const seamVOffsetSlider = document.getElementById('propSeamVOffsetSlider');
      const seamVOffsetLabel = document.getElementById('propSeamVOffsetVal');
      if (seamVOffsetSlider) seamVOffsetSlider.value = Math.round(seamVOffset);
      if (seamVOffsetLabel) seamVOffsetLabel.textContent = `${Math.round(seamVOffset)} px`;

      const hSpanSlider = document.getElementById('propHSpanSlider');
      const hSpanLabel = document.getElementById('propHSpanVal');
      if (hSpanSlider) hSpanSlider.value = Math.round(hSpan * 100);
      if (hSpanLabel) hSpanLabel.textContent = `${Math.round(hSpan * 100)}%`;
    }
  };

  window.setTourAspectMode = function (mode) {
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;
    curScene.aspectMode = mode;

    const btnMat = document.getElementById('propModeMatterport');
    const btnLoop = document.getElementById('propMode360Loop');
    const btnFull = document.getElementById('propModeFull');
    if (btnMat) btnMat.classList.toggle('active', mode === 'matterport-arc');
    if (btnLoop) btnLoop.classList.toggle('active', mode === '360-loop' || mode === 'iphone-pano');
    if (btnFull) btnFull.classList.toggle('active', mode === 'full-360');

    // Reload texture with new mode immediately
    loadThreePanoTexture(currentPanoUrl, curScene);

    if (typeof showToast === 'function') {
      if (mode === 'matterport-arc') {
        showToast('✨ Matterport Pro Arc Active: 0% Seam, Real-World Perspective!');
      } else if (mode === '360-loop') {
        showToast('🔄 360° Continuous Walkthrough Active (Overlap Trim Enabled)');
      } else {
        showToast('🌐 Full 360° Photosphere Active');
      }
    }
  };

  window.applyMatterportPreset = function () {
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;
    curScene.aspectMode = 'matterport-arc';
    curScene.vScale = 1.0;
    curScene.seamBlend = 0.08;
    curScene.seamVOffset = 0;
    curScene.hSpan = 1.0;
    curScene.startYaw = Math.round(yaw);
    curScene.startPitch = Math.round(pitch);
    curScene.startFov = 65;
    targetFov = 65;
    fov = 65;

    const btnMat = document.getElementById('propModeMatterport');
    const btnLoop = document.getElementById('propMode360Loop');
    const btnFull = document.getElementById('propModeFull');
    if (btnMat) btnMat.classList.add('active');
    if (btnLoop) btnLoop.classList.remove('active');
    if (btnFull) btnFull.classList.remove('active');

    const vScaleSlider = document.getElementById('propVScaleSlider');
    const vScaleLabel = document.getElementById('propVScaleVal');
    if (vScaleSlider) vScaleSlider.value = 100;
    if (vScaleLabel) vScaleLabel.textContent = '100%';

    loadThreePanoTexture(currentPanoUrl, curScene);
    window.saveTourChangesToMagazine();

    if (typeof showToast === 'function') {
      showToast('🪄 1-Click Matterport Pro Applied: 0% Seam, 65° Human View, 100% Height!');
    }
  };

  window.setTourStartingView = function () {
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;
    curScene.startYaw = Math.round(yaw);
    curScene.startPitch = Math.round(pitch);
    curScene.startFov = Math.round(fov);

    window.saveTourChangesToMagazine();

    if (typeof showToast === 'function') {
      showToast(`📍 Starting View Locked: Yaw ${Math.round(yaw)}°, Pitch ${Math.round(pitch)}°, FOV ${Math.round(fov)}°!`);
    }
  };

  window.setTourVScale = function (scaleVal) {
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;
    const clamped = Math.max(0.5, Math.min(1.8, parseFloat(scaleVal) || 1.0));
    curScene.vScale = clamped;

    const slider = document.getElementById('propVScaleSlider');
    const valLabel = document.getElementById('propVScaleVal');
    if (slider) slider.value = Math.round(clamped * 100);
    if (valLabel) valLabel.textContent = `${Math.round(clamped * 100)}%`;

    loadThreePanoTexture(currentPanoUrl, curScene);
  };

  window.adjustTourVScale = function (delta) {
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;
    const cur = typeof curScene.vScale === 'number' ? curScene.vScale : 1.0;
    window.setTourVScale(cur + delta);
  };

  window.resetTourVScale = function () {
    window.setTourVScale(1.0);
  };

  window.setTourHShift = function (degVal) {
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;
    const deg = ((parseFloat(degVal) || 0) % 360 + 360) % 360;
    curScene.hShift = deg;

    const slider = document.getElementById('propHShiftSlider');
    const valLabel = document.getElementById('propHShiftVal');
    if (slider) slider.value = Math.round(deg);
    if (valLabel) valLabel.textContent = `${Math.round(deg)}°`;

    loadThreePanoTexture(currentPanoUrl, curScene);
  };

  window.adjustTourHShift = function (deltaDeg) {
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;
    const cur = typeof curScene.hShift === 'number' ? curScene.hShift : 0;
    window.setTourHShift(cur + deltaDeg);
  };

  window.setTourSeamBlend = function (blendVal) {
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;
    const clamped = Math.max(0, Math.min(0.2, parseFloat(blendVal) || 0));
    curScene.seamBlend = clamped;

    const slider = document.getElementById('propSeamBlendSlider');
    const valLabel = document.getElementById('propSeamBlendVal');
    if (slider) slider.value = Math.round(clamped * 100);
    if (valLabel) valLabel.textContent = `${Math.round(clamped * 100)}%`;

    loadThreePanoTexture(currentPanoUrl, curScene);
  };

  window.setTourSeamVOffset = function (offsetPx) {
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;
    const clamped = Math.max(-50, Math.min(50, parseInt(offsetPx, 10) || 0));
    curScene.seamVOffset = clamped;

    const slider = document.getElementById('propSeamVOffsetSlider');
    const valLabel = document.getElementById('propSeamVOffsetVal');
    if (slider) slider.value = clamped;
    if (valLabel) valLabel.textContent = `${clamped} px`;

    loadThreePanoTexture(currentPanoUrl, curScene);
  };

  window.adjustTourSeamVOffset = function (delta) {
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;
    const cur = typeof curScene.seamVOffset === 'number' ? curScene.seamVOffset : 0;
    window.setTourSeamVOffset(cur + delta);
  };

  window.setTourHSpan = function (spanVal) {
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;
    const clamped = Math.max(0.8, Math.min(1.1, parseFloat(spanVal) || 1.0));
    curScene.hSpan = clamped;

    const slider = document.getElementById('propHSpanSlider');
    const valLabel = document.getElementById('propHSpanVal');
    if (slider) slider.value = Math.round(clamped * 100);
    if (valLabel) valLabel.textContent = `${Math.round(clamped * 100)}%`;

    loadThreePanoTexture(currentPanoUrl, curScene);
  };

  window.autoAlignRoomSeam = function () {
    const curScene = activeSceneList[activeSceneIndex];
    if (!curScene) return;
    curScene.seamBlend = 0.08; // 8% cosine feather
    curScene.seamVOffset = 0;
    curScene.hSpan = 1.0;

    const blendSlider = document.getElementById('propSeamBlendSlider');
    const blendVal = document.getElementById('propSeamBlendVal');
    if (blendSlider) blendSlider.value = 8;
    if (blendVal) blendVal.textContent = '8%';

    const seamVOffsetSlider = document.getElementById('propSeamVOffsetSlider');
    const seamVOffsetLabel = document.getElementById('propSeamVOffsetVal');
    if (seamVOffsetSlider) seamVOffsetSlider.value = 0;
    if (seamVOffsetLabel) seamVOffsetLabel.textContent = '0 px';

    loadThreePanoTexture(currentPanoUrl, curScene);

    if (typeof showToast === 'function') {
      showToast('🪄 Seamless edge blend applied! Fine-tune rotation or tilt if needed.');
    }
  };

  window.toggleHdSharpness = function () {
    if (!threeRenderer || !currentTexture) return;
    const maxAniso = threeRenderer.capabilities.getMaxAnisotropy() || 1;
    const isCurrentlyMax = (currentTexture.anisotropy >= maxAniso);
    currentTexture.anisotropy = isCurrentlyMax ? 1 : maxAniso;
    currentTexture.needsUpdate = true;

    const badge = document.getElementById('propSharpBadge');
    if (badge) {
      badge.textContent = isCurrentlyMax ? 'OFF' : 'ON';
      badge.style.color = isCurrentlyMax ? '#FF4D6D' : '#06D6A0';
    }

    if (typeof showToast === 'function') {
      showToast(isCurrentlyMax ? 'Texture filtering: Standard' : '✨ 16x Ultra-HD WebGL Anisotropic Filtering Enabled');
    }
  };

  window.saveCurrentRoomProportions = function () {
    window.toggleTourProportionsMenu(false);
    window.saveTourChangesToMagazine();
    if (typeof showToast === 'function') {
      showToast('💾 Saved room proportions & seam alignment for everyone!');
    }
  };

  window.setEditRoomAspectMode = function (mode) {
    const inp = document.getElementById('editRoomAspectModeInput');
    if (inp) inp.value = mode;

    const btnIphone = document.getElementById('editRoomModeIphone');
    const btnFull = document.getElementById('editRoomModeFull');
    if (btnIphone) {
      btnIphone.style.background = (mode === 'iphone-pano') ? 'rgba(6,214,160,0.2)' : 'rgba(255,255,255,0.08)';
      btnIphone.style.color = (mode === 'iphone-pano') ? '#06D6A0' : '#fff';
      btnIphone.style.borderColor = (mode === 'iphone-pano') ? '#06D6A0' : 'rgba(255,255,255,0.2)';
    }
    if (btnFull) {
      btnFull.style.background = (mode === 'full-360') ? 'rgba(255,210,63,0.2)' : 'rgba(255,255,255,0.08)';
      btnFull.style.color = (mode === 'full-360') ? '#FFD23F' : '#fff';
      btnFull.style.borderColor = (mode === 'full-360') ? '#FFD23F' : 'rgba(255,255,255,0.2)';
    }
  };

  window.setEditRoomVScaleSlider = function (val) {
    const scale = (parseInt(val, 10) || 100) / 100;
    const inp = document.getElementById('editRoomVScaleInput');
    const lbl = document.getElementById('editRoomVScaleLabel');
    if (inp) inp.value = scale;
    if (lbl) lbl.textContent = `${Math.round(scale * 100)}%`;
  };

  // ==========================================
  // 4. DELETE ROOM / SPACE
  // ==========================================

  window.deleteTourRoom = function (idx) {
    if (typeof idx !== 'number' || idx < 0 || idx >= activeSceneList.length) {
      idx = activeSceneIndex;
    }

    // If only 1 room remains, reset and clean the room to a fresh default state
    if (activeSceneList.length <= 1) {
      const oldRoom = activeSceneList[0] || {};
      const oldName = oldRoom.name || 'Room 1';
      activeSceneList = [{
        id: 'room_' + Date.now().toString(36),
        name: 'Main Space',
        location: (currentTourData && currentTourData.location) || 'Wasatch Front, UT',
        tag: '360° Walkthrough',
        panoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2500&q=80',
        tourUrl: '',
        aspectMode: 'full-360',
        vScale: 1.0,
        blurb: 'Explore this space in 360°',
        hotspots: []
      }];
      activeSceneIndex = 0;
      window.closeEditRoomDialog();
      window.closeManageRoomsDialog();
      loadScene(0);
      renderSceneSelector();
      window.saveTourChangesToMagazine();
      if (typeof showToast === 'function') {
        showToast(`🗑️ "${oldName}" reset to clean 360° space!`);
      }
      return;
    }

    const roomToDelete = activeSceneList[idx];
    const roomName = roomToDelete ? roomToDelete.name : `Room ${idx + 1}`;
    const deletedId = roomToDelete?.id;

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
      activeSceneIndex = Math.max(0, activeSceneList.length - 1);
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
  // 360° MATTERPORT-GRADE CAMERA SCANNER & EQUIRECTANGULAR STITCHER ENGINE
  // =========================================================================

  // Stable 12-stop horizon orbit (every 30°) + optional ceiling/floor
  const SCAN_ROWS = [
    { pitch: 0, count: 12 } // Primary level horizon orbit (360° room walkthrough)
  ];
  let SCAN_TOTAL_NODES = 12;

  let scanCaptureMode = 'sweep'; // 'sweep' (Matterport 1-Sweep) or 'radar' (12-Stop Guided)
  let scanMode = 'new_room'; // 'new_room' or 'replace_room'
  let scanStream = null;
  let scanCameraFacing = 'environment';
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
  let scanNodeEls = [];
  let scanNodesInitialized = false;

  // Continuous sweep state
  let scanIsSweeping = false;
  let scanSweepStartYaw = 0;
  let scanSweepCoveredDeg = 0;
  let scanSweepLastSampleYaw = -999;
  let scanSweepSamples = [];

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
          timestamp: 0,
          captureYaw: i * step,
          capturePitch: row.pitch
        });
      }
    });
    SCAN_TOTAL_NODES = scanSlots.length; // 12
    scanSweepSamples = [];
    scanSweepCoveredDeg = 0;
    scanSweepLastSampleYaw = -999;
    scanIsSweeping = false;
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

  window.switchScanCaptureMode = function (mode) {
    scanCaptureMode = mode;
    const tabSweep = document.getElementById('scanTabSweep');
    const tabRadar = document.getElementById('scanTabRadar');
    const compassWrap = document.getElementById('scanSweepCompassWrap');
    const nodesLayer = document.getElementById('scanNodesLayer');
    const sweepBtn = document.getElementById('scanSweepStartBtn');
    const shutterBtn = document.getElementById('scanShutterBtn');

    if (tabSweep) tabSweep.classList.toggle('active', mode === 'sweep');
    if (tabRadar) tabRadar.classList.toggle('active', mode === 'radar');

    if (compassWrap) compassWrap.style.display = (mode === 'sweep') ? 'flex' : 'none';
    if (nodesLayer) nodesLayer.style.display = (mode === 'radar') ? 'block' : 'none';
    if (sweepBtn) sweepBtn.style.display = (mode === 'sweep') ? 'inline-block' : 'none';
    if (shutterBtn) shutterBtn.style.display = (mode === 'radar') ? 'flex' : 'none';

    const ringStatus = document.getElementById('scanRingStatus');
    if (ringStatus) {
      ringStatus.textContent = (mode === 'sweep') ? 'TURN SLOWLY 360°' : 'ROTATE TO GLOWING DOT';
    }

    if (typeof showToast === 'function') {
      showToast(mode === 'sweep'
        ? '⚡ Matterport 1-Sweep Mode: Tap "START SWEEP" and turn in a smooth 360° circle.'
        : '🎯 Matterport Guided Radar: Rotate to each dot; auto-snaps when locked.');
    }
  };

  window.recenterScannerGyro = function () {
    scanBaseYawOffset = scanSmoothYaw + scanBaseYawOffset;
    scanCurrentYaw = 0;
    scanSmoothYaw = 0;
    scanCurrentPitch = 0;
    scanSmoothPitch = 0;
    if (typeof showToast === 'function') {
      showToast('🎯 Heading calibrated! Current view set to 0° forward.');
    }
  };

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

    window.switchScanCaptureMode(scanCaptureMode || 'sweep');
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
      console.warn('[Matterport 360 Scanner] Camera fallback:', err);
      try {
        scanStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = scanStream;
        await video.play().catch(e => console.warn('Video play deferred fallback:', e));
      } catch (err2) {
        console.error('[Matterport 360 Scanner] Camera access failed:', err2);
        const ringStatus = document.getElementById('scanRingStatus');
        if (ringStatus) {
          ringStatus.textContent = 'CAMERA BLOCKED · ALLOW PERMISSION';
          ringStatus.style.color = '#FF4D6D';
        }
      }
    }
  }

  window.toggleCameraFacingMode = async function () {
    scanCameraFacing = (scanCameraFacing === 'environment') ? 'user' : 'environment';
    await startScannerCameraFeed();
    if (typeof showToast === 'function') {
      showToast(`🔄 Camera switched to: ${scanCameraFacing === 'environment' ? 'Rear / Room' : 'Front / Self'}`);
    }
  };

  // ===== ROCK-SOLID MATTERPORT GYRO ORIENTATION (ZERO JUMPING) =====
  let _scanOrientHandler = null;
  let _scanRelSensor = null;
  let _scanGyroPrimed = false;
  let _lastRawYaw = null;

  function stopScannerGyroListeners() {
    if (_scanOrientHandler) {
      window.removeEventListener('deviceorientation', _scanOrientHandler, true);
      window.removeEventListener('deviceorientation', _scanOrientHandler, false);
      _scanOrientHandler = null;
    }
    if (_scanRelSensor) {
      try { _scanRelSensor.stop(); } catch (e) {}
      _scanRelSensor = null;
    }
  }

  function setSensorPill(text, color) {
    var pill = document.getElementById('scanSensorModePill');
    if (!pill) return;
    pill.textContent = text;
    pill.style.color = color || '#FFD23F';
    pill.style.borderColor = color || '#FFD23F';
  }

  function applyGyroLook(yawDeg, pitchDeg) {
    if (scanIsDragging) return;

    if (!_scanGyroPrimed) {
      scanBaseYawOffset = yawDeg;
      scanSmoothYaw = 0;
      scanSmoothPitch = pitchDeg;
      scanCurrentYaw = 0;
      scanCurrentPitch = pitchDeg;
      _scanGyroPrimed = true;
      scanHasGyro = true;
      setSensorPill('📳 GYRO ACTIVE · READY', '#06D6A0');
      var btn = document.getElementById('scanEnableGyroBtn');
      if (btn) {
        btn.textContent = '✅ GYRO ACTIVE';
        btn.style.background = '#06D6A0';
        btn.style.color = '#0d1b1e';
      }
      return;
    }

    scanHasGyro = true;
    var targetYaw = normalizeAngle360(yawDeg - scanBaseYawOffset);
    var targetPitch = Math.max(-45, Math.min(45, pitchDeg));

    // Low-pass exponential moving average with unwrapped angle delta to eliminate jitter
    var dy = angleDiffSigned(targetYaw, scanSmoothYaw);
    scanSmoothYaw = normalizeAngle360(scanSmoothYaw + dy * 0.35);
    scanSmoothPitch = scanSmoothPitch + (targetPitch - scanSmoothPitch) * 0.35;
    scanCurrentYaw = scanSmoothYaw;
    scanCurrentPitch = scanSmoothPitch;

    // In continuous sweep mode, sample keyframes automatically
    if (scanIsSweeping) {
      handleContinuousSweepProgress();
    }
  }

  function onDeviceOrientationEvent(e) {
    if (e.alpha === null || e.alpha === undefined) return;
    if (e.beta === null || e.beta === undefined) return;

    var rawYaw;
    if (typeof e.webkitCompassHeading === 'number' && !isNaN(e.webkitCompassHeading)) {
      rawYaw = e.webkitCompassHeading;
    } else if (e.absolute === true) {
      rawYaw = e.alpha;
    } else {
      rawYaw = (360 - e.alpha);
    }

    // Stabilized pitch from beta (upright phone: beta ~ 85-95 -> pitch 0)
    var rawPitch = (e.beta != null ? e.beta : 90) - 90;
    if (e.gamma != null && Math.abs(e.gamma) > 45) {
      // Phone is held horizontally/landscape
      rawPitch = e.gamma > 0 ? (90 - e.gamma) : (-90 - e.gamma);
    }

    applyGyroLook(rawYaw, rawPitch);
  }

  function startOrientationListeners() {
    stopScannerGyroListeners();
    _scanGyroPrimed = false;
    scanHasGyro = false;

    // Chrome RelativeOrientationSensor if available
    try {
      if (typeof RelativeOrientationSensor === 'function') {
        var sensor = new RelativeOrientationSensor({ frequency: 60, referenceFrame: 'screen' });
        sensor.onreading = function () {
          var q = sensor.quaternion;
          if (!q) return;
          var x = q[0], y = q[1], z = q[2], w = q[3];
          var siny = 2 * (w * y + z * x);
          var cosy = 1 - 2 * (y * y + x * x);
          var yaw = Math.atan2(siny, cosy) * (180 / Math.PI);
          var sinp = 2 * (w * x - y * z);
          var pitch = Math.asin(Math.max(-1, Math.min(1, sinp))) * (180 / Math.PI);
          applyGyroLook(normalizeAngle360(yaw), -pitch);
        };
        sensor.start();
        _scanRelSensor = sensor;
      }
    } catch (err) {}

    _scanOrientHandler = onDeviceOrientationEvent;
    window.addEventListener('deviceorientation', _scanOrientHandler, true);
    setSensorPill('📳 MOTION READY', '#06D6A0');
  }

  window.enableScannerGyroAim = async function () {
    var btn = document.getElementById('scanEnableGyroBtn');
    if (btn) {
      btn.textContent = '⏳ REQUESTING…';
      btn.disabled = true;
    }

    try {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        var resp = await DeviceOrientationEvent.requestPermission();
        if (resp !== 'granted') {
          setSensorPill('👆 DRAG TO ROTATE', '#FF4D6D');
          if (btn) {
            btn.textContent = '🧭 MOTION DENIED (DRAG TO ROTATE)';
            btn.disabled = false;
          }
          return;
        }
      }
    } catch (err) {
      console.warn('[Scanner gyro permission]', err);
    }

    startOrientationListeners();
    if (btn) {
      btn.disabled = false;
      btn.textContent = '✅ MOTION ACTIVE';
      btn.style.background = '#06D6A0';
      btn.style.color = '#0d1b1e';
    }
  };

  function bindScannerSensors() {
    var viewfinder = document.getElementById('scanViewfinderArea');
    _scanGyroPrimed = false;
    scanHasGyro = false;

    var needsTap = (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function');
    if (!needsTap) {
      startOrientationListeners();
    }

    // Touch & mouse drag support
    if (viewfinder && !viewfinder._hasDragListeners) {
      viewfinder._hasDragListeners = true;

      var onStart = function (cx, cy) {
        scanIsDragging = true;
        scanDragStartX = cx;
        scanDragStartY = cy;
        scanDragStartYaw = scanCurrentYaw;
        scanDragStartPitch = scanCurrentPitch;
      };
      var onMove = function (cx, cy) {
        if (!scanIsDragging) return;
        var dx = cx - scanDragStartX;
        var dy = cy - scanDragStartY;
        scanCurrentYaw = normalizeAngle360(scanDragStartYaw - dx * 0.45);
        scanCurrentPitch = Math.max(-45, Math.min(45, scanDragStartPitch + dy * 0.45));
        scanSmoothYaw = scanCurrentYaw;
        scanSmoothPitch = scanCurrentPitch;
        if (scanIsSweeping) handleContinuousSweepProgress();
      };
      var onEnd = function () { scanIsDragging = false; };

      viewfinder.addEventListener('mousedown', function (e) {
        e.preventDefault();
        onStart(e.clientX, e.clientY);
      });
      window.addEventListener('mousemove', function (e) { onMove(e.clientX, e.clientY); });
      window.addEventListener('mouseup', onEnd);

      viewfinder.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) onStart(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      window.addEventListener('touchmove', function (e) {
        if (e.touches.length === 1 && scanIsDragging) onMove(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      window.addEventListener('touchend', onEnd);
      window.addEventListener('touchcancel', onEnd);
    }
  }

  // ===== MATTERPORT 1-SWEEP CONTINUOUS ROTATION ENGINE =====
  window.toggleContinuousSweep = function () {
    if (scanIsSweeping) {
      // Stop sweep
      scanIsSweeping = false;
      var btn = document.getElementById('scanSweepStartBtn');
      if (btn) {
        btn.textContent = '▶ START SWEEP';
        btn.style.background = '#06D6A0';
        btn.style.color = '#0d1b1e';
      }
      return;
    }

    // Start sweep
    scanIsSweeping = true;
    scanSweepStartYaw = scanCurrentYaw;
    scanSweepCoveredDeg = 0;
    scanSweepLastSampleYaw = scanCurrentYaw;
    scanSweepSamples = [];
    initScanSlots();

    var btn = document.getElementById('scanSweepStartBtn');
    if (btn) {
      btn.textContent = '⏹ STOP SWEEP';
      btn.style.background = '#FF4D6D';
      btn.style.color = '#fff';
    }

    // Take initial 0° sample
    grabSweepFrame(0);

    if (typeof showToast === 'function') {
      showToast('⚡ Sweep active! Slowly turn your body in a full circle.');
    }
  };

  function grabSweepFrame(targetSlotIdx) {
    const video = document.getElementById('scanVideoFeed');
    const workCanvas = document.getElementById('scanWorkCanvas');
    const flashFx = document.getElementById('scanFlashFx');
    if (!video || !workCanvas) return;

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    if (vw === 0 || vh === 0) return;

    workCanvas.width = vw;
    workCanvas.height = vh;
    const ctx = workCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0, vw, vh);

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = vw;
    sliceCanvas.height = vh;
    sliceCanvas.getContext('2d').drawImage(workCanvas, 0, 0);

    const slotIdx = (typeof targetSlotIdx === 'number' && targetSlotIdx >= 0 && targetSlotIdx < scanSlots.length)
      ? targetSlotIdx
      : Math.floor((scanCurrentYaw / 360) * SCAN_TOTAL_NODES) % SCAN_TOTAL_NODES;

    scanSlots[slotIdx].captured = true;
    scanSlots[slotIdx].imgCanvas = sliceCanvas;
    scanSlots[slotIdx].timestamp = Date.now();
    scanSlots[slotIdx].captureYaw = scanCurrentYaw;
    scanSlots[slotIdx].capturePitch = scanCurrentPitch;

    if (flashFx) {
      flashFx.classList.add('flash');
      setTimeout(() => flashFx.classList.remove('flash'), 120);
    }
    if (navigator.vibrate) navigator.vibrate([25]);

    updateStitchPreviewRibbon();
    renderScanSlotsRibbon();
    updateScanProgressBar();
  }

  function handleContinuousSweepProgress() {
    const dYaw = angleDiffSigned(scanCurrentYaw, scanSweepLastSampleYaw);
    if (Math.abs(dYaw) >= 24) {
      // Capture frame at this angle step
      scanSweepLastSampleYaw = scanCurrentYaw;
      const targetSlot = Math.floor((scanCurrentYaw / 360) * SCAN_TOTAL_NODES) % SCAN_TOTAL_NODES;
      grabSweepFrame(targetSlot);
    }

    // Compute total progress towards 360°
    const capturedCount = scanSlots.filter(s => s.captured).length;
    const progressDeg = Math.min(360, Math.round((capturedCount / SCAN_TOTAL_NODES) * 360));
    scanSweepCoveredDeg = progressDeg;

    // Update Sweep SVG Ring
    const progressCircle = document.getElementById('scanSweepProgressCircle');
    const degLabel = document.getElementById('scanSweepDegLabel');
    const subLabel = document.getElementById('scanSweepSubLabel');

    if (progressCircle) {
      const maxOffset = 534;
      const offset = maxOffset * (1 - (progressDeg / 360));
      progressCircle.style.strokeDashoffset = String(offset);
    }
    if (degLabel) degLabel.textContent = `${progressDeg}°`;

    if (capturedCount >= SCAN_TOTAL_NODES) {
      scanIsSweeping = false;
      if (subLabel) {
        subLabel.textContent = '✓ COMPLETE!';
        subLabel.style.color = '#06D6A0';
      }
      var btn = document.getElementById('scanSweepStartBtn');
      if (btn) {
        btn.textContent = '✨ 360° CAPTURED';
        btn.style.background = '#FFD23F';
        btn.style.color = '#14121A';
      }
      if (typeof showToast === 'function') {
        showToast('🎉 360° sweep complete! Stitching photosphere…');
      }
      // Auto-trigger stitch after brief delay
      setTimeout(() => {
        window.finishAndUse360Stitch();
      }, 600);
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
      anglePill.textContent = `${Math.round(scanCurrentYaw)}° / 360°`;
    }

    if (viewfinder) {
      const vw = viewfinder.clientWidth || window.innerWidth;
      const vh = viewfinder.clientHeight || (window.innerHeight * 0.6);
      const centerX = vw / 2;
      const centerY = vh / 2;
      const hFov = 75;
      const vFov = 50;

      // Update Matterport 12-Stop Radar nodes if in radar mode
      if (scanCaptureMode === 'radar' && nodesLayer) {
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

        for (let idx = 0; idx < scanSlots.length; idx++) {
          const slot = scanSlots[idx];
          if (slot.captured) continue;
          const diffYaw = angleDiffSigned(slot.yaw, scanCurrentYaw);
          const diffPitch = slot.pitch - scanCurrentPitch;
          const angularDist = Math.hypot(diffYaw, diffPitch);
          if (angularDist < minAngularDistance) {
            minAngularDistance = angularDist;
            closestUncapturedIdx = idx;
          }
        }

        for (let idx = 0; idx < scanSlots.length; idx++) {
          const slot = scanSlots[idx];
          const el = scanNodeEls[idx];
          if (!el) continue;

          const diffYaw = angleDiffSigned(slot.yaw, scanCurrentYaw);
          const diffPitch = slot.pitch - scanCurrentPitch;
          const angularDist = Math.hypot(diffYaw, diffPitch);

          const screenX = centerX + (diffYaw / hFov) * vw;
          const screenY = centerY - (diffPitch / vFov) * vh;
          const isVisible = Math.abs(diffYaw) < hFov * 1.1 && Math.abs(diffPitch) < vFov * 1.1;

          if (!slot.captured && angularDist < 8.5) {
            alignedTargetIdx = idx;
          }

          el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%)`;
          el.style.visibility = isVisible ? 'visible' : 'hidden';

          const span = el.querySelector('span');
          el.classList.remove('pending', 'aligned', 'captured', 'next-target');

          if (slot.captured) {
            el.classList.add('captured');
            el.style.opacity = isVisible ? '0.75' : '0';
            if (span) span.textContent = '✓';
          } else if (angularDist < 8.5) {
            el.classList.add('aligned');
            el.style.opacity = '1';
            if (span) span.textContent = '●';
          } else if (idx === closestUncapturedIdx) {
            el.classList.add('pending', 'next-target');
            el.style.opacity = isVisible ? '1' : '0';
            if (span) span.textContent = '';
          } else {
            el.classList.add('pending');
            el.style.opacity = isVisible ? '0.25' : '0';
            if (span) span.textContent = '';
          }
        }

        // Center reticle feedback
        if (alignedTargetIdx !== -1) {
          const slot = scanSlots[alignedTargetIdx];
          if (centerRing) {
            centerRing.classList.add('aligned');
            centerRing.classList.toggle('captured', !!slot.captured);
          }
          if (ringStatus) {
            ringStatus.textContent = slot.captured ? `✓ CAPTURED (${Math.round(slot.yaw)}°)` : `LOCK · HOLD STEADY`;
            ringStatus.style.color = slot.captured ? '#06D6A0' : '#FFD23F';
          }

          if (scanAutoSnap && !slot.captured) {
            if (scanAlignedAngleIdx !== alignedTargetIdx) {
              scanAlignedAngleIdx = alignedTargetIdx;
              clearTimeout(scanAlignTimer);
              scanAlignTimer = setTimeout(function () {
                if (alignedTargetIdx === scanAlignedAngleIdx && !scanSlots[alignedTargetIdx].captured) {
                  window.captureSpecificScanAngle(alignedTargetIdx);
                }
              }, 340);
            }
          }
        } else {
          scanAlignedAngleIdx = -1;
          clearTimeout(scanAlignTimer);
          if (centerRing) centerRing.classList.remove('aligned', 'captured');
          if (ringStatus) {
            ringStatus.textContent = 'ROTATE TO TARGET DOT';
            ringStatus.style.color = 'rgba(255,255,255,0.75)';
          }
        }

        // Guidance arrow
        if (closestUncapturedIdx !== -1 && guideArrow && guideText && guideIcon) {
          const t = scanSlots[closestUncapturedIdx];
          const dYaw = angleDiffSigned(t.yaw, scanCurrentYaw);
          if (Math.abs(dYaw) > 8) {
            guideArrow.style.display = 'flex';
            guideIcon.textContent = dYaw > 0 ? '➔' : '⬅';
            guideText.textContent = `${dYaw > 0 ? 'TURN RIGHT ➔' : '⬅ TURN LEFT'} to ${Math.round(t.yaw)}°`;
          } else {
            guideArrow.style.display = 'none';
          }
        }
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

  window.captureCurrentScanAngle = function () {
    let closestIdx = 0;
    let minDiff = 999;
    scanSlots.forEach((slot, idx) => {
      const dYaw = Math.abs(angleDiffSigned(slot.yaw, scanCurrentYaw));
      if (dYaw < minDiff) {
        minDiff = dYaw;
        closestIdx = idx;
      }
    });
    window.captureSpecificScanAngle(closestIdx);
  };

  window.captureSpecificScanAngle = function (slotIdx) {
    grabSweepFrame(slotIdx);
    if (typeof showToast === 'function') {
      const capturedCount = scanSlots.filter(s => s.captured).length;
      showToast(`📸 Angle ${Math.round(scanSlots[slotIdx].yaw)}° captured! (${capturedCount}/${SCAN_TOTAL_NODES})`);
    }
  };

  function updateScanProgressBar() {
    const capturedCount = scanSlots.filter(s => s.captured).length;
    const percent = Math.round((capturedCount / SCAN_TOTAL_NODES) * 100);

    const label = document.getElementById('scanProgressLabel');
    const barFill = document.getElementById('scanProgressBarFill');
    const finishBtn = document.getElementById('scanFinishUseBtn');

    if (label) label.textContent = `${capturedCount} / ${SCAN_TOTAL_NODES} ANGLES (${percent}%)`;
    if (barFill) barFill.style.width = `${percent}%`;

    if (finishBtn) {
      if (capturedCount >= 6) {
        finishBtn.style.opacity = '1';
        finishBtn.style.pointerEvents = 'auto';
        finishBtn.disabled = false;
        finishBtn.textContent = `✨ STITCH & SAVE 360° (${capturedCount}/${SCAN_TOTAL_NODES})`;
      } else {
        finishBtn.style.opacity = '0.6';
        finishBtn.disabled = false;
        finishBtn.textContent = `✨ STITCH (need ${6 - capturedCount} more)`;
      }
    }
  }

  function renderScanSlotsRibbon() {
    const track = document.getElementById('scanSlotsTrack');
    if (!track) return;

    track.innerHTML = scanSlots.map((slot, idx) => {
      const isCaptured = slot.captured;
      return `
        <div class="scan-slot-chip ${isCaptured ? 'captured' : ''}" onclick="window.manualJumpToSlot(${idx})">
          <span style="font-size:10px;font-weight:800;">${Math.round(slot.yaw)}°</span>
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
  };

  function clearStitchPreviewCanvas() {
    const canvas = document.getElementById('panoStitchPreviewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#14121A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Live 360° Panorama Strip · Rotate phone to stitch room', canvas.width / 2, canvas.height / 2);
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
    const blendOverlap = sliceWidth * 0.3;

    scanSlots.forEach((slot, idx) => {
      if (slot.captured && slot.imgCanvas) {
        const destX = idx * sliceWidth;
        ctx.save();
        ctx.drawImage(slot.imgCanvas, 0, 0, slot.imgCanvas.width, slot.imgCanvas.height, destX - blendOverlap / 2, 0, sliceWidth + blendOverlap, ph);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(255, 210, 63, 0.05)';
        ctx.fillRect(idx * sliceWidth + 1, 0, sliceWidth - 2, ph);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(slot.yaw)}°`, idx * sliceWidth + sliceWidth / 2, ph / 2);
      }
    });
  }

  window.resetCurrent360Scan = function () {
    initScanSlots();
    renderScanSlotsRibbon();
    updateScanProgressBar();
    clearStitchPreviewCanvas();
    if (typeof showToast === 'function') showToast('🗑️ Scanner reset to 0°.');
  };

  /**
   * Generates a 360° architectural room scan for instant testing and verification
   */
  window.simulateDemo360Scan = function () {
    initScanSlots();
    const work = document.createElement('canvas');
    work.width = 960;
    work.height = 720;
    const wctx = work.getContext('2d');

    const roomThemes = [
      { name: 'North Living Room', sky: '#1f2430', wall: '#2d3345', floor: '#634b35', accent: '#FFD23F' },
      { name: 'NE Fireplace & Art', sky: '#242a38', wall: '#343c50', floor: '#5a4330', accent: '#06D6A0' },
      { name: 'East Grand Windows', sky: '#89a8c4', wall: '#e8edf2', floor: '#73573e', accent: '#4ea8de' },
      { name: 'SE Mountain View Patio', sky: '#688ca8', wall: '#cfd8dc', floor: '#4a3828', accent: '#ffb703' },
      { name: 'South Dining Suite', sky: '#2b2938', wall: '#3d394e', floor: '#614833', accent: '#fb8500' },
      { name: 'SW Designer Kitchen', sky: '#20222a', wall: '#2e303b', floor: '#503b2b', accent: '#06D6A0' },
      { name: 'West Marble Bar', sky: '#181a20', wall: '#232730', floor: '#423124', accent: '#FFD23F' },
      { name: 'NW Modern Lounge', sky: '#1c1f28', wall: '#282d3a', floor: '#543f2e', accent: '#e63946' },
      { name: 'North Corridor', sky: '#212530', wall: '#303646', floor: '#5e4632', accent: '#a8dadc' },
      { name: 'NW Gallery Alcove', sky: '#1a1d26', wall: '#262a36', floor: '#4d3929', accent: '#f1faee' },
      { name: 'North Entry Portal', sky: '#1d202b', wall: '#292f3d', floor: '#56402f', accent: '#FFD23F' },
      { name: 'NNE Foyer & Lighting', sky: '#222632', wall: '#32394a', floor: '#604834', accent: '#06D6A0' }
    ];

    scanSlots.forEach((slot, idx) => {
      const theme = roomThemes[idx % roomThemes.length];
      wctx.fillStyle = theme.sky;
      wctx.fillRect(0, 0, work.width, work.height * 0.35);

      wctx.fillStyle = theme.wall;
      wctx.fillRect(0, work.height * 0.35, work.width, work.height * 0.35);

      wctx.fillStyle = theme.floor;
      wctx.fillRect(0, work.height * 0.7, work.width, work.height * 0.3);

      // Architectural pillar & window perspective lines
      wctx.strokeStyle = 'rgba(255,255,255,0.18)';
      wctx.lineWidth = 4;
      wctx.beginPath();
      wctx.moveTo(work.width * 0.15, 0); wctx.lineTo(work.width * 0.25, work.height);
      wctx.moveTo(work.width * 0.85, 0); wctx.lineTo(work.width * 0.75, work.height);
      wctx.moveTo(0, work.height * 0.35); wctx.lineTo(work.width, work.height * 0.35);
      wctx.moveTo(0, work.height * 0.7); wctx.lineTo(work.width, work.height * 0.7);
      wctx.stroke();

      // Feature glowing badge
      wctx.fillStyle = theme.accent;
      wctx.beginPath();
      wctx.arc(work.width * 0.5, work.height * 0.5, 45, 0, Math.PI * 2);
      wctx.fill();

      wctx.fillStyle = '#14121A';
      wctx.font = 'bold 20px sans-serif';
      wctx.textAlign = 'center';
      wctx.fillText(`${Math.round(slot.yaw)}°`, work.width * 0.5, work.height * 0.5 + 7);

      wctx.fillStyle = 'rgba(255,255,255,0.92)';
      wctx.font = 'bold 22px sans-serif';
      wctx.fillText(theme.name, work.width * 0.5, work.height * 0.25);

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = work.width;
      sliceCanvas.height = work.height;
      sliceCanvas.getContext('2d').drawImage(work, 0, 0);

      slot.captured = true;
      slot.imgCanvas = sliceCanvas;
      slot.timestamp = Date.now();
      slot.captureYaw = slot.yaw;
      slot.capturePitch = slot.pitch;
    });

    scanCurrentYaw = 360;
    scanSmoothYaw = 360;
    updateStitchPreviewRibbon();
    renderScanSlotsRibbon();
    updateScanProgressBar();

    if (typeof showToast === 'function') {
      showToast('🧪 Demo 360° Scan ready! Tap "STITCH & SAVE 360°" to stitch room.');
    }
  };

  window.close360CameraScanner = function () {
    const modal = document.getElementById('tourCameraScanModal');
    if (modal) modal.style.display = 'none';

    scanIsSweeping = false;
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
   * Matterport-Grade Equirectangular Photosphere Stitching Engine
   * Mathematically re-projects rectilinear camera sensor frames onto a seamless 2:1 equirectangular sphere
   */
  window.finishAndUse360Stitch = async function () {
    var shots = [];
    for (var si = 0; si < scanSlots.length; si++) {
      if (scanSlots[si].captured && scanSlots[si].imgCanvas) shots.push(scanSlots[si]);
    }
    if (shots.length < 3) {
      if (typeof showToast === 'function') {
        showToast('⚠️ Please capture at least 3 angles or tap "DEMO SCAN" to test.');
      }
      return;
    }

    var finishBtn = document.getElementById('scanFinishUseBtn');
    if (finishBtn) {
      finishBtn.textContent = '⏳ STITCHING 360° PHOTOSPHERE…';
      finishBtn.disabled = true;
    }
    await new Promise(function (r) { requestAnimationFrame(() => requestAnimationFrame(r)); });

    try {
      var W = 2048;
      var H = 1024;
      var canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      var ctx = canvas.getContext('2d');

      // Separate clean Float32 accumulators (zero color bleed)
      var accumR = new Float32Array(W * H);
      var accumG = new Float32Array(W * H);
      var accumB = new Float32Array(W * H);
      var accumWeight = new Float32Array(W * H);

      // 1. Compute ambient ceiling and floor colors from frame edges
      var topR = 35, topG = 38, topB = 48;
      var botR = 48, botG = 38, botB = 30;
      try {
        var topTotR = 0, topTotG = 0, topTotB = 0, topN = 0;
        var botTotR = 0, botTotG = 0, botTotB = 0, botN = 0;

        shots.forEach(s => {
          if (s.imgCanvas) {
            var sc = s.imgCanvas.getContext('2d').getImageData(0, 0, s.imgCanvas.width, s.imgCanvas.height).data;
            var w = s.imgCanvas.width;
            var h = s.imgCanvas.height;
            var topRows = Math.min(20, Math.floor(h * 0.1));
            var botRows = Math.min(20, Math.floor(h * 0.1));

            for (var ty = 0; ty < topRows; ty++) {
              for (var tx = 0; tx < w; tx += 8) {
                var p = (ty * w + tx) * 4;
                topTotR += sc[p]; topTotG += sc[p + 1]; topTotB += sc[p + 2];
                topN++;
              }
            }
            for (var by = h - botRows; by < h; by++) {
              for (var bx = 0; bx < w; bx += 8) {
                var p2 = (by * w + bx) * 4;
                botTotR += sc[p2]; botTotG += sc[p2 + 1]; botTotB += sc[p2 + 2];
                botN++;
              }
            }
          }
        });

        if (topN > 0) {
          topR = Math.round(topTotR / topN);
          topG = Math.round(topTotG / topN);
          topB = Math.round(topTotB / topN);
        }
        if (botN > 0) {
          botR = Math.round(botTotR / botN);
          botG = Math.round(botTotG / botN);
          botB = Math.round(botTotB / botN);
        }
      } catch (e) {}

      // 2. Project each rectilinear frame into the equirectangular sphere
      for (var fi = 0; fi < shots.length; fi++) {
        if (finishBtn) finishBtn.textContent = `⏳ BLENDING FRAME ${fi + 1}/${shots.length}…`;
        await new Promise(r => setTimeout(r, 0));

        var slot = shots[fi];
        var src = slot.imgCanvas;
        if (!src || src.width < 2) continue;

        var ww = src.width;
        var wh = src.height;
        var maxDim = 1024;
        var work = src;
        if (ww > maxDim || wh > maxDim) {
          var scale = maxDim / Math.max(ww, wh);
          ww = Math.round(ww * scale);
          wh = Math.round(wh * scale);
          work = document.createElement('canvas');
          work.width = ww;
          work.height = wh;
          work.getContext('2d').drawImage(src, 0, 0, ww, wh);
        }
        var srcPx = work.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, ww, wh).data;

        // Optical FOV calculation based on frame aspect ratio
        var aspect = ww / wh;
        var diagFovRad = (76 * Math.PI) / 180;
        var tanHalfDiag = Math.tan(diagFovRad * 0.5);
        var tanHalfH = tanHalfDiag * (aspect / Math.sqrt(aspect * aspect + 1));
        var tanHalfV = tanHalfDiag * (1 / Math.sqrt(aspect * aspect + 1));
        var fovHDeg = 2 * Math.atan(tanHalfH) * (180 / Math.PI);
        var fovVDeg = 2 * Math.atan(tanHalfV) * (180 / Math.PI);

        var yawDeg = normalizeAngle360((typeof slot.captureYaw === 'number') ? slot.captureYaw : slot.yaw);
        var pitchDeg = (typeof slot.capturePitch === 'number') ? slot.capturePitch : slot.pitch;

        // Bounding box in equirectangular coordinates
        var padH = fovHDeg * 0.55 + 5;
        var padV = fovVDeg * 0.55 + 5;
        var minLat = Math.max(-88, pitchDeg - padV);
        var maxLat = Math.min(88, pitchDeg + padV);
        var row0 = Math.max(0, Math.floor(((90 - maxLat) / 180) * H));
        var row1 = Math.min(H - 1, Math.ceil(((90 - minLat) / 180) * H));

        var lonRanges = [];
        var lonA = yawDeg - padH;
        var lonB = yawDeg + padH;
        if (lonA < 0) {
          lonRanges.push([lonA + 360, 360]);
          lonRanges.push([0, lonB]);
        } else if (lonB > 360) {
          lonRanges.push([lonA, 360]);
          lonRanges.push([0, lonB - 360]);
        } else {
          lonRanges.push([lonA, lonB]);
        }

        for (var row = row0; row <= row1; row++) {
          var lat = 90 - (row / H) * 180;
          var dPitchRad = ((lat - pitchDeg) * Math.PI) / 180;

          for (var ri = 0; ri < lonRanges.length; ri++) {
            var c0 = Math.max(0, Math.floor((lonRanges[ri][0] / 360) * W));
            var c1 = Math.min(W - 1, Math.ceil((lonRanges[ri][1] / 360) * W));

            for (var col = c0; col <= c1; col++) {
              var lon = (col / W) * 360;
              var dYaw = lon - yawDeg;
              if (dYaw > 180) dYaw -= 360;
              if (dYaw < -180) dYaw += 360;
              var dYawRad = (dYaw * Math.PI) / 180;

              // Unit ray in camera space
              var rX = Math.cos(dPitchRad) * Math.sin(dYawRad);
              var rY = Math.sin(dPitchRad);
              var rZ = Math.cos(dPitchRad) * Math.cos(dYawRad);
              if (rZ <= 0.05) continue;

              // Project onto flat camera sensor plane
              var uCam = (rX / rZ) / tanHalfH;
              var vCam = (rY / rZ) / tanHalfV;
              if (Math.abs(uCam) >= 1.0 || Math.abs(vCam) >= 1.0) continue;

              var fx = (uCam * 0.5 + 0.5) * (ww - 1);
              var fy = (0.5 - vCam * 0.5) * (wh - 1);
              if (fx < 0 || fy < 0 || fx >= ww - 1 || fy >= wh - 1) continue;

              // Bilinear interpolation
              var x0 = fx | 0;
              var y0 = fy | 0;
              var tx = fx - x0;
              var ty = fy - y0;
              var x1 = x0 + 1;
              var y1 = y0 + 1;
              var i00 = (y0 * ww + x0) * 4;
              var i10 = (y0 * ww + x1) * 4;
              var i01 = (y1 * ww + x0) * 4;
              var i11 = (y1 * ww + x1) * 4;

              var r = (srcPx[i00] * (1 - tx) + srcPx[i10] * tx) * (1 - ty) + (srcPx[i01] * (1 - tx) + srcPx[i11] * tx) * ty;
              var g = (srcPx[i00 + 1] * (1 - tx) + srcPx[i10 + 1] * tx) * (1 - ty) + (srcPx[i01 + 1] * (1 - tx) + srcPx[i11 + 1] * tx) * ty;
              var b = (srcPx[i00 + 2] * (1 - tx) + srcPx[i10 + 2] * tx) * (1 - ty) + (srcPx[i01 + 2] * (1 - tx) + srcPx[i11 + 2] * tx) * ty;

              // Smooth cosine-squared feathering
              var wu = Math.cos(Math.PI * 0.5 * uCam);
              var wv = Math.cos(Math.PI * 0.5 * vCam);
              var wt = (wu * wu) * (wv * wv);
              if (wt < 0.005) continue;

              var pIdx = row * W + col;
              accumR[pIdx] += r * wt;
              accumG[pIdx] += g * wt;
              accumB[pIdx] += b * wt;
              accumWeight[pIdx] += wt;
            }
          }
        }
      }

      // 3. Composite final image with smooth harmonic zenith/nadir fill
      var outImg = ctx.createImageData(W, H);
      var outData = outImg.data;

      var midR = Math.round((topR + botR) * 0.5);
      var midG = Math.round((topG + botG) * 0.5);
      var midB = Math.round((topB + botB) * 0.5);

      for (var y = 0; y < H; y++) {
        var vNorm = y / (H - 1);
        var bgR, bgG, bgB;
        if (vNorm < 0.5) {
          var tTop = vNorm / 0.5;
          bgR = topR * (1 - tTop) + midR * tTop;
          bgG = topG * (1 - tTop) + midG * tTop;
          bgB = topB * (1 - tTop) + midB * tTop;
        } else {
          var tBot = (vNorm - 0.5) / 0.5;
          bgR = midR * (1 - tBot) + botR * tBot;
          bgG = midG * (1 - tBot) + botG * tBot;
          bgB = midB * (1 - tBot) + botB * tBot;
        }

        for (var x = 0; x < W; x++) {
          var pIdx2 = y * W + x;
          var di = pIdx2 * 4;
          var w = accumWeight[pIdx2];

          if (w > 0.001) {
            var cr = accumR[pIdx2] / w;
            var cg = accumG[pIdx2] / w;
            var cb = accumB[pIdx2] / w;

            if (w < 0.6) {
              var blendT = w / 0.6;
              outData[di]     = Math.round(cr * blendT + bgR * (1 - blendT));
              outData[di + 1] = Math.round(cg * blendT + bgG * (1 - blendT));
              outData[di + 2] = Math.round(cb * blendT + bgB * (1 - blendT));
            } else {
              outData[di]     = Math.min(255, Math.round(cr));
              outData[di + 1] = Math.min(255, Math.round(cg));
              outData[di + 2] = Math.min(255, Math.round(cb));
            }
          } else {
            outData[di]     = Math.min(255, Math.round(bgR));
            outData[di + 1] = Math.min(255, Math.round(bgG));
            outData[di + 2] = Math.min(255, Math.round(bgB));
          }
          outData[di + 3] = 255;
        }
      }

      ctx.putImageData(outImg, 0, 0);

      if (finishBtn) finishBtn.textContent = '⏳ SAVING 360° ROOM…';
      await new Promise(r => setTimeout(r, 0));

      var dataUrl = canvas.toDataURL('image/jpeg', 0.94);
      var finalUrl = dataUrl;

      if (typeof window.uploadToSupabaseStorage === 'function') {
        try {
          var blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.94));
          var file = new File([blob], `matterport_360_${Date.now()}.jpg`, { type: 'image/jpeg' });
          var up = await window.uploadToSupabaseStorage(file);
          if (up && up.url) finalUrl = up.url;
        } catch (e) {}
      }

      if (scanMode === 'replace_room') {
        var cur = activeSceneList[activeSceneIndex];
        if (cur) {
          cur.panoUrl = finalUrl;
          cur.tourUrl = '';
          cur.aspectMode = 'full-360';
          cur.tag = '360° Matterport Photosphere';
        }
      } else {
        activeSceneList.push({
          id: 'scan-room-' + Date.now().toString(36),
          name: '📸 360° Room ' + (activeSceneList.length + 1),
          location: (currentTourData && currentTourData.location) || 'Salt Lake City, UT',
          tag: '360° Matterport Photosphere',
          panoUrl: finalUrl,
          tourUrl: '',
          aspectMode: 'full-360',
          vScale: 1.0,
          blurb: '360° walkthrough room captured in real-time',
          hotspots: [{
            pitch: 0, yaw: 180, label: '🚪 Back to Previous Room',
            targetScene: (activeSceneList[activeSceneIndex] && activeSceneList[activeSceneIndex].id) ||
              (activeSceneList[0] && activeSceneList[0].id)
          }]
        });
        activeSceneIndex = activeSceneList.length - 1;
      }

      window.close360CameraScanner();
      if (typeof window.saveTourChangesToMagazine === 'function') window.saveTourChangesToMagazine();
      renderSceneSelector();
      loadScene(activeSceneIndex);
      if (typeof showToast === 'function') showToast('🎉 360° Photosphere stitched and saved!');
    } catch (err) {
      console.error('[stitch]', err);
      if (typeof showToast === 'function') showToast('❌ Stitch failed: ' + (err && err.message ? err.message : String(err)));
    } finally {
      if (finishBtn) {
        finishBtn.textContent = '✨ STITCH & SAVE 360°';
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
      const propPopover = document.getElementById('tourProportionsPopover');
      if (editBtn) editBtn.style.display = unlocked ? 'inline-flex' : 'none';
      if (editorBar && !unlocked) {
        editorBar.classList.remove('active');
        isEditorMode = false;
      }
      if (propPopover && !unlocked) {
        propPopover.style.display = 'none';
      }
    }
  };

  // Keep tour builder button + bar in sync with magazine editor unlock state
  window.__spotlightRefreshEditorVisibility = function () {
    const unlocked = !!(window.isEditorUnlocked || (typeof isEditorUnlocked !== 'undefined' && isEditorUnlocked));
    const editBtn = document.getElementById('tourEditModeBtn');
    const editorBar = document.getElementById('tourEditorBar');
    const propPopover = document.getElementById('tourProportionsPopover');
    if (editBtn) editBtn.style.display = unlocked ? 'inline-flex' : 'none';
    if (!unlocked) {
      isEditorMode = false;
      if (editBtn) editBtn.classList.remove('active');
      if (editorBar) editorBar.classList.remove('active');
      if (propPopover) propPopover.style.display = 'none';
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
