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
      console.log(`[Apify] Scraper run started. Run ID: ${runId}, Dataset ID: ${datasetId}`);

      // 2. Poll for status
      let status = runData.data.status;
      while (status === 'READY' || status === 'RUNNING') {
        setProgress(`Scraping in progress... (Status: ${status})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const statusResponse = await fetch(`${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs/${runId}?token=${apiKey}`);
        
        if (!statusResponse.ok) {
          const errorData = await statusResponse.json().catch(() => ({}));
          console.error('[Apify] Status check failed:', errorData);
          throw new Error(errorData.error?.message || `Failed to check run status (HTTP ${statusResponse.status}).`);
        }
        
        const statusData = await statusResponse.json();
        status = statusData.data.status;
        console.log(`[Apify] Polling status: ${status}`);
        
        if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
          throw new Error(`Scraper run ${status.toLowerCase()}. Check your Apify console for details.`);
        }
      }

      // 3. Fetch Results
      setProgress('Scrape finished. Fetching results...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`[Apify] Fetching dataset items from ${datasetId}...`);
      const resultsResponse = await fetch(`${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${apiKey}`);
      
      if (!resultsResponse.ok) {
        const errorData = await resultsResponse.json().catch(() => ({}));
        console.error('[Apify] Dataset fetch failed:', errorData);
        throw new Error(errorData.error?.message || `Failed to fetch results (HTTP ${resultsResponse.status}).`);
      }
      
      const items = await resultsResponse.json();
      console.log(`[Apify] Raw results fetched: ${items.length} items.`);

      // 4. Save to DB
      setProgress('Saving leads to database...');
      const searchId = await saveSearch({
        query: searchQuery,
        location: location,
        status: items.length === 0 ? 'NO_RESULTS' : 'SUCCEEDED',
        resultCount: items.length
      });

      if (items.length === 0) {
        console.warn('[Apify] No items found in the dataset.');
        setIsLoading(false);
        return { success: true, count: 0, message: 'No leads found for this search.', searchId };
      }

      const savedCount = await saveLeads(items, searchId, searchQuery);
      console.log(`[Apify] Save complete. ${savedCount} leads actually saved after filtering.`);
      
      // Update search with the accurate filtered count
      await updateSearch(searchId, { resultCount: savedCount });
      
      setProgress('Campaign complete!');
      setIsLoading(false);
      return { success: true, count: savedCount, searchId };

    } catch (err) {
      console.error('[Apify] CRITICAL PIPELINE ERROR:', err);
      setError(err.message || 'An error occurred during lead generation.');
      setIsLoading(false);
      setProgress(null);
      return { success: false, message: err.message || 'Unknown error' };
    }
  }, []);

  return { generateLeads, isLoading, error, progress };
};
