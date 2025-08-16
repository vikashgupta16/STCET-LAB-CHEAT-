// Messages API endpoint for Vercel
let messages = new Map(); // roomId -> array of messages

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { roomId } = req.query;

  if (req.method === 'GET') {
    // Get messages for a room
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    const roomMessages = messages.get(roomId) || [];
    res.status(200).json({
      roomId,
      messages: roomMessages,
      total: roomMessages.length
    });

  } else if (req.method === 'POST') {
    // Send a message to a room
    const { userId, code, timestamp } = req.body || {};
    
    if (!roomId || !userId || !code) {
      return res.status(400).json({ error: 'Room ID, user ID, and code required' });
    }

    const message = {
      id: Date.now().toString(),
      userId,
      content: code,
      timestamp: timestamp || new Date().toISOString()
    };

    if (!messages.has(roomId)) {
      messages.set(roomId, []);
    }

    messages.get(roomId).push(message);

    // Keep only last 100 messages per room to prevent memory issues
    const roomMessages = messages.get(roomId);
    if (roomMessages.length > 100) {
      messages.set(roomId, roomMessages.slice(-100));
    }

    res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully',
      messageId: message.id
    });

  } else if (req.method === 'DELETE') {
    // Clear room messages
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    messages.delete(roomId);
    res.status(200).json({ 
      success: true, 
      message: 'Room cleared successfully' 
    });

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
