#!/usr/bin/env node

/**
 * Cabinet Cover Image Generator
 *
 * Unified script supporting:
 *   - OpenAI gpt-image-2
 *   - Gemini 3.1 Flash Image Preview (Nano Banana 2) via @google/genai SDK
 *
 * Two style sets:
 *   --style default  10 design variations (Minimalist, Watercolor, Vintage, …)
 *   --style wpa      5 color-palette variations of a 1930s WPA travel poster
 *
 * Usage:
 *   node scripts/generate_image.js <cabinet-slug> --model <openai|gemini> [--style <default|wpa>]
 *
 * Examples:
 *   node scripts/generate_image.js book-factory --model gemini
 *   node scripts/generate_image.js book-factory --model gemini --style wpa
 *   node scripts/generate_image.js book-factory --model openai --style wpa
 *
 * Env vars:
 *   OPENAI_API_KEY   (required for --model openai)
 *   GEMINI_API_KEY   (required for --model gemini)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CABINET_SPECS = {
  'book-factory': {
    name: 'Book Factory',
    subtitle: 'Turn ideas into published books',
    primaryHex: '#E8DFD5',
    secondaryHex: '#F8F6F3',
    titleColor: '#3B2F2F',
  },
};

// Icon-style covers: one big creative non-obvious object per cabinet,
// each on its own pastel background. No text. Horizontal 16:9.
// Aligned with the website's warm parchment palette (soft, calm, refined).
const CABINET_ICONS = {
  'agency':                   { object: 'a single elegant paper airplane in mid-flight with a soft curving motion trail behind it',                                bgHex: '#C5D9E8', bgName: 'soft powder blue' },
  'ai-hero':                  { object: 'a single small seedling sprout emerging from a glowing dot of light, with two delicate leaves',                          bgHex: '#C2C8E5', bgName: 'soft periwinkle' },
  'biology-experiments':      { object: 'a single butterfly with delicate symmetrical wings, mid-flutter, very simplified shapes',                                bgHex: '#BFDDC4', bgName: 'soft mint green' },
  'book-factory':             { object: 'a single elegant origami paper crane folded with clean creases',                                                          bgHex: '#F2E8D5', bgName: 'soft warm cream' },
  'career-ops':               { object: 'a single minimalist lighthouse silhouette with a soft beam of light fanning out from the top',                            bgHex: '#B7D3E5', bgName: 'soft sky blue' },
  'content-creator':          { object: 'a single stylized paper megaphone with three soft sound-wave ripples curling outward',                                    bgHex: '#FAD6B7', bgName: 'soft peach' },
  'cooking':                  { object: 'a single sprig of rosemary with a few delicate leaves arching gracefully',                                                bgHex: '#C8D5B9', bgName: 'soft sage green' },
  'course-factory':           { object: 'a single open paper umbrella catching three small falling stars',                                                         bgHex: '#F5E6A8', bgName: 'soft butter yellow' },
  'ecommerce':                { object: 'a single small parcel tied with a delicate ribbon bow on top',                                                            bgHex: '#F2D2D5', bgName: 'soft blush pink' },
  'fitness':                  { object: 'a single elegant continuous heartbeat wave line drawn in one smooth stroke',                                              bgHex: '#F4B9A8', bgName: 'soft coral' },
  'job-hunt-hq':              { object: 'a single ornate antique key with intricate but simplified teeth, suspended at a slight angle',                            bgHex: '#D8C9E0', bgName: 'soft lavender' },
  'keto-hq':                  { object: 'a single egg standing upright with two delicate wisps of steam rising from the top',                                      bgHex: '#F5DCB0', bgName: 'soft buttercream' },
  'mom-command':              { object: 'a single mama bear silhouette gently cradling a tiny teddy bear, both with soft rounded shapes',                          bgHex: '#F5C9C6', bgName: 'soft dusty rose' },
  'music-factory':            { object: 'a single tuning fork with three concentric soft ripple arcs radiating from its tip',                                      bgHex: '#D6C3E5', bgName: 'soft lilac' },
  'newborn':                  { object: 'a single soft cloud with one tiny star peeking out from behind it',                                                       bgHex: '#CDE3F2', bgName: 'soft pale baby blue' },
  'newsletter-factory':       { object: 'a single inkwell with one drop of ink falling, creating a small concentric ripple at the bottom',                         bgHex: '#B8D8C5', bgName: 'soft seafoam' },
  'personal-os':              { object: 'a single elegant compass rose with four cardinal points, drawn in clean minimal lines',                                   bgHex: '#DCD4CC', bgName: 'soft warm dove gray' },
  'physics-101':              { object: 'a single pendulum mid-swing with three subtle dotted arc lines tracing its motion path',                                  bgHex: '#C8DBB8', bgName: 'soft pistachio' },
  'physics-experiments':      { object: 'a single horseshoe magnet with delicate curving magnetic field lines arcing around it',                                   bgHex: '#B5DBD5', bgName: 'soft pale turquoise' },
  'podcast-factory':          { object: 'a single pair of headphones with a softly curved band, almost forming an infinity loop',                                  bgHex: '#D8B7C5', bgName: 'soft mauve' },
  'reading-room':             { object: 'a single paper boat sailing on one gentle curving wave',                                                                  bgHex: '#B5C5E2', bgName: 'soft cornflower blue' },
  'real-estate':              { object: 'a single rolled architectural blueprint tied with a delicate ribbon',                                                     bgHex: '#F5C9A8', bgName: 'soft apricot' },
  'saas-startup':             { object: 'a single domino mid-tip falling forward, with a soft motion ghost behind it',                                             bgHex: '#B4DBD8', bgName: 'soft pale aqua' },
  'text-your-mom':            { object: 'a single tin-can telephone with two cans connected by a gently curving string',                                           bgHex: '#EFC5CC', bgName: 'soft rose quartz' },
  'usa-travel-planner':       { object: 'a single small vintage suitcase with one helium balloon tied to its handle by a thin string',                             bgHex: '#F2BFB1', bgName: 'soft salmon pink' },
  'wedding-planner':          { object: 'a single delicate satin ribbon tied in a perfect bow with two soft trailing ends',                                        bgHex: '#E8C9C9', bgName: 'soft misty rose' },
  'youtube-channel-factory':  { object: 'a single film clapper board, partially open at a slight playful angle',                                                   bgHex: '#D5E5C8', bgName: 'soft honeydew green' },
  'email':                    { object: 'a single small open envelope with a neatly folded letter half-emerging from the top',                                      bgHex: '#B8D8C5', bgName: 'soft seafoam' },
  'venture-capital':          { object: 'a single small upward-pointing rocket with a tiny coin balanced at its nose cone',                                         bgHex: '#F5E6A8', bgName: 'soft butter yellow' },

  // ─── Enterprise department templates (76) ────────────────────────────────────
  // Flagship
  'competitive-intelligence': { object: 'a single elegant antique brass spyglass, slightly extended, with a soft beam of light fanning gently from its lens', bgHex: '#C9D2DB', bgName: 'soft slate gray' },

  // Executive / CEO Office
  'ceo-operating':            { object: 'a single elegant lighthouse on a small rock with three soft beams of light rotating slowly from the top', bgHex: '#C4D4DE', bgName: 'soft pale blue-gray' },
  'board-memo':               { object: 'a single folded leather portfolio with a thin silk ribbon bookmark hanging out the bottom edge', bgHex: '#D9CDB8', bgName: 'soft warm taupe' },
  'investor-update':          { object: 'a single delicate quill pen mid-stroke leaving one elegant signature flourish curling beneath it', bgHex: '#EDDFC4', bgName: 'soft champagne' },
  'leadership-meeting':       { object: 'a single round table viewed from a soft three-quarter angle with five empty wooden chairs evenly placed around it', bgHex: '#DCD4CC', bgName: 'soft warm dove gray' },

  // Strategy / Operations
  'okr-command':              { object: 'a single slender arrow striking the exact center of three concentric target rings', bgHex: '#E5D6B0', bgName: 'soft pale ochre' },
  'weekly-business-review':   { object: 'a single elegant sundial with the gnomon casting one soft diagonal shadow line across its face', bgHex: '#E0D2B8', bgName: 'soft warm beige' },
  'decision-log':             { object: 'a single forked path in a quiet landscape drawn in minimal lines, with one tiny dotted arrow indicating the chosen branch', bgHex: '#C8D5B9', bgName: 'soft sage green' },
  'strategic-initiative':     { object: 'a single tall slender mountain peak drawn in clean lines with a small flag planted at the summit', bgHex: '#BACFE0', bgName: 'soft pale denim' },

  // Sales
  'account-room':             { object: 'a single ornate brass key resting at a gentle angle on a small round velvet cushion', bgHex: '#F0CFC9', bgName: 'soft champagne pink' },
  'pipeline-risk':            { object: 'a single small balanced two-pan scale with one side tilting gently downward', bgHex: '#E0B69E', bgName: 'soft dusty terracotta' },
  'sales-battlecard':         { object: 'a single ornamental shield with a soft diagonal band of light across its face', bgHex: '#B7C5D8', bgName: 'soft slate blue' },
  'proposal-rfp':             { object: 'a single elegant rolled scroll tied with one thin ribbon, the bottom edge gently unfurled', bgHex: '#F2E8D5', bgName: 'soft warm cream' },
  'ae-csm-handoff':           { object: 'a single relay baton mid-pass between two soft outstretched hand silhouettes, just barely touching', bgHex: '#FAD6B7', bgName: 'soft peach' },
  'sales-call-prep':          { object: 'a single elegant rotary telephone receiver lifted off its cradle with a gently curling cord', bgHex: '#F5E6A8', bgName: 'soft butter yellow' },

  // Customer Success
  'customer-health':          { object: 'a single delicate heartbeat line curving across a soft pulse circle, drawn in one continuous stroke', bgHex: '#BFDDC4', bgName: 'soft mint green' },
  'qbr-generator':            { object: 'a single elegant trophy cup with two thin laurel leaves rising symmetrically on each side', bgHex: '#E8D49E', bgName: 'soft pale gold' },
  'renewal-risk':             { object: 'a single tall hourglass with warm sand mid-pour at the narrow waist, suspended motion', bgHex: '#E8C99A', bgName: 'soft amber sand' },
  'customer-escalation':      { object: 'a single elegant flare gun firing one soft glowing trail upward, ending in a small starburst', bgHex: '#F4B9A8', bgName: 'soft sunset coral' },

  // Customer Support
  'support-intelligence':     { object: 'a single elegant magnifying glass hovering over a small cluster of three faint dotted constellation points', bgHex: '#B4DBD8', bgName: 'soft pale aqua' },
  'bug-escalation':           { object: 'a single delicate origami beetle with clean folded wings raised, mid-emerging from its paper folds', bgHex: '#D0CDC4', bgName: 'soft warm gray' },
  'help-center':              { object: 'a single open book floating with a soft halo of light glowing around its pages', bgHex: '#F2E8D5', bgName: 'soft warm cream' },
  'support-macro':            { object: 'a single perfectly tied bow knot with two symmetric loops and two trailing ribbon ends', bgHex: '#B8D8C5', bgName: 'soft seafoam' },

  // Product
  'voice-of-customer':        { object: 'a single elegant tuning fork with three concentric sound-wave arcs radiating gently from its tines', bgHex: '#D6C3E5', bgName: 'soft lilac' },
  'feature-request':          { object: 'a single classic light bulb with three small dotted spark lines fanning above the filament', bgHex: '#F5E6A8', bgName: 'soft butter yellow' },
  'roadmap':                  { object: 'a single forking road drawn in clean parallel lines with a tiny marker dot resting on one branch', bgHex: '#C8DBB8', bgName: 'soft pistachio' },
  'prd-builder':              { object: 'a single architectural drafting compass with one leg planted firmly and the other arcing one small circle', bgHex: '#BACFE0', bgName: 'soft pale denim' },
  'product-launch':           { object: 'a single elegant rocket mid-launch with three small soft puff clouds beneath, drawn minimally', bgHex: '#F5C9C6', bgName: 'soft pale coral' },
  'experiment-review':        { object: 'a single laboratory beaker with three small round bubbles rising from the liquid surface', bgHex: '#C8DBB8', bgName: 'soft pistachio' },

  // Engineering
  'sprint-planning':          { object: 'a single elegant runner captured mid-stride in one clean continuous flowing line', bgHex: '#B8D8C5', bgName: 'soft seafoam' },
  'engineering-status':       { object: 'a single small flag planted firmly at the very top of a short three-step staircase', bgHex: '#C8D5B9', bgName: 'soft warm sage' },
  'release-notes':            { object: 'a single small confetti cannon mid-burst with five soft paper streamers fanning outward', bgHex: '#BFDDC4', bgName: 'soft pale mint' },
  'incident-postmortem':      { object: 'a single elegant phoenix feather drifting slowly downward, drawn in clean minimal lines', bgHex: '#F5C9C6', bgName: 'soft dusty rose' },
  'architecture-decision':    { object: 'a single small isometric cube with three visible faces, drawn cleanly in minimal lines', bgHex: '#D8C9E0', bgName: 'soft lavender' },
  'bug-triage':               { object: 'a single small ladybug walking along one thin curving leaf line, very minimal', bgHex: '#F5C9C6', bgName: 'soft pale coral' },

  // IT
  'it-request':               { object: 'a single ornate ticket stub with one corner gently torn, slightly tilted', bgHex: '#B4DBD8', bgName: 'soft pale aqua' },
  'access-approval':          { object: 'a single elegant skeleton key threaded through a small ring, suspended in soft balance', bgHex: '#D8C9E0', bgName: 'soft lavender' },
  'app-directory':            { object: 'a single grid of nine small rounded squares laid out evenly in three rows of three', bgHex: '#DCD4CC', bgName: 'soft warm dove' },
  'employee-offboarding':     { object: 'a single neatly folded paper map with one fold gently opened partway', bgHex: '#FAD6B7', bgName: 'soft peach' },
  'change-management':        { object: 'a single domino tipping forward at the moment of impact with a second domino standing patiently behind', bgHex: '#B4DBD8', bgName: 'soft pale teal' },

  // HR / People
  'new-hire-onboarding':      { object: 'a single small potted sapling with two soft leaves just unfurling, in clean minimal lines', bgHex: '#BFDDC4', bgName: 'soft mint' },
  'hr-policy-assistant':      { object: 'a single elegant ribbon spool with one ribbon trailing gracefully downward', bgHex: '#F5C9C6', bgName: 'soft dusty rose' },
  'performance-review':       { object: 'a single small bonsai tree with three trimmed branches in elegant balanced composition', bgHex: '#C8D5B9', bgName: 'soft sage' },
  'candidate-packet':         { object: 'a single neat manila folder tied with a thin ribbon, the top edge slightly ajar', bgHex: '#F2E8D5', bgName: 'soft warm cream' },
  'hiring-pipeline':          { object: 'a single tall slender funnel with three soft sparkles falling gently into its narrow opening', bgHex: '#F5C9A8', bgName: 'soft pale apricot' },
  'manager-one-on-one':       { object: 'a pair of empty teacups stacked carefully, with one soft wisp of steam rising from the top cup', bgHex: '#F2D2D5', bgName: 'soft blush' },

  // Finance
  'finance-memo':             { object: 'a single elegant fountain pen resting at a slight angle across one folded letter', bgHex: '#EDDFC4', bgName: 'soft champagne' },
  'budget-variance':          { object: 'a set of three vertical bar shapes of slightly different heights, in clean minimal balance', bgHex: '#C9D2DB', bgName: 'soft pale slate' },
  'vendor-renewal':           { object: 'a single calendar page with one date circled gently in soft ink', bgHex: '#E5D6B0', bgName: 'soft pale ochre' },
  'spend-policy':             { object: 'a single small piggy bank with one coin paused mid-air just above the coin slot', bgHex: '#F2D2D5', bgName: 'soft blush pink' },
  'board-finance':            { object: 'a single elegant ledger book with one thin silk ribbon bookmark trailing out the bottom', bgHex: '#D9CDB8', bgName: 'soft warm taupe' },

  // Procurement / Operations
  'procurement-intake':       { object: 'a single open shipping crate with one small wrapped parcel resting inside, soft top-down angle', bgHex: '#F2E8D5', bgName: 'soft warm cream' },
  'vendor-asset':             { object: 'a single small open toolbox with one wrench resting at an angle across its lid', bgHex: '#B7C5D8', bgName: 'soft pale slate blue' },
  'universal-request':        { object: 'a single elegant envelope with one ornate wax seal pressed at the center', bgHex: '#D8C9E0', bgName: 'soft lavender' },
  'office-ops':               { object: 'a single small potted desk plant beside a neatly stacked pair of folders', bgHex: '#B8D8C5', bgName: 'soft seafoam' },

  // Legal
  'contract-intelligence':    { object: 'a single elegant magnifying glass hovering over a single folded document, soft top-down angle', bgHex: '#EAE0CB', bgName: 'soft pale parchment' },
  'legal-request':            { object: 'a single small brass service bell on a counter, mid-ring, with one soft sound arc curling out', bgHex: '#D9CDB8', bgName: 'soft warm taupe' },
  'contract-renewal':         { object: 'a single calendar page with one corner gently folded down like a small bookmark', bgHex: '#EDDFC4', bgName: 'soft champagne' },
  'clause-library':           { object: 'a single open ornate book with three thin ribbon bookmarks fanning outward across its pages', bgHex: '#F2E8D5', bgName: 'soft warm cream' },

  // Security / Compliance
  'security-questionnaire':   { object: 'a single neat clipboard with three small ticks running cleanly down the page', bgHex: '#C8D5B9', bgName: 'soft pale sage' },
  'compliance-evidence':      { object: 'a single elegant fingerprint loop drawn in one clean continuous spiraling line', bgHex: '#C9D2DB', bgName: 'soft pale slate' },
  'risk-register':            { object: 'a single small fire extinguisher with one soft spark hovering motionlessly above its nozzle', bgHex: '#F5C9C6', bgName: 'soft dusty rose' },
  'vendor-security-review':   { object: 'a single elegant padlock with one delicate skeleton key floating gently beside it', bgHex: '#B4DBD8', bgName: 'soft pale teal' },

  // Marketing
  'campaign-launch':          { object: 'a single elegant party popper mid-burst with a soft trail of confetti curling outward', bgHex: '#FAD6B7', bgName: 'soft warm peach' },
  'content-calendar':         { object: 'a single small calendar page with one date highlighted by a soft ink dot, slightly tilted', bgHex: '#D8C9E0', bgName: 'soft pale lilac' },
  'seo-content':              { object: 'a single elegant compass needle pointing precisely north with one soft glow at the tip', bgHex: '#B4DBD8', bgName: 'soft pale teal' },
  'ad-performance':           { object: 'a single elegant target with one arrow planted dead center, surrounded by two soft impact ripples', bgHex: '#F4B9A8', bgName: 'soft warm coral' },
  'brand-hub':                { object: 'a single delicate fan of three overlapping paint swatches in graduated warm tones', bgHex: '#F2E8D5', bgName: 'soft warm cream' },
  'competitive-marketing':    { object: 'a single elegant chess knight piece standing on one soft empty board square', bgHex: '#C9D2DB', bgName: 'soft pale slate' },

  // Data / Analytics
  'kpi-narrative':            { object: 'a single elegant rising line graph drawn in one clean continuous flowing stroke', bgHex: '#D8C9E0', bgName: 'soft pale lavender' },
  'metrics-definition':       { object: 'a single small open dictionary with one ribbon bookmark trailing across its pages', bgHex: '#EDDFC4', bgName: 'soft champagne' },
  'data-request':             { object: 'a single small mailbox with one envelope half inserted into the slot', bgHex: '#B4DBD8', bgName: 'soft pale aqua' },

  // General Company Knowledge
  'company-brain':            { object: 'a single elegant brain rendered as one clean continuous looping line with one soft glow node', bgHex: '#C4D4DE', bgName: 'soft pale blue-gray' },
  'meeting-memory':           { object: 'a string of three connected polaroid frames hanging from one thin clothesline', bgHex: '#F2E8D5', bgName: 'soft warm cream' },
  'internal-faq':             { object: 'a single delicate question mark suspended above three soft concentric ripples', bgHex: '#D8C9E0', bgName: 'soft pale lavender' },
  'team-wiki':                { object: 'a single small open notebook with one elegant ribbon bookmark trailing out the bottom', bgHex: '#C8D5B9', bgName: 'soft sage' },
};

const STYLE_VARIATIONS = [
  {
    version: 1,
    style: 'Minimalist Modern',
    description: 'Clean lines, geometric shapes, very minimalist aesthetic. Background: soft beige gradient. Bold title in italic serif font, dark brown color, approximately 70px size, centered. Subtitle below in elegant smaller serif font.',
  },
  {
    version: 2,
    style: 'Watercolor Artistic',
    description: 'Soft watercolor painting style with flowing colors and gentle washes. Pastel beige to cream gradient. Elegant title in italic serif, dark brown, centered with artistic watercolor flourishes. Subtitle below in smaller serif text.',
  },
  {
    version: 3,
    style: 'Vintage Literary',
    description: 'Vintage book illustration style, classic and timeless with ornamental elements. Warm beige with antique texture. Title in serif italic, dark brown, with ornamental vintage borders. Subtitle below in classic serif font.',
  },
  {
    version: 4,
    style: 'Modern Bold',
    description: 'Bold, contemporary design with strong geometric shapes and dynamic composition. Cream and beige gradient. Large title in italic serif, prominent dark brown placement. Subtitle below. Modern, confident aesthetic.',
  },
  {
    version: 5,
    style: 'Ethereal Dreamy',
    description: 'Dreamy, soft, ethereal aesthetic with floating elements and gentle shadows. Very pastel, calming gradient. Gentle title in italic serif, dark brown with soft shadows. Subtitle below. Serene, peaceful composition.',
  },
  {
    version: 6,
    style: 'Art Deco Elegant',
    description: 'Art deco style with geometric patterns, symmetry, and elegant flourishes. Sophisticated beige and cream palette. Title in serif with deco-style geometric borders, dark brown italic text. Subtitle below. Luxurious and refined.',
  },
  {
    version: 7,
    style: 'Nature Inspired',
    description: 'Organic, nature-inspired design with natural elements like leaves, branches, or flowing forms. Warm, earthy tones. Title in italic serif integrated with natural forms, dark brown color. Subtitle below. Harmonious with nature.',
  },
  {
    version: 8,
    style: 'Abstract Contemporary',
    description: 'Abstract contemporary art with bold shapes, layers, and dynamic composition. Modern beige gradient. Large title in italic serif, dark brown, modern placement. Subtitle below. Contemporary and sophisticated.',
  },
  {
    version: 9,
    style: 'Illustration Storybook',
    description: 'Charming storybook illustration style with whimsical but sophisticated elements. Soft pastel palette. Title in playful italic serif, dark brown color. Subtitle below. Whimsical yet refined aesthetic.',
  },
  {
    version: 10,
    style: 'Luxury Premium',
    description: 'Luxury, premium, high-end design aesthetic with sophisticated elegance. Sophisticated beige and cream with subtle gold accents. Title in elegant italic serif, dark brown with premium styling. Subtitle below. Exclusive and refined.',
  },
];

const WPA_PALETTES = [
  {
    version: 1,
    name: 'Rose & Sage',
    colors: 'dusty rose pink, soft sage green, warm cream, and pale almond',
  },
  {
    version: 2,
    name: 'Powder Blue & Peach',
    colors: 'powder blue, soft peach, ivory, and muted dove gray',
  },
  {
    version: 3,
    name: 'Lavender & Mint',
    colors: 'pale lavender, soft mint green, blush pink, and antique cream',
  },
  {
    version: 4,
    name: 'Butter & Sky',
    colors: 'butter yellow, pale sky blue, dusty coral, and warm off-white',
  },
  {
    version: 5,
    name: 'Mauve & Almond',
    colors: 'soft mauve, dusty teal, almond beige, and pale rose',
  },
];

function buildDefaultPrompt(spec, variation) {
  return `Create a professional book cover image in landscape format for "${spec.name}" in this specific style:

Style: ${variation.style}
${variation.description}

CRITICAL REQUIREMENTS:
- Image aspect ratio MUST be landscape (approximately 16:9 wide)
- Background gradient from ${spec.primaryHex} to ${spec.secondaryHex}
- Typography: "${spec.name}" title MUST appear in the image in italic serif font (similar to Instrument Serif), dark brown color similar to rgb(59,47,47), size 60-70px, centered
- Subtitle: "${spec.subtitle}" MUST appear below title in smaller serif font
- Include a central visual illustration/design element matching the style
- Complete, finished design with text already rendered in the image
- Professional, polished appearance
- Text must be clearly visible and beautifully integrated into the design`;
}

function buildWpaPrompt(spec, variation) {
  return `A vintage 1930s WPA-style travel poster illustration for "${spec.name}". The artwork uses a minimalist vector design with clean, simplified shapes and a flat, screen-printed aesthetic with subtle paper texture. The composition uses gentle contrast and soft, atmospheric lighting, focusing on an iconic visual element or scene that represents the theme of "${spec.name}" — "${spec.subtitle}". The color palette is soft and pastel, limited to: ${variation.colors}. Integrated bold, clean slab-serif typography is featured prominently, reading "${spec.name}" as the main title with "${spec.subtitle}" as a smaller subtitle directly beneath it. Horizontal landscape format (16:9). Calm, inviting, and refined — soft pastels, no harsh contrast.`;
}

function buildIconPrompt(_spec, variation) {
  return `A minimalist horizontal landscape illustration. The composition centers on ONE big simple icon: ${variation.object}. The icon is the singular focal point and fills most of the canvas — large, bold, centered, with generous calm negative space around it. Style: soft, clean modern vector illustration with simplified shapes, subtle flat shading, and a refined hand-drawn feel. Background: a single solid soft pastel ${variation.bgName} (${variation.bgHex}) with no patterns, no gradients, no texture. The icon itself is rendered in a complementary pastel tone — calm, harmonious, never harsh. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO LOGOS, NO WATERMARKS anywhere in the image. Very simple, very minimal, very serene. Aspect ratio 16:9, horizontal landscape composition.`;
}

function buildWoodPrompt(_spec, variation) {
  return `A single ${variation.object}, rendered as a small 3D wood-craft toy object in warm light blonde maple wood with a soft matte clay finish. Clean simplified form with gently rounded edges and subtle warm shading. Set against a solid warm parchment background (hex #FAF6F1 — soft cream-white). Small warm accent color touches on select details (amber gold, sage green, or dusty rose). Wide horizontal 16:9 composition, object centered with generous parchment space on all sides. Warm, calm, refined toy-craft aesthetic. ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO LOGOS, NO WATERMARKS anywhere in the image.`;
}

const STYLE_SETS = {
  default: {
    variations: () => STYLE_VARIATIONS,
    buildPrompt: buildDefaultPrompt,
    label: (v) => v.style,
    needsCabinetSpec: true,
  },
  wpa: {
    variations: () => WPA_PALETTES,
    buildPrompt: buildWpaPrompt,
    label: (v) => `WPA — ${v.name}`,
    needsCabinetSpec: true,
  },
  icon: {
    variations: (slug) => {
      const design = CABINET_ICONS[slug];
      if (!design) return [];
      return [{ version: 1, ...design, name: slug }];
    },
    buildPrompt: buildIconPrompt,
    label: (v) => `icon — ${v.bgName}`,
    needsCabinetSpec: false,
  },
  wood: {
    variations: (slug) => {
      const design = CABINET_ICONS[slug];
      if (!design) return [];
      return [{ version: 1, ...design, name: slug }];
    },
    buildPrompt: buildWoodPrompt,
    label: () => 'wood — maple craft',
    needsCabinetSpec: false,
  },
};

async function saveImage(buffer, outputPath) {
  await sharp(buffer)
    .resize(1200, 630, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, progressive: true })
    .toFile(outputPath);
  const stats = fs.statSync(outputPath);
  return Math.round(stats.size / 1024);
}

async function generateOpenAI(client, spec, variation, outputPath, buildPrompt) {
  const prompt = buildPrompt(spec, variation);
  const response = await client.images.generate({
    model: 'gpt-image-2',
    prompt,
    n: 1,
    size: '1536x1024',
    quality: 'high',
  });

  if (!response.data || response.data.length === 0) {
    throw new Error('No image data returned');
  }

  const item = response.data[0];
  const buffer = item.b64_json
    ? Buffer.from(item.b64_json, 'base64')
    : null;

  if (!buffer) {
    throw new Error('No b64_json in response');
  }

  return saveImage(buffer, outputPath);
}

async function generateGemini(ai, spec, variation, outputPath, buildPrompt) {
  const prompt = buildPrompt(spec, variation);

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: prompt,
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: '16:9',
        imageSize: '2K',
      },
    },
  });

  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(
    (p) => !p.thought && p.inlineData?.mimeType?.startsWith('image/')
  );

  if (!imagePart) {
    throw new Error('No image data in response');
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  return saveImage(buffer, outputPath);
}

function buildOutputPath(cabinetSlug, provider, styleKey, variation, totalVariations, outputCover = false) {
  const cabinetPath = path.join(__dirname, '..', cabinetSlug);
  if (outputCover) {
    return { cabinetPath, outputPath: path.join(cabinetPath, 'cover.jpg') };
  }
  const styleSuffix = styleKey === 'default' ? '' : `_${styleKey}`;
  // Single-variation styles (e.g. icon) get a clean name; multi-variation keeps _vN.
  const versionSuffix = totalVariations > 1 ? `_v${variation.version}` : '';
  return {
    cabinetPath,
    outputPath: path.join(cabinetPath, `${cabinetSlug}_${provider}${styleSuffix}${versionSuffix}.jpg`),
  };
}

async function generateVariation(provider, client, cabinetSlug, spec, variation, styleSet, styleKey, totalVariations, outputCover = false) {
  const { cabinetPath, outputPath } = buildOutputPath(cabinetSlug, provider, styleKey, variation, totalVariations, outputCover);

  if (!fs.existsSync(cabinetPath)) {
    console.warn(`⚠️  Cabinet folder not found: ${cabinetSlug}`);
    return false;
  }

  try {
    const tag = totalVariations > 1 ? `v${variation.version}: ` : '';
    console.log(`  ${tag}${styleSet.label(variation)}...`);
    const sizeKB = provider === 'openai'
      ? await generateOpenAI(client, spec, variation, outputPath, styleSet.buildPrompt)
      : await generateGemini(client, spec, variation, outputPath, styleSet.buildPrompt);
    console.log(`    ✅ ${path.basename(outputPath)} (${sizeKB}KB)`);
    return true;
  } catch (error) {
    console.error(`    ❌ ${cabinetSlug}: ${error.message}`);
    return false;
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let slug = null;
  let model = null;
  let style = 'default';
  let all = false;
  let cover = false;
  let skipExisting = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--model' || a === '-m') {
      model = args[++i];
    } else if (a === '--style' || a === '-s') {
      style = args[++i];
    } else if (a === '--all') {
      all = true;
    } else if (a === '--cover') {
      cover = true;
    } else if (a === '--skip-existing') {
      skipExisting = true;
    } else if (!a.startsWith('-') && !slug) {
      slug = a;
    }
  }

  return { slug, model, style, all, cover, skipExisting };
}

function usage() {
  console.error('Usage: node scripts/generate_image.js <cabinet-slug|--all> --model <openai|gemini> [--style <default|wpa|icon|wood>] [--cover]');
  console.error('');
  console.error('Examples:');
  console.error('  node scripts/generate_image.js book-factory --model gemini');
  console.error('  node scripts/generate_image.js book-factory --model gemini --style wpa');
  console.error('  node scripts/generate_image.js --all --model gemini --style wood --cover');
  console.error('  node scripts/generate_image.js physics-101 --model openai --style wood --cover');
}

function resolveCabinetList(slug, all, style) {
  if (all) {
    if (style === 'icon' || style === 'wood') return Object.keys(CABINET_ICONS);
    return Object.keys(CABINET_SPECS);
  }
  return slug ? [slug] : [];
}

function getSpecForCabinet(slug, style) {
  if (style === 'icon') {
    // Icon style doesn't need full CABINET_SPECS — just a placeholder name.
    return { name: slug, subtitle: '' };
  }
  return CABINET_SPECS[slug];
}

async function processCabinet(provider, client, slug, style, styleSet, outputCover = false, skipExisting = false) {
  if (skipExisting && outputCover) {
    const coverPath = path.join(__dirname, '..', slug, 'cover.jpg');
    if (fs.existsSync(coverPath)) {
      console.log(`\n⏭️  ${slug} (cover.jpg exists, skipping)`);
      return { generated: 0, failed: 0 };
    }
  }
  const spec = getSpecForCabinet(slug, style);
  if (style !== 'icon' && style !== 'wood' && !spec) {
    console.error(`❌ Unknown cabinet for ${style} style: ${slug}`);
    return { generated: 0, failed: 1 };
  }

  const variations = styleSet.variations(slug);
  if (variations.length === 0) {
    console.warn(`⚠️  No variations for ${slug} (style=${style})`);
    return { generated: 0, failed: 1 };
  }

  console.log(`\n📁 ${slug}`);
  let generated = 0;
  let failed = 0;

  for (const variation of variations) {
    const ok = await generateVariation(provider, client, slug, spec, variation, styleSet, style, variations.length, outputCover);
    if (ok) generated++;
    else failed++;

    if (variations.length > 1 && variation.version < variations.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return { generated, failed };
}

async function main() {
  const { slug, model, style, all, cover, skipExisting } = parseArgs(process.argv);

  if ((!slug && !all) || !model) {
    console.error('❌ Missing required arguments');
    usage();
    process.exit(1);
  }

  if (!['openai', 'gemini'].includes(model)) {
    console.error(`❌ Unknown model: ${model}. Must be 'openai' or 'gemini'`);
    process.exit(1);
  }

  if (!STYLE_SETS[style]) {
    console.error(`❌ Unknown style: ${style}. Must be one of: ${Object.keys(STYLE_SETS).join(', ')}`);
    process.exit(1);
  }

  let client;
  if (model === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY environment variable required');
      process.exit(1);
    }
    client = new OpenAI({ apiKey });
  } else {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY environment variable required');
      process.exit(1);
    }
    client = new GoogleGenAI({ apiKey });
  }

  const cabinets = resolveCabinetList(slug, all, style);
  if (cabinets.length === 0) {
    console.error('❌ No cabinets to process');
    process.exit(1);
  }

  const styleSet = STYLE_SETS[style];
  const modelLabel = model === 'openai' ? 'gpt-image-2' : 'gemini-3.1-flash-image-preview';

  console.log(`\n🎨 Style: ${style} | Model: ${modelLabel} | Cabinets: ${cabinets.length}`);

  let totalGen = 0;
  let totalFail = 0;

  for (let i = 0; i < cabinets.length; i++) {
    const c = cabinets[i];
    const { generated, failed } = await processCabinet(model, client, c, style, styleSet, cover, skipExisting);
    totalGen += generated;
    totalFail += failed;

    // Pause between cabinets for rate-limit safety
    if (i < cabinets.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  console.log(`\n✅ Done. Generated ${totalGen}, failed ${totalFail}\n`);
  if (totalFail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
