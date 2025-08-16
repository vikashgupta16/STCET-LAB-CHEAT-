// Rooms API endpoint for Vercel
let rooms = new Map(); // In-memory storage for Vercel demo

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Return list of rooms
    const roomList = Array.from(rooms.entries()).map(([id, data]) => ({
      id,
      messageCount: data.messages ? data.messages.length : 0,
      lastActivity: data.lastActivity || new Date().toISOString()
    }));

    res.status(200).json({
      rooms: roomList,
      total: roomList.length
    });
  } else if (req.method === 'POST') {
    const { roomId } = req.body || {};
    
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        messages: [],
        lastActivity: new Date().toISOString()
      });
    }

    res.status(200).json({ 
      success: true, 
      roomId,
      message: 'Room created/joined successfully' 
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
