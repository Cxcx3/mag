import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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
app.use('/uploads', (req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  if (['.mp4', '.m4v', '.mov', '.webm', '.ogg', '.ogv'].includes(ext)) {
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Disposition', 'inline');
    if (ext === '.mp4' || ext === '.m4v' || ext === '.mov') {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (ext === '.webm') {
      res.setHeader('Content-Type', 'video/webm');
    } else if (ext === '.ogg' || ext === '.ogv') {
      res.setHeader('Content-Type', 'video/ogg');
    }
  }
  next();
}, express.static(uploadsDir, {
  acceptRanges: true,
  maxAge: '1d'
}));

// Upload endpoint for images and videos
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const isVideo = req.file.mimetype.startsWith('video/') || /\.(mp4|webm|ogg|mov|m4v)$/i.test(req.file.originalname);
  const fileUrl = `/uploads/${req.file.filename}`;

  return res.json({
    success: true,
    url: fileUrl,
    type: isVideo ? 'video' : 'image',
    filename: req.file.filename,
    size: req.file.size
  });
});

// Save magazine data directly to data.json on server
app.post('/api/save', async (req, res) => {
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

