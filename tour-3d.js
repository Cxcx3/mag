/**
 * SpotLIGHT tour-3d bootstrap — 3D item grab/pan/zoom/fullscreen
 */
(function () {
  'use strict';
  const GOOD_URL = 'https://raw.githubusercontent.com/Cxcx3/mag/953df2b907d3fcce9a871e3832bb4e0ad4e80d60/tour-3d.js';

  function applyFixes(src) {
    // Square container
    src = src.replace(
      'width:100%;height:270px;position:relative;background:radial-gradient(circle at 50% 50%, #1c182a 0%, #0a0812 100%);',
      'width:100%;aspect-ratio:1/1;min-height:280px;max-height:min(92vw, 520px);position:relative;background:radial-gradient(circle at 50% 50%, #1c182a 0%, #0a0812 100%);'
    );
    // Remove hint badge
    src = src.replace(
      /<div style="position:absolute;bottom:10px;left:12px;background:rgba\(0,0,0,0\.65\);backdrop-filter:blur\(6px\);color:#3FDDE0;font-size:10px;font-weight:800;padding:4px 10px;border-radius:20px;border:1px solid rgba\(63,221,224,0\.3\);display:flex;align-items:center;gap:5px;pointer-events:none;user-select:none;">\s*<span>🧊 Drag to rotate 3D · Scroll to zoom<\/span>\s*<\/div>\s*/m,
      ''
    );
    // Fullscreen button
    src = src.replace(
      'title="Reset 3D camera angle">⌖ Reset</button>',
      'title="Reset 3D camera angle">⌖ Reset</button>\n                  <button type="button" class="tour-dialog-btn" id="tour3dFullscreenBtn" onclick="window.toggle3dModalFullscreen(event)" style="padding:4px 9px;font-size:10px;background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.2);color:#fff;" title="Fullscreen 3D view">⛶ Full</button>'
    );
    // Viewer state + pan target
    src = src.replace(
      'isDragging: false,\n    prevMouse: { x: 0, y: 0 },\n    rotation: { x: 0.2, y: 0 },\n    distance: 4.5\n  };',
      "isDragging: false,\n    dragMode: 'orbit',\n    prevMouse: { x: 0, y: 0 },\n    rotation: { x: 0.2, y: 0 },\n    distance: 4.5,\n    target: { x: 0, y: 0.2, z: 0 }\n  };"
    );
    src = src.replace('const height = mountEl.clientHeight || 270;', 'const height = mountEl.clientHeight || width || 420;');

    // Grab cursor + pan mode on pointer down
    src = src.replace(
      "const dom = renderer.domElement;\n\n      const onPointerDown = (e) => {\n        active3dViewer.isDragging = true;\n        active3dViewer.autoRotate = false; // Pause auto rotate on manual touch\n        active3dViewer.prevMouse = {\n          x: e.clientX || (e.touches && e.touches[0]?.clientX) || 0,\n          y: e.clientY || (e.touches && e.touches[0]?.clientY) || 0\n        };\n      };",
      "const dom = renderer.domElement;\n      dom.style.cursor = 'grab';\n      dom.style.touchAction = 'none';\n      if (!active3dViewer.target) active3dViewer.target = { x: 0, y: 0.2, z: 0 };\n\n      const onPointerDown = (e) => {\n        active3dViewer.isDragging = true;\n        active3dViewer.autoRotate = false;\n        dom.style.cursor = 'grabbing';\n        const isTouch = !!(e.touches && e.touches.length);\n        active3dViewer.prevMouse = {\n          x: e.clientX || (e.touches && e.touches[0]?.clientX) || 0,\n          y: e.clientY || (e.touches && e.touches[0]?.clientY) || 0\n        };\n        active3dViewer.dragMode = (e.button === 2 || e.button === 1 || e.shiftKey) ? 'pan' : 'orbit';\n        if (e.cancelable && isTouch) e.preventDefault();\n      };"
    );

    // Orbit (inverted) + pan
    src = src.replace(
      "const onPointerMove = (e) => {\n        if (!active3dViewer.isDragging) return;\n        const curX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;\n        const curY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;\n        const deltaX = curX - active3dViewer.prevMouse.x;\n        const deltaY = curY - active3dViewer.prevMouse.y;\n\n        active3dViewer.rotation.y += deltaX * 0.012;\n        active3dViewer.rotation.x = Math.max(-1.1, Math.min(1.1, active3dViewer.rotation.x + deltaY * 0.012));\n\n        active3dViewer.prevMouse = { x: curX, y: curY };\n      };",
      "const onPointerMove = (e) => {\n        if (!active3dViewer.isDragging) return;\n        const curX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;\n        const curY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;\n        const deltaX = curX - active3dViewer.prevMouse.x;\n        const deltaY = curY - active3dViewer.prevMouse.y;\n        if (active3dViewer.dragMode === 'pan') {\n          const panScale = active3dViewer.distance * 0.0028;\n          const rotY = active3dViewer.rotation.y;\n          const tgt = active3dViewer.target || (active3dViewer.target = { x: 0, y: 0.2, z: 0 });\n          tgt.x -= Math.cos(rotY) * deltaX * panScale;\n          tgt.y += deltaY * panScale;\n          tgt.z -= -Math.sin(rotY) * deltaX * panScale;\n        } else {\n          active3dViewer.rotation.y -= deltaX * 0.012;\n          active3dViewer.rotation.x = Math.max(-1.25, Math.min(1.25, active3dViewer.rotation.x + deltaY * 0.012));\n        }\n        active3dViewer.prevMouse = { x: curX, y: curY };\n        if (e.cancelable && e.touches) e.preventDefault();\n      };"
    );

    src = src.replace(
      "const onPointerUp = () => {\n        active3dViewer.isDragging = false;\n      };",
      "const onPointerUp = () => {\n        active3dViewer.isDragging = false;\n        active3dViewer.dragMode = 'orbit';\n        if (active3dViewer.renderer && active3dViewer.renderer.domElement) active3dViewer.renderer.domElement.style.cursor = 'grab';\n      };"
    );

    // Closer zoom
    src = src.replace(
      "const delta = Math.sign(e.deltaY) * 0.35;\n        active3dViewer.distance = Math.max(1.8, Math.min(8.0, active3dViewer.distance + delta));",
      "const factor = e.deltaY > 0 ? 1.09 : 0.91;\n        active3dViewer.distance = Math.max(0.6, Math.min(10, active3dViewer.distance * factor));"
    );

    // Camera orbits around pan target
    src = src.replace(
      "cam.position.x = dist * Math.sin(rotY) * Math.cos(rotX);\n      cam.position.y = dist * Math.sin(rotX) + 0.4;\n      cam.position.z = dist * Math.cos(rotY) * Math.cos(rotX);\n      cam.lookAt(0, 0.2, 0);",
      "const tgt = active3dViewer.target || { x: 0, y: 0.2, z: 0 };\n      cam.position.x = tgt.x + dist * Math.sin(rotY) * Math.cos(rotX);\n      cam.position.y = tgt.y + dist * Math.sin(rotX);\n      cam.position.z = tgt.z + dist * Math.cos(rotY) * Math.cos(rotX);\n      cam.lookAt(tgt.x, tgt.y, tgt.z);"
    );

    // Reset clears target
    src = src.replace(
      "window.reset3dModalCamera = function () {\n    active3dViewer.rotation = { x: 0.2, y: 0 };\n    active3dViewer.distance = 4.5;\n    active3dViewer.autoRotate = true;",
      "window.reset3dModalCamera = function () {\n    active3dViewer.rotation = { x: 0.2, y: 0 };\n    active3dViewer.distance = 4.5;\n    active3dViewer.target = { x: 0, y: 0.2, z: 0 };\n    active3dViewer.autoRotate = true;"
    );

    // CSS fullscreen (works on iOS + desktop) — always inject after reset fn
    if (src.indexOf('toggle3dModalFullscreen') === -1) {
      src = src.replace(
        "window.reset3dModalCamera = function () {\n    active3dViewer.rotation = { x: 0.2, y: 0 };\n    active3dViewer.distance = 4.5;\n    active3dViewer.target = { x: 0, y: 0.2, z: 0 };\n    active3dViewer.autoRotate = true;\n    const btn = document.getElementById('tour3dAutoRotateBtn');\n    if (btn) {\n      btn.style.color = '#fff';\n      btn.textContent = '⟳ Auto-Rotate';\n    }\n  };",
        "window.reset3dModalCamera = function () {\n    active3dViewer.rotation = { x: 0.2, y: 0 };\n    active3dViewer.distance = 4.5;\n    active3dViewer.target = { x: 0, y: 0.2, z: 0 };\n    active3dViewer.autoRotate = true;\n    const btn = document.getElementById('tour3dAutoRotateBtn');\n    if (btn) {\n      btn.style.color = '#fff';\n      btn.textContent = '⟳ Auto-Rotate';\n    }\n  };\n\n  window.__spotlight3dFs = false;\n  window.toggle3dModalFullscreen = function (ev) {\n    if (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {} }\n    const el = document.getElementById('tourInfoModal3dContainer');\n    if (!el) { console.warn('[3D] container missing'); return; }\n    const btn = document.getElementById('tour3dFullscreenBtn');\n    const resizeViewer = function () {\n      if (!active3dViewer || !active3dViewer.renderer || !active3dViewer.camera) return;\n      const mount = active3dViewer.mountEl || el;\n      const w = mount.clientWidth || window.innerWidth;\n      const h = mount.clientHeight || window.innerHeight;\n      active3dViewer.renderer.setSize(w, h);\n      active3dViewer.camera.aspect = w / Math.max(h, 1);\n      active3dViewer.camera.updateProjectionMatrix();\n    };\n    const enterCssFs = function () {\n      window.__spotlight3dFs = true;\n      el.dataset.prevStyle = el.getAttribute('style') || '';\n      el.style.position = 'fixed';\n      el.style.left = '0';\n      el.style.top = '0';\n      el.style.right = '0';\n      el.style.bottom = '0';\n      el.style.width = '100vw';\n      el.style.height = '100vh';\n      el.style.maxHeight = '100vh';\n      el.style.aspectRatio = 'auto';\n      el.style.zIndex = '2147483646';\n      el.style.background = '#0a0812';\n      el.style.borderRadius = '0';\n      el.style.display = 'block';\n      if (btn) btn.textContent = '⛶ Exit';\n      document.body.style.overflow = 'hidden';\n      setTimeout(resizeViewer, 50);\n      setTimeout(resizeViewer, 200);\n    };\n    const exitCssFs = function () {\n      window.__spotlight3dFs = false;\n      if (el.dataset.prevStyle) {\n        el.setAttribute('style', el.dataset.prevStyle);\n        delete el.dataset.prevStyle;\n      } else {\n        el.style.position = 'relative';\n        el.style.left = '';\n        el.style.top = '';\n        el.style.right = '';\n        el.style.bottom = '';\n        el.style.width = '100%';\n        el.style.height = '';\n        el.style.maxHeight = 'min(92vw, 520px)';\n        el.style.aspectRatio = '1 / 1';\n        el.style.zIndex = '';\n      }\n      if (btn) btn.textContent = '⛶ Full';\n      document.body.style.overflow = '';\n      setTimeout(resizeViewer, 50);\n      setTimeout(resizeViewer, 200);\n    };\n    if (window.__spotlight3dFs) {\n      exitCssFs();\n      return;\n    }\n    enterCssFs();\n  };\n\n  document.addEventListener('keydown', function (e) {\n    if (e.key === 'Escape' && window.__spotlight3dFs) {\n      window.toggle3dModalFullscreen();\n    }\n  });"
      );
    }

    // Block context menu so right-drag can pan
    src = src.replace(
      "dom.addEventListener('mousedown', onPointerDown);\n      window.addEventListener('mousemove', onPointerMove);\n      window.addEventListener('mouseup', onPointerUp);",
      "dom.addEventListener('mousedown', onPointerDown);\n      window.addEventListener('mousemove', onPointerMove);\n      window.addEventListener('mouseup', onPointerUp);\n      dom.addEventListener('contextmenu', function (e) { e.preventDefault(); });"
    );

    // Touch passive false
    src = src.replace(
      "dom.addEventListener('touchstart', onPointerDown, { passive: true });\n      window.addEventListener('touchmove', onPointerMove, { passive: true });",
      "dom.addEventListener('touchstart', onPointerDown, { passive: false });\n      window.addEventListener('touchmove', onPointerMove, { passive: false });"
    );

    // --- PIN EDITOR: Transparent background option & button set in inspector ---
    src = src.replace(
      '<!-- Set Tint -->\n                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">\n                      <div style="display:flex;align-items:center;gap:6px;">\n                        <span style="font-size:11px;color:#aaa;font-weight:700;">Set tint:</span>\n                        <input type="color" id="placeHsColorPicker" value="#FFD23F" style="width:26px;height:26px;border:none;border-radius:4px;cursor:pointer;background:transparent;" onchange="window.setHotspotTint(this.value, \'place\')">\n                      </div>\n                      <!-- Preset Swatches -->\n                      <div style="display:flex;gap:5px;">\n                        <div class="spotlight-tint-swatch active" style="background:#FFD23F;" onclick="window.setHotspotTint(\'#FFD23F\', \'place\')" title="Gold"></div>\n                        <div class="spotlight-tint-swatch" style="background:#06D6A0;" onclick="window.setHotspotTint(\'#06D6A0\', \'place\')" title="Emerald"></div>\n                        <div class="spotlight-tint-swatch" style="background:#3FDDE0;" onclick="window.setHotspotTint(\'#3FDDE0\', \'place\')" title="Cyan"></div>\n                        <div class="spotlight-tint-swatch" style="background:#FF4D6D;" onclick="window.setHotspotTint(\'#FF4D6D\', \'place\')" title="Coral"></div>\n                        <div class="spotlight-tint-swatch" style="background:#FFFFFF;" onclick="window.setHotspotTint(\'#FFFFFF\', \'place\')" title="White"></div>\n                        <div class="spotlight-tint-swatch" style="background:#1877F2;" onclick="window.setHotspotTint(\'#1877F2\', \'place\')" title="Blue"></div>\n                      </div>\n                    </div>',
      '<!-- Set Tint -->\n                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">\n                      <div style="display:flex;align-items:center;gap:6px;">\n                        <span style="font-size:11px;color:#aaa;font-weight:700;">Set tint:</span>\n                        <input type="color" id="placeHsColorPicker" value="#FFD23F" style="width:26px;height:26px;border:none;border-radius:4px;cursor:pointer;background:transparent;" onchange="window.setHotspotTint(this.value, \'place\')">\n                      </div>\n                      <!-- Preset Swatches -->\n                      <div style="display:flex;gap:5px;">\n                        <div class="spotlight-tint-swatch active" style="background:#FFD23F;" onclick="window.setHotspotTint(\'#FFD23F\', \'place\')" title="Gold"></div>\n                        <div class="spotlight-tint-swatch" style="background:#06D6A0;" onclick="window.setHotspotTint(\'#06D6A0\', \'place\')" title="Emerald"></div>\n                        <div class="spotlight-tint-swatch" style="background:#3FDDE0;" onclick="window.setHotspotTint(\'#3FDDE0\', \'place\')" title="Cyan"></div>\n                        <div class="spotlight-tint-swatch" style="background:#FF4D6D;" onclick="window.setHotspotTint(\'#FF4D6D\', \'place\')" title="Coral"></div>\n                        <div class="spotlight-tint-swatch" style="background:#FFFFFF;" onclick="window.setHotspotTint(\'#FFFFFF\', \'place\')" title="White"></div>\n                        <div class="spotlight-tint-swatch" style="background:#1877F2;" onclick="window.setHotspotTint(\'#1877F2\', \'place\')" title="Blue"></div>\n                      </div>\n                    </div>\n                    <!-- Icon Background Style -->\n                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:8px;">\n                      <span style="font-size:11px;color:#aaa;font-weight:700;">Icon background:</span>\n                      <div class="spotlight-pill-group" style="display:flex;gap:4px;">\n                        <button type="button" class="spotlight-pill-btn active" id="placeBgStyleDisc" onclick="window.setHotspotBgStyle(\'disc\', \'place\')" title="Standard circular badge disc">🔘 Disc</button>\n                        <button type="button" class="spotlight-pill-btn" id="placeBgStyleTransparent" onclick="window.setHotspotBgStyle(\'transparent\', \'place\')" title="Transparent background, icon alone">✨ Transparent</button>\n                      </div>\n                    </div>'
    );

    src = src.replace(
      '<!-- Set Tint -->\n                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">\n                      <div style="display:flex;align-items:center;gap:6px;">\n                        <span style="font-size:11px;color:#aaa;font-weight:700;">Set tint:</span>\n                        <input type="color" id="editHsColorPicker" value="#FFD23F" style="width:26px;height:26px;border:none;border-radius:4px;cursor:pointer;background:transparent;" onchange="window.setHotspotTint(this.value, \'edit\')">\n                      </div>\n                      <!-- Preset Swatches -->\n                      <div style="display:flex;gap:5px;">\n                        <div class="spotlight-tint-swatch" style="background:#FFD23F;" onclick="window.setHotspotTint(\'#FFD23F\', \'edit\')" title="Gold"></div>\n                        <div class="spotlight-tint-swatch" style="background:#06D6A0;" onclick="window.setHotspotTint(\'#06D6A0\', \'edit\')" title="Emerald"></div>\n                        <div class="spotlight-tint-swatch" style="background:#3FDDE0;" onclick="window.setHotspotTint(\'#3FDDE0\', \'edit\')" title="Cyan"></div>\n                        <div class="spotlight-tint-swatch" style="background:#FF4D6D;" onclick="window.setHotspotTint(\'#FF4D6D\', \'edit\')" title="Coral"></div>\n                        <div class="spotlight-tint-swatch" style="background:#FFFFFF;" onclick="window.setHotspotTint(\'#FFFFFF\', \'edit\')" title="White"></div>\n                        <div class="spotlight-tint-swatch" style="background:#1877F2;" onclick="window.setHotspotTint(\'#1877F2\', \'edit\')" title="Blue"></div>\n                      </div>\n                    </div>',
      '<!-- Set Tint -->\n                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">\n                      <div style="display:flex;align-items:center;gap:6px;">\n                        <span style="font-size:11px;color:#aaa;font-weight:700;">Set tint:</span>\n                        <input type="color" id="editHsColorPicker" value="#FFD23F" style="width:26px;height:26px;border:none;border-radius:4px;cursor:pointer;background:transparent;" onchange="window.setHotspotTint(this.value, \'edit\')">\n                      </div>\n                      <!-- Preset Swatches -->\n                      <div style="display:flex;gap:5px;">\n                        <div class="spotlight-tint-swatch" style="background:#FFD23F;" onclick="window.setHotspotTint(\'#FFD23F\', \'edit\')" title="Gold"></div>\n                        <div class="spotlight-tint-swatch" style="background:#06D6A0;" onclick="window.setHotspotTint(\'#06D6A0\', \'edit\')" title="Emerald"></div>\n                        <div class="spotlight-tint-swatch" style="background:#3FDDE0;" onclick="window.setHotspotTint(\'#3FDDE0\', \'edit\')" title="Cyan"></div>\n                        <div class="spotlight-tint-swatch" style="background:#FF4D6D;" onclick="window.setHotspotTint(\'#FF4D6D\', \'edit\')" title="Coral"></div>\n                        <div class="spotlight-tint-swatch" style="background:#FFFFFF;" onclick="window.setHotspotTint(\'#FFFFFF\', \'edit\')" title="White"></div>\n                        <div class="spotlight-tint-swatch" style="background:#1877F2;" onclick="window.setHotspotTint(\'#1877F2\', \'edit\')" title="Blue"></div>\n                      </div>\n                    </div>\n                    <!-- Icon Background Style -->\n                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:8px;">\n                      <span style="font-size:11px;color:#aaa;font-weight:700;">Icon background:</span>\n                      <div class="spotlight-pill-group" style="display:flex;gap:4px;">\n                        <button type="button" class="spotlight-pill-btn active" id="editBgStyleDisc" onclick="window.setHotspotBgStyle(\'disc\', \'edit\')" title="Standard circular badge disc">🔘 Disc</button>\n                        <button type="button" class="spotlight-pill-btn" id="editBgStyleTransparent" onclick="window.setHotspotBgStyle(\'transparent\', \'edit\')" title="Transparent background, icon alone">✨ Transparent</button>\n                      </div>\n                    </div>'
    );

    // Initial state bgStyle
    src = src.replace(
      "  const placeHsState = {\n    icon: 'chevron-up',\n    color: '#FFD23F',\n    size: 100,",
      "  const placeHsState = {\n    icon: 'chevron-up',\n    color: '#FFD23F',\n    bgStyle: 'disc',\n    size: 100,"
    );

    // Background Style setter
    src = src.replace(
      "  // Tint picker\n  window.setHotspotTint = function (hexColor, target) {\n    const state = (target === 'place') ? placeHsState : editHsState;\n    state.color = hexColor;\n    syncInspectorUI(target);\n  };",
      "  // Tint picker\n  window.setHotspotTint = function (hexColor, target) {\n    const state = (target === 'place') ? placeHsState : editHsState;\n    state.color = hexColor;\n    syncInspectorUI(target);\n  };\n\n  // Background Style picker (Disc vs Transparent)\n  window.setHotspotBgStyle = function (bgStyle, target) {\n    const state = (target === 'place') ? placeHsState : editHsState;\n    state.bgStyle = bgStyle;\n    syncInspectorUI(target);\n  };"
    );

    // Live preview inner background in syncInspectorUI
    src = src.replace(
      "    // 1. Preview Icon Box\n    const previewInner = document.getElementById(`${prefix}HsIconPreviewInner`);\n    const categoryLabel = document.getElementById(`${prefix}HsIconCategory`);\n    if (previewInner) {\n      previewInner.style.transform = `rotate(${state.rotation}deg) scale(${state.size / 100})`;\n      previewInner.style.opacity = state.opacity / 100;\n      previewInner.style.color = state.color;\n\n      const iconKey = state.icon || 'chevron-floor';\n      previewInner.innerHTML = getSpotlightSvg(iconKey, state.color || '#FFD23F');",
      "    // 1. Preview Icon Box\n    const previewInner = document.getElementById(`${prefix}HsIconPreviewInner`);\n    const categoryLabel = document.getElementById(`${prefix}HsIconCategory`);\n    if (previewInner) {\n      previewInner.style.transform = `rotate(${state.rotation}deg) scale(${state.size / 100})`;\n      previewInner.style.opacity = state.opacity / 100;\n      previewInner.style.color = state.color;\n      const isTrans = (state.bgStyle === 'transparent');\n      if (isTrans) {\n        previewInner.style.background = 'transparent';\n        previewInner.style.borderRadius = '0';\n        previewInner.style.border = 'none';\n        previewInner.style.boxShadow = 'none';\n        previewInner.style.filter = 'drop-shadow(0 2px 6px rgba(0,0,0,0.85))';\n      } else {\n        previewInner.style.background = 'rgba(18, 16, 24, 0.94)';\n        previewInner.style.borderRadius = '50%';\n        previewInner.style.border = `2px solid ${state.color || '#FFD23F'}`;\n        previewInner.style.boxShadow = '0 4px 14px rgba(0,0,0,0.6)';\n        previewInner.style.filter = 'none';\n      }\n\n      const iconKey = state.icon || 'chevron-floor';\n      previewInner.innerHTML = getSpotlightSvg(iconKey, state.color || '#FFD23F');"
    );

    // Sync Background style pills in syncInspectorUI
    src = src.replace(
      "    // 4. Placement pills\n    ['2d', 'floor', 'wall'].forEach(mode => {",
      "    // Background Style pills\n    const btnDisc = document.getElementById(`${prefix}BgStyleDisc`);\n    const btnTrans = document.getElementById(`${prefix}BgStyleTransparent`);\n    if (btnDisc) btnDisc.classList.toggle('active', state.bgStyle !== 'transparent');\n    if (btnTrans) btnTrans.classList.toggle('active', state.bgStyle === 'transparent');\n\n    // 4. Placement pills\n    ['2d', 'floor', 'wall'].forEach(mode => {"
    );

    // Save bgStyle in confirmPlaceHotspot
    src = src.replace(
      "      icon: placeHsState.icon || 'chevron-up',\n      color: placeHsState.color || '#FFD23F',\n      size: placeHsState.size != null ? placeHsState.size : 100,",
      "      icon: placeHsState.icon || 'chevron-up',\n      color: placeHsState.color || '#FFD23F',\n      bgStyle: placeHsState.bgStyle || 'disc',\n      transparentBg: (placeHsState.bgStyle === 'transparent'),\n      size: placeHsState.size != null ? placeHsState.size : 100,"
    );

    // Populate bgStyle in editHotspotDetails
    src = src.replace(
      "    // Populate state from hotspot object\n    editHsState.icon = hs.icon || 'chevron-up';\n    editHsState.color = hs.color || '#FFD23F';\n    editHsState.size = hs.size != null ? hs.size : 100;",
      "    // Populate state from hotspot object\n    editHsState.icon = hs.icon || 'chevron-up';\n    editHsState.color = hs.color || '#FFD23F';\n    editHsState.bgStyle = hs.bgStyle || (hs.transparentBg ? 'transparent' : 'disc');\n    editHsState.size = hs.size != null ? hs.size : 100;"
    );

    // Save bgStyle in saveHotspotEdit
    src = src.replace(
      "    hs.icon = editHsState.icon || 'chevron-up';\n    hs.color = editHsState.color || '#FFD23F';\n    hs.size = editHsState.size != null ? editHsState.size : 100;",
      "    hs.icon = editHsState.icon || 'chevron-up';\n    hs.color = editHsState.color || '#FFD23F';\n    hs.bgStyle = editHsState.bgStyle || 'disc';\n    hs.transparentBg = (editHsState.bgStyle === 'transparent');\n    hs.size = editHsState.size != null ? editHsState.size : 100;"
    );

    // Render transparent hotspot pins in syncHotspotsDom
    src = src.replace(
      "      // 1. Disc container\n      const disc = document.createElement('div');\n      disc.className = 'spotlight-pin-disc';\n\n      // 2. Ripple Beacon ring\n      const beacon = document.createElement('div');\n      beacon.className = 'spotlight-beacon-pulse';\n      disc.appendChild(beacon);\n\n      // 3. Icon Inner container\n      const iconWrapper = document.createElement('div');\n      iconWrapper.className = 'spotlight-pin-icon-inner';\n      if (placement !== 'floor') {\n        iconWrapper.style.transform = `rotate(${rotationDeg}deg)`;\n      }\n\n      // Render pin icon SVG or uploaded custom icon\n      const iconKey = hs.icon || 'chevron-floor';\n      iconWrapper.innerHTML = getSpotlightSvg(iconKey, color);\n      disc.appendChild(iconWrapper);\n      pin.appendChild(disc);",
      "      const isTransparentPin = (hs.bgStyle === 'transparent' || hs.transparentBg === true);\n      if (isTransparentPin) {\n        pin.classList.add('spotlight-pin-transparent');\n      }\n\n      // 1. Disc container\n      const disc = document.createElement('div');\n      disc.className = 'spotlight-pin-disc';\n      if (isTransparentPin) {\n        disc.classList.add('is-transparent');\n        disc.style.background = 'transparent';\n        disc.style.borderColor = 'transparent';\n        disc.style.boxShadow = 'none';\n      }\n\n      // 2. Ripple Beacon ring\n      const beacon = document.createElement('div');\n      beacon.className = 'spotlight-beacon-pulse';\n      if (isTransparentPin) {\n        beacon.style.display = 'none';\n      }\n      disc.appendChild(beacon);\n\n      // 3. Icon Inner container\n      const iconWrapper = document.createElement('div');\n      iconWrapper.className = 'spotlight-pin-icon-inner';\n      if (isTransparentPin) {\n        iconWrapper.style.width = '100%';\n        iconWrapper.style.height = '100%';\n        iconWrapper.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.85)) drop-shadow(0 0 3px rgba(0,0,0,0.5))';\n      }\n      if (placement !== 'floor') {\n        iconWrapper.style.transform = `rotate(${rotationDeg}deg)`;\n      }\n\n      // Render pin icon SVG or uploaded custom icon\n      const iconKey = hs.icon || 'chevron-floor';\n      iconWrapper.innerHTML = getSpotlightSvg(iconKey, color);\n      disc.appendChild(iconWrapper);\n      pin.appendChild(disc);"
    );

    // CSS styling for transparent pin
    const shutterTarget = '      .shutter-text {\n        font-size: 12px;\n        font-weight: 900;\n        letter-spacing: 0.04em;\n      }';
    const cssToAdd = shutterTarget + '\n      /* Transparent Hotspot Pin (Icon Alone) */\n      .tour-hotspot-pin.spotlight-pin-transparent .spotlight-pin-disc,\n      .tour-hotspot-pin.spotlight-pin-transparent.placement-floor .spotlight-pin-disc,\n      .tour-hotspot-pin.spotlight-pin-transparent.spotlight-pin-floor .spotlight-pin-disc,\n      .tour-hotspot-pin.spotlight-pin-transparent.placement-wall .spotlight-pin-disc,\n      .tour-hotspot-pin.spotlight-pin-transparent.spotlight-pin-wall .spotlight-pin-disc,\n      .tour-hotspot-pin.spotlight-pin-transparent.spotlight-pin-2d .spotlight-pin-disc {\n        background: transparent !important;\n        border-color: transparent !important;\n        box-shadow: none !important;\n      }\n      .tour-hotspot-pin.spotlight-pin-transparent .spotlight-beacon-pulse {\n        display: none !important;\n      }\n      .tour-hotspot-pin.spotlight-pin-transparent .spotlight-pin-icon-inner {\n        width: 100% !important;\n        height: 100% !important;\n        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 3px rgba(0, 0, 0, 0.5));\n        transition: transform 0.2s ease, filter 0.2s ease;\n      }\n      .tour-hotspot-pin.spotlight-pin-transparent:hover .spotlight-pin-icon-inner {\n        filter: drop-shadow(0 0 12px var(--pin-color, #FFD23F)) drop-shadow(0 4px 14px rgba(0, 0, 0, 0.95));\n      }\n      .tour-hotspot-pin.spotlight-pin-transparent:hover .spotlight-pin-disc {\n        transform: scale(calc(var(--pin-scale, 1) * 1.15)) !important;\n        box-shadow: none !important;\n      }\n      .tour-hotspot-pin.editor-pin.spotlight-pin-transparent .spotlight-pin-disc {\n        border: 1.5px dashed rgba(6, 214, 160, 0.7) !important;\n        border-radius: 50% !important;\n      }';
    src = src.replace(shutterTarget, cssToAdd);

    return src;
  }

  fetch(GOOD_URL)
    .then(function (r) {
      if (!r.ok) throw new Error('Failed to load tour-3d engine: ' + r.status);
      return r.text();
    })
    .then(function (src) {
      var fixed = applyFixes(src);
      var s = document.createElement('script');
      s.text = fixed;
      document.head.appendChild(s);
    })
    .catch(function (err) {
      console.error('[tour-3d bootstrap]', err);
    });
})();
