// Dynamic Assess publishes a target x multiplier pool per difficulty; each learner plays a target-sized draw seeded by learner + content, so retakes repeat it.

const DYNAMIC_QUESTIONSET = 'Dynamic QuestionSet';
const DYNAMIC_ECML = 'Dynamic Course Assessment';
const LEVELS = [['E', 'EASY'], ['M', 'MEDIUM'], ['D', 'DIFFICULT']] as const;

type Target = { E: number; M: number; D: number };
type AnyRecord = Record<string, any>;

/** A missing or unparseable target reads as zero, so Dynamic content fails closed (draws nothing) rather than playing the pool. */
function toTarget(value: unknown): Target {
  let raw: unknown = value;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { raw = undefined; }
  }
  const r = (raw && typeof raw === 'object' ? raw : {}) as AnyRecord;
  return { E: Number(r.E) || 0, M: Number(r.M) || 0, D: Number(r.D) || 0 };
}

const isQuestion = (c: AnyRecord) =>
  c?.mimeType === 'application/vnd.sunbird.question' || String(c?.objectType ?? '').replace(/Image$/, '') === 'Question';

/** A question's marks: its outcomeDeclaration maxScore, else maxScore, else 1. */
export const scoreOf = (c: AnyRecord) => Number(c.outcomeDeclaration?.maxScore?.defaultValue ?? c.maxScore) || 1;

/** 32-bit FNV-1a hash of the seed string. */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic mulberry32 generator; not security-sensitive, it only needs to be repeatable per learner. */
function seededRandom(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The same learner + seed always gets the same `count` ids; ids are sorted first so pool order doesn't matter. */
export function pickForLearner(ids: string[], count: number, seed: string): string[] {
  const pool = [...new Set(ids)].sort();
  if (count >= pool.length) return pool;
  const rand = seededRandom(seed);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const swap = pool[i] as string;
    pool[i] = pool[j] as string;
    pool[j] = swap;
  }
  return pool.slice(0, Math.max(0, count));
}

/** Picks the target count per level from `levelOf`; a level holding no more than its target keeps everything. */
function pickByLevel(ids: string[], levelOf: (id: string) => string, target: Target, seed: string): Set<string> {
  const picked = new Set<string>();
  for (const [key, level] of LEVELS) {
    const atLevel = ids.filter((id) => levelOf(id).toUpperCase() === level);
    pickForLearner(atLevel, target[key], `${seed}:${level}`).forEach((id) => picked.add(id));
  }
  return picked;
}

/** Dynamic QuestionSet: keep only this learner's questions (anything else, e.g. a section, is dropped so it can't carry pool questions), with scores to match. */
export function questionSetForLearner<T extends AnyRecord | undefined>(metadata: T, learnerId: string): T {
  if (!metadata || metadata.primaryCategory !== DYNAMIC_QUESTIONSET) return metadata;
  const children: AnyRecord[] = Array.isArray(metadata.children) ? metadata.children : [];
  if (children.length === 0) return metadata;
  const questions = children.filter(isQuestion);
  const levelById = new Map(questions.map((c) => [String(c.identifier), String(c.difficultyLevel ?? '')]));
  const picked = pickByLevel([...levelById.keys()], (id) => levelById.get(id) ?? '', toTarget(metadata.difficultyTarget), `${learnerId}:${metadata.identifier}`);
  const selected = questions.filter((c) => picked.has(String(c.identifier)));
  if (selected.length === children.length) return metadata;
  const maxScore = selected.reduce((sum, c) => sum + scoreOf(c), 0);
  return {
    ...metadata,
    children: selected,
    childNodes: selected.map((c) => c.identifier),
    // The player would otherwise re-subset the learner's draw on every attempt.
    ...(metadata.maxQuestions ? { maxQuestions: selected.length } : {}),
    maxScore,
    outcomeDeclaration: {
      ...(metadata.outcomeDeclaration ?? {}),
      maxScore: { cardinality: 'single', type: 'integer', ...(metadata.outcomeDeclaration?.maxScore ?? {}), defaultValue: maxScore },
    },
  } as T;
}

/** Dynamic Course Assessment: trim each generated quiz in the ECML body to this learner's questions. */
export function ecmlForLearner<T extends AnyRecord | undefined>(metadata: T, learnerId: string): T {
  if (!metadata || metadata.primaryCategory !== DYNAMIC_ECML) return metadata;
  // Without a readable body there is nothing to draw from, so drop the package URLs too: the renderer must not fall back to the full pool.
  const unplayable = { ...metadata, body: undefined, artifactUrl: undefined, streamingUrl: undefined } as T;
  if (!metadata.body) return unplayable;
  const isString = typeof metadata.body === 'string';
  let body: AnyRecord;
  try { body = isString ? JSON.parse(metadata.body) : structuredClone(metadata.body); } catch { return unplayable; }
  const stages: AnyRecord[] = Array.isArray(body?.theme?.stage) ? body.theme.stage : [];
  let changed = false;
  for (const stage of stages) {
    const quizzes: AnyRecord[] = ([] as AnyRecord[]).concat(stage?.['org.ekstep.questionset'] ?? []);
    for (const quiz of quizzes) {
      let config: AnyRecord;
      try { config = JSON.parse(quiz?.config?.__cdata ?? ''); } catch {
        // An unreadable quiz config in Dynamic content can't be drawn from, so it plays no questions rather than all of them.
        quiz['org.ekstep.question'] = [];
        if (quiz.data) quiz.data.__cdata = '[]';
        changed = true;
        continue;
      }
      const block = config?.dynamic_assess;
      const questions: AnyRecord[] = ([] as AnyRecord[]).concat(quiz['org.ekstep.question'] ?? []);
      if (!block || questions.length === 0) continue;
      const levels: AnyRecord = block.levels ?? {};
      const picked = pickByLevel(questions.map((q) => String(q.id)), (id) => String(levels[id] ?? ''), toTarget(block.target), `${learnerId}:${metadata.identifier}`);
      const kept = questions.filter((q) => picked.has(String(q.id)));
      if (kept.length === questions.length) continue;
      let items: AnyRecord[] = [];
      try { items = JSON.parse(quiz?.data?.__cdata ?? '[]'); } catch { items = []; }
      const keptItems = items.filter((item) => picked.has(String(item.identifier)));
      quiz['org.ekstep.question'] = kept;
      if (quiz.data) quiz.data.__cdata = JSON.stringify(keptItems);
      config.total_items = kept.length;
      config.max_score = keptItems.length ? keptItems.reduce((sum, item) => sum + (Number(item.max_score) || 1), 0) : kept.length;
      quiz.config.__cdata = JSON.stringify(config);
      changed = true;
    }
  }
  if (!changed) return metadata;
  return { ...metadata, body: isString ? JSON.stringify(body) : body } as T;
}

/** Applies the per-learner draw for either Dynamic Assess format; other content is returned unchanged. */
export function dynamicAssessForLearner<T extends AnyRecord | undefined>(metadata: T, learnerId: string | null | undefined): T {
  const id = learnerId || 'anonymous';
  return ecmlForLearner(questionSetForLearner(metadata, id), id);
}
