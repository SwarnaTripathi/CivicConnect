import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, LayoutDashboard, PlusCircle, Menu, X, Zap } from 'lucide-react';

const navLinks = [
  { to: '/',          label: 'Home',      icon: Zap },
  { to: '/submit',    label: 'Report',    icon: PlusCircle },
  { to: '/map',       label: 'Live Map',  icon: MapPin },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem('cc_token');

  const handleLogout = () => {
    localStorage.removeItem('cc_token');
    navigate('/');
  };

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      }}
    >
      <nav style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
            boxShadow: '0 0 20px rgba(79,70,229,0.5)',
          }}>🏙️</div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
            <span className="gradient-text">CivicConnect</span>
            <span style={{ color: '#818cf8', marginLeft: 2 }}>AI</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="hidden md:flex">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: '0.88rem', fontWeight: 600,
                  color: active ? '#fff' : 'rgba(226,232,240,0.65)',
                  background: active ? 'rgba(79,70,229,0.2)' : 'transparent',
                  border: active ? '1px solid rgba(79,70,229,0.4)' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Auth button + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isLoggedIn ? (
            <button onClick={handleLogout} className="btn-neon btn-neon-secondary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
              Logout
            </button>
          ) : (
            <Link to="/login" className="btn-neon btn-neon-primary" style={{ padding: '7px 18px', fontSize: '0.85rem' }}>
              Rep Login
            </Link>
          )}
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e2e8f0', padding: 4, display: 'flex' }}
            className="flex md:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              overflow: 'hidden',
              background: 'rgba(10,14,26,0.97)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: 16,
            }}
          >
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 24px',
                  textDecoration: 'none',
                  color: pathname === to ? '#818cf8' : 'rgba(226,232,240,0.7)',
                  fontSize: '0.95rem', fontWeight: 600,
                  borderLeft: pathname === to ? '3px solid #4f46e5' : '3px solid transparent',
                }}
              >
                <Icon size={18} /> {label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
