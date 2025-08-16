# Deploy notes

- Render / Railway / Fly.io: deploy the `server` folder as a Node service. Set env:
  - `PORT` (the platform often injects it)
  - `MONGO_URI`
  - `DB_NAME`
  - `OPENAI_API_KEY` (optional)
- Vercel: this is a single server that also serves static files from `../public`. Vercel serverless may need custom rewrites; for sockets, use a long-running Node server host instead (Railway/Render).
- MongoDB Atlas: use your connection string. Create DB `stcet_share` and a `rooms` collection (auto-created on first write).
