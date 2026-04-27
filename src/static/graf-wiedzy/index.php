<?php
$apiKey = json_decode(file_get_contents("./config.json"));
$query = isset($_GET['q']) ? $_GET['q'] : '';
$results = null;

if ($query) {
    $params = [
        'query' => $query,
        'key'   => $apiKey,
        'limit' => 20,
        'indent' => 'True',
        'languages' => 'pl'
    ];

    $url = "https://kgsearch.googleapis.com/v1/entities:search?" . http_build_query($params);

    $response = file_get_contents($url);
    if ($response) {
        $results = json_decode($response, true);
    }
}
?>
<!DOCTYPE html>
<html class="dark" lang="pl">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Wyszukiwarka wpisów w Grafie Wiedzy Google – WikiZEIT</title>
<meta name="description" content="Sprawdź, czy dana osoba, firma lub pojęcie ma wpis w Google Knowledge Graph. Narzędzie SEO od WikiZEIT.">
<link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
<link rel="shortcut icon" href="/favicon/favicon.ico" />
<link rel="canonical" href="https://wikizeit.jcubic.pl/graf-wiedzy/" />
<meta property="og:url" content="https://wikizeit.jcubic.pl/graf-wiedzy/" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="pl_PL" />
<meta property="og:site_name" content="WikiZEIT" />
<meta property="og:title" content="Wyszukiwarka wpisów w Grafie Wiedzy Google – WikiZEIT" />
<meta property="og:description" content="Sprawdź, czy dana osoba, firma lub pojęcie ma wpis w Google Knowledge Graph." />
<meta property="og:image" content="https://wikizeit.jcubic.pl/img/social-card.png" />
<link rel="stylesheet" href="/css/style.css" />
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=block" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&amp;display=swap" rel="stylesheet"/>
<style>
.kg-tool {
    max-width: var(--max-width-content);
    margin: 0 auto;
    padding: 4rem 1.5rem 6rem;
}

.kg-tool h1 {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--color-slate-100);
    margin-bottom: 0.5rem;
}

@media (min-width: 768px) {
    .kg-tool h1 {
        font-size: 2.5rem;
    }
}

.kg-tool-desc {
    color: var(--color-slate-400);
    font-size: 1rem;
    margin-bottom: 2.5rem;
    line-height: 1.6;
}

.kg-tool-desc a {
    color: var(--color-link);
    text-decoration: none;
}

.kg-tool-desc a:hover {
    text-decoration: underline;
}

.kg-search-card {
    background-color: rgba(180, 33, 4, 0.05);
    border: 1px solid rgba(180, 33, 4, 0.15);
    border-radius: var(--border-radius-2xl);
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.kg-search-box {
    display: flex;
    gap: 0.75rem;
}

.kg-search-box input[type="text"] {
    flex: 1;
    padding: 0.875rem 1.25rem;
    border: 1px solid rgba(180, 33, 4, 0.2);
    border-radius: var(--border-radius-full);
    background-color: rgba(26, 14, 12, 0.6);
    color: var(--color-slate-100);
    font-size: 1rem;
    font-family: var(--font-display);
    outline: none;
    transition: border-color 0.2s;
}

.kg-search-box input[type="text"]::placeholder {
    color: var(--color-slate-500);
}

.kg-search-box input[type="text"]:focus {
    border-color: var(--color-primary);
}

.kg-search-box button {
    padding: 0.875rem 2rem;
    background-color: var(--color-primary);
    color: var(--color-white);
    border: none;
    border-radius: var(--border-radius-full);
    font-size: 1rem;
    font-weight: 700;
    font-family: var(--font-display);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
}

.kg-search-box button:hover {
    transform: scale(1.02);
    box-shadow: 0 10px 15px -3px rgba(180, 33, 4, 0.2);
}

.kg-stats {
    color: var(--color-slate-400);
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
}

.kg-result {
    background-color: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(180, 33, 4, 0.1);
    border-radius: var(--border-radius-xl);
    padding: 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
    transition: border-color 0.2s;
}

.kg-result:hover {
    border-color: rgba(180, 33, 4, 0.3);
}

.kg-result-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--border-radius-lg);
    background-color: rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
}

.kg-result-image-placeholder {
    width: 80px;
    height: 80px;
    border-radius: var(--border-radius-lg);
    background-color: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-slate-600);
    font-size: 0.75rem;
    flex-shrink: 0;
}

.kg-result-content {
    flex: 1;
    min-width: 0;
}

.kg-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
}

.kg-result-type {
    font-size: 0.75rem;
    color: var(--color-slate-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.kg-score {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-primary);
    background-color: rgba(180, 33, 4, 0.1);
    padding: 0.125rem 0.5rem;
    border-radius: var(--border-radius-full);
    white-space: nowrap;
    cursor: help;
}

.kg-result-name {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-slate-100);
    margin: 0 0 0.5rem 0;
}

.kg-result-desc {
    font-size: 0.9rem;
    color: var(--color-slate-400);
    line-height: 1.6;
    margin: 0 0 0.75rem 0;
}

.kg-result-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    color: var(--color-primary);
    text-decoration: none;
    border: 1px solid rgba(180, 33, 4, 0.3);
    padding: 0.375rem 0.75rem;
    border-radius: var(--border-radius-full);
    transition: all 0.2s;
}

.kg-result-link:hover {
    background-color: rgba(180, 33, 4, 0.05);
}

@media (max-width: 600px) {
    .kg-search-box {
        flex-direction: column;
    }
    .kg-result {
        flex-direction: column;
        align-items: stretch;
    }
    .kg-result-image,
    .kg-result-image-placeholder {
        width: 100%;
        height: 160px;
    }
}
</style>
<script>
(function() {
    document.documentElement.classList.add('icons-hidden');
    function icons_ready() {
        document.documentElement.classList.remove('icons-hidden');
    }
    if (document.fonts && document.fonts.ready) {
        var font = '24px "Material Symbols Outlined"';
        document.fonts.load(font).then(icons_ready);
    } else {
        icons_ready();
    }
})();
</script>
</head>
<body>
<svg aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="social-icon-github" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </symbol>
    <symbol id="social-icon-x" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </symbol>
    <symbol id="social-icon-rss" viewBox="0 0 24 24">
      <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795 0 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-8.18v4.819c12.951.115 23.403 10.617 23.46 23.625h4.54c-.058-15.629-12.702-28.308-28-28.444z"/>
    </symbol>
  </defs>
</svg>

<nav class="site-nav">
  <div class="nav-container">
    <div class="nav-logo">
      <a href="/"><img src="/img/logo.svg" alt="WikiZEIT logo" class="logo-image" /></a>
    </div>
    <div class="nav-links">
      <a class="nav-link" href="/blog/">Blog</a>
      <a class="nav-link" href="/oferta/">Szkolenia i Konsultacje</a>
      <a class="nav-link" href="/about/">O projekcie</a>
      <a class="nav-cta" href="/contact/">Kontakt</a>
    </div>
    <button class="menu-button">
      <span class="material-symbols-outlined">menu</span>
    </button>
  </div>
</nav>

<main class="kg-tool">
    <h1>Wyszukiwarka wpisów w Grafie Wiedzy Google</h1>
    <p class="kg-tool-desc">
        Sprawdź, czy dana osoba, firma lub pojęcie posiada wpis w
        <a href="https://en.wikipedia.org/wiki/Google_Knowledge_Graph" target="_blank" rel="noopener">Google Knowledge Graph</a>.
        Dowiedz się więcej o roli Grafu Wiedzy w SEO na naszym blogu:
        <a href="/blog/wikipedia-enterprise/">Wikimedia Enterprise i SEO</a>,
        <a href="/blog/dane-strukturalne-schema-org/">Dane strukturalne Schema.org</a>.
    </p>

    <div class="kg-search-card">
        <form class="kg-search-box" method="GET">
            <input type="text" name="q" placeholder="Wpisz nazwę osoby, firmy lub pojęcia..." value="<?php echo htmlspecialchars($query); ?>">
            <button type="submit">Szukaj</button>
        </form>
    </div>

    <?php if ($results && isset($results['itemListElement'])): ?>
        <div class="kg-stats">
            Znaleziono: <?php echo count($results['itemListElement']); ?> wyników.
            <strong>Score</strong> &ndash; współczynnik trafności. Im wyższy, tym lepsze dopasowanie
            do zapytania. Wartość jest relatywna &ndash; porównuj wyniki w obrębie jednego wyszukiwania.
        </div>

        <?php foreach ($results['itemListElement'] as $item):
            $entity = $item['result'];
            $score = $item['resultScore'] ?? 0;
            $name = $entity['name'] ?? 'Brak nazwy';
            $types = isset($entity['@type']) ? implode(', ', $entity['@type']) : 'Encja';
            $shortDesc = $entity['description'] ?? '';
            $detailedDesc = $entity['detailedDescription']['articleBody'] ?? '';
            $imageUrl = $entity['image']['contentUrl'] ?? null;
            $kgId = str_replace('kg:', '', $entity['@id']);
            $googleSearchUrl = "https://www.google.com/search?kgmid=" . urlencode($kgId);
        ?>
            <div class="kg-result">
                <?php if ($imageUrl): ?>
                    <img src="<?php echo htmlspecialchars($imageUrl); ?>" class="kg-result-image" alt="<?php echo htmlspecialchars($name); ?>">
                <?php else: ?>
                    <div class="kg-result-image-placeholder">
                        <span class="material-symbols-outlined">image</span>
                    </div>
                <?php endif; ?>

                <div class="kg-result-content">
                    <div class="kg-result-header">
                        <div class="kg-result-type"><?php echo htmlspecialchars($types); ?></div>
                        <div class="kg-score" title="Współczynnik trafności – im wyższa wartość, tym lepsze dopasowanie do zapytania">Score: <?php echo number_format($score, 1); ?></div>
                    </div>
                    <h2 class="kg-result-name"><?php echo htmlspecialchars($name); ?></h2>
                    <p class="kg-result-desc">
                        <?php if ($shortDesc): ?><strong><?php echo htmlspecialchars($shortDesc); ?></strong>. <?php endif; ?>
                        <?php echo htmlspecialchars($detailedDesc); ?>
                    </p>
                    <a href="<?php echo htmlspecialchars($googleSearchUrl); ?>" target="_blank" rel="noopener" class="kg-result-link">
                        Otwórz w Google (ID: <?php echo htmlspecialchars($kgId); ?>)
                    </a>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</main>

<footer class="site-footer">
  <div class="footer-container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="footer-logo">
          <a href="/"><img src="/img/logo.svg" alt="WikiZEIT logo" class="footer-logo-image" /></a>
        </div>
        <div class="footer-description">
          <p>Edukacyjny projekt dla specjalistów od etycznego SEO w Wikipedii.</p>
        </div>
      </div>
      <div class="footer-section">
        <h4 class="footer-section-title">Nawigacja</h4>
        <ul class="footer-links-list">
          <li><a href="/blog/">Blog</a></li>
          <li><a href="/about/">O projekcie</a></li>
          <li><a href="/contact/">Kontakt</a></li>
          <li><a href="/oferta/">Oferta</a></li>
          <li><a href="/graf-wiedzy/">Graf Wiedzy</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h4 class="footer-section-title">Kontakt</h4>
        <ul class="footer-links-list">
          <li class="footer-contact-item">
            <span class="material-symbols-outlined">mail</span>
            wikizeit [@] jcubic [.] pl
          </li>
          <li class="footer-contact-item">
            <span class="material-symbols-outlined">groups</span>
            <a href="https://www.linkedin.com/company/wikizeit/">WikiZEIT on LinkedIn</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-copyright">
        &copy; 2024 WikiZEIT. Treść dostępna na licencji <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="nofollow">CC BY-SA 4.0</a>.
      </p>
      <div class="footer-social">
        <a href="https://github.com/WikiZEIT/blog" aria-label="GitHub">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><use href="#social-icon-github"></use></svg>
        </a>
        <a href="https://x.com/jcubic" aria-label="Twitter/X">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><use href="#social-icon-x"></use></svg>
        </a>
        <a href="/feed.xml" aria-label="RSS">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><use href="#social-icon-rss"></use></svg>
        </a>
      </div>
    </div>
  </div>
</footer>

<div class="mobile-nav">
  <div class="mobile-nav-container">
    <a class="mobile-nav-link" href="/">
      <span class="material-symbols-outlined">home</span>
      <span class="mobile-nav-text">Start</span>
    </a>
    <a class="mobile-nav-link" href="/blog/">
      <span class="material-symbols-outlined">article</span>
      <span class="mobile-nav-text">Blog</span>
    </a>
    <a class="mobile-nav-link" href="/contact/">
      <span class="material-symbols-outlined">mail</span>
      <span class="mobile-nav-text">Kontakt</span>
    </a>
  </div>
</div>

<script>
document.querySelector('.menu-button').addEventListener('click', function() {
    document.querySelector('.nav-links').classList.toggle('open');
});
</script>
</body>
</html>
