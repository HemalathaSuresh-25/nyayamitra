'use client';
import React, { useState, useEffect } from 'react';
import { User, X, Mail, Phone, MapPin, Award, Briefcase, Scale, Info, Save } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [userRole, setUserRole] = useState<'client' | 'lawyer' | null>(null);
  const [profile, setProfile] = useState<any>({
    name: '',
    email: '',
    phone: '',
    address: '',
    about: '',
    barId: '',
    domain: '',
    solvedCases: ''
  });

  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem('nyaya_user') || '{}');
    if (authData.loggedIn) {
      setUserRole(authData.role);
      const savedProfile = JSON.parse(localStorage.getItem(`nyaya_profile_${authData.email}`) || '{}');
      setProfile({
        name: savedProfile.name || authData.email.split('@')[0],
        email: savedProfile.email || authData.email,
        phone: savedProfile.phone || '',
        address: savedProfile.address || '',
        about: savedProfile.about || '',
        barId: savedProfile.barId || '',
        domain: savedProfile.domain || '',
        solvedCases: savedProfile.solvedCases || ''
      });
    }
  }, [isOpen]);

  const saveProfile = async () => {
    localStorage.setItem(`nyaya_profile_${profile.email}`, JSON.stringify(profile));
    
    // Sync with database
    const action = userRole === 'lawyer' ? 'register_lawyer' : 'register_client';
    const payload = {
      ...profile,
      role: userRole,
      // Map form fields to DB fields
      council_id: profile.barId,
      solved_cases: String(profile.solvedCases),
      isVerified: true
    };

    try {
      const res = await fetch('/api/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      if (!res.ok) throw new Error('Failed to sync with database');
      
      onClose();
      alert('✅ Profile updated and synced globally!');
    } catch (err: any) {
      console.error(err);
      alert('Error updating database: ' + err.message);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    outline: 'none',
    fontSize: '0.9rem'
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginBottom: '6px',
    fontWeight: 600
  };

  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(10, 15, 28, 0.98)', 
      zIndex: 20000, 
      display: 'grid',
      placeItems: 'center',
      overflowY: 'auto',
      padding: '40px 20px',
      backdropFilter: 'blur(20px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel animate-slide-up" style={{ 
        width: '100%', 
        maxWidth: '600px', 
        padding: '40px', 
        boxShadow: '0 0 100px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.03)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '20px', 
              background: 'var(--gradient-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <User size={32} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>My Profile</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.1em' }}>{userRole?.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '12px' }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}><User size={14} /> Full Name</label>
                <input style={inputStyle} value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Full name" />
              </div>
              <div>
                <label style={labelStyle}><Phone size={14} /> Phone Number</label>
                <input style={inputStyle} value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>

            <div>
              <label style={labelStyle}><Mail size={14} /> Registered Email</label>
              <input value={profile.email} readOnly style={{ ...inputStyle, background: 'rgba(255,255,255,0.02)', opacity: 0.5, cursor: 'not-allowed' }} />
            </div>

            {userRole === 'client' ? (
              <div>
                <label style={labelStyle}><MapPin size={14} /> Address</label>
                <input style={inputStyle} value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} placeholder="Your location" />
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}><Award size={14} /> Council ID</label>
                    <input style={inputStyle} value={profile.barId} onChange={e => setProfile({...profile, barId: e.target.value})} placeholder="BCI/000/00" />
                  </div>
                  <div>
                    <label style={labelStyle}><Briefcase size={14} /> Domain</label>
                    <input style={inputStyle} value={profile.domain} onChange={e => setProfile({...profile, domain: e.target.value})} placeholder="e.g. Civil" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}><Scale size={14} /> Cases Solved</label>
                  <input style={inputStyle} type="number" value={profile.solvedCases} onChange={e => setProfile({...profile, solvedCases: e.target.value})} placeholder="0" />
                </div>
              </>
            )}

            <div>
              <label style={labelStyle}><Info size={14} /> Bio / Description</label>
              <textarea 
                style={{ ...inputStyle, minHeight: '120px', resize: 'none' }} 
                value={profile.about} 
                onChange={e => setProfile({...profile, about: e.target.value})}
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <button className="btn-primary" style={{ flex: 1, padding: '18px', borderRadius: '16px', fontWeight: 800, fontSize: '1rem' }} onClick={saveProfile}>
              Save Profile
            </button>
            <button className="btn-secondary" style={{ padding: '18px 32px', borderRadius: '16px', fontWeight: 600 }} onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (max-width: 600px) {
          .glass-panel { padding: 24px 16px !important; border-radius: 0 !important; }
          .glass-panel h3 { font-size: 1.4rem !important; }
          .glass-panel input, .glass-panel textarea { font-size: 1rem !important; }
          .glass-panel button { padding: 14px !important; }
        }
      `}</style>
    </div>
  );
}
