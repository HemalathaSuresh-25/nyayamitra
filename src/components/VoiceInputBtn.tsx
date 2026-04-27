'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputBtnProps {
  onTranscript: (text: string) => void;
  language?: string;
}

export default function VoiceInputBtn({ onTranscript, language = 'en-IN' }: VoiceInputBtnProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsProcessing(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          let errorMsg = "Error occurred";
          switch(event.error) {
            case 'not-allowed': errorMsg = "Microphone access denied. Please enable it in browser settings."; break;
            case 'network': errorMsg = "Network error occurred."; break;
            default: errorMsg = "Speech error: " + event.error;
          }
          alert(errorMsg);
        }
        setIsRecording(false);
        setIsProcessing(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      setIsSupported(false);
    }
  }, []); // Only run once on mount

  // Update language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start recognition", err);
      }
    }
  };

  if (isSupported === false) {
    return (
      <div style={{ color: 'var(--accent)', fontSize: '0.75rem', maxWidth: '80px', textAlign: 'center' }}>
        Voice not supported
      </div>
    );
  }

  if (isSupported === null) return null;

  return (
    <button 
      onClick={toggleRecording}
      disabled={isProcessing}
      title={isRecording ? "Stop Listening" : "Start Voice Input"}
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: 'none',
        background: isRecording ? 'var(--accent)' : 'var(--gradient-primary)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: isRecording ? '0 0 20px rgba(244, 63, 94, 0.6)' : 'var(--shadow-glow)',
        transition: 'all 0.3s ease',
        transform: isRecording ? 'scale(1.1)' : 'scale(1)',
        position: 'relative',
        flexShrink: 0
      }}
    >
      {isRecording && (
        <span style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.5)',
          animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
        }}>
          <style>{`
            @keyframes ping {
              75%, 100% {
                transform: scale(1.5);
                opacity: 0;
              }
            }
          `}</style>
        </span>
      )}
      {isProcessing ? (
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        isRecording ? <MicOff size={24} /> : <Mic size={24} />
      )}
    </button>
  );
}

