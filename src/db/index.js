import Dexie from 'dexie';
import { calculateLeadScore } from '../utils/scoring';
import { mapApifyToLead } from '../utils/mapping';

const SYNONYMS = {
  'dentist': ['dentist', 'dental clinic', 'dental office', 'orthodontist', 'periodontist'],
  'real estate': ['real estate agency', 'real estate developer', 'realtor', 'property management', 'real estate consultant'],
  'restaurant': ['restaurant', 'cafe', 'diner', 'eatery', 'bistro', 'food'],
  'salon': ['salon', 'hair salon', 'beauty salon', 'barbershop', 'spa'],
  'lawyer': ['lawyer', 'attorney', 'law firm', 'legal services'],
};

const normalizeText = (text) => {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
};

const getSynonyms = (query) => {
  if (!query) return [];
  const normQuery = normalizeText(query);
  const singularQuery = normQuery.endsWith('ies') ? normQuery.slice(0, -3) + 'y' : normQuery.replace(/e?s$/, '');
  
  for (const [key, values] of Object.entries(SYNONYMS)) {
    if (key === normQuery || key === singularQuery || values.includes(normQuery) || values.includes(singularQuery)) {
      return [...values, normQuery, singularQuery];
    }
  }
  return [normQuery, singularQuery];
};

export const db = new Dexie('LeadGenDB');

db.version(3).stores({
  leads: '++id, title, city, category, rating, status, leadScore, searchId, timestamp',
  searches: '++id, query, location, status, resultCount, timestamp',
  settings: 'key, value'
}).upgrade(tx => {
  return tx.leads.toCollection().modify(lead => {
    lead.status = lead.status || 'New';
    lead.leadScore = lead.leadScore || calculateLeadScore(lead);
    
    // Normalize category
    if (!lead.category || lead.category === 'N/A' || lead.category.trim() === '') {
      lead.category = 'Unknown';
    }
  });
});

// Helper functions
export const saveLeads = async (rawLeads, searchId, searchQuery) => {
  console.log(`[DB] Preparing to save ${rawLeads.length} raw items from Apify for searchId: ${searchId}`);
  const timestamp = Date.now();
  
  try {
    const validTerms = getSynonyms(searchQuery);

    const leadsWithMetadata = rawLeads.reduce((acc, rawLead) => {
      // 1. Map Apify format to our Internal schema
      const mappedLead = mapApifyToLead(rawLead);
      
      // 2. Add metadata and normalization
      let category = mappedLead.category;
      if (!category || category === 'N/A' || String(category).trim() === '') {
        category = 'Unknown';
      }

      // 3. Strict Relevance Filtering
      const normCat = normalizeText(category);
      const normTitle = normalizeText(mappedLead.title);
      
      const isRelevant = !searchQuery || validTerms.some(term => 
        term.length > 2 && (normCat.includes(term) || normTitle.includes(term))
      );

      if (isRelevant) {
        acc.push({
          ...mappedLead,
          category,
          searchId,
          timestamp,
          status: 'New',
          leadScore: calculateLeadScore(mappedLead)
        });
      }
      return acc;
    }, []);

    console.log(`[DB] Mapping complete. Saving ${leadsWithMetadata.length} relevant leads (filtered from ${rawLeads.length}) to IndexedDB...`);
    if (leadsWithMetadata.length > 0) {
      await db.leads.bulkAdd(leadsWithMetadata);
    }
    return leadsWithMetadata.length;
  } catch (error) {
    console.error(`[DB] Error in saveLeads:`, error);
    throw new Error(`Failed to save leads to database: ${error.message}`);
  }
};

export const getAllLeads = async () => {
  return await db.leads.orderBy('timestamp').reverse().toArray();
};

export const updateLeadStatus = async (id, status) => {
  return await db.leads.update(id, { status });
};

export const deleteLead = async (id) => {
  return await db.leads.delete(id);
};

export const deleteMultipleLeads = async (ids) => {
  return await db.leads.bulkDelete(ids);
};

export const clearLeads = async () => {
  return await db.leads.clear();
};

export const saveSearch = async (searchData) => {
  console.log(`[DB] Saving search history:`, searchData);
  try {
    const id = await db.searches.add({
      ...searchData,
      timestamp: Date.now()
    });
    console.log(`[DB] Search saved with ID: ${id}`);
    return id;
  } catch (error) {
    console.error(`[DB] Error saving search:`, error);
    throw error;
  }
};

export const getSearchHistory = async () => {
  return await db.searches.orderBy('timestamp').reverse().toArray();
};

export const saveApiKey = async (apiKey) => {
  return await db.settings.put({ key: 'apify_token', value: apiKey });
};

export const getApiKey = async () => {
  const setting = await db.settings.get('apify_token');
  return setting?.value || import.meta.env?.VITE_APIFY_TOKEN || null;
};

export const getWebhookUrl = async () => {
  const setting = await db.settings.get('googleSheetsWebhookUrl');
  return setting ? setting.value : null;
};

export const saveWebhookUrl = async (url) => {
  return await db.settings.put({ key: 'googleSheetsWebhookUrl', value: url });
};

export const getLeadsBySearchId = async (searchId) => {
  return await db.leads.where('searchId').equals(searchId).reverse().sortBy('timestamp');
};

export const updateSearch = async (id, data) => {
  return await db.searches.update(id, data);
};

export const getSearchById = async (id) => {
  return await db.searches.get(id);
};
