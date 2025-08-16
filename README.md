# STCET Code Share

🚀 **Real-time code sharing platform for STCET labs** - Share code instantly across devices with WhatsApp-like interface.

## ✨ Features

- **📱 WhatsApp-style Chat**: Send code as messages with timestamps
- **🔍 Room Discovery**: Browse all active public rooms
- **📋 Recent Rooms**: Quick access to your last 10 rooms
- **🤖 AI Assistant**: Get code explanations (OpenAI powered)
- **📤 Share Links**: Copy shareable room URLs
- **🗑️ Room Management**: Delete rooms with confirmation
- **📱 Mobile Optimized**: Responsive design, battery efficient
- **⚡ Real-time Sync**: Instant message delivery via WebSockets
- **💾 Persistence**: MongoDB storage with in-memory fallback

## 🏗️ Tech Stack

- **Backend**: Node.js + Express + Socket.IO
- **Database**: MongoDB (optional, falls back to memory)
- **Frontend**: Vanilla JS + Modern CSS
- **AI**: OpenAI GPT-4o-mini
- **Deployment**: Docker ready, supports Vercel/Railway/Render

## 🚀 Quick Start

### Local Development

```bash
# Clone repository
git clone https://github.com/vikashgupta16/STCET-LAB-CHEAT-.git
cd STCET-LAB-CHEAT-

# Install dependencies
cd server
npm install

# Configure environment (optional)
cp .env.example .env
# Edit .env with your MongoDB URI and OpenAI API key

# Start development server
npm run dev
```

Open http://localhost:3000

### Environment Variables

```env
PORT=3000
MONGO_URI=mongodb+srv://your-connection-string  # Optional
DB_NAME=stcet_share
OPENAI_API_KEY=sk-your-openai-key              # Optional
OPENAI_MODEL=gpt-4o-mini
```

## 📋 Usage

1. **Join Room**: Enter room name → Join
2. **Send Code**: Type in textarea → Send or Ctrl+Enter
3. **Discover Rooms**: Browse active rooms on homepage
4. **Share Room**: Use 📤 button to copy shareable link
5. **Get AI Help**: Click 🤖 to explain your code
6. **Delete Room**: Use 🗑️ button (with confirmation)

## 🌐 Deployment

### Railway/Render/Fly.io
```bash
# Deploy server folder as Node.js app
# Set environment variables in platform dashboard
```

### Vercel (Serverless)
```bash
cd server
vercel --prod
```

### Docker
```bash
# Build and run
docker build -t stcet-code-share .
docker run -p 3000:3000 stcet-code-share
```

## 🔒 Security & Privacy

- **Public Rooms**: No authentication required by design
- **Data Privacy**: Rooms are public, don't share secrets
- **Rate Limiting**: Built-in protection against spam
- **Input Sanitization**: XSS protection on all inputs
- **CORS**: Configured for cross-origin requests

## 🎯 Production Features

- ✅ Error boundaries and graceful fallbacks
- ✅ Loading states and offline handling
- ✅ MongoDB persistence with memory fallback
- ✅ Environment-based configuration
- ✅ Docker containerization ready
- ✅ Mobile-first responsive design
- ✅ Performance optimized (minimal bundle)
- ✅ SEO friendly meta tags
- ✅ Progressive enhancement

## 📱 Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - feel free to use for educational purposes.

## 🏫 About STCET

Built for **Sahyadri College of Engineering & Technology** students to share code during practical sessions and collaborative learning.

---

**🔧 Need help?** Open an issue or contact [@vikashgupta16](https://github.com/vikashgupta16)
