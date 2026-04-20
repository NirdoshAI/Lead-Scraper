import React, { useState } from 'react';
import { Search, MapPin, ListOrdered, Play, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useApify } from '../hooks/useApify';

const SearchPage = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    query: '',
    location: '',
    limit: 10
  });

  const { generateLeads, isLoading, error, progress } = useApify();
  const [statusMsg, setStatusMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    const result = await generateLeads(formData.query, formData.location, formData.limit);
    
    if (result?.success) {
      if (result.count > 0) {
        setStatusMsg({ type: 'success', text: `Success! Imported ${result.count} leads for "${formData.query}".` });
        // Delay navigation to let the user see the success message
        setTimeout(() => {
          if (onComplete) onComplete(result.searchId);
        }, 2000);
      } else {
        setStatusMsg({ type: 'warning', text: result.message || 'No leads were found for this search.' });
      }
    } else if (result?.success === false) {
      setStatusMsg({ type: 'error', text: result.message || 'Failed to generate leads. Please check your API key and search parameters.' });
    }
  };

  return (
    <div className="content-area">
      <div className="card" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Launch New Campaign</h3>
          <p style={{ color: 'var(--text-muted)' }}>Specify the type of leads you want to scrape from Google Maps.</p>
        </div>

        {statusMsg && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '16px', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 
                       statusMsg.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                       'rgba(239, 68, 68, 0.1)',
            color: statusMsg.type === 'success' ? '#10b981' : 
                   statusMsg.type === 'warning' ? '#f59e0b' : 
                   '#ef4444',
            border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 
                                statusMsg.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 
                                'rgba(239, 68, 68, 0.2)'}`
          }}>
            {statusMsg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span style={{ fontWeight: '500' }}>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="search-form-grid">
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              <Search size={16} color="var(--primary)" /> Business Category / Keywords
            </label>
            <input
              required
              placeholder="e.g. Italian Restaurants, Dentists, Real Estate Agencies"
              value={formData.query}
              onChange={e => setFormData({ ...formData, query: e.target.value })}
              style={{ width: '100%', padding: '12px' }}
              disabled={isLoading}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              <MapPin size={16} color="var(--primary)" /> Target Location
            </label>
            <input
              required
              placeholder="e.g. New York, London, Tokyo"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              style={{ width: '100%', padding: '12px' }}
              disabled={isLoading}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              <ListOrdered size={16} color="var(--primary)" /> Result Limit
            </label>
            <select
              value={formData.limit}
              onChange={e => setFormData({ ...formData, limit: e.target.value })}
              style={{ width: '100%', padding: '12px' }}
              disabled={isLoading}
            >
              <option value={10}>Top 10 leads</option>
              <option value={25}>Top 25 leads</option>
              <option value={50}>Top 50 leads</option>
              <option value={100}>Top 100 leads (Slow)</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2', marginTop: '12px' }}>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isLoading}
              style={{ width: '100%', height: '48px', fontSize: '16px' }}
            >
              {isLoading ? (
                <><Loader2 className="animate-spin" size={20} /> Running Pipeline...</>
              ) : (
                <><Play size={20} /> Generate Leads</>
              )}
            </button>
          </div>
        </form>

        {isLoading && (
          <div style={{ 
            marginTop: '32px', 
            padding: '24px', 
            background: 'rgba(99, 102, 241, 0.05)', 
            borderRadius: '12px',
            border: '1px solid var(--primary-glow)',
            textAlign: 'center'
          }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ marginBottom: '4px' }}>{progress}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>This may take a few minutes depending on your parameters.</p>
          </div>
        )}

        {error && !statusMsg && (
          <div style={{ 
            marginTop: '32px', 
            padding: '16px', 
            borderRadius: '8px', 
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle size={24} />
            <div>
              <p style={{ fontWeight: '600' }}>Pipeline Failure</p>
              <p style={{ fontSize: '14px' }}>{error}</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SearchPage;
