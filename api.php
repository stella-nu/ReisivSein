<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$dataFile = __DIR__ . '/visits.json';

if (!file_exists($dataFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Andmefail puudub.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$json = file_get_contents($dataFile);
$data = json_decode($json, true);

if (!is_array($data)) {
    http_response_code(500);
    echo json_encode(['error' => 'Andmefaili formaat ei ole korrektne.'], JSON_UNESCAPED_UNICODE);
    exit;
}

function lowerText($value)
{
    $text = (string)$value;
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($text, 'UTF-8');
    }

    return strtolower($text);
}

function containsText($haystack, $needle)
{
    if ($needle === '') {
        return true;
    }

    return strpos($haystack, $needle) !== false;
}

$riik = isset($_GET['riik']) ? trim((string)$_GET['riik']) : '';
$aasta = isset($_GET['aasta']) ? trim((string)$_GET['aasta']) : '';
$otsi = isset($_GET['otsi']) ? trim((string)$_GET['otsi']) : '';

$result = array_values(array_filter($data, function ($item) use ($riik, $aasta, $otsi) {
    $riigiNimi = isset($item['riik']) ? lowerText($item['riik']) : '';
    $matchRiik = $riik === '' || ($riigiNimi !== '' && $riigiNimi === lowerText($riik));
    $matchAasta = $aasta === '' || (isset($item['aasta']) && (string)$item['aasta'] === $aasta);

    $haystack = lowerText(
        implode(' ', [
            $item['riik'] ?? '',
            $item['linn'] ?? '',
            $item['kirjeldus'] ?? ''
        ])
    );
    $matchOtsi = containsText($haystack, lowerText($otsi));

    return $matchRiik && $matchAasta && $matchOtsi;
}));

$riigid = [];
$aastad = [];
$statistika = [];

foreach ($data as $item) {
    if (!empty($item['riik'])) {
        $riigid[$item['riik']] = true;
        $statistika[$item['riik']] = ($statistika[$item['riik']] ?? 0) + 1;
    }
    if (!empty($item['aasta'])) {
        $aastad[(string)$item['aasta']] = true;
    }
}

ksort($riigid, SORT_NATURAL | SORT_FLAG_CASE);
krsort($aastad, SORT_NATURAL);
arsort($statistika, SORT_NUMERIC);

echo json_encode([
    'items' => $result,
    'meta' => [
        'kogus' => count($result),
        'koikKokku' => count($data),
        'riigid' => array_keys($riigid),
        'aastad' => array_keys($aastad),
        'statistika' => $statistika
    ]
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
