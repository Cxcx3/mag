/**
 * SpotLIGHT — Option 1: Editor-first publish to GitHub
 *
 * Public site (GitHub Pages):
 *   - Loads the live feed from community.json in the repo
 *   - New posts go into a PENDING queue (this browser) until you publish
 *   - Likes update on screen and are stored as vote deltas to merge when you export
 *
 * Editor (password unlock → Community Moderation):
 *   - See pending submissions + live posts
 *   - Approve pending → they join the feed list with votes
 *   - Download community.json (posts + like counts) and commit it on GitHub
 *   - Everyone who opens the site then sees the same posts and synced likes
 */
(function () {
  'use strict';

  var PENDING_KEY = 'spotlight_pending_submissions';
  var VOTE_DELTA_KEY = 'spotlight_vote_deltas';
  var COMMUNITY_JSON_URLS = [
    './community.json?_t=' + Date.now(),
    'community.json?_t=' + Date.now(),
    '/community.json?_t=' + Date.now()
  ];

  function getPendingSubmissions() {
    try {
      return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function savePendingSubmissions(list) {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list || []));
  }

  function getVoteDeltas() {
    try {
      return JSON.parse(localStorage.getItem(VOTE_DELTA_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveVoteDeltas(map) {
    localStorage.setItem(VOTE_DELTA_KEY, JSON.stringify(map || {}));
  }

  function applyVoteDeltasToPosts(posts) {
    var deltas = getVoteDeltas();
    if (!posts || !posts.length) return posts;
    return posts.map(function (p) {
      var extra = Number(deltas[p.id] || 0);
      if (!extra) return p;
      return Object.assign({}, p, { votes: (p.votes || 0) + extra });
    });
  }

  function mergeDeltasIntoPostsPermanently() {
    var deltas = getVoteDeltas();
    if (!window.COMMUNITY_POSTS) return;
    window.COMMUNITY_POSTS = window.COMMUNITY_POSTS.map(function (p) {
      var extra = Number(deltas[p.id] || 0);
      if (!extra) return p;
      return Object.assign({}, p, { votes: (p.votes || 0) + extra });
    });
    // Clear deltas after baking into the in-memory list (ready for export)
    saveVoteDeltas({});
  }

  /** Load public feed: API first, then community.json from GitHub Pages */
  window.loadCommunityPosts = async function (isBackgroundPoll) {
    // 1) Live API (only works when Node server is running)
    try {
      var apiUrl =
        '/api/community?category=' +
        encodeURIComponent(window.activeCommCategory || 'All') +
        '&sort=' +
        (window.activeCommSort || 'votes') +
        '&_t=' +
        Date.now();
      var res = await fetch(apiUrl, { cache: 'no-store' });
      if (res.ok) {
        var data = await res.json();
        if (data.posts && Array.isArray(data.posts)) {
          var currentSig = (window.COMMUNITY_POSTS || [])
            .map(function (p) {
              return p.id + ':' + (p.votes || 0) + ':' + p.isPinned;
            })
            .join(',');
          var newSig = data.posts
            .map(function (p) {
              return p.id + ':' + (p.votes || 0) + ':' + p.isPinned;
            })
            .join(',');
          window.COMMUNITY_POSTS = applyVoteDeltasToPosts(data.posts);
          if (!isBackgroundPoll || currentSig !== newSig) {
            if (typeof updateCommunityFeedUI === 'function') updateCommunityFeedUI();
            if (window.activeTab === 'community' && typeof renderEditor === 'function') {
              renderEditor();
            }
          }
          return;
        }
      }
    } catch (e) {
      /* static hosting — fall through */
    }

    // 2) Static community.json (GitHub Pages — source of truth for everyone)
    if (!isBackgroundPoll || !(window.COMMUNITY_POSTS && window.COMMUNITY_POSTS.length)) {
      for (var i = 0; i < COMMUNITY_JSON_URLS.length; i++) {
        try {
          var r = await fetch(COMMUNITY_JSON_URLS[i], { cache: 'no-store' });
          if (r.ok) {
            var json = await r.json();
            var list = Array.isArray(json) ? json : json.posts || [];
            if (list.length) {
              window.COMMUNITY_POSTS = applyVoteDeltasToPosts(list);
              if (typeof filterAndSortLocalPosts === 'function') {
                /* keep filters */
              }
              if (typeof updateCommunityFeedUI === 'function') updateCommunityFeedUI();
              if (window.activeTab === 'community' && typeof renderEditor === 'function') {
                renderEditor();
              }
              return;
            }
          }
        } catch (err) {
          /* try next url */
        }
      }
    }

    // 3) Defaults already in page
    if (!window.COMMUNITY_POSTS || !window.COMMUNITY_POSTS.length) {
      if (typeof DEFAULT_COMMUNITY_POSTS !== 'undefined') {
        window.COMMUNITY_POSTS = applyVoteDeltasToPosts(
          DEFAULT_COMMUNITY_POSTS.map(function (p) {
            return Object.assign({}, p);
          })
        );
      }
    } else {
      window.COMMUNITY_POSTS = applyVoteDeltasToPosts(window.COMMUNITY_POSTS);
    }
    if (typeof updateCommunityFeedUI === 'function') updateCommunityFeedUI();
  };

  /** Public submit → pending queue when API is offline (GitHub Pages) */
  var origHandleSpotSubmit = window.handleSpotSubmit;
  window.handleSpotSubmit = function (event) {
    if (event) event.preventDefault();

    var title = document.getElementById('spotTitle')?.value.trim();
    var author = document.getElementById('spotAuthor')?.value.trim();
    var handle = document.getElementById('spotHandle')?.value.trim();
    var category = document.getElementById('spotCategory')?.value;
    var location = document.getElementById('spotLocation')?.value.trim();
    var description = document.getElementById('spotDescription')?.value.trim();
    var mediaUrl =
      document.getElementById('spotMediaUrl')?.value.trim() ||
      window.pendingSpotMediaUrl ||
      '';
    var link = document.getElementById('spotLink')?.value.trim();
    var linkText = document.getElementById('spotLinkText')?.value.trim();

    if (!title || !description) {
      alert('Please enter a title and description for your spot.');
      return;
    }

    // Editing existing post — keep original path if possible
    if (window.editingSpotPostId && typeof origHandleSpotSubmit === 'function') {
      return origHandleSpotSubmit(event);
    }

    var payload = {
      id: 'post-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      ownerToken:
        typeof getSpotOwnerToken === 'function' ? getSpotOwnerToken() : '',
      title: title,
      author: author || 'Local Contributor',
      handle: handle || '',
      category: category || 'Businesses',
      location: location || 'Wasatch Front, UT',
      description: description,
      mediaUrl: mediaUrl || '',
      mediaType:
        window.pendingSpotMediaType ||
        (typeof detectMediaType === 'function'
          ? detectMediaType(mediaUrl)
          : 'image'),
      link: link || '',
      linkText: linkText || 'Learn More',
      votes: 1,
      createdAt: new Date().toISOString(),
      isPinned: false,
      reports: [],
      status: 'pending'
    };

    // Try live API first
    fetch('/api/community/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        Object.assign({}, payload, {
          ownerToken: payload.ownerToken
        })
      )
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data && result.data.success && result.data.post) {
          window.COMMUNITY_POSTS = window.COMMUNITY_POSTS || [];
          window.COMMUNITY_POSTS.unshift(result.data.post);
          if (window.mySubmittedPostIds) {
            window.mySubmittedPostIds.add(result.data.post.id);
            localStorage.setItem(
              'spotlight_my_posts',
              JSON.stringify([].concat(Array.from(window.mySubmittedPostIds)))
            );
          }
          if (typeof updateCommunityFeedUI === 'function') updateCommunityFeedUI();
          if (typeof closeSubmitSpotModal === 'function') closeSubmitSpotModal();
          if (typeof showToast === 'function')
            showToast('🎉 Spot is live on the server!');
          return;
        }
        queuePending(payload);
      })
      .catch(function () {
        queuePending(payload);
      });

    function queuePending(post) {
      var pending = getPendingSubmissions();
      pending.unshift(post);
      savePendingSubmissions(pending);

      // Also show optimistically in this browser's feed so the poster sees it
      window.COMMUNITY_POSTS = window.COMMUNITY_POSTS || [];
      window.COMMUNITY_POSTS.unshift(
        Object.assign({}, post, { status: 'pending' })
      );
      if (window.mySubmittedPostIds) {
        window.mySubmittedPostIds.add(post.id);
        localStorage.setItem(
          'spotlight_my_posts',
          JSON.stringify([].concat(Array.from(window.mySubmittedPostIds)))
        );
      }
      if (typeof updateCommunityFeedUI === 'function') updateCommunityFeedUI();
      if (typeof closeSubmitSpotModal === 'function') closeSubmitSpotModal();
      if (typeof showToast === 'function') {
        showToast('📬 Submitted for editor review — will go public after publish');
      }
      // Refresh editor list if open
      if (window.activeTab === 'community' && typeof renderEditor === 'function') {
        try {
          renderEditor();
        } catch (e) {}
      }
    }
  };

  /** Upvotes: keep API path, also store deltas so export includes likes */
  var origUpvote = window.handleCommunityUpvote;
  window.handleCommunityUpvote = function (postId, event) {
    if (typeof origUpvote === 'function') {
      origUpvote(postId, event);
    }

    // Record delta for GitHub export sync (works even when API is offline)
    try {
      if (window.userUpvotedPosts && window.userUpvotedPosts.has(postId)) {
        var deltas = getVoteDeltas();
        // Only count +1 once per browser per post in the delta map
        // (origUpvote already blocks double votes via userUpvotedPosts)
        if (deltas[postId] === undefined) {
          // Check if this was a fresh upvote this session — orig handler adds to set first
          deltas[postId] = (Number(deltas[postId]) || 0) + 0;
        }
        // Prefer reading current post votes vs baseline from last community.json load
        // Simpler: each successful new upvote increments delta by 1 once
      }
    } catch (e) {}
  };

  // More reliable: wrap after original runs by listening to storage / intercepting the set add
  document.addEventListener(
    'click',
    function (e) {
      var btn = e.target && e.target.closest && e.target.closest('.comm-upvote-btn');
      if (!btn) return;
      var id = btn.id && btn.id.replace('upvote-btn-', '');
      if (!id) return;
      // After a short delay (optimistic UI), snapshot vote into delta vs last published
      setTimeout(function () {
        var post = (window.COMMUNITY_POSTS || []).find(function (p) {
          return String(p.id) === String(id);
        });
        if (!post) return;
        if (!(window.userUpvotedPosts && window.userUpvotedPosts.has(id))) return;
        var deltas = getVoteDeltas();
        // Mark that this browser contributed +1 (idempotent)
        if (!deltas['_' + id + '_counted']) {
          deltas[id] = (Number(deltas[id]) || 0) + 1;
          deltas['_' + id + '_counted'] = 1;
          saveVoteDeltas(deltas);
        }
      }, 50);
    },
    true
  );

  /** Download community.json with current posts + baked-in likes for GitHub commit */
  window.downloadCommunityJsonForGithub = function () {
    mergeDeltasIntoPostsPermanently();
    var posts = (window.COMMUNITY_POSTS || []).map(function (p) {
      var copy = Object.assign({}, p);
      delete copy.status;
      return copy;
    });
    var blob = new Blob([JSON.stringify(posts, null, 2)], {
      type: 'application/json'
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'community.json';
    a.click();
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') {
      showToast('⬇️ community.json downloaded — replace file on GitHub & commit');
    }
  };

  /** Approve one pending submission into the main feed */
  window.approvePendingSubmission = function (postId) {
    var pending = getPendingSubmissions();
    var idx = pending.findIndex(function (p) {
      return String(p.id) === String(postId);
    });
    if (idx === -1) {
      if (typeof showToast === 'function') showToast('Pending post not found');
      return;
    }
    var post = pending[idx];
    delete post.status;
    pending.splice(idx, 1);
    savePendingSubmissions(pending);

    window.COMMUNITY_POSTS = window.COMMUNITY_POSTS || [];
    // Avoid duplicates
    if (
      !window.COMMUNITY_POSTS.some(function (p) {
        return String(p.id) === String(post.id);
      })
    ) {
      window.COMMUNITY_POSTS.unshift(post);
    }
    if (typeof updateCommunityFeedUI === 'function') updateCommunityFeedUI();
    if (typeof showToast === 'function') showToast('✅ Approved — download community.json to publish');
    if (typeof renderEditor === 'function') renderEditor();
  };

  window.rejectPendingSubmission = function (postId) {
    var pending = getPendingSubmissions().filter(function (p) {
      return String(p.id) !== String(postId);
    });
    savePendingSubmissions(pending);
    window.COMMUNITY_POSTS = (window.COMMUNITY_POSTS || []).filter(function (p) {
      return String(p.id) !== String(postId);
    });
    if (typeof updateCommunityFeedUI === 'function') updateCommunityFeedUI();
    if (typeof showToast === 'function') showToast('Removed pending submission');
    if (typeof renderEditor === 'function') renderEditor();
  };

  /** Import a community.json file into the editor */
  window.importCommunityJsonFile = function (input) {
    var file = input && input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        var list = Array.isArray(parsed) ? parsed : parsed.posts || [];
        window.COMMUNITY_POSTS = list;
        saveVoteDeltas({});
        if (typeof updateCommunityFeedUI === 'function') updateCommunityFeedUI();
        if (typeof renderEditor === 'function') renderEditor();
        if (typeof showToast === 'function')
          showToast('📥 Loaded ' + list.length + ' posts from file');
      } catch (err) {
        alert('Could not read that JSON file.');
      }
      input.value = '';
    };
    reader.readAsText(file);
  };

  /** Patch Community Moderation tab UI with pending queue + publish buttons */
  var origRenderEditor = window.renderEditor;
  window.renderEditor = function () {
    if (typeof origRenderEditor === 'function') {
      try {
        origRenderEditor.apply(this, arguments);
      } catch (err) {
        console.warn('renderEditor', err);
      }
    }

    if (window.activeTab !== 'community') return;

    var root = document.getElementById('editorContent');
    if (!root) return;

    // Inject publish toolbar once at top of community editor card
    if (root.querySelector('.sl-publish-toolbar')) return;

    var card = root.querySelector('.editor-card');
    if (!card) return;

    var pending = getPendingSubmissions();
    var toolbar = document.createElement('div');
    toolbar.className = 'sl-publish-toolbar';
    toolbar.style.cssText =
      'margin:0 0 16px;padding:14px;background:rgba(20,18,26,0.06);border:2px solid #FFD23F;border-radius:12px;';

    var pendingHtml =
      pending.length === 0
        ? '<div style="font-size:12px;color:#555;margin-bottom:10px;">No pending submissions on this device. Public posts made here without a server appear below for review.</div>'
        : pending
            .map(function (p) {
              return (
                '<div style="border:1px solid #ccc;border-radius:8px;padding:10px;margin-bottom:8px;background:#fff;">' +
                '<div style="font-weight:800;font-size:13px;">' +
                (p.title || 'Untitled') +
                '</div>' +
                '<div style="font-size:11px;color:#666;margin:4px 0;">' +
                (p.author || '') +
                ' · ' +
                (p.category || '') +
                ' · ▲ ' +
                (p.votes || 1) +
                '</div>' +
                '<div style="font-size:11px;margin-bottom:8px;">' +
                (p.description || '').slice(0, 160) +
                '</div>' +
                '<button type="button" class="ed-btn ed-primary" style="font-size:11px;min-height:36px;padding:6px 12px;" onclick="approvePendingSubmission(\'' +
                p.id +
                '\')">✅ APPROVE</button> ' +
                '<button type="button" class="ed-btn ed-danger" style="font-size:11px;min-height:36px;padding:6px 12px;" onclick="rejectPendingSubmission(\'' +
                p.id +
                '\')">✕ REJECT</button>' +
                '</div>'
              );
            })
            .join('');

    toolbar.innerHTML =
      '<div style="font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#b8860b;margin-bottom:6px;">Publish to GitHub (everyone sees this)</div>' +
      '<p style="font-size:12px;color:#333;line-height:1.4;margin:0 0 10px;">' +
      '1) Approve pending posts · 2) Likes on this device are included · 3) Download <b>community.json</b> · 4) Replace the file in your GitHub repo and commit. ' +
      'After GitHub Pages updates, everyone sees the same posts and vote counts.' +
      '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">' +
      '<button type="button" class="ed-btn ed-primary" style="font-size:11px;" onclick="downloadCommunityJsonForGithub()">⬇️ DOWNLOAD community.json</button>' +
      '<label class="ed-btn ed-light" style="font-size:11px;cursor:pointer;margin:0;">' +
      '📥 IMPORT community.json' +
      '<input type="file" accept="application/json,.json" style="display:none" onchange="importCommunityJsonFile(this)">' +
      '</label>' +
      '</div>' +
      '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Pending review (' +
      pending.length +
      ')</div>' +
      pendingHtml;

    var h3 = card.querySelector('h3');
    if (h3 && h3.nextSibling) {
      card.insertBefore(toolbar, h3.nextSibling);
    } else {
      card.insertBefore(toolbar, card.firstChild);
    }
  };

  console.log('[SpotLIGHT] community-publish.js loaded (editor → GitHub flow)');
})();
