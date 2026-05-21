import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import subsetFont from 'subset-font';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SOURCE_FONT = path.join(ROOT, 'src', 'static', 'fonts', '.source', 'MaterialSymbolsOutlined.ttf');
const OUTPUT_DIR = path.join(ROOT, 'src', 'static', 'fonts');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'material-symbols-outlined.woff2');

const iconsFromHTML = execSync(
    `grep -roh 'class="material-symbols-outlined">[^<]*<' ${path.join(ROOT, 'src')}`,
    { encoding: 'utf-8' }
)
    .split('\n')
    .map(line => line.replace('class="material-symbols-outlined">', '').replace('<', '').trim())
    .filter(Boolean);

const iconsFromCSS = execSync(
    `grep -oP "content:\\s*'\\K[a-z_]+" ${path.join(ROOT, 'src', 'static', 'css', 'style.css')}`,
    { encoding: 'utf-8' }
)
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

const icons = [...new Set([...iconsFromHTML, ...iconsFromCSS])].sort();
console.log(`Found ${icons.length} icons: ${icons.join(', ')}`);

const fontBuffer = readFileSync(SOURCE_FONT);
const text = icons.join(' ');
const subset = await subsetFont(fontBuffer, text, {
    targetFormat: 'woff2',
    variationAxes: {
        FILL: 0,
        GRAD: 0,
        opsz: 24,
        wght: { min: 100, max: 700 },
    },
});

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_PATH, subset);

const originalKB = (fontBuffer.length / 1024).toFixed(0);
const subsetKB = (subset.length / 1024).toFixed(0);
console.log(`Font subset: ${originalKB} KB → ${subsetKB} KB (${OUTPUT_PATH})`);
