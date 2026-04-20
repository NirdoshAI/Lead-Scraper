import React from 'react';
import { LayoutDashboard, Search, Database, Settings, LogOut, TrendingUp, X } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'search', label: 'Generate Leads', icon: Search },
    { id: 'leads', label: 'All Leads', icon: Database },
    { id: 'settings', label: 'API Settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar glass ${isOpen ? 'open' : ''}`}>
      <div style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              background: 'var(--primary)', 
              padding: '8px', 
              borderRadius: '10px',
              boxShadow: '0 0 15px var(--primary-glow)'
            }}>
              <TrendingUp size={24} color="white" />
            </div>
            <h2 style={{ fontSize: '20px', letterSpacing: '-0.5px' }}>LeadScrape</h2>
          </div>
          <button 
            className="mobile-only" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '4px' }}
          >
            <X size={24} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontWeight: isActive ? '600' : '400',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.color = 'var(--text-main)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <Icon size={20} />
                <span style={{ fontSize: '14px' }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div style={{ marginTop: 'auto', padding: '24px', borderTop: '1px solid var(--border)' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '10px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-dim)',
            cursor: 'not-allowed',
            width: '100%',
            transition: 'all 0.2s ease',
          }}
        >
          <LogOut size={20} />
          <span style={{ fontSize: '14px' }}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
