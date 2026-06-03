import { Send, User as UserIcon, ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../api/axios';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  latestMessage?: ChatMessage;
  unreadCount?: number;
}

interface ChatMessage {
  _id: string;
  user: string;
  sender: 'user' | 'admin';
  message: string;
  createdAt: string;
  read: boolean;
}

export default function Chat() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/chat/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Initialize socket (use root when served from VPS)
    const socketUrl = import.meta.env.PROD ? undefined : 'http://103.72.99.67:5001';
    socketRef.current = io(socketUrl);

    socketRef.current.on('newMessageNotification', () => {
      fetchUsers(); // Refresh the list when a new message arrives
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedUser && socketRef.current) {
      // Fetch chat history
      const fetchHistory = async () => {
        try {
          const res = await api.get(`/chat/${selectedUser._id}`);
          setMessages(res.data);
          // Mark as read
          await api.post(`/chat/read/${selectedUser._id}`);
          fetchUsers(); // update unread count in list
        } catch (err) {
          console.error('Error fetching chat history:', err);
        }
      };
      
      fetchHistory();
      
      // Join socket room
      socketRef.current.emit('join', selectedUser._id);
      
      // Listen for messages in this room
      const handleReceiveMessage = (newMessage: ChatMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        // mark as read if it's from user
        if (newMessage.sender === 'user') {
          api.post(`/chat/read/${selectedUser._id}`).then(fetchUsers);
        }
      };

      socketRef.current.on('receiveMessage', handleReceiveMessage);

      return () => {
        socketRef.current?.off('receiveMessage', handleReceiveMessage);
      };
    }
  }, [selectedUser]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedUser || !socketRef.current) return;

    const messageData = {
      user: selectedUser._id,
      sender: 'admin',
      message: inputText.trim()
    };

    socketRef.current.emit('sendMessage', messageData);
    setInputText('');
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Chat Khách Hàng</h1>
      </div>

      <div className="chat-container">
        {/* Users List */}
        <div className={`glass-panel chat-sidebar ${selectedUser ? 'mobile-hidden' : ''}`}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
            Danh sách cuộc trò chuyện
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingUsers ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>
            ) : users.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-gray)' }}>Chưa có tin nhắn nào</div>
            ) : (
              users.map((user) => (
                <div
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background: selectedUser?._id === user._id ? 'rgba(198, 124, 78, 0.1)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserIcon size={20} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                      {user.unreadCount ? (
                        <span style={{ background: '#F44336', color: 'white', fontSize: '12px', padding: '2px 6px', borderRadius: '10px' }}>
                          {user.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.latestMessage?.message || 'Chưa có tin nhắn'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`glass-panel chat-main ${!selectedUser ? 'mobile-hidden' : ''}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  className="chat-back-btn" 
                  onClick={() => setSelectedUser(null)}
                  style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ArrowLeft size={24} color="var(--text-dark)" />
                </button>
                {selectedUser.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} alt={selectedUser.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserIcon size={20} />
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600 }}>{selectedUser.name || 'Khách hàng'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
                    {selectedUser.phone ? `${selectedUser.phone} • ` : ''}{selectedUser.email}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((msg, idx) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div key={msg._id || idx} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: isAdmin ? 'var(--primary)' : '#F5F5F5',
                        color: isAdmin ? 'white' : 'var(--text-dark)',
                        borderBottomRightRadius: isAdmin ? '4px' : '16px',
                        borderBottomLeftRadius: isAdmin ? '16px' : '4px',
                      }}>
                        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{msg.message}</div>
                        <div style={{ fontSize: '10px', marginTop: '4px', textAlign: 'right', color: isAdmin ? 'rgba(255,255,255,0.7)' : 'var(--text-gray)' }}>
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Nhập tin nhắn..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  style={{
                    padding: '0 20px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-gray)' }}>
              Chọn một khách hàng để bắt đầu trò chuyện
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
