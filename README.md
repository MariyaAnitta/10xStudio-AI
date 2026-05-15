# 10xStudio.AI - Menu Engineering & Visual Intelligence Suite

A professional, production-grade platform designed to revolutionize restaurant profitability through AI-driven menu engineering and cinematic visual creation.

## 🚀 Overview

10xStudio.AI bridges the gap between business metrics and culinary aesthetics. It analyzes menu performance (Profit vs. Popularity) and automatically enhances or generates high-end food photography to drive revenue for "Profit Hero" dishes.

## 📁 Project Structure

The project uses a **Multi-Layer Hybrid Architecture**:

*   **`/menu-engineering-ai-main/frontend`**: (Next.js) A modern React dashboard providing visual insights, audit results, and a menu engineering interface.
*   **`/menu-engineering-ai-main/backend`**: (FastAPI) The orchestration layer handling Excel processing, Firestore synchronization, and AI pipeline management.
*   **Root Directory Python Scripts**: The "Intelligence Engine" containing core logic for:
    *   `visual_intelligence.py`: Audits food photos against business performance.
    *   `visual_processor_nano.py`: Generates professional variations of dish images.
    *   `gemini_bridge.py`: Orchestrates cinematic video generation.
    *   `video_renderer.py`: Handles high-fidelity MP4 exports.

## 🛠️ Tech Stack

*   **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Lucide.
*   **Backend**: Python 3.10+, FastAPI, Pandas, Subprocess.
*   **AI Engine**: Google Gemini 1.5 Flash, Vertex AI Imagen 3.
*   **Database & Storage**: 
    *   **Firestore**: Metadata persistence (Analyses, Audits, Selections).
    *   **Supabase / GCS**: Scalable object storage for high-resolution culinary imagery.

## ⚙️ Installation & Setup

### 1. Prerequisites
*   Node.js (v18+)
*   Python 3.10+
*   Google Cloud Project with Vertex AI enabled.

### 2. Environment Variables
Create a `.env` file in the root and backend folders based on the provided `.env.example`. 

**Critical keys needed:**
*   `GOOGLE_APPLICATION_CREDENTIALS` (Path to your service account JSON)
*   `SUPABASE_URL` & `SUPABASE_KEY` (If using Supabase storage)

### 3. Backend Setup
```bash
cd menu-engineering-ai-main/backend
pip install -r requirements.txt
python api/server.py
```

### 4. Frontend Setup
```bash
cd menu-engineering-ai-main/frontend
npm install
npm run dev
```

## 🔒 Security Note
The `service-account.json` and `.env` files are excluded from this repository via `.gitignore`. Please ensure these are shared securely with the team.

---
**Developed by 10xStudio Team**
