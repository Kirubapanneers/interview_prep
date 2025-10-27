# interview_prep

# 🧠 AI-Powered Interview Prep App

An interactive **AI-driven interview preparation platform** that simulates real interview scenarios using your **resume** and **job description (JD)**.  
The app helps users **practice interview questions**, receive **AI-generated feedback**, and improve based on **personalized evaluation**.

---

## 🚀 Overview

**Objective:**  
This full-stack application allows users to:
- Upload their **resume** and **job description (JD)** PDFs.
- Chat with an **AI interviewer** that:
  - Generates customized interview questions.
  - Evaluates user responses against their resume.
  - Provides a **score and feedback** using a RAG (Retrieval-Augmented Generation) pipeline.

**AI Model:** Integrated with **Hugging Face** models for question generation and response evaluation.

---

## 🧩 Tech Stack

### **Frontend**
- ⚛️ React.js (SPA)
- 💨 Tailwind CSS (for responsive UI)
- ⚡ Axios (API communication)
- 🔔 React Hot Toast (notifications)

### **Backend**
- 🟢 Node.js & Express.js
- 🔐 JWT Authentication
- 🗄 MongoDB Atlas (Database)
- ☁️ Cloudinary (File storage)
- 🧠 Hugging Face API (AI model integration)
- 📄 pdf-parse (for text extraction from PDFs)
- 🧮 cosine-similarity (for RAG retrieval)

### **Deployment**
- 🌐 Frontend → Vercel  
- ⚙️ Backend → Render  

---

## 🧱 Features

### 🔑 **1. Authentication**
- Secure **signup/login** with JWT and bcrypt.
- **Protected routes** for authenticated users only.
- Endpoints:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`

---

### 📄 **2. Document Upload**
- Upload **Resume** and **Job Description** PDFs (max 2MB each).
- Drag & Drop upload with progress bar.
- Extracts text using `pdf-parse`.
- Splits into chunks (~500 words) and stores embeddings.
- Files stored on **Cloudinary**.
- Endpoints:
  - `POST /api/documents/upload`
  - `GET /api/documents/list`
  - `DELETE /api/documents/:id`

---

### 💬 **3. AI Chat**
- Interactive chat UI to simulate interviews.
- Workflow:
  1. AI generates **3 initial questions** from the JD.
  2. User answers → AI evaluates against resume.
  3. Returns **score (1–10)** and **feedback (≤100 words)**.
- Uses **Hugging Face** for:
  - Question generation.
  - RAG-based evaluation.
- Endpoints:
  - `POST /api/chat/start`
  - `POST /api/chat/query`

---

### 🧠 **4. RAG (Retrieval-Augmented Generation)**
- Extracted document chunks embedded using a similarity-based search.
- AI retrieves top-2 matching chunks from resume/JD.
- Provides feedback with context:
  > “See resume chunk #2: Experience with React.js project.”

---

### 💅 **5. UX & UI Enhancements**
- Fully responsive with Tailwind CSS.
- Smooth scrolling chat interface.
- Toast notifications for success/errors.
- Accessible design (ARIA + keyboard support).
- Loading spinners and state feedbacks.

---
Frontend (.env)

VITE_API_URL=https://your-backend-url.onrender.com/api



---

## ⚙️ Environment Variables

### **Backend (.env)**
```env
PORT=
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
HUGGINGFACE_API_KEY=your_huggingface_token
FRONTEND_URL=https://your-frontend-url.vercel.app
NODE_ENV=production



🧠 Hugging Face Integration

The app uses Hugging Face Inference API for:

JD-based Question Generation

Response Evaluation and Feedback

Example flow:

Prompt: "Generate 3 interview questions from this job description: [JD text]"
→ Hugging Face Model Output: ["What experience do you have with APIs?", ...]


🚀 Deployment URLs
Service	URL
Frontend	https://interview-prep-sandy-five.vercel.app

Backend	https://interview-prep-w4lk.onrender.com

