/**
 * SpotLIGHT 360 — Door hotspot navigation + Matterport-style room transitions
 * Loaded after tour-3d.js. Does not change the existing viewer/camera/hotspot engine.
 */
(function () {
  'use strict';

  let tourSceneTransitionActive = false;
  let tourSceneTransitionEl = null;

  function ensureTourSceneTransition() {
    const container = document.getElementById('tourViewportContainer');
    if (!container) return null;
    if (!tourSceneTransitionEl || !tourSceneTransitionEl.isConnected) {
      tourSceneTransitionEl = document.createElement('div');
      tourSceneTransitionEl.id = 'tourSceneTravelTransition';
      tourSceneTransitionEl.setAttribute('aria-hidden', 'true');
      tourSceneTransitionEl.style.cssText = [
        'position:absolute', 'inset:0', 'z-index:19', 'pointer-events:none', 'opacity:0',
        'background:radial-gradient(circle at 50% 52%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.32) 58%, rgba(0,0,0,0.72) 100%)',
        'backdrop-filter:blur(0px)', '-webkit-backdrop-filter:blur(0px)',
        'transition:opacity 220ms cubic-bezier(.22,.61,.36,1), backdrop-filter 220ms ease, -webkit-backdrop-filter 220ms ease',
        'will-change:opacity,backdrop-filter'
      ].join(';');
      container.appendChild(tourSceneTransitionEl);
    }
    return tourSceneTransitionEl;
  }

  function setTourTravelVisual(progress, entering) {
    const canvas = document.getElementById('tour3dCanvas');
    const hotspotLayer = document.getElementById('tourHotspotsLayer');
    const p = Math.max(0, Math.min(1, progress));
    const zoom = entering ? (1 + p * 0.028) : (1.028 - p * 0.028);
    const blur = entering ? p * 1.15 : (1 - p) * 1.15;
    if (canvas) {
      canvas.style.transition = 'transform 220ms cubic-bezier(.22,.61,.36,1), filter 220ms ease';
      canvas.style.transformOrigin = '50% 50%';
      canvas.style.transform = 'scale(' + zoom.toFixed(4) + ')';
      canvas.style.filter = 'blur(' + blur.toFixed(2) + 'px)';
    }
    if (hotspotLayer) {
      hotspotLayer.style.transition = 'opacity 160ms ease, transform 220ms ease';
      hotspotLayer.style.opacity = entering ? String(Math.max(0, 1 - p * 1.15)) : String(Math.min(1, p * 1.15));
      hotspotLayer.style.transform = 'scale(' + zoom.toFixed(4) + ')';
      hotspotLayer.style.transformOrigin = '50% 50%';
    }
  }

  function resetTourTravelVisual() {
    const canvas = document.getElementById('tour3dCanvas');
    const hotspotLayer = document.getElementById('tourHotspotsLayer');
    if (canvas) { canvas.style.transform = 'scale(1)'; canvas.style.filter = 'blur(0px)'; }
    if (hotspotLayer) { hotspotLayer.style.opacity = '1'; hotspotLayer.style.transform = 'scale(1)'; }
  }

  function collectSceneLists() {
    const lists = [];
    lists.push([
      { id: 'slc-entrance' }, { id: 'slc-studio' }, { id: 'slc-lounge' }, { id: 'slc-patio' }
    ]);
    try {
      const latest = localStorage.getItem('spotlight_latest_tour');
      if (latest) {
        const parsed = JSON.parse(latest);
        if (parsed && Array.isArray(parsed.scenes)) lists.push(parsed.scenes);
      }
    } catch (e) {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf('spotlight_tour_') === 0) {
          const parsed = JSON.parse(localStorage.getItem(k));
          if (parsed && Array.isArray(parsed.scenes)) lists.push(parsed.scenes);
        }
      }
    } catch (e) {}
    try {
      if (window.MAGAZINE && Array.isArray(window.MAGAZINE.cities)) {
        window.MAGAZINE.cities.forEach(function (city) {
          (city.ads || []).forEach(function (ad) {
            if (ad.tourConfig && Array.isArray(ad.tourConfig.scenes)) lists.push(ad.tourConfig.scenes);
            if (typeof ad.tour3d === 'string' && ad.tour3d.charAt(0) === '{') {
              try {
                const p = JSON.parse(ad.tour3d);
                if (p && Array.isArray(p.scenes)) lists.push(p.scenes);
              } catch (e) {}
            }
          });
        });
      }
    } catch (e) {}
    if (window.__spotlightSceneRegistry && Array.isArray(window.__spotlightSceneRegistry)) {
      lists.push(window.__spotlightSceneRegistry);
    }
    return lists;
  }

  function resolveSceneIndex(targetSceneId) {
    if (targetSceneId == null) return -1;
    const id = String(targetSceneId);
    if (/^\d+$/.test(id)) return parseInt(id, 10);
    const lists = collectSceneLists();
    for (let li = 0; li < lists.length; li++) {
      const scenes = lists[li];
      for (let i = 0; i < scenes.length; i++) {
        if (scenes[i] && scenes[i].id === id) return i;
      }
    }
    if (window.__spotlightLastScenes) {
      for (let i = 0; i < window.__spotlightLastScenes.length; i++) {
        if (window.__spotlightLastScenes[i] && window.__spotlightLastScenes[i].id === id) return i;
      }
    }
    return -1;
  }

  function callNativeIndexSwitch(idx) {
    window.__spotlightBypassTransition = true;
    try {
      if (typeof window.__spotlightNativeSwitchTourSceneIndex === 'function') {
        window.__spotlightNativeSwitchTourSceneIndex(idx);
      } else if (typeof window.switchTourSceneIndex === 'function') {
        window.switchTourSceneIndex(idx);
      }
    } finally {
      window.__spotlightBypassTransition = false;
    }
  }

  function runMatterportTransition(thenFn) {
    const overlay = ensureTourSceneTransition();
    if (!overlay) {
      thenFn();
      return;
    }
    tourSceneTransitionActive = true;
    setTourTravelVisual(0, true);
    requestAnimationFrame(function () {
      overlay.style.opacity = '1';
      overlay.style.backdropFilter = 'blur(2px)';
      overlay.style.webkitBackdropFilter = 'blur(2px)';
      setTourTravelVisual(1, true);
    });
    setTimeout(function () {
      thenFn();
      setTimeout(function () {
        overlay.style.opacity = '0';
        overlay.style.backdropFilter = 'blur(0px)';
        overlay.style.webkitBackdropFilter = 'blur(0px)';
        setTourTravelVisual(1, false);
        setTimeout(function () {
          resetTourTravelVisual();
          tourSceneTransitionActive = false;
        }, 260);
      }, 220);
    }, 230);
  }

  // Public API used by door hotspot pins in tour-3d.js
  window.switchTourScene = function (targetSceneId) {
    if (tourSceneTransitionActive) return;
    if (window.__spotlightEngineHasNativeSwitch) return;

    const idx = resolveSceneIndex(targetSceneId);
    if (idx < 0) {
      console.warn('[SpotLIGHT 360] Hotspot target room not found:', targetSceneId);
      if (typeof showToast === 'function') showToast('⚠️ This door is not connected to a room yet.');
      return;
    }

    runMatterportTransition(function () {
      callNativeIndexSwitch(idx);
    });
  };

  function wrapIndexSwitcher() {
    if (typeof window.switchTourSceneIndex !== 'function') return;
    if (window.switchTourSceneIndex.__spotlightWrapped) return;
    const original = window.switchTourSceneIndex;
    window.__spotlightNativeSwitchTourSceneIndex = original;
    window.switchTourSceneIndex = function (idx) {
      if (window.__spotlightBypassTransition) return original(idx);
      if (tourSceneTransitionActive) return;
      runMatterportTransition(function () {
        original(idx);
      });
    };
    window.switchTourSceneIndex.__spotlightWrapped = true;
  }

  const originalOpen = window.open3dTourModal;
  if (typeof originalOpen === 'function' && !originalOpen.__spotlightHotspotWrapped) {
    window.open3dTourModal = function (options) {
      try {
        if (options && Array.isArray(options.scenes)) {
          window.__spotlightLastScenes = options.scenes;
          window.__spotlightSceneRegistry = options.scenes;
        } else if (options && typeof options.tourUrl === 'string' && options.tourUrl.charAt(0) === '{') {
          const parsed = JSON.parse(options.tourUrl);
          if (parsed && Array.isArray(parsed.scenes)) {
            window.__spotlightLastScenes = parsed.scenes;
            window.__spotlightSceneRegistry = parsed.scenes;
          }
        }
      } catch (e) {}
      const result = originalOpen.apply(this, arguments);
      setTimeout(wrapIndexSwitcher, 30);
      setTimeout(wrapIndexSwitcher, 200);
      return result;
    };
    window.open3dTourModal.__spotlightHotspotWrapped = true;
  }

  wrapIndexSwitcher();
  setTimeout(wrapIndexSwitcher, 500);
  setTimeout(wrapIndexSwitcher, 1500);
})();
