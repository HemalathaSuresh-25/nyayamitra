'use client';
import React, { useState } from 'react';
import { Scale, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'client' | 'lawyer'>('client');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [barId, setBarId] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = async () => {
    if (!barId.trim()) {
      setError('Please enter your Bar Council ID.');
      return;
    }
    setError('');
    setIsVerifying(true);
    await new Promise(r => setTimeout(r, 2000)); // Simulate Bar Council check
    
    if (/^[A-Z]{2}\/\d+\/\d+$/.test(barId)) {
      setIsVerified(true);
      setIsVerifying(false);
    } else {
      setError('Invalid Bar ID. Format should be like TN/1234/2023');
      setIsVerifying(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp && role === 'lawyer' && !isVerified) {
      setError('Please verify your Bar ID first.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));

    try {
      const storedUsers = JSON.parse(localStorage.getItem('nyaya_registered_users') || '{}');

      if (isSignUp) {
        if (storedUsers[email]) {
          setError('An account with this email already exists.');
          setIsLoading(false);
          return;
        }
        
        // Save to Auth List
        storedUsers[email] = { password, role, barId: role === 'lawyer' ? barId : null };
        localStorage.setItem('nyaya_registered_users', JSON.stringify(storedUsers));
        
        // Auto-add to the corresponding portal directory
        const listKey = role === 'lawyer' ? 'nyaya_lawyers' : 'nyaya_clients';
        const currentList = JSON.parse(localStorage.getItem(listKey) || '[]');
        
        // Load detailed profile if it exists (defensive)
        const savedProfile = JSON.parse(localStorage.getItem(`nyaya_profile_${email}`) || '{}');
        
        const newUser = {
          email: email,
          name: savedProfile.name || email.split('@')[0],
          role: role,
          phone: savedProfile.phone || 'Not provided',
          about: savedProfile.about || 'Newly registered user',
          barId: role === 'lawyer' ? (barId || savedProfile.barId) : null,
          domain: role === 'lawyer' ? (savedProfile.domain || 'General') : null,
          solvedCases: role === 'lawyer' ? (savedProfile.solvedCases || 0) : null,
          isVerified: true
        };

        // Prevent duplicates
        if (!currentList.find((u: any) => u.email === email)) {
          localStorage.setItem(listKey, JSON.stringify([...currentList, newUser]));
        }

        localStorage.setItem('nyaya_user', JSON.stringify({ email, role, loggedIn: true }));
        setIsLoading(false);
        onLogin();
      } else {
        if (!storedUsers[email] || storedUsers[email].password !== password) {
          setError('Invalid email or password.');
          setIsLoading(false);
          return;
        }
        const userRole = storedUsers[email].role || role;
        
        // Also ensure they are in the directory on login if missing
        const listKey = userRole === 'lawyer' ? 'nyaya_lawyers' : 'nyaya_clients';
        const currentList = JSON.parse(localStorage.getItem(listKey) || '[]');
        if (!currentList.find((u: any) => u.email === email)) {
          const savedProfile = JSON.parse(localStorage.getItem(`nyaya_profile_${email}`) || '{}');
          const userInfo = {
            email: email,
            name: savedProfile.name || email.split('@')[0],
            role: userRole,
            phone: savedProfile.phone || 'Not provided',
            about: savedProfile.about || 'Registered user',
            barId: userRole === 'lawyer' ? (storedUsers[email].barId || savedProfile.barId) : null,
            domain: userRole === 'lawyer' ? (savedProfile.domain || 'General') : null,
            solvedCases: userRole === 'lawyer' ? (savedProfile.solvedCases || 0) : null,
            isVerified: true
          };
          localStorage.setItem(listKey, JSON.stringify([...currentList, userInfo]));
        }

        localStorage.setItem('nyaya_user', JSON.stringify({ email, role: userRole, loggedIn: true }));
        setIsLoading(false);
        onLogin();
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-main)',
      backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(79, 70, 229, 0.15) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="logo-box" style={{
            background: 'var(--gradient-primary)',
            padding: '18px',
            borderRadius: '20px',
            display: 'flex',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <Scale color="white" size={36} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }} className="gradient-text">NyayaMitra</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>AI Legal Companion • न्यायमित्र</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel" style={{ width: '100%', padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px' }}>{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>{isSignUp ? 'Sign up as a verified professional' : 'Sign in to your legal dashboard'}</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Role Selector */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', border: 'var(--glass-border)', marginBottom: '4px' }}>
              <button
                type="button"
                onClick={() => { setRole('client'); setIsVerified(false); }}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: role === 'client' ? 'var(--primary)' : 'transparent', color: role === 'client' ? 'white' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: '0.3s' }}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => { setRole('lawyer'); setIsVerified(false); }}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: role === 'lawyer' ? 'var(--primary)' : 'transparent', color: role === 'lawyer' ? 'white' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: '0.3s' }}
              >
                Lawyer
              </button>
            </div>

            {/* Verification Step for Lawyers */}
            {isSignUp && role === 'lawyer' && !isVerified && (
              <div style={{ background: 'rgba(79, 70, 229, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Bar Council Verification Required</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    placeholder="TN/1234/2023"
                    value={barId}
                    onChange={e => setBarId(e.target.value)}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)', border: 'var(--glass-border)', color: 'white', outline: 'none' }}
                  />
                  <button type="button" className="btn-primary" onClick={handleVerify} disabled={isVerifying} style={{ padding: '0 16px' }}>
                    {isVerifying ? <Loader2 size={18} className="animate-spin" /> : 'Verify'}
                  </button>
                </div>
              </div>
            )}

            {isSignUp && role === 'lawyer' && isVerified && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)', fontSize: '0.85rem' }}>
                <CheckCircle2 size={18} /> Bar ID Verified Successfully
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px', border: 'var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 48px 12px 44px', borderRadius: '12px', border: 'var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p style={{ color: 'var(--accent)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

            <button type="submit" disabled={isLoading || (isSignUp && role === 'lawyer' && !isVerified)} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '4px', justifyContent: 'center' }}>
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : (isSignUp ? 'Create Verified Account' : 'Sign In')}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"} <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setIsSignUp(!isSignUp); setError(''); setIsVerified(false); }}>{isSignUp ? 'Sign in' : 'Sign up free'}</span>
          </p>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          By signing in, you agree to NyayaMitra's Terms of Service and Privacy Policy.
        </p>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 480px) {
          .glass-panel { padding: 24px !important; }
          h1 { font-size: 1.5rem !important; }
          .logo-box { padding: 12px !important; }
          .logo-box svg { width: 28px !important; height: 28px !important; }
        }
      `}</style>
    </div>
  </div>
);
}
