// Simple API test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Vercel deployment working',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      hasMongoURI: !!process.env.MONGO_URI,
      hasOpenAI: !!process.env.OPENAI_API_KEY
    }
  });
});
