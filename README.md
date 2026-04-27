# [Blog: WikiZEIT](https://wikizeit.jcubic.pl/)

[![CI/CD](https://github.com/WikiZEIT/blog/actions/workflows/deploy.yaml/badge.svg)](https://github.com/WikiZEIT/blog/actions/workflows/deploy.yaml)

Edukacyjny projekt o Wikipedii i etycznym SEO autorstwa [Jakuba T. Janiewicza](https://jakub.jankiewicz.org/pl/).
Odkryj mechanizmy największej encyklopedii świata i jej wpływu na twoją markę.

## Narzędzia SEO

Projekt zawiera interaktywne narzędzia SEO w katalogu `src/tools/`. Narzędzia
generowane są przez Eleventy jako pliki PHP (z użyciem layoutu `base.liquid`).

### Wyszukiwarka Grafu Wiedzy Google

Narzędzie wymaga klucza API Google Knowledge Graph. Aby skonfigurować:

1. Utwórz klucz API w [Google Cloud Console](https://console.cloud.google.com/)
   z dostępem do Knowledge Graph Search API.
2. Utwórz plik `src/static/tools/graf-wiedzy/config.json` z kluczem API jako
   wartością JSON string (np. `"AIzaSy..."`).
3. Plik `config.json` jest w `.gitignore` — nie będzie commitowany.

Na środowisku CI/CD narzędzie działa bez klucza API — wyświetla komunikat
o braku konfiguracji zamiast wyników.

## Licenese
Copyright (C) 2026 Jakub T. Jankiewicz<br />
Treść udostępniona na licencji [CC-BY-SA](https://creativecommons.org/licenses/by-sa/4.0/)


