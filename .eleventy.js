import path from 'path';
import fs from 'fs/promises';
import { Liquid } from 'liquidjs';
import { chromium } from 'playwright';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const liquid = new Liquid();

const delay = time => new Promise(resolve => setTimeout(resolve, time));

function formatDate(date) {
    const d = new Date(date);
    const months = [
        "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
        "lipca", "sierpnia", "września", "października", "listopada", "grudnia"
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}

export default function(eleventyConfig) {

    // Passthrough copy for static assets — contents of src/static/ are copied to output root
    eleventyConfig.addPassthroughCopy({ "src/static": "/" });

    // Copy PHP backend, wrapper and .htaccess into output so _site/ is fully deployable
    eleventyConfig.addPassthroughCopy({ "api": "/api" });

    eleventyConfig.addPassthroughCopy({ ".htaccess": "/.htaccess" });

    // --- Social card generation via Playwright ---
    let browser;

    const svgTemplate = fs.readFile(path.join(__dirname, 'card/social-card.svg'), 'utf8').then(svg => {
        return liquid.parse(svg);
    });

    eleventyConfig.on('eleventy.before', async () => {
        browser = await chromium.launch({ args: ['--no-sandbox'] });
    });

    eleventyConfig.on('eleventy.after', async () => {
        if (browser) {
            await browser.close();
        }
        const tmpSvg = path.join(__dirname, '_tmp-social-card.svg');
        await fs.unlink(tmpSvg).catch(() => {});
    });

    eleventyConfig.addAsyncShortcode('socialCard', async function() {
        const { title, author: authorKey, date, users } = this.ctx.environments;
        const authorData = users[authorKey] || users['jcubic'];
        const svgDir = path.join(__dirname, 'src/static/img');
        const outputSvg = await liquid.render(await svgTemplate, {
            username: authorData.name,
            fullname: authorData.fullname,
            title,
            path: svgDir,
            date: formatDate(date)
        });
        const tmpSvg = path.join(__dirname, '_tmp-social-card.svg');
        await fs.writeFile(tmpSvg, outputSvg);

        const outputDir = path.join(__dirname, '_site/img/social-cards');
        await fs.mkdir(outputDir, { recursive: true });

        const { fileSlug } = this.page;
        const filename = path.join(outputDir, `${fileSlug}.png`);

        const page = await browser.newPage();
        await page.setViewportSize({ width: 1200, height: 630 });
        await page.goto('file://' + tmpSvg);
        await delay(200);

        await page.screenshot({ path: filename });
        await page.close();

        console.log(`[11ty] Social card: img/social-cards/${fileSlug}.png`);
        return '';
    });

    // Blog post collection sorted by date descending
    eleventyConfig.addCollection("post", function(collectionApi) {
        return collectionApi.getFilteredByGlob("src/blog/posts/*.md").sort((a, b) => {
            return b.date - a.date;
        });
    });

    // Unique tags list collection (excluding internal tags)
    eleventyConfig.addCollection("tagsList", function(collectionApi) {
        const tagsSet = new Set();
        collectionApi.getAll().forEach(item => {
            if (item.data.tags) {
                item.data.tags.forEach(tag => {
                    if (tag !== "post" && tag !== "all") {
                        tagsSet.add(tag);
                    }
                });
            }
        });
        return [...tagsSet].sort();
    });

    // Date formatting filter (Polish locale)
    eleventyConfig.addFilter("dateFormat", function(date, format) {
        const d = new Date(date);
        const months = [
            "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
            "lipca", "sierpnia", "września", "października", "listopada", "grudnia"
        ];
        if (format === "iso") {
            return d.toISOString().split("T")[0];
        }
        if (format === "short") {
            const day = d.getDate();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            return `${day}.${month}.${year}`;
        }
        // Default: "5 marca 2026"
        const day = d.getDate();
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    });

    // Reading time filter
    eleventyConfig.addFilter("readingTime", function(content) {
        if (!content) return "1 min";
        const words = content.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min`;
    });

    // Excerpt filter — first paragraph or first N characters
    eleventyConfig.addFilter("excerpt", function(content, length) {
        if (!content) return "";
        const len = length || 200;
        // Strip HTML tags
        const text = content.replace(/<[^>]+>/g, "").trim();
        if (text.length <= len) return text;
        return text.substring(0, len).replace(/\s+\S*$/, "") + "...";
    });

    // Limit filter for arrays
    eleventyConfig.addFilter("limit", function(arr, limit) {
        if (!Array.isArray(arr)) return arr;
        return arr.slice(0, limit);
    });

    // XML escape filter for RSS feed
    eleventyConfig.addFilter("xml_escape", function(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    });

    // JSON stringify filter for JSON-LD
    eleventyConfig.addFilter("jsonify", function(value) {
        return JSON.stringify(value, null, 2);
    });

    // Slugify filter
    eleventyConfig.addFilter("slugify", function(str) {
        return str
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "")
            .replace(/--+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");
    });

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            data: "_data"
        },
        templateFormats: ["liquid", "md", "html"],
        htmlTemplateEngine: "liquid",
        markdownTemplateEngine: "liquid",
        pathPrefix: "/wikizeit/"
    };
};
