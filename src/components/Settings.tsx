'use client';
import React, { useState, useEffect, ChangeEvent, ElementType } from 'react';
import { Globe, Volume2, Bell, Moon, HelpCircle, LogOut, ChevronDown, ChevronUp, Scale, Type, Download, CheckCircle } from 'lucide-react';

interface SettingsProps {
  language: string;
  setLanguage: (lang: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  isVoiceEnabled: boolean;
  setIsVoiceEnabled: (val: boolean) => void;
  isPushEnabled: boolean;
  setIsPushEnabled: (val: boolean) => void;
}

interface Case {
  id: string;
  clientEmail: string;
  [key: string]: any;
}

interface SettingItem {
  icon: ElementType;
  label: string;
  type: 'select' | 'toggle' | 'button';
  value?: any;
  options?: { value: string; label: string }[];
  onChange?: (e: any) => void;
  onClick?: () => void;
  color?: string;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function Settings({ 
  language, setLanguage, 
  isDarkMode, setIsDarkMode, 
  fontSize, setFontSize,
  isVoiceEnabled, setIsVoiceEnabled,
  isPushEnabled, setIsPushEnabled
}: SettingsProps) {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('nyaya_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
        setUserEmail(user.email);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const togglePanel = (id: string) => {
    setExpandedPanel(prev => prev === id ? null : id);
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/directory?type=cases');
      if (!res.ok) throw new Error("Failed to fetch cases");
      const cases = await res.json();
      
      if (!Array.isArray(cases)) {
        throw new Error("Invalid data format received");
      }

      const myCases = cases.filter((c: Case) => c.clientEmail === userEmail);
      
      const blob = new Blob([JSON.stringify(myCases, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nyaya_case_history_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const sections: SettingSection[] = [
    {
      title: 'General',
      items: [
        { icon: Globe, label: 'App Language', type: 'select', value: language, options: [
          { value: 'en-IN', label: 'English' },
          { value: 'hi-IN', label: 'Hindi' },
          { value: 'ta-IN', label: 'Tamil' },
          { value: 'te-IN', label: 'Telugu' },
          { value: 'bn-IN', label: 'Bengali' }
        ], onChange: (e: ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value) },
        { icon: Type, label: 'Text Size', type: 'select', value: fontSize, options: [
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' }
        ], onChange: (e: ChangeEvent<HTMLSelectElement>) => setFontSize(e.target.value) },
        { icon: Moon, label: 'Dark Mode', type: 'toggle', value: isDarkMode, onChange: () => setIsDarkMode(!isDarkMode) },
      ]
    },
    {
      title: 'Voice & Notifications',
      items: [
        { icon: Volume2, label: 'Voice Responses', type: 'toggle', value: isVoiceEnabled, onChange: () => setIsVoiceEnabled(!isVoiceEnabled) },
        { icon: Bell, label: 'Push Notifications', type: 'toggle', value: isPushEnabled, onChange: () => setIsPushEnabled(!isPushEnabled) },
      ]
    },
    {
      title: 'Privacy & Data',
      items: [
        { icon: Download, label: 'Export Case History', type: 'button', color: 'var(--primary)', onClick: handleExportData },
      ]
    },
  ];

  if (userRole === 'lawyer') {
    sections.splice(1, 0, {
      title: 'Lawyer Professional',
      items: [
        { icon: CheckCircle, label: 'Available for New Cases', type: 'toggle', value: isAvailable, onChange: () => setIsAvailable(!isAvailable) },
      ]
    });
  }

  const faqItems = [
    { q: "What is NyayaMitra?", a: "NyayaMitra (Justice Friend) is a free AI-powered legal aid companion designed for Indian citizens, especially those in rural and low-income areas who may not be able to afford professional legal counsel." },
    { q: "Is the legal advice legally binding?", a: "No. NyayaMitra provides general legal information and guidance to help you understand your rights. It is NOT a substitute for professional legal advice from a licensed lawyer." },
    { q: "What languages are supported?", a: "Currently, we support English, Hindi, Tamil, Telugu, and Bengali. The AI can respond in your selected language." },
    { q: "How does the Document Generator work?", a: "The Document Generator creates legally structured draft templates (FIR, RTI, Consumer Complaint, etc.) that you can preview and download as PDFs. You must fill in the specific details relevant to your case." },
    { q: "Is my data secure?", a: "Your consultations are stored locally on your device by default. If Firebase is configured, data is stored securely in Google's cloud. We prioritize your privacy and data security." },
    { q: "How does the Location Finder work?", a: "It uses your device's GPS and the OpenStreetMap Overpass API to find nearby police stations, courts, and legal aid centers within a 10km radius. You can get directions to any location via Google Maps." },
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <header>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Settings</h2>
        <p style={{ color: 'var(--text-muted)' }}>Customize your legal aid experience.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {sections.map((section, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>{section.title}</h3>
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '16px 20px',
                    borderBottom: itemIdx === section.items.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: item.color || 'var(--primary)' }}>
                      <item.icon size={18} />
                    </div>
                    <span style={{ fontWeight: 500 }}>{item.label}</span>
                  </div>

                  {item.type === 'select' && (
                    <select 
                      value={item.value} 
                      onChange={item.onChange}
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)', border: 'var(--glass-border)', padding: '6px 12px', borderRadius: '8px', outline: 'none' }}
                    >
                      {item.options?.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  )}

                  {item.type === 'toggle' && (
                    <div 
                      onClick={() => item.onChange?.({} as any)}
                      style={{ 
                        width: '44px', 
                        height: '24px', 
                        borderRadius: '12px', 
                        background: item.value ? 'var(--primary)' : 'rgba(255,255,255,0.1)', 
                        position: 'relative', 
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      <div style={{ 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '50%', 
                        background: 'white', 
                        position: 'absolute', 
                        top: '3px', 
                        left: item.value ? '23px' : '3px',
                        transition: 'all 0.3s'
                      }} />
                    </div>
                  )}

                  {item.type === 'button' && (
                    <button 
                      onClick={item.onClick}
                      style={{ background: 'transparent', border: 'none', color: item.color, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {item.label === 'Export Case History' ? 'Download' : 'Action'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Support</h3>
          
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div 
              onClick={() => togglePanel('faq')}
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '16px 20px', cursor: 'pointer',
                borderBottom: expandedPanel === 'faq' ? '1px solid rgba(255,255,255,0.05)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--primary)' }}>
                  <HelpCircle size={18} />
                </div>
                <span style={{ fontWeight: 500 }}>FAQ & Help</span>
              </div>
              {expandedPanel === 'faq' ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
            </div>

            {expandedPanel === 'faq' && (
              <div style={{ padding: '8px 20px 20px' }}>
                {faqItems.map((faq, i) => (
                  <div key={i} style={{ padding: '16px 0', borderBottom: i < faqItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.95rem' }}>Q: {faq.q}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>{faq.a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div 
              onClick={() => togglePanel('about')}
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '16px 20px', cursor: 'pointer',
                borderBottom: expandedPanel === 'about' ? '1px solid rgba(255,255,255,0.05)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--primary)' }}>
                  <Scale size={18} />
                </div>
                <span style={{ fontWeight: 500 }}>About NyayaMitra</span>
              </div>
              {expandedPanel === 'about' ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
            </div>

            {expandedPanel === 'about' && (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'var(--gradient-primary)', padding: '14px', borderRadius: '16px', display: 'flex', boxShadow: 'var(--shadow-glow)' }}>
                    <Scale color="white" size={28} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }} className="gradient-text">NyayaMitra</h4>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Version 2.0.0</span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '0.9rem' }}>
                  NyayaMitra (न्यायमित्र — "Justice Friend") is a free, AI-powered legal aid companion built to empower Indian citizens with accessible legal information. 
                  Our mission is to bridge the justice gap for people in rural and low-income communities who cannot afford professional legal counsel.
                </p>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h5 style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>Features</h5>
                  <ul style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '2', paddingLeft: '20px' }}>
                    <li>AI Legal Consultation with voice input & output</li>
                    <li>Automatic legal document drafting (FIR, RTI, Consumer Complaint)</li>
                    <li>GPS-based location finder for police, courts, and legal aid centers</li>
                    <li>Case tracking and history management</li>
                    <li>Multi-language support (English, Hindi, Tamil, Telugu, Bengali)</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(244, 63, 94, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
                  <h5 style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent)' }}>⚠️ Legal Disclaimer</h5>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.6' }}>
                    NyayaMitra provides general legal information only and does NOT constitute professional legal advice. 
                    Always consult a qualified lawyer for legal matters. The developers are not liable for any actions taken based on the information provided by this application.
                  </p>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                  Made with ❤️ for Justice • © 2026 NyayaMitra
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', textAlign: 'center' }}>
        <button 
          onClick={() => { localStorage.removeItem('nyaya_user'); window.location.reload(); }}
          className="btn-secondary" 
          style={{ color: 'var(--accent)', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto', cursor: 'pointer' }}
        >
          <LogOut size={18} /> Sign Out
        </button>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '24px' }}>NyayaMitra v2.0.0 • Made with ❤️ for Justice</p>
      </div>
    <style jsx>{`
      @media (max-width: 768px) {
        .glass-panel div { padding: 12px 14px !important; }
        .glass-panel span { font-size: 0.9rem !important; }
        select { padding: 4px 8px !important; font-size: 0.85rem !important; }
        h2 { font-size: 1.5rem !important; }
        h3 { font-size: 0.8rem !important; }
      }
    `}</style>
    </div>
  );
}
