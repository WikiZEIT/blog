import { execSync } from 'child_process';

function gitDate(inputPath) {
    try {
        const result = execSync(
            `git log -1 --format=%ai -- "${inputPath}"`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).trim();
        return result ? new Date(result) : null;
    } catch {
        return null;
    }
}

function newerDate(a, b) {
    const da = a ? new Date(a) : null;
    const db = b ? new Date(b) : null;
    if (!da && !db) return null;
    if (!da) return db;
    if (!db) return da;
    return da > db ? da : db;
}

// Compare to day precision (not millisecond). Otherwise an article
// published today with a global lastmod also from today (different time
// of day) would falsely register as "modified".
function dayKey(d) {
    return d.toISOString().slice(0, 10);
}

export default {
    eleventyComputed: {
        modified(data) {
            // Explicit frontmatter `modified` always wins.
            if (data.modified) {
                return new Date(data.modified);
            }

            // Otherwise infer from git history or the site-wide lastmod,
            // and only surface it when it's actually newer than the
            // article's publish date – otherwise a fresh post would show
            // a stale "Zaktualizowano" badge sourced from `site.lastmod`.
            const inferred = newerDate(
                gitDate(data.page.inputPath),
                data.site?.lastmod ? new Date(data.site.lastmod) : null,
            );
            if (!inferred) return null;

            const articleDate = data.date ? new Date(data.date) : null;
            if (articleDate && dayKey(inferred) <= dayKey(articleDate)) {
                return null;
            }

            return inferred;
        }
    }
};
