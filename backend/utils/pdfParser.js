const { PDFParse, VerbosityLevel } = require('pdf-parse');

const extractTextFromPDF = async (buffer) => {
  let parser;
  try {
    console.log('Starting PDF text extraction...');
    
    // Convert Buffer to Uint8Array (required by pdf-parse v2.x)
    const uint8Array = new Uint8Array(buffer);
    
    // Create parser instance with options
    const options = {
      verbosity: VerbosityLevel.ERRORS
    };
    
    parser = new PDFParse(uint8Array, options);
    
    // Load the PDF
    await parser.load();
    
    // Get the text
    const textResult = await parser.getText();
    
    // Extract the text string from the result object
    const fullText = textResult.text || '';
    
    if (!fullText || fullText.trim().length === 0) {
      throw new Error('No extractable text in PDF');
    }
    
    console.log('PDF text extraction completed, length:', fullText.length);
    
    return fullText;
  } catch (error) {
    console.error('PDF Parse Error:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  } finally {
    // Clean up
    if (parser) {
      try {
        await parser.destroy();
      } catch (e) {
        console.warn('Error destroying parser:', e);
      }
    }
  }
};

const chunkText = (text, chunkSize = 500) => {
  console.log('Starting text chunking...');
  const words = text.split(/\s+/);
  const chunks = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
  }
  
  console.log('Completed chunking into', chunks.length, 'chunks');
  return chunks;
};

module.exports = { extractTextFromPDF, chunkText };