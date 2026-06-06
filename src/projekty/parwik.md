---
title: "Parwik"
description: "Prosty parser składni Wiki w JavaScript, dostępny jako pakiet npm."
projectUrl: "https://github.com/WikiZEIT/parwik"
icon: "code"
category: "Open Source"
tags:
  - JavaScript
  - npm
---

## Opis

Parwik to lekka biblioteka JavaScript do parsowania tekstu w formacie wiki i konwersji
go na dane strukturalne. Obsługuje elementy składni wiki, takie jak nagłówki, linki
wewnętrzne i przypisy.

## Instalacja

```bash
npm install parwik
```

## Użycie

```javascript
import { parse } from 'parwik';

console.log(parse(`== Nagłówek ==

Przykładowy tekst z [[linkiem wewnętrznym]]
i przypisem<ref>[https://github.com/WikiZEIT/parwik
parwik na GitHubie]</ref>
`));
```

## Obsługiwane elementy składni

- Nagłówki (`== tekst ==`)
- Linki wewnętrzne (`[[tekst]]`)
- Przypisy z adresami URL

## Licencja

MIT
