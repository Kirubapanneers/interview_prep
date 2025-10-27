const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { extractTextFromPDF, chunkText } = require('../utils/pdfParser');
const { generateEmbeddings } = require('../utils/embeddings');

const router = express.Router();

// Multer configuration for memory storage and 2MB limit, only PDFs allowed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  },
});

// Upload document route
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { type } = req.body;

    console.log('Starting upload for user:', req.userId);
    console.log('Received file:', req.file ? req.file.originalname : 'No file', 'Type:', type);

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    if (!['resume', 'job_description'].includes(type)) {
      console.error('Invalid type:', type);
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    // Check for existing document of same type for user and delete
    const existing = await Document.findOne({ userId: req.userId, type });
    if (existing) {
      console.log(`Found existing document (ID: ${existing._id}), deleting it...`);
      if (existing.cloudinaryId) {
        await deleteFromCloudinary(existing.cloudinaryId);
        console.log(`Deleted old document from Cloudinary: ${existing.cloudinaryId}`);
      }
      await Document.findByIdAndDelete(existing._id);
      console.log(`Deleted old document from DB: ${existing._id}`);
    }

    // Upload file to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file, 'interview-prep-documents');
    console.log('Cloudinary returned:', uploadResult);

    // Extract text from PDF file buffer
    const text = await extractTextFromPDF(req.file.buffer);
    console.log(`Extracted text length: ${text.length}`);

    // Chunk and generate embeddings
    const chunks = chunkText(text, 500);
    const embeddings = await generateEmbeddings(chunks);
    const chunkData = chunks.map((chunkText, index) => ({
      text: chunkText,
      embedding: embeddings[index],
      chunkIndex: index,
    }));

    console.log('Generated chunk data count:', chunkData.length);

    // Save document metadata to MongoDB
    const document = await Document.create({
      userId: req.userId,
      type,
      fileName: req.file.originalname,
      fileUrl: uploadResult.fileUrl,
      cloudinaryId: uploadResult.publicId,
      chunks: chunkData,
      totalChunks: chunkData.length,
    });

    console.log('Saved document in DB:', document._id);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        type: document.type,
        fileName: document.fileName,
        totalChunks: document.totalChunks,
        createdAt: document.createdAt,
        fileUrl: document.fileUrl,
      },
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// List documents route
router.get('/list', auth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.userId }).select('-chunks').sort({ createdAt: -1 });
    res.json({ success: true, documents: docs });
  } catch (error) {
    console.error('List Documents Error:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch documents' });
  }
});

// Delete document route
router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.userId });
    if (!doc) {
      console.error('Delete document not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    if (doc.cloudinaryId) {
      await deleteFromCloudinary(doc.cloudinaryId);
      console.log(`Deleted document from Cloudinary: ${doc.cloudinaryId}`);
    }
    await Document.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
});

module.exports = router;
