'use client';
import React, { useState, useCallback, useEffect } from 'react';
import VoiceInputBtn from '@/components/VoiceInputBtn';
import ChatBox from '@/components/ChatBox';
import { Send, Globe, MessageSquare, Plus, Trash2, History } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  messages: Message[];
  timestamp: string;
  language: string;
  title: string;
}

interface ConsultationProps {
  language: string;
  setLanguage: (lang: string) => void;
  isVoiceEnabled: boolean;
}

export default function Consultation({ language, setLanguage, isVoiceEnabled }: ConsultationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Load sessions on mount
  useEffect(() => {
    const saved = localStorage.getItem('nyaya_chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        
        // Auto-load the most recent session if exists
        if (parsed.length > 0) {
          const latest = parsed[0];
          setMessages(latest.messages);
          setCurrentSessionId(latest.id);
          setLanguage(latest.language);
        } else {
          startNewChat();
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    } else {
      startNewChat();
    }
  }, []);

  // Sync current messages to sessions and localStorage
  const syncToStorage = (updatedMessages: Message[], sessionId: string | null) => {
    if (!sessionId) return;

    setSessions(prev => {
      const existingIdx = prev.findIndex(s => s.id === sessionId);
      let newSessions = [...prev];
      
      if (existingIdx !== -1) {
        newSessions[existingIdx] = {
          ...newSessions[existingIdx],
          messages: updatedMessages,
          timestamp: new Date().toISOString(),
          // Update title based on first user message if it's default
          title: newSessions[existingIdx].title === 'New Consultation' && updatedMessages.length > 0 
            ? updatedMessages.find(m => m.role === 'user')?.content.substring(0, 30) + '...' 
            : newSessions[existingIdx].title
        };
      } else {
        // This shouldn't happen with proper initialization
      }
      
      // Sort by timestamp (newest first)
      newSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      localStorage.setItem('nyaya_chats', JSON.stringify(newSessions));
      return newSessions;
    });
  };

  const startNewChat = () => {
    const newId = 'chat_' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      messages: [],
      timestamp: new Date().toISOString(),
      language: language,
      title: 'New Consultation'
    };
    
    setMessages([]);
    setCurrentSessionId(newId);
    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem('nyaya_chats', JSON.stringify(updated));
      return updated;
    });
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setLanguage(session.language);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this consultation history?")) {
      setSessions(prev => {
        const updated = prev.filter(s => s.id !== id);
        localStorage.setItem('nyaya_chats', JSON.stringify(updated));
        
        if (currentSessionId === id) {
          if (updated.length > 0) {
            loadSession(updated[0]);
          } else {
            startNewChat();
          }
        }
        return updated;
      });
    }
  };

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || !currentSessionId) return;
    
    const userMsg = { role: 'user' as const, content: text };
    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    setInputText('');
    setIsProcessing(true);
    
    // Immediate sync for user message
    syncToStorage(updatedWithUser, currentSessionId);
    
    try {
      const response = await fetch('/api/legal-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, language })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const assistantMsg = { role: 'assistant' as const, content: data.result };
        const finalMessages = [...updatedWithUser, assistantMsg];
        setMessages(finalMessages);
        syncToStorage(finalMessages, currentSessionId);
      } else {
        const errorMsg = { role: 'assistant' as const, content: `Error: ${data.error}` };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Network error occurred." }]);
    } finally {
      setIsProcessing(false);
    }
  }, [language, messages, currentSessionId]);

  // Auto-hide sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 768) setShowSidebar(false);
        else setShowSidebar(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }} className="consult-container">
      
      {/* Sidebar - History */}
      <div style={{ 
        width: showSidebar ? '280px' : '0', 
        opacity: showSidebar ? 1 : 0,
        background: 'rgba(15, 23, 42, 0.3)', 
        borderRight: showSidebar ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: showSidebar ? '16px' : '0',
        gap: '20px',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        position: window.innerWidth < 768 ? 'absolute' : 'relative',
        zIndex: 100,
        height: '100%'
      }}>
        <button 
          onClick={startNewChat}
          className="btn-primary"
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={18} /> New Chat
        </button>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>Recent consultations</h3>
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => {
                loadSession(session);
                if (window.innerWidth < 768) setShowSidebar(false);
              }}
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: currentSessionId === session.id ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                border: currentSessionId === session.id ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
              className="session-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <MessageSquare size={16} color={currentSessionId === session.id ? 'var(--primary)' : 'var(--text-muted)'} />
                <span style={{ 
                  fontSize: '0.85rem', 
                  color: currentSessionId === session.id ? 'var(--text-main)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {session.title}
                </span>
              </div>
              <button 
                onClick={(e) => deleteSession(e, session.id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <Trash2 size={14} className="delete-icon" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="glass-panel" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '24px', 
        position: 'relative', 
        overflow: 'hidden',
        border: 'none',
        borderRadius: '0'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }} className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <History size={20} />
            </button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Consultation</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', border: 'var(--glass-border)' }}>
              <Globe size={16} color="var(--text-muted)" />
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                <option value="en-IN">English</option>
                <option value="hi-IN">Hindi</option>
                <option value="ta-IN">Tamil</option>
                <option value="te-IN">Telugu</option>
                <option value="bn-IN">Bengali</option>
              </select>
            </div>
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px' }}>
          <ChatBox messages={messages} isProcessing={isProcessing} language={language} isVoiceEnabled={isVoiceEnabled} />
        </div>
        
        <div style={{ 
          marginTop: '20px', 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          padding: '8px',
          borderRadius: '40px',
          border: 'var(--glass-border)',
          boxShadow: 'var(--shadow-lg)'
        }} className="chat-input-container">
          <div style={{ flex: 1, marginLeft: '16px' }}>
            <input 
              type="text" 
              placeholder="Describe your legal issue..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
              disabled={isProcessing}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
          
          <button 
            onClick={() => handleSend(inputText)}
            disabled={isProcessing || !inputText.trim()}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              background: inputText.trim() ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            <Send size={20} />
          </button>
          <VoiceInputBtn onTranscript={handleSend} language={language} />
        </div>
      </div>

      <style jsx>{`
        .session-item:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .session-item .delete-icon {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .session-item:hover .delete-icon {
          opacity: 1;
        }
        @media (max-width: 768px) {
          .glass-panel { padding: 12px !important; }
          .chat-input-container { margin-bottom: 10px !important; }
          .chat-header h2 { font-size: 1.1rem !important; }
        }
      `}</style>
    </div>
  );
}
