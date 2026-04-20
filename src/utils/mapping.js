/**
 * Maps raw Apify dataset items to the Lead schema used by the application.
 */
export const mapApifyToLead = (item) => {
  // Extract city and state from address string if possible
  // Typical format: "123 Main St, New York, NY 10001, United States"
  const address = item.address || '';
  const parts = address.split(',').map(p => p.trim());
  
  let city = 'Unknown';
  let state = '';
  
  if (parts.length >= 3) {
    // Usually [Street, City, State ZIP, Country]
    city = parts[parts.length - 3];
    const stateZip = parts[parts.length - 2];
    state = stateZip.split(' ')[0]; // Extract "NY" from "NY 10001"
  } else if (parts.length === 2) {
    city = parts[0];
    state = parts[1];
  }

  return {
    title: item.title || 'Untitled Business',
    category: item.categoryName || item.subTitle || 'Unknown',
    address: item.address || '',
    city: city,
    state: state,
    phone: item.phone || '',
    website: item.website || '',
    email: item.email || '', // Enrichment might provide this
    stars: item.rating || 0,
    reviewsCount: item.reviewCount || 0,
    url: item.url || '',
    placeId: item.placeId || '',
    lat: item.location?.lat,
    lng: item.location?.lng,
  };
};

export const mapApifyCollection = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(mapApifyToLead);
};
