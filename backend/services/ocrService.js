const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

/**
 * Extracts text from an image using OCR.
 * @param {string} filePath - Path to the image file.
 * @param {string} language - OCR language (default: 'eng').
 * @param {number} timeoutMs - Timeout in milliseconds.
 * @param {function} progressCallback - Optional callback for progress updates.
 * @returns {Promise<string>} The extracted text.
 * @throws {Error} If processing fails or no text is found.
 */
const extractTextFromImage = async (
  filePath,
  language = 'eng',
  timeoutMs = 30000,
  progressCallback = null
) => {
  // Basic input validation
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Check if it's a supported image type
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'];
  const ext = path.extname(filePath).toLowerCase();
  if (!imageExtensions.includes(ext)) {
    throw new Error(`Unsupported image format: ${ext}`);
  }

  try {
    // Set up the OCR job with an optional progress logger
    const recognizePromise = Tesseract.recognize(filePath, language, {
      logger: progressCallback ? m => progressCallback(m.status, m.progress) : undefined
    });

    // Set up a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`OCR timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    // Race the OCR job against the timeout
    const { data: { text } } = await Promise.race([recognizePromise, timeoutPromise]);
    
    // Check if we got any usable text
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the image');
    }
    
    return text;
  } catch (error) {
    throw new Error(`OCR processing failed: ${error.message}`);
  }
};

module.exports = { extractTextFromImage };