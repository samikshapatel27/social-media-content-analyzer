const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Extracts text from a PDF file.
 * @param {string} filePath - Path to the PDF file.
 * @param {object} options - Optional parsing options.
 * @returns {Promise<string>} The extracted text.
 * @throws {Error} If extraction fails or no text is found.
 */
const extractTextFromPDF = async (filePath, options = {}) => {
  const { maxPages = 0, pagerender = null, version = 'default' } = options;

  // Validate the file
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`PDF file not found: ${filePath}`);
  }

  if (path.extname(filePath).toLowerCase() !== '.pdf') {
    throw new Error(`File is not a PDF: ${filePath}`);
  }

  // Check file size
  const stats = fs.statSync(filePath);
  if (stats.size > MAX_PDF_SIZE) {
    throw new Error(`PDF file too large: ${(stats.size / (1024 * 1024)).toFixed(2)}MB`);
  }

  try {
    const dataBuffer = fs.readFileSync(filePath);
    
    // Quick check for a valid PDF header
    if (dataBuffer.length < 5 || dataBuffer.toString('utf8', 0, 5) !== '%PDF-') {
      throw new Error('File does not appear to be a valid PDF');
    }

    const data = await pdfParse(dataBuffer, { max: maxPages, pagerender, version });
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }
    
    return data.text;
  } catch (error) {
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
};

/**
 * Gets metadata from a PDF file without extracting full text.
 */
const getPDFMetadata = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer, { max: 0 }); // Parse metadata only
    return {
      numPages: data.numpages,
      info: data.info,
      metadata: data.metadata,
      version: data.version
    };
  } catch (error) {
    throw new Error(`Failed to get PDF metadata: ${error.message}`);
  }
};

module.exports = { extractTextFromPDF, getPDFMetadata, MAX_PDF_SIZE };