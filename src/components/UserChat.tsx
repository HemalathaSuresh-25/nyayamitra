'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Send, X, User, ShieldCheck, Clock } from 'lucide-react';

interface UserChatProps {
  currentEmail: string;
  targetUser: {
    email: string;
    name: string;
    role: string;
  };
  onClose: () => void;
}

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

export default function UserChat({ currentEmail, targetUser, onClose }: UserChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Unified chat key: sort emails alphabetically to ensure both users see the same history
  const chatKey = `nyaya_chat_${[currentEmail, targetUser.email].sort().join('_')}`;

  const loadMessages = () => {
    const history = JSON.parse(localStorage.getItem(chatKey) || '[]');
    setMessages(history);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 2000); // Poll for new messages
    return () => clearInterval(interval);
  }, [chatKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      sender: currentEmail,
      text: newMessage,
      timestamp: Date.now()
    };

    const updatedHistory = [...messages, msg];
    localStorage.setItem(chatKey, JSON.stringify(updatedHistory));
    setMessages(updatedHistory);
    setNewMessage('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <User size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>{targetUser.name}</h4>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{targetUser.role.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X /></button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p style={{ fontSize: '0.9rem' }}>Secure chat initiated.<br/>Your messages are private.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ 
              alignSelf: m.sender === currentEmail ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              background: m.sender === currentEmail ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              padding: '12px 16px',
              borderRadius: m.sender === currentEmail ? '16px 16px 0 16px' : '16px 16px 16px 0',
              fontSize: '0.9rem',
              position: 'relative'
            }}>
              {m.text}
              <div style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '4px', textAlign: 'right' }}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ 
              flex: 1, 
              background: 'rgba(255,255,255,0.05)', 
              border: 'var(--glass-border)', 
              borderRadius: '12px', 
              padding: '12px 16px', 
              color: 'white', 
              outline: 'none' 
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
