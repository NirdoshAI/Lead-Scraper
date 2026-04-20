import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardHome from './components/DashboardHome';
import SearchPage from './components/SearchPage';
import LeadsPage from './components/LeadsPage';
import SettingsPage from './components/SettingsPage';
import { getApiKey } from './db';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [currentSearchId, setCurrentSearchId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check API key periodically or when tab changes to refresh status
  const checkKey = async () => {
    const key = await getApiKey();
    setHasApiKey(!!key);
  };

  useEffect(() => {
    checkKey();
  }, [activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return <DashboardHome 
          onStartSearch={() => { setCurrentSearchId(null); handleTabChange('search'); }} 
          onViewAll={() => { setCurrentSearchId(null); handleTabChange('leads'); }} 
          onViewCampaign={(searchId) => { setCurrentSearchId(searchId); handleTabChange('leads'); }}
        />;
      case 'search': 
        return <SearchPage onComplete={(searchId) => { setCurrentSearchId(searchId); handleTabChange('leads'); }} />;
      case 'leads': 
        return <LeadsPage currentSearchId={currentSearchId} onClearSearch={() => setCurrentSearchId(null)} />;
      case 'settings': 
        return <SettingsPage />;
      default: 
        return <DashboardHome onStartSearch={() => handleTabChange('search')} />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Overview';
      case 'search': return 'Lead Generation';
      case 'leads': return 'Leads Database';
      case 'settings': return 'System Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-backdrop" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <main className="main-view">
        <Header 
          title={getTitle()} 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        
        {!hasApiKey && activeTab === 'search' && (
          <div className="content-area">
            <div className="card" style={{ 
              background: 'rgba(239, 68, 68, 0.05)', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '40px'
            }}>
              <div style={{ color: 'var(--danger)', marginBottom: '16px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              </div>
              <h3 style={{ marginBottom: '8px' }}>API Token Required</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '24px' }}>
                You need to configure your Apify API Token in the settings before you can start generating leads.
              </p>
              <button className="btn-primary" onClick={() => handleTabChange('settings')}>
                Go to Settings
              </button>
            </div>
          </div>
        )}

        {(hasApiKey || activeTab !== 'search') && renderContent()}
      </main>
    </div>
  );
}

export default App;
