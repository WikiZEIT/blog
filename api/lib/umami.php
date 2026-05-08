<?php

define('UMAMI_URL', 'https://umami.jcubic.pl');
define('UMAMI_WEBSITE_ID', 'c716ef1c-b60b-455c-8279-58996a09a8a6');

function umami_track($url, $title = '', $referrer = '') {
    $payload = [
        'hostname' => 'wikizeit.jcubic.pl',
        'language' => $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'pl',
        'url' => $url,
        'website' => UMAMI_WEBSITE_ID,
    ];
    if ($title) {
        $payload['title'] = $title;
    }
    if ($referrer) {
        $payload['referrer'] = $referrer;
    }

    $body = json_encode(['payload' => $payload, 'type' => 'event']);
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'WikiZEIT/1.0';

    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\nUser-Agent: " . $userAgent . "\r\n",
            'content' => $body,
            'timeout' => 2,
            'ignore_errors' => true,
        ],
    ]);
    @file_get_contents(UMAMI_URL . '/api/send', false, $ctx);
}
