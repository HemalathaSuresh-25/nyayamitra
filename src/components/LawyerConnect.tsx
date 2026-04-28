'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Users, X, User, Scale, MessageSquare, Eye, Plus, Send, ShieldCheck, Bell, CheckCircle2, XCircle } from 'lucide-react';

const iStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: '12px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'white', outline: 'none', fontSize: '0.95rem'
};

// ── Peer Chat Modal ──────────────────────────────────────────────────
function PeerChat({ me, target, onClose }: { me: string; target: any; onClose: () => void }) {
  const chatKey = [me, target.email].sort().join('__');
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMsgs = async () => {
    const res = await fetch(`/api/directory?type=chat&chatKey=${encodeURIComponent(chatKey)}`);
    if (res.ok) setMsgs(await res.json());
  };

  useEffect(() => {
    // Mark chat as read when opened
    localStorage.setItem(`nyaya_lastread_${chatKey}`, String(Date.now()));
    loadMsgs();
    const t = setInterval(() => {
      loadMsgs();
      localStorage.setItem(`nyaya_lastread_${chatKey}`, String(Date.now()));
    }, 2000);
    return () => clearInterval(t);
  }, [chatKey]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msg = { sender: me, text, ts: Date.now() };
    setText('');
    await fetch('/api/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_message', payload: { chatKey, message: msg } })
    });
    loadMsgs();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', height: '580px', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '24px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} color="white" /></div>
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>{target.name || target.email.split('@')[0]}</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{target.role}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {msgs.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '80px', fontSize: '0.9rem' }}>Secure chat started. Say hello!</p>}
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.sender === me ? 'flex-end' : 'flex-start', maxWidth: '78%', background: m.sender === me ? 'var(--primary)' : 'rgba(255,255,255,0.06)', padding: '10px 16px', borderRadius: m.sender === me ? '16px 16px 0 16px' : '16px 16px 16px 0', fontSize: '0.9rem' }}>
              {m.text}
              <div style={{ fontSize: '0.6rem', opacity: 0.5, textAlign: 'right', marginTop: '4px' }}>{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px' }}>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." style={{ ...iStyle, flex: 1 }} />
          <button type="submit" className="btn-primary" style={{ padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
}

// ── Profile View Modal ───────────────────────────────────────────────
function ProfileView({ user, onClose, onChat, currentEmail, clients }: { user: any, onClose: () => void, onChat: () => void, currentEmail: string, clients: any[] }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 8000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '40px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
          <h3 style={{ margin: 0 }}>Profile</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X /></button>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user.role === 'lawyer' ? <Scale size={36} color="white" /> : <User size={36} color="white" />}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{user.role === 'lawyer' ? `Adv. ${user.name}` : user.name}</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{user.role}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
          {(() => {
            const isLawyerAcceptedMe = user.role === 'lawyer' && clients.find(c => c.email.toLowerCase() === currentEmail.toLowerCase())?.lawyer_email?.toLowerCase() === user.email.toLowerCase();
            const isClientAcceptedByMe = user.role === 'client' && user.lawyer_email?.toLowerCase() === currentEmail.toLowerCase();
            const hasAccess = isLawyerAcceptedMe || isClientAcceptedByMe || user.email.toLowerCase() === currentEmail.toLowerCase();

            if (user.role === 'lawyer') {
              return (
                <>
                  {[
                    { label: 'Email', value: user.email },
                    { label: 'Phone', value: hasAccess ? (user.phone || user.bio?.match(/\+91\d+/)?.[0]) : '🔒 Locked' },
                    { label: 'Council ID', value: hasAccess ? user.council_id : '🔒 Locked' },
                    { label: 'Domain', value: user.domain || user.experience },
                    { label: 'Cases Solved', value: user.solved_cases },
                  ].map((f: any, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px' }}>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.label}</p>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '0.9rem' }}>{f.value || 'N/A'}</p>
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Professional Bio</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', lineHeight: 1.5 }}>{hasAccess ? (user.about || user.bio || 'Professional legal advisor.') : 'Profile details are hidden until case is accepted.'}</p>
                  </div>
                </>
              );
            } else {
              return (
                <>
                  {[
                    { label: 'Email', value: user.email },
                    { label: 'Phone', value: hasAccess ? user.phone : '🔒 Locked' },
                    { label: 'Address', value: hasAccess ? user.address : '🔒 Locked' },
                    { label: 'Status', value: user.status || 'Active' },
                  ].map((f: any, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px' }}>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.label}</p>
                      <p style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '0.9rem' }}>{f.value || 'N/A'}</p>
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Case Details & Urgency</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {hasAccess ? (user.about || user.details || 'No details provided.') : 'Case details are hidden until accepted by a lawyer.'}
                    </p>
                  </div>
                </>
              );
            }
          })()}
        </div>
        <button onClick={onChat} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <MessageSquare size={20} /> Start Chat
        </button>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────
export default function LawyerConnect() {
  const [userRole, setUserRole] = useState<'client' | 'lawyer' | null>(null);
  const [currentEmail, setCurrentEmail] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [chatTarget, setChatTarget] = useState<any>(null);
  const [profileTarget, setProfileTarget] = useState<any>(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regData, setRegData] = useState({ name: '', phone: '', urgency: 'Medium', details: '' });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userConversations, setUserConversations] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const calcUnread = (conversations: any[]) => {
    const counts: Record<string, number> = {};
    conversations.forEach(({ chatKey, messages }: any) => {
      const lastRead = parseInt(localStorage.getItem(`nyaya_lastread_${chatKey}`) || '0');
      counts[chatKey] = messages.filter((m: any) => m.ts > lastRead).length;
    });
    setUnreadCounts(counts);
  };

  const fetchDirectories = async () => {
    const [cr, lr] = await Promise.all([
      fetch('/api/directory?type=clients'),
      fetch('/api/directory?type=lawyers')
    ]);
    if (cr.ok) setClients(await cr.json());
    if (lr.ok) setLawyers(await lr.json());
  };

  const fetchConversations = async (email: string) => {
    const res = await fetch(`/api/directory?type=user_chats&email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const convs = await res.json();
      setUserConversations(convs);
      calcUnread(convs);
    }
  };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('nyaya_user') || '{}');
    if (u.loggedIn) {
      setUserRole(u.role);
      setCurrentEmail(u.email);
      setRegData(d => ({ ...d, name: u.email.split('@')[0] }));

      if (u.role === 'lawyer') {
        const profile = JSON.parse(localStorage.getItem(`nyaya_profile_${u.email}`) || '{}');
        fetch('/api/directory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register_lawyer',
            payload: {
              email: u.email,
              name: profile.name || u.email.split('@')[0],
              phone: profile.phone || '',
              about: profile.about || profile.bio || '',
              role: 'lawyer',
              domain: profile.domain || profile.experience || 'General Practice',
              council_id: profile.councilId || '',
              solved_cases: profile.solvedCases || '0',
              isVerified: true,
            }
          })
        });
      }

      fetchConversations(u.email);
      const t2 = setInterval(() => fetchConversations(u.email), 3000);
      fetchDirectories();
      const t = setInterval(fetchDirectories, 3000);
      return () => { clearInterval(t); clearInterval(t2); };
    }
    fetchDirectories();
    const t = setInterval(fetchDirectories, 3000);
    return () => clearInterval(t);
  }, []);

  const handleAcceptClient = async (client: any) => {
    setActionLoading(client.email);
    const lawyerProfile = JSON.parse(localStorage.getItem(`nyaya_profile_${currentEmail}`) || '{}');
    const lawyerName = lawyerProfile.name || currentEmail.split('@')[0];
    await fetch('/api/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept_client',
        payload: { clientEmail: client.email, lawyerEmail: currentEmail, lawyerName }
      })
    });
    await fetchDirectories();
    setActionLoading(null);
  };

  const handleRejectClient = async (client: any) => {
    setActionLoading('reject_' + client.email);
    await fetch('/api/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reject_client',
        payload: { clientEmail: client.email, lawyerEmail: currentEmail }
      })
    });
    await fetchDirectories();
    setActionLoading(null);
  };

  const handleUndoAccept = async (client: any) => {
    setActionLoading('undo_' + client.email);
    await fetch('/api/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'undo_accept',
        payload: { clientEmail: client.email }
      })
    });
    await fetchDirectories();
    setActionLoading(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const entry = {
      email: currentEmail,
      name: regData.name,
      phone: regData.phone,
      about: `[Urgency: ${regData.urgency}] ${regData.details}`,
      role: 'client',
      isVerified: true,
    };

    const res = await fetch('/api/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register_client', payload: entry })
    });

    setLoading(false);
    if (res.ok) {
      localStorage.setItem(`nyaya_profile_${currentEmail}`, JSON.stringify(entry));
      setShowRegModal(false);
      await fetchDirectories();
      alert('✅ Profile registered! Lawyers can now see your case details.');
    } else {
      const data = await res.json();
      alert(`Registration failed: ${data.error || 'Unknown error'}`);
    }
  };

  if (!userRole) return (
    <div style={{ padding: '60px', textAlign: 'center' }}>
      <h2 className="gradient-text">Please Login to continue</h2>
    </div>
  );

  const myClientProfile = clients.find(c => c.email.toLowerCase() === currentEmail.toLowerCase());

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', width: '100%' }} className="responsive-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px' }} className="directory-header">
        <div>
          <h2 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Nyaya Connect</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '0.9rem' }}>
            {userRole === 'lawyer' ? 'Clients who need legal help' : 'Find and connect with professional lawyers'}
          </p>
        </div>
        <button onClick={fetchDirectories} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
          <Bell size={15} /> Refresh
        </button>
      </div>

      {/* ── LAWYER VIEW: My Clients & Directory ── */}
      {userRole === 'lawyer' && (
        <section>
          {/* My Active Clients Section */}
          {(() => {
            const myActiveClients = clients.filter(c => c.lawyer_email?.toLowerCase() === currentEmail.toLowerCase());
            if (myActiveClients.length === 0) return null;
            return (
              <div style={{ marginBottom: '40px', padding: '24px', background: 'rgba(16,185,129,0.05)', borderRadius: '24px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <CheckCircle2 size={20} color="#10b981" />
                  <h3 style={{ margin: 0, color: '#10b981' }}>My Active Clients</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }} className="grid-responsive">
                  {myActiveClients.map(c => (
                    <div key={c.email} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} color="white" /></div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setProfileTarget(c)} className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}><Eye size={16} /></button>
                        <button onClick={() => setChatTarget(c)} className="btn-primary" style={{ padding: '6px', borderRadius: '8px' }}><MessageSquare size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Users size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontWeight: 700 }}>Clients Directory</h3>
            <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '20px', padding: '2px 12px', fontSize: '0.75rem', fontWeight: 700 }}>{clients.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {clients.filter(c => c.status !== 'Solved').map(c => {
              const chatKey = [currentEmail, c.email].sort().join('__');
              const unread = unreadCounts[chatKey] || 0;
              const isAcceptedByMe = c.lawyer_email?.toLowerCase() === currentEmail.toLowerCase();
              const isAccepted = c.status === 'Accepted';
              const isRejectedByMe = (c.rejected_by || []).includes(currentEmail);
              const isLoadingAccept = actionLoading === c.email;
              const isLoadingReject = actionLoading === ('reject_' + c.email);
              return (
              <div key={c.email} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', border: isAcceptedByMe ? '1px solid rgba(16,185,129,0.35)' : isRejectedByMe ? '1px solid rgba(239,68,68,0.2)' : undefined }}>
                {/* Status badge top-right */}
                <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {isAcceptedByMe && (
                    <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '2px 10px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={11} /> Accepted
                    </span>
                  )}
                  {isRejectedByMe && !isAcceptedByMe && (
                    <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '2px 10px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <XCircle size={11} /> Rejected
                    </span>
                  )}
                  {!isAcceptedByMe && !isRejectedByMe && isAccepted && (
                    <span style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', padding: '2px 10px', fontSize: '0.7rem', fontWeight: 800 }}>
                      Assigned
                    </span>
                  )}
                  {unread > 0 && (
                    <div style={{ background: '#ef4444', color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 800 }}>
                      {unread} new
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: isAcceptedByMe ? 'linear-gradient(135deg,#059669,#10b981)' : 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={26} color="white" /></div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{c.name}</h4>
                    <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</p>
                    {c.phone && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{c.phone}</p>}
                  </div>
                </div>
                {c.about && <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.about}</p>}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <button onClick={() => setProfileTarget(c)} className="btn-secondary" style={{ flex: 1, padding: '9px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.8rem' }}><Eye size={13} /> Profile</button>
                  
                  {/* Accept btn */}
                  {!isAcceptedByMe ? (
                    <button
                      onClick={() => handleAcceptClient(c)}
                      disabled={isLoadingAccept || (isAccepted && !isAcceptedByMe)}
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: isAccepted ? 'not-allowed' : 'pointer', background: isAccepted ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#059669,#10b981)', color: isAccepted ? 'var(--text-muted)' : 'white', opacity: isLoadingAccept ? 0.7 : 1 }}
                    >
                      <CheckCircle2 size={13} /> {isLoadingAccept ? '...' : 'Accept'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUndoAccept(c)}
                      disabled={actionLoading === 'undo_' + c.email}
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                    >
                      <XCircle size={13} /> {actionLoading === 'undo_' + c.email ? '...' : 'Undo Accept'}
                    </button>
                  )}

                  {/* Reject btn (only when not yet accepted by me) */}
                  {!isAcceptedByMe && (
                    <button
                      onClick={() => isRejectedByMe ? handleAcceptClient(c) : handleRejectClient(c)}
                      disabled={isLoadingReject}
                      style={{ flex: 1, padding: '9px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: isRejectedByMe ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.12)', color: isRejectedByMe ? 'var(--text-muted)' : '#ef4444', opacity: isLoadingReject ? 0.7 : 1 }}
                    >
                      <XCircle size={13} /> {isLoadingReject ? '...' : isRejectedByMe ? 'Rejected' : 'Reject'}
                    </button>
                  )}

                  <button onClick={() => setChatTarget(c)} className="btn-primary" style={{ flex: 1, padding: '9px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.8rem', position: 'relative' }}>
                    <MessageSquare size={13} /> Chat {unread > 0 && <span style={{ background: '#ef4444', borderRadius: '50%', width: '7px', height: '7px', display: 'inline-block', marginLeft: '3px' }} />}
                  </button>
                </div>
              </div>
              );
            })}
            {clients.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
                <Users size={48} style={{ opacity: 0.15, marginBottom: '16px' }} />
                <p>No clients registered yet. Ask clients to register their profile.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CLIENT VIEW: Lawyers Directory + Register ── */}
      {userRole === 'client' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Scale size={20} color="var(--primary)" />
              <h3 style={{ margin: 0, fontWeight: 700 }}>Verified Lawyers</h3>
              <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '20px', padding: '2px 12px', fontSize: '0.75rem', fontWeight: 700 }}>{lawyers.length}</span>
            </div>
            <button onClick={() => setShowRegModal(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
              <Plus size={16} /> {myClientProfile ? 'Edit My Profile' : 'Register My Profile'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {lawyers.map(l => {
              const chatKey = [currentEmail, l.email].sort().join('__');
              const unread = unreadCounts[chatKey] || 0;
              return (
              <div key={l.email} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                {unread > 0 && (
                  <div style={{ position: 'absolute', top: '14px', right: '14px', background: '#ef4444', color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 800 }}>
                    {unread} new
                  </div>
                )}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Scale size={26} color="white" /></div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Adv. {l.name}</h4>
                    <p style={{ margin: '3px 0 0', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>{l.domain}</p>
                    {l.phone && <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>✓ Contact Ready</p>}
                  </div>
                </div>
                {l.about && <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.about}</p>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={() => setProfileTarget(l)} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem' }}><Eye size={14} /> Profile</button>
                  <button onClick={() => setChatTarget(l)} className="btn-primary" style={{ flex: 1.5, padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem' }}>
                    <MessageSquare size={14} /> Chat Now {unread > 0 && <span style={{ background: '#ef4444', borderRadius: '50%', width: '8px', height: '8px', display: 'inline-block', marginLeft: '4px' }} />}
                  </button>
                </div>
              </div>
              );
            })}
            {lawyers.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
                <Scale size={48} style={{ opacity: 0.15, marginBottom: '16px' }} />
                <p>No lawyers registered yet.</p>
              </div>
            )}
          </div>

          {/* My Profile & Assigned Lawyer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            {myClientProfile && (
              <div style={{ padding: '24px 28px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><User size={16} /> My Profile</h4>
                  <button onClick={() => setShowRegModal(true)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Edit</button>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} color="var(--primary)" /></div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{myClientProfile.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{myClientProfile.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Assigned Lawyer Card */}
            {(() => {
              const assignedLawyer = lawyers.find(l => l.email.toLowerCase() === myClientProfile?.lawyer_email?.toLowerCase());
              if (!assignedLawyer) return null;
              return (
                <div style={{ padding: '24px 28px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><ShieldCheck size={16} /> My Assigned Lawyer</h4>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>ACTIVE CASE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Scale size={28} color="white" /></div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Adv. {assignedLawyer.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>{assignedLawyer.domain || 'Legal Expert'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setProfileTarget(assignedLawyer)} className="btn-secondary" style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Eye size={16} /> View Profile</button>
                      <button onClick={() => setChatTarget(assignedLawyer)} className="btn-primary" style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={16} /> Chat Now</button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* My Conversations */}
          {userConversations.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <MessageSquare size={18} color="var(--primary)" />
                <h4 style={{ margin: 0, fontWeight: 700 }}>My Conversations</h4>
                {Object.values(unreadCounts).some(n => n > 0) && (
                  <span style={{ background: '#ef4444', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '0.7rem', fontWeight: 800 }}>New Messages</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userConversations.map(({ chatKey, messages, otherEmail }) => {
                  const lawyer = lawyers.find(l => l.email === otherEmail);
                  const lastMsg = messages[messages.length - 1];
                  const unread = unreadCounts[chatKey] || 0;
                  return (
                    <div key={chatKey} className="glass-panel" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flex: 1 }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Scale size={22} color="white" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Adv. {lawyer?.name || otherEmail.split('@')[0]}</p>
                            {unread > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '1px 8px', fontSize: '0.65rem', fontWeight: 800 }}>{unread} new</span>}
                          </div>
                          {lastMsg && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastMsg.sender === currentEmail ? 'You: ' : ''}{lastMsg.text}</p>}
                        </div>
                      </div>
                      <button onClick={() => setChatTarget(lawyer || { email: otherEmail, name: otherEmail.split('@')[0], role: 'lawyer' })} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageSquare size={14} /> {unread > 0 ? 'View Reply' : 'Continue Chat'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Registration Modal ── */}
      {showRegModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,28,0.97)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(12px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <h3 style={{ margin: 0 }}>Register Legal Profile</h3>
              <button onClick={() => setShowRegModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Full Name *</label>
                <input type="text" required value={regData.name} onChange={e => setRegData({ ...regData, name: e.target.value })} style={iStyle} placeholder="Enter your full name" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Mobile Number *</label>
                  <input type="text" required value={regData.phone} onChange={e => setRegData({ ...regData, phone: e.target.value })} style={iStyle} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Urgency Level</label>
                  <select value={regData.urgency} onChange={e => setRegData({ ...regData, urgency: e.target.value })} style={{ ...iStyle, cursor: 'pointer' }}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High (Immediate)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Case Details *</label>
                <textarea required rows={4} value={regData.details} onChange={e => setRegData({ ...regData, details: e.target.value })} style={{ ...iStyle, resize: 'none' }} placeholder="Describe your legal issue in brief..." />
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '14px', borderRadius: '14px', fontWeight: 700, fontSize: '1rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Registering...' : 'Register to Lawyer Directory'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileTarget && (
        <ProfileView 
          user={profileTarget} 
          onClose={() => setProfileTarget(null)} 
          onChat={() => {
            setChatTarget(profileTarget);
            setProfileTarget(null);
          }}
          currentEmail={currentEmail}
          clients={clients}
        />
      )}

      {/* Chat Modal */}
      {chatTarget && <PeerChat me={currentEmail} target={chatTarget} onClose={() => setChatTarget(null)} />}
      
      <style jsx global>{`
        @media (max-width: 768px) {
          .directory-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .grid-responsive { grid-template-columns: 1fr !important; }
          .profile-grid { grid-template-columns: 1fr !important; }
          .glass-panel { padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  );
}
