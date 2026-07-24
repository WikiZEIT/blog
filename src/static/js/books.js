/*
 * WikiZEIT – Wikipedia book-search tool (client).
 *
 * Language-agnostic: every language-specific value (field mappings, wiki host,
 * UI strings) is read from the `window.BOOKS_CFG` object injected by the page.
 * The optional `window.BOOKS_MOCK` array powers the `?_debug` offline mode.
 *
 * Copyright (C) 2026 Jakub T. Jankiewicz
 *
 * This file is part of WikiZEIT. WikiZEIT is free software: you can
 * redistribute it and/or modify it under the terms of the GNU Affero General
 * Public License as published by the Free Software Foundation, either version 3
 * of the License, or (at your option) any later version. See
 * https://www.gnu.org/licenses/.
 */
(function() {
    var BOOK_CACHE_TTL = 24 * 60 * 60 * 1000;
    var WIKI_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

    // Active-language config (field mappings, wiki host and UI text) injected by
    // the page; MOCK_DATA is only present in `?_debug` mode.
    var CFG = window.BOOKS_CFG || {};
    var UI = CFG.ui || {};
    var MOCK_DATA = window.BOOKS_MOCK || [];

    var form = document.querySelector('.book-search-box');
    var input = form.querySelector('input[name="q"]');
    var links = document.querySelectorAll('.book-format-link');
    var resultsEl = document.getElementById('book-results');
    var odnCheckbox = document.getElementById('book-odn');
    var currentFormat = 'cytuj_ksiazke';
    var lastBooks = null;

    var params = new URLSearchParams(location.search);
    if (params.get('format') === 'cytuj') {
        currentFormat = 'cytuj';
        links.forEach(function(l) {
            l.classList.toggle('active', l.getAttribute('data-format') === 'cytuj');
        });
    }
    if (params.get('q')) {
        input.value = params.get('q');
    }
    if (params.has('odn') && odnCheckbox) {
        odnCheckbox.checked = params.get('odn') !== '0';
    }

    function getQuotaUser() {
        var key = 'books_quota_user';
        var id = localStorage.getItem(key);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(key, id);
        }
        return id;
    }

    function setFormat(fmt) {
        currentFormat = fmt;
        links.forEach(function(l) {
            l.classList.toggle('active', l.getAttribute('data-format') === fmt);
        });
        var showClass = fmt === 'cytuj' ? 'book-cite-cytuj' : 'book-cite-ksiazke';
        var hideClass = fmt === 'cytuj' ? 'book-cite-ksiazke' : 'book-cite-cytuj';
        resultsEl.querySelectorAll('.' + showClass).forEach(function(el) {
            el.style.display = '';
        });
        resultsEl.querySelectorAll('.' + hideClass).forEach(function(el) {
            el.style.display = 'none';
        });
    }

    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var fmt = link.getAttribute('data-format');
            setFormat(fmt);
            var url = new URL(location.href);
            url.searchParams.set('format', fmt);
            history.replaceState(null, '', url);
        });
    });

    function cacheGet(prefix, key) {
        try {
            var raw = localStorage.getItem(prefix + ':' + key);
            if (!raw) return null;
            var entry = JSON.parse(raw);
            var ttl = prefix === 'wiki' ? WIKI_CACHE_TTL : BOOK_CACHE_TTL;
            if (Date.now() - entry.ts > ttl) {
                localStorage.removeItem(prefix + ':' + key);
                return null;
            }
            return entry.data;
        } catch(e) {
            return null;
        }
    }

    function cacheSet(prefix, key, data) {
        try {
            localStorage.setItem(prefix + ':' + key, JSON.stringify({
                ts: Date.now(),
                data: data
            }));
        } catch(e) {}
    }

    function normalize(str) {
        return str.trim().replace(/\s+/g, ' ');
    }

    function getYear(volumeInfo) {
        if (volumeInfo.publishedDate) {
            var m = volumeInfo.publishedDate.match(/^([0-9]+)/);
            if (m) return m[1];
        }
        return '';
    }

    function getIsbn(volumeInfo) {
        if (!volumeInfo.industryIdentifiers) return null;
        var found = volumeInfo.industryIdentifiers.find(function(id) {
            return id.type === 'ISBN_10';
        });
        return found ? found.identifier : null;
    }

    function getBook(data) {
        var v = data.volumeInfo;
        return {
            isbn: getIsbn(v),
            language: v.language || '',
            authors: v.authors || [],
            title: v.title || '',
            publisher: v.publisher || '',
            year: getYear(v)
        };
    }

    function wikiCheck(article) {
        article = normalize(article);
        var cacheKey = CFG.wiki + ':' + article;
        var cached = cacheGet('wiki', cacheKey);
        if (cached !== null) return Promise.resolve(cached);
        var params = new URLSearchParams({
            action: 'query',
            prop: 'revisions',
            rvprop: 'content',
            format: 'json',
            origin: '*',
            titles: article
        });
        return fetch('https://' + CFG.wiki + '/w/api.php?' + params)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var pages = data.query.pages;
                var exists = false;
                Object.keys(pages).forEach(function(key) {
                    if (pages[key].revisions) exists = true;
                });
                cacheSet('wiki', cacheKey, exists);
                return exists;
            })
            .catch(function() {
                return false;
            });
    }

    function resolveAuthors(book) {
        return Promise.all(book.authors.map(function(author, i) {
            return wikiCheck(author).then(function(exists) {
                return { author: normalize(author), exists: exists, index: i };
            });
        }));
    }

    // Serialize a citation template from the active-language field mapping.
    // `templateKey` selects the template ("cytuj_ksiazke" or "cytuj"); the
    // author style (split first/last vs. single field) also comes from config.
    function serializeTemplate(templateKey, book, authors) {
        var tpl = CFG.templates[templateKey];
        var author = tpl.author;
        var parts = ['{{' + tpl.name, tpl.title + ' = ' + book.title];
        authors.forEach(function(a) {
            var idx = a.index > 0 ? a.index + 1 : '';
            if (author.style === 'split') {
                var nameParts = a.author.split(' ');
                parts.push(author.first + idx + ' = ' + nameParts[0]);
                parts.push(author.last + idx + ' = ' + nameParts.slice(1).join(' '));
                if (a.exists) {
                    parts.push(author.link + idx + ' = ' + a.author);
                }
            } else {
                var key = author.field + (a.index === 0 ? '' : (a.index + 1));
                if (a.exists && author.wikilink) {
                    parts.push(key + ' = [[' + a.author + ']]');
                } else {
                    parts.push(key + ' = ' + a.author);
                }
            }
        });
        parts.push(tpl.year + ' = ' + book.year);
        parts.push(tpl.publisher + ' = ' + book.publisher);
        if (book.isbn) parts.push(tpl.isbn + ' = ' + book.isbn);
        parts.push(tpl.language + ' = ' + book.language);
        if (CFG.odn && odnCheckbox && odnCheckbox.checked) {
            parts.push(CFG.odn.field + ' = ' + CFG.odn.value);
        }
        return parts.join(' |') + '}}';
    }

    function wikiCiteBook(book) {
        return resolveAuthors(book).then(function(authors) {
            return serializeTemplate('cytuj_ksiazke', book, authors);
        });
    }

    function wikiCite(book) {
        return resolveAuthors(book).then(function(authors) {
            return serializeTemplate('cytuj', book, authors);
        });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function formatBookInfo(book) {
        return Promise.all(book.authors.map(function(author) {
            author = normalize(author);
            return wikiCheck(author).then(function(exists) {
                if (exists) {
                    var url = 'https://' + CFG.wiki + '/wiki/' + author.replace(/ /g, '_');
                    return '<a href="' + escapeHtml(url) + '">' + escapeHtml(author) + '</a>';
                }
                return escapeHtml(author);
            });
        })).then(function(authorLinks) {
            var html = '';
            if (authorLinks.length) html += authorLinks.join(', ') + ': ';
            html += '<i>' + escapeHtml(book.title) + '</i>. ';
            html += escapeHtml(book.publisher) + ' ';
            html += escapeHtml(book.year);
            if (book.isbn) {
                var bookSources = encodeURIComponent(CFG.bookSources).replace(/%3A/g, ':');
                var isbnUrl = 'https://' + CFG.wiki + '/wiki/' + bookSources + '/' + book.isbn;
                html += ' <a href="' + escapeHtml(isbnUrl) + '">ISBN ' + escapeHtml(book.isbn) + '</a>';
            }
            return html;
        });
    }

    function renderResults(books) {
        lastBooks = books;
        var fmt = currentFormat;
        resultsEl.innerHTML = '';
        if (!books.length) {
            resultsEl.innerHTML = '<div class="book-no-results">' + escapeHtml(UI.noResults || '') + '</div>';
            return Promise.resolve();
        }
        return Promise.all(books.map(function(book) {
            return Promise.all([
                formatBookInfo(book),
                wikiCiteBook(book),
                wikiCite(book)
            ]).then(function(parts) {
                var div = document.createElement('div');
                div.className = 'book-result';
                var info = document.createElement('div');
                info.className = 'book-result-info';
                info.innerHTML = parts[0];
                var preKsiazke = document.createElement('pre');
                preKsiazke.className = 'book-result-code book-cite-ksiazke';
                preKsiazke.textContent = parts[1];
                if (fmt === 'cytuj') preKsiazke.style.display = 'none';
                var preCytuj = document.createElement('pre');
                preCytuj.className = 'book-result-code book-cite-cytuj';
                preCytuj.textContent = parts[2];
                if (fmt !== 'cytuj') preCytuj.style.display = 'none';
                div.appendChild(info);
                div.appendChild(preKsiazke);
                div.appendChild(preCytuj);
                resultsEl.appendChild(div);
            });
        }));
    }

    var DEBUG = params.has('_debug');

    function mockSearch(query) {
        var q = query.toLowerCase();
        var filtered = MOCK_DATA.filter(function(item) {
            var v = item.volumeInfo;
            var text = (v.title + ' ' + (v.authors || []).join(' ')).toLowerCase();
            return text.indexOf(q) !== -1;
        });
        return new Promise(function(resolve) {
            setTimeout(function() { resolve(filtered.map(getBook)); }, 300);
        });
    }

    function searchBooks(query) {
        var cached = cacheGet('books', query);
        if (cached) return Promise.resolve(cached);
        if (DEBUG) return mockSearch(query);
        var apiParams = new URLSearchParams({
            api: '1',
            q: query,
            quotaUser: getQuotaUser()
        });
        return fetch(location.pathname + '?' + apiParams)
            .then(function(r) {
                if (r.status === 429) {
                    return Promise.reject(new Error('rate-limit'));
                }
                if (r.status === 503) {
                    return Promise.reject(new Error('unavailable'));
                }
                if (!r.ok) {
                    return Promise.reject(new Error('api-error'));
                }
                return r.json();
            })
            .then(function(data) {
                if (!data.items) return [];
                return data.items;
            })
            .then(function(items) {
                var books = items.map(getBook);
                if (books.length) {
                    cacheSet('books', query, books);
                }
                return books;
            });
    }

    function doSearch(query) {
        if (!query) return;
        var url = new URL(location.href);
        url.searchParams.set('q', query);
        url.searchParams.set('format', currentFormat);
        if (odnCheckbox) url.searchParams.set('odn', odnCheckbox.checked ? '1' : '0');
        history.replaceState(null, '', url);
        resultsEl.innerHTML = '<div class="book-loading"><div class="book-spinner"></div>' + escapeHtml(UI.loading || '') + '</div>';
        searchBooks(query).then(renderResults).catch(function(err) {
            var errors = UI.errors || {};
            var msg;
            if (err && err.message === 'rate-limit') {
                msg = errors.rateLimit;
            } else if (err && err.message === 'unavailable') {
                msg = errors.unavailable;
            } else {
                msg = errors.generic;
            }
            resultsEl.innerHTML = '<div class="book-no-results">' + escapeHtml(msg || '') + '</div>';
        });
    }

    if (odnCheckbox) {
        odnCheckbox.addEventListener('change', function() {
            var url = new URL(location.href);
            url.searchParams.set('odn', odnCheckbox.checked ? '1' : '0');
            history.replaceState(null, '', url);
            if (lastBooks) renderResults(lastBooks);
        });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        doSearch(input.value.trim());
    });

    if (params.get('q')) {
        doSearch(params.get('q'));
    }
})();
