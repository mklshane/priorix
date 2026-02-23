/**
 * Assess the difficulty of a flashcard with local deterministic heuristics.
 * Returns a score from 1-10.
 */
export async function assessCardDifficulty(
  term: string,
  definition: string
): Promise<number> {
  return scoreDifficulty(term, definition);
}

/**
 * Assess difficulty for multiple flashcards in batch.
 */
export async function assessCardDifficultyBatch(
  cards: Array<{ term: string; definition: string }>
): Promise<number[]> {
  return cards.map((card) => scoreDifficulty(card.term, card.definition));
}

/**
 * Generate topic tags for a flashcard using simple keyword heuristics.
 */
export async function generateTopicTags(
  term: string,
  definition: string
): Promise<string[]> {
  const text = `${term} ${definition}`.toLowerCase();
  const tags = new Set<string>();

  if (/\b(cell|organism|ecosystem|genetics|evolution|anatomy)\b/.test(text)) tags.add("biology");
  if (/\b(atom|energy|force|motion|quantum|thermodynamics)\b/.test(text)) tags.add("physics");
  if (/\b(reaction|molecule|compound|acid|base|periodic)\b/.test(text)) tags.add("chemistry");
  if (/\b(equation|theorem|algebra|geometry|calculus|probability)\b/.test(text)) tags.add("mathematics");
  if (/\b(code|algorithm|programming|database|network|software)\b/.test(text)) tags.add("computer science");
  if (/\b(revolution|empire|war|century|civilization|treaty)\b/.test(text)) tags.add("history");
  if (/\b(grammar|poetry|novel|literature|rhetoric|linguistics)\b/.test(text)) tags.add("literature");
  if (/\b(market|inflation|gdp|supply|demand|economy)\b/.test(text)) tags.add("economics");
  if (/\b(government|democracy|policy|constitution|election|state)\b/.test(text)) tags.add("politics");

  const result = Array.from(tags).slice(0, 4);
  return result.length > 0 ? result : ["general"];
}

function scoreDifficulty(term: string, definition: string): number {
  const normalizedTerm = term.trim();
  const normalizedDefinition = definition.trim();
  const text = `${normalizedTerm} ${normalizedDefinition}`.trim();

  if (!text) return 5;

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const longWordCount = text
    .split(/\s+/)
    .filter((word) => word.replace(/[^a-zA-Z]/g, "").length >= 10).length;

  const complexitySignals = [
    /\b(theorem|paradigm|synthesis|interdependence|metacognition)\b/i,
    /\b(photosynthesis|electromagnetic|stoichiometry|differentiation)\b/i,
    /\b(hypothesis|methodology|epistemology|algorithmic)\b/i,
  ];

  const signalHits = complexitySignals.reduce(
    (count, pattern) => (pattern.test(text) ? count + 1 : count),
    0
  );

  let score = 1;

  if (wordCount > 10) score += 1;
  if (wordCount > 22) score += 1;
  if (wordCount > 40) score += 1;
  if (wordCount > 70) score += 1;

  if (longWordCount >= 2) score += 1;
  if (longWordCount >= 5) score += 1;

  score += signalHits;

  if (score < 1) return 1;
  if (score > 10) return 10;
  return score;
}
