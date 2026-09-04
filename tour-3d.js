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
      'title="Reset 3D camera angle">⌖ Reset</button>\n                  <button type="button" class="tour-dialog-btn" id="tour3dFullscreenBtn" onclick="window.toggle3dModalFullscreen()" style="padding:4px 9px;font-size:10px;background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.2);color:#fff;" title="Fullscreen 3D view">⛶ Full</button>'
    );
    // Viewer state + pan target
    src = src.replace(
      'isDragging: false,\n    prevMouse: { x: 0, y: 0 },\n    rotation: { x: 0.2, y: 0 },\n    distance: 4.5\n  };',
      "isDragging: false,\n    dragMode: 'orbit',\n    prevMouse: { x: 0, y: 0 },\n    rotation: { x: 0.2, y: 0 },\n    distance: 4.5,\n    target: { x: 0, y: 0.2, z: 0 }\n  };"
    );
    src = src.replace('const height = mountEl.clientHeight || 270;', 'const height = mountEl.clientHeight || width || 420;');

    // Invert orbit + mark cursor grab on the interaction start
    src = src.replace(
      "const dom = renderer.domElement;\n\n      const onPointerDown = (e) => {\n        active3dViewer.isDragging = true;\n        active3dViewer.autoRotate = false; // Pause auto rotate on manual touch\n        active3dViewer.prevMouse = {\n          x: e.clientX || (e.touches && e.touches[0]?.clientX) || 0,\n          y: e.clientY || (e.touches && e.touches[0]?.clientY) || 0\n        };\n      };",
      "const dom = renderer.domElement;\n      dom.style.cursor = 'grab';\n      dom.style.touchAction = 'none';\n      if (!active3dViewer.target) active3dViewer.target = { x: 0, y: 0.2, z: 0 };\n\n      const onPointerDown = (e) => {\n        active3dViewer.isDragging = true;\n        active3dViewer.autoRotate = false;\n        dom.style.cursor = 'grabbing';\n        const isTouch = !!(e.touches && e.touches.length);\n        active3dViewer.prevMouse = {\n          x: e.clientX || (e.touches && e.touches[0]?.clientX) || 0,\n          y: e.clientY || (e.touches && e.touches[0]?.clientY) || 0\n        };\n        active3dViewer.dragMode = (e.button === 2 || e.button === 1 || e.shiftKey) ? 'pan' : 'orbit';\n        if (e.cancelable && isTouch) e.preventDefault();\n      };"
    );

    // Replace move handler: orbit (inverted) + pan
    src = src.replace(
      "const onPointerMove = (e) => {\n        if (!active3dViewer.isDragging) return;\n        const curX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;\n        const curY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;\n        const deltaX = curX - active3dViewer.prevMouse.x;\n        const deltaY = curY - active3dViewer.prevMouse.y;\n\n        active3dViewer.rotation.y += deltaX * 0.012;\n        active3dViewer.rotation.x = Math.max(-1.1, Math.min(1.1, active3dViewer.rotation.x + deltaY * 0.012));\n\n        active3dViewer.prevMouse = { x: curX, y: curY };\n      };",
      "const onPointerMove = (e) => {\n        if (!active3dViewer.isDragging) return;\n        const curX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;\n        const curY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;\n        const deltaX = curX - active3dViewer.prevMouse.x;\n        const deltaY = curY - active3dViewer.prevMouse.y;\n        if (active3dViewer.dragMode === 'pan') {\n          const panScale = active3dViewer.distance * 0.0028;\n          const rotY = active3dViewer.rotation.y;\n          const tgt = active3dViewer.target || (active3dViewer.target = { x: 0, y: 0.2, z: 0 });\n          tgt.x -= Math.cos(rotY) * deltaX * panScale;\n          tgt.y += deltaY * panScale;\n          tgt.z -= -Math.sin(rotY) * deltaX * panScale;\n        } else {\n          active3dViewer.rotation.y -= deltaX * 0.012;\n          active3dViewer.rotation.x = Math.max(-1.25, Math.min(1.25, active3dViewer.rotation.x + deltaY * 0.012));\n        }\n        active3dViewer.prevMouse = { x: curX, y: curY };\n        if (e.cancelable && e.touches) e.preventDefault();\n      };"
    );

    src = src.replace(
      "const onPointerUp = () => {\n        active3dViewer.isDragging = false;\n      };",
      "const onPointerUp = () => {\n        active3dViewer.isDragging = false;\n        active3dViewer.dragMode = 'orbit';\n        if (active3dViewer.renderer && active3dViewer.renderer.domElement) active3dViewer.renderer.domElement.style.cursor = 'grab';\n      };"
    );

    // Better zoom (closer)
    src = src.replace(
      "const delta = Math.sign(e.deltaY) * 0.35;\n        active3dViewer.distance = Math.max(1.8, Math.min(8.0, active3dViewer.distance + delta));",
      "const factor = e.deltaY > 0 ? 1.09 : 0.91;\n        active3dViewer.distance = Math.max(0.6, Math.min(10, active3dViewer.distance * factor));"
    );

    // Camera orbits around pan target
    src = src.replace(
      "cam.position.x = dist * Math.sin(rotY) * Math.cos(rotX);\n      cam.position.y = dist * Math.sin(rotX) + 0.4;\n      cam.position.z = dist * Math.cos(rotY) * Math.cos(rotX);\n      cam.lookAt(0, 0.2, 0);",
      "const tgt = active3dViewer.target || { x: 0, y: 0.2, z: 0 };\n      cam.position.x = tgt.x + dist * Math.sin(rotY) * Math.cos(rotX);\n      cam.position.y = tgt.y + dist * Math.sin(rotX);\n      cam.position.z = tgt.z + dist * Math.cos(rotY) * Math.cos(rotX);\n      cam.lookAt(tgt.x, tgt.y, tgt.z);"
    );

    // Reset clears target + fullscreen helper
    src = src.replace(
      "window.reset3dModalCamera = function () {\n    active3dViewer.rotation = { x: 0.2, y: 0 };\n    active3dViewer.distance = 4.5;\n    active3dViewer.autoRotate = true;",
      "window.reset3dModalCamera = function () {\n    active3dViewer.rotation = { x: 0.2, y: 0 };\n    active3dViewer.distance = 4.5;\n    active3dViewer.target = { x: 0, y: 0.2, z: 0 };\n    active3dViewer.autoRotate = true;"
    );

    // Inject fullscreen function after reset function ends
    if (src.indexOf('toggle3dModalFullscreen') === -1) {
      src = src.replace(
        "window.reset3dModalCamera = function () {\n    active3dViewer.rotation = { x: 0.2, y: 0 };\n    active3dViewer.distance = 4.5;\n    active3dViewer.target = { x: 0, y: 0.2, z: 0 };\n    active3dViewer.autoRotate = true;\n    const btn = document.getElementById('tour3dAutoRotateBtn');\n    if (btn) {\n      btn.style.color = '#fff';\n      btn.textContent = '⟳ Auto-Rotate';\n    }\n  };",
        "window.reset3dModalCamera = function () {\n    active3dViewer.rotation = { x: 0.2, y: 0 };\n    active3dViewer.distance = 4.5;\n    active3dViewer.target = { x: 0, y: 0.2, z: 0 };\n    active3dViewer.autoRotate = true;\n    const btn = document.getElementById('tour3dAutoRotateBtn');\n    if (btn) {\n      btn.style.color = '#fff';\n      btn.textContent = '⟳ Auto-Rotate';\n    }\n  };\n\n  window.toggle3dModalFullscreen = function () {\n    const el = document.getElementById('tourInfoModal3dContainer');\n    if (!el) return;\n    const btn = document.getElementById('tour3dFullscreenBtn');\n    const resizeViewer = function () {\n      if (!active3dViewer.renderer || !active3dViewer.camera) return;\n      const mount = active3dViewer.mountEl || el;\n      const w = mount.clientWidth || window.innerWidth;\n      const h = mount.clientHeight || window.innerHeight;\n      active3dViewer.renderer.setSize(w, h);\n      active3dViewer.camera.aspect = w / Math.max(h, 1);\n      active3dViewer.camera.updateProjectionMatrix();\n    };\n    const exitFs = function () {\n      if (btn) btn.textContent = '⛶ Full';\n      el.style.maxHeight = 'min(92vw, 520px)';\n      el.style.height = '';\n      el.style.aspectRatio = '1 / 1';\n      requestAnimationFrame(resizeViewer);\n    };\n    if (!document.fullscreenElement && !document.webkitFullscreenElement) {\n      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;\n      if (req) {\n        Promise.resolve(req.call(el)).then(function () {\n          if (btn) btn.textContent = '⛶ Exit';\n          el.style.maxHeight = '100vh';\n          el.style.height = '100vh';\n          el.style.aspectRatio = 'auto';\n          el.style.background = '#0a0812';\n          setTimeout(resizeViewer, 120);\n        }).catch(function () {});\n      }\n      const onFsChange = function () {\n        if (!document.fullscreenElement && !document.webkitFullscreenElement) {\n          exitFs();\n          document.removeEventListener('fullscreenchange', onFsChange);\n          document.removeEventListener('webkitfullscreenchange', onFsChange);\n        }\n      };\n      document.addEventListener('fullscreenchange', onFsChange);\n      document.addEventListener('webkitfullscreenchange', onFsChange);\n    } else {\n      const exit = document.exitFullscreen || document.webkitExitFullscreen;\n      if (exit) exit.call(document);\n      exitFs();\n    }\n  };"
      );
    }

    // Block context menu so right-drag can pan
    src = src.replace(
      "dom.addEventListener('mousedown', onPointerDown);\n      window.addEventListener('mousemove', onPointerMove);\n      window.addEventListener('mouseup', onPointerUp);",
      "dom.addEventListener('mousedown', onPointerDown);\n      window.addEventListener('mousemove', onPointerMove);\n      window.addEventListener('mouseup', onPointerUp);\n      dom.addEventListener('contextmenu', function (e) { e.preventDefault(); });"
    );

    // Touch passive false so preventDefault works for pan/grab
    src = src.replace(
      "dom.addEventListener('touchstart', onPointerDown, { passive: true });\n      window.addEventListener('touchmove', onPointerMove, { passive: true });",
      "dom.addEventListener('touchstart', onPointerDown, { passive: false });\n      window.addEventListener('touchmove', onPointerMove, { passive: false });"
    );

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
