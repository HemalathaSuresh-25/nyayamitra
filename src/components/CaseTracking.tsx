'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, Plus, X, User, Scale, Briefcase, ShieldCheck, AlertCircle, Search, CheckCheck } from 'lucide-react';

const iStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: '12px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'white', outline: 'none', fontSize: '0.95rem'
};

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Pending:  { bg: 'rgba(245,158,11,0.1)',   color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  Accepted: { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  Solved:   { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
};

export default function CaseTracking() {
  const [allCases, setAllCases]       = useState<any[]>([]);
  const [allClients, setAllClients]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [userRole, setUserRole]       = useState<'client' | 'lawyer' | null>(null);
  const [currentEmail, setCurrentEmail] = useState('');
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [solveLoading, setSolveLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', category: 'Civil', details: '' });

  // ── fetch ─────────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      const [cr, clr] = await Promise.all([
        fetch('/api/directory?type=cases'),
        fetch('/api/directory?type=clients'),
      ]);
      if (cr.ok)  setAllCases(await cr.json());
      if (clr.ok) setAllClients(await clr.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    localStorage.removeItem('nyaya_cases'); // clear legacy data
    const u = JSON.parse(localStorage.getItem('nyaya_user') || '{}');
    if (u.loggedIn) {
      setUserRole(u.role);
      setCurrentEmail(u.email);
      const profile = JSON.parse(localStorage.getItem(`nyaya_profile_${u.email}`) || '{}');
      setFormData(d => ({ ...d, name: profile.name || u.email.split('@')[0] }));
    }
    fetchAll();
    const t = setInterval(fetchAll, 3000);
    return () => clearInterval(t);
  }, []);

  // ── enrich cases with acceptance info (no private data exposed) ───
  const enriched = allCases.map(c => {
    const dirClient = allClients.find(
      dc => dc.email?.toLowerCase() === (c.clientEmail || '').toLowerCase()
    );
    const effectiveStatus = dirClient?.status === 'Accepted' ? 'Accepted' : (c.status || 'Pending');
    const effectiveLawyer = dirClient?.acceptedBy || c.assignedLawyer || null;
    return { ...c, effectiveStatus, effectiveLawyer };
  });

  // ── filter / search ────────────────────────────────────────────────
  const filtered = enriched.filter(c => {
    const matchSearch = !search ||
      (c.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.details || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.id || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || c.effectiveStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── mark case as solved ───────────────────────────────────────────
  const handleSolveCase = async (caseId: string) => {
    setSolveLoading(caseId);
    const res = await fetch('/api/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'solve_case',
        payload: { caseId, lawyerEmail: currentEmail },
      }),
    });
    setSolveLoading(null);
    if (res.ok) {
      fetchAll();
    } else {
      alert('Could not mark as solved. Only the assigned lawyer can do this.');
    }
  };

  // ── file new complaint ─────────────────────────────────────────────
  const handleNewComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const user = JSON.parse(localStorage.getItem('nyaya_user') || '{}');
    
    if (!user.email) {
      alert('Error: Session expired. Please log in again.');
      setSubmitting(false);
      return;
    }

    const caseId = `CASE-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCase = {
      id: caseId,
      title: `${formData.category} Case - ${formData.name}`,
      client_name: formData.name,
      client_email: user.email,
      category: formData.category,
      details: formData.details,
      status: 'Pending'
    };

    console.log('Filing case with payload:', newCase);

    const res = await fetch('/api/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'file_case', payload: newCase }),
    });
    setSubmitting(false);
    if (res.ok) {
      setIsModalOpen(false);
      setFormData(d => ({ ...d, category: 'Civil', details: '' }));
      fetchAll();
    } else {
      const errData = await res.json();
      alert(`Failed to file complaint: ${errData.error || 'Unknown error'}`);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'Accepted') return <CheckCircle2 size={13} />;
    if (status === 'Solved')   return <CheckCircle2 size={13} />;
    return <Clock size={13} />;
  };

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <Clock size={32} style={{ margin: '0 auto 16px', opacity: 0.35, display: 'block' }} />
      <p>Loading cases…</p>
    </div>
  );

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }} className="responsive-container">

      {/* ── Header ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }} className="case-header">
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Case Tracking
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
            Public legal case board · {filtered.length} case{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Only clients can file a complaint */}
        {userRole === 'client' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px', fontWeight: 700 }}
          >
            <Plus size={18} /> New Complaint
          </button>
        )}
      </header>

      {/* ── Search & Filter Bar ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cases…"
            style={{ ...iStyle, paddingLeft: '40px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {['All', 'Pending', 'Accepted', 'Solved'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: filterStatus === s
                  ? (s === 'All' ? 'var(--primary)' : STATUS_COLORS[s]?.bg || 'var(--primary)')
                  : 'rgba(255,255,255,0.05)',
                color: filterStatus === s
                  ? (s === 'All' ? 'white' : STATUS_COLORS[s]?.color || 'white')
                  : 'var(--text-muted)',
                boxShadow: filterStatus === s ? '0 0 0 1px ' + (STATUS_COLORS[s]?.border || 'var(--primary)') : 'none',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cases List ── */}
      {filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '70px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>
            <Scale size={48} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>No cases found</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '380px', fontSize: '0.88rem', lineHeight: 1.6 }}>
            {allCases.length === 0
              ? 'No legal cases have been filed yet. Clients can register a case using the "New Complaint" button.'
              : 'No cases match your current search or filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map(c => {
            const isAccepted = c.effectiveStatus === 'Accepted';
            const isSolved   = c.effectiveStatus === 'Solved';
            const colors     = STATUS_COLORS[c.effectiveStatus] || STATUS_COLORS.Pending;

            return (
              <div
                key={c.id}
                className="glass-panel"
                style={{
                  padding: '22px 26px',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                  border: `1px solid ${isAccepted || isSolved ? colors.border : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '18px',
                  transition: 'border 0.3s, transform 0.2s',
                }}
              >
                {/* Icon */}
                <div style={{
                  padding: '14px', borderRadius: '14px', flexShrink: 0,
                  background: c.issueType === 'Criminal'
                    ? 'rgba(239,68,68,0.1)'
                    : isSolved
                      ? 'linear-gradient(135deg,#7c3aed,#a78bfa)'
                      : isAccepted
                        ? 'linear-gradient(135deg,#059669,#10b981)'
                        : 'var(--gradient-primary)',
                  color: c.issueType === 'Criminal' ? '#ef4444' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.4s'
                }}>
                  {c.issueType === 'Criminal' ? <ShieldCheck size={24} /> : <Scale size={24} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Top row: ID + type + status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.06em' }}>
                        {c.id}
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 9px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {c.category || c.issueType}
                      </span>
                    </div>

                    {/* Status badge */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '5px 13px', borderRadius: '20px',
                      background: colors.bg, color: colors.color,
                      fontSize: '0.75rem', fontWeight: 800,
                      border: `1px solid ${colors.border}`,
                      whiteSpace: 'nowrap'
                    }}>
                      {statusIcon(c.effectiveStatus)}
                      {c.effectiveStatus.toUpperCase()}
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', marginBottom: '14px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.details || 'No description provided.'}
                  </p>

                  {/* Footer: filed by + date + lawyer — NO email/phone */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Row 1: meta info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Filed by — name only, no email */}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <User size={13} />
                          Filed by <strong style={{ color: 'var(--text-main)', marginLeft: '3px' }}>{c.client_name || 'Anonymous'}</strong>
                        </span>
                        {/* Date */}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <Calendar size={13} />
                          {new Date(c.created_at || c.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Lawyer info or waiting */}
                      {c.lawyer_name || c.effectiveLawyer ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '7px',
                          padding: '6px 14px',
                          background: isSolved ? 'rgba(139,92,246,0.08)' : 'rgba(16,185,129,0.08)',
                          borderRadius: '10px',
                          color: isSolved ? '#a78bfa' : '#10b981',
                          fontSize: '0.82rem', fontWeight: 600,
                          border: isSolved ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(16,185,129,0.2)'
                        }}>
                          <Briefcase size={14} /> Adv. {c.lawyer_name || c.effectiveLawyer}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <AlertCircle size={13} /> Awaiting assignment…
                        </span>
                      )}
                    </div>

                    {/* Row 2: Mark as Solved btn — only for the accepting lawyer on accepted (not yet solved) cases */}
                    {userRole === 'lawyer' && isAccepted && !isSolved && (() => {
                      // Find the client in directory to check if this lawyer accepted them
                      const dirClient = allClients.find(
                        dc => dc.email?.toLowerCase() === (c.client_email || c.clientEmail || '').toLowerCase()
                      );
                      const isMyCase = dirClient?.lawyer_email?.toLowerCase() === currentEmail.toLowerCase() || c.lawyer_email?.toLowerCase() === currentEmail.toLowerCase();
                      if (!isMyCase) return null;
                      return (
                        <button
                          onClick={() => handleSolveCase(c.id)}
                          disabled={solveLoading === c.id}
                          style={{
                            alignSelf: 'flex-end',
                            display: 'flex', alignItems: 'center', gap: '7px',
                            padding: '9px 20px', borderRadius: '10px',
                            background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
                            color: 'white', border: 'none', cursor: 'pointer',
                            fontSize: '0.82rem', fontWeight: 700,
                            opacity: solveLoading === c.id ? 0.7 : 1,
                            transition: 'opacity 0.2s, transform 0.15s',
                            boxShadow: '0 4px 14px rgba(124,58,237,0.35)'
                          }}
                        >
                          <CheckCheck size={15} />
                          {solveLoading === c.id ? 'Marking…' : 'Mark as Solved'}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── New Complaint Modal (clients only) ── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.87)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px', backdropFilter: 'blur(12px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '36px', position: 'relative', borderRadius: '24px' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Scale size={20} color="white" />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>File New Complaint</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.86rem', paddingLeft: '52px' }}>
              Your case will be visible publicly (name & details only — no contact info shared).
            </p>

            <form onSubmit={handleNewComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Full Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={iStyle} placeholder="Your registered name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Case Category *</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ ...iStyle, cursor: 'pointer', background: 'rgba(0,0,0,0.35)' }}>
                  <option value="Civil">Civil Matter</option>
                  <option value="Criminal">Criminal Offense</option>
                  <option value="Property">Property Dispute</option>
                  <option value="Family">Family Law</option>
                  <option value="Corporate">Corporate / Business</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Case Details *</label>
                <textarea required rows={4} value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} style={{ ...iStyle, resize: 'none' }} placeholder="Describe your legal issue in detail…" />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '14px', borderRadius: '13px', fontWeight: 700, fontSize: '1rem', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Filing…' : 'Register Complaint'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .glass-panel { transition: transform 0.2s; }
        .glass-panel:hover { transform: translateY(-1px); }
      `}</style>
      <style jsx global>{`
        @media (max-width: 768px) {
          .case-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .case-header button { width: 100% !important; }
          .glass-panel { padding: 20px 16px !important; flex-direction: column !important; }
          .glass-panel > div { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
