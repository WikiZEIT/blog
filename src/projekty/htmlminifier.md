---
title: "HTMLMinifier"
description: "Lekka biblioteka PHP do minifikacji HTML, wykorzystująca wikimedia/minify do kompresji inline JavaScript i CSS."
projectUrl: "https://github.com/WikiZEIT/HTMLMinifier"
icon: "code"
category: "Open Source"
tags:
  - PHP
  - Packagist
---

## Opis

HTMLMinifier to lekka biblioteka PHP do minifikacji HTML. Wykorzystuje
[wikimedia/minify](https://packagist.org/packages/wikimedia/minify) do kompresji inline
JavaScript (JavaScriptMinifier) i CSS (CSSMin).

## Funkcje

- Usuwanie komentarzy HTML (z możliwością zachowania wybranych wzorców)
- Kompresja białych znaków między tagami
- Minifikacja inline JavaScript
- Minifikacja inline CSS
- Przetwarzanie bloków JSON script przez `json_encode`
- Ochrona zawartości `<pre>`, `<code>` i `<textarea>`
- Zachowanie komentarzy warunkowych IE
- Ignorowanie skryptów niebędących JavaScriptem

## Instalacja

```bash
composer require wikizeit/html-minifier
```

## Użycie

```php
use WikiZEIT\HTMLMinifier;

$minified = HTMLMinifier::minify($html);
```

Alternatywnie można utworzyć instancję klasy, aby skonfigurować wzorce zachowywanych
komentarzy przed przetwarzaniem.

## Licencja

MIT
