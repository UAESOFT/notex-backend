import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    app: 'NoteX Backend Running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime()
  });
});

// Mock transcription endpoint
function handleTranscribe(req, res) {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      error: 'No audio file uploaded' 
    });
  }

  return res.json({
    success: true,
    transcript: 'تم استلام الملف الصوتي بنجاح ✅\n\nهذا نص تجريبي. لتفعيل الترجمة الحقيقية، أضف OPENAI_API_KEY في Environment Variables.',
    originalName: req.file.originalname,
    size: req.file.size,
    enhanced: false,
    source: 'mock'
  });
}

app.post('/transcribe', upload.single('file'), handleTranscribe);
app.post('/api/transcribe', upload.single('file'), handleTranscribe);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: ['GET /', 'GET /health', 'POST /transcribe', 'POST /api/transcribe']
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 NoteX Backend Server Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
