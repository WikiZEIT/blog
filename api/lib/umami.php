<?php

define('UMAMI_URL', 'https://umami.jcubic.pl');
define('UMAMI_WEBSITE_ID', 'c716ef1c-b60b-455c-8279-58996a09a8a6');

function umami_get_client_ip() {
    $headers = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CF_CONNECTING_IP', 'REMOTE_ADDR'];
    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ip = explode(',', $_SERVER[$header])[0];
            return trim($ip);
        }
    }
    return '';
}

function umami_track($url, $title = '', $referrer = '', $name = '', $data = []) {
    $payload = [
        'hostname' => 'wikizeit.edu.pl',
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
    if ($name) {
        $payload['name'] = $name;
    }
    if (!empty($data)) {
        $payload['data'] = $data;
    }

    $body = json_encode(['payload' => $payload, 'type' => 'event']);
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'WikiZEIT/1.0';
    $clientIp = umami_get_client_ip();

    $headers = "Content-Type: application/json\r\n"
        . "User-Agent: " . $userAgent . "\r\n";
    if ($clientIp) {
        $headers .= "X-Forwarded-For: " . $clientIp . "\r\n"
            . "X-Real-IP: " . $clientIp . "\r\n";
    }

    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => $headers,
            'content' => $body,
            'timeout' => 2,
            'ignore_errors' => true,
        ],
    ]);
    @file_get_contents(UMAMI_URL . '/api/send', false, $ctx);
}
