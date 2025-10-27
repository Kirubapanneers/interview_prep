const axios = require('axios');

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
// Use BAAI/bge-small-en-v1.5 - it's designed for feature extraction
const MODEL = 'BAAI/bge-small-en-v1.5';

const generateEmbedding = async (text) => {
  try {
    console.log('Generating embedding for text of length:', text.length);
    
    // Truncate text if too long
    const maxLength = 512;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;
    
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${MODEL}`,
      {
        inputs: truncatedText,
        options: {
          wait_for_model: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );
    
    let embedding = response.data;
    
    // Handle nested arrays
    if (Array.isArray(embedding) && Array.isArray(embedding[0])) {
      embedding = embedding[0];
    }
    
    console.log('Generated embedding of dimension:', embedding.length);
    return embedding;
  } catch (error) {
    console.error('Hugging Face Embedding Error:', error.response?.data || error.message);
    throw new Error('Failed to generate embedding: ' + (error.response?.data?.error || error.message));
  }
};

const generateEmbeddings = async (textChunks) => {
  try {
    console.log('Generating embeddings for', textChunks.length, 'chunks');
    
    const embeddings = [];
    for (const chunk of textChunks) {
      const embedding = await generateEmbedding(chunk);
      embeddings.push(embedding);
      
      // Wait 1 second between requests to avoid rate limiting
      if (textChunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('Successfully generated', embeddings.length, 'embeddings');
    return embeddings;
  } catch (error) {
    console.error('Batch Embedding Error:', error);
    throw new Error('Failed to generate embeddings');
  }
};

module.exports = { generateEmbedding, generateEmbeddings };