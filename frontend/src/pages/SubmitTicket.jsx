import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MapPin, Loader2, CheckCircle2, Zap, Camera, AlertTriangle } from 'lucide-react';
import { submitTicket, triagePreview } from '../lib/api';

const CATEGORIES = ['Roads', 'Drainage', 'Sanitation', 'Water Supply', 'Electricity', 'Other'];

function useDebounce(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const PRIORITY_COLOR = { Critical: '#f43f5e', High: '#f59e0b', Medium: '#06b6d4', Low: '#10b981' };

export default function SubmitTicket() {
  const [form, setForm] = useState({
    description: '',
    category: '',
    latitude: '',
    longitude: '',
    wardId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [triage, setTriage] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);

  const debouncedDesc = useDebounce(form.description, 900);

  // Live AI triage preview
  useEffect(() => {
    if (debouncedDesc.length < 20) { setTriage(null); return; }
    setTriageLoading(true);
    triagePreview(debouncedDesc)
      .then(r => { setTriage(r.data); setTriageLoading(false); })
      .catch(() => setTriageLoading(false));
  }, [debouncedDesc]);

  // Auto-fill category from triage
  useEffect(() => {
    if (triage?.category && !form.category) {
      setForm(f => ({ ...f, category: triage.category }));
    }
  }, [triage]);

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.latitude || !form.longitude) {
      setError('Please fill in description and location.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        description: form.description,
        category: form.category || triage?.category || 'Other',
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        wardId: form.wardId || 'auto',
        rawDescription: form.description,
      };
      const res = await submitTicket(payload);
      setSuccess(res.data);
      setForm({ description: '', category: '', latitude: '', longitude: '', wardId: '' });
      setTriage(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pColor = triage ? (PRIORITY_COLOR[triage.priority] || '#818cf8') : '#4f46e5';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-900)', padding: '100px 24px 60px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, alignItems: 'start' }}>

        {/* ── Form Panel ──────────────────────── */}
        <motion.div
          className="glass-card-elevated"
          style={{ padding: '36px 32px' }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '1.7rem', letterSpacing: '-0.02em' }}>
              <span className="gradient-text">Report an Issue</span>
            </h1>
            <p style={{ margin: 0, color: 'rgba(226,232,240,0.55)', fontSize: '0.9rem' }}>
              AI will classify and route your grievance automatically.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Description */}
            <div className="field-group">
              <label className="field-label">Description *</label>
              <textarea
                className="civic-input"
                placeholder="Describe the issue in detail (English, Hindi, regional languages accepted)..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                required
              />
              {triageLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#818cf8' }}>
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Analysing with AI...
                </div>
              )}
            </div>

            {/* Category */}
            <div className="field-group">
              <label className="field-label">Category</label>
              <select
                className="civic-input"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ cursor: 'pointer' }}
              >
                <option value="">— Auto-detect from AI —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Location */}
            <div className="field-group">
              <label className="field-label">Location *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input
                  className="civic-input"
                  placeholder="Latitude"
                  value={form.latitude}
                  onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                  required
                  type="number"
                  step="any"
                />
                <input
                  className="civic-input"
                  placeholder="Longitude"
                  value={form.longitude}
                  onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                  required
                  type="number"
                  step="any"
                />
              </div>
              <button
                type="button"
                onClick={getLocation}
                className="btn-neon btn-neon-secondary"
                style={{ marginTop: 8, padding: '9px 16px', fontSize: '0.85rem', width: '100%' }}
                disabled={locating}
              >
                {locating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <MapPin size={14} />}
                {locating ? 'Locating...' : 'Use My GPS Location'}
              </button>
            </div>

            {/* Ward ID */}
            <div className="field-group">
              <label className="field-label">Ward / Area</label>
              <input
                className="civic-input"
                placeholder="e.g. Ward 42 (optional — auto-mapped)"
                value={form.wardId}
                onChange={e => setForm(f => ({ ...f, wardId: e.target.value }))}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#fb7185', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem' }}>
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-neon btn-neon-primary"
              style={{ padding: '14px', fontSize: '1rem', width: '100%', marginTop: 4 }}
              disabled={submitting}
            >
              {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
              {submitting ? 'Submitting...' : 'Submit Grievance'}
            </button>
          </form>
        </motion.div>

        {/* ── Right Panel: AI Preview + Success ─ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.div
                className="glass-card"
                style={{ padding: 24, borderColor: 'rgba(16,185,129,0.3)', borderLeft: '3px solid #10b981' }}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <CheckCircle2 size={22} style={{ color: '#10b981' }} />
                  <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>Ticket Submitted!</span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'rgba(226,232,240,0.7)' }}>
                  Your ticket ID: <code style={{ fontFamily: 'JetBrains Mono', color: '#818cf8', fontSize: '0.8rem' }}>#{success._id?.slice(-8)?.toUpperCase() || 'PENDING'}</code>
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(226,232,240,0.5)' }}>
                  Status will update in real-time via live map.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Triage Preview */}
          <AnimatePresence>
            {triage && (
              <motion.div
                className="glass-card"
                style={{ padding: 24, borderLeft: `3px solid ${pColor}` }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Zap size={16} style={{ color: '#818cf8' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#818cf8' }}>AI Triage Preview</span>
                  <span className="live-dot" style={{ marginLeft: 'auto' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Row label="Category" value={triage.category} color={pColor} />
                  <Row label="Priority" value={triage.priority} color={pColor} />
                  <Row label="Department" value={triage.suggested_department} color="#818cf8" />
                  {triage.english_translation && triage.english_translation !== form.description && (
                    <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.8rem', color: 'rgba(226,232,240,0.6)' }}>
                      <div style={{ fontWeight: 600, marginBottom: 4, color: '#67e8f9' }}>Translation</div>
                      {triage.english_translation}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info card */}
          {!triage && !success && (
            <motion.div
              className="glass-card"
              style={{ padding: 24, opacity: 0.7 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
            >
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤖</div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(226,232,240,0.5)', lineHeight: 1.7 }}>
                  Start typing your issue description and our AI will preview the triage — category, priority, and department — in real time.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
      <span style={{ color: 'rgba(226,232,240,0.5)', fontWeight: 600 }}>{label}</span>
      <span style={{ color, fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: '0.82rem' }}>{value}</span>
    </div>
  );
}
