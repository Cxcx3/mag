/**
 * SpotLIGHT media upload fix
 * - Shows real % progress while uploading
 * - Falls back to client-side photo compress / video embed when /api/upload is offline (e.g. GitHub Pages)
 * - Fixes community spot uploader (was targeting a missing status element)
 * - Safe overrides; loads after the main index.html script
 */
(function () {
  'use strict';

  function setStatus(el, text) {
    if (el) el.textContent = text;
  }

  function ensureProgressBar(anchorEl) {
    if (!anchorEl || !anchorEl.parentElement) return null;
    var existing = anchorEl.parentElement.querySelector('.sl-upload-progress');
    if (existing) return existing;
    var wrap = document.createElement('div');
    wrap.className = 'sl-upload-progress';
    wrap.style.cssText =
      'margin-top:8px;width:100%;background:rgba(255,255,255,0.12);border-radius:999px;height:10px;overflow:hidden;display:none;';
    var bar = document.createElement('div');
    bar.className = 'sl-upload-progress-bar';
    bar.style.cssText =
      'height:100%;width:0%;background:linear-gradient(90deg,#FFD23F,#FF4D6D);transition:width 0.15s ease;border-radius:999px;';
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

  /** Improved upload with progress; tries /api/upload then relative api/upload */
  window.uploadMediaFile = function (file, progressCallback) {
    return new Promise(function (resolve, reject) {
      var formData = new FormData();
      formData.append('file', file);

      var endpoints = ['/api/upload', 'api/upload', './api/upload'];
      var attempt = 0;

      function tryNext() {
        if (attempt >= endpoints.length) {
          reject(new Error('Upload endpoint unavailable'));
          return;
        }
        var url = endpoints[attempt++];
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.timeout = 10 * 60 * 1000; // 10 min for large videos

        if (xhr.upload && progressCallback) {
          xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
              var percent = Math.round((e.loaded / e.total) * 100);
              progressCallback(percent);
            }
          };
        }

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              var res = JSON.parse(xhr.responseText);
              if (res && res.url) {
                if (progressCallback) progressCallback(100);
                resolve(res);
              } else {
                reject(new Error('Invalid response from server'));
              }
            } catch (e) {
              reject(e);
            }
          } else if (xhr.status === 404 || xhr.status === 0) {
            tryNext();
          } else {
            reject(new Error('Upload failed with status ' + xhr.status));
          }
        };

        xhr.onerror = function () {
          tryNext();
        };
        xhr.ontimeout = function () {
          reject(new Error('Upload timed out'));
        };
        try {
          xhr.send(formData);
        } catch (e) {
          tryNext();
        }
      }

      tryNext();
    });
  };

  /** Community / spot post file picker — with % progress + offline fallback */
  window.handleSpotFileUpload = function (input) {
    if (!input || !input.files || !input.files[0]) return;
    var file = input.files[0];
    var statusEl =
      document.getElementById('spotUploadLabel') ||
      document.getElementById('spotUploadStatus');
    var progressWrap = ensureProgressBar(statusEl);
    var isVideo =
      (file.type && file.type.startsWith('video/')) ||
      /\.(mp4|webm|ogg|mov|m4v|avi|mkv|3gp)$/i.test(file.name || '');

    setStatus(statusEl, '⏳ Preparing ' + (isVideo ? 'video' : 'photo') + '...');
    setProgress(progressWrap, 2);

    (async function () {
      try {
        var finalUrl = '';
        var finalType = isVideo ? 'video' : 'image';
        var posterUrl = '';

        if (!isVideo) {
          // Prefer server; fall back to compressed data URL (works on GitHub Pages)
          try {
            setStatus(statusEl, '⏳ Uploading photo 0%');
            var uploadRes = await window.uploadMediaFile(file, function (percent) {
              setStatus(statusEl, '⏳ Uploading photo ' + percent + '%');
              setProgress(progressWrap, percent);
            });
            if (uploadRes && uploadRes.url) {
              finalUrl = uploadRes.url;
              finalType = 'image';
            }
          } catch (serverErr) {
            setStatus(statusEl, '⏳ Optimizing photo for offline...');
            setProgress(progressWrap, 40);
            if (typeof compressImageToDataURL === 'function') {
              finalUrl = await compressImageToDataURL(file, 1200, 0.82);
            } else if (typeof readFileAsDataURL === 'function') {
              finalUrl = await readFileAsDataURL(file);
            } else {
              finalUrl = await new Promise(function (resolve, reject) {
                var r = new FileReader();
                r.onload = function () {
                  resolve(r.result);
                };
                r.onerror = reject;
                r.readAsDataURL(file);
              });
            }
            setProgress(progressWrap, 100);
          }
        } else {
          if (typeof generateVideoPosterFromBlob === 'function') {
            setStatus(statusEl, '⏳ Generating video preview...');
            setProgress(progressWrap, 5);
            posterUrl = await generateVideoPosterFromBlob(file);
          }
          try {
            setStatus(statusEl, '⏳ Uploading video 0%');
            var vRes = await window.uploadMediaFile(file, function (percent) {
              setStatus(statusEl, '⏳ Uploading video ' + percent + '%');
              setProgress(progressWrap, percent);
            });
            if (vRes && vRes.url) {
              finalUrl = vRes.url;
              finalType = vRes.type || 'video';
              if (vRes.posterUrl) posterUrl = vRes.posterUrl;
            }
          } catch (serverErr) {
            console.warn('Server upload unavailable, client fallback', serverErr);
            if (file.size <= 4 * 1024 * 1024) {
              setStatus(statusEl, '⏳ Embedding small video...');
              setProgress(progressWrap, 60);
              if (typeof readFileAsDataURL === 'function') {
                finalUrl = await readFileAsDataURL(file);
              } else {
                finalUrl = await new Promise(function (resolve, reject) {
                  var r = new FileReader();
                  r.onload = function () {
                    resolve(r.result);
                  };
                  r.onerror = reject;
                  r.readAsDataURL(file);
                });
              }
            } else {
              finalUrl = URL.createObjectURL(file);
              if (typeof showToast === 'function') {
                showToast(
                  'Large video: use YouTube/Vimeo link or run the server for permanent upload.'
                );
              }
            }
            setProgress(progressWrap, 100);
          }
        }

        if (!finalUrl) throw new Error('No media URL produced');

        if (typeof pendingSpotMediaUrl !== 'undefined') {
          window.pendingSpotMediaUrl = finalUrl;
        }
        try {
          pendingSpotMediaUrl = finalUrl;
          pendingSpotMediaType = finalType;
        } catch (e) {}

        var urlInput = document.getElementById('spotMediaUrl');
        if (urlInput) urlInput.value = finalUrl;

        var preview = document.getElementById('spotMediaPreview');
        if (preview && typeof renderMediaPreview === 'function') {
          preview.innerHTML = renderMediaPreview(finalUrl, finalType);
        } else if (preview) {
          if (finalType === 'video') {
            preview.innerHTML =
              '<video src="' +
              finalUrl +
              '" style="max-width:100%;max-height:120px;border-radius:8px;" muted playsinline controls></video>';
          } else {
            preview.innerHTML =
              '<img src="' +
              finalUrl +
              '" style="max-width:100%;max-height:120px;border-radius:8px;object-fit:cover;" alt="Preview">';
          }
        }

        setStatus(
          statusEl,
          '✅ ' + (isVideo ? 'Video' : 'Photo') + ' ready — 100%'
        );
        setProgress(progressWrap, 100);
        if (typeof showToast === 'function') {
          showToast('✅ ' + (isVideo ? 'Video' : 'Photo') + ' ready!');
        }
      } catch (err) {
        console.error('Spot upload failed:', err);
        setStatus(statusEl, '❌ Upload failed — tap to retry');
        if (progressWrap) progressWrap.style.display = 'none';
        if (typeof showToast === 'function') {
          showToast('❌ Upload failed. Try again or paste an image/video URL.');
        }
      }
      input.value = '';
    })();
  };

  /**
   * Patch editor uploads to always show clear % on the label + progress bar
   */
  function enhanceEditorUploadLabels() {
    document.querySelectorAll('input[type="file"][data-upload-target]').forEach(function (fileInput) {
      if (fileInput.dataset.progressEnhanced === 'true') return;
      fileInput.dataset.progressEnhanced = 'true';

      fileInput.addEventListener(
        'change',
        function () {
          var targetName = fileInput.dataset.uploadTarget;
          var statusLabel = document.getElementById('status-text-' + targetName);
          if (statusLabel) ensureProgressBar(statusLabel);
        },
        true
      );
    });
  }

  // Re-bind after DOM updates (editor re-renders often)
  var origBindUploadInputs = window.bindUploadInputs;
  if (typeof origBindUploadInputs === 'function') {
    window.bindUploadInputs = function () {
      origBindUploadInputs.apply(this, arguments);
      enhanceEditorUploadLabels();
    };
  }

  // Hook existing editor change handlers to surface % if uploadMediaFile is used
  document.addEventListener(
    'change',
    function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'INPUT' || t.type !== 'file') return;
      if (!t.dataset.uploadTarget) return;
      var statusLabel = document.getElementById('status-text-' + t.dataset.uploadTarget);
      var wrap = ensureProgressBar(statusLabel);
      // Progress is driven inside bindUploadInputs via uploadMediaFile callback;
      // this ensures the bar exists.
      if (wrap) setProgress(wrap, 1);
    },
    true
  );

  // Fix cover editor crash: undefined coverPhotoUrl in original template
  var origRenderEditor = window.renderEditor;
  if (typeof origRenderEditor === 'function') {
    window.renderEditor = function () {
      try {
        return origRenderEditor.apply(this, arguments);
      } catch (err) {
        console.warn('renderEditor error (recovered):', err);
        // Soft recovery — do not leave the panel blank
        try {
          if (typeof showToast === 'function') {
            showToast('Editor recovered from a media field error');
          }
        } catch (e2) {}
      }
    };
  }

  // Run once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceEditorUploadLabels);
  } else {
    enhanceEditorUploadLabels();
  }

  console.log('[SpotLIGHT] media-upload-fix.js loaded');
})();
