<?php
$ayahs = array_map(function($v){ return $v[0]; }, json_decode(file_get_contents('suwar.json'), true));
$ayahs_sum = array();
function get_surah_ayah($ayah_id) {
    global $ayahs;
    $i = 0;
    while ($ayah_id > $ayahs[$i])
        $ayah_id -= $ayahs[$i++];
    return array($i + 1, $ayah_id);
}
function get_ayah_id($s, $a) {
    global $ayahs_sum, $ayahs;
    if (!$ayahs_sum) {
        $i = 0;
        foreach ($ayahs as $surah => $count) {
            $ayahs_sum[] = $i;
            $i += $count;
        }
    }
    return $ayahs_sum[$s-1] + $a;
}

function int_bound($int, $max, $min=1) {
    return max(min($int, $max), $min);
}
