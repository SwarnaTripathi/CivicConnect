import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login } from '../lib/api';

export default function Login() {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(creds);
      localStorage.setItem('cc_token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
      <motion.div
        className="glass-card-elevated"
        style={{ width: '100%', maxWidth: 400, padding: '40px 36px' }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(79,70,229,0.4)' }}>
            <Shield size={24} color="#fff" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: '1.5rem' }}>
            <span className="gradient-text">Rep Login</span>
          </h1>
          <p style={{ margin: 0, color: 'rgba(226,232,240,0.5)', fontSize: '0.85rem' }}>Access the representative dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field-group">
            <label className="field-label">Username</label>
            <input
              className="civic-input"
              placeholder="rep@ward42"
              value={creds.username}
              onChange={e => setCreds(c => ({ ...c, username: e.target.value }))}
              autoComplete="username"
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="civic-input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={creds.password}
                onChange={e => setCreds(c => ({ ...c, password: e.target.value }))}
                autoComplete="current-password"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(226,232,240,0.4)', padding: 0 }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: '#fb7185', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-neon btn-neon-primary" style={{ padding: 14, fontSize: '0.95rem', marginTop: 4 }} disabled={loading}>
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Shield size={18} />}
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.78rem', color: 'rgba(226,232,240,0.35)' }}>
          Demo: <code style={{ fontFamily: 'JetBrains Mono', color: '#818cf8' }}>admin / admin123</code>
        </p>
      </motion.div>
    </div>
  );
}
