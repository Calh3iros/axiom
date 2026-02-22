/**
 * Local AI Detection Heuristic Engine
 *
 * Analyzes text across 8 independent signals that correlate with AI-generated content.
 * Each signal returns a score from 0-1 (0 = very human, 1 = very AI).
 * The final score is a weighted average capped at 100%.
 *
 * Based on research on statistical patterns in LLM outputs:
 * - Uniform sentence length (low burstiness)
 * - Overuse of transition/hedge words
 * - Low vocabulary richness (type-token ratio)
 * - Repetitive sentence starters
 * - Uniform paragraph lengths
 * - Excessive passive voice
 * - Low punctuation diversity
 * - Predictable sentence complexity patterns
 */

// ─── Common AI transition words & phrases ───────────────────────────────────
const AI_TRANSITIONS = new Set([
  'furthermore', 'moreover', 'additionally', 'consequently', 'nevertheless',
  'nonetheless', 'subsequently', 'henceforth', 'thereby', 'thus',
  'hence', 'accordingly', 'likewise', 'similarly', 'conversely',
  'in conclusion', 'in summary', 'to summarize', 'in essence',
  'it is worth noting', 'it is important to note', 'it should be noted',
  'in other words', 'that being said', 'on the other hand',
  'as a result', 'for instance', 'for example', 'in particular',
  'in addition', 'as such', 'to that end', 'in light of',
  'with regard to', 'in terms of', 'by and large', 'all in all',
]);

const AI_HEDGE_PHRASES = new Set([
  'it is important to', 'it is worth', 'it is essential',
  'it is crucial', 'it is significant', 'it is noteworthy',
  'it is evident', 'it is clear', 'it is apparent',
  'plays a crucial role', 'plays an important role', 'plays a vital role',
  'serves as a', 'acts as a', 'functions as a',
  'a wide range of', 'a variety of', 'a multitude of',
  'in today\'s world', 'in the modern era', 'in contemporary society',
  'has become increasingly', 'continues to evolve', 'remains a key',
  'cannot be overstated', 'cannot be understated',
  'delve into', 'delve deeper', 'dive into', 'dive deeper',
  'crucial aspect', 'pivotal role', 'integral part',
  'landscape', 'paradigm', 'holistic', 'synergy',
  'leverage', 'utilize', 'facilitate', 'encompass',
]);

// ─── Utility helpers ────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñ\s'-]/gi, ' ').split(/\s+/).filter(w => w.length > 0);
}

function getSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 3);
}

function getParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).filter(p => p.trim().length > 10);
}

function stddev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

function coeffOfVariation(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  if (mean === 0) return 0;
  return stddev(nums) / mean;
}

// ─── Signal 1: Sentence Length Uniformity (Burstiness) ──────────────────────
// AI writes sentences of very similar length. Humans are "bursty" — mixing
// short punchy sentences with long complex ones.
function scoreBurstiness(text: string): number {
  const sentences = getSentences(text);
  if (sentences.length < 3) return 0.5; // Not enough data

  const lengths = sentences.map(s => tokenize(s).length);
  const cv = coeffOfVariation(lengths);

  // Human text typically has CV > 0.5, AI text < 0.3
  // cv 0.15 → 0.9 (very AI), cv 0.6 → 0.1 (very human)
  const score = Math.max(0, Math.min(1, 1 - (cv - 0.15) / 0.5));
  return score;
}

// ─── Signal 2: Transition Word Density ──────────────────────────────────────
// AI overuses formal transition words. Humans use them sparingly.
function scoreTransitionDensity(text: string): number {
  const lower = text.toLowerCase();
  const words = tokenize(text);
  if (words.length < 10) return 0.5;

  let hits = 0;
  for (const phrase of AI_TRANSITIONS) {
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) hits += matches.length;
  }

  const density = hits / (words.length / 100); // hits per 100 words
  // Human: ~0.5-1.5 per 100 words, AI: 3-6+ per 100 words
  const score = Math.max(0, Math.min(1, (density - 0.5) / 4));
  return score;
}

// ─── Signal 3: Hedge/Filler Phrase Density ──────────────────────────────────
// AI loves phrases like "It is important to note", "plays a crucial role", etc.
function scoreHedgeDensity(text: string): number {
  const lower = text.toLowerCase();
  const words = tokenize(text);
  if (words.length < 10) return 0.5;

  let hits = 0;
  for (const phrase of AI_HEDGE_PHRASES) {
    if (lower.includes(phrase)) hits++;
  }

  const density = hits / (words.length / 100);
  // Human: ~0-0.5, AI: 1.5-4+
  const score = Math.max(0, Math.min(1, density / 3));
  return score;
}

// ─── Signal 4: Vocabulary Richness (Type-Token Ratio) ───────────────────────
// AI uses a narrower vocabulary relative to text length.
function scoreVocabRichness(text: string): number {
  const words = tokenize(text);
  if (words.length < 20) return 0.5;

  const unique = new Set(words);
  // Use a corrected TTR (Guiraud's Index = unique / sqrt(total))
  const guiraud = unique.size / Math.sqrt(words.length);

  // Human text: Guiraud ~7-12, AI text: ~5-7
  // Low Guiraud = more AI-like
  const score = Math.max(0, Math.min(1, 1 - (guiraud - 4) / 7));
  return score;
}

// ─── Signal 5: Repetitive Sentence Starters ─────────────────────────────────
// AI often starts consecutive sentences with the same word/pattern.
function scoreRepetitiveStarters(text: string): number {
  const sentences = getSentences(text);
  if (sentences.length < 4) return 0.5;

  const starters = sentences.map(s => {
    const words = tokenize(s);
    return words.slice(0, 2).join(' '); // First 2 words
  });

  const starterCounts = new Map<string, number>();
  for (const s of starters) {
    starterCounts.set(s, (starterCounts.get(s) || 0) + 1);
  }

  const maxRepeat = Math.max(...starterCounts.values());
  const repeatRatio = maxRepeat / sentences.length;

  // Human: < 15% repeat ratio, AI: 25-50%+
  const score = Math.max(0, Math.min(1, (repeatRatio - 0.1) / 0.35));
  return score;
}

// ─── Signal 6: Paragraph Length Uniformity ───────────────────────────────────
// AI writes paragraphs of strikingly similar length.
function scoreParagraphUniformity(text: string): number {
  const paragraphs = getParagraphs(text);
  if (paragraphs.length < 2) return 0.5;

  const lengths = paragraphs.map(p => tokenize(p).length);
  const cv = coeffOfVariation(lengths);

  // Human: CV > 0.4, AI: CV < 0.2
  const score = Math.max(0, Math.min(1, 1 - (cv - 0.1) / 0.4));
  return score;
}

// ─── Signal 7: Passive Voice Ratio ──────────────────────────────────────────
// AI tends to use more passive constructions.
function scorePassiveVoice(text: string): number {
  const sentences = getSentences(text);
  if (sentences.length < 3) return 0.5;

  // Simple passive detection: "is/was/are/were/been/being" + past participle pattern
  const passivePattern = /\b(?:is|was|are|were|been|being|be)\s+\w+(?:ed|en|t)\b/gi;

  let passiveCount = 0;
  for (const s of sentences) {
    if (passivePattern.test(s)) passiveCount++;
    passivePattern.lastIndex = 0; // Reset regex
  }

  const ratio = passiveCount / sentences.length;
  // Human: ~10-20%, AI: 30-50%
  const score = Math.max(0, Math.min(1, (ratio - 0.1) / 0.35));
  return score;
}

// ─── Signal 8: Punctuation Diversity ────────────────────────────────────────
// Humans use varied punctuation (—, ;, :, !, ..., (), ""). AI sticks to . and ,
function scorePunctuationDiversity(text: string): number {
  if (text.length < 50) return 0.5;

  const richPunctuation = text.match(/[;:!?—–…()[\]"']/g) || [];
  const totalPunctuation = text.match(/[.,;:!?—–…()[\]"']/g) || [];

  if (totalPunctuation.length === 0) return 0.7; // No punctuation at all is suspicious

  const diversityRatio = richPunctuation.length / totalPunctuation.length;
  // Human: 20-40%+ rich punctuation, AI: 5-15%
  const score = Math.max(0, Math.min(1, 1 - (diversityRatio - 0.05) / 0.3));
  return score;
}

// ─── Master Engine ──────────────────────────────────────────────────────────

export type DetectionResult = {
  /** Overall AI probability 0-100 */
  score: number;
  /** 'human' | 'mixed' | 'likely_ai' | 'ai' */
  verdict: 'human' | 'mixed' | 'likely_ai' | 'ai';
  /** Individual signal scores */
  signals: {
    name: string;
    score: number;
    weight: number;
    description: string;
  }[];
};

const SIGNAL_CONFIG = [
  { fn: scoreBurstiness,          weight: 0.20, name: 'Burstiness',           desc: 'Sentence length variation' },
  { fn: scoreTransitionDensity,   weight: 0.15, name: 'Transitions',          desc: 'Formal transition word usage' },
  { fn: scoreHedgeDensity,        weight: 0.15, name: 'Hedge Phrases',        desc: 'Generic filler phrase density' },
  { fn: scoreVocabRichness,       weight: 0.15, name: 'Vocabulary',           desc: 'Vocabulary richness & diversity' },
  { fn: scoreRepetitiveStarters,  weight: 0.12, name: 'Repetitive Starters',  desc: 'Sentence opener repetition' },
  { fn: scoreParagraphUniformity, weight: 0.08, name: 'Paragraph Structure',  desc: 'Paragraph length uniformity' },
  { fn: scorePassiveVoice,        weight: 0.08, name: 'Passive Voice',        desc: 'Passive construction ratio' },
  { fn: scorePunctuationDiversity, weight: 0.07, name: 'Punctuation',         desc: 'Punctuation variety' },
];

export function detectAI(text: string): DetectionResult {
  if (!text || text.trim().length < 30) {
    return { score: 0, verdict: 'human', signals: [] };
  }

  const signals = SIGNAL_CONFIG.map(cfg => ({
    name: cfg.name,
    score: Math.round(cfg.fn(text) * 100) / 100,
    weight: cfg.weight,
    description: cfg.desc,
  }));

  const weightedSum = signals.reduce((acc, s) => acc + s.score * s.weight, 0);
  const totalWeight = signals.reduce((acc, s) => acc + s.weight, 0);
  const rawScore = Math.round((weightedSum / totalWeight) * 100);

  // Clamp to 0-100
  const score = Math.max(0, Math.min(100, rawScore));

  let verdict: DetectionResult['verdict'];
  if (score < 25) verdict = 'human';
  else if (score < 50) verdict = 'mixed';
  else if (score < 75) verdict = 'likely_ai';
  else verdict = 'ai';

  return { score, verdict, signals };
}
