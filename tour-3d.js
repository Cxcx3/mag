/**
 * SpotLIGHT tour-3d bootstrap — loads last good engine and applies 3D showcase fixes
 */
(function () {
  'use strict';
  const GOOD_URL = 'https://raw.githubusercontent.com/Cxcx3/mag/953df2b907d3fcce9a871e3832bb4e0ad4e80d60/tour-3d.js';

  function applyFixes(src) {
    // 1. Square full container + remove drag hint badge
    src = src.replace(
      'id="tourInfoModal3dContainer" style="display:none;width:100%;height:270px;position:relative;background:radial-gradient(circle at 50% 50%, #1c182a 0%, #0a0812 100%);"',
      'id="tourInfoModal3dContainer" style="display:none;width:100%;aspect-ratio:1/1;min-height:280px;max-height:min(92vw, 520px);position:relative;background:radial-gradient(circle at 50% 50%, #1c182a 0%, #0a0812 100%);"'
    );
    src = src.replace(
      /<div style="position:absolute;bottom:10px;left:12px;background:rgba\(0,0,0,0\.65\);backdrop-filter:blur\(6px\);color:#3FDDE0;font-size:10px;font-weight:800;padding:4px 10px;border-radius:20px;border:1px solid rgba\(63,221,224,0\.3\);display:flex;align-items:center;gap:5px;pointer-events:none;user-select:none;">\s*<span>🧊 Drag to rotate 3D · Scroll to zoom<\/span>\s*<\/div>\s*/m,
      ''
    );
    // 2. Invert horizontal drag (left drag turns left)
    src = src.replace(
      'active3dViewer.rotation.y += deltaX * 0.012;',
      'active3dViewer.rotation.y -= deltaX * 0.012;'
    );
    // 3. Smoother zoom that can get close to the item
    src = src.replace(
      `const onWheel = (e) => {
        e.preventDefault();
        const delta = Math.sign(e.deltaY) * 0.35;
        active3dViewer.distance = Math.max(1.8, Math.min(8.0, active3dViewer.distance + delta));
      };`,
      `const onWheel = (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.08 : 0.92;
        active3dViewer.distance = Math.max(0.85, Math.min(9.0, active3dViewer.distance * factor));
      };`
    );
    // 4. Height fallback matches square layout
    src = src.replace(
      'const height = mountEl.clientHeight || 270;',
      'const height = mountEl.clientHeight || width || 420;'
    );
    return src;
  }

  fetch(GOOD_URL)
    .then(r => {
      if (!r.ok) throw new Error('Failed to load tour-3d engine: ' + r.status);
      return r.text();
    })
    .then(src => {
      const fixed = applyFixes(src);
      // Execute as classic script in global scope
      const s = document.createElement('script');
      s.text = fixed;
      document.head.appendChild(s);
    })
    .catch(err => {
      console.error('[tour-3d bootstrap]', err);
    });
})();
