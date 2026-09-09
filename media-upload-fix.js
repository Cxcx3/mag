/**
 * SpotLIGHT media upload fix
 * - Shows real % progress while uploading
 * - Falls back to client-side photo compress / video embed when /api/upload is offline (e.g. GitHub Pages)
 * - Fixes community spot uploader (was targeting a missing status element)
 * - Safe overrides; loads after the main index.html script
 */
(function () {
  'use strict';

  function setStatus(el, text) { if (el) el.textContent = text; }

  function ensureProgressBar(anchorEl) {
    if (!anchorEl || !anchorEl.parentElement) return null;
    var existing = anchorEl.parentElement.querySelector('.sl-upload-progress');
    if (existing) return existing;
    var wrap = document.createElement('div');
    wrap.className = 'sl-upload-progress';
    wrap.style.cssText = 'margin-top:8px;width:100%;background:rgba(255,255,255,0.12);border-radius:999px;height:10px;overflow:hidden;display:none;';
    var bar = document.createElement('div');
    bar.className = 'sl-upload-progress-bar';
    bar.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg,#FFD23F,#FF4D6D);transition:width 0.15s ease;border-radius:999px;';
    wrap.appendChild(bar);
    anchorEl.parentElement.appendChild(wrap);
    return wrap;
  }

  function setProgress(wrap, percent) {
    if (!wrap) return;
    wrap.style.display = 'block';
    var bar = wrap.querySelector('.sl-upload-progress-bar');
    if (bar) bar.style.width = Math.max(0, Math.min(100, percent)) + '%';
    if (percent >= 100) {
      setTimeout(function () {
        wrap.style.display = 'none';
        if (bar) bar.style.width = '0%';
      }, 800);
    }
  }

  window.uploadMediaFile = function (file, progressCallback) {
    return new Promise(function (resolve, reject) {
      var formData = new FormData();
      formData.append('file', file);
      var endpoints = ['/api/upload', 'api/upload', './api/upload'];
      var attempt = 0;
      function tryNext() {
        if (attempt >= endpoints.length) { reject(new Error('Upload endpoint unavailable')); return; }
        var url = endpoints[attempt++];
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.timeout = 10 * 60 * 1000;
        if (xhr.upload && progressCallback) {
          xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) progressCallback(Math.round((e.loaded / e.total) * 100));
          };
        }
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              var res = JSON.parse(xhr.responseText);
              if (res && res.url) { if (progressCallback) progressCallback(100); resolve(res); }
              else reject(new Error('Invalid response from server'));
            } catch (e) { reject(e); }
          } else if (xhr.status === 404 || xhr.status === 0) tryNext();
          else reject(new Error('Upload failed with status ' + xhr.status));
        };
        xhr.onerror = tryNext;
        xhr.ontimeout = function () { reject(new Error('Upload timed out')); };
        try { xhr.send(formData); } catch (e) { tryNext(); }
      }
      tryNext();
    });
  };

  window.handleSpotFileUpload = function (input) {
    if (!input || !input.files || !input.files[0]) return;
    var file = input.files[0];
    var statusEl = document.getElementById('spotUploadLabel') || document.getElementById('spotUploadStatus');
    var progressWrap = ensureProgressBar(statusEl);
    var isVideo = (file.type && file.type.startsWith('video/')) || /\.(mp4|webm|ogg|mov|m4v|avi|mkv|3gp)$/i.test(file.name || '');
    setStatus(statusEl, '⏳ Preparing ' + (isVideo ? 'video' : 'photo') + '...');
    setProgress(progressWrap, 2);
    (async function () {
      try {
        var finalUrl = '', finalType = isVideo ? 'video' : 'image';
        if (!isVideo) {
          try {
            setStatus(statusEl, '⏳ Uploading photo 0%');
            var uploadRes = await window.uploadMediaFile(file, function (percent) {
              setStatus(statusEl, '⏳ Uploading photo ' + percent + '%'); setProgress(progressWrap, percent);
            });
            if (uploadRes && uploadRes.url) { finalUrl = uploadRes.url; finalType = 'image'; }
          } catch (serverErr) {
            setStatus(statusEl, '⏳ Optimizing photo for offline...'); setProgress(progressWrap, 40);
            if (typeof compressImageToDataURL === 'function') finalUrl = await compressImageToDataURL(file, 1200, 0.82);
            else if (typeof readFileAsDataURL === 'function') finalUrl = await readFileAsDataURL(file);
            else finalUrl = await new Promise(function (resolve, reject) { var r = new FileReader(); r.onload = function () { resolve(r.result); }; r.onerror = reject; r.readAsDataURL(file); });
            setProgress(progressWrap, 100);
          }
        } else {
          try {
            setStatus(statusEl, '⏳ Uploading video 0%');
            var vRes = await window.uploadMediaFile(file, function (percent) {
              setStatus(statusEl, '⏳ Uploading video ' + percent + '%'); setProgress(progressWrap, percent);
            });
            if (vRes && vRes.url) { finalUrl = vRes.url; finalType = vRes.type || 'video'; }
          } catch (serverErr) {
            console.warn('Server upload unavailable, client fallback', serverErr);
            if (file.size <= 4 * 1024 * 1024) {
              setStatus(statusEl, '⏳ Embedding small video...'); setProgress(progressWrap, 60);
              if (typeof readFileAsDataURL === 'function') finalUrl = await readFileAsDataURL(file);
              else finalUrl = await new Promise(function (resolve, reject) { var r = new FileReader(); r.onload = function () { resolve(r.result); }; r.onerror = reject; r.readAsDataURL(file); });
            } else {
              finalUrl = URL.createObjectURL(file);
              if (typeof showToast === 'function') showToast('Large video: use YouTube/Vimeo link or run the server for permanent upload.');
            }
            setProgress(progressWrap, 100);
          }
        }
        if (!finalUrl) throw new Error('No media URL produced');
        if (typeof pendingSpotMediaUrl !== 'undefined') window.pendingSpotMediaUrl = finalUrl;
        try { pendingSpotMediaUrl = finalUrl; pendingSpotMediaType = finalType; } catch (e) {}
        var urlInput = document.getElementById('spotMediaUrl'); if (urlInput) urlInput.value = finalUrl;
        var preview = document.getElementById('spotMediaPreview');
        if (preview && typeof renderMediaPreview === 'function') preview.innerHTML = renderMediaPreview(finalUrl, finalType);
        else if (preview) preview.innerHTML = finalType === 'video' ? '<video src="' + finalUrl + '" style="max-width:100%;max-height:120px;border-radius:8px;" muted playsinline controls></video>' : '<img src="' + finalUrl + '" style="max-width:100%;max-height:120px;border-radius:8px;object-fit:cover;" alt="Preview">';
        setStatus(statusEl, '✅ ' + (isVideo ? 'Video' : 'Photo') + ' ready — 100%'); setProgress(progressWrap, 100);
        if (typeof showToast === 'function') showToast('✅ ' + (isVideo ? 'Video' : 'Photo') + ' ready!');
      } catch (err) {
        console.error('Spot upload failed:', err); setStatus(statusEl, '❌ Upload failed — tap to retry');
        if (progressWrap) progressWrap.style.display = 'none';
        if (typeof showToast === 'function') showToast('❌ Upload failed. Try again or paste an image/video URL.');
      }
      input.value = '';
    })();
  };

  function enhanceEditorUploadLabels() {
    document.querySelectorAll('input[type="file"][data-upload-target]').forEach(function (fileInput) {
      if (fileInput.dataset.progressEnhanced === 'true') return;
      fileInput.dataset.progressEnhanced = 'true';
      fileInput.addEventListener('change', function () {
        var statusLabel = document.getElementById('status-text-' + fileInput.dataset.uploadTarget);
        if (statusLabel) ensureProgressBar(statusLabel);
      }, true);
    });
  }

  var origBindUploadInputs = window.bindUploadInputs;
  if (typeof origBindUploadInputs === 'function') window.bindUploadInputs = function () { origBindUploadInputs.apply(this, arguments); enhanceEditorUploadLabels(); };

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'INPUT' || t.type !== 'file' || !t.dataset.uploadTarget) return;
    var wrap = ensureProgressBar(document.getElementById('status-text-' + t.dataset.uploadTarget));
    if (wrap) setProgress(wrap, 1);
  }, true);

  var origRenderEditor = window.renderEditor;
  if (typeof origRenderEditor === 'function') window.renderEditor = function () {
    try { return origRenderEditor.apply(this, arguments); }
    catch (err) {
      console.warn('renderEditor error (recovered):', err);
      try { if (typeof showToast === 'function') showToast('Editor recovered from a media field error'); } catch (e2) {}
    }
  };

  /** Mobile-safe front cover autoplay: muted + inline + repeated play retries. */
  function forceCoverVideoAutoplay() {
    document.querySelectorAll('.cover video').forEach(function (video) {
      video.autoplay = true;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('autoplay', '');
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.removeAttribute('controls');
      if (video.paused) {
        var p = video.play();
        if (p && typeof p.catch === 'function') p.catch(function () {
          setTimeout(function () {
            if (video.paused) { var retry = video.play(); if (retry && typeof retry.catch === 'function') retry.catch(function () {}); }
          }, 250);
        });
      }
    });
  }

  function startCoverAutoplayRetries() {
    forceCoverVideoAutoplay();
    setTimeout(forceCoverVideoAutoplay, 100);
    setTimeout(forceCoverVideoAutoplay, 500);
    setTimeout(forceCoverVideoAutoplay, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhanceEditorUploadLabels(); startCoverAutoplayRetries(); });
  } else {
    enhanceEditorUploadLabels(); startCoverAutoplayRetries();
  }

  if (typeof MutationObserver !== 'undefined') {
    var coverObserver = new MutationObserver(function () { forceCoverVideoAutoplay(); });
    coverObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  document.addEventListener('visibilitychange', function () { if (!document.hidden) forceCoverVideoAutoplay(); });
  window.addEventListener('pageshow', forceCoverVideoAutoplay);

  console.log('[SpotLIGHT] media-upload-fix.js loaded');
})();
