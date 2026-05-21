import { writeFileSync, mkdirSync, existsSync } from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(__dirname, '..', 'src', 'static', 'fonts', '.source');
const FONT_PATH = path.join(FONT_DIR, 'MaterialSymbolsOutlined.ttf');
const FONT_URL = 'https://github.com/google/material-design-icons/raw/master/variablefont/MaterialSymbolsOutlined%5BFILL%2CGRAD%2Copsz%2Cwght%5D.ttf';

if (existsSync(FONT_PATH)) {
    console.log('Material Symbols font already downloaded.');
    process.exit(0);
}

mkdirSync(FONT_DIR, { recursive: true });

function download(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                download(res.headers.location).then(resolve, reject);
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download font: HTTP ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

console.log('Downloading Material Symbols Outlined font...');
const buffer = await download(FONT_URL);
writeFileSync(FONT_PATH, buffer);
console.log(`Font saved to ${FONT_PATH} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
