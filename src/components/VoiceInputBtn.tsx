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
      setIsRecording(false);
    } else {
      try {
        // Reset and start
        if (recognitionRef.current) {
          recognitionRef.current.lang = language;
          recognitionRef.current.start();
        }
      } catch (err) {
        console.error("Failed to start recognition", err);
        // If already started, just toggle the state
        setIsRecording(true);
      }
    }
  };

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          onTranscript(finalTranscript);
          setIsRecording(false);
        }
      };
    }
  }, [onTranscript]);

  if (isSupported === false) return null;
  if (isSupported === null) return null;

  return (
    <button 
      onClick={toggleRecording}
      disabled={isProcessing}
      title={isRecording ? "Stop Listening" : "Start Voice Input"}
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: 'none',
        background: isRecording ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: isRecording ? '0 0 15px var(--accent)' : 'none',
        transition: 'all 0.3s ease',
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
          border: '2px solid var(--accent)',
          animation: 'ping 1.2s infinite'
        }} />
      )}
      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
      <style>{`@keyframes ping { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }`}</style>
    </button>
  );
}

