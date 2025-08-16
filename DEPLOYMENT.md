# Important: Socket.IO on Vercel Limitations

Socket.IO requires persistent connections which don't work well with Vercel's serverless functions. For production deployment on Vercel, the app will use API polling instead of WebSockets.

For full Socket.IO real-time functionality, consider deploying to:
- Railway (recommended)
- Render
- Heroku
- Any VPS with persistent connections

The current deployment on Vercel will work for basic room management and code sharing, but real-time updates will be limited.
