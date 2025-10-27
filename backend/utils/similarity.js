/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First embedding vector
 * @param {Array<number>} vecB - Second embedding vector
 * @returns {number} - Similarity score between -1 and 1 (higher is more similar)
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    console.error('Invalid vectors for similarity calculation');
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Find top K most similar items
 * @param {Array<number>} queryVector - Query embedding
 * @param {Array<{embedding: Array<number>, data: any}>} items - Items to compare
 * @param {number} k - Number of top results to return
 * @returns {Array<{similarity: number, data: any}>} - Sorted results
 */
const findTopKSimilar = (queryVector, items, k = 5) => {
  const results = items.map(item => ({
    similarity: cosineSimilarity(queryVector, item.embedding),
    data: item.data
  }));

  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
};

module.exports = {
  cosineSimilarity,
  findTopKSimilar
};