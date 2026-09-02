/**
 * SpotLIGHT 360 — Hotspot door navigation + Matterport-style room transitions
 * Loaded after tour-3d.js. Does not modify the existing viewer engine.
 */
(function () {
  'use strict';

  let tourSceneTransitionActive = false;
  let tourSceneTransitionEl = null;

  function getActiveSceneList() {
    // Prefer the live list used by the tour engine when available.
    try {
      if (typeof window.__spotlightGetActiveSceneList === 'function') {
        return window.__spotlightGetActiveSceneList() || [];
      }
    } catch (e) {}
    return null;
  }

  function ensureTourSceneTransition() {
    const container = document.getElementById('tourViewportContainer');
    if (!container) return null;

    if (!tourSceneTransitionEl || !tourSceneTransitionEl.isConnected) {
      tourSceneTransitionEl = document.createElement('div');
      tourSceneTransitionEl.id = 'tourSceneTravelTransition';
      tourSceneTransitionEl.setAttribute('aria-hidden', 'true');
      tourSceneTransitionEl.style.cssText = [
        'position:absolute',
        'inset:0',
        'z-index:19',
        'pointer-events:none',
        'opacity:0',
        'background:radial-gradient(circle at 50% 52%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.32) 58%, rgba(0,0,0,0.72) 100%)',
        'backdrop-filter:blur(0px)',
        '-webkit-backdrop-filter:blur(0px)',
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
      hotspotLayer.style.opacity = entering
        ? String(Math.max(0, 1 - p * 1.15))
        : String(Math.min(1, p * 1.15));
      hotspotLayer.style.transform = 'scale(' + zoom.toFixed(4) + ')';
      hotspotLayer.style.transformOrigin = '50% 50%';
    }
  }

  function resetTourTravelVisual() {
    const canvas = document.getElementById('tour3dCanvas');
    const hotspotLayer = document.getElementById('tourHotspotsLayer');
    if (canvas) {
      canvas.style.transform = 'scale(1)';
      canvas.style.filter = 'blur(0px)';
    }
    if (hotspotLayer) {
      hotspotLayer.style.opacity = '1';
      hotspotLayer.style.transform = 'scale(1)';
    }
  }

  /**
   * Public API used by door hotspot pins in tour-3d.js:
   *   pin.onclick -> window.switchTourScene(hs.targetScene)
   */
  window.switchTourScene = function (targetSceneId) {
    if (tourSceneTransitionActive) return;

    // Prefer native engine path if it was already patched in.
    if (typeof window.__spotlightNativeSwitchTourScene === 'function') {
      return window.__spotlightNativeSwitchTourScene(targetSceneId);
    }

    // Fall back through switchTourSceneIndex when the scene list is reachable.
    const list = (typeof window.activeSceneList !== 'undefined' && Array.isArray(window.activeSceneList))
      ? window.activeSceneList
      : null;

    // tour-3d.js keeps activeSceneList private. Use the public index API +
    // scene pills / a lightweight DOM probe when needed.
    let targetIndex = -1;

    // 1) Try scanning scene selector pills (they encode indices)
    const pills = document.querySelectorAll('#tourSceneSelector .tour-scene-pill[onclick]');
    if (pills && pills.length) {
      // Match by data if available, otherwise call switchTourSceneIndex for known targets via load path.
    }

    // Use the engine's own switchTourSceneIndex by resolving id via a temporary bridge:
    // Dispatch through open3dTourModal state is complex; instead call the existing
    // index switcher after finding the index from the hotspot's known target ids
    // stored on pins.
    const pins = document.querySelectorAll('.tour-hotspot-pin');
    // The cleanest reliable path: reuse switchTourSceneIndex after looking up
    // target in the scene selector labels is fragile. Instead, call load path:

    // Bridge: tour-3d.js exposes switchTourSceneIndex. We need id -> index.
    // Store mapping from last known hotspots in data attributes when pins are created.
    // As a robust fallback, iterate scene pills and match targetSceneId against
    // a global registry we maintain when pins are clicked from labels.

    if (!window.__spotlightSceneIdToIndex) {
      window.__spotlightSceneIdToIndex = {};
    }

    if (Object.keys(window.__spotlightSceneIdToIndex).length === 0) {
      // Infer from scene selector button order if only one tour is loaded.
      const sceneBtns = document.querySelectorAll('#tourSceneSelector .tour-scene-pill');
      sceneBtns.forEach(function (btn, i) {
        const onclick = btn.getAttribute('onclick') || '';
        const m = onclick.match(/switchTourSceneIndex\((\d+)\)/);
        if (m) {
          // We don't have ids on pills; keep index mapping only.
        }
      });
    }

    if (typeof window.__spotlightResolveSceneIndex === 'function') {
      targetIndex = window.__spotlightResolveSceneIndex(targetSceneId);
    } else if (window.__spotlightSceneIdToIndex[targetSceneId] !== undefined) {
      targetIndex = window.__spotlightSceneIdToIndex[targetSceneId];
    }

    // Ultimate reliable path: patch into tour-3d's private scope is not possible.
    // So we call switchTourSceneIndex if we can resolve, otherwise scan all
    // hotspot pins' stored target and use the engine index API via a custom event.

    function runTransitionThen(go) {
      const overlay = ensureTourSceneTransition();
      if (!overlay) {
        go();
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
        go();
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

    // Prefer index resolution via registry built from pin clicks / editor data.
    if (targetIndex >= 0 && typeof window.switchTourSceneIndex === 'function') {
      runTransitionThen(function () {
        // Avoid recursion if switchTourSceneIndex was rewired to call switchTourScene
        const native = window.__spotlightNativeSwitchTourSceneIndex || window.switchTourSceneIndex;
        // Call load directly path: original switchTourSceneIndex just called loadScene(idx)
        // Our override of switchTourSceneIndex below handles index without looping.
        window.__spotlightForceSceneIndex = targetIndex;
        if (typeof window.__spotlightLoadSceneByIndex === 'function') {
          window.__spotlightLoadSceneByIndex(targetIndex);
        } else if (typeof window.switchTourSceneIndex === 'function') {
          // Temporarily use raw index path
          const prev = window.switchTourSceneIndex;
          // The original engine function is still the one that calls loadScene -
          // we wrap it carefully below.
          window.__spotlightDirectIndexSwitch(targetIndex);
        }
      });
      return;
    }

    // Last resort: ask the original index switcher for each possible index is not viable.
    // Use DOM: click the matching scene pill if the target room name is known from the pin label.
    console.warn('[SpotLIGHT 360] Hotspot target room not resolved yet:', targetSceneId);

    // Still attempt transition + generic index 0 fallback only if single-room — skip.
    if (typeof showToast === 'function') {
      showToast('⚠️ Connecting door…');
    }

    // Bridge through a custom event that tour-3d can listen to if present,
    // and also try direct index from data-target-scene on pins.
    const pin = document.querySelector('.tour-hotspot-pin[data-target-scene="' + CSS.escape(String(targetSceneId)) + '"]');
    if (pin && pin.dataset.sceneIndex !== undefined) {
      const idx = parseInt(pin.dataset.sceneIndex, 10);
      if (!isNaN(idx)) {
        runTransitionThen(function () {
          window.__spotlightDirectIndexSwitch(idx);
        });
        return;
      }
    }

    // Fire event for any listeners; and try switchTourSceneIndex with a search.
    document.dispatchEvent(new CustomEvent('spotlight:switchTourScene', { detail: { targetSceneId: targetSceneId } }));
  };

  // Direct index switch that calls the original loadScene path without recursion.
  window.__spotlightDirectIndexSwitch = function (idx) {
    if (typeof window.__spotlightNativeSwitchTourSceneIndex === 'function') {
      window.__spotlightNativeSwitchTourSceneIndex(idx);
      return;
    }
    // Fall through to current switchTourSceneIndex if it is still the original
    // (original only does loadScene(idx) and does not call switchTourScene).
    if (typeof window.switchTourSceneIndex === 'function') {
      // Guard against our own wrapper
      window.__spotlightBypassTransition = true;
      try {
        window.switchTourSceneIndex(idx);
      } finally {
        window.__spotlightBypassTransition = false;
      }
    }
  };

  // Wrap switchTourSceneIndex so bottom scene pills also get the smooth transition.
  function wrapIndexSwitcher() {
    if (typeof window.switchTourSceneIndex !== 'function') return;
    if (window.switchTourSceneIndex.__spotlightWrapped) return;

    const original = window.switchTourSceneIndex;
    window.__spotlightNativeSwitchTourSceneIndex = original;

    window.switchTourSceneIndex = function (idx) {
      if (window.__spotlightBypassTransition) {
        return original(idx);
      }
      if (tourSceneTransitionActive) return;

      const overlay = ensureTourSceneTransition();
      if (!overlay) {
        return original(idx);
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
        original(idx);
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
    };
    window.switchTourSceneIndex.__spotlightWrapped = true;
  }

  // Build id->index map whenever hotspots are present by reading pin click handlers
  // is hard; instead intercept the first failed path by monkey-patching after load.
  // The real fix: enhance pins at runtime with data-target-scene from their onclick closure.
  // Since pins call window.switchTourScene(hs.targetScene) with the id string, we need
  // the engine's activeSceneList. Expose a resolver by patching load path after open.

  // Observe open3dTourModal to re-wrap after modal injects.
  const originalOpen = window.open3dTourModal;
  if (typeof originalOpen === 'function' && !originalOpen.__spotlightWrapped) {
    window.open3dTourModal = function (options) {
      const result = originalOpen.apply(this, arguments);
      setTimeout(function () {
        wrapIndexSwitcher();
        // After scenes load, harvest scene ids from the selector + hotspot labels is limited.
        // Patch hotspot pins: they already call switchTourScene(id). We need id->index.
        // Use MutationObserver on hotspots layer isn't enough without the id list.
        //
        // Critical bridge: redefine switchTourScene to use a search over
        // switchTourSceneIndex by probing — actually the original engine stores
        // scenes privately. The ONLY missing piece in tour-3d.js is the function
        // itself which has access to activeSceneList.
        //
        // So this override file alone cannot resolve id->index unless we also
        // patch tour-3d.js. Keep wrap for index path; for id path, try common
        // demo ids and scene order from pills count.
      }, 50);
      return result;
    };
    window.open3dTourModal.__spotlightWrapped = true;
  }

  // When tour-3d is already loaded, wrap now.
  wrapIndexSwitcher();

  // Strong path: if tour-3d's switchTourScene was never defined, our definition above
  // is used. For id resolution, also try matching against default SLC scene ids.
  const DEFAULT_ID_INDEX = {
    'slc-entrance': 0,
    'slc-studio': 1,
    'slc-lounge': 2,
    'slc-patio': 3
  };

  const baseSwitch = window.switchTourScene;
  window.switchTourScene = function (targetSceneId) {
    if (tourSceneTransitionActive) return;

    // Resolve index
    let idx = DEFAULT_ID_INDEX[targetSceneId];
    if (idx === undefined && window.__spotlightSceneIdToIndex) {
      idx = window.__spotlightSceneIdToIndex[targetSceneId];
    }

    // Also allow numeric string ids
    if (idx === undefined && /^\d+$/.test(String(targetSceneId))) {
      idx = parseInt(targetSceneId, 10);
    }

    // Custom scene ids like scene-xxxx: scan pills length and try event
    if (idx === undefined) {
      // Attempt to find via scene selector by data attributes if any
      const allPills = document.querySelectorAll('#tourSceneSelector [onclick*="switchTourSceneIndex"]');
      // Without id map, dispatch and also try sequential — better: use eval-free
      // access by calling original load through index from hotspot dataset.
      document.dispatchEvent(new CustomEvent('spotlight:switchTourScene', { detail: { targetSceneId: targetSceneId } }));
    }

    if (idx === undefined || idx === null || isNaN(idx)) {
      // Try registry built during pin sync if editor set it
      console.warn('[SpotLIGHT 360] Hotspot target room not found:', targetSceneId);
      if (typeof showToast === 'function') {
        showToast('⚠️ This door is not connected to a room yet.');
      }
      return;
    }

    // Smooth transition then index switch
    if (window.__spotlightBypassTransition) {
      if (typeof window.__spotlightNativeSwitchTourSceneIndex === 'function') {
        window.__spotlightNativeSwitchTourSceneIndex(idx);
      } else if (typeof window.switchTourSceneIndex === 'function') {
        window.switchTourSceneIndex(idx);
      }
      return;
    }

    const overlay = ensureTourSceneTransition();
    if (!overlay) {
      if (typeof window.__spotlightNativeSwitchTourSceneIndex === 'function') {
        window.__spotlightNativeSwitchTourSceneIndex(idx);
      } else if (typeof window.switchTourSceneIndex === 'function') {
        window.__spotlightBypassTransition = true;
        try { window.switchTourSceneIndex(idx); } finally { window.__spotlightBypassTransition = false; }
      }
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
  };

  // Register scene ids when possible from the default tour + any window-exposed list
  window.__spotlightRegisterScenes = function (scenes) {
    if (!Array.isArray(scenes)) return;
    window.__spotlightSceneIdToIndex = window.__spotlightSceneIdToIndex || {};
    scenes.forEach(function (sc, i) {
      if (sc && sc.id) window.__spotlightSceneIdToIndex[sc.id] = i;
    });
  };

  // Default SLC walk scenes (matches tour-3d.js defaults)
  window.__spotlightRegisterScenes([
    { id: 'slc-entrance' },
    { id: 'slc-studio' },
    { id: 'slc-lounge' },
    { id: 'slc-patio' }
  ]);
})();
