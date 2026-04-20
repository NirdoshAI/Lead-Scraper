/**
 * Calculates a lead score from 0-100 based on how "easy" or "needy" a client is.
 * Focuses on businesses with weak online presence but enough activity to be viable.
 */
export const calculateLeadScore = (lead) => {
  let score = 50; // Start at midpoint

  const rating = lead.stars || 0;
  const reviews = lead.reviewsCount || 0;
  const hasWebsite = !!lead.website;
  const hasEmail = !!lead.email;

  // 1. Rating Scoring (3.0 - 4.2 is the "Sweet Spot")
  if (rating >= 3.0 && rating <= 4.2) {
    score += 20;
  } else if (rating > 4.2 && rating <= 4.5) {
    score += 5;
  } else if (rating > 4.5) {
    score -= 15; // Too good, probably doesn't need much help
  } else if (rating > 0 && rating < 2.5) {
    score -= 20; // Potential "bad" client
  } else if (rating === 0) {
    score -= 30; // No rating = too risky or brand new
  }

  // 2. Reviews Scoring (5 - 50 is the "Sweet Spot")
  if (reviews >= 5 && reviews <= 50) {
    score += 20;
  } else if (reviews > 50 && reviews <= 100) {
    score += 5;
  } else if (reviews > 100) {
    score -= 15; // Established online
  } else if (reviews === 0) {
    score -= 30; // Zero reviews = hard to verify
  } else if (reviews > 0 && reviews < 5) {
    score += 5;
  }

  // 3. Website & Email Presence (Missing = Opportunity)
  if (!hasWebsite) {
    score += 25; // Big opportunity (GMB optimization + site build)
  }
  
  if (!hasEmail) {
    score += 10; // Opportunity for outreach setup
  }

  // Clamp score between 0 and 100
  return Math.min(100, Math.max(0, score));
};

export const getScoreColor = (score) => {
  if (score >= 80) return '#10b981'; // Green (High Priority)
  if (score >= 60) return '#f59e0b'; // Orange (Medium Priority)
  return '#ef4444'; // Red (Low Priority)
};

export const getScoreLabel = (score) => {
  if (score >= 80) return 'High Priority';
  if (score >= 60) return 'Medium Priority';
  return 'Low Priority';
};
