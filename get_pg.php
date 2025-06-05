<?php
require 'lib.php';
header('Content-Type: application/json; charset=utf-8');
if (empty($_GET['s']) || empty($_GET['a']))
    exit('{}');

$surah_no = int_bound(intval($_GET['s']), 114);
$ayah_no = int_bound(intval($_GET['a']), $ayahs[$surah_no-1]);
$ayah_id = get_ayah_id($surah_no, $ayah_no);

$db = new SQLite3('data/translations.db');
$qry = $db->query('SELECT * FROM translations WHERE rowid=' . $ayah_id);
echo json_encode($qry->fetchArray(SQLITE3_NUM), JSON_UNESCAPED_UNICODE);
