---
title: "Jak napisać bota do Wikipedii"
date: 2026-06-08
tags:
  - Programowanie
  - Wikipedia
description: "Jak napisać bota działającego w Polskiej Wikipedii, w języku programowania Python"
keywords:
  - bot Wikipedii
  - pywikibot
  - Python
  - API MediaWiki
  - automatyzacja Wikipedii
  - hasło bota
  - BotPassword
  - User-Agent
  - rate limit
  - Wikimedia Toolforge
  - konto bota
  - flaga bota
  - WikiZEITBot
author: jcubic
---

## Co takiego jest bot?

Bot jest to specjalny program komputerowy, który używa dodatkowego konta jakiegoś
[Wikipedysty](https://pl.wikipedia.org/wiki/Społeczność_wikipedystów).
Taki program może wykonywać różne automatyczne działania w Wikipedii, najczęściej jakieś
automatyzacje np. globalne poprawki w artykułach lub jakieś konkretne działania edycyjne.

W tym artykule opiszę jak stworzyć prostego bota przy użyciu języka programowania
[Python](https://pl.wikipedia.org/wiki/Python).

## Instalacja Pythona

Pierwsza rzecz to instalacja Pythona, najlepiej jest wyszukać w Google "jak zainstalować pythona"
oraz nasz system operacyjny. Instalacja będzie się różnić między Windowsem, MacOS oraz Linux.

Pod systemami Linux dodatkowo należy zainstalować [PIP](https://pl.wikipedia.org/wiki/Pip_(menadżer_pakietów)),
czyli manager paczek Pythona.

## Biblioteka pywikibot

Po instalacji Pythona i PIP należy zainstalować paczkę `pywikibot` jest to biblioteka,
za pomocą której można automatyzować działania w Wikipedii. W tym celu w terminalu należy wynikać polecenie:

```bash
pip install pywikibot
```

### Dlaczego warto korzystać z pywikibot?

[API](https://pl.wikipedia.org/wiki/Interfejs_programowania_aplikacji)
[MediaWiki](https://pl.wikipedia.org/wiki/MediaWiki) (silnika napędzającego Wikipedię) jest bardzo rygorystyczne. Jednym z kluczowych
wymogów bezpieczeństwa jest przesyłanie unikalnego i poprawnego nagłówka
[User-Agent](https://pl.wikipedia.org/wiki/User_agent) przy każdym
zapytaniu [HTTP](https://pl.wikipedia.org/wiki/HTTP). Dzięki temu administratorzy wiedzą, jaki bot generuje ruch.

Wielką zaletą pywikibot jest to, że obsługuje nagłówek User-Agent w pełni automatycznie. Framework
sam generuje go na podstawie Twojego pliku konfiguracyjnego, łącząc nazwę bota z wersją
biblioteki. Dzięki temu nie musisz ręcznie konfigurować sesji HTTP ani martwić się o niespodziewane
blokady adresu IP ze strony serwerów Wikimedia.

Drugą rzeczą jest [rate limit](https://en.wikipedia.org/wiki/Rate_limiting), które biblioteka ogarnia.

## Tworzenie hasła dla bota

Korzystając z biblioteki `pywikibot`, można zalogować się do swojego konta za pomocą
hasła do Wikipedii, ale w przypadku botów, nie jest do za bardzo bezpieczne.

A gdy, tak jak w moim przypadku, masz ustawione
[podwójne uwierzytelnianie](https://pl.wikipedia.org/wiki/Uwierzytelnianie_wieloskładnikowe),
nie będzie to możliwe.

Dlatego w Wikipedii jest możliwość stworzenia specjalnego hasła dla bota.
Coś podobnego do [API Key](https://en.wikipedia.org/wiki/API_key) w różnego rodzaju usługach.

Wchodzimy na stronę: [Specjalna:Hasła_botów](https://pl.wikipedia.org/wiki/Specjalna:Hasła_botów)

i dodajemy nowe hasło:

![formularz dodawania hasła bota](/img/bot-password.webp)
<small>formularz dodawania hasła bota</small>

klikamy „utwórz” i wybieramy uprawnienia:

![uprawnienia bota z zaznaczonymi uprawnieniami do edycji i tworzenia stron](/img/bot-permissions.webp)
<small>uprawnienia bota z zaznaczonymi uprawnieniami do edycji i tworzenia stron</small>

Po wybraniu uprawnień dodawania i edycji stron, na dole strony klikamy „utwórz”:

![nowe wygenerowane hasło bota](/img/bot-new-password.webp)
<small>nowe wygenerowane hasło bota</small>

Po utworzeniu powinno się pojawić losowe hasło, zapisz je sobie, będziemy go używać za chwilę.

## Bot Hello World przez API

Najprostsze użycie biblioteki pywikibot, która doda nową stronę do Wikipedii w twojej przestrzeni
użytkownika wygląda tak.

```python
import pywikibot

def main():
    # 1. Inicjalizacja połączenia z polską Wikipedią (używa user-config.py)
    site = pywikibot.Site('pl', 'wikipedia')

    # 2. Wskazanie konkretnej strony w Twoim brudnopisie
    page = pywikibot.Page(site, 'Wikipedysta:Jcubic/HelloBot')

    # 3. skrypt
    if page.exists():
        print("Błąd: Podana strona testowa już istnieje!")
        return

    # 4. Dodanie nowego tekstu
    page.text = "Witaj, Wikipedio!"

    # 5. Zapisanie zmodyfikowanej strony z opisem zmian
    page.save(
        summary="[WikiZEIT Test] Pierwsze uruchomienie bota Hello World przez API",
        minor=True
    )
    print("Sukces! Strona została utworzona.")

if __name__ == '__main__':
    main()
```

* `pywikibot.Site()` - zwraca obiekt. który umożliwia dostęp do danego projektu.
* `pywikibot.Page()` - zwraca obiekt konkretnej strony, strona nie musi istnieć.
* `page.exists()` - sprawdza, czy strona istnieje.
* `page.text` - to accessor, który zawiera tekst strony.
* `page.save()` - zapisuje stronę.

## Logowanie do Wikipedii

Aby nasz bot mógł się zalogować do Wikipedii należy utworzyć plik `user-config.py`

Jego zawartość powinna wyglądać tak:

<!-- cSpell:disable -->
```python
family = 'wikipedia'
mylang = 'pl'
usernames['wikipedia']['pl'] = 'jcubic' # tutaj wstaw swój nick
password_file = 'user-password.py'
```
<!-- cSpell:enable -->

Plik `user-password.py` powinien zawierać krotkę, która wygląda tak:

<!-- cSpell:disable -->
```python
('Jcubic', BotPassword('Hello-World', 'r4qli70elje53e48s8lqf4oddnmrjjer'))
```
<!-- cSpell:enable -->

Oczywiście musisz wpisać swoje własne hasło bota.

Teraz możemy uruchomić nasz skrypt, wynikiem powinno być coś takiego:

```text
Logging in to wikipedia:pl as Jcubic@Hello-World
Sleeping for 7.4 seconds, 2026-06-07 21:52:31
Page [[Wikipedysta:Jcubic/HelloBot]] saved
Sukces! Strona została utworzona.
```

Wchodzą na Wikipedię i zaglądając do naszych edycji na stronie
[Specjalna:Wkład/Jcubic](https://pl.wikipedia.org/wiki/SSpecjalna:Wkład/Jcubic),
widzimy edycje bota:

![historia edycji z opisem "[WikiZEIT Test] Pierwsze uruchomienie bota Hello World przez API"](/img/bot-historia.webp)
<small>historia edycji z opisem "\[WikiZEIT Test] Pierwsze uruchomienie bota Hello World przez API"</small>

A wchodzą na stronę w naszej przestrzeni nazw możemy zobaczyć nasz tekst:

![strona Wikipedysta:Jcubic/HelloBot z tekstem Witaj, Wikipedio!](/img/bot-hello-world.webp)
<small>strona Wikipedysta:Jcubic/HelloBot z tekstem Witaj, Wikipedio!</small>

## Rejestracja konta bota

Jeśli zamierzasz stworzyć prawdziwego bota, musisz zarejestrować nowe konto dla niego.
Jeśli nie chcesz wylogowywać się z Wikipedii, możesz zrobić to w oknie incognito lub
otworzyć inną przeglądarkę.

Po założeniu konta, na stronie użytkownika, musimy wpisać informacje że jest to konto bota:

![Kod strony użytkownika bota Wikipedysta:WikiZEITBot z opisem jego działania](/img/bot-user-page-code.webp)
<small>Kod strony użytkownika bota Wikipedysta:WikiZEITBot z opisem jego działania</small>

Powyższy opis dotyczy mojego bota, którego zacząłem tworzyć razem podczas pisania tego artykułu.

Tak wygląda zapisana strona:

![Wynikowa zapisana strona z banerem, na początku który mówi, że jest to konto bota](/img/bot-user-page.webp)
<small>Wynikowa zapisana strona z banerem, na początku który mówi, że jest to konto bota</small>

Najważniejsze jest dodanie szablonu

{% raw %}
```text
{{Szablon:Bot|Jcubic}}
```
{% endraw %}

Aby poinformować, że jest to bot.

## Legalizacja bota

Następnym wymaganym krokiem jest zgłoszenie naszego bota na stronie
[Wikipedia:Boty/Zgłoszenia](https://pl.wikipedia.org/wiki/Wikipedia:Boty/Zgłoszenia).

Dzięki temu jeden z [Biurokratów](https://pl.wikipedia.org/wiki/Wikipedia:Biurokraci),
doda nam flagi, dzięki którym będziemy mogli używać bota legalnie.

Na stronie ze zgłoszeniami należy kliknąć złóż wniosek:

![Instrukcja jak złożyć wniosek dotyczący bota](/img/bot-request-help.webp)
<small>Instrukcja jak złożyć wniosek dotyczący bota</small>

Wypełnić formularz:

![formularz jako kod wiki](/img/bot-request-code.webp)
<small>formularz jako kod wiki</small>

Tak wyglądał mój wniosek:

![Wynikowy wypełniony formularz z oznaczeniem nowy](/img/bot-request.webp)
<small>Wynikowy wypełniony formularz z oznaczeniem nowy</small>

Warto obserwować [stronę z wnioskami](https://pl.wikipedia.org/wiki/Wikipedia:Boty/Zgłoszenia/Wnioski)
oraz mieć włączone powiadomienia email, gdy obserwowana strona się zmieni.

## Co dalej?

Następny krokiem jest napisanie kodu bota, który zrealizuje cel, jaki chcemy osiągnąć. Moim celem
jest pomoc przewodnikom w monitorowaniu swoich podopiecznych.

### Czym jest Wikimedia Toolforge?

Dobrze jest także uniezależnić bota od własnego komputera. Wikimedia udostępnia specjalne
środowisko chmurowe o nazwie Toolforge. Jego celem jest utrzymywanie narzędzi, które pomagają w
edycji projektów Wikimediów.

Dzięki temu nasz bot może działać nawet, jak nasz komputer nie jest włączony.

## Podsumowanie

Boty to potężne narzędzia, które potrafią w kilka sekund wykonać pracę wymagającą od człowieka wielu
dni żmudnego klikania. Należy pamiętać o słowach mędrca: „[With great power comes great
responsibility](https://en.wikipedia.org/wiki/With_great_power_comes_great_responsibility)”. Automatyzacja
edycji na żywym organizmie, jakim jest Wikipedia, niesie za sobą duże ryzyko. Wadliwy kod w pętli
może w krótkim czasie uszkodzić setki artykułów, dlatego najlepiej jest testować jego działanie w
swoim brudnopisie.

![Stan Lee - Excelsior!](/img/excelsior.webp)
<small>Figurka: Stan Lee - Excelsior!</small>

Informacje na temat mojego bota można znaleźć na [tej stronie](/projekty/wikizeitbot/).
