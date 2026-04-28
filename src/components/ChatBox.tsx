'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Loader2, Download, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBoxProps {
  messages: Message[];
  isProcessing?: boolean;
  language?: string;
  isVoiceEnabled?: boolean;
}

export default function ChatBox({ messages, isProcessing = false, language = 'en-IN', isVoiceEnabled = true }: ChatBoxProps) {
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ... (rest of the component logic)

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadPDF = (text: string) => {
    const doc = new jsPDF();
    const cleanText = text.replace(/[*#`]/g, '');
    
    // Simple PDF generation for Indian languages often requires font embedding,
    // so we will provide a clean text export for now.
    const splitText = doc.splitTextToSize(cleanText, 180);
    doc.setFontSize(16);
    doc.text("NyayaMitra Legal Advice", 10, 20);
    doc.setFontSize(12);
    doc.text(splitText, 10, 35);
    doc.save("nyayamitra_advice.pdf");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Auto-read logic: if voice is enabled and we just finished processing a message
    if (isVoiceEnabled && !isProcessing && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant') {
        // Delay slightly to ensure smooth transition
        setTimeout(() => speakMessage(lastMsg.content, messages.length - 1), 500);
      }
    }
  }, [messages, isProcessing, isVoiceEnabled]);

  // Pre-load voices to avoid empty array on first click
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const speakingRef = useRef<number | null>(null);

  const speakMessage = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }

    // Stop if already playing this message
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      if ((window as any)._currentAudio) {
        (window as any)._currentAudio.pause();
        (window as any)._currentAudio = null;
      }
      setSpeakingIndex(null);
      speakingRef.current = null;
      return;
    }

    // Force clear any stuck or paused speech globally
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    if ((window as any)._currentAudio) {
      (window as any)._currentAudio.pause();
      (window as any)._currentAudio = null;
    }
    
    // Clean markdown
    const cleanText = text
      .replace(/\*\*\*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s?/g, '')
      .replace(/`{1,3}/g, '')
      .replace(/^[-•]\s*/gm, '')
      .replace(/^\d+\.\s*/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    const chunks = cleanText.split(/[.!?।\n]+/).filter(c => c.trim().length > 0);
    let currentChunk = 0;
    
    setSpeakingIndex(index);
    speakingRef.current = index;

    const playNext = async () => {
      // Check if we should still be playing
      if (speakingRef.current !== index) return;

      if (currentChunk >= chunks.length) {
        setSpeakingIndex(null);
        speakingRef.current = null;
        return;
      }

      const textToSpeak = chunks[currentChunk].trim();
      const targetLangPrefix = language.split('-')[0].toLowerCase();
      
      // 1. Try to find a high-quality "Online" voice first
      let voices = window.speechSynthesis.getVoices();
      const langMatch = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase();
      const isOnline = (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('online') || v.name.toLowerCase().includes('google');
      
      let bestVoice = voices.find(v => langMatch(v).startsWith(targetLangPrefix) && isOnline(v));
      
      if (bestVoice) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
        utterance.onend = () => { 
          if (speakingRef.current === index) {
            currentChunk++; 
            playNext(); 
          }
        };
        utterance.onerror = () => useCloudFallback(textToSpeak, targetLangPrefix);
        window.speechSynthesis.speak(utterance);
        return;
      }

      // 2. Fallback to Cloud Voice Stream
      useCloudFallback(textToSpeak, targetLangPrefix);
    };

    const useCloudFallback = (textToSpeak: string, langPrefix: string) => {
      const url = `/api/tts?text=${encodeURIComponent(textToSpeak)}&lang=${langPrefix}`;
      const audio = new Audio();
      audio.src = url;
      (window as any)._currentAudio = audio;
      
      audio.onended = () => {
        if (speakingRef.current === index) {
          (window as any)._currentAudio = null;
          currentChunk++;
          playNext();
        }
      };

      audio.onerror = () => {
        setSpeakingIndex(null);
        speakingRef.current = null;
      };

      audio.play().catch(() => {
        setSpeakingIndex(null);
        speakingRef.current = null;
      });
    };

    playNext();
  };


  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '20px 0',
      width: '100%',
    }}>
      {messages.length === 0 && !isProcessing ? (
        <div style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          padding: '40px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 600 }}>How can I help you today?</h2>
          <p>Tap the microphone below and tell me your legal issue in your language.</p>
        </div>
      ) : (
        <>
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className="animate-fade-in"
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                border: msg.role === 'assistant' ? 'var(--glass-border)' : 'none',
                padding: '16px 20px',
                borderRadius: msg.role === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                boxShadow: 'var(--shadow-sm)',
                backdropFilter: msg.role === 'assistant' ? 'blur(12px)' : 'none'
              }}
            >
              <div style={{ lineHeight: '1.6', fontSize: '0.95rem' }} className={msg.role === 'assistant' ? 'markdown-body' : ''}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                )}
              </div>

              {/* Message Actions */}
              {msg.role === 'assistant' && (
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => copyToClipboard(msg.content, index)}
                    title="Copy to clipboard"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copiedIndex === index ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    {copiedIndex === index ? 'Copied' : 'Copy'}
                  </button>

                  <button
                    onClick={() => downloadPDF(msg.content)}
                    title="Save as PDF"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Download size={14} />
                    Save PDF
                  </button>

                  {isVoiceEnabled && (
                    <button
                      onClick={() => speakMessage(msg.content, index)}
                      title={speakingIndex === index ? 'Stop Reading' : 'Read Aloud'}
                      style={{
                        background: speakingIndex === index ? 'rgba(79, 70, 229, 0.15)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: speakingIndex === index ? 'var(--primary)' : 'var(--text-muted)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      {speakingIndex === index ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      {speakingIndex === index ? 'Stop' : 'Listen'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator while AI is thinking */}
          {isProcessing && (
            <div
              className="animate-fade-in"
              style={{
                alignSelf: 'flex-start',
                maxWidth: '85%',
                background: 'var(--bg-card)',
                border: 'var(--glass-border)',
                padding: '20px 24px',
                borderRadius: '20px 20px 20px 0',
                boxShadow: 'var(--shadow-sm)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analyzing your legal query...</span>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

