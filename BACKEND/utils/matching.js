// Simple weighted matching algorithm — no ML, just keyword/text heuristics.
// Weights: category 25, description 35, location 25, time 15 (total 100)

const STOPWORDS = new Set([
  "a", "an", "the", "is", "was", "were", "with", "and", "or", "of", "in",
  "on", "at", "near", "it", "its", "has", "have", "had", "to", "for",
  "found", "lost", "item", "my", "i", "this", "that", "black", "white",
]);

function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

function jaccardSimilarity(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  if (a.size === 0 && b.size === 0) return 0;
  const intersection = [...a].filter((w) => b.has(w)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function normalizeLocation(loc = "") {
  return loc.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
}

function scoreCategory(lost, found) {
  if (lost.category === found.category) return 25;
  return 0;
}

function scoreDescription(lost, found) {
  // Combine name + description tokens for a richer comparison.
  const lostTokens = tokenize(`${lost.name} ${lost.description}`);
  const foundTokens = tokenize(`${found.name} ${found.description}`);
  const similarity = jaccardSimilarity(lostTokens, foundTokens);
  return Math.round(similarity * 35);
}

function scoreLocation(lost, found) {
  const l1 = normalizeLocation(lost.location);
  const l2 = normalizeLocation(found.location);
  if (!l1 || !l2) return 0;
  if (l1 === l2) return 25;

  // Partial match: shared significant words (e.g. "Library 2nd floor" vs "Library")
  const t1 = new Set(l1.split(/\s+/).filter((w) => w.length > 2));
  const t2 = new Set(l2.split(/\s+/).filter((w) => w.length > 2));
  const overlap = [...t1].filter((w) => t2.has(w)).length;
  if (overlap > 0) return 15;
  return 0;
}

function scoreTime(lost, found) {
  try {
    const lostDateTime = new Date(`${lost.date}T${lost.time}`);
    const foundDateTime = new Date(`${found.date}T${found.time}`);
    if (isNaN(lostDateTime) || isNaN(foundDateTime)) return 0;

    const diffHours = Math.abs(foundDateTime - lostDateTime) / (1000 * 60 * 60);

    if (diffHours <= 1) return 15;
    if (diffHours <= 6) return 12;
    if (diffHours <= 24) return 8;
    if (diffHours <= 72) return 4;
    return 0;
  } catch {
    return 0;
  }
}

function buildReasons({ categoryScore, descriptionScore, locationScore, timeScore, lost, found }) {
  const reasons = [];

  if (categoryScore === 25) reasons.push(`Same category (${lost.category})`);

  if (descriptionScore >= 25) reasons.push("Strong description match");
  else if (descriptionScore >= 10) reasons.push("Similar description");

  if (locationScore === 25) reasons.push(`Same location (${lost.location})`);
  else if (locationScore >= 15) reasons.push("Nearby location");

  if (timeScore >= 12) {
    reasons.push("Reported close in time");
  } else if (timeScore >= 4) {
    reasons.push("Reported within a few days of each other");
  }

  return reasons;
}

/**
 * Compute a match score (0-100) and explanation between a LOST and FOUND item.
 * Both items are expected to be plain objects / mongoose docs with:
 * category, name, description, location, date, time
 */
export function computeMatch(lostItem, foundItem) {
  const categoryScore = scoreCategory(lostItem, foundItem);
  const descriptionScore = scoreDescription(lostItem, foundItem);
  const locationScore = scoreLocation(lostItem, foundItem);
  const timeScore = scoreTime(lostItem, foundItem);

  const total = categoryScore + descriptionScore + locationScore + timeScore;

  const matchingReasons = buildReasons({
    categoryScore,
    descriptionScore,
    locationScore,
    timeScore,
    lost: lostItem,
    found: foundItem,
  });

  return {
    score: total,
    breakdown: {
      category: categoryScore,
      description: descriptionScore,
      location: locationScore,
      time: timeScore,
    },
    matchingReasons,
  };
}

// Only surface matches at/above this confidence to keep results demo-clean.
export const MATCH_THRESHOLD = 70;