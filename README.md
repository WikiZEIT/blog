# [Blog: WikiZEIT](https://wikizeit.edu.pl/)

[![CI/CD](https://github.com/WikiZEIT/blog/actions/workflows/deploy.yaml/badge.svg)](https://github.com/WikiZEIT/blog/actions/workflows/deploy.yaml)
[![WikiZEIT blog GitHub repo](https://img.shields.io/badge/github-repo-orange?logo=github)](https://github.com/WikiZEIT/blog)
[![LICENSE CC-BY-SA 4.0](https://img.shields.io/badge/license-CC--BY--SA%204.0-blue.svg)](https://github.com/WikiZEIT/blog/blob/master/LICENSE)

Edukacyjny projekt o Wikipedii i etycznym SEO autorstwa
[Jakuba T. Jankiewicza](https://jakub.jankiewicz.org/pl/). Odkryj mechanizmy
największej encyklopedii świata i jej wpływu na twoją markę.

## Stos technologiczny

- [Eleventy](https://www.11ty.dev/) 3.1.5 — generator stron statycznych (szablony Liquid)
- PHP 8.3 — backend (SQLite, Mustache, JWT)
- [subset-font](https://github.com/papandreou/subset-font) — optymalizacja czcionki ikon
  (HarfBuzz WASM)
- HTML/JS minifikacja w produkcji (html-minifier-next, terser)
- Composer: mustache/mustache, wikimedia/minify, firebase/php-jwt

## Budowanie i rozwój

```bash
npm install          # instaluje zależności + pobiera czcionkę Material Symbols (postinstall)
npm run build        # buduje stronę (prebuild subsetuje czcionkę automatycznie)
npm run dev          # serwer deweloperski z live reload
npm run watch        # tryb watch bez serwera
npm run lint         # ESLint dla plików Markdown
```

### Docker (lokalne testowanie)

```bash
docker compose up -d          # start na http://localhost:8080/
docker compose up -d --build  # przebuduj obraz
docker compose down           # zatrzymaj
```

Obraz: PHP 8.3-Apache, port 8080, volume mount katalogu `_site/`.

## Struktura projektu

```
src/
├── _data/            # Dane: site.json, users.json, person.json, projects.json
├── _includes/        # Layouty (base, article, tool, page, blog) i partiale
├── blog/posts/       # Artykuły bloga (Markdown z YAML front matter)
├── tools/            # Interaktywne narzędzia SEO (generowane jako PHP)
├── static/           # CSS, obrazy, czcionki, favicony, wrappery PHP
├── card/             # Szablon SVG do social cards
├── llms.txt.liquid   # Indeks llms.txt
└── sitemap.liquid    # Sitemap XML

api/
├── subscribe/        # Subskrypcja newslettera (SQLite + weryfikacja email)
├── verify/           # Weryfikacja adresu email
├── contact/          # Formularz kontaktowy
├── lib/              # Wspólne narzędzia (email, sanityzacja, Umami)
└── templates/        # Szablony email (Mustache)

scripts/
├── download-font.mjs          # Pobieranie czcionki Material Symbols
├── subset-font.mjs            # Subsetting czcionki do WOFF2
├── validate-jsonld.mjs        # Walidacja JSON-LD w outputcie
├── validate-social-card.mjs   # Walidacja social cards SVG
├── indexnow.sh                # Zgłaszanie URL do IndexNow
├── install-hooks.sh           # Instalacja git hooks
└── hooks/pre-push             # Uruchamia watcher GitHub Actions

oferta/               # Osobny subprojekt (symlink)
_site/                # Output (NIE usuwać przy działającym Dockerze)
```

## Optymalizacja czcionki ikon

Czcionka Material Symbols Outlined (~10 MB) jest automatycznie subsettowana do
~230 KB WOFF2 zawierającego tylko ikony używane w projekcie.

1. `npm install` pobiera pełną czcionkę TTF do `src/static/fonts/.source/`
   (gitignored)
2. `npm run build` (prebuild) skanuje `src/` w poszukiwaniu nazw ikon, tworzy
   subset WOFF2 z przypiętymi osiami wariantów (FILL, GRAD, opsz)
3. Czcionka jest self-hosted — brak zewnętrznych requestów do Google Fonts

## Blog

- Artykuły: `src/blog/posts/*.md`
- Front matter: `title`, `date`, `tags`, `description`, `keywords`, `author`,
  `modified`, `faq`
- Autorzy zdefiniowani w `src/_data/users.json` (klucz: nick, np. `jcubic`)
- Social cards generowane automatycznie z szablonu SVG (wymaga fontu Lovelo w CI)

## Narzędzia SEO

Interaktywne narzędzia w katalogu `src/tools/`, generowane przez Eleventy jako
pliki PHP (layout `tool.liquid`). Każde narzędzie wymaga `config.json` z kluczem
API (gitignored).

- **`/tools/books/`** — generator cytowań do Wikipedii (Google Books API)
- **`/tools/graf-wiedzy/`** — wyszukiwarka wpisów w Grafie Wiedzy Google
  (Knowledge Graph API)
- **`/tools/status/`** — panel diagnostyczny chroniony JWT (unlisted, wymaga
  `jwt_secret` w config.json)

### Konfiguracja klucza API

1. Utwórz klucz w [Google Cloud Console](https://console.cloud.google.com/)
   z dostępem do odpowiedniego API.
2. Utwórz plik `src/static/tools/<narzędzie>/config.json` z kluczem API jako
   wartością JSON string (np. `"AIzaSy..."`).
3. Plik `config.json` jest w `.gitignore` — nie będzie commitowany.

Na środowisku CI/CD narzędzia działają bez klucza API — wyświetlają komunikat
o braku konfiguracji.

## API (backend PHP)

- `POST /api/subscribe/` — subskrypcja newslettera (SQLite + weryfikacja email)
- `GET /api/verify/` — weryfikacja adresu email tokenem
- `POST /api/contact/` — formularz kontaktowy (wysyła plain-text email)

Wszystkie formularze używają honeypot do ochrony przed spamem. W środowisku
lokalnym (bez sendmail) emaile zapisywane są do `api/mail/index.html`.

## SEO i dane strukturalne

- **JSON-LD**: schematy Organization, Person, BlogPosting, SoftwareApplication,
  FAQPage
- **Sitemap**: generowany dynamicznie (`src/sitemap.liquid`), wyklucza strony
  z `unlisted: true`
- **robots.txt**: zezwala na GPTBot, ClaudeBot, DeepSeekBot, Google-Extended,
  Applebot-Extended
- **IndexNow**: `scripts/indexnow.sh` zgłasza URL-e do natychmiastowej
  indeksacji (wymaga `INDEXNOW_KEY`)
- **Social cards**: automatyczna generacja PNG dla artykułów i narzędzi

## LLM Discovery (llms.txt)

Strona serwuje pliki tekstowe dla modeli językowych:

- `/llms.txt` — indeks z linkami do plików sekcji
- `/llms-full.txt` — pełny zrzut treści strony
- `/blog/{slug}.md` — markdown każdego artykułu
- Content negotiation: nagłówek `Accept: text/markdown` zwraca wersję Markdown
- HTTP Link header reklamuje sitemap i llms.txt

## Wdrożenie

- **Produkcja**: push do `master` → GitHub Actions buduje + deploy przez SSH
- **Dev**: push do `dev` → deploy na serwer deweloperski
- **CI pipeline**: lint → instalacja zależności → walidacja social cards → build
  → walidacja JSON-LD → deploy (SSH)
- **Hosting**: MyDevil.net (Apache)

## Git hooks

```bash
./scripts/install-hooks.sh    # instaluje hooki z scripts/hooks/
```

- **pre-push**: uruchamia `watch-actions.sh` w tle — monitoruje GitHub Actions
  i odgrywa dźwięk po zakończeniu

## Licencja

Copyright (C) 2026 Jakub T. Jankiewicz

Treść (artykuły, teksty) udostępniona na licencji
[CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Kod źródłowy narzędzi (`src/tools/`) udostępniony na licencji
[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html) — patrz plik
[LICENSE](./LICENSE).
