# Wyszukiwarka wpisów w Grafie Wiedzy Google / Google Knowledge Graph Search

A bilingual tool that checks whether a person, company or concept has an entry in the Google
Knowledge Graph, and enriches each hit with links to Google, Wikipedia, Wikidata and the entity's
official site. The tool is **server-rendered**: PHP queries the Knowledge Graph and Wikidata on form
submit and renders the results directly.

Served at two URLs, one static page per language:

- `/tools/graf-wiedzy/` — Polish (default)
- `/en/tools/graf-wiedzy/` — English

## Architecture

The **core is shared**; each language is a thin wrapper plus a block of data. You rarely need to
touch the core to add or change a translation.

- `src/_data/graf.json` — **all translations** (UI strings, SEO text) and the per-language
  `apiLanguage`. Edit this to add/change a language or the copy.
- `src/tools/graf-wiedzy/index.liquid` — Polish page. Front matter only; includes the shared body.
- `src/tools/graf-wiedzy/graf-wiedzy-en.liquid` — English page. Front matter only. The filename is
  tool-prefixed on purpose (see "Adding a language").
- `src/_includes/partials/graf-tool.liquid` — shared body: the PHP that queries the Knowledge Graph
  API + Wikidata and renders the result list, the HTML chrome, and a tiny inline copy-to-clipboard
  script. Edit only to change tool structure/behavior (rare).
- `src/tools/graf-wiedzy/config.json` — Knowledge Graph API key. **Git-ignored**, created once on
  the server; never committed.

Unlike the [book search tool](../books/README.md), this tool has **no separate JS file** — it is
fully server-rendered, so the translated UI strings used inside the result loop are baked into a PHP
`$UI` array at build time (from `graf.json`). The `Kod źródłowy` / `Source code` and
`Licencja` / `License` labels come from `graf.json` (`ui.source`, `ui.license`) via the shared
`partials/tool-meta.liquid`.

## `graf.json` structure

```jsonc
{
  "default": "pl",                       // default language (the /tools/graf-wiedzy/ page)
  "languages": {
    "pl": {
      "path": "/tools/graf-wiedzy/",     // page URL for this language
      "name": "polski",                  // native name shown in the language switcher
      "apiLanguage": "pl",               // result language — see below
      "seo": { "title": "…", "description": "…" },   // <title> + meta description
      "ui":  { "title": "…", "description": "<html>", "openGoogle": "…", "scoreInfo": "<html>", … }
    }
  }
}
```

Notes:

- **`apiLanguage` drives the language of the results.** It is sent as the Knowledge Graph API
  `languages` parameter and as the Wikidata `language`/`uselang` parameters, so entity names and
  descriptions come back in that language. Set it to the language you want the results in (usually
  the same as the page language).
- `ui.description` and `ui.scoreInfo` are **HTML** (they contain markup) and are rendered as-is.
  Every other `ui.*` value is plain text and is HTML-escaped on output.
- All `ui.*` strings used inside the server-rendered result list are baked into a PHP `$UI` array in
  `graf-tool.liquid`. If you add a UI string, add the key to `graf.json`, add it to that `$UI`
  array, and reference `$UI['yourKey']`.

## Adding a language

Example: adding German (`de`). No changes to `graf-tool.liquid` are needed.

1. **Add the data.** In `src/_data/graf.json`, add a `"de"` entry under `languages`, mirroring the
   shape of `en`: `path` (`/de/tools/graf-wiedzy/`), `name` (`Deutsch`), `apiLanguage` (`de`), `seo`
   and `ui`.
2. **Add the page.** Copy `graf-wiedzy-en.liquid` to `graf-wiedzy-de.liquid` and change the front
   matter: `lang: de`, `permalink: de/tools/graf-wiedzy/index.php`, `htmlLang: de`,
   `canonicalPath: /de/tools/graf-wiedzy/`, `ogLocale: de_DE`. Keep `translation: true`.
   - **Keep the tool-prefixed filename** (`graf-wiedzy-<lang>.liquid`), not a bare `<lang>.liquid`.
     The social-card filename comes from the file slug, so two tools each shipping a `de.liquid`
     would generate the same `tool-de.png` and clash. A tool-prefixed name keeps the slug unique.
3. **Wire up hreflang.** Add `{ hreflang: de, url: /de/tools/graf-wiedzy/ }` to the `alternates` in
   **every** page (`index.liquid`, `graf-wiedzy-en.liquid`, `graf-wiedzy-de.liquid`). Keep the lists
   identical.
4. **Rebuild** with `npm run build`. The language switcher, sitemap entry and social card are
   generated automatically.

## SEO & language selection

- Each language is its own static page returning **200**, self-canonical, and cross-linked with
  `hreflang` (+ `x-default` → the Polish page). `<title>`, meta description and `og:locale` are set
  per language from front matter + `graf.json`.
- **No server-side language/geo redirect.** Auto-redirecting the canonical URL by `Accept-Language`
  makes it look like a redirect to crawlers (they send no `Accept-Language`) and redirects bots.
  Instead, the language switcher at the top of the tool lets the user choose; nothing redirects.

## Local testing

The tool needs `config.json` (a single JSON string with the Knowledge Graph API key) at
`/tools/graf-wiedzy/config.json`; both language pages read it via the document root, so **one** file
serves every language. Without it, the page renders with the translated "API key missing" message.
There is no offline mock mode — querying requires the key.

## License

Part of [WikiZEIT](../../../README.md). Copyright (c) 2026
[Jakub T. Jankiewicz](https://jakub.jankiewicz.org/).

Released under the GNU Affero General Public License v3.0. See [LICENSE](../../../LICENSE).
