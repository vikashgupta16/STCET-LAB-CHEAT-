(() => {
  // Configuration for production deployment
  const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000'  // Local development
    : 'https://stcet-lab-cheat-backend.onrender.com';  // Replace with your actual Render URL
  
  const socket = io(BACKEND_URL);

  // Initialize the app
  initializeApp();

  function initializeApp() {
    // Get URL parameters for direct room join
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromQuery = urlParams.get('room');
    
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
      connectionStatus: document.getElementById('connectionStatus'),
      statusText: document.getElementById('statusText'),
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
  let isConnected = false;
  let isInRoom = false;

  function updateConnectionStatus(connected, inRoom = false) {
    isConnected = connected;
    isInRoom = inRoom;
    
    // Update visual status indicator
    els.connectionStatus.className = 'status-indicator';
    if (connected && inRoom) {
      els.connectionStatus.classList.add('in-room');
      els.statusText.textContent = `Connected to ${currentRoom}`;
    } else if (connected) {
      els.connectionStatus.classList.add('connected');
      els.statusText.textContent = 'Connected - Join a room to start sharing';
    } else {
      els.statusText.textContent = 'Disconnected - Join a room to start sharing';
    }
    
    // Update button states
    updateButtonStates();
  }

  function updateButtonStates() {
    const canSend = isConnected && isInRoom && els.codeInput.value.trim().length > 0;
    const canUseFeatures = isConnected && isInRoom;
    
    // Send button
    els.sendBtn.disabled = !canSend;
    els.sendBtn.title = canSend 
      ? 'Send code to room' 
      : !isInRoom 
        ? 'Join a room to send messages'
        : 'Type some code to send';
    
    // Share button
    els.shareBtn.disabled = !canUseFeatures;
    els.shareBtn.setAttribute('data-tooltip', 
      canUseFeatures ? 'Share room link' : 'Join a room to share');
    
    // AI button
    els.aiBtn.disabled = !canUseFeatures;
    els.aiBtn.setAttribute('data-tooltip', 
      canUseFeatures ? 'Get AI help with code' : 'AI available in rooms');
    
    // Add pulse effect when ready to send
    if (canSend) {
      els.sendBtn.classList.add('pulse');
    } else {
      els.sendBtn.classList.remove('pulse');
    }
  }

  function setStatus(text, connected = false, inRoom = false) {
    els.status.textContent = text;
    updateConnectionStatus(connected, inRoom);
  }

  function join(roomId) {
    if (!roomId || !socket) return;
    currentRoom = roomId.trim();
    socket.emit('join', { roomId: currentRoom, userId });
    setStatus(`Connected • ${currentRoom}`, true, true);
    
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
    isInRoom = false;
    updateConnectionStatus(isConnected, false);
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

  els.codeInput.addEventListener('input', (e) => {
    adjustTextareaHeight();
    updateButtonStates(); // Update send button state based on input
  });

  // Share button - Updated for better functionality
  els.shareBtn.addEventListener('click', async () => {
    if (!isInRoom) return;
    
    const url = new URL(window.location.href);
    url.searchParams.set('room', currentRoom);
    
    try {
      await navigator.clipboard.writeText(url.toString());
      
      // Visual feedback
      const originalHTML = els.shareBtn.innerHTML;
      els.shareBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
      els.shareBtn.style.color = 'var(--success)';
      
      setTimeout(() => {
        els.shareBtn.innerHTML = originalHTML;
        els.shareBtn.style.color = '';
      }, 2000);
      
      // Show temporary notification
      showNotification('Room link copied to clipboard!', 'success');
    } catch (err) {
      showNotification('Failed to copy link', 'error');
    }
  });

  // AI button - Enhanced with better UX
  els.aiBtn.addEventListener('click', async () => {
    if (!isInRoom) {
      showNotification('Join a room to use AI features', 'warning');
      return;
    }
    
    const code = els.codeInput.value.trim();
    if (!code) {
      showNotification('Enter some code to get AI help', 'warning');
      return;
    }
    
    els.aiOut.hidden = false;
    els.aiOut.textContent = '🤖 AI is analyzing your code...';
    
    // Disable button during request
    els.aiBtn.disabled = true;
    
    try {
      const resp = await fetch(`${BACKEND_URL}/api/ask-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Briefly explain this code:\n\n${code}` })
      });
      const data = await resp.json();
      
      if (data && data.text) {
        els.aiOut.textContent = `🤖 AI Analysis:\n\n${data.text}`;
      } else {
        els.aiOut.textContent = '🤖 AI service is currently unavailable.';
      }
    } catch (e) {
      els.aiOut.textContent = '🤖 Failed to connect to AI service. Please try again.';
      console.error('AI request failed:', e);
    } finally {
      els.aiBtn.disabled = false;
      updateButtonStates();
    }
  });

  // Add notification function
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--${type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'accent'});
      color: white;
      padding: 12px 16px;
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      font-size: 14px;
      max-width: 300px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Socket events - Enhanced with proper state management
  socket.on('connect', () => {
    setStatus('Connected', true, isInRoom);
    showNotification('Connected to server', 'success');
  });
  
  socket.on('disconnect', () => {
    setStatus('Disconnected', false, false);
    showNotification('Disconnected from server', 'error');
  });
  
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

  // Initialize startup - use the already declared variables
  const lastRoom = localStorage.getItem('lastRoom');
  
  if (roomFromQuery) {
    els.roomId.value = roomFromQuery;
    join(roomFromQuery);
  } else if (lastRoom) {
    els.roomId.value = lastRoom;
  }

  // Initialize recent rooms
  updateRecentList();
  
  // Show home view if no room specified
  if (!roomFromQuery) {
    showHomeView();
  }

  // Initialize app status and button states
  setStatus('Connecting...', false, false);
  updateButtonStates();

  // Close the initializeApp function
  }
})();