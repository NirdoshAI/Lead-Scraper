import React from 'react';
import { Menu, User } from 'lucide-react';

const Header = ({ title, onMenuToggle }) => {
  return (
    <header style={{ 
      padding: '24px 32px', 
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(5, 5, 5, 0.4)',
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          className="mobile-only btn-secondary" 
          onClick={onMenuToggle}
          style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Menu size={20} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-main)' }}>{title}</h1>
      </div>
    </header>
  );
};

export default Header;
