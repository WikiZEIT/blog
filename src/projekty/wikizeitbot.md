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

## Planowane zadania

1. **Listy podopiecznych przewodników** — automatyczne pobieranie listy podopiecznych
   z bazy danych Growth i generowanie szablonów monitorujących dla każdego przewodnika
2. **Predefiniowane zapytania SQL** — wykonywanie zaszytych w kodzie zapytań SQL
   do repliki bazy danych i aktualizacja odpowiednich stron na Wikipedii

## Technologia

- **Język:** Python
- **Framework:** [Pywikibot](https://www.mediawiki.org/wiki/Manual:Pywikibot)
- **Infrastruktura:** docelowo [Toolforge](https://wikitech.wikimedia.org/wiki/Portal:Toolforge)
- **Sterowanie:** ręczne, docelowo automatyczne (cron)

## Status

Projekt w trakcie rozwoju. Zgłoszenie o flagę bota złożone 4 czerwca 2026 na stronie
[Wikipedia:Boty/Zgłoszenia](https://pl.wikipedia.org/wiki/Wikipedia:Boty/Zg%C5%82oszenia).

Profil bota:
[Wikipedysta:WikiZEITBot](https://pl.wikipedia.org/wiki/Wikipedysta:WikiZEITBot)

## Kod źródłowy

Kod źródłowy dostępny na GitHubie:
[WikiZEIT/bot](https://github.com/WikiZEIT/bot)
