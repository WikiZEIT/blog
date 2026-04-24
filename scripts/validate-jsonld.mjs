import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Non-greedy match of every <script type="application/ld+json"> ... </script>
// block. `sed`-based extraction was unsafe against minified HTML because
// `/A/,/B/` ranges happily spanned from the real JSON-LD script in <head>
// past code-block examples down to an unrelated </script> elsewhere in the
// page.
const re = /<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/g;

const out = execSync(
    "grep -rl 'application/ld+json' _site/ --include='*.html' || true",
    { encoding: 'utf8' },
);
const files = out.split('\n').filter(Boolean);

let fail = 0;
for (const file of files) {
    const html = readFileSync(file, 'utf8');
    let match;
    let block = 0;
    re.lastIndex = 0;
    while ((match = re.exec(html)) !== null) {
        block++;
        try {
            JSON.parse(match[1]);
        } catch (e) {
            console.error(`::error file=${file}::Invalid JSON-LD (block ${block}): ${e.message}`);
            fail = 1;
        }
    }
}
process.exit(fail);
