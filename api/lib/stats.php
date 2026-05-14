<?php

define('STATS_FILE', __DIR__ . '/../logs/stats.json');

function loadStats() {
    if (!file_exists(STATS_FILE)) {
        return [];
    }
    $data = json_decode(file_get_contents(STATS_FILE), true);
    return is_array($data) ? $data : [];
}

function saveStats($stats) {
    $dir = dirname(STATS_FILE);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
    file_put_contents(STATS_FILE, json_encode($stats, JSON_PRETTY_PRINT), LOCK_EX);
}

function recordSubmission($form, $email) {
    $stats = loadStats();
    $hash = hash('sha256', strtolower(trim($email)));

    if (!isset($stats[$form])) {
        $stats[$form] = ['total' => 0, 'emails' => [], 'last' => null];
    }

    $stats[$form]['total']++;
    $stats[$form]['last'] = date('Y-m-d H:i:s');

    if (!in_array($hash, $stats[$form]['emails'])) {
        $stats[$form]['emails'][] = $hash;
    }

    saveStats($stats);
}

function parseBotLog() {
    $logFile = dirname(__DIR__) . '/logs/bot.log';
    $result = [
        'total' => 0,
        'by_form' => [],
        'last' => null,
    ];

    if (!file_exists($logFile)) {
        return $result;
    }

    $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $result['total'] = count($lines);

    foreach ($lines as $line) {
        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[(\w+)\]/', $line, $m)) {
            $form = $m[1];
            if (!isset($result['by_form'][$form])) {
                $result['by_form'][$form] = 0;
            }
            $result['by_form'][$form]++;
        }
    }

    if (!empty($lines)) {
        $lastLine = end($lines);
        if (preg_match('/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/', $lastLine, $m)) {
            $result['last'] = $m[1];
        }
        $result['last_entry'] = $lastLine;
    }

    return $result;
}
