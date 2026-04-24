import { Liquid } from 'liquidjs';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const liquid = new Liquid();
const src = await readFile('src/card/social-card.svg', 'utf8');
const tmpl = liquid.parse(src);
const rendered = await liquid.render(tmpl, {
    username: 'jcubic',
    fullname: 'Jakub T. Jankiewicz',
    title: 'Test tytu&#322; z &amp; znakami specjalnymi',
    path: '/tmp',
    date: '1 stycznia 2026',
});

const tmp = '/tmp/validate-social-card.svg';
await writeFile(tmp, rendered);
try {
    execSync(`xmllint --noout ${tmp}`, { stdio: 'inherit' });
    console.log('SVG validation passed');
} catch {
    console.error('::error::src/card/social-card.svg renders invalid XML');
    process.exit(1);
} finally {
    await unlink(tmp).catch(() => {});
}
