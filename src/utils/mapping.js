/**
 * Maps raw Apify dataset items to the Lead schema used by the application.
 */
export const mapApifyToLead = (item) => {
  // Extract city and state from address string if possible
  // Typical format: "123 Main St, New York, NY 10001, United States"
  const address = item.address || item.fullAddress || '';
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

  // Handle various Apify Actor field variations
  const title = item.title || item.name || item.biz_name || 'Untitled Business';
  const category = item.categoryName || item.subTitle || item.type || (item.categories && item.categories[0]) || 'Unknown';

  return {
    title: title,
    category: category,
    address: address,
    city: item.city || city,
    state: item.state || state,
    phone: item.phone || item.phoneNumber || '',
    website: item.website || item.url || '',
    email: item.email || '', // Enrichment might provide this
    stars: item.rating || item.stars || 0,
    reviewsCount: item.reviewsCount || item.reviewCount || 0,
    url: item.url || item.googleMapsUrl || '',
    placeId: item.placeId || item.id || '',
    lat: item.location?.lat || item.latitude,
    lng: item.location?.lng || item.longitude,
  };
};

export const mapApifyCollection = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(mapApifyToLead);
};
