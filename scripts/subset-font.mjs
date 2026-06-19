import { readFileSync, writeFileSync, statSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SOURCE_FONT = path.join(ROOT, 'src', 'static', 'fonts', '.source', 'MaterialSymbolsOutlined.ttf');
const OUTPUT_PATH = path.join(ROOT, 'src', 'static', 'fonts', 'material-symbols-outlined.woff2');

// Match `<span class="...material-symbols-outlined..."><name></span>`. The
// regex allows extra classes either side of `material-symbols-outlined`
// (e.g. `hero-card-icon material-symbols-outlined`), and grabs the icon name
// between `>` and `<`.
const iconsFromHTML = execSync(
    `grep -rohP 'class="[^"]*\\bmaterial-symbols-outlined\\b[^"]*">\\K[a-z_]+' ${path.join(ROOT, 'src')}`,
    { encoding: 'utf-8' }
)
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

const iconsFromCSS = execSync(
    `grep -oP "content:\\s*'\\K[a-z_]+" ${path.join(ROOT, 'src', 'static', 'css', 'style.css')}`,
    { encoding: 'utf-8' }
)
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

// `icon: <name>` in front matter — rendered by tool-card / project-card via
// `<span class="material-symbols-outlined">{{ icon }}</span>`.
const iconsFromFrontMatter = execSync(
    `grep -rohE "^icon:\\s*\\"?([a-z_]+)\\"?" ${path.join(ROOT, 'src')}`,
    { encoding: 'utf-8' }
)
    .split('\n')
    .map(line => line.replace(/^icon:\s*"?([a-z_]+)"?$/, '$1').trim())
    .filter(Boolean);

const icons = [...new Set([...iconsFromHTML, ...iconsFromCSS, ...iconsFromFrontMatter])].sort();
console.log(`Found ${icons.length} icons: ${icons.join(', ')}`);

// Letters needed to type the icon names, plus space (between names) and
// underscore (in compound icon names like content_copy).
const letterSet = new Set();
for (const icon of icons) {
    for (const ch of icon) {
        if (ch === '_') letterSet.add('underscore');
        else letterSet.add(ch);
    }
}
letterSet.add('space');
const letters = [...letterSet].sort();

// pyftsubset retains only the requested glyph names. With --no-layout-closure
// it stops following GSUB lookups to add reachable glyphs, so we only keep
// ligature rules for the icons we listed — not every ligature whose
// components happen to be present.
const glyphs = [...icons, ...letters].join(',');
const cmd = [
    'pyftsubset',
    `'${SOURCE_FONT}'`,
    `--glyphs='${glyphs}'`,
    `--layout-features='rlig,rclt'`,
    `--no-layout-closure`,
    `--flavor=woff2`,
    `--output-file='${OUTPUT_PATH}'`,
].join(' ');

execSync(cmd, { stdio: 'inherit' });

const sourceKB = (statSync(SOURCE_FONT).size / 1024).toFixed(0);
const subsetKB = (statSync(OUTPUT_PATH).size / 1024).toFixed(0);
console.log(`Font subset: ${sourceKB} KB → ${subsetKB} KB (${OUTPUT_PATH})`);
