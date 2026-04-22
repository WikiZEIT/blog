# WikiZEIT — Eleventy Blog Project

## Overview

Eleventy (11ty) v3 static site generator project with a blog, served at the
`wikizeit.jcubic.pl` subdomain. PHP backend handles email subscription/verification and contact
form. The `_site/` output directory is fully self-contained and deployable.

## Key Rules

- **Do not fix HTML output indentation** — Liquid partials make it impossible to have properly
  indented HTML output. Focus on keeping **source templates** readable. HTML will be minified in
  production anyway, so output indentation has zero value. Never change Liquid source just to
  improve spacing in the rendered HTML.

- **Markdown line wrapping** — all generated or edited Markdown files must use hard line wraps
  at 100 characters, broken at word boundaries. This matches the Emacs `fill-column` setup used
  in this project, keeps `git diff` readable, and avoids long lines that are hard to review.

- **Liquid templates** — all layouts and partials use Liquid
- **No JavaScript required** — site works without JS; JS is only for progressive enhancement
- **Single CSS file** — `src/static/css/style.css`
- **Clean URLs** — directory-style with `index.html` inside directories
- **Path prefix** — `pathPrefix: "/"` in `.eleventy.js` (site is served at the subdomain root)
- **DO NOT `rm -rf _site`** — it breaks the running Docker container. Use `npx @11ty/eleventy` which
  overwrites files in place
- **DO NOT use `sudo`** — Docker runs as host user, no permission issues
- **Static files** in `src/static/` are copied to output root (not the directory itself)
- **PHP files** (`src/static/index.php`, `src/static/contact/index.php`) are thin wrappers that read
  static HTML and inject form messages via `<!-- form-message-placeholder -->`
- **Authors** are defined in `src/_data/users.json` keyed by nick (e.g. `jcubic`). Blog posts set
  `author: jcubic` in front matter
- **Person JSON-LD** data comes from `src/_data/person.json`

## Build & Test

```bash
# Build
npm run build        # or: npx @11ty/eleventy

# Docker (local testing)
docker compose up -d          # start
docker compose up -d --build  # rebuild image
docker compose down           # stop

# Site URL
http://localhost:8080/
```

## Directory Structure

- `src/` — Eleventy source (layouts, partials, pages, data, blog posts)
- `src/static/` — copied to output root (CSS, images, favicons, PHP wrappers)
- `src/_data/` — `site.json`, `users.json`, `person.json`
- `src/blog/posts/` — markdown blog articles
- `api/` — PHP backend (subscribe, verify, contact, shared lib, Mustache templates)
- `_site/` — build output (DO NOT delete while Docker is running)
- `tmp/` — Tailwind design reference files (read-only)
- `szkolenia/` — symlink to separate project (ignore its AGENTS.md)

## Deploy

- **Dev**: push to `dev` branch → GitHub Actions builds + SCPs `_site/` to server
- **Prod**: push to `master` → SSH git pull + composer install on server
