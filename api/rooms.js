// Rooms API endpoint for Vercel
let rooms = new Map(); // In-memory storage for real rooms

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Return list of actual rooms (no demo data)
    const roomList = Array.from(rooms.entries()).map(([id, data]) => ({
      roomId: id,
      messageCount: data.messageCount || 0,
      lastActivity: data.lastActivity || new Date().toISOString(),
      preview: data.lastMessage || 'No messages yet'
    }));

    res.status(200).json(roomList);
  } else if (req.method === 'POST') {
    const { roomId } = req.body || {};
    
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        messageCount: 0,
        lastActivity: new Date().toISOString(),
        lastMessage: 'Room created'
      });
    }

    res.status(200).json({ 
      success: true, 
      roomId,
      message: 'Room created/joined successfully' 
    });

  } else if (req.method === 'DELETE') {
    const { roomId } = req.body || {};
    
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    rooms.delete(roomId);
    res.status(200).json({ 
      success: true, 
      message: 'Room deleted successfully' 
    });

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
