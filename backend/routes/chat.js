const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const Document = require('../models/Document');
const Chat = require('../models/Chat');
const { generateEmbedding } = require('../utils/embeddings');
const { cosineSimilarity } = require('../utils/similarity');
const axios = require('axios');

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Simple rule-based evaluation (more reliable than API calls)
const evaluateResponse = (message, context) => {
  const wordCount = message.trim().split(/\s+/).length;
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Check for specific technical keywords
  const technicalTerms = ['implemented', 'developed', 'built', 'created', 'solved', 'debugged', 
                          'optimized', 'designed', 'integrated', 'deployed', 'tested', 'refactored'];
  const hasTechnicalTerms = technicalTerms.some(term => message.toLowerCase().includes(term));
  
  // Check for quantifiable results
  const hasNumbers = /\d+/.test(message);
  const hasPercentage = /%/.test(message);
  
  // Check for specific examples
  const hasProjectName = message.includes('project') || message.includes('platform') || message.includes('app');
  const hasTechStack = /react|node|mongodb|express|sql|javascript|python|java/i.test(message);
  
  // Scoring logic
  let score = 5; // Base score
  
  if (wordCount > 50) score += 1;
  if (wordCount > 100) score += 1;
  if (sentences.length >= 3) score += 0.5;
  if (hasTechnicalTerms) score += 1;
  if (hasNumbers || hasPercentage) score += 1;
  if (hasProjectName) score += 0.5;
  if (hasTechStack) score += 1;
  
  score = Math.min(Math.round(score * 10) / 10, 10); // Max 10, round to 1 decimal
  
  // Generate feedback
  let feedback = '';
  const strengths = [];
  const improvements = [];
  
  if (wordCount > 80) {
    strengths.push('detailed explanation');
  } else if (wordCount < 40) {
    improvements.push('provide more details and context');
  }
  
  if (hasTechnicalTerms) {
    strengths.push('clear technical approach');
  } else {
    improvements.push('include more technical details about your implementation');
  }
  
  if (hasNumbers || hasPercentage) {
    strengths.push('quantifiable results');
  } else {
    improvements.push('add specific metrics or results');
  }
  
  if (hasProjectName && hasTechStack) {
    strengths.push('relevant project experience');
  } else {
    improvements.push('mention specific projects and technologies used');
  }
  
  // Build feedback message
  if (score >= 8) {
    feedback = `Excellent response! You've demonstrated ${strengths.join(', ')}. `;
    if (improvements.length > 0) {
      feedback += `To make it even stronger, consider: ${improvements.join(', ')}.`;
    } else {
      feedback += 'Your answer thoroughly addresses the question with clear examples and impact.';
    }
  } else if (score >= 6) {
    feedback = `Good answer. You've shown ${strengths.join(', ')}. `;
    feedback += `To improve further: ${improvements.join(', ')}.`;
  } else {
    feedback = `Your response needs more depth. Please ${improvements.join(', ')}. `;
    feedback += 'Provide concrete examples from your experience with specific outcomes.';
  }
  
  // Generate next question based on context
  const nextQuestions = [
    'Can you describe a situation where you had to learn a new technology quickly? How did you approach it?',
    'Tell me about a time when you had to debug a complex issue. What was your process?',
    'How do you stay updated with the latest trends and technologies in software development?',
    'Describe a project where you had to work with a difficult team member. How did you handle it?',
    'Whats your approach to code review and ensuring code quality?',
    'Can you explain a technical decision you made that had significant impact on a project?',
    'How do you prioritize tasks when you have multiple urgent deadlines?',
    'Tell me about a time when you had to optimize performance in an application.'
  ];
  
  const randomQuestion = nextQuestions[Math.floor(Math.random() * nextQuestions.length)];
  
  return {
    score,
    feedback,
    nextQuestion: randomQuestion
  };
};

// Generate initial questions based on JD
const generateQuestionsFromJD = (jdText) => {
  // Extract key technologies and skills from JD
  const technologies = [];
  const techKeywords = {
    'react': 'React',
    'node': 'Node.js',
    'javascript': 'JavaScript',
    'python': 'Python',
    'java': 'Java',
    'sql': 'SQL',
    'mongodb': 'MongoDB',
    'aws': 'AWS',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes'
  };
  
  const jdLower = jdText.toLowerCase();
  Object.keys(techKeywords).forEach(key => {
    if (jdLower.includes(key)) {
      technologies.push(techKeywords[key]);
    }
  });
  
  // Generate questions
  const questions = [];
  
  questions.push(`1. Can you describe your hands-on experience with ${technologies.slice(0, 3).join(', ') || 'the technologies'} mentioned in this role?`);
  questions.push(`2. Tell me about a challenging technical problem you've solved that required collaboration with your team.`);
  questions.push(`3. Walk me through a recent project where you had to design and implement a complete feature from scratch.`);
  
  return questions.join('\n\n');
};

// POST /api/chat/start - Initialize chat with questions from JD
router.post('/start', authenticate, async (req, res) => {
  try {
    console.log('Starting chat for user:', req.userId);

    // Get user's JD document
    const jdDoc = await Document.findOne({
      userId: req.userId,
      type: 'job_description'
    }).sort({ uploadedAt: -1 });

    if (!jdDoc) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a Job Description first'
      });
    }

    // Get resume document
    const resumeDoc = await Document.findOne({
      userId: req.userId,
      type: 'resume'
    }).sort({ uploadedAt: -1 });

    if (!resumeDoc) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a Resume first'
      });
    }

    // Extract JD text from chunks
    const jdText = jdDoc.chunks.map(c => c.text).join(' ').substring(0, 2000);

    console.log('📝 Generating initial questions from JD...');

    // Generate initial questions using rule-based approach
    const questionsText = generateQuestionsFromJD(jdText);

    // Create or update chat session
    let chat = await Chat.findOne({ userId: req.userId });
    
    const initialMessages = [
      {
        role: 'assistant',
        content: `Hello! I've reviewed the job description. Let's begin your interview preparation. Here are 3 questions based on the role:\n\n${questionsText}\n\nPlease answer the first question.`,
        timestamp: new Date(),
        questionNumber: 0 // Intro message
      }
    ];

    if (chat) {
      chat.messages = initialMessages;
      chat.resumeId = resumeDoc._id;
      chat.jdId = jdDoc._id;
      chat.totalQuestions = 10; // Default interview length
      chat.currentQuestion = 0;
      chat.scores = [];
      await chat.save();
      console.log('♻️ Updated existing chat session');
    } else {
      chat = await Chat.create({
        userId: req.userId,
        resumeId: resumeDoc._id,
        jdId: jdDoc._id,
        messages: initialMessages,
        totalQuestions: 10,
        currentQuestion: 0,
        scores: []
      });
      console.log('✨ Created new chat session');
    }

    res.json({
      success: true,
      message: 'Chat started successfully',
      chat: {
        id: chat._id,
        messages: chat.messages,
        currentQuestion: chat.currentQuestion,
        totalQuestions: chat.totalQuestions
      }
    });

  } catch (error) {
    console.error('❌ Start Chat Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start chat'
    });
  }
});

// POST /api/chat/query - Send message and get AI response with RAG
router.post('/query', authenticate, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    console.log('💬 Processing query for user:', req.userId);
    console.log('📨 User message:', message.substring(0, 100) + '...');

    // Get chat session
    const chat = await Chat.findOne({ userId: req.userId });
    
    if (!chat) {
      return res.status(400).json({
        success: false,
        message: 'Chat session not found. Please start a new chat.'
      });
    }

    // Get resume and JD documents
    const [resume, jd] = await Promise.all([
      Document.findById(chat.resumeId),
      Document.findById(chat.jdId)
    ]);

    if (!resume || !jd) {
      return res.status(400).json({
        success: false,
        message: 'Documents not found. Please upload documents again.'
      });
    }

    console.log('🔍 Generating embedding for query...');
    // Generate embedding for user's message
    const queryEmbedding = await generateEmbedding(message);

    // Find most relevant chunks from resume and JD using similarity search
    const allChunks = [
      ...resume.chunks.map(c => ({ ...c.toObject(), source: 'resume' })),
      ...jd.chunks.map(c => ({ ...c.toObject(), source: 'job_description' }))
    ];

    console.log('📊 Calculating similarity scores...');
    // Calculate similarity scores
    const rankedChunks = allChunks.map(chunk => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3); // Top 3 most relevant chunks

    console.log('📚 Top 3 similarity scores:', rankedChunks.map(c => c.similarity.toFixed(3)));

    // Build context from relevant chunks
    const context = rankedChunks.map((chunk, idx) => 
      `[${chunk.source.toUpperCase()}]: ${chunk.text.substring(0, 200)}`
    ).join('\n\n');

    console.log('🤖 Evaluating response using rule-based system...');
    
    // Use rule-based evaluation instead of AI
    const evaluation = evaluateResponse(message, context);
    
    console.log('📊 Score:', evaluation.score, '| Feedback length:', evaluation.feedback.length);

    // Create response with citations
    let responseContent = `**Score: ${evaluation.score}/10**\n\n**Feedback:**\n${evaluation.feedback}`;
    
    if (rankedChunks.length > 0) {
      responseContent += `\n\n**References:**\n`;
      rankedChunks.forEach((chunk, idx) => {
        responseContent += `- [${chunk.source}] ${chunk.text.substring(0, 100)}...\n`;
      });
    }

    if (evaluation.nextQuestion) {
      responseContent += `\n\n**Next Question:** ${evaluation.nextQuestion}`;
    }

    // Save messages to chat
    chat.messages.push(
      { role: 'user', content: message, timestamp: new Date() },
      { 
        role: 'assistant', 
        content: responseContent, 
        score: evaluation.score,
        citations: rankedChunks.map(c => ({
          source: c.source,
          text: c.text.substring(0, 200)
        })),
        timestamp: new Date() 
      }
    );

    await chat.save();
    console.log('💾 Chat saved successfully');

    res.json({
      success: true,
      message: 'Response generated',
      response: {
        content: responseContent,
        score: evaluation.score,
        citations: rankedChunks.map(c => ({
          source: c.source,
          text: c.text
        }))
      },
      messages: chat.messages
    });

  } catch (error) {
    console.error('❌ Query Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process query'
    });
  }
});

// GET /api/chat/history - Get chat history
router.get('/history', authenticate, async (req, res) => {
  try {
    console.log('📜 Fetching chat history for user:', req.userId);
    const chat = await Chat.findOne({ userId: req.userId });
    
    if (!chat) {
      console.log('📭 No chat history found');
      return res.json({
        success: true,
        messages: []
      });
    }

    console.log('✅ Chat history found:', chat.messages.length, 'messages');
    res.json({
      success: true,
      messages: chat.messages
    });

  } catch (error) {
    console.error('❌ Get History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history'
    });
  }
});

// DELETE /api/chat/clear - Clear chat history
router.delete('/clear', authenticate, async (req, res) => {
  try {
    console.log('🗑️ Clearing chat for user:', req.userId);
    await Chat.findOneAndDelete({ userId: req.userId });

    console.log('✅ Chat cleared successfully');
    res.json({
      success: true,
      message: 'Chat history cleared'
    });

  } catch (error) {
    console.error('❌ Clear Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat'
    });
  }
});

module.exports = router;