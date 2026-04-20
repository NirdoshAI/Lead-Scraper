import React, { useState, useEffect } from 'react';
import { Key, Save, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { saveApiKey, getApiKey, saveWebhookUrl, getWebhookUrl } from '../db';

const SettingsPage = () => {
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, saving, success, error

  useEffect(() => {
    const loadSettings = async () => {
      const savedKey = await getApiKey();
      if (savedKey) setApiKey(savedKey);
      
      const savedWebhook = await getWebhookUrl();
      if (savedWebhook) setWebhookUrl(savedWebhook);
    };
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    
    setStatus('saving');
    try {
      if (apiKey) await saveApiKey(apiKey);
      await saveWebhookUrl(webhookUrl);
      setTimeout(() => {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      }, 800);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="content-area">
      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '12px' }}>
            <Key size={24} color="var(--primary)" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px' }}>Apify Configuration</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Enter your API token to connect your account.</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Apify API Token
            </label>
            <input
              type="password"
              placeholder="apify_api_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ width: '100%' }}
            />
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
              You can find your token in your Apify Console under Settings &gt; Integrations.
            </p>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Google Sheets Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              style={{ width: '100%' }}
            />
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
              Paste your deployed Google Apps Script Web App URL here to enable direct Google Sheets export.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={status === 'saving'}
            style={{ width: '100%' }}
          >
            {status === 'saving' ? (
              'Saving...'
            ) : status === 'success' ? (
              <><CheckCircle size={18} /> Saved Successfully</>
            ) : (
              <><Save size={18} /> Save Settings</>
            )}
          </button>
          
          {status === 'error' && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              borderRadius: '8px', 
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}>
              <AlertCircle size={18} /> Failed to save settings.
            </div>
          )}
        </form>
      </div>

      <div style={{ marginTop: '32px' }}>
        <h4 style={{ marginBottom: '16px' }}>Help & Resources</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <h5 style={{ marginBottom: '8px' }}>Official Documentation</h5>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Learn how to use the Google Maps Scraper actor.</p>
            <a href="https://apify.com/apify/google-maps-scraper" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '13px', textDecoration: 'none' }}>View Docs →</a>
          </div>
          <div className="card" style={{ padding: '16px' }}>
            <h5 style={{ marginBottom: '8px' }}>Get Free Credits</h5>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Apify offers a free tier with monthly usage credits.</p>
            <a href="https://apify.com/pricing" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '13px', textDecoration: 'none' }}>Pricing Details →</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
