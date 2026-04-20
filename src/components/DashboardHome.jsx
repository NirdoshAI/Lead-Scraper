import React, { useState, useEffect } from 'react';
import { Database, Zap, Clock, Users, ArrowUpRight, Plus } from 'lucide-react';
import { getAllLeads, getSearchHistory } from '../db';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
    <div>
      <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '8px' }}>{title}</p>
      <h3 style={{ fontSize: '28px' }}>{value}</h3>
    </div>
    <div style={{ background: `rgba(${color}, 0.1)`, padding: '10px', borderRadius: '12px' }}>
      <Icon size={24} style={{ color: `rgb(${color})` }} />
    </div>
  </div>
);

const DashboardHome = ({ onStartSearch, onViewAll, onViewCampaign }) => {
  const [stats, setStats] = useState({ totalLeads: 0, totalSearches: 0, lastRun: 'N/A' });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      const leads = await getAllLeads();
      const searches = await getSearchHistory();
      
      setStats({
        totalLeads: leads.length,
        totalSearches: searches.length,
        lastRun: searches.length > 0 ? new Date(searches[0].timestamp).toLocaleDateString() : 'Never'
      });
      setHistory(searches.slice(0, 5));
    };
    loadStats();
  }, []);

  return (
    <div className="content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>Welcome back, Admin</h2>
          <p style={{ color: 'var(--text-muted)' }}>Here's what's happening with your lead generation campaigns.</p>
        </div>
        <button className="btn-primary" onClick={onStartSearch}>
          <Plus size={20} /> New Campaign
        </button>
      </div>

      <div className="dashboard-stats-grid">
        <StatCard title="Total Leads" value={stats.totalLeads} icon={Users} color="99, 102, 241" />
        <StatCard title="Campaigns Run" value={stats.totalSearches} icon={Zap} color="16, 185, 129" />
        <StatCard title="Last Activity" value={stats.lastRun} icon={Clock} color="245, 158, 11" />
      </div>

      <div className="dashboard-content-grid">
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '16px' }}>Recent Campaigns</h4>
            <button onClick={onViewAll} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ padding: '8px' }}>
            {history.length === 0 ? (
              <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)' }}>No recent activity found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <tbody>
                  {history.map((run, i) => (
                    <tr 
                      key={i} 
                      onClick={() => onViewCampaign && onViewCampaign(run.id)}
                      style={{ 
                        borderBottom: i === history.length -1 ? 'none' : '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '500' }}>{run.query}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{run.location}</div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                        {run.resultCount} leads
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <span className="badge badge-success">Success</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <h4 style={{ fontSize: '16px', marginBottom: '20px' }}>Quick Tips</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ color: 'var(--primary)' }}><ArrowUpRight size={18} /></div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Specific categories (e.g. "Software Companies") yield better results than broad ones.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ color: 'var(--primary)' }}><ArrowUpRight size={18} /></div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Increase the result limit in settings for larger cities.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ color: 'var(--primary)' }}><ArrowUpRight size={18} /></div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Always check your Apify usage to avoid hitting monthly limits.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
