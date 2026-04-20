import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, Search, Filter, Trash2, ExternalLink, Star, 
  ChevronUp, ChevronDown, CheckSquare, Square, Eye, 
  ShieldCheck, ShieldAlert, MoreHorizontal, X, Mail, Phone, Globe
} from 'lucide-react';
import { getAllLeads, getLeadsBySearchId, updateLeadStatus, deleteLead, deleteMultipleLeads, clearLeads, getWebhookUrl, getSearchById } from '../db';
import { getScoreColor } from '../utils/scoring';
import LeadModal from './LeadModal';

const LeadsPage = ({ currentSearchId, onClearSearch }) => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [viewingLead, setViewingLead] = useState(null);
  
  const [exportStatus, setExportStatus] = useState('idle'); // idle, exporting, success, error
  const [exportUrl, setExportUrl] = useState('');
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'All',
    category: 'All Categories',
    hasWebsite: 'All',
    hasEmail: 'All',
    minRating: 0
  });

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  useEffect(() => {
    loadLeads();
  }, [currentSearchId]);

  const loadLeads = async () => {
    setIsLoading(true);
    let data;
    if (currentSearchId) {
      data = await getLeadsBySearchId(currentSearchId);
    } else {
      data = await getAllLeads();
    }
    setLeads(data);
    setIsLoading(false);
  };

  const handleUpdateStatus = async (id, status) => {
    await updateLeadStatus(id, status);
    if (viewingLead?.id === id) setViewingLead({ ...viewingLead, status });
    await loadLeads();
  };

  const handleDeleteLead = async (id) => {
    if (window.confirm('Delete this lead?')) {
      await deleteLead(id);
      setViewingLead(null);
      await loadLeads();
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedLeads.length} leads?`)) {
      await deleteMultipleLeads(selectedLeads);
      setSelectedLeads([]);
      await loadLeads();
    }
  };

  const handleBulkStatus = async (status) => {
    for (const id of selectedLeads) {
      await updateLeadStatus(id, status);
    }
    setSelectedLeads([]);
    await loadLeads();
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const categories = useMemo(() => {
    const cats = new Set(leads.map(l => {
      const cat = l.category;
      if (!cat || cat === 'N/A' || String(cat).trim() === '') return 'Unknown';
      return cat;
    }).filter(Boolean));
    const sortedCats = Array.from(cats).sort();
    
    // Ensure 'Unknown' is in the list if there are any leads without categories
    return ['All Categories', ...sortedCats];
  }, [leads]);

  const filteredAndSortedLeads = useMemo(() => {
    let result = leads.filter(lead => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm || 
        lead.title?.toLowerCase().includes(searchTermLower) ||
        lead.city?.toLowerCase().includes(searchTermLower) ||
        lead.category?.toLowerCase().includes(searchTermLower);
      
      const matchesStatus = filters.status === 'All' || lead.status === filters.status;
      const matchesCategory = filters.category === 'All Categories' || lead.category === filters.category;
      const matchesWebsite = filters.hasWebsite === 'All' || (filters.hasWebsite === 'Yes' ? !!lead.website : !lead.website);
      const matchesEmail = filters.hasEmail === 'All' || (filters.hasEmail === 'Yes' ? !!lead.email : !lead.email);
      const matchesRating = (lead.stars || 0) >= filters.minRating;

      return matchesSearch && matchesStatus && matchesCategory && matchesWebsite && matchesEmail && matchesRating;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [leads, searchTerm, filters, sortConfig]);

  const filteredLeads = filteredAndSortedLeads;

  const handleExportGoogleSheets = async () => {
    // 10. Confirm export uses active/current campaign data
    const exportData = selectedLeads.length > 0 
      ? leads.filter(l => selectedLeads.includes(l.id))
      : filteredLeads;

    // 8. Verify leads array is not empty
    if (!exportData || exportData.length === 0) {
      alert("No leads available to export.");
      return;
    }

    const webhookUrl = await getWebhookUrl();
    if (!webhookUrl) {
      alert("Please configure your Google Sheets Webhook URL in the Settings page first.");
      return;
    }

    setExportStatus('exporting');
    setExportUrl('');

    const cleanString = (val) => {
      if (val === null || val === undefined) return '';
      return String(val).trim();
    };

    try {
      let campaignName = "Global Leads";
      let locationName = "All";
      
      if (currentSearchId) {
        const searchDoc = await getSearchById(currentSearchId);
        if (searchDoc) {
          campaignName = searchDoc.query || "Campaign";
          locationName = searchDoc.location || "Location";
        }
      }
      
      // 9. Verify campaignName is included
      console.log("Exporting campaignName:", campaignName, "locationName:", locationName);

      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '_');
      const safeCampaignName = cleanString(campaignName).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const safeLocationName = cleanString(locationName).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      
      let sheetName = `${safeCampaignName}_${safeLocationName}_${dateStr}`;
      // Clean up multiple underscores
      sheetName = sheetName.replace(/_+/g, '_').replace(/^_|_$/g, '');

      const headers = ['Business Name', 'Category', 'City', 'State', 'Phone', 'Website', 'Email', 'Rating', 'Reviews', 'Status', 'Lead Score', 'Date Added'];
      
      const rows = exportData.map(l => [
        cleanString(l.title),
        cleanString(l.category),
        cleanString(l.city),
        cleanString(l.state),
        cleanString(l.phone),
        cleanString(l.website),
        cleanString(l.email),
        cleanString(l.stars || 0),
        cleanString(l.reviewsCount || 0),
        cleanString(l.status || 'New'),
        cleanString(l.leadScore || 0),
        cleanString(new Date(l.timestamp || Date.now()).toLocaleDateString())
      ]);

      const payload = {
        sheetName: sheetName,
        headers: headers,
        rows: rows,
        campaignName: campaignName // ensure we send it if useful
      };

      // 3. Log the exact payload before sending
      console.log("Google Sheets Webhook Payload:", JSON.stringify(payload, null, 2));

      const cleanUrl = webhookUrl.trim();
      
      // 2. Send the request
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });

      // 4. Log response status and raw response text
      console.log("Webhook Response Status:", response.status, response.statusText);
      const rawResponseText = await response.text();
      console.log("Webhook Raw Response:", rawResponseText);

      // 5. Do not assume response.json() succeeds unless verified
      let result;
      try {
        result = JSON.parse(rawResponseText);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        throw new Error(`Invalid JSON response from webhook. Status: ${response.status}. Raw: ${rawResponseText.substring(0, 150)}...`);
      }

      if (result.status === 'success' || result.result === 'success' || result.success === true) {
        setExportStatus('success');
        setExportUrl(result.url || '');
      } else {
        throw new Error(result.message || `Export failed. Webhook returned: ${JSON.stringify(result)}`);
      }
      
    } catch (error) {
      console.error("Export error:", error);
      // 6. Surface the real error in the UI
      alert(`Export Error:\n\n${error.message}`);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 5000);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Qualified': return 'badge-success';
      case 'Rejected': return 'badge-danger';
      case 'New': return 'badge-new';
      default: return 'badge-pending';
    }
  };

  return (
    <div className="content-area">
      {/* Campaign Banner */}
      {currentSearchId && (
        <div style={{ marginBottom: '24px', padding: '16px 20px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-new">Active Campaign</span> Results
            </h4>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Showing only leads from your recent search. Older leads from other campaigns are hidden.</p>
          </div>
          <button onClick={onClearSearch} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>View All Leads</button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div className="filters-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              placeholder="Search leads, cities, or categories..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px', width: '100%', marginBottom: '0' }} 
            />
          </div>
          
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} style={{ minWidth: '130px' }}>
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Qualified">Qualified</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})} style={{ minWidth: '150px' }}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select value={filters.hasWebsite} onChange={e => setFilters({...filters, hasWebsite: e.target.value})} style={{ minWidth: '140px' }}>
            <option value="All">Any Website</option>
            <option value="Yes">Has Website</option>
            <option value="No">No Website</option>
          </select>

          <button onClick={() => {
            setFilters({ status: 'All', category: 'All Categories', hasWebsite: 'All', hasEmail: 'All', minRating: 0 });
            setSearchTerm('');
            setSortConfig({ key: 'timestamp', direction: 'desc' });
          }} className="btn-secondary" style={{ padding: '8px 12px' }} title="Clear Filters">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
          <div>
            <span style={{ fontWeight: '600' }}>{filteredLeads.length} Results</span>
            {selectedLeads.length > 0 && (
              <span style={{ marginLeft: '12px', color: 'var(--primary)', fontSize: '13px' }}>
                {selectedLeads.length} leads selected
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {exportStatus === 'success' && exportUrl && (
              <a href={exportUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: 'var(--success)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckSquare size={14} /> View Sheet
              </a>
            )}
            {exportStatus === 'error' && (
              <span style={{ fontSize: '13px', color: 'var(--danger)' }}>Export Failed</span>
            )}
            <button 
              onClick={handleExportGoogleSheets} 
              className="btn-primary" 
              style={{ fontSize: '13px', padding: '8px 16px' }}
              disabled={exportStatus === 'exporting'}
            >
              {exportStatus === 'exporting' ? 'Exporting...' : <><ExternalLink size={14} /> Export to Sheets</>}
            </button>
          </div>
        </div>

        <div className="table-container desktop-only">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface-card)' }}>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 20px', width: '40px' }}>
                  <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}>
                    {selectedLeads.length === filteredLeads.length ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th onClick={() => handleSort('title')} className="sortable" style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-dim)' }}>
                  Business {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </th>
                <th onClick={() => handleSort('category')} className="sortable" style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-dim)' }}>Category</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-dim)' }}>Location</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-dim)' }}>Contact</th>
                <th onClick={() => handleSort('stars')} className="sortable" style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-dim)' }}>Rating</th>
                <th onClick={() => handleSort('status')} className="sortable" style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-dim)' }}>Status</th>
                <th onClick={() => handleSort('leadScore')} className="sortable" style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-dim)' }}>Lead Score</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--text-dim)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="9" style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading leads...</td></tr>
              ) : filteredLeads.length === 0 ? (
                <tr><td colSpan="9" style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>No leads matching your criteria.</td></tr>
              ) : filteredLeads.map((lead) => (
                <tr key={lead.id} className={selectedLeads.includes(lead.id) ? 'selected' : ''} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s ease' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <button onClick={() => toggleSelect(lead.id)} style={{ background: 'none', border: 'none', color: lead.status === 'Qualified' ? 'var(--success)' : 'var(--text-dim)', cursor: 'pointer', padding: 0 }}>
                      {selectedLeads.includes(lead.id) ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} />}
                    </button>
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: '500' }}>
                    <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.title}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{lead.category || 'N/A'}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-dim)' }}>
                    {lead.city}, {lead.state || ''}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {lead.phone && <Phone size={14} style={{ opacity: 0.6 }} />}
                      {lead.website && <Globe size={14} style={{ opacity: 0.6 }} color="var(--primary)" />}
                      {lead.email && <Mail size={14} style={{ opacity: 0.6 }} color="var(--success)" />}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <span>{lead.stars || '0'}</span>
                      <span style={{ opacity: 0.4, fontSize: '11px' }}>({lead.reviewsCount || 0})</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`badge ${getStatusBadgeClass(lead.status)}`}>{lead.status}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '40px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${lead.leadScore || 0}%`, height: '100%', background: getScoreColor(lead.leadScore) }}></div>
                      </div>
                      <span style={{ fontWeight: '600', color: getScoreColor(lead.leadScore) }}>{lead.leadScore || 0}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                      <button onClick={() => setViewingLead(lead)} className="btn-secondary" style={{ padding: '6px', minWidth: 'auto' }} title="View">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleUpdateStatus(lead.id, 'Qualified')} className="btn-secondary" style={{ padding: '6px', minWidth: 'auto', color: 'var(--success)' }} title="Qualify">
                        <ShieldCheck size={16} />
                      </button>
                      <button onClick={() => handleDeleteLead(lead.id)} className="btn-secondary" style={{ padding: '6px', minWidth: 'auto', color: 'var(--danger)' }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-only" style={{ padding: '16px', background: 'var(--background)' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No leads matching your criteria.</div>
          ) : (
            filteredLeads.map(lead => (
              <div key={lead.id} className="mobile-lead-card">
                <div className="lead-header">
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <button onClick={() => toggleSelect(lead.id)} style={{ background: 'none', border: 'none', color: lead.status === 'Qualified' ? 'var(--success)' : 'var(--text-dim)', cursor: 'pointer', padding: 0, marginTop: '2px' }}>
                      {selectedLeads.includes(lead.id) ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} />}
                    </button>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-main)', marginBottom: '4px' }}>{lead.title}</div>
                      <span className={`badge ${getStatusBadgeClass(lead.status)}`}>{lead.status}</span>
                    </div>
                  </div>
                </div>
                <div className="lead-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Category:</span>
                    <span style={{ color: 'var(--text-main)' }}>{lead.category || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Location:</span>
                    <span style={{ color: 'var(--text-main)' }}>{lead.city}, {lead.state || ''}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Contact:</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {lead.phone && <Phone size={14} style={{ opacity: 0.8 }} />}
                      {lead.website && <Globe size={14} style={{ opacity: 0.8 }} color="var(--primary)" />}
                      {lead.email && <Mail size={14} style={{ opacity: 0.8 }} color="var(--success)" />}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Rating:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <span style={{ color: 'var(--text-main)' }}>{lead.stars || '0'}</span>
                      <span style={{ opacity: 0.6, fontSize: '12px' }}>({lead.reviewsCount || 0})</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Score:</span>
                    <span style={{ fontWeight: '600', color: getScoreColor(lead.leadScore) }}>{lead.leadScore || 0}</span>
                  </div>
                </div>
                <div className="lead-actions">
                  <button onClick={() => setViewingLead(lead)} className="btn-secondary" style={{ padding: '8px', flex: 1, display: 'flex', justifyContent: 'center' }} title="View">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => handleUpdateStatus(lead.id, 'Qualified')} className="btn-secondary" style={{ padding: '8px', flex: 1, color: 'var(--success)', display: 'flex', justifyContent: 'center' }} title="Qualify">
                    <ShieldCheck size={16} />
                  </button>
                  <button onClick={() => handleDeleteLead(lead.id)} className="btn-secondary" style={{ padding: '8px', flex: 1, color: 'var(--danger)', display: 'flex', justifyContent: 'center' }} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Bulk Actions Toolbar */}
      {selectedLeads.length > 0 && (
        <div className="sticky-toolbar">
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{selectedLeads.length} leads selected</span>
          <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <button onClick={() => handleBulkStatus('Qualified')} className="btn-primary" style={{ padding: '6px 16px', fontSize: '13px' }}>
            <ShieldCheck size={16} /> Mark Qualified
          </button>
          <button onClick={() => handleBulkStatus('Rejected')} className="btn-secondary" style={{ padding: '6px 16px', fontSize: '13px' }}>
            <ShieldAlert size={16} /> Mark Rejected
          </button>
          <button onClick={handleBulkDelete} className="btn-secondary" style={{ padding: '6px 16px', fontSize: '13px', color: 'var(--danger)' }}>
            <Trash2 size={16} /> Delete
          </button>
          <button onClick={() => setSelectedLeads([])} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {viewingLead && (
        <LeadModal 
          lead={viewingLead} 
          onClose={() => setViewingLead(null)} 
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteLead}
        />
      )}
    </div>
  );
};

export default LeadsPage;
