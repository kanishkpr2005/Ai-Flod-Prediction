# Vercel Frontend Deployment

Deploy the Next.js frontend to Vercel:

1. **Import the repository into Vercel**.
2. In the deployment configuration (or **Project Settings > General**):
   - **Root Directory**: Set to `frontend`
   - **Framework Preset**: Next.js (automatically detected)
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your deployed Render backend URL (e.g., `https://ai-flod-prediction.onrender.com`).

---

# Render Backend Deployment

The backend is deployed as a Web Service on Render:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `FRONTEND_ORIGINS`: Your deployed Vercel frontend URL (e.g., `https://your-frontend.vercel.app`)