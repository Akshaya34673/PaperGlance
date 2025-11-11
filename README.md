
🧠 PaperGlance – Research Paper Summarization using RAG
🚀 Overview

PaperGlance is an AI-powered web application that helps students and researchers quickly understand lengthy research papers.
It uses Retrieval-Augmented Generation (RAG) and Google Gemini Pro to generate concise, context-aware summaries of uploaded academic papers.
Built with a FastAPI backend and a ReactJS frontend, PaperGlance integrates LLMs, FAISS vector search, and MongoDB Atlas to deliver an intelligent, user-friendly summarization experience.

🧩 Problem Statement

Reading and understanding long, technical research papers is time-consuming and difficult.
Students and researchers often need quick, accurate, and clear summaries without reading the entire paper.

🎯 Objectives

Reduce the time spent reviewing lengthy papers.

Provide short, medium, or detailed AI-generated summaries.

Enable users to query uploaded content via an AI chatbot.

Simplify exploration of complex terms using an integrated academic dictionary.

Improve accessibility with text-to-speech functionality.

✨ Key Features

📄 Upload & Summarize PDFs/DOCs – Supports multiple file formats for academic papers.

🔍 Adjustable Summary Lengths – Choose short, medium, or detailed summaries.

💬 AI Chatbot (RAG-based) – Ask context-aware questions based on uploaded documents.

📚 Academic Dictionary – Get instant meanings of technical and domain-specific terms.

🗣️ Text-to-Speech Support – Listen to your AI-generated summaries.

🕒 Summarization History – Access past uploads and generated summaries anytime.

🌗 Dark/Light Mode – Toggle between themes for user comfort.

📥 Download Summaries – Save your generated summaries as PDF files.

🔐 User Authentication – Secure login/signup with JWT and Google Sign-In.

⚙️ Tech Stack
Backend:

FastAPI
 – Core backend framework

Google Gemini Pro
 – Summarization and Q&A LLM

Sentence Transformers
 – Document embedding

FAISS
 – Vector similarity search

MongoDB Atlas
 – Cloud database

JWT Authentication & bcrypt – Secure user sessions and password hashing

Frontend:

ReactJS

Bootstrap
 & CSS Modules

Figma
 for UI design and prototyping

Development Tools:

Google Colab – Model testing and fine-tuning

Git & Postman – Version control and API testing

🧠 System Architecture
User
 │
 ▼
Frontend (ReactJS)
 │
 ▼
Backend (FastAPI)
 │
 ├── Text Extraction (PDF/DOC)
 ├── Chunking & Embedding (Sentence Transformers)
 ├── Vector Indexing (FAISS)
 ├── LLM Summarization (Google Gemini Pro)
 ├── Q&A via RAG (Relevant context + LLM response)
 ├── Grammar & Formatting
 └── MongoDB Atlas (Storage: user data, summaries, chat history)

🔄 Workflow

User logs in (via credentials or Google account).

Uploads a research paper (PDF/DOC).

Text is extracted and split into chunks.

Chunks are embedded using Sentence Transformers and indexed with FAISS.

RAG pipeline retrieves top chunks relevant to the query.

Google Gemini Pro generates a coherent, contextual summary.

The output summary is stored in MongoDB and displayed to the user.

User can listen, download, or interact with the summary using the chatbot.

🧾 API Endpoints (Simplified)
Endpoint	Method	Description
/api/users	POST	Register new user
/api/login	POST	User login
/api/auth/google	POST	Google Sign-In
/api/upload	POST	Upload PDF/DOC for summarization
/api/summarize	POST	Generate AI summary
/api/define	POST	Get academic word meaning
/api/summaries	GET	Fetch user history
/api/summaries/{id}	DELETE	Delete summary
/api/logout	POST	Logout user
🗂️ Database Design (MongoDB)

Collections:

users → Stores user credentials, profiles, and tokens

summaries → Stores uploaded paper data, summaries, and timestamps

queries → Stores chatbot interactions (Q&A history)

🧑‍💻 Setup Instructions
1️⃣ Clone the Repository
git clone https://github.com/<your-username>/PaperGlance.git
cd PaperGlance

2️⃣ Backend Setup (FastAPI)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

3️⃣ Frontend Setup (React)
cd frontend
npm install
npm start

4️⃣ Environment Variables

Create a .env file in your backend folder:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GEMINI_API_KEYS=your_api_keys_comma_separated

🏗️ Project Outcome

✅ Developed a fully functional, AI-driven web app for summarizing research papers.
✅ Successfully integrated RAG architecture with Google Gemini Pro for contextual understanding.
✅ Achieved multilingual summarization (e.g., Telugu → English).
✅ Enhanced accessibility with voice-based features and adjustable summary length.

🏆 Achievements

Reliable summarization across domains like computer science, engineering, and social sciences.

Interactive chatbot providing real-time, context-aware answers.

Personalized user experience through saved histories and preferences.

Voice and accessibility features improving user inclusivity.

👩‍💻 Team
Name	Role
Akshaya Batharaju	Team Lead & Backend Developer (FastAPI, RAG, LLM Integration)
Yasha Sree Garige	Frontend Developer
Gopaldas Varshini	Frontend Developer
Vaishnavi Sampangi	UI/UX Design & Testing
Lalitha Vaishnavi	Database Management & Integration

👩‍🏫 Mentors
Ms. Kamal Vijetha Jillella
Mr. Shankar

💡 Learnings

Implementation of RAG pipelines with LLMs

Building full-stack AI applications with FastAPI + React

Secure authentication using JWT and Google OAuth

Effective frontend-backend integration

Managing cloud databases (MongoDB Atlas)

📢 Conclusion

PaperGlance successfully demonstrates how AI can simplify academic research.
By combining the power of Retrieval-Augmented Generation (RAG) and Google Gemini Pro, it enables users to save time, understand complex topics faster, and interact intelligently with academic content.
