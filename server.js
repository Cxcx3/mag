import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { execFile } from 'child_process';
import util from 'util';
import { GoogleGenAI } from '@google/genai';

const execFilePromise = util.promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Lazy GenAI initialization
let _genAI = null;
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!_genAI) {
    _genAI = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return _genAI;
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Transcode video to 1080p faststart H.264 MP4 with yuv420p for 100% universal mobile playback
async function transcodeVideoForMobile(inputPath, outputPath, posterPath) {
  try {
    // 1. Transcode video with libx264, baseline-compatible parameters, yuv420p, max 1080p, faststart moov atom
    await execFilePromise('ffmpeg', [
      '-y',
      '-i', inputPath,
      '-vf', "scale='min(1080,iw)':-2",
      '-c:v', 'libx264',
      '-profile:v', 'high',
      '-level', '4.1',
      '-pix_fmt', 'yuv420p',
      '-crf', '23',
      '-preset', 'veryfast',
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-ac', '2',
      outputPath
    ]);

    // 2. Extract first-frame thumbnail poster for instant mobile display
    if (posterPath) {
      try {
        await execFilePromise('ffmpeg', [
          '-y',
          '-i', outputPath,
          '-ss', '00:00:00.500',
          '-frames:v', '1',
          '-vf', "scale='min(1080,iw)':-2",
          '-q:v', '2',
          posterPath
        ]);
      } catch (pe) {
        console.warn('Poster thumbnail extraction warning:', pe.message);
      }
    }
    return true;
  } catch (err) {
    console.error('FFmpeg transcoding error:', err);
    return false;
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 150 * 1024 * 1024 } // 150MB limit for high-res videos
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder with range support and proper mobile video streaming headers
app.use('/uploads', express.static(uploadsDir, {
  acceptRanges: true,
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    const ext = path.extname(filePath).toLowerCase();
    if (['.mp4', '.m4v', '.mov'].includes(ext)) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'inline');
    } else if (ext === '.webm') {
      res.setHeader('Content-Type', 'video/webm');
      res.setHeader('Content-Disposition', 'inline');
    } else if (['.ogg', '.ogv'].includes(ext)) {
      res.setHeader('Content-Type', 'video/ogg');
      res.setHeader('Content-Disposition', 'inline');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.webp') {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));

// If an upload is not found, return 404, never fallback to index.html
app.use('/uploads', (req, res) => {
  res.status(404).json({ error: 'Uploaded file not found' });
});

// Explicit no-cache endpoint for data.json
app.get(['/data.json', '/api/data'], (req, res) => {
  const dataPath = path.join(__dirname, 'data.json');
  if (fs.existsSync(dataPath)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.sendFile(dataPath);
  } else {
    res.status(404).json({ error: 'data.json not found' });
  }
});

// Upload endpoint for images and videos with auto-transcoding
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const origExt = path.extname(req.file.originalname).toLowerCase();
  const mime = (req.file.mimetype || '').toLowerCase();
  const isVideo = mime.startsWith('video/') || ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.3gp', '.ogv', '.flv', '.wmv', '.ts'].includes(origExt);

  if (isVideo) {
    const baseName = path.basename(req.file.filename, path.extname(req.file.filename));
    const optFileName = `${baseName}.mp4`;
    const tempInputPath = req.file.path;
    const optOutputPath = path.join(uploadsDir, `${baseName}-web.mp4`);
    const posterFileName = `${baseName}-poster.jpg`;
    const posterPath = path.join(uploadsDir, posterFileName);

    try {
      const success = await transcodeVideoForMobile(tempInputPath, optOutputPath, posterPath);
      if (success && fs.existsSync(optOutputPath)) {
        const finalUrlPath = path.join(uploadsDir, optFileName);
        if (tempInputPath !== finalUrlPath && fs.existsSync(tempInputPath)) {
          try { fs.unlinkSync(tempInputPath); } catch(e){}
        }
        fs.renameSync(optOutputPath, finalUrlPath);

        return res.json({
          success: true,
          url: `/uploads/${optFileName}`,
          posterUrl: fs.existsSync(posterPath) ? `/uploads/${posterFileName}` : undefined,
          type: 'video',
          filename: optFileName,
          optimized: true
        });
      }
    } catch (err) {
      console.warn('Transcode fallback to original:', err);
    }

    // Fallback if transcoding didn't complete
    return res.json({
      success: true,
      url: `/uploads/${req.file.filename}`,
      type: 'video',
      filename: req.file.filename
    });
  }

  return res.json({
    success: true,
    url: `/uploads/${req.file.filename}`,
    type: 'image',
    filename: req.file.filename,
    size: req.file.size
  });
});

// Save magazine data directly to data.json on server
app.post(['/api/save', '/api/data'], async (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data' });
    }
    const dataPath = path.join(__dirname, 'data.json');
    await fs.promises.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8');
    return res.json({ success: true });
  } catch (err) {
    console.error('Error saving data.json:', err);
    return res.status(500).json({ error: 'Failed to save data' });
  }
});

// Community Feed helper functions
const communityPath = path.join(__dirname, 'community.json');

async function getCommunityPosts() {
  if (!fs.existsSync(communityPath)) {
    return [];
  }
  try {
    const raw = await fs.promises.readFile(communityPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading community.json:', e);
    return [];
  }
}

async function saveCommunityPosts(posts) {
  try {
    await fs.promises.writeFile(communityPath, JSON.stringify(posts, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing community.json:', e);
    return false;
  }
}

// GET Community Posts with optional category filtering and sorting (votes or newest)
app.get('/api/community', async (req, res) => {
  try {
    let posts = await getCommunityPosts();
    const { category, sort } = req.query;

    if (category && category !== 'All') {
      posts = posts.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
    }

    if (sort === 'newest') {
      posts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      // Default: Trending / Highest Votes. Pinned posts always stay at the top.
      posts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.votes || 0) - (a.votes || 0);
      });
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.json({ success: true, posts });
  } catch (err) {
    console.error('Community fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch community posts' });
  }
});

// POST Upvote a Community Post
app.post('/api/community/upvote', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Post ID required' });
    }

    const posts = await getCommunityPosts();
    const post = posts.find(p => p.id === id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.votes = (post.votes || 0) + 1;
    await saveCommunityPosts(posts);

    return res.json({ success: true, id, votes: post.votes });
  } catch (err) {
    console.error('Upvote error:', err);
    return res.status(500).json({ error: 'Failed to record vote' });
  }
});

// POST Submit a New Community Spot
app.post('/api/community/post', async (req, res) => {
  try {
    const { ownerToken, title, author, handle, category, location, description, mediaUrl, mediaType, link, linkText } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const validCategories = [
      'Businesses',
      'Creators',
      'Events',
      'Art',
      'Music',
      'Fashion',
      'News/announcements',
      'Community discussions'
    ];

    const safeCat = validCategories.includes(category) ? category : 'Businesses';

    const newPost = {
      id: 'post-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      ownerToken: String(ownerToken || '').slice(0, 200),
      title: String(title).slice(0, 100).trim(),
      author: String(author || 'Local Contributor').slice(0, 50).trim(),
      handle: String(handle || '').slice(0, 40).trim(),
      category: safeCat,
      location: String(location || 'Wasatch Front, UT').slice(0, 60).trim(),
      description: String(description).slice(0, 500).trim(),
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || 'image',
      link: link || '',
      linkText: String(linkText || 'Learn More').slice(0, 40).trim(),
      votes: 1, // Author's initial upvote
      createdAt: new Date().toISOString(),
      isPinned: false,
      reports: []
    };

    const posts = await getCommunityPosts();
    posts.unshift(newPost);
    await saveCommunityPosts(posts);

    return res.json({ success: true, post: newPost });
  } catch (err) {
    console.error('Community submit error:', err);
    return res.status(500).json({ error: 'Failed to submit post' });
  }
});

// POST Report a Community Post (Violation flags)
app.post('/api/community/report', async (req, res) => {
  try {
    const { id, reason, details } = req.body;
    if (!id || !reason) {
      return res.status(400).json({ error: 'Post ID and report reason required' });
    }

    const allowedReasons = [
      'Spam',
      'Scams',
      'Illegal content',
      'Harassment',
      'Hate',
      'Explicit sexual content',
      'Dangerous/violent content'
    ];

    const safeReason = allowedReasons.includes(reason) ? reason : 'Spam';

    const posts = await getCommunityPosts();
    const post = posts.find(p => p.id === id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.reports = post.reports || [];
    post.reports.push({
      reason: safeReason,
      details: String(details || '').slice(0, 200),
      timestamp: new Date().toISOString()
    });

    await saveCommunityPosts(posts);

    return res.json({ success: true, reportCount: post.reports.length });
  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ error: 'Failed to submit report' });
  }
});

// POST Edit / Update Community Spot (Author or Admin)
app.post(['/api/community/edit', '/api/community/update'], async (req, res) => {
  try {
    const {
      id,
      ownerToken,
      title,
      author,
      handle,
      category,
      location,
      description,
      mediaUrl,
      mediaType,
      link,
      linkText
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    const posts = await getCommunityPosts();
    const post = posts.find(p => String(p.id) === String(id));

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!ownerToken || !post.ownerToken || String(ownerToken) !== String(post.ownerToken)) {
      return res.status(403).json({ error: 'Only the creator can edit this spot' });
    }

    if (title && String(title).trim()) post.title = String(title).trim().slice(0, 100);
    if (author && String(author).trim()) post.author = String(author).trim().slice(0, 50);
    if (handle !== undefined) post.handle = String(handle || '').trim().slice(0, 40);
    if (category && String(category).trim()) post.category = String(category).trim();
    if (location && String(location).trim()) post.location = String(location).trim().slice(0, 60);
    if (description && String(description).trim()) post.description = String(description).trim().slice(0, 500);
    if (mediaUrl !== undefined) post.mediaUrl = String(mediaUrl || '').trim();
    if (mediaType !== undefined) post.mediaType = String(mediaType || 'image').trim();
    if (link !== undefined) post.link = String(link || '').trim();
    if (linkText !== undefined) post.linkText = String(linkText || 'Learn More').trim().slice(0, 40);

    await saveCommunityPosts(posts);

    return res.json({ success: true, post });
  } catch (err) {
    console.error('Edit community post error:', err);
    return res.status(500).json({ error: 'Failed to update post' });
  }
});

// POST Delete Community Spot (Author or Admin)
app.post(['/api/community/delete', '/api/admin/community/delete'], async (req, res) => {
  try {
    const { id, ownerToken } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    let posts = await getCommunityPosts();
    const initialLen = posts.length;
    const postToDelete = posts.find(p => String(p.id) === String(id));

    if (postToDelete && (!ownerToken || !postToDelete.ownerToken || String(ownerToken) !== String(postToDelete.ownerToken))) {
      return res.status(403).json({ error: 'Only the creator can delete this spot' });
    }

    posts = posts.filter(p => String(p.id) !== String(id));

    if (posts.length !== initialLen) {
      await saveCommunityPosts(posts);
    }

    return res.json({ success: true, id, removed: posts.length !== initialLen });
  } catch (err) {
    console.error('Delete community post error:', err);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST Admin Community Moderation (Pin, Delete, Clear Reports)
app.post('/api/admin/community/moderate', async (req, res) => {
  try {
    const { action, id } = req.body;
    if (!action || !id) {
      return res.status(400).json({ error: 'Action and post ID required' });
    }

    let posts = await getCommunityPosts();
    const postIdx = posts.findIndex(p => String(p.id) === String(id));

    if (action === 'delete') {
      if (postIdx !== -1) {
        posts.splice(postIdx, 1);
        await saveCommunityPosts(posts);
      }
      return res.json({ success: true, action: 'delete', id });
    }

    if (postIdx === -1) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (action === 'pin') {
      posts[postIdx].isPinned = true;
    } else if (action === 'unpin') {
      posts[postIdx].isPinned = false;
    } else if (action === 'clear_reports') {
      posts[postIdx].reports = [];
    } else {
      return res.status(400).json({ error: 'Invalid moderation action' });
    }

    await saveCommunityPosts(posts);
    return res.json({ success: true, action, id });
  } catch (err) {
    console.error('Admin moderation error:', err);
    return res.status(500).json({ error: 'Moderation failed' });
  }
});

// =========================================================================
// GEMINI AI PHOTOSPHERE CEILING & FLOOR OUTPAINTING ENGINE
// =========================================================================

// Endpoint to check AI capability status
app.get('/api/gemini/status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    available: hasKey,
    model: 'gemini-3.1-flash-lite-image',
    features: ['photosphere-outpaint', 'material-reconstruction', 'hdr-fill']
  });
});

// Endpoint to outpaint ceiling & floor on a 360 equirectangular photosphere
app.post('/api/gemini/outpaint-photosphere', async (req, res) => {
  try {
    const { imageData, imageUrl, materialsHint, roomType } = req.body;

    if (!imageData && !imageUrl) {
      return res.status(400).json({ error: 'No image provided for AI outpainting' });
    }

    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (imageData && imageData.startsWith('data:')) {
      const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        base64Data = imageData.split(',')[1] || imageData;
      }
    } else if (imageData) {
      base64Data = imageData;
    } else if (imageUrl) {
      // Fetch image from local path or URL
      try {
        let buffer;
        if (imageUrl.startsWith('/uploads/')) {
          const localPath = path.join(__dirname, imageUrl);
          if (fs.existsSync(localPath)) {
            buffer = await fs.promises.readFile(localPath);
            mimeType = localPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
          }
        }
        if (!buffer) {
          const fetchRes = await fetch(imageUrl);
          const ab = await fetchRes.arrayBuffer();
          buffer = Buffer.from(ab);
          mimeType = fetchRes.headers.get('content-type') || 'image/jpeg';
        }
        base64Data = buffer.toString('base64');
      } catch (fe) {
        console.error('Failed to load image for Gemini:', fe);
        return res.status(400).json({ error: 'Could not load input image' });
      }
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY environment variable is not configured on the server.',
        fallback: true
      });
    }

    const hintText = materialsHint ? ` Specifically match these room features: ${materialsHint}.` : '';
    const roomText = roomType ? ` Room type: ${roomType}.` : '';

    const outpaintPrompt = `You are a professional architectural 360° photosphere reconstruction and VR restoration model.
This image is a 360-degree equirectangular panorama of an interior space. The middle section contains real photographic details, but the upper ceiling and lower floor areas need realistic generative reconstruction and outpainting.

Your task:
1. Reconstruct and outpaint the full ceiling (top 30-40% of the equirectangular sphere) and the full floor (bottom 30-40% of the sphere).
2. Faithfully match the real materials visible in the middle photo:
   - If hardwood floor planks are present, synthesize realistic wood grain, plank orientation, reflection, and baseboards matching the exact wood tone and perspective.
   - If tile or carpet is present, extend that exact material texture realistically across the entire floor.
   - Reconstruct the ceiling with realistic drywall texture, crown moldings, and naturally placed ceiling light fixtures or recessed pot lights consistent with the room's ambient lighting and perspective.
3. Keep the middle original photographic room details intact and seamlessly blend the boundaries with 0% distortion or seam lines.
4. Output the complete, full-resolution 2:1 ratio 360-degree equirectangular panoramic image.${roomText}${hintText}`;

    console.log('[Gemini Outpaint] Requesting generative outpainting with model gemini-3.1-flash-lite-image...');

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: outpaintPrompt
          }
        ]
      }
    });

    let generatedBase64 = null;
    let textExplanation = '';

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          generatedBase64 = part.inlineData.data;
        } else if (part.text) {
          textExplanation += part.text;
        }
      }
    }

    if (generatedBase64) {
      // Save the AI enhanced photosphere to uploads folder
      const outFileName = `gemini-photosphere-${Date.now()}-${Math.round(Math.random() * 1000)}.jpg`;
      const outFilePath = path.join(uploadsDir, outFileName);
      const imageBuffer = Buffer.from(generatedBase64, 'base64');
      await fs.promises.writeFile(outFilePath, imageBuffer);

      const outUrl = `/uploads/${outFileName}`;
      console.log(`[Gemini Outpaint] Successfully generated and saved 360 photosphere to ${outUrl}`);

      return res.json({
        success: true,
        panoUrl: outUrl,
        aiGenerated: true,
        text: textExplanation,
        timestamp: Date.now()
      });
    }

    // If Gemini returned text analysis or hints
    return res.json({
      success: false,
      error: 'Gemini did not return an image part. It may require a direct image model or higher resolution configuration.',
      text: textExplanation
    });

  } catch (err) {
    console.error('[Gemini Outpaint Error]', err);
    return res.status(500).json({
      error: err && err.message ? err.message : 'AI Outpainting failed',
      details: String(err)
    });
  }
});

// Serve static assets from root
app.use(express.static(__dirname));

// Serve index.html with dynamic OG host replacement when accessed directly
app.get(['/', '/index.html'], (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send('Not Found');
  }

  const host = req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const baseUrl = `${proto}://${host}`;

  // If running on Cloud Run or custom host, adapt OG image tags so previews work directly on this host too
  if (host && !host.includes('cxcx3.github.io')) {
    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace(/https:\/\/cxcx3\.github\.io\/mag\//g, `${baseUrl}/`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  res.sendFile(indexPath);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

