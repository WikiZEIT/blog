import path from 'path';
import { readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import markdownIt from 'markdown-it';
import socialCard from 'eleventy-plugin-svg-social-card';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import { minify } from 'html-minifier-next';
import { minify as minifyJS } from 'terser';
import { imageSize } from 'image-size';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

    eleventyConfig.addFilter("mdAlternate", function(pageUrl) {
        if (pageUrl === '/') return '/llms.txt';
        const blogPost = pageUrl.match(/^\/blog\/([^/]+)\/$/);
        if (blogPost) return `/blog/${blogPost[1]}.md`;
        const author = pageUrl.match(/^\/autor\/([^/]+)\/$/);
        if (author) return `/autor/${author[1]}.md`;
        if (['/about/', '/contact/', '/blog/', '/oferta/', '/privacy/'].includes(pageUrl)) {
            return pageUrl.slice(0, -1) + '.md';
        }
        return null;
    });

    eleventyConfig.addFilter("rawMarkdown", function(inputPath) {
        const content = readFileSync(path.resolve(inputPath), 'utf-8');
        return content.replace(/^---[\s\S]*?---\n*/, '');
    });

    const md = markdownIt({ html: true, linkify: true });
    eleventyConfig.addFilter("markdownify", function(content) {
        if (!content) return "";
        return md.renderInline(content);
    });

    eleventyConfig.addFilter("markdownLinks", function(content) {
        if (!content) return "";
        return content.replace(
            /\]\(((https:\/\/wikizeit\.edu\.pl)?(\/[^)]+))\)/g,
            (match, fullUrl, domain, urlPath) => {
                const d = domain || '';
                const blogPost = urlPath.match(/^\/blog\/([^/]+)\/$/);
                if (blogPost) {
                    return `](${d}/blog/${blogPost[1]}.md)`;
                }
                const author = urlPath.match(/^\/autor\/([^/]+)\/$/);
                if (author) {
                    return `](${d}/autor/${author[1]}.md)`;
                }
                if (['/about/', '/contact/', '/blog/', '/oferta/', '/privacy/'].includes(urlPath)) {
                    return `](${d}${urlPath.slice(0, -1)}.md)`;
                }
                return match;
            }
        );
    });

    // Passthrough copy for static assets – contents of src/static/ are copied to output root
    eleventyConfig.addPassthroughCopy({ "src/static": "/" });
    eleventyConfig.addPassthroughCopy({ "src/static/favicon/favicon.ico": "/favicon.ico" });

    // Copy PHP backend, wrapper and .htaccess into output so _site/ is fully deployable
    eleventyConfig.addPassthroughCopy({ "api": "/api" });

    // Copy Composer vendor directory into output (source of truth is root composer.json)
    eleventyConfig.addPassthroughCopy({ "vendor": "/vendor" });

    // Copy tool config files (API keys) to output
    eleventyConfig.addPassthroughCopy("src/tools/**/config.json");

    eleventyConfig.addPlugin(syntaxHighlight);

    eleventyConfig.addPlugin(socialCard, {
        cards: {
            article: {
                template: path.join(__dirname, 'src/card/social-card.svg'),
                outputDir: path.join(__dirname, '_site/img/social-cards'),
                urlPath: '/img/social-cards',
                data(ctx) {
                    const { title, author: authorKey, date, users } = ctx;
                    const authorData = users[authorKey] || users['jcubic'];
                    return {
                        username: authorData.name,
                        fullname: authorData.fullname,
                        title,
                        path: path.join(__dirname, 'src/static/img'),
                        date: formatDate(date),
                    };
                },
            },
            tool: {
                template: path.join(__dirname, 'src/card/tool-card.svg'),
                outputDir: path.join(__dirname, '_site/img/social-cards'),
                urlPath: '/img/social-cards',
                filename: (page) => `tool-${page.fileSlug}.png`,
                data(ctx) {
                    return {
                        title: ctx.title,
                        date: formatDate(ctx.date),
                    };
                },
            },
        },
    });

    // Blog post collection sorted by date descending
    eleventyConfig.addCollection("post", function(collectionApi) {
        return collectionApi.getFilteredByGlob("src/blog/posts/*.md").sort((a, b) => {
            return b.date - a.date;
        });
    });

    // Tool collection sorted by date descending
    eleventyConfig.addCollection("tool", function(collectionApi) {
        return collectionApi.getFilteredByGlob("src/tools/**/*.liquid").sort((a, b) => {
            return b.date - a.date;
        });
    });

    // Author profile collection
    eleventyConfig.addCollection("author", function(collectionApi) {
        return collectionApi.getFilteredByGlob("src/authors/*.md");
    });

    // Unique tags list collection (excluding internal tags)
    eleventyConfig.addCollection("tagsList", function(collectionApi) {
        const tagsSet = new Set();
        collectionApi.getAll().forEach(item => {
            if (item.data.tags) {
                item.data.tags.forEach(tag => {
                    if (tag !== "post" && tag !== "all" && tag !== "Tool") {
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

    eleventyConfig.addFilter("newerDate", function(a, b) {
        return new Date(a) > new Date(b) ? a : b;
    });

    // Reading time filter
    eleventyConfig.addFilter("readingTime", function(content) {
        if (!content) return "1 min";
        const words = content.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min`;
    });

    // Excerpt filter – first paragraph or first N characters
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

    // Cache-busting hash filter
    eleventyConfig.addFilter("contentHash", function(filePath) {
        const fullPath = path.join(__dirname, 'src/static', filePath);
        const content = readFileSync(fullPath);
        return createHash('md5').update(content).digest('hex').slice(0, 8);
    });

    eleventyConfig.addFilter("utmRss", function(url) {
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}utm_source=rss&utm_medium=feed`;
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

    eleventyConfig.addTransform('img-dimensions', function(content) {
        if (!this.page.outputPath || !this.page.outputPath.endsWith('.html')) {
            return content;
        }
        return content.replace(
            /<img\b([^>]*?)\s*\/?>/gi,
            (match, attrs) => {
                const srcMatch = attrs.match(/\bsrc\s*=\s*"([^"]+)"/i);
                if (!srcMatch) return match;
                const src = srcMatch[1].replace(/\?.*$/, '');
                if (/^https?:\/\//i.test(src)) return match;
                if (/\.svg$/i.test(src)) return match;
                let extra = '';
                if (!/\b(width|height)\s*=/i.test(attrs)) {
                    const filePath = path.join(__dirname, 'src/static', src);
                    if (existsSync(filePath)) {
                        try {
                            const buffer = readFileSync(filePath);
                            const { width, height } = imageSize(buffer);
                            if (width && height) {
                                extra = ` width="${width}" height="${height}"`;
                            }
                        } catch {}
                    }
                }
                return `<img${attrs}${extra} onload="this.style.background='none'">`;
            }
        );
    });

    const isProduction = process.env.ELEVENTY_RUN_MODE === 'build';

    if (isProduction) {
        eleventyConfig.addTransform('html-minifier-next', async function(content) {
            if (this.page.outputPath && (this.page.outputPath.endsWith('.html'))) {
                return await minify(content, {
                    collapseWhitespace: true,
                    conservativeCollapse: true,
                    removeComments: true,
                    ignoreCustomComments: [/^\s*form-message-placeholder\s*$/],
                    minifyCSS: true,
                    minifyJS: async (text) => {
                        const result = await minifyJS(text, { compress: false });
                        return result.code;
                    },
                });
            }
            return content;
        });
    }

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
        pathPrefix: "/"
    };
};
