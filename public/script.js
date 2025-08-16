(() => {
  // Configuration for production deployment
  const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000'  // Local development
    : 'https://your-render-app.onrender.com';  // Production backend on Render
  
  const socket = io(BACKEND_URL);

  // Initialize the app
  initializeApp();

  function initializeApp() {
    const els = {
      roomId: document.getElementById('roomId'),
      joinBtn: document.getElementById('joinBtn'),
      recentBtn: document.getElementById('recentBtn'),
      recentRooms: document.getElementById('recentRooms'),
      recentList: document.getElementById('recentList'),
      codeInput: document.getElementById('codeInput'),
      sendBtn: document.getElementById('sendBtn'),
      shareBtn: document.getElementById('shareBtn'),
      aiBtn: document.getElementById('aiBtn'),
      aiOut: document.getElementById('aiOut'),
      status: document.getElementById('status'),
      messages: document.getElementById('messages'),
      homeView: document.getElementById('homeView'),
      chatView: document.getElementById('chatView'),
      roomsGrid: document.getElementById('roomsGrid'),
      refreshRooms: document.getElementById('refreshRooms'),
      newRoomName: document.getElementById('newRoomName'),
      createRoomBtn: document.getElementById('createRoomBtn'),
      backBtn: document.getElementById('backBtn'),
      currentRoomName: document.getElementById('currentRoomName'),
      roomShareBtn: document.getElementById('roomShareBtn'),
      deleteRoomBtn: document.getElementById('deleteRoomBtn'),
    };

  let currentRoom = '';
  let userId = 'user_' + Math.random().toString(36).substring(2, 15);

  function setStatus(text) {
    els.status.textContent = text;
  }

  function join(roomId) {
    if (!roomId || !socket) return;
    currentRoom = roomId.trim();
    socket.emit('join', { roomId: currentRoom, userId });
    setStatus(`Connected • ${currentRoom}`);
    
    // Save to recent rooms
    saveRecentRoom(currentRoom);
    els.recentRooms.hidden = true;
    
    // Switch to chat view
    showChatView(currentRoom);
  }

  function showHomeView() {
    els.homeView.hidden = false;
    els.chatView.hidden = true;
    currentRoom = '';
    loadPublicRooms();
  }

  function showChatView(roomName) {
    els.homeView.hidden = true;
    els.chatView.hidden = false;
    els.currentRoomName.textContent = roomName;
    
    // Clear messages
    els.messages.innerHTML = '';
    addSystemMessage(`Joined room: ${roomName}`);
  }

  async function loadPublicRooms() {
    try {
      els.roomsGrid.innerHTML = '<div class="loading">Loading rooms...</div>';
      
      const response = await fetch(`${BACKEND_URL}/api/rooms`);
      const rooms = await response.json();
      
      if (rooms.length === 0) {
        els.roomsGrid.innerHTML = `
          <div class="loading">
            No active rooms yet.<br>
            Be the first to create one! 🚀
          </div>
        `;
        return;
      }
      
      els.roomsGrid.innerHTML = rooms.map(room => `
        <div class="room-card" data-room="${room.roomId}">
          <div class="room-card-header">
            <div class="room-card-name">${room.roomId}</div>
            <div class="room-card-badge">${room.messageCount}</div>
          </div>
          <div class="room-card-stats">
            ${room.messageCount} messages • ${getTimeAgo(room.lastActivity)}
          </div>
          <div class="room-card-preview">
            ${room.lastMessage || 'No messages yet...'}
          </div>
        </div>
      `).join('');
      
      // Add click handlers
      els.roomsGrid.querySelectorAll('.room-card').forEach(card => {
        card.addEventListener('click', () => {
          const roomName = card.dataset.room;
          els.roomId.value = roomName;
          join(roomName);
        });
      });
      
    } catch (error) {
      els.roomsGrid.innerHTML = '<div class="loading">Failed to load rooms 😕</div>';
    }
  }

  function saveRecentRoom(roomId) {
    let recent = JSON.parse(localStorage.getItem('recentRooms') || '[]');
    recent = recent.filter(r => r.name !== roomId); // Remove if exists
    recent.unshift({ name: roomId, timestamp: Date.now() }); // Add to front
    recent = recent.slice(0, 10); // Keep only 10
    localStorage.setItem('recentRooms', JSON.stringify(recent));
    updateRecentList();
  }

  function updateRecentList() {
    const recent = JSON.parse(localStorage.getItem('recentRooms') || '[]');
    if (recent.length === 0) {
      els.recentList.innerHTML = '<p style="color: var(--text-muted); margin: 0;">No recent rooms</p>';
      return;
    }
    
    els.recentList.innerHTML = recent.map(room => {
      const timeAgo = getTimeAgo(room.timestamp);
      return `
        <div class="recent-item" data-room="${room.name}">
          <span class="recent-item-name">${room.name}</span>
          <span class="recent-item-time">${timeAgo}</span>
        </div>
      `;
    }).join('');
    
    // Add click handlers
    els.recentList.querySelectorAll('.recent-item').forEach(item => {
      item.addEventListener('click', () => {
        const roomName = item.dataset.room;
        els.roomId.value = roomName;
        join(roomName);
      });
    });
  }

  function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'welcome-msg';
    div.innerHTML = `<p>${text}</p>`;
    els.messages.appendChild(div);
    scrollToBottom();
  }

  function addMessage(data) {
    const div = document.createElement('div');
    div.className = `message ${data.userId === userId ? 'sent' : 'received'}`;
    
    const time = new Date(data.timestamp || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    div.innerHTML = `
      <div class="message-code">${escapeHtml(data.code)}</div>
      <div class="message-time">${time}</div>
    `;
    
    els.messages.appendChild(div);
    scrollToBottom();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function sanitizeInput(input) {
    return input?.toString().trim().substring(0, 10000) || ''; // Max 10k chars
  }

  function scrollToBottom() {
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function sendCode() {
    const code = sanitizeInput(els.codeInput.value);
    if (!code || !currentRoom || !socket) return;
    
    // Prevent spam
    if (code.length < 3) {
      alert('Code must be at least 3 characters long.');
      return;
    }
    
    const message = {
      roomId: currentRoom,
      userId,
      code,
      timestamp: Date.now()
    };
    
    socket.emit('send_message', message);
    els.codeInput.value = '';
    adjustTextareaHeight();
  }

  function adjustTextareaHeight() {
    els.codeInput.style.height = 'auto';
    els.codeInput.style.height = Math.min(els.codeInput.scrollHeight, 120) + 'px';
  }

  // Initialize recent rooms
  updateRecentList();
  
  // Check URL for direct room join
  if (roomFromQuery) {
    els.roomId.value = roomFromQuery;
    if (socket) join(roomFromQuery);
  } else {
    // Show home view by default
    showHomeView();
  }

  // Event listeners
  els.joinBtn.addEventListener('click', () => join(els.roomId.value));
  
  els.roomId.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') join(els.roomId.value);
  });

  // Home view events
  els.refreshRooms.addEventListener('click', loadPublicRooms);
  
  els.createRoomBtn.addEventListener('click', () => {
    const roomName = els.newRoomName.value.trim();
    if (roomName) {
      els.newRoomName.value = '';
      join(roomName);
    }
  });
  
  els.newRoomName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const roomName = els.newRoomName.value.trim();
      if (roomName) {
        els.newRoomName.value = '';
        join(roomName);
      }
    }
  });

  // Chat view events
  els.backBtn.addEventListener('click', showHomeView);
  
  els.roomShareBtn.addEventListener('click', async () => {
    if (!currentRoom) return;
    const url = new URL(location.href);
    url.searchParams.set('room', currentRoom);
    await navigator.clipboard.writeText(url.toString());
    els.roomShareBtn.textContent = '✓';
    setTimeout(() => (els.roomShareBtn.textContent = '📤'), 1000);
  });

  els.deleteRoomBtn.addEventListener('click', async () => {
    if (!currentRoom) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete room "${currentRoom}"?\n\nThis will permanently delete all messages and cannot be undone.`);
    if (!confirmDelete) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/rooms/${currentRoom}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showHomeView();
        alert(`Room "${currentRoom}" has been deleted successfully.`);
        loadPublicRooms(); // Refresh room list
      } else {
        const error = await response.json();
        alert(`Failed to delete room: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to delete room. Please try again.');
    }
  });

  // Recent rooms toggle
  els.recentBtn.addEventListener('click', () => {
    els.recentRooms.hidden = !els.recentRooms.hidden;
    if (!els.recentRooms.hidden) updateRecentList();
  });

  // Close recent rooms when clicking outside
  document.addEventListener('click', (e) => {
    if (!els.recentBtn.contains(e.target) && !els.recentRooms.contains(e.target)) {
      els.recentRooms.hidden = true;
    }
  });

  els.sendBtn.addEventListener('click', sendCode);
  
  els.codeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendCode();
    }
  });

  els.codeInput.addEventListener('input', adjustTextareaHeight);

  // Share button
  els.shareBtn.addEventListener('click', async () => {
    const rid = els.roomId.value?.trim();
    if (!rid) return;
    const url = new URL(location.href);
    url.searchParams.set('room', rid);
    await navigator.clipboard.writeText(url.toString());
    els.shareBtn.textContent = '✓';
    setTimeout(() => (els.shareBtn.textContent = '📤'), 1000);
  });

  // AI button
  els.aiBtn.addEventListener('click', async () => {
    const code = els.codeInput.value.trim();
    if (!code) return;
    
    els.aiOut.hidden = false;
    els.aiOut.textContent = 'AI is thinking...';
    
    try {
      const resp = await fetch(`${BACKEND_URL}/api/ask-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Briefly explain this code:\n\n${code}` })
      });
      const data = await resp.json();
      
      if (data && data.text) {
        els.aiOut.textContent = data.text;
      } else {
        els.aiOut.textContent = 'AI not available.';
      }
    } catch (e) {
      els.aiOut.textContent = 'AI request failed.';
    }
  });

  // Socket events - Full real-time functionality
  socket.on('connect', () => setStatus('Connected'));
  socket.on('disconnect', () => setStatus('Disconnected'));
  
  socket.on('message_received', (data) => {
    addMessage(data);
  });
  
  socket.on('room_history', (messages) => {
    els.messages.innerHTML = '';
    messages.forEach(msg => addMessage(msg));
    if (messages.length === 0) {
      addSystemMessage('Room is empty. Start sharing code!');
    }
  });
  
  socket.on('user_joined', (data) => {
    addSystemMessage(`${data.userId} joined the room`);
  });

  socket.on('room_deleted', (data) => {
    if (data.roomId === currentRoom) {
      alert(`Room "${currentRoom}" has been deleted by another user.`);
      showHomeView();
    }
  });

  // Initialize app status
  setStatus('Connecting...');

  // Initialize startup
  const urlParams = new URLSearchParams(window.location.search);
  const roomFromQuery = urlParams.get('room');
  const lastRoom = localStorage.getItem('lastRoom');
  
  if (roomFromQuery) {
    els.roomId.value = roomFromQuery;
    join(roomFromQuery);
  } else if (lastRoom) {
    els.roomId.value = lastRoom;
  }

  // Initialize recent rooms
  updateRecentList();
  
  // Check URL for direct room join
  if (roomFromQuery) {
    els.roomId.value = roomFromQuery;
    join(roomFromQuery);
  } else {
    // Show home view by default
    showHomeView();
  }

  // Close the initializeApp function
  }
})();