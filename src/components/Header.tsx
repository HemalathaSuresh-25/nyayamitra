'use client';
import React from 'react';
import { Scale, LogOut, Settings, User } from 'lucide-react';

interface HeaderProps {
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  onSignOut?: () => void;
}

export default function Header({ onSettingsClick, onProfileClick, onSignOut }: HeaderProps) {
  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('nyaya_user');
      window.location.reload();
    }
  };

  return (
    <header className="glass-panel" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px 24px',
      margin: '24px 0',
      position: 'sticky',
      top: '24px',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'var(--gradient-primary)',
          padding: '10px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Scale color="white" size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, lineHeight: 1 }} className="gradient-text">NyayaMitra</h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>AI Legal Companion</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button 
          onClick={onProfileClick}
          className="btn-secondary" 
          style={{ padding: '10px', borderRadius: '50%', display: 'flex', cursor: 'pointer' }}
          title="Profile"
        >
          <User size={20} />
        </button>
        
        <button 
          onClick={onSettingsClick}
          className="btn-secondary" 
          style={{ padding: '10px', borderRadius: '50%', display: 'flex', cursor: 'pointer' }}
          title="Settings"
        >
          <Settings size={20} />
        </button>
        
        <button 
          onClick={onSignOut || handleSignOut}
          className="btn-secondary" 
          style={{ padding: '10px', borderRadius: '50%', display: 'flex', cursor: 'pointer', color: 'var(--accent)' }}
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
