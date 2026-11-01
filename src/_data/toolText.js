import path from 'path';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import markdownIt from 'markdown-it';

const toolsDir = path.join(dirname(fileURLToPath(import.meta.url)), '..', 'tools');

const md = markdownIt({ html: true, linkify: false });

// Translated prose for the tool pages, one markdown file per language at
// src/tools/<tool>/text/<lang>.md. The front matter holds the heading and the
// meta description; the body is the intro text under the heading.
//
// Exposed to templates as toolText["<tool>"]["<lang>"] with:
//   title       – the <h1> and the <title>
//   description – the meta description
//   html        – the rendered body
export default function() {
    const tools = {};

    for (const tool of readdirSync(toolsDir, { withFileTypes: true })) {
        if (!tool.isDirectory()) continue;

        const textDir = path.join(toolsDir, tool.name, 'text');
        if (!existsSync(textDir)) continue;

        const languages = {};
        for (const file of readdirSync(textDir)) {
            // Skip Emacs lock files (`.#pl.md`), which are dangling symlinks.
            if (!file.endsWith('.md') || file.startsWith('.')) continue;

            const filePath = path.join(textDir, file);
            const { data, content } = matter(readFileSync(filePath, 'utf-8'));

            for (const key of ['title', 'description']) {
                if (!data[key]) {
                    throw new Error(`${filePath}: missing "${key}" in front matter`);
                }
            }

            languages[path.basename(file, '.md')] = {
                title: data.title,
                description: data.description,
                html: md.render(content).trim()
            };
        }

        tools[tool.name] = languages;
    }

    return tools;
}
