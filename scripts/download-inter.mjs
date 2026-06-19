import { writeFileSync, mkdirSync, existsSync } from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(__dirname, '..', 'src', 'static', 'fonts', '.source');
const FONT_PATH = path.join(FONT_DIR, 'Inter-Variable.ttf');
const FONT_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf';

if (existsSync(FONT_PATH)) {
    console.log('Inter source font already downloaded.');
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
                reject(new Error(`Failed to download Inter font: HTTP ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

console.log('Downloading Inter variable font...');
const buffer = await download(FONT_URL);
writeFileSync(FONT_PATH, buffer);
console.log(`Font saved to ${FONT_PATH} (${(buffer.length / 1024).toFixed(0)} KB)`);
