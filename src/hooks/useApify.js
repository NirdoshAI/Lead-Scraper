import { useState, useCallback } from 'react';
import { getApiKey, saveLeads, saveSearch, updateSearch } from '../db';

const APIFY_BASE_URL = '/api-apify/v2';
const ACTOR_ID = 'compass~crawler-google-places';

export const useApify = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  const generateLeads = useCallback(async (searchQuery, location, maxResults = 10) => {
    setIsLoading(true);
    setError(null);
    setProgress('Starting scraper...');

    try {
      const rawKey = await getApiKey();
      const apiKey = rawKey ? rawKey.trim() : null;
      if (!apiKey) throw new Error('API Key not found or empty. Please set a valid Apify token in Settings.');

      // 1. Start the Actor Run
      const input = {
        searchStringsArray: [`${searchQuery} in ${location}`],
        maxCrawledPlacesPerSearch: parseInt(maxResults),
        proxyConfig: { useApifyProxy: true }
      };

      const runResponse = await fetch(`${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs?token=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      if (!runResponse.ok) {
        const errorData = await runResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to start scraper run. Please check your API key and account balance.');
      }
      
      const runData = await runResponse.json();
      const runId = runData.data.id;
      const datasetId = runData.data.defaultDatasetId;
      console.log('Scraper run started. Run ID:', runId);

      // 2. Poll for status
      let status = runData.data.status;
      while (status === 'READY' || status === 'RUNNING') {
        setProgress('Scraping in progress...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Increased interval
        
        const statusResponse = await fetch(`${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs/${runId}?token=${apiKey}`);
        console.log('Polling status. Response status:', statusResponse.status);
        
        if (!statusResponse.ok) {
          const errorData = await statusResponse.json().catch(() => ({}));
          console.error('Status check failed:', errorData);
          throw new Error(errorData.error?.message || `Failed to check run status (HTTP ${statusResponse.status}).`);
        }
        
        const statusData = await statusResponse.json();
        status = statusData.data.status;
        console.log('Current run status:', status);
        
        if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
          throw new Error(`Scraper run ${status.toLowerCase()}.`);
        }
      }

      // 3. Fetch Results
      setProgress('Fetching results...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Sync delay
      
      console.log('Fetching dataset items. Dataset ID:', datasetId);
      const resultsResponse = await fetch(`${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${apiKey}`);
      console.log('Dataset fetch status:', resultsResponse.status);

      if (!resultsResponse.ok) {
        const errorData = await resultsResponse.json().catch(() => ({}));
        console.error('Dataset fetch failed:', errorData);
        throw new Error(errorData.error?.message || `Failed to fetch results from dataset (HTTP ${resultsResponse.status}).`);
      }
      
      const items = await resultsResponse.json();
      console.log(`[Apify] Successfully fetched ${items.length} items from dataset.`);

      if (items.length === 0) {
        console.warn('[Apify] Dataset fetch returned 0 items.');
        setIsLoading(false);
        return { success: true, count: 0, message: 'No leads found for this search.' };
      }

      // 4. Save to DB
      setProgress('Saving to database...');
      const searchId = await saveSearch({
        query: searchQuery,
        location: location,
        status: 'SUCCEEDED',
        resultCount: items.length // Will update later
      });

      const savedCount = await saveLeads(items, searchId, searchQuery);
      console.log(`[Apify] Successfully saved ${savedCount} leads to DB.`);
      
      // Update search with the accurate filtered count
      await updateSearch(searchId, { resultCount: savedCount });
      
      setProgress('Complete!');
      setIsLoading(false);
      return { success: true, count: savedCount, searchId };

    } catch (err) {
      console.error('[Apify] Pipeline Error:', err);
      setError(err.message || 'An error occurred during lead generation.');
      setIsLoading(false);
      setProgress(null);
      return { success: false, message: err.message || 'Unknown error' };
    }
  }, []);

  return { generateLeads, isLoading, error, progress };
};
