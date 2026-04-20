import React from 'react';
import { X, MapPin, Phone, Globe, Mail, Star, ExternalLink, Calendar, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { getScoreColor, getScoreLabel } from '../utils/scoring';

const LeadModal = ({ lead, onClose, onUpdateStatus, onDelete }) => {
  if (!lead) return null;

  const scoreColor = getScoreColor(lead.leadScore);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        padding: '0'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ 
                background: `${scoreColor}20`, 
                color: scoreColor, 
                padding: '4px 10px', 
                borderRadius: '99px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Score: {lead.leadScore} - {getScoreLabel(lead.leadScore)}
              </span>
              <span style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                color: 'var(--text-dim)', 
                padding: '4px 10px', 
                borderRadius: '99px',
                fontSize: '12px'
              }}>
                {lead.status}
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{lead.title}</h2>
            <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <MapPin size={16} /> {lead.address}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* Contact Info */}
            <div>
              <h4 style={{ fontSize: '14px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Contact Information</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={16} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Phone</div>
                    <div style={{ fontSize: '14px' }}>{lead.phone || 'N/A'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={16} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Email</div>
                    <div style={{ fontSize: '14px' }}>{lead.email || 'N/A'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={16} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Website</div>
                    <div style={{ fontSize: '14px' }}>
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Visit Site <ExternalLink size={12} />
                        </a>
                      ) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Stats */}
            <div>
              <h4 style={{ fontSize: '14px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Business Metrics</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={16} color="#f59e0b" fill="#f59e0b" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Rating & Reviews</div>
                    <div style={{ fontSize: '14px' }}>{lead.stars || 'N/A'} stars ({lead.reviewsCount || 0} reviews)</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={16} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Date Scraped</div>
                    <div style={{ fontSize: '14px' }}>{new Date(lead.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ExternalLink size={16} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Source</div>
                    <div style={{ fontSize: '14px' }}>Google Maps</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.01)'
        }}>
          <button 
            onClick={() => onDelete(lead.id)}
            className="btn-secondary" 
            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            <Trash2 size={18} /> Delete Lead
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => onUpdateStatus(lead.id, 'Rejected')}
              className="btn-secondary"
              style={{ color: 'var(--text-muted)' }}
            >
              <ShieldAlert size={18} /> Mark Rejected
            </button>
            <button 
              onClick={() => onUpdateStatus(lead.id, 'Qualified')}
              className="btn-primary"
            >
              <ShieldCheck size={18} /> Mark Qualified
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;
