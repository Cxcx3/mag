/**
 * SpotLIGHT media upload fix
 * - Shows real % progress while uploading
 * - Falls back to client-side photo compress / video embed when /api/upload is offline
 * - Fixes community spot uploader
 * - Forces front-cover video to autoplay silently on mobile
 * - Removes native video controls/buttons from the front cover
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

    if (bar) {
      bar.style.width =
        Math.max(0, Math.min(100, percent)) + '%';
    }

    if (percent >= 100) {
      setTimeout(function () {
        wrap.style.display = 'none';

        if (bar) {
          bar.style.width = '0%';
        }
      }, 800);
    }
  }

  /* =========================================================
     MEDIA UPLOAD
     ========================================================= */

  window.uploadMediaFile = function (file, progressCallback) {
    return new Promise(function (resolve, reject) {
      var formData = new FormData();
      formData.append('file', file);

      var endpoints = [
        '/api/upload',
        'api/upload',
        './api/upload'
      ];

      var attempt = 0;

      function tryNext() {
        if (attempt >= endpoints.length) {
          reject(new Error('Upload endpoint unavailable'));
          return;
        }

        var url = endpoints[attempt++];

        var xhr = new XMLHttpRequest();

        xhr.open('POST', url, true);
        xhr.timeout = 10 * 60 * 1000;

        if (xhr.upload && progressCallback) {
          xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
              progressCallback(
                Math.round((e.loaded / e.total) * 100)
              );
            }
          };
        }

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              var res = JSON.parse(xhr.responseText);

              if (res && res.url) {
                if (progressCallback) {
                  progressCallback(100);
                }

                resolve(res);
              } else {
                reject(
                  new Error('Invalid response from server')
                );
              }
            } catch (e) {
              reject(e);
            }
          } else if (
            xhr.status === 404 ||
            xhr.status === 0
          ) {
            tryNext();
          } else {
            reject(
              new Error(
                'Upload failed with status ' + xhr.status
              )
            );
          }
        };

        xhr.onerror = tryNext;

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

  window.handleSpotFileUpload = function (input) {
    if (
      !input ||
      !input.files ||
      !input.files[0]
    ) {
      return;
    }

    var file = input.files[0];

    var statusEl =
      document.getElementById('spotUploadLabel') ||
      document.getElementById('spotUploadStatus');

    var progressWrap =
      ensureProgressBar(statusEl);

    var isVideo =
      (file.type &&
        file.type.startsWith('video/')) ||
      /\.(mp4|webm|ogg|mov|m4v|avi|mkv|3gp)$/i.test(
        file.name || ''
      );

    setStatus(
      statusEl,
      '⏳ Preparing ' +
        (isVideo ? 'video' : 'photo') +
        '...'
    );

    setProgress(progressWrap, 2);

    (async function () {
      try {
        var finalUrl = '';
        var finalType = isVideo
          ? 'video'
          : 'image';

        if (!isVideo) {
          try {
            setStatus(
              statusEl,
              '⏳ Uploading photo 0%'
            );

            var uploadRes =
              await window.uploadMediaFile(
                file,
                function (percent) {
                  setStatus(
                    statusEl,
                    '⏳ Uploading photo ' +
                      percent +
                      '%'
                  );

                  setProgress(
                    progressWrap,
                    percent
                  );
                }
              );

            if (
              uploadRes &&
              uploadRes.url
            ) {
              finalUrl = uploadRes.url;
              finalType = 'image';
            }
          } catch (serverErr) {
            setStatus(
              statusEl,
              '⏳ Optimizing photo for offline...'
            );

            setProgress(
              progressWrap,
              40
            );

            if (
              typeof compressImageToDataURL ===
              'function'
            ) {
              finalUrl =
                await compressImageToDataURL(
                  file,
                  1200,
                  0.82
                );
            } else if (
              typeof readFileAsDataURL ===
              'function'
            ) {
              finalUrl =
                await readFileAsDataURL(file);
            } else {
              finalUrl =
                await new Promise(
                  function (
                    resolve,
                    reject
                  ) {
                    var r =
                      new FileReader();

                    r.onload =
                      function () {
                        resolve(
                          r.result
                        );
                      };

                    r.onerror = reject;

                    r.readAsDataURL(file);
                  }
                );
            }

            setProgress(
              progressWrap,
              100
            );
          }
        } else {
          try {
            setStatus(
              statusEl,
              '⏳ Uploading video 0%'
            );

            var vRes =
              await window.uploadMediaFile(
                file,
                function (percent) {
                  setStatus(
                    statusEl,
                    '⏳ Uploading video ' +
                      percent +
                      '%'
                  );

                  setProgress(
                    progressWrap,
                    percent
                  );
                }
              );

            if (
              vRes &&
              vRes.url
            ) {
              finalUrl = vRes.url;
              finalType =
                vRes.type || 'video';
            }
          } catch (serverErr) {
            console.warn(
              'Server upload unavailable, client fallback',
              serverErr
            );

            if (
              file.size <=
              4 * 1024 * 1024
            ) {
              setStatus(
                statusEl,
                '⏳ Embedding small video...'
              );

              setProgress(
                progressWrap,
                60
              );

              if (
                typeof readFileAsDataURL ===
                'function'
              ) {
                finalUrl =
                  await readFileAsDataURL(
                    file
                  );
              } else {
                finalUrl =
                  await new Promise(
                    function (
                      resolve,
                      reject
                    ) {
                      var r =
                        new FileReader();

                      r.onload =
                        function () {
                          resolve(
                            r.result
                          );
                        };

                      r.onerror = reject;

                      r.readAsDataURL(
                        file
                      );
                    }
                  );
              }
            } else {
              finalUrl =
                URL.createObjectURL(
                  file
                );

              if (
                typeof showToast ===
                'function'
              ) {
                showToast(
                  'Large video: use YouTube/Vimeo link or run the server for permanent upload.'
                );
              }
            }

            setProgress(
              progressWrap,
              100
            );
          }
        }

        if (!finalUrl) {
          throw new Error(
            'No media URL produced'
          );
        }

        if (
          typeof pendingSpotMediaUrl !==
          'undefined'
        ) {
          window.pendingSpotMediaUrl =
            finalUrl;
        }

        try {
          pendingSpotMediaUrl =
            finalUrl;

          pendingSpotMediaType =
            finalType;
        } catch (e) {}

        var urlInput =
          document.getElementById(
            'spotMediaUrl'
          );

        if (urlInput) {
          urlInput.value =
            finalUrl;
        }

        var preview =
          document.getElementById(
            'spotMediaPreview'
          );

        if (
          preview &&
          typeof renderMediaPreview ===
          'function'
        ) {
          preview.innerHTML =
            renderMediaPreview(
              finalUrl,
              finalType
            );
        } else if (preview) {
          preview.innerHTML =
            finalType === 'video'
              ? '<video src="' +
                finalUrl +
                '" style="max-width:100%;max-height:120px;border-radius:8px;" muted playsinline controls></video>'
              : '<img src="' +
                finalUrl +
                '" style="max-width:100%;max-height:120px;border-radius:8px;object-fit:cover;" alt="Preview">';
        }

        setStatus(
          statusEl,
          '✅ ' +
            (isVideo
              ? 'Video'
              : 'Photo') +
            ' ready — 100%'
        );

        setProgress(
          progressWrap,
          100
        );

        if (
          typeof showToast ===
          'function'
        ) {
          showToast(
            '✅ ' +
              (isVideo
                ? 'Video'
                : 'Photo') +
              ' ready!'
          );
        }
      } catch (err) {
        console.error(
          'Spot upload failed:',
          err
        );

        setStatus(
          statusEl,
          '❌ Upload failed — tap to retry'
        );

        if (progressWrap) {
          progressWrap.style.display =
            'none';
        }

        if (
          typeof showToast ===
          'function'
        ) {
          showToast(
            '❌ Upload failed. Try again or paste an image/video URL.'
          );
        }
      }

      input.value = '';
    })();
  };

  /* =========================================================
     EDITOR UPLOAD HELPERS
     ========================================================= */

  function enhanceEditorUploadLabels() {
    document
      .querySelectorAll(
        'input[type="file"][data-upload-target]'
      )
      .forEach(function (fileInput) {
        if (
          fileInput.dataset
            .progressEnhanced ===
          'true'
        ) {
          return;
        }

        fileInput.dataset.progressEnhanced =
          'true';

        fileInput.addEventListener(
          'change',
          function () {
            var statusLabel =
              document.getElementById(
                'status-text-' +
                  fileInput.dataset
                    .uploadTarget
              );

            if (statusLabel) {
              ensureProgressBar(
                statusLabel
              );
            }
          },
          true
        );
      });
  }

  var origBindUploadInputs =
    window.bindUploadInputs;

  if (
    typeof origBindUploadInputs ===
    'function'
  ) {
    window.bindUploadInputs =
      function () {
        origBindUploadInputs.apply(
          this,
          arguments
        );

        enhanceEditorUploadLabels();
      };
  }

  document.addEventListener(
    'change',
    function (e) {
      var t = e.target;

      if (
        !t ||
        t.tagName !== 'INPUT' ||
        t.type !== 'file' ||
        !t.dataset.uploadTarget
      ) {
        return;
      }

      var wrap =
        ensureProgressBar(
          document.getElementById(
            'status-text-' +
              t.dataset.uploadTarget
          )
        );

      if (wrap) {
        setProgress(wrap, 1);
      }
    },
    true
  );

  var origRenderEditor =
    window.renderEditor;

  if (
    typeof origRenderEditor ===
    'function'
  ) {
    window.renderEditor =
      function () {
        try {
          return origRenderEditor.apply(
            this,
            arguments
          );
        } catch (err) {
          console.warn(
            'renderEditor error (recovered):',
            err
          );

          try {
            if (
              typeof showToast ===
              'function'
            ) {
              showToast(
                'Editor recovered from a media field error'
              );
            }
          } catch (e2) {}
        }
      };
  }

  /* =========================================================
     FRONT COVER VIDEO — MOBILE AUTOPLAY FIX
     ========================================================= */

  function lockCoverVideo(video) {
    if (!video) return;

    /*
     * Force the properties directly.
     * Mobile Safari and Chrome are much more reliable
     * when BOTH properties and HTML attributes are set.
     */

    video.autoplay = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;

    video.setAttribute(
      'autoplay',
      ''
    );

    video.setAttribute(
      'muted',
      ''
    );

    video.setAttribute(
      'playsinline',
      ''
    );

    video.setAttribute(
      'webkit-playsinline',
      ''
    );

    video.setAttribute(
      'x5-playsinline',
      ''
    );

    video.setAttribute(
      'x5-video-player-type',
      'h5'
    );

    video.setAttribute(
      'x5-video-player-fullscreen',
      'false'
    );

    /*
     * IMPORTANT:
     * Completely remove native controls.
     */
    video.controls = false;
    video.removeAttribute(
      'controls'
    );

    /*
     * Tell browsers not to expose extra
     * download/fullscreen/PiP controls.
     */
    video.setAttribute(
      'controlslist',
      'nodownload nofullscreen noremoteplayback'
    );

    video.setAttribute(
      'disablepictureinpicture',
      ''
    );

    video.setAttribute(
      'disableremoteplayback',
      ''
    );

    /*
     * Prevent the video itself from becoming
     * an accidental interaction target.
     */
    video.style.webkitUserSelect =
      'none';

    video.style.userSelect =
      'none';

    /*
     * Start playback.
     */
    try {
      if (video.paused) {
        var playPromise =
          video.play();

        if (
          playPromise &&
          typeof playPromise.catch ===
          'function'
        ) {
          playPromise.catch(
            function () {
              /*
               * Mobile browser may not be ready
               * yet. The retry system below handles it.
               */
            }
          );
        }
      }
    } catch (e) {}
  }

  function forceCoverVideoAutoplay() {
    /*
     * Find ALL possible front-cover videos.
     */
    var videos =
      document.querySelectorAll(
        '.cover video, .cover .magazine-video, .cover-photo video'
      );

    videos.forEach(function (video) {
      lockCoverVideo(video);
    });
  }

  function retryCoverVideo() {
    forceCoverVideoAutoplay();

    /*
     * Multiple attempts are intentional.
     * The magazine dynamically creates/re-renders
     * the cover, especially on mobile.
     */
    setTimeout(
      forceCoverVideoAutoplay,
      50
    );

    setTimeout(
      forceCoverVideoAutoplay,
      150
    );

    setTimeout(
      forceCoverVideoAutoplay,
      300
    );

    setTimeout(
      forceCoverVideoAutoplay,
      600
    );

    setTimeout(
      forceCoverVideoAutoplay,
      1000
    );

    setTimeout(
      forceCoverVideoAutoplay,
      2000
    );

    setTimeout(
      forceCoverVideoAutoplay,
      3500
    );
  }

  /* =========================================================
     HIDE MOBILE NATIVE VIDEO UI
     ========================================================= */

  function installCoverVideoCSS() {
    if (
      document.getElementById(
        'spotlight-cover-video-lock'
      )
    ) {
      return;
    }

    var style =
      document.createElement(
        'style'
      );

    style.id =
      'spotlight-cover-video-lock';

    style.textContent = `
      /*
       * SpotLIGHT front-cover video:
       * no native controls / play overlay.
       */

      .cover video,
      .cover .magazine-video,
      .cover-photo video {
        -webkit-appearance: none !important;
        appearance: none !important;
        outline: none !important;
        border: 0 !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -webkit-touch-callout: none !important;
      }

      .cover video::-webkit-media-controls {
        display: none !important;
      }

      .cover video::-webkit-media-controls-enclosure {
        display: none !important;
      }

      .cover video::-webkit-media-controls-panel {
        display: none !important;
      }

      .cover video::-webkit-media-controls-play-button {
        display: none !important;
        -webkit-appearance: none !important;
      }

      .cover video::-webkit-media-controls-start-playback-button {
        display: none !important;
        -webkit-appearance: none !important;
      }

      .cover video::-webkit-media-controls-overlay-play-button {
        display: none !important;
        -webkit-appearance: none !important;
      }

      .cover video::-webkit-media-controls-timeline {
        display: none !important;
      }

      .cover video::-webkit-media-controls-current-time-display {
        display: none !important;
      }

      .cover video::-webkit-media-controls-time-remaining-display {
        display: none !important;
      }

      .cover video::-webkit-media-controls-fullscreen-button {
        display: none !important;
      }

      .cover video::-webkit-media-controls-volume-slider {
        display: none !important;
      }

      .cover video::-webkit-media-controls-mute-button {
        display: none !important;
      }

      .cover video::-webkit-media-controls-toggle-closed-captions-button {
        display: none !important;
      }

      .cover video::-webkit-media-controls-picture-in-picture-button {
        display: none !important;
      }
    `;

    document.head.appendChild(style);
  }

  /* =========================================================
     STARTUP
     ========================================================= */

  function startSpotlightVideoFix() {
    installCoverVideoCSS();
    enhanceEditorUploadLabels();
    retryCoverVideo();
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      startSpotlightVideoFix
    );
  } else {
    startSpotlightVideoFix();
  }

  /* =========================================================
     WATCH FOR DYNAMIC COVER RENDERING
     ========================================================= */

  if (
    typeof MutationObserver !==
    'undefined'
  ) {
    var coverObserver =
      new MutationObserver(
        function () {
          /*
           * The cover can be rebuilt by the
           * magazine's page/flip system.
           */
          forceCoverVideoAutoplay();
        }
      );

    coverObserver.observe(
      document.documentElement,
      {
        childList: true,
        subtree: true
      }
    );
  }

  /* =========================================================
     MOBILE PAGE / APP RETURN
     ========================================================= */

  document.addEventListener(
    'visibilitychange',
    function () {
      if (!document.hidden) {
        retryCoverVideo();
      }
    }
  );

  window.addEventListener(
    'pageshow',
    function () {
      retryCoverVideo();
    }
  );

  window.addEventListener(
    'focus',
    function () {
      retryCoverVideo();
    }
  );

  /* =========================================================
     EXTRA MOBILE EVENTS
     ========================================================= */

  document.addEventListener(
    'touchstart',
    function () {
      /*
       * If the browser allows autoplay after the
       * first interaction, immediately make sure
       * the cover starts.
       */
      forceCoverVideoAutoplay();
    },
    {
      passive: true,
      once: true
    }
  );

  document.addEventListener(
    'pointerdown',
    function () {
      forceCoverVideoAutoplay();
    },
    {
      passive: true,
      once: true
    }
  );

  console.log(
    '[SpotLIGHT] media-upload-fix.js loaded — mobile cover autoplay locked'
  );

})();
