/**
 * connectors.mjs
 *
 * What a cabinet connects to (`connectors:` in a root `.cabinet`) and what to
 * try in it (`prompts:`): validation for the manifest build and the wire form
 * the manifest and detail files carry. Everything here except
 * loadConnectorIds() works on values already read, so the tests can call it
 * without a repo on disk.
 *
 * The id vocabulary is `.github/connector-ids.json`, exported from the Cabinet
 * app (`pnpm connectors:export-ids --out <this repo>/.github/connector-ids.json`).
 * Commit a fresh copy whenever the app adds or cuts a connector.
 */
import fs from "node:fs";

export const CONNECTOR_NEEDS = ["needs", "better-with"];
export const CONNECTOR_ACCESS = ["read", "draft", "send", "post", "change", "create"];
/** The app keeps only the first 12 declarations of a cabinet. */
export const MAX_CONNECTOR_ENTRIES = 12;
export const MAX_WHY_CHARS = 90;
export const MAX_PROMPTS = 16;
export const MAX_PROMPT_CHARS = 80;
/** A name shorter than this is too likely to be an ordinary word to warn about. */
export const MIN_NAME_CHARS = 3;
/**
 * Brand names that are also ordinary capitalised English words ("Make the
 * call", "Module 1, Motion"). Only their tool prefixes count as a mention.
 */
export const ORDINARY_WORD_NAMES = new Set(["Make", "Motion"]);

const IDS_FILE_LABEL = ".github/connector-ids.json";
const DASHES = /[\u2013\u2014]/;
const USED_BY = /^(jobs|agents)\/(.+)$/;
/** A sentence saying the cabinet replaces a tool, or leaves one alone, does not use it. */
const NOT_A_USE = /\b(replace|replaces|replacing|instead of|keep your)\b/i;
const STOP_STEP = "STOP HERE";
const INTEGRATIONS_SCREEN = /integrations screen/i;

const isText = (value) => typeof value === "string";
const isMapping = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
/** Counted in characters a person sees, the way the app counts them. */
const charCount = (text) => Array.from(text).length;
const singleLine = (text) => text.replace(/\s+/g, " ").trim();
const quoted = (value) => JSON.stringify(value);

/**
 * The id vocabulary as a Map of id to entry. Throws with a plain sentence when
 * the file is missing, is not a list, or lists an id twice.
 */
export function loadConnectorIds(filePath) {
  let list;
  try {
    list = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read the connector ids at ${filePath}: ${error.message}`);
  }
  if (!Array.isArray(list)) {
    throw new Error(`${filePath} must be a JSON list of connector ids.`);
  }
  const ids = new Map();
  for (const [index, entry] of list.entries()) {
    if (!isMapping(entry) || !isText(entry.id) || !entry.id) {
      throw new Error(`${filePath}: entry ${index + 1} has no id.`);
    }
    if (ids.has(entry.id)) throw new Error(`${filePath}: "${entry.id}" is listed twice.`);
    ids.set(entry.id, {
      id: entry.id,
      name: isText(entry.name) ? entry.name : entry.id,
      names: Array.isArray(entry.names) ? entry.names.filter(isText) : [],
      toolPrefixes: Array.isArray(entry.toolPrefixes) ? entry.toolPrefixes.filter(isText) : [],
      family: isText(entry.family) ? entry.family : "",
      cut: entry.cut === true,
    });
  }
  return ids;
}

/** The ids one authored entry names: `id` alone, or `anyOf` once each in order. */
function entryIds(entry) {
  if (!isMapping(entry)) return [];
  if (isText(entry.id)) return [entry.id];
  if (Array.isArray(entry.anyOf)) return [...new Set(entry.anyOf.filter(isText))];
  return [];
}

function readPromptText(item) {
  if (isText(item)) return item;
  if (isMapping(item) && isText(item.text)) return item.text;
  return null;
}

/**
 * The wire form of a `.cabinet`'s declarations. `id` and `anyOf` become one
 * `ids` list. Call it on a cabinet that passed validateCabinet(); an entry it
 * cannot read is left out rather than thrown on.
 *
 * - `manifestRefs`: `{ ids, need, open?, hero? }`, the small form every manifest entry carries
 * - `detailConnectors`: `{ ids, need, open, access, why, usedBy, hero }`, the full declaration
 * - `prompts`: `{ text, connector? }`
 */
export function normalizeForWire(meta) {
  const source = isMapping(meta) ? meta : {};
  const manifestRefs = [];
  const detailConnectors = [];
  if (Array.isArray(source.connectors)) {
    for (const entry of source.connectors) {
      const ids = entryIds(entry);
      if (!ids.length) continue;
      const open = entry.open === true;
      const hero = entry.hero === true;
      const ref = { ids, need: entry.need };
      if (open) ref.open = true;
      if (hero) ref.hero = true;
      manifestRefs.push(ref);
      detailConnectors.push({
        ids,
        need: entry.need,
        open,
        access: Array.isArray(entry.access) ? [...new Set(entry.access)] : [],
        why: isText(entry.why) ? singleLine(entry.why) : "",
        usedBy: Array.isArray(entry.usedBy) ? [...new Set(entry.usedBy)] : [],
        hero,
      });
    }
  }
  const prompts = [];
  if (Array.isArray(source.prompts)) {
    for (const item of source.prompts) {
      const text = readPromptText(item);
      if (text === null || !singleLine(text)) continue;
      const prompt = { text: singleLine(text) };
      if (isMapping(item) && isText(item.connector)) prompt.connector = item.connector;
      prompts.push(prompt);
    }
  }
  return { manifestRefs, detailConnectors, prompts };
}

/**
 * Splits prose into sentences. Lines of one paragraph are joined first, so a
 * hard-wrapped sentence stays whole; list items, headings and table rows each
 * start a new one.
 */
export function sentencesOf(text) {
  const sentences = [];
  for (const block of text.split(/\n\s*\n/)) {
    const chunks = [];
    for (const line of block.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const startsNew = /^([-*+]\s|\d+[.)]\s|#|\||>)/.test(trimmed);
      if (startsNew || !chunks.length) chunks.push(trimmed);
      else chunks[chunks.length - 1] += ` ${trimmed}`;
    }
    for (const chunk of chunks) {
      for (const sentence of chunk.split(/(?<=[.!?])\s+/)) {
        if (sentence) sentences.push(sentence);
      }
    }
  }
  return sentences;
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Case-sensitive, whole word: letters, digits and underscores on either side break the match. */
function wholeWordPattern(name) {
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegExp(name)}(?![\\p{L}\\p{N}_])`, "u");
}

/**
 * Whether a name can stand for its connector in prose. Lowercase search
 * aliases ("drive", "outlook") are ordinary words, so a name needs a capital
 * letter or a digit.
 */
function countsAsMention(name) {
  return (
    charCount(name) >= MIN_NAME_CHARS &&
    /[\p{Lu}\p{N}]/u.test(name) &&
    !ORDINARY_WORD_NAMES.has(name)
  );
}

const MENTION_INDEX = new WeakMap();

/**
 * Every way a job prompt or persona can name a connector, built once per
 * vocabulary. Tool prefixes and names shared by several ids (a suite's server)
 * are one mention that any of those ids satisfies. Cut ids are left out.
 */
function mentionIndex(ids) {
  const cached = MENTION_INDEX.get(ids);
  if (cached) return cached;
  const prefixes = new Map();
  const names = new Map();
  for (const entry of ids.values()) {
    if (entry.cut) continue;
    for (const prefix of entry.toolPrefixes) {
      if (!prefixes.has(prefix)) prefixes.set(prefix, { ids: [] });
      prefixes.get(prefix).ids.push(entry.id);
    }
    for (const name of entry.names) {
      if (!countsAsMention(name)) continue;
      if (!names.has(name)) names.set(name, { ids: [], pattern: wholeWordPattern(name) });
      names.get(name).ids.push(entry.id);
    }
  }
  // Longest first, so "Gemini CLI" is read before "Gemini" can match inside it.
  const index = {
    prefixes: [...prefixes],
    names: [...names].sort(([a], [b]) => charCount(b) - charCount(a)),
  };
  MENTION_INDEX.set(ids, index);
  return index;
}

/** The connectors a text names that the cabinet does not declare, as `{ ids, word }`, once per id. */
export function undeclaredMentions(text, ids, declared) {
  const { prefixes, names } = mentionIndex(ids);
  const found = new Map();
  const note = (matchIds, word) => {
    if (matchIds.some((id) => declared.has(id))) return;
    const key = matchIds.join(" ");
    if (!found.has(key)) found.set(key, { ids: matchIds, word });
  };
  for (const sentence of sentencesOf(text)) {
    if (NOT_A_USE.test(sentence)) continue;
    for (const [prefix, match] of prefixes) {
      if (sentence.includes(prefix)) note(match.ids, prefix);
    }
    let rest = sentence;
    for (const [name, match] of names) {
      if (!match.pattern.test(rest)) continue;
      note(match.ids, name);
      rest = rest.replace(new RegExp(match.pattern.source, "gu"), " ");
    }
  }
  return [...found.values()];
}

const orList = (list) =>
  list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} or ${list.at(-1)}`;

function checkWhy(entry, where, fail) {
  if (entry.why === undefined || entry.why === null || (isText(entry.why) && !entry.why.trim())) {
    fail(`${where} has no why. Say in one line what the cabinet does with it.`);
    return;
  }
  if (!isText(entry.why)) {
    fail(`${where}: why must be one line of text.`);
    return;
  }
  const length = charCount(singleLine(entry.why));
  if (length > MAX_WHY_CHARS) {
    fail(`${where}: why is ${length} characters; keep it to ${MAX_WHY_CHARS}.`);
  }
  if (DASHES.test(entry.why)) {
    fail(`${where}: why contains an em dash or en dash; use a period or a comma.`);
  }
}

function checkUsedBy(entry, where, team, fail) {
  if (entry.usedBy === undefined || entry.usedBy === null) return;
  if (!Array.isArray(entry.usedBy)) {
    fail(`${where}: usedBy must be a list such as [jobs/<id>, agents/<slug>].`);
    return;
  }
  for (const item of entry.usedBy) {
    const match = isText(item) ? USED_BY.exec(item) : null;
    if (!match) {
      fail(`${where}: usedBy ${quoted(item)} must be jobs/<id> or agents/<slug>.`);
    } else if (match[1] === "jobs" && !team.jobs.has(match[2])) {
      fail(`${where}: usedBy "${item}" names a job this cabinet does not have.`);
    } else if (match[1] === "agents" && !team.agents.has(match[2])) {
      fail(`${where}: usedBy "${item}" names an agent this cabinet does not have.`);
    }
  }
}

/** Reads one entry's ids, reporting a malformed `id` or `anyOf`. Returns null when it has none. */
function readDeclaredIds(entry, where, fail) {
  const hasId = entry.id !== undefined;
  const hasAnyOf = entry.anyOf !== undefined;
  if (hasId && hasAnyOf) {
    fail(`${where} has both id and anyOf; use one.`);
    return null;
  }
  if (!hasId && !hasAnyOf) {
    fail(`${where} needs an id, or anyOf for alternatives.`);
    return null;
  }
  if (hasId) {
    if (!isText(entry.id) || !entry.id) {
      fail(`${where}: id must be one connector id.`);
      return null;
    }
    return [entry.id];
  }
  if (!Array.isArray(entry.anyOf) || !entry.anyOf.length || !entry.anyOf.every(isText)) {
    fail(`${where}: anyOf must be a list of connector ids.`);
    return null;
  }
  return entry.anyOf;
}

function checkConnectors(context, report) {
  const { file, meta, ids, heroes, team } = context;
  const fail = (message) => report.errors.push({ file, message: `${file}: ${message}` });
  const declared = new Set();
  const needsEntries = [];
  if (meta.connectors === undefined || meta.connectors === null) return { declared, needsEntries };
  if (!Array.isArray(meta.connectors)) {
    fail("connectors must be a list.");
    return { declared, needsEntries };
  }
  if (meta.connectors.length > MAX_CONNECTOR_ENTRIES) {
    fail(
      `connectors has ${meta.connectors.length} entries; the app reads at most ${MAX_CONNECTOR_ENTRIES}.`,
    );
  }
  const heroIds = [];
  for (const [index, entry] of meta.connectors.entries()) {
    let where = `connectors entry ${index + 1}`;
    if (!isMapping(entry)) {
      fail(`${where} must be a mapping with id or anyOf.`);
      continue;
    }
    const entryIdList = readDeclaredIds(entry, where, fail);
    if (entryIdList) {
      where = `connectors entry ${quoted(entryIdList.join(", "))}`;
      const seenHere = new Set();
      for (const id of entryIdList) {
        if (!ids.has(id)) {
          fail(`unknown connector ${quoted(id)}. Known ids are in ${IDS_FILE_LABEL}.`);
        } else if (declared.has(id) || seenHere.has(id)) {
          fail(`connector ${quoted(id)} is declared more than once.`);
        }
        seenHere.add(id);
      }
      for (const id of seenHere) declared.add(id);
    }
    if (!CONNECTOR_NEEDS.includes(entry.need)) {
      fail(`${where}: need must be ${orList(CONNECTOR_NEEDS)}, not ${quoted(entry.need ?? null)}.`);
    }
    if (entry.access !== undefined && entry.access !== null) {
      if (!Array.isArray(entry.access)) {
        fail(`${where}: access must be a list such as [read].`);
      } else {
        for (const word of entry.access) {
          if (!CONNECTOR_ACCESS.includes(word)) {
            fail(`${where}: access ${quoted(word)} is not one of ${CONNECTOR_ACCESS.join(", ")}.`);
          }
        }
      }
    }
    checkWhy(entry, where, fail);
    checkUsedBy(entry, where, team, fail);
    if (entry.open !== undefined && entry.open !== true && entry.open !== false) {
      fail(`${where}: open must be true or left out.`);
    }
    if (entry.open === true && entry.id !== undefined) {
      fail(`${where}: open: true is for anyOf, not id.`);
    } else if (entry.open === true && entryIdList && new Set(entryIdList).size < 2) {
      fail(`${where}: open: true needs at least two ids in anyOf.`);
    }
    if (entry.hero !== undefined && entry.hero !== true && entry.hero !== false) {
      fail(`${where}: hero must be true or left out.`);
    }
    if (entry.hero === true && entryIdList) heroIds.push(...entryIdList);
    if (entry.need === "needs") needsEntries.push(entry);
  }
  for (const id of new Set(heroIds)) {
    if (!ids.has(id)) continue;
    const other = heroes.get(id);
    if (other && other !== file) {
      fail(`a second hero for ${quoted(id)}; ${other} is already its hero. Keep one hero: true.`);
    } else if (!other) {
      heroes.set(id, file);
    }
  }
  return { declared, needsEntries };
}

function checkPrompts(context, declared, report) {
  const { file, meta } = context;
  const fail = (message) => report.errors.push({ file, message: `${file}: ${message}` });
  if (meta.prompts === undefined || meta.prompts === null) return;
  if (!Array.isArray(meta.prompts)) {
    fail("prompts must be a list.");
    return;
  }
  if (meta.prompts.length > MAX_PROMPTS) {
    fail(`prompts has ${meta.prompts.length} entries; keep it to ${MAX_PROMPTS}.`);
  }
  for (const [index, item] of meta.prompts.entries()) {
    const where = `prompt ${index + 1}`;
    const text = readPromptText(item);
    if (text === null || !singleLine(text)) {
      fail(`${where} has no text.`);
      continue;
    }
    const length = charCount(singleLine(text));
    if (length > MAX_PROMPT_CHARS) {
      fail(`${where} is ${length} characters; keep it to ${MAX_PROMPT_CHARS}.`);
    }
    if (DASHES.test(text)) {
      fail(`${where} contains an em dash or en dash; use a period or a comma.`);
    }
    if (isMapping(item) && item.connector !== undefined && item.connector !== null) {
      if (!isText(item.connector) || !declared.has(item.connector)) {
        fail(`${where} names connector ${quoted(item.connector)}, which connectors does not declare.`);
      }
    }
  }
}

/** Whether a `needs` entry holds this job back: meant for every job, for it, or for its owner. */
function needsEntryCovers(entry, job) {
  const usedBy = Array.isArray(entry.usedBy) ? entry.usedBy : [];
  if (!usedBy.length) return true;
  if (usedBy.includes(`jobs/${job.id}`)) return true;
  return Boolean(job.ownerAgent) && usedBy.includes(`agents/${job.ownerAgent}`);
}

function describeIds(matchIds, ids) {
  return orList(matchIds.map((id) => `${ids.get(id)?.name ?? id} (${id})`));
}

function checkMentions(context, declared, needsEntries, report) {
  const { file, ids, jobPrompts, personaTexts, tags } = context;
  const warn = (at, message) => report.warnings.push({ file: at, message: `${at}: ${message}` });
  const sources = [
    ...jobPrompts.map((job) => ({ file: job.file, text: job.text })),
    ...personaTexts.map((persona) => ({ file: persona.file, text: persona.text })),
  ];
  for (const source of sources) {
    if (!isText(source.text) || !source.text) continue;
    for (const mention of undeclaredMentions(source.text, ids, declared)) {
      const idWord = mention.ids.length > 1 ? "any of them" : mention.ids[0];
      warn(
        source.file,
        `names ${describeIds(mention.ids, ids)} as "${mention.word}", but ${file} does not declare ${idWord} under connectors.`,
      );
    }
  }
  for (const tag of new Set(tags.filter(isText))) {
    const entry = ids.get(tag);
    if (!entry || entry.cut || declared.has(tag)) continue;
    warn(file, `is tagged ${quoted(tag)} but does not declare that connector under connectors.`);
  }
  if (!needsEntries.length) return;
  for (const job of jobPrompts) {
    if (!isText(job.text) || !job.text.includes(STOP_STEP) || !INTEGRATIONS_SCREEN.test(job.text)) {
      continue;
    }
    const covering = needsEntries.filter((entry) => needsEntryCovers(entry, job));
    if (!covering.length) continue;
    const named = [...new Set(covering.flatMap(entryIds))].join(", ");
    warn(
      job.file,
      `still has a hand-written "${STOP_STEP}" step pointing at the integrations screen. Cabinet now holds this job until ${named} is connected, so remove the step.`,
    );
  }
}

/**
 * Checks one root cabinet's `connectors:` and `prompts:`.
 *
 * - `slug`: the cabinet directory; messages name `<slug>/.cabinet`
 * - `meta`: the parsed `.cabinet`
 * - `jobs`, `agents`: the root job ids and agent slugs `usedBy` may name
 * - `jobPrompts`: `[{ id, ownerAgent, file, text }]`, one per root job
 * - `personaTexts`: `[{ slug, file, text }]`, one per root agent persona body
 * - `tags`: the entry page's frontmatter tags
 * - `ids`: the vocabulary from loadConnectorIds()
 * - `heroes`: a Map of id to the `.cabinet` holding its hero, shared across the walk and updated here
 *
 * Returns `{ errors, warnings }`, each a list of `{ file, message }`. Errors
 * fail the build; warnings are printed and the build passes.
 */
export function validateCabinet({
  slug,
  meta,
  jobs = [],
  agents = [],
  jobPrompts = [],
  personaTexts = [],
  tags = [],
  ids,
  heroes = new Map(),
}) {
  const report = { errors: [], warnings: [] };
  const context = {
    file: `${slug}/.cabinet`,
    meta: isMapping(meta) ? meta : {},
    ids,
    heroes,
    // YAML may read an id such as 2024 as a number; usedBy names it as text.
    team: { jobs: new Set(jobs.map(String)), agents: new Set(agents.map(String)) },
    jobPrompts,
    personaTexts,
    tags: Array.isArray(tags) ? tags : [],
  };
  const { declared, needsEntries } = checkConnectors(context, report);
  checkPrompts(context, declared, report);
  checkMentions(context, declared, needsEntries, report);
  return report;
}

// GitHub workflow commands: https://docs.github.com/actions/reference/workflow-commands-for-github-actions
const escapeData = (text) =>
  String(text).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escapeProperty = (text) => escapeData(text).replace(/:/g, "%3A").replace(/,/g, "%2C");

/** One `::error file=…::` or `::warning file=…::` line. */
export function annotation(level, { file, message }) {
  return `::${level} file=${escapeProperty(file)}::${escapeData(message)}`;
}
