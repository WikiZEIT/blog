# Wyszukiwarka książek do Wikipedii / Wikipedia Book Search

A tool that searches Google Books and generates a ready-to-paste Wikipedia citation
template (`Cytuj książkę` / `Cite book` and `Cytuj` / `Citation`). It checks whether each author has
a Wikipedia article and links accordingly.

Served at two URLs, one static page per language:

- `/tools/books/` — Polish (default)
- `/en/tools/books/` — English

## Architecture

The **core is shared**; each language is a thin wrapper plus a block of data. You rarely need to
touch the core to add or change a translation.

- `src/_data/books.json` — **all translations**: UI strings, template field mappings, wiki host, and
  shared mock data. Edit this to add/change a language or the copy.
- `src/tools/books/index.liquid` — Polish page. Front matter only; includes the shared body.
- `src/tools/books/en.liquid` — English page. Front matter only; includes the shared body.
- `src/_includes/partials/books-tool.liquid` — shared body: PHP Google Books proxy, geo-redirect,
  HTML, and config injection. Edit only to change tool structure/behavior (rare).
- `src/static/js/books.js` — client logic, language-agnostic; reads the `window.BOOKS_CFG` object
  injected by the page. Edit only to change tool behavior (rare).
- `src/tools/books/config.json` — Google Books API key. **Git-ignored**, created once on the server;
  never committed.

The label strings `Kod źródłowy` / `Source code` and `Licencja` / `License` come from `books.json`
(`ui.source`, `ui.license`) and are passed into the shared `partials/tool-meta.liquid`, which falls
back to Polish for every other tool.

## `books.json` structure

```jsonc
{
  "default": "pl",            // language served at the bare /tools/books/ URL
  "fallback": "en",           // used when a visitor's language has no translation
  "mock": [ /* Google Books-shaped sample volumes for ?_debug */ ],
  "languages": {
    "pl": {
      "path": "/tools/books/",          // page URL for this language
      "name": "polski",                 // native name shown in the language switcher
      "wiki": "pl.wikipedia.org",       // wiki queried for authors + linked in output
      "bookSources": "Specjalna:Książki",
      "odn": { "field": "odn", "value": "tak" },  // OMIT to hide the odn toggle
      "seo":  { "title": "…", "description": "…" }, // <title> + meta description
      "ui":   { "title": "…", "description": "<html>", "search": "…", "errors": { … } },
      "templates": {
        "cytuj_ksiazke": { "name": "Cytuj książkę", "author": { "style": "split",  … }, … },
        "cytuj":         { "name": "Cytuj",         "author": { "style": "single", … }, … }
      }
    }
  }
}
```

Notes:

- `ui.description` is **HTML** (it contains links), rendered as-is. Everything else is plain text.
- `odn` is a Polish-Wikipedia-only parameter. If a language object has no `odn` key, the `odn`
  checkbox is hidden and the field is omitted from the generated template.
- **Template field mapping** — the two templates are serialized generically from config:
  - `author.style: "split"` → emits `first`/`last` (+ `link` when the author has an article), e.g.
    `imię` / `nazwisko` / `autor link` for pl, `first` / `last` / `author-link` for en.
  - `author.style: "single"` → emits one `field` per author, wrapped in `[[…]]` when
    `wikilink: true` and the author has an article.
  - The remaining keys (`title`, `year`, `publisher`, `isbn`, `language`) map the shared book fields
    to that template's parameter names.

## Adding a language

Example: adding German (`de`). No changes to `books.js` or `books-tool.liquid` are needed.

1. **Add the data.** In `src/_data/books.json`, add a `"de"` entry under `languages`, mirroring the
   shape of `en`: `path` (`/de/tools/books/`), `name` (`Deutsch`), `wiki` (`de.wikipedia.org`),
   `bookSources` (`Spezial:ISBN-Suche`), `seo`, `ui`, and `templates`. Add an `odn` key only if that
   wiki actually uses it.
2. **Add the page.** Copy `src/tools/books/en.liquid` to `de.liquid` and change the front matter:
   `lang: de`, `permalink: de/tools/books/index.php`, `canonicalPath: /de/tools/books/`,
   `htmlLang: de`, `ogLocale: de_DE`. Keep `translation: true`.
3. **Wire up hreflang.** Add `{ hreflang: de, url: /de/tools/books/ }` to the `alternates` list in
   **every** page (`index.liquid`, `en.liquid`, `de.liquid`) so all pages cross-link. Keep the three
   lists identical.
4. **Rebuild** with `npm run build`. The language switcher, sitemap entry, and social card are
   generated automatically.

The switcher and the redirect target map are both derived from `books.json`, so no other file needs
editing.

## Redirect & SEO behavior

- Each language is its own static page, so `<title>`, meta description, `og:locale`, canonical URL,
  and `hreflang` are correct per language (all set from front matter + `books.json`).
- A first-time visitor on the bare default page (`/tools/books/`, no query string) is redirected by
  `Accept-Language` to the matching language; no match → `fallback` (English). A visitor whose
  language is the default stays. Any query string (e.g. `?lang=pl`) disables the redirect, so anyone
  can view any language — the switcher's link to the default language carries `?lang=<code>` for
  exactly this reason. Translated pages (non-default) never redirect.

## Local testing

Add `?_debug` to any page to run against the built-in `mock` volumes without calling Google Books
(no API key needed):

```text
/tools/books/?_debug&q=harari
/en/tools/books/?_debug&q=harari
```

The Google Books proxy needs `config.json` (a single JSON string with the API key) next to the
Polish page; both pages read it via the document root, so **one** file serves every language.

## License

Part of [WikiZEIT](../../../README.md). Copyright (c) 2026
[Jakub T. Jankiewicz](https://jakub.jankiewicz.org/).

Released under the GNU Affero General Public License v3.0. See [LICENSE](../../../LICENSE).
