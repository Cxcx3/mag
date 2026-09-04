/**
 * SpotLIGHT tour-3d bootstrap — loads last good engine and applies 3D showcase fixes
 */
(function () {
  'use strict';
  const GOOD_URL = 'https://raw.githubusercontent.com/Cxcx3/mag/953df2b907d3fcce9a871e3832bb4e0ad4e80d60/tour-3d.js';

  function applyFixes(src) {
    const pairs = PLACEHOLDER_PAIRS;
    for (let i = 0; i < pairs.length; i++) {
      if (src.indexOf(pairs[i][0]) === -1) {
        console.warn('[tour-3d bootstrap] missing pattern', i);
      } else {
        src = src.replace(pairs[i][0], pairs[i][1]);
      }
    }
    src = src.replace(/<div style="position:absolute;bottom:10px;left:12px;background:rgba\(0,0,0,0\.65\);backdrop-filter:blur\(6px\);color:#3FDDE0;font-size:10px;font-weight:800;padding:4px 10px;border-radius:20px;border:1px solid rgba\(63,221,224,0\.3\);display:flex;align-items:center;gap:5px;pointer-events:none;user-select:none;">\s*<span>🧊 Drag to rotate 3D · Scroll to zoom<\/span>\s*<\/div>\s*/m, '');
    return src;
  }

  fetch(GOOD_URL)
    .then(r => {
      if (!r.ok) throw new Error('Failed to load tour-3d engine: ' + r.status);
      return r.text();
    })
    .then(src => {
      const fixed = applyFixes(src);
      const s = document.createElement('script');
      s.text = fixed;
      document.head.appendChild(s);
    })
    .catch(err => {
      console.error('[tour-3d bootstrap]', err);
    });
})();
