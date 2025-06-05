<?php
header('Content-Type: application/json; charset=utf-8');
if (empty($_GET['q']))
    exit(json_encode([]));

if (preg_match('/[A-z]/', $_GET['q'])) {
    $q = str_replace('  ', ' ', preg_replace('/[^A-z ]/u', '', $_GET['q']));
    echo json_encode(empty($q) ? [] : get_matches_en($q), JSON_UNESCAPED_UNICODE);
}
else {
    $q = str_replace('  ', ' ', preg_replace('/[^ء-ي ]/u', '', $_GET['q']));
    echo json_encode(empty($q) ? [] : get_matches_ar($q), JSON_UNESCAPED_UNICODE);
}

function get_matches_en($q) {
    $db = new SQLite3('data/ayahs.db');
    $qry = $db->query("SELECT rowid, * FROM ayahs WHERE transliteration LIKE '%$q%'");
    $results = [];
    while (($r = $qry->fetchArray(SQLITE3_NUM)) && count($results) <= 25) {
        $results[] = $r;
    }
    return $results;
}

function get_matches_ar($q) {
    $multi = [
        'ا' => '[اأآإى]', 'أ' => '[أءؤئ]', 'ء' => '[ءأؤئ]',
        'ت' => '[تة]', 'ة' => '[ةته]', 'ه' => '[هة]', 'ى' => '[ىي]'
    ];
    $q_sql = strtr($q, array_map(function() { return '_'; }, $multi));
    $q_re = strtr($q, $multi);

    $db = new SQLite3('data/ayahs.db');
    // imlaaiee_clean, imlaaiee, uthmani, mushaf_font
    $qry = $db->query("SELECT rowid, * FROM ayahs WHERE imlaaiee_clean LIKE '%$q_sql%'");
    $results = [];
    while (($r = $qry->fetchArray(SQLITE3_NUM)) && count($results) <= 25) {
        if (strpos($q_sql, '_') === false || preg_match('/' . $q_re . '/u', $r[1]))
            $results[] = $r;
    }
    return $results;
}
