'use client';
import React from 'react';
import { Home, FileText, MapPin, History, Settings, Users } from 'lucide-react';

export type TabId = 'home' | 'docs' | 'maps' | 'history' | 'settings' | 'lawyers';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const userRole = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('nyaya_user') || '{}').role
    : null;

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Consultation', icon: Home },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'maps', label: 'Locations', icon: MapPin },
    { id: 'history', label: 'Cases', icon: History },
    { id: 'lawyers', label: userRole === 'lawyer' ? 'Clients' : 'Lawyers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="glass-panel" style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'max-content',
      padding: '8px',
      display: 'flex',
      gap: '8px',
      zIndex: 1000,
      borderRadius: '24px',
      background: 'rgba(19, 26, 43, 0.8)'
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 16px',
              border: 'none',
              background: isActive ? 'var(--gradient-primary)' : 'transparent',
              color: isActive ? 'white' : 'var(--text-muted)',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              gap: '4px',
              minWidth: '80px'
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: isActive ? 600 : 500,
              display: 'block'
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
