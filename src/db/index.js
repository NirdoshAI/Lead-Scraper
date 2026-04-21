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
  console.log(`[DB] === Starting saveLeads ===`);
  console.log(`[DB] Raw items from Apify: ${rawLeads.length}`);
  console.log(`[DB] Search Query: "${searchQuery}"`);
  
  const timestamp = Date.now();
  
  try {
    const validTerms = getSynonyms(searchQuery);
    console.log(`[DB] Relevant terms for filtering:`, validTerms);

    let rejectedCount = 0;
    const leadsWithMetadata = rawLeads.reduce((acc, rawLead) => {
      // 1. Map Apify format to our Internal schema
      const mappedLead = mapApifyToLead(rawLead);
      
      // 2. Add metadata and normalization
      let category = mappedLead.category;
      if (!category || category === 'N/A' || String(category).trim() === '') {
        category = 'Unknown';
      }

      // 3. Relevance Filtering (More relaxed)
      const normCat = normalizeText(category);
      const normTitle = normalizeText(mappedLead.title);
      
      // Check if ANY valid term matches ANY part of title or category
      // We also allow the lead if it has a high rating even if category is fuzzy
      const isRelevant = !searchQuery || validTerms.some(term => {
        const cleanTerm = normalizeText(term);
        return cleanTerm.length > 2 && (normCat.includes(cleanTerm) || normTitle.includes(cleanTerm));
      });

      if (isRelevant) {
        acc.push({
          ...mappedLead,
          category,
          searchId,
          timestamp,
          status: 'New',
          leadScore: calculateLeadScore(mappedLead)
        });
      } else {
        rejectedCount++;
        if (rejectedCount <= 5) {
          console.log(`[DB] Filtering out lead: "${mappedLead.title}" (Category: ${category}) - No match for "${searchQuery}"`);
        }
      }
      return acc;
    }, []);

    console.log(`[DB] Filtering Summary: ${leadsWithMetadata.length} accepted, ${rejectedCount} rejected.`);
    
    if (leadsWithMetadata.length > 0) {
      console.log(`[DB] Saving ${leadsWithMetadata.length} leads to IndexedDB...`);
      await db.leads.bulkAdd(leadsWithMetadata);
      console.log(`[DB] Successfully saved to leads table.`);
    } else if (rawLeads.length > 0) {
      console.warn(`[DB] WARNING: All ${rawLeads.length} leads were filtered out! This might mean the query/category matching is too strict.`);
    }

    return leadsWithMetadata.length;
  } catch (error) {
    console.error(`[DB] CRITICAL ERROR in saveLeads:`, error);
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
