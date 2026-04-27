'use client';
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Navigation, { TabId } from '@/components/Navigation';
import Consultation from '@/components/Consultation';
import DocumentGenerator from '@/components/DocumentGenerator';
import CaseTracking from '@/components/CaseTracking';
import LawyerConnect from '@/components/LawyerConnect';
import Settings from '@/components/Settings';
import LoginPage from '@/components/LoginPage';
import ProfileModal from '@/components/ProfileModal';
import dynamic from 'next/dynamic';

const LocationFinder = dynamic(() => import('@/components/LocationFinder'), { ssr: false });

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [language, setLanguage] = useState('en-IN');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState('medium'); // small, medium, large
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isPushEnabled, setIsPushEnabled] = useState(true);

  // Check login state on mount
  useEffect(() => {
    const user = localStorage.getItem('nyaya_user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.loggedIn) setIsLoggedIn(true);
      } catch {}
    }
    setIsCheckingAuth(false);
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  // Show nothing while checking auth to avoid flash
  if (isCheckingAuth) return null;

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Consultation language={language} setLanguage={setLanguage} isVoiceEnabled={isVoiceEnabled} />;
      case 'docs':
        return <DocumentGenerator />;
      case 'maps':
        return <LocationFinder />;
      case 'history':
        return <CaseTracking />;
      case 'lawyers':
        return <LawyerConnect />;
      case 'settings':
        return <Settings 
          language={language} 
          setLanguage={setLanguage} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
          fontSize={fontSize}
          setFontSize={setFontSize}
          isVoiceEnabled={isVoiceEnabled}
          setIsVoiceEnabled={setIsVoiceEnabled}
          isPushEnabled={isPushEnabled}
          setIsPushEnabled={setIsPushEnabled}
        />;
      default:
        return <Consultation language={language} setLanguage={setLanguage} isVoiceEnabled={isVoiceEnabled} />;
    }
  };

  return (
    <main className={`container font-${fontSize}`} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      paddingBottom: '100px',
      transition: 'all 0.3s ease'
    }}>
      <Header 
        onSettingsClick={() => setActiveTab('settings')} 
        onProfileClick={() => setIsProfileOpen(true)}
        onSignOut={() => setIsLoggedIn(false)}
      />

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
      
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column',
        padding: activeTab === 'home' ? '0' : '0 12px'
      }}>
        {renderContent()}
      </div>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <style jsx global>{`
        .light-mode {
          --bg-main: #F1F5F9;
          --bg-secondary: #FFFFFF;
          --bg-card: rgba(255, 255, 255, 0.8);
          --text-main: #1E293B;
          --text-muted: #64748B;
          --border: rgba(0, 0, 0, 0.08);
          --glass-border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .markdown-body p:first-child {
          margin-top: 0;
        }
        .markdown-body p:last-child {
          margin-bottom: 0;
        }
        .markdown-body ul, .markdown-body ol {
          padding-left: 20px;
          margin: 8px 0;
        }
        .markdown-body li {
          margin-bottom: 4px;
        }
        .markdown-body strong {
          color: var(--primary);
        }

        .light-mode body {
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(79, 70, 229, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 85% 30%, rgba(6, 182, 212, 0.05) 0%, transparent 50%);
        }

        .font-small { --base-font-size: 14px; }
        .font-medium { --base-font-size: 16px; }
        .font-large { --base-font-size: 20px; }

        .container {
          font-size: var(--base-font-size);
        }

        /* Force scaling on common elements across all components */
        .container.font-small *, .container.font-medium *, .container.font-large * {
          transition: font-size 0.2s ease;
        }

        .font-small h2 { font-size: 1.5rem !important; }
        .font-medium h2 { font-size: 2rem !important; }
        .font-large h2 { font-size: 2.5rem !important; }

        .font-small h3 { font-size: 1.1rem !important; }
        .font-medium h3 { font-size: 1.25rem !important; }
        .font-large h3 { font-size: 1.5rem !important; }

        .font-small p, .font-small span, .font-small div, .font-small label { font-size: 0.85rem !important; }
        .font-medium p, .font-medium span, .font-medium div, .font-medium label { font-size: 1rem !important; }
        .font-large p, .font-large span, .font-large div, .font-large label { font-size: 1.15rem !important; }

        /* Ensure buttons and inputs scale too */
        .font-small button, .font-small input, .font-small select, .font-small textarea { font-size: 0.85rem !important; }
        .font-medium button, .font-medium input, .font-medium select, .font-medium textarea { font-size: 1rem !important; }
        .font-large button, .font-large input, .font-large select, .font-large textarea { font-size: 1.1rem !important; }
      `}</style>
    </main>
  );
}
