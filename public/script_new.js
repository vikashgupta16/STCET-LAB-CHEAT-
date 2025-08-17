// Modern STCET Code Share Application
class CodeShareApp {
  constructor() {
    this.socket = null;
    this.currentRoom = null;
    this.currentView = 'welcome';
    this.isConnected = false;
    
    this.initializeElements();
    this.bindEvents();
    this.initializeSocket();
    this.showToast('Welcome to STCET Code Share!', 'Ready to start sharing code', 'info');
  }

  // Initialize DOM elements
  initializeElements() {
    // Views
    this.welcomeScreen = document.getElementById('welcomeScreen');
    this.roomBrowser = document.getElementById('roomBrowser');
    this.chatInterface = document.getElementById('chatInterface');
    
    // Welcome screen elements
    this.roomInput = document.getElementById('roomInput');
    this.joinBtn = document.getElementById('joinBtn');
    this.createBtn = document.getElementById('createBtn');
    this.browseBtn = document.getElementById('browseBtn');
    
    // Room browser elements
    this.backToWelcome = document.getElementById('backToWelcome');
    this.refreshRooms = document.getElementById('refreshRooms');
    this.roomsGrid = document.getElementById('roomsGrid');
    
    // Chat interface elements
    this.leaveRoom = document.getElementById('leaveRoom');
    this.currentRoomName = document.getElementById('currentRoomName');
    this.roomMembers = document.getElementById('roomMembers');
    this.shareRoom = document.getElementById('shareRoom');
    this.deleteRoom = document.getElementById('deleteRoom');
    this.messagesContainer = document.getElementById('messagesContainer');
    this.codeInput = document.getElementById('codeInput');
    this.formatCode = document.getElementById('formatCode');
    this.sendMessage = document.getElementById('sendMessage');
    
    // Status elements
    this.statusDot = document.getElementById('statusDot');
    this.statusText = document.getElementById('statusText');
    this.toastContainer = document.getElementById('toastContainer');
  }

  // Bind event listeners
  bindEvents() {
    // Welcome screen events
    this.joinBtn.addEventListener('click', () => this.handleJoinRoom());
    this.createBtn.addEventListener('click', () => this.handleCreateRoom());
    this.browseBtn.addEventListener('click', () => this.showRoomBrowser());
    
    // Room input enter key
    this.roomInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          this.handleCreateRoom();
        } else {
          this.handleJoinRoom();
        }
      }
    });
    
    // Room browser events
    this.backToWelcome.addEventListener('click', () => this.showWelcome());
    this.refreshRooms.addEventListener('click', () => this.loadRooms());
    
    // Chat interface events
    this.leaveRoom.addEventListener('click', () => this.handleLeaveRoom());
    this.shareRoom.addEventListener('click', () => this.handleShareRoom());
    this.deleteRoom.addEventListener('click', () => this.handleDeleteRoom());
    this.formatCode.addEventListener('click', () => this.handleFormatCode());
    this.sendMessage.addEventListener('click', () => this.handleSendMessage());
    
    // Code input events
    this.codeInput.addEventListener('input', () => this.updateSendButton());
    this.codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.handleSendMessage();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        e.target.value = e.target.value.substring(0, start) + '  ' + e.target.value.substring(end);
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }
    });
  }

  // Initialize Socket.IO connection
  initializeSocket() {
    this.socket = io();
    
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.updateStatus('Connected', true);
      this.showToast('Connected', 'Successfully connected to server', 'success');
    });
    
    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.updateStatus('Disconnected', false);
      this.showToast('Disconnected', 'Lost connection to server', 'error');
    });
    
    this.socket.on('roomJoined', (data) => {
      this.currentRoom = data.room;
      this.showChatInterface();
      this.currentRoomName.textContent = data.room;
      this.roomMembers.textContent = `${data.memberCount} member${data.memberCount !== 1 ? 's' : ''}`;
      this.showToast('Joined Room', `Successfully joined ${data.room}`, 'success');
      this.loadMessages();
    });
    
    this.socket.on('roomCreated', (data) => {
      this.currentRoom = data.room;
      this.showChatInterface();
      this.currentRoomName.textContent = data.room;
      this.roomMembers.textContent = '1 member';
      this.showToast('Room Created', `Created room ${data.room}`, 'success');
    });
    
    this.socket.on('message', (data) => {
      this.displayMessage(data);
    });
    
    this.socket.on('roomList', (rooms) => {
      this.displayRooms(rooms);
    });
    
    this.socket.on('memberCount', (count) => {
      this.roomMembers.textContent = `${count} member${count !== 1 ? 's' : ''}`;
    });
    
    this.socket.on('error', (error) => {
      this.showToast('Error', error.message, 'error');
    });
    
    this.socket.on('roomDeleted', () => {
      this.showToast('Room Deleted', 'The room has been deleted', 'info');
      this.handleLeaveRoom();
    });
  }

  // View management
  showView(viewName) {
    this.welcomeScreen.hidden = viewName !== 'welcome';
    this.roomBrowser.hidden = viewName !== 'browser';
    this.chatInterface.hidden = viewName !== 'chat';
    this.currentView = viewName;
  }

  showWelcome() {
    this.showView('welcome');
    this.roomInput.focus();
  }

  showRoomBrowser() {
    this.showView('browser');
    this.loadRooms();
  }

  showChatInterface() {
    this.showView('chat');
    this.updateSendButton();
    this.codeInput.focus();
  }

  // Room management
  handleJoinRoom() {
    const roomName = this.roomInput.value.trim();
    if (!roomName) {
      this.showToast('Invalid Room Name', 'Please enter a room name', 'error');
      return;
    }
    
    if (!this.isConnected) {
      this.showToast('Not Connected', 'Please wait for connection', 'error');
      return;
    }
    
    this.socket.emit('joinRoom', roomName);
  }

  handleCreateRoom() {
    const roomName = this.roomInput.value.trim();
    if (!roomName) {
      this.showToast('Invalid Room Name', 'Please enter a room name', 'error');
      return;
    }
    
    if (!this.isConnected) {
      this.showToast('Not Connected', 'Please wait for connection', 'error');
      return;
    }
    
    this.socket.emit('createRoom', roomName);
  }

  handleLeaveRoom() {
    if (this.currentRoom) {
      this.socket.emit('leaveRoom', this.currentRoom);
      this.currentRoom = null;
    }
    this.showWelcome();
    this.roomInput.value = '';
  }

  handleShareRoom() {
    if (this.currentRoom) {
      const url = `${window.location.origin}?room=${encodeURIComponent(this.currentRoom)}`;
      navigator.clipboard.writeText(url).then(() => {
        this.showToast('Room Shared', 'Room URL copied to clipboard', 'success');
      }).catch(() => {
        this.showToast('Share Failed', 'Could not copy to clipboard', 'error');
      });
    }
  }

  handleDeleteRoom() {
    if (!this.currentRoom) return;
    
    if (confirm(`Are you sure you want to delete the room "${this.currentRoom}"? This action cannot be undone.`)) {
      this.socket.emit('deleteRoom', this.currentRoom);
    }
  }

  // Message management
  handleSendMessage() {
    const content = this.codeInput.value.trim();
    if (!content) return;
    
    if (!this.currentRoom) {
      this.showToast('Not in Room', 'Join a room to send messages', 'error');
      return;
    }
    
    this.socket.emit('sendMessage', {
      room: this.currentRoom,
      content: content,
      timestamp: new Date().toISOString()
    });
    
    this.codeInput.value = '';
    this.updateSendButton();
  }

  handleFormatCode() {
    const content = this.codeInput.value;
    if (!content.trim()) return;
    
    try {
      // Basic code formatting
      let formatted = content
        .replace(/\s*{\s*/g, ' {\n  ')
        .replace(/;\s*/g, ';\n  ')
        .replace(/}\s*/g, '\n}\n')
        .replace(/,\s*/g, ',\n  ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      
      this.codeInput.value = formatted;
      this.showToast('Code Formatted', 'Basic formatting applied', 'info');
    } catch (error) {
      this.showToast('Format Error', 'Could not format code', 'error');
    }
  }

  displayMessage(messageData) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    const timestamp = new Date(messageData.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    messageElement.innerHTML = `
      <div class="message-header">
        <span class="message-author">${this.escapeHtml(messageData.author || 'Anonymous')}</span>
        <span class="message-time">${timestamp}</span>
      </div>
      <div class="message-content">${this.escapeHtml(messageData.content)}</div>
    `;
    
    // Remove welcome message if it exists
    const welcomeMessage = this.messagesContainer.querySelector('.room-welcome');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
    
    this.messagesContainer.appendChild(messageElement);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  loadMessages() {
    if (this.currentRoom) {
      this.socket.emit('getMessages', this.currentRoom);
    }
  }

  // Room list management
  loadRooms() {
    this.roomsGrid.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading rooms...</p>
      </div>
    `;
    this.socket.emit('getRooms');
  }

  displayRooms(rooms) {
    if (rooms.length === 0) {
      this.roomsGrid.innerHTML = `
        <div class="loading-state">
          <div style="font-size: 48px; margin-bottom: 16px;">🏠</div>
          <p>No active rooms</p>
          <button class="btn btn-primary" onclick="app.showWelcome()">Create First Room</button>
        </div>
      `;
      return;
    }
    
    this.roomsGrid.innerHTML = rooms.map(room => `
      <div class="room-card" onclick="app.joinRoomFromBrowser('${this.escapeHtml(room.name)}')">
        <div class="room-header">
          <div class="room-name">${this.escapeHtml(room.name)}</div>
          <div class="room-badge">${room.memberCount} member${room.memberCount !== 1 ? 's' : ''}</div>
        </div>
        <div class="room-stats">
          ${room.messageCount || 0} messages • Active ${this.getRelativeTime(room.lastActivity)}
        </div>
        <div class="room-preview">
          ${room.lastMessage ? this.escapeHtml(room.lastMessage.substring(0, 100)) + (room.lastMessage.length > 100 ? '...' : '') : 'No messages yet'}
        </div>
      </div>
    `).join('');
  }

  joinRoomFromBrowser(roomName) {
    this.roomInput.value = roomName;
    this.handleJoinRoom();
  }

  // UI updates
  updateStatus(text, connected) {
    this.statusText.textContent = text;
    this.statusDot.style.background = connected ? '#10b981' : '#ef4444';
  }

  updateSendButton() {
    const hasContent = this.codeInput.value.trim().length > 0;
    const inRoom = !!this.currentRoom;
    this.sendMessage.disabled = !hasContent || !inRoom;
  }

  // Toast notifications
  showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️'
    };
    
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${this.escapeHtml(title)}</div>
        <div class="toast-message">${this.escapeHtml(message)}</div>
      </div>
    `;
    
    this.toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  // Utility functions
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  // Handle URL parameters for direct room joining
  handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      this.roomInput.value = roomParam;
      // Small delay to ensure socket is connected
      setTimeout(() => {
        if (this.isConnected) {
          this.handleJoinRoom();
        }
      }, 1000);
    }
  }
}

// Additional CSS for slideOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new CodeShareApp();
  app.handleURLParams();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && app && app.currentRoom) {
    app.loadMessages();
  }
});
