import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { execFile } from 'child_process';
import util from 'util';

const execFilePromise = util.promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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

