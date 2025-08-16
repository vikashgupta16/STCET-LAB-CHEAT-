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
      roomId: id,
      messageCount: data.messages ? data.messages.length : 0,
      lastActivity: data.lastActivity || new Date().toISOString(),
      preview: data.messages && data.messages.length > 0 
        ? data.messages[data.messages.length - 1].content.substring(0, 50) + '...'
        : 'No messages yet'
    }));

    // Add some demo rooms if none exist
    if (roomList.length === 0) {
      const demoRooms = [
        {
          roomId: 'Welcome',
          messageCount: 3,
          lastActivity: new Date().toISOString(),
          preview: 'Welcome to STCET Code Share! 🚀'
        },
        {
          roomId: 'JavaScript Help',
          messageCount: 7,
          lastActivity: new Date(Date.now() - 3600000).toISOString(),
          preview: 'console.log("Hello World");'
        },
        {
          roomId: 'Python Basics',
          messageCount: 12,
          lastActivity: new Date(Date.now() - 7200000).toISOString(),
          preview: 'print("Learning Python!")'
        }
      ];
      
      // Add demo rooms to memory
      demoRooms.forEach(room => {
        rooms.set(room.roomId, {
          messages: Array(room.messageCount).fill().map((_, i) => ({
            content: `Demo message ${i + 1}`,
            userId: 'demo_user',
            timestamp: new Date(Date.now() - (room.messageCount - i) * 300000).toISOString()
          })),
          lastActivity: room.lastActivity
        });
      });

      res.status(200).json(demoRooms);
    } else {
      res.status(200).json(roomList);
    }
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
