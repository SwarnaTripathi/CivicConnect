import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { useSocket } from '../hooks/useSocket';

const PRIORITY_COLORS = { Critical: '#f43f5e', High: '#f59e0b', Medium: '#06b6d4', Low: '#10b981' };
const JITTER = 0.0014; // ~150m privacy jitter

function jitter(val) {
  return val + (Math.random() - 0.5) * JITTER * 2;
}

function timeAgo(d) {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function MapView() {
  const { tickets, loading, refetch } = useTickets({}, 60000);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');
  const jitteredRef = useRef({});

  useSocket((newTicket) => {
    refetch();
  });

  // Stable jitter per ticket
  const getJittered = (ticket) => {
    if (!jitteredRef.current[ticket._id]) {
      jitteredRef.current[ticket._id] = {
        lat: jitter(ticket.location?.coordinates?.[1] || 20.5937),
        lng: jitter(ticket.location?.coordinates?.[0] || 78.9629),
      };
    }
    return jitteredRef.current[ticket._id];
  };

  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const filtered = filter === 'All'
    ? tickets
    : tickets.filter(t => t.priority === filter);

  return (
    <div style={{ paddingTop: 64, height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--navy-900)' }}>

      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: 'rgba(10,14,26,0.9)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={18} style={{ color: '#4f46e5' }} />
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>Live Civic Map</h1>
          <span style={{ marginLeft: 6 }} className="live-dot" />
        </div>
        <span style={{ fontSize: '0.82rem', color: 'rgba(226,232,240,0.5)' }}>
          {filtered.length} ticket{filtered.length !== 1 ? 's' : ''} shown · Jittered for privacy
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {priorities.map(p => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              style={{
                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 600,
                background: filter === p
                  ? (PRIORITY_COLORS[p] || '#4f46e5')
                  : 'rgba(255,255,255,0.06)',
                color: filter === p ? (p === 'High' || p === 'All' ? '#000' : '#fff') : 'rgba(226,232,240,0.6)',
                transition: 'all 0.2s',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Side panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Map */}
        <div style={{ flex: 1 }}>
          {!loading && (
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {filtered.map(ticket => {
                const { lat, lng } = getJittered(ticket);
                const color = PRIORITY_COLORS[ticket.priority] || '#818cf8';
                return (
                  <CircleMarker
                    key={ticket._id}
                    center={[lat, lng]}
                    radius={ticket.priority === 'Critical' ? 10 : ticket.priority === 'High' ? 8 : 6}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.85,
                      weight: 2,
                    }}
                    eventHandlers={{ click: () => setSelected(ticket) }}
                  >
                    <Popup>
                      <div style={{ minWidth: 180 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6, color: '#e2e8f0', fontSize: '0.9rem' }}>{ticket.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.6)', marginBottom: 4 }}>{ticket.category} · {ticket.priority}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(226,232,240,0.4)' }}>{timeAgo(ticket.createdAt)}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
          {loading && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(226,232,240,0.5)', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '2rem', animation: 'spin 2s linear infinite' }}>⟳</div>
              Loading map data...
            </div>
          )}
        </div>

        {/* Slide-in detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key="panel"
              className="glass-card-elevated"
              style={{
                position: 'absolute', right: 16, top: 16, bottom: 16,
                width: 320, padding: 24, overflowY: 'auto',
                zIndex: 1000,
              }}
              initial={{ x: 360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 360, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button
                onClick={() => setSelected(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(226,232,240,0.5)', padding: 4 }}
              >
                <X size={18} />
              </button>

              <div style={{ marginBottom: 16 }}>
                <span className={`badge badge-${selected.priority?.toLowerCase()}`} style={{ marginBottom: 10, display: 'inline-flex' }}>
                  <span className={`priority-dot dot-${selected.priority?.toLowerCase()}`} />
                  {selected.priority}
                </span>
                <h2 style={{ margin: '8px 0', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.3 }}>{selected.title}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(226,232,240,0.6)', lineHeight: 1.6 }}>{selected.description}</p>
              </div>

              <div className="glow-line" style={{ margin: '16px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <InfoRow icon={<MapPin size={14} style={{ color: '#4f46e5' }} />} label="Ward" value={selected.wardId} />
                <InfoRow icon={<Clock size={14} style={{ color: '#06b6d4' }} />} label="Submitted" value={timeAgo(selected.createdAt)} />
                <InfoRow icon={<Users size={14} style={{ color: '#f59e0b' }} />} label="Affected" value={`${selected.affectedCitizensCount} citizen(s)`} />
                <InfoRow label="Department" value={selected.department} />
                <InfoRow label="Status" value={selected.status?.replace('_', ' ')} />
                <InfoRow label="H3 Index" value={selected.h3Index} mono />
              </div>

              {selected.photos?.before?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(226,232,240,0.5)', marginBottom: 8 }}>PHOTOS</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selected.photos.before.map((url, i) => (
                      <img key={i} src={url} alt="before" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, mono }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.83rem' }}>
      <span style={{ color: 'rgba(226,232,240,0.45)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon}{label}
      </span>
      <span style={{ color: '#e2e8f0', fontWeight: 600, textAlign: 'right', fontFamily: mono ? 'JetBrains Mono' : 'inherit', fontSize: mono ? '0.72rem' : '0.83rem' }}>
        {value}
      </span>
    </div>
  );
}
