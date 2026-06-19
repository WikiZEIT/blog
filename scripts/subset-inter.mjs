import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import subsetFont from 'subset-font';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SOURCE_FONT = path.join(ROOT, 'src/static/fonts/.source/Inter-Variable.ttf');
const BASELINE_PATH = path.join(__dirname, 'inter-baseline.txt');
const OUTPUT_FONT = path.join(ROOT, 'src/static/fonts/inter-subset.woff2');
const DATA_OUTPUT = path.join(ROOT, 'src/_data/interFont.json');

// Google Fonts' published unicode-ranges for Inter, used by the existing
// inter-latin.woff2 and inter-latin-ext.woff2 fallback fonts.
const LATIN_RANGE =
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,' +
    'U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,' +
    'U+FEFF,U+FFFD';
const LATIN_EXT_RANGE =
    'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,' +
    'U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,' +
    'U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

// Directories whose contents should never be scanned (binary assets, generated
// CSS, vendor code, build output).
const SCAN_EXCLUDES = [
    path.join(ROOT, 'src/static/css'),
    path.join(ROOT, 'src/static/img'),
    path.join(ROOT, 'src/static/js'),
    path.join(ROOT, 'src/static/fonts'),
    path.join(ROOT, 'src/static/favicon'),
    path.join(ROOT, 'src/static/audio'),
    path.join(ROOT, 'api/logs'),
    path.join(ROOT, 'api/mail'),
];

const SCAN_EXTENSIONS = new Set([
    '.md', '.liquid', '.json', '.html', '.php', '.mustache', '.js', '.mjs', '.svg',
]);

function walk(dir) {
    const out = [];
    if (!existsDir(dir)) return out;
    for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (SCAN_EXCLUDES.some(ex => full === ex || full.startsWith(ex + path.sep))) continue;
        if (entry.startsWith('.')) continue;
        const stat = statSync(full);
        if (stat.isDirectory()) {
            out.push(...walk(full));
        } else if (SCAN_EXTENSIONS.has(path.extname(entry))) {
            out.push(full);
        }
    }
    return out;
}

function existsDir(p) {
    try { return statSync(p).isDirectory(); } catch { return false; }
}

// Parse baseline file: either raw characters or U+XXXX (range) notation.
function parseBaseline(text) {
    const cps = new Set();
    for (const rawLine of text.split('\n')) {
        const line = rawLine.replace(/^\s*#.*$/, '').trim();
        if (!line) continue;
        // Tokens are split by whitespace; each token is either a single
        // character, a U+XXXX literal, or a U+XXXX-YYYY range.
        for (const token of line.split(/\s+/)) {
            const range = token.match(/^U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?$/);
            if (range) {
                const start = parseInt(range[1], 16);
                const end = range[2] ? parseInt(range[2], 16) : start;
                for (let cp = start; cp <= end; cp++) cps.add(cp);
            } else {
                for (const ch of token) cps.add(ch.codePointAt(0));
            }
        }
    }
    return cps;
}

// Parse a TTF/OTF font's cmap table and return the set of codepoints the font
// actually has glyphs for. Supports cmap subtable formats 4 (BMP) and 12
// (full Unicode), which together cover every modern font.
function readFontCharacterSet(buffer) {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    const numTables = view.getUint16(4);
    let cmapOffset = -1;
    for (let i = 0; i < numTables; i++) {
        const recOff = 12 + i * 16;
        const tag = String.fromCharCode(
            view.getUint8(recOff),
            view.getUint8(recOff + 1),
            view.getUint8(recOff + 2),
            view.getUint8(recOff + 3),
        );
        if (tag === 'cmap') {
            cmapOffset = view.getUint32(recOff + 8);
            break;
        }
    }
    if (cmapOffset === -1) throw new Error('no cmap table');

    const numSubtables = view.getUint16(cmapOffset + 2);
    let bestOffset = -1;
    let bestFormat = -1;
    for (let i = 0; i < numSubtables; i++) {
        const recOff = cmapOffset + 4 + i * 8;
        const platformID = view.getUint16(recOff);
        const encodingID = view.getUint16(recOff + 2);
        const subOffset = cmapOffset + view.getUint32(recOff + 4);
        const format = view.getUint16(subOffset);
        const isFullUnicode =
            (platformID === 3 && encodingID === 10) ||
            (platformID === 0 && encodingID >= 4);
        const isBmpUnicode =
            (platformID === 3 && encodingID === 1) ||
            (platformID === 0 && encodingID >= 3);
        if (format === 12 && isFullUnicode) {
            bestOffset = subOffset;
            bestFormat = 12;
            break;
        }
        if (format === 4 && bestFormat !== 12 && isBmpUnicode) {
            bestOffset = subOffset;
            bestFormat = 4;
        }
    }
    if (bestOffset === -1) throw new Error('no usable cmap subtable');

    const codepoints = new Set();
    if (bestFormat === 4) {
        const segCountX2 = view.getUint16(bestOffset + 6);
        const segCount = segCountX2 / 2;
        const endCodeOff = bestOffset + 14;
        const startCodeOff = endCodeOff + segCountX2 + 2;
        for (let seg = 0; seg < segCount; seg++) {
            const endCode = view.getUint16(endCodeOff + seg * 2);
            const startCode = view.getUint16(startCodeOff + seg * 2);
            if (startCode === 0xFFFF) continue;
            for (let cp = startCode; cp <= endCode; cp++) codepoints.add(cp);
        }
    } else {
        const numGroups = view.getUint32(bestOffset + 12);
        for (let g = 0; g < numGroups; g++) {
            const groupOff = bestOffset + 16 + g * 12;
            const startCharCode = view.getUint32(groupOff);
            const endCharCode = view.getUint32(groupOff + 4);
            for (let cp = startCharCode; cp <= endCharCode; cp++) codepoints.add(cp);
        }
    }
    return codepoints;
}

// Convert a comma-separated unicode-range string into a Set of codepoints.
function rangeToCodepoints(rangeStr) {
    const set = new Set();
    for (const part of rangeStr.split(',')) {
        const m = part.trim().match(/^U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?$/);
        if (!m) continue;
        const start = parseInt(m[1], 16);
        const end = m[2] ? parseInt(m[2], 16) : start;
        for (let cp = start; cp <= end; cp++) set.add(cp);
    }
    return set;
}

// Collapse a sorted set of codepoints into a unicode-range string.
function codepointsToRange(cpSet) {
    const sorted = [...cpSet].sort((a, b) => a - b);
    if (sorted.length === 0) return '';
    const parts = [];
    let start = sorted[0];
    let prev = sorted[0];
    const fmt = (cp) => cp.toString(16).toUpperCase().padStart(4, '0');
    for (let i = 1; i <= sorted.length; i++) {
        const cp = sorted[i];
        if (cp === prev + 1) {
            prev = cp;
            continue;
        }
        parts.push(start === prev ? `U+${fmt(start)}` : `U+${fmt(start)}-${fmt(prev)}`);
        start = prev = cp;
    }
    return parts.join(',');
}

// ── 1. Scan source files ─────────────────────────────────────────────────────
const files = [
    ...walk(path.join(ROOT, 'src')),
    ...walk(path.join(ROOT, 'api')),
];

const charCounts = new Map();
const charSources = new Map();
for (const file of files) {
    const text = readFileSync(file, 'utf-8');
    for (const ch of text) {
        const cp = ch.codePointAt(0);
        // Skip control characters (incl. \t, \n, \r) — fonts don't render these.
        if (cp < 0x20) continue;
        if (cp >= 0x7F && cp <= 0x9F) continue;
        charCounts.set(cp, (charCounts.get(cp) || 0) + 1);
        if (cp > 0xFF && !charSources.has(cp)) {
            charSources.set(cp, path.relative(ROOT, file));
        }
    }
}

// ── 2. Add baseline ──────────────────────────────────────────────────────────
const baselineText = readFileSync(BASELINE_PATH, 'utf-8');
const baselineCps = parseBaseline(baselineText);
for (const cp of baselineCps) {
    if (!charCounts.has(cp)) charCounts.set(cp, 0);
}

// ── 3. Filter against Inter's actual character coverage ─────────────────────
// Characters we ask for that aren't in Inter (emoji, box drawing, etc.) are
// silently dropped by the subsetter — but unless we also drop them from the
// unicode-range, the browser thinks Inter has them and ends up doing
// per-glyph font fallback instead of letting the OS pick the right font.
const fontBuffer = readFileSync(SOURCE_FONT);
const fontCoverage = readFontCharacterSet(fontBuffer);

const requestedCodepoints = new Set(charCounts.keys());
const subsetCodepoints = new Set();
const droppedCodepoints = new Set();
for (const cp of requestedCodepoints) {
    if (fontCoverage.has(cp)) subsetCodepoints.add(cp);
    else droppedCodepoints.add(cp);
}

// ── 4. Subset the font ───────────────────────────────────────────────────────
const text = [...subsetCodepoints]
    .sort((a, b) => a - b)
    .map(cp => String.fromCodePoint(cp))
    .join('');

const subset = await subsetFont(fontBuffer, text, {
    targetFormat: 'woff2',
    variationAxes: {
        opsz: 14,
        wght: { min: 400, max: 900 },
    },
});

writeFileSync(OUTPUT_FONT, subset);

// ── 5. Compute non-overlapping unicode-ranges ────────────────────────────────
const subsetRange = codepointsToRange(subsetCodepoints);

const latinFallback = rangeToCodepoints(LATIN_RANGE);
const latinExtFallback = rangeToCodepoints(LATIN_EXT_RANGE);
for (const cp of subsetCodepoints) {
    latinFallback.delete(cp);
    latinExtFallback.delete(cp);
}
const latinRange = codepointsToRange(latinFallback);
const latinExtRange = codepointsToRange(latinExtFallback);

// ── 6. Write the eleventy data file ──────────────────────────────────────────
mkdirSync(path.dirname(DATA_OUTPUT), { recursive: true });
writeFileSync(DATA_OUTPUT, JSON.stringify({
    subsetRange,
    latinRange,
    latinExtRange,
    glyphCount: subsetCodepoints.size,
}, null, 2) + '\n');

// ── 7. Report ────────────────────────────────────────────────────────────────
const originalKB = (fontBuffer.length / 1024).toFixed(0);
const subsetKB = (subset.length / 1024).toFixed(0);
const nonAsciiNotInBaseline = [...subsetCodepoints]
    .filter(cp => cp > 0x7F && !baselineCps.has(cp))
    .sort((a, b) => a - b);
const droppedSorted = [...droppedCodepoints].sort((a, b) => a - b);

console.log(`Inter subset: ${originalKB} KB → ${subsetKB} KB (${path.relative(ROOT, OUTPUT_FONT)})`);
console.log(`  Total glyphs:     ${subsetCodepoints.size}`);
console.log(`  Baseline glyphs:  ${baselineCps.size}`);
console.log(`  Scanned glyphs:   ${charCounts.size}`);
console.log(`  Dropped (not in Inter): ${droppedCodepoints.size}`);
if (droppedSorted.length > 0 && process.env.VERBOSE) {
    console.log('  Chars dropped (rendered by system font instead):');
    for (const cp of droppedSorted) {
        const src = charSources.get(cp) || (baselineCps.has(cp) ? '(baseline)' : '?');
        console.log(`    U+${cp.toString(16).toUpperCase().padStart(4, '0')} ${String.fromCodePoint(cp)}  (${src})`);
    }
}
if (nonAsciiNotInBaseline.length > 0 && process.env.VERBOSE) {
    console.log('  Non-ASCII chars in subset that came from source (not baseline):');
    for (const cp of nonAsciiNotInBaseline) {
        const src = charSources.get(cp) || '?';
        console.log(`    U+${cp.toString(16).toUpperCase().padStart(4, '0')} ${String.fromCodePoint(cp)}  (${src})`);
    }
}
