import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PRIORITY_COLORS = {
  Critical: '#f43f5e',
  High: '#f59e0b',
  Medium: '#06b6d4',
  Low: '#10b981',
};

const STATUS_LABEL = {
  Submitted: 'Submitted',
  Triaged: 'Triaged',
  Assigned: 'Assigned',
  In_Progress: 'In Progress',
  Pending_Verification: 'Verifying',
  Resolved: 'Resolved',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TicketCard({ ticket, onClick }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    setTilt({ x, y });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const pColor = PRIORITY_COLORS[ticket.priority] || '#818cf8';

  return (
    <motion.div
      ref={cardRef}
      className="glass-card cursor-pointer"
      style={{
        padding: '18px 20px',
        transform: `perspective(700px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: 'transform 0.15s ease, box-shadow 0.2s ease',
        borderLeft: `3px solid ${pColor}`,
        userSelect: 'none',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ticket.title}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(226,232,240,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {ticket.description}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
          <span className={`badge badge-${ticket.priority?.toLowerCase()}`}>
            <span className={`priority-dot dot-${ticket.priority?.toLowerCase()}`} />
            {ticket.priority}
          </span>
          <span className={`badge badge-${ticket.status === 'Resolved' ? 'resolved' : 'triaged'}`}>
            {STATUS_LABEL[ticket.status] || ticket.status}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'rgba(226,232,240,0.5)' }}>
          <MapPin size={11} style={{ color: '#4f46e5' }} />
          {ticket.wardId || 'Ward TBD'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'rgba(226,232,240,0.5)' }}>
          <Clock size={11} style={{ color: '#06b6d4' }} />
          {timeAgo(ticket.createdAt)}
        </span>
        {ticket.affectedCitizensCount > 1 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#fcd34d' }}>
            <Users size={11} />
            {ticket.affectedCitizensCount} affected
          </span>
        )}
        <span
          style={{
            marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 600,
            color: '#818cf8', display: 'flex', alignItems: 'center', gap: 3,
          }}
        >
          {ticket.category} <ChevronRight size={13} />
        </span>
      </div>
    </motion.div>
  );
}
