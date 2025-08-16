# 🚀 Production Deployment Guide

## Architecture
- **Frontend**: Static files hosted on Vercel
- **Backend**: Node.js + Socket.IO server on Render
- **Real-time**: Full Socket.IO functionality with persistent connections

## 1. Deploy Backend to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub account

### Step 2: Deploy Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository: `vikashgupta16/STCET-LAB-CHEAT-`
3. Configure:
   - **Name**: `stcet-code-share-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Set Environment Variables
Add these in Render dashboard:
```
MONGO_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=production
```

### Step 4: Get Your Backend URL
After deployment, you'll get a URL like: `https://stcet-code-share-backend.onrender.com`

## 2. Deploy Frontend to Vercel

### Step 1: Update Backend URL
1. Edit `public/script.js`
2. Replace `'https://your-render-app.onrender.com'` with your actual Render URL

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: Leave empty (uses root)
   - **Build Command**: Leave empty (static files)
   - **Output Directory**: `public`

## 3. Update CORS Settings

After getting your Vercel URL, update the server CORS settings:

1. Edit `server/index.js`
2. Replace `"https://your-vercel-app.vercel.app"` with your actual Vercel URL
3. Redeploy the backend on Render

## 4. Test the Deployment

1. Visit your Vercel frontend URL
2. Check browser console for connection status
3. Test room creation and messaging
4. Verify real-time updates work across multiple browsers

## Expected URLs
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

## Features Working
✅ Real-time messaging with Socket.IO  
✅ Room creation and management  
✅ AI code explanations  
✅ Cross-browser synchronization  
✅ Message persistence  
✅ Room deletion  

## Troubleshooting

### Connection Issues
- Check browser console for CORS errors
- Verify backend URL in `script.js` matches Render URL
- Ensure CORS settings include your Vercel domain

### Backend Issues
- Check Render logs for errors
- Verify environment variables are set
- Test API endpoints directly

### Real-time Issues
- Confirm Socket.IO is connecting (check status indicator)
- Test with multiple browser tabs
- Check Render service is running (not sleeping)
