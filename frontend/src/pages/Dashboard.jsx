import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, CheckCircle2, AlertTriangle, Clock, TrendingUp, X, Loader2, Users, Shield } from 'lucide-react';
import { useTickets } from '../hooks/useTickets';
import { useSocket } from '../hooks/useSocket';
import { resolveTicket, voteQuorum } from '../lib/api';
import TicketCard from '../components/TicketCard';

function KpiCard({ label, value, color, icon: Icon, glow }) {
  return (
    <motion.div
      className="glass-card"
      style={{ padding: '24px 22px', borderLeft: `3px solid ${color}` }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${glow}` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="stat-number" style={{ color }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.5)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </motion.div>
  );
}

function ResolveModal({ ticket, onClose, onResolved }) {
  const [loading, setLoading] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  const handleResolve = async () => {
    setLoading(true);
    try {
      await resolveTicket(ticket._id);
      onResolved();
      onClose();
    } catch {
      setLoading(false);
    }
  };

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card-elevated"
        style={{ maxWidth: 480, width: '100%', padding: 32 }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem' }}>
            <span className="gradient-text">Mark as Resolved</span>
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(226,232,240,0.5)', padding: 4 }}><X size={18} /></button>
        </div>

        <p style={{ color: 'rgba(226,232,240,0.7)', fontSize: '0.88rem', marginBottom: 20, lineHeight: 1.6 }}>
          Resolving: <strong style={{ color: '#e2e8f0' }}>{ticket.title}</strong>
        </p>

        <div className="field-group" style={{ marginBottom: 20 }}>
          <label className="field-label">Proof-of-Fix URL (optional)</label>
          <input
            className="civic-input"
            placeholder="https://cloudinary.com/... or link to before/after"
            value={proofUrl}
            onChange={e => setProofUrl(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn-neon btn-neon-secondary" style={{ flex: 1, padding: 12 }}>Cancel</button>
          <button onClick={handleResolve} className="btn-neon btn-neon-primary" style={{ flex: 1, padding: 12 }} disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
            {loading ? 'Resolving...' : 'Confirm Resolve'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const token = localStorage.getItem('cc_token');
  const { tickets, stats, loading, refetch } = useTickets({}, 30000);
  const [feed, setFeed] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');

  useSocket((newTicket) => {
    setFeed(f => [newTicket, ...f.slice(0, 19)]);
    refetch();
  });

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--navy-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <motion.div className="glass-card-elevated" style={{ padding: 48, maxWidth: 420, textAlign: 'center' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Shield size={48} style={{ color: '#4f46e5', marginBottom: 16 }} />
          <h2 style={{ margin: '0 0 10px', fontWeight: 800 }}>Representative Access</h2>
          <p style={{ color: 'rgba(226,232,240,0.55)', marginBottom: 24, fontSize: '0.9rem' }}>This dashboard is restricted to verified ward representatives.</p>
          <a href="/login" className="btn-neon btn-neon-primary" style={{ padding: '13px 32px', fontSize: '0.95rem' }}>Login with Rep Credentials</a>
        </motion.div>
      </div>
    );
  }

  const statuses = ['All', 'Submitted', 'Triaged', 'In_Progress', 'Resolved'];
  const displayed = filterStatus === 'All' ? tickets : tickets.filter(t => t.status === filterStatus);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-900)', padding: '84px 24px 60px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontWeight: 900, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', letterSpacing: '-0.03em' }}>
              <span className="gradient-text">Representative</span> Dashboard
            </h1>
            <p style={{ margin: 0, color: 'rgba(226,232,240,0.5)', fontSize: '0.88rem' }}>Real-time grievance management and resolution control centre</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
            <span className="live-dot" /> Live
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          <KpiCard label="Total Tickets" value={stats.total} color="#818cf8" glow="rgba(129,140,248,0.3)" icon={LayoutDashboard} />
          <KpiCard label="Open" value={stats.open} color="#f59e0b" glow="rgba(245,158,11,0.3)" icon={Clock} />
          <KpiCard label="Resolved" value={stats.resolved} color="#10b981" glow="rgba(16,185,129,0.3)" icon={CheckCircle2} />
          <KpiCard label="Critical" value={stats.critical} color="#f43f5e" glow="rgba(244,63,94,0.3)" icon={AlertTriangle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* Ticket list */}
          <div>
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 600,
                    background: filterStatus === s ? 'rgba(79,70,229,0.3)' : 'rgba(255,255,255,0.05)',
                    color: filterStatus === s ? '#818cf8' : 'rgba(226,232,240,0.5)',
                    border: filterStatus === s ? '1px solid rgba(79,70,229,0.4)' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(226,232,240,0.4)' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5' }} />
                <p style={{ marginTop: 12 }}>Loading tickets...</p>
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'rgba(226,232,240,0.3)' }}>
                <p>No tickets found for this filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }} className="thin-scroll">
                {displayed.map(ticket => (
                  <TicketCard
                    key={ticket._id}
                    ticket={ticket}
                    onClick={() => setSelectedTicket(ticket)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Live Feed Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass-card-elevated" style={{ padding: 20, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <TrendingUp size={16} style={{ color: '#10b981' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Live Feed</span>
                <span className="live-dot" style={{ marginLeft: 'auto' }} />
              </div>

              {feed.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'rgba(226,232,240,0.35)', textAlign: 'center', padding: '24px 0' }}>
                  Waiting for new tickets...
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }} className="thin-scroll">
                  <AnimatePresence>
                    {feed.map((t, i) => (
                      <motion.div
                        key={t._id || i}
                        initial={{ opacity: 0, x: 20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        style={{ fontSize: '0.8rem', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, borderLeft: '2px solid #4f46e5' }}
                      >
                        <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title || t.description?.slice(0, 40)}</div>
                        <div style={{ color: 'rgba(226,232,240,0.45)', fontSize: '0.73rem' }}>{t.category} · {t.priority}</div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resolve modal */}
      <AnimatePresence>
        {selectedTicket && (
          <ResolveModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onResolved={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
