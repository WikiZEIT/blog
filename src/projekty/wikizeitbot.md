---
title: "WikiZEITBot"
description: "Bot Wikipedii do automatycznej aktualizacji list i statystyk, oparty na Pywikibot i SQL."
projectUrl: "https://github.com/WikiZEIT/bot"
icon: "smart_toy"
category: "Narzędzia Wikipedii"
tags:
  - Wikipedia
  - Python
  - Bot
---

## Opis

WikiZEITBot to bot Wikipedii tworzony w ramach projektu WikiZEIT. Automatyzuje
powtarzalne edycje na polskiej Wikipedii — w szczególności generowanie i aktualizację
list opartych na zapytaniach SQL do repliki bazy danych.

Bot działa analogicznie do szablonu
[{% raw %}{{Wikidane lista}}{% endraw %}](https://pl.wikipedia.org/wiki/Szablon:Wikidane_lista),
z tą różnicą, że zamiast SPARQL wykorzystuje SQL do repliki bazy danych Wikipedii.

## Jak działa

Bot uruchamiany jest cyklicznie na [Toolforge](https://wikitech.wikimedia.org/wiki/Portal:Toolforge)
i skanuje strony należące do kategorii
[Kategoria:Strony monitorowane przez bota WikiZEIT](https://pl.wikipedia.org/wiki/Kategoria:Strony_monitorowane_przez_bota_WikiZEIT).
Na każdej takiej stronie szuka znanego wywołania szablonu, a wynik renderowania zapisuje
z powrotem na stronę (dzieląc go w razie potrzeby na podstrony).

## Obsługiwane szablony

- [{% raw %}{{Podopieczni}}{% endraw %}](https://pl.wikipedia.org/wiki/Szablon:Podopieczni) —
  generuje listę podopiecznych danego przewodnika z bazy danych Growth, z filtrowaniem
  zablokowanych użytkowników oraz członków grup `editor` i `sysop`. Lista jest sortowana
  według daty ostatniej edycji i dzielona na podstrony.

Kolejne szablony będą dodawane w miarę rozwoju projektu.

## Technologia

- **Język:** Python
- **Framework:** [Pywikibot](https://www.mediawiki.org/wiki/Manual:Pywikibot)
- **Infrastruktura:** [Toolforge](https://wikitech.wikimedia.org/wiki/Portal:Toolforge)
  (narzędzie `wikizeit-bot`)
- **Sterowanie:** uruchomienia cykliczne (co godzinę aktualizacja przyrostowa, raz na dobę
  pełna aktualizacja z mailowym podsumowaniem zmian)

## Status

Bot działa w środowisku produkcyjnym na Toolforge. Zgłoszenie o flagę bota złożone
4 czerwca 2026 na stronie
[Wikipedia:Boty/Zgłoszenia](https://pl.wikipedia.org/wiki/Wikipedia:Boty/Zg%C5%82oszenia).

Profil bota:
[Wikipedysta:WikiZEITBot](https://pl.wikipedia.org/wiki/Wikipedysta:WikiZEITBot)

## Kod źródłowy

Kod źródłowy dostępny na GitHubie:
[WikiZEIT/bot](https://github.com/WikiZEIT/bot)
