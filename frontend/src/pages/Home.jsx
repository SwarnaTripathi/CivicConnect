import React, { Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, MapPin, TrendingUp, ChevronDown } from 'lucide-react';
import { useTickets } from '../hooks/useTickets';

const Scene3D = React.lazy(() => import('../components/Scene3D'));

const FEATURES = [
  {
    icon: Zap,
    color: '#4f46e5',
    glow: 'rgba(79,70,229,0.25)',
    title: 'AI Triage in Seconds',
    desc: 'LLaMA-3.1 classifies, prioritises and routes every grievance to the right department automatically.',
  },
  {
    icon: Shield,
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.25)',
    title: 'Tamper-Proof Audit',
    desc: 'SHA-256 hash chain ensures every status update is cryptographically linked and immutable.',
  },
  {
    icon: MapPin,
    color: '#7c3aed',
    glow: 'rgba(124,58,237,0.25)',
    title: 'H3 Deduplication',
    desc: 'Uber H3 spatial indexing + MiniLM embeddings collapse duplicate reports into a single master ticket.',
  },
  {
    icon: TrendingUp,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
    title: 'Quorum Verification',
    desc: 'Resolutions are validated by citizen quorum — 3 upvotes required before a ticket closes.',
  },
];

function StatBadge({ label, value, color }) {
  return (
    <motion.div
      className="glass-card"
      style={{ padding: '20px 28px', textAlign: 'center', minWidth: 140 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="stat-number" style={{ color }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.55)', marginTop: 4, fontWeight: 600 }}>{label}</div>
    </motion.div>
  );
}

export default function Home() {
  const { stats, loading } = useTickets({}, 60000);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const staggerChild = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-900)' }}>

      {/* ── HERO ───────────────────────────────── */}
      <section
        className="bg-hero"
        style={{
          position: 'relative', overflow: 'hidden',
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '80px 24px 60px',
        }}
      >
        {/* 3D Background */}
        <Suspense fallback={null}>
          <Scene3D style={{ position: 'absolute', inset: 0 }} />
        </Suspense>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 780 }}>
          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 20,
              background: 'rgba(79,70,229,0.12)',
              border: '1px solid rgba(79,70,229,0.3)',
              marginBottom: 28,
            }}
          >
            <span className="live-dot" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#818cf8' }}>
              AI-Powered Civic Platform · Zero Cost
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={staggerChild}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.15, duration: 0.7 }}
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              margin: '0 0 20px',
              color: '#fff',
            }}
          >
            Fix Your City With{' '}
            <span className="gradient-text">Artificial Intelligence</span>
          </motion.h1>

          <motion.p
            variants={staggerChild}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
              color: 'rgba(226,232,240,0.65)',
              lineHeight: 1.7, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px',
            }}
          >
            Submit grievances in any language. LLaMA-3.1 triages, H3 deduplicates, and your ward representative
            resolves — all on a cryptographically audited ledger.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={staggerChild}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.45, duration: 0.5 }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link to="/submit" className="btn-neon btn-neon-primary" style={{ fontSize: '1rem', padding: '13px 32px' }}>
              Report an Issue <ArrowRight size={18} />
            </Link>
            <Link to="/map" className="btn-neon btn-neon-secondary" style={{ fontSize: '1rem', padding: '13px 32px' }}>
              View Live Map <MapPin size={18} />
            </Link>
          </motion.div>
        </div>

        {/* Stats ribbon */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            style={{
              position: 'relative', zIndex: 1,
              display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center',
              marginTop: 60,
            }}
          >
            <StatBadge label="Total Tickets" value={stats.total || '—'} color="#818cf8" />
            <StatBadge label="Open" value={stats.open || '—'} color="#f59e0b" />
            <StatBadge label="Resolved" value={stats.resolved || '—'} color="#10b981" />
            <StatBadge label="Critical" value={stats.critical || '—'} color="#f43f5e" />
          </motion.div>
        )}

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', color: 'rgba(226,232,240,0.3)', zIndex: 1 }}
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>

      {/* ── FEATURES ───────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 14px' }}>
            How <span className="gradient-text">CivicConnect</span> Works
          </h2>
          <p style={{ color: 'rgba(226,232,240,0.55)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto' }}>
            Four intelligent layers — from submission to verified resolution.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {FEATURES.map(({ icon: Icon, color, glow, title, desc }, i) => (
            <motion.div
              key={title}
              className="glass-card"
              style={{ padding: 28 }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6 }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `linear-gradient(135deg, ${color}22, ${color}44)`,
                border: `1px solid ${color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
                boxShadow: `0 0 20px ${glow}`,
              }}>
                <Icon size={22} style={{ color }} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>{title}</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(226,232,240,0.55)', lineHeight: 1.65 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────── */}
      <section style={{ padding: '60px 24px 100px' }}>
        <motion.div
          className="glass-card-elevated"
          style={{
            maxWidth: 800, margin: '0 auto',
            padding: '52px 40px', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(6,182,212,0.1))',
          }}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            Your city needs <span className="gradient-text-amber">your voice.</span>
          </h2>
          <p style={{ color: 'rgba(226,232,240,0.6)', marginBottom: 30, fontSize: '1.05rem' }}>
            Every report you submit is AI-triaged and tracked to resolution. Takes 30 seconds.
          </p>
          <Link to="/submit" className="btn-neon btn-neon-amber" style={{ fontSize: '1rem', padding: '14px 36px' }}>
            Submit a Grievance Now <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
