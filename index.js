const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

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

function handleTranscribe(req, res) {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      error: 'No audio file uploaded' 
    });
  }

  return res.json({
  success: true,
  text: 'تم استلام الملف الصوتي بنجاح ✅\n\nهذا نص تجريبي من السيرفر الجديد!',
  transcript: 'تم استلام الملف الصوتي بنجاح ✅',  // للتوافق
  originalName: req.file.originalname,
  size: req.file.size,
  enhanced: false,
  source: 'mock'
});

app.post('/transcribe', upload.single('file'), handleTranscribe);
app.post('/api/transcribe', upload.single('file'), handleTranscribe);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port', PORT);
});
