---
title: "CitationHelper"
description: "Narzędzie do polskiej Wikipedii ułatwiające dodawanie przypisów i cytowań do artykułów."
projectUrl: "https://pl.wikipedia.org/wiki/Wikipedia:Narz%C4%99dzia/CitationHelper"
icon: "edit_note"
category: "Narzędzia Wikipedii"
tags:
  - Wikipedia
  - Cytowanie
---

## Opis

CitationHelper to narzędzie wspierające wikipedystów w zarządzaniu źródłami i dodawaniu
przypisów harwardzkich (szablon `{% raw %}{{odn}}{% endraw %}`). Szczególnie przydatne
dla osób edytujących artykuły z bogatą bazą źródeł.

## Instalacja

Dodaj poniższy kod do swojego pliku
[common.js](https://pl.wikipedia.org/wiki/Specjalna:Moja_strona/common.js):

```javascript
var citationHelper = {
   page: 'Wikipedysta:Kerim44/źródła'
};
importScript('Wikipedysta:Jcubic/citationHelper.js');
```

## Funkcje

Narzędzie dodaje dwa przyciski w edytorze:

1. **Bibliografia** — zarządzanie źródłami; pozwala dodawać, usuwać i edytować wpisy
   bibliograficzne
2. **Przypisy (`{% raw %}{{odn}}{% endraw %}`)** — wstawianie szablonu przypisów
   harwardzkich z możliwością łączenia z bibliografią

## Kompatybilność

Działa zarówno w klasycznym edytorze kodu, jak i w edytorze wizualnym (2017).

## Wyszukiwarka książek

Do wyszukiwania źródeł bibliograficznych i generowania gotowych szablonów cytowań
możesz użyć [Wyszukiwarki książek do Wikipedii](/tools/books/). Narzędzie automatycznie
tworzy szablony `{% raw %}{{Cytuj książkę}}{% endraw %}` i `{% raw %}{{Cytuj}}{% endraw %}`
z parametrem `odn = tak`, które można bezpośrednio wykorzystać z CitationHelper.

## Ważne

Szablony cytowania muszą zawierać parametr `odn = tak`, aby przypisy zostały prawidłowo
połączone z bibliografią.
