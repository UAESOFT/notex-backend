import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Module fix للـ __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


(__dirname, "uploads");
if (!f
// إعداد Multer للتخزين المؤقت
const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 25 * 1024 * 1024 } // حد أقصى 25MB
});

// CORS - نسمح لكل المصادر في التطوير
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// إنشاء مجلد uploads إذا مو موجود
const uploadsDir = path.joi
ns.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// تهيئة OpenAI (فقط إذا كان API Key موجود)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log("✅ OpenAI initialized successfully");
} else {
  console.warn("⚠️  OPENAI_API_KEY not found - using mock mode");
}

// ==================== Routes ====================

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    app: "NoteX Backend Running",
    timestamp: new Date().toISOString(),
    openai: openai ? "connected" : "mock_mode"
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    uptime: process.uptime(),
    openai: openai ? "enabled" : "disabled"
  });
});

// Transcription handler function
async function handleTranscribe(req, res) {
  let filePath = null;
  
  try {
    // التحقق من وجود الملف
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: "No audio file uploaded" 
      });
    }

    filePath = req.file.path;
    console.log(`📁 Received file: ${req.file.originalname} (${req.file.size} bytes)`);

    // إذا OpenAI موجود، نستخدمه
    if (openai) {
      try {
        console.log("🎤 Sending to OpenAI Whisper...");
        
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(filePath),
          model: "whisper-1",
          language: "ar", // يدعم العربية والإنجليزية تلقائياً
        });

        // حذف الملف المؤقت
        fs.unlinkSync(filePath);

        console.log("✅ Transcription completed");

        return res.json({
          success: true,
          transcript: transcription.text,
          originalName: req.file.originalname,
          size: req.file.size,
          enhanced: true,
          source: "openai_whisper"
        });

      } catch (openaiError) {
        console.error("❌ OpenAI Error:", openaiError.message);
        
        // في حالة خطأ من OpenAI، نرجع رد مفيد
        return res.status(500).json({
          success: false,
          error: "OpenAI transcription failed",
          details: openaiError.message,
          suggestion: "Check your API key and quota"
        });
      }
    } 
    
    // Mode وهمي (Mock) إذا ما في OpenAI
    else {
      // حذف الملف المؤقت
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.log("⚠️  Using mock transcription (no API key)");

      return res.json({
        success: true,
        transcript: "تم استلام الملف الصوتي بنجاح ✅\n\nهذا نص تجريبي لأن مفتاح OpenAI غير موجود. لتفعيل الترجمة الحقيقية:\n1. أضف OPENAI_API_KEY في Secrets\n2. أعد تشغيل السيرفر",
        originalName: req.file.originalname,
        size: req.file.size,
        enhanced: false,
        source: "mock"
      });
    }

  } catch (error) {
    console.error("❌ Server Error:", error);
    
    // حذف الملف المؤقت في حالة الخطأ
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.error("Error deleting temp file:", unlinkError);
      }
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
}

// Transcription endpoints (ندعم المسارين)
app.post("/transcribe", upload.single("file"), handleTranscribe);
app.post("/api/transcribe", upload.single("file"), handleTranscribe);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    availableRoutes: [
      "GET  /",
      "GET  /health",
      "POST /transcribe",
      "POST /api/transcribe"
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message
  });
});

// ==================== Server Start ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🚀 NoteX Backend Server Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🤖 OpenAI: ${openai ? '✅ Enabled' : '⚠️  Mock Mode'}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});
