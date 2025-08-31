require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const MAX_FILE_SIZE = process.env.UPLOAD_MAX_SIZE || 10 * 1024 * 1024;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// HTTP request logging
app.use(morgan(process.env.NODE_ENV !== 'production' ? 'dev' : 'combined'));

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR + '/');
  },
  filename: (req, file, cb) => {
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + '-' + sanitizedFilename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPEG, PNG) are allowed'));
    }
  },
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

// Text extraction from PDF
const extractTextFromPDF = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('PDF file not found');
    }

    const dataBuffer = fs.readFileSync(filePath);
    if (dataBuffer.length < 5 || dataBuffer.toString('utf8', 0, 5) !== '%PDF-') {
      throw new Error('File does not appear to be a valid PDF');
    }

    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
};

// Text extraction from image using OCR
const extractTextFromImage = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('Image file not found');
    }

    const { data: { text } } = await Tesseract.recognize(
      filePath, 
      process.env.OCR_LANGUAGE || 'eng'
    );
    return text;
  } catch (error) {
    throw new Error(`OCR processing failed: ${error.message}`);
  }
};

// Safe file cleanup function
const safeFileCleanup = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (cleanupError) {
    console.warn('Could not cleanup file:', cleanupError.message);
  }
};

// Emoji detection
const detectEmojis = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const emojiPatterns = [
    /[\u{1F300}-\u{1F9FF}]/gu,
    /[\u{2600}-\u{26FF}]/gu,
    /[\u{2700}-\u{27BF}]/gu,
    /[\u{1F600}-\u{1F64F}]/gu,
    /[\u{1F680}-\u{1F6FF}]/gu,
    /[\u{1F900}-\u{1F9FF}]/gu
  ];

  let allEmojis = [];
  
  emojiPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    allEmojis = [...allEmojis, ...matches];
  });

  return allEmojis;
};

// Emoji counting
const countEmojis = (text) => {
  const detected = detectEmojis(text);
  return detected.length;
};

// Analyze text and generate suggestions
const analyzeContent = (text) => {
  const suggestions = [];
  const emojiCount = countEmojis(text);
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  const hasQuestions = text.includes('?') || /\b(what|how|why|when|where|which|who)\b/i.test(text);
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

  // Emoji analysis
  if (emojiCount === 0) {
    suggestions.push("Add 1–2 relevant emojis to make the post more visually engaging.");
  } else if (emojiCount > 3) {
    suggestions.push("Limit emojis to the 2–3 most relevant ones to keep the content professional.");
  }

  // Hashtag analysis
  if (hashtagCount === 0) {
    suggestions.push("Include 2–3 targeted hashtags to improve reach and discoverability.");
  } else if (hashtagCount > 5) {
    suggestions.push("Reduce the number of hashtags—using 2–4 well-chosen ones works best.");
  }

  // Question analysis
  if (!hasQuestions) {
    suggestions.push("Try asking a question to spark conversations and boost engagement.");
  }

  // Length analysis
  if (text.length < 50) {
    suggestions.push("Expand your content slightly—short posts may not fully capture attention.");
  } else if (text.length > 300) {
    suggestions.push("Consider shortening your post—concise messages usually perform better.");
  }

  // Calculate score
  const lengthScore = Math.min(100, (text.length / 3));
  const emojiScore = Math.min(20, emojiCount * 5);
  const hashtagScore = Math.min(20, hashtagCount * 7);
  const questionScore = hasQuestions ? 10 : 0;
  const score = Math.min(100, Math.max(30, lengthScore + emojiScore + hashtagScore + questionScore));

  return {
    originalText: text,
    suggestions: suggestions.slice(0, 4),
    score: Math.round(score),
    metrics: {
      characterCount: text.length,
      wordCount: wordCount,
      emojiCount: emojiCount,
      hashtagCount: hashtagCount,
      hasQuestions: hasQuestions
    }
  };
};

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Social Media Content Analyzer API',
    endpoints: {
      'POST /api/analyze': 'Analyze PDF or image files for engagement suggestions',
      'GET /api/health': 'Check server status'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// Upload and process endpoint
app.post('/api/analyze', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'File too large' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    let extractedText = '';
    const fileType = req.file.mimetype;

    if (fileType === 'application/pdf') {
      extractedText = await extractTextFromPDF(filePath);
    } else if (fileType.startsWith('image/')) {
      extractedText = await extractTextFromImage(filePath);
    } else {
      return res.status(415).json({ error: 'Unsupported file type' });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(422).json({ error: 'No text could be extracted from the file' });
    }

    const analysis = analyzeContent(extractedText);
    safeFileCleanup(filePath);
    res.json(analysis);

  } catch (error) {
    safeFileCleanup(filePath);
    
    if (error.message.includes('PDF')) {
      res.status(422).json({ error: 'Failed to process PDF file' });
    } else if (error.message.includes('OCR')) {
      res.status(422).json({ error: 'Failed to process image' });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { analyzeContent };