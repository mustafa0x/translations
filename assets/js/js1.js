suwar = [
    [7, "الفاتحة", "Al-Faatiha", 'The Opening'], [286, "البقرة", "Al-Baqara", 'The Cow'],
    [200, "آل عمران", "Aal-i-Imraan", 'The Family of Imraan'], [176, "النساء", "An-Nisaa", 'The Women'],
    [120, "المائدة", "Al-Maaida", 'The Table'], [165, "الأنعام", "Al-An'aam", 'The Cattle'],
    [206, "الأعراف", "Al-A'raaf", 'The Heights'], [75, "الأنفال", "Al-Anfaal", 'The Spoils of War'],
    [129, "التوبة", "At-Tawba", 'The Repentance'], [109, "يونس", "Yunus", 'Jonas'], 
    [123, "هود", "Hud", 'Hud'], [111, "يوسف", "Yusuf", 'Joseph'], [43, "الرعد", "Ar-Ra'd", 'The Thunder'],
    [52, "إبراهيم", "Ibrahim", 'Abraham'], [99, "الحجر", "Al-Hijr", 'The Rock'], 
    [128, "النحل", "An-Nahl", 'The Bee'], [111, "الإسراء", "Al-Israa", 'The Night Journey'],
    [110, "الكهف", "Al-Kahf", 'The Cave'], [98, "مريم", "Maryam", 'Mary'], [135, "طه", "Taa-Haa", 'Taa-Haa'], 
    [112, "الأنبياء", "Al-Anbiyaa", 'The Prophets'], [78, "الحج", "Al-Hajj", 'The Pilgrimage'],
    [118, "المؤمنون", "Al-Muminoon", 'The Believers'], [64, "النور", "An-Noor", 'The Light'], 
    [77, "الفرقان", "Al-Furqaan", 'The Criterion'], [227, "الشعراء", "Ash-Shu'araa", 'The Poets'],
    [93, "النمل", "An-Naml", 'The Ant'],
    [88, "القصص", "Al-Qasas", 'The Stories'], [69, "العنكبوت", "Al-Ankaboot", 'The Spider'], 
    [60, "الروم", "Ar-Room", 'The Romans'], [34, "لقمان", "Luqman", 'Luqman'], [30, "السجدة", "As-Sajda", 'The Prostration'],
    [73, "الأحزاب", "Al-Ahzaab", 'The Clans'], [54, "سبإ", "Saba", 'Sheba'], 
    [45, "فاطر", "Faatir", 'The Originator'], [83, "يس", "Yaseen", 'Yaseen'],
    [182, "الصافات", "As-Saaffaat", 'Those drawn up in Ranks'], [88, "ص", "Saad", 'The letter Saad'],
    [75, "الزمر", "Az-Zumar", 'The Groups'], [85, "غافر", "Al-Ghaafir", 'The Forgiver'], 
    [54, "فصلت", "Fussilat", 'Explained in detail'], [53, "الشورى", "Ash-Shura", 'Consultation'],
    [89, "الزخرف", "Az-Zukhruf", 'Ornaments of gold'],
    [59, "الدخان", "Ad-Dukhaan", 'The Smoke'], [37, "الجاثية", "Al-Jaathiya", 'Crouching'], 
    [35, "الأحقاف", "Al-Ahqaf", 'The Dunes'], [38, "محمد", "Muhammad", 'Muhammad'], [29, "الفتح", "Al-Fath", 'The Victory'],
    [18, "الحجرات", "Al-Hujuraat", 'The Inner Apartments'], [45, "ق", "Qaaf", 'The letter Qaaf'], 
    [60, "الذاريات", "Adh-Dhaariyat", 'The Winnowing Winds'], [49, "الطور", "At-Tur", 'The Mount'],
    [62, "النجم", "An-Najm", 'The Star'],
    [55, "القمر", "Al-Qamar", 'The Moon'], [78, "الرحمن", "Ar-Rahmaan", 'The Beneficent'], 
    [96, "الواقعة", "Al-Waaqia", 'The Inevitable'], [29, "الحديد", "Al-Hadid", 'The Iron'],
    [22, "المجادلة", "Al-Mujaadila", 'The Pleading Woman'], [24, "الحشر", "Al-Hashr", 'The Exile'], 
    [13, "الممتحنة", "Al-Mumtahana", 'She that is to be examined'], [14, "الصف", "As-Saff", 'The Ranks'],
    [11, "الجمعة", "Al-Jumu'a", 'Friday'], [11, "المنافقون", "Al-Munaafiqoon", 'The Hypocrites'], 
    [18, "التغابن", "At-Taghaabun", 'Mutual Disillusion'], [12, "الطلاق", "At-Talaaq", 'Divorce'],
    [12, "التحريم", "At-Tahrim", 'The Prohibition'], [30, "الملك", "Al-Mulk", 'The Sovereignty'], 
    [52, "القلم", "Al-Qalam", 'The Pen'], [52, "الحاقة", "Al-Haaqqa", 'The Reality'],
    [44, "المعارج", "Al-Ma'aarij", 'The Ascending Stairways'],
    [28, "نوح", "Nooh", 'Noah'], [28, "الجن", "Al-Jinn", 'The Jinn'], 
    [20, "المزمل", "Al-Muzzammil", 'The Enshrouded One'], [56, "المدثر", "Al-Muddaththir", 'The Cloaked One'],
    [40, "القيامة", "Al-Qiyaama", 'The Resurrection'],
    [31, "الإنسان", "Al-Insaan", 'Man'], [50, "المرسلات", "Al-Mursalaat", 'The Emissaries'], 
    [40, "النبإ", "An-Naba", 'The Announcement'], [46, "النازعات", "An-Naazi'aat", 'Those who drag forth'],
    [42, "عبس", "Abasa", 'He frowned'],
    [29, "التكوير", "At-Takwir", 'The Overthrowing'], [19, "الإنفطار", "Al-Infitaar", 'The Cleaving'], 
    [36, "المطففين", "Al-Mutaffifin", 'Defrauding'], [25, "الإنشقاق", "Al-Inshiqaaq", 'The Splitting Open'],
    [22, "البروج", "Al-Burooj", 'The Constellations'], [17, "الطارق", "At-Taariq", 'The Morning Star'], 
    [19, "الأعلى", "Al-A'laa", 'The Most High'], [26, "الغاشية", "Al-Ghaashiya", 'The Overwhelming'],
    [30, "الفجر", "Al-Fajr", 'The Dawn'],
    [20, "البلد", "Al-Balad", 'The City'], [15, "الشمس", "Ash-Shams", 'The Sun'], 
    [21, "الليل", "Al-Lail", 'The Night'], [11, "الضحى", "Ad-Dhuhaa", 'The Morning Hours'],
    [8, "الشرح", "Ash-Sharh", 'The Consolation'],
    [8, "التين", "At-Tin", 'The Fig'], [19, "العلق", "Al-Alaq", 'The Clot'], 
    [5, "القدر", "Al-Qadr", 'The Power, Fate'], [8, "البينة", "Al-Bayyina", 'The Evidence'],
    [8, "الزلزلة", "Az-Zalzala", 'The Earthquake'],
    [11, "العاديات", "Al-Aadiyaat", 'The Chargers'], [11, "القارعة", "Al-Qaari'a", 'The Calamity'], 
    [8, "التكاثر", "At-Takaathur", 'Competition'], [3, "العصر", "Al-Asr", 'The Declining Day, Epoch'],
    [9, "الهمزة", "Al-Humaza", 'The Traducer'],
    [5, "الفيل", "Al-Fil", 'The Elephant'], [4, "قريش", "Quraish", 'Quraysh'], 
    [7, "الماعون", "Al-Maa'un", 'Almsgiving'], [3, "الكوثر", "Al-Kawthar", 'Abundance'],
    [6, "الكافرون", "Al-Kaafiroon", 'The Disbelievers'],
    [3, "النصر", "An-Nasr", 'Divine Support'], [5, "المسد", "Al-Masad", 'The Palm Fibre'], 
    [4, "الإخلاص", "Al-Ikhlaas", 'Sincerity'], [5, "الفلق", "Al-Falaq", 'The Dawn'], [6, "الناس", "An-Naas", 'Mankind'],
]

item_tpl = (d, sa) => `
<div class="col-12 col-sm-8">
  <span class="loc">
    ${suwar[sa['s'] - 1][2]} — ${sa['s']}:${sa['a']}<br>
    ${suwar[sa['s'] - 1][1]} — ${sa['s']}:${sa['a']}
  </span>
  <span class="mushaf-text mushaf-page-${d[5].split(',')[0]}">${d[5].split(',')[1].split('').slice(0, -1).join(' ')}</span>
  <span class="uthmani">﴿${d[4]}﴾</span>
  <span class="transliteration">${d[2]}</span>
  <a href="#${sa['s']}/${sa['a']}" class="trans-link">Translations &raquo;</a>
</div>
`;
mushaf_pg_font_tpl = (n, n_pad) => `
@font-face {
  font-family: 'Mushaf Page ${n}';
  src: local('QCF_P${n_pad}'),
       url(https://cdn.rawgit.com/mustafa0x/qpc-fonts/f93bf5f3/mushaf-woff2/QCF_P${n_pad}.woff2) format('woff2'),
       url(https://cdn.rawgit.com/mustafa0x/qpc-fonts/f93bf5f3/mushaf-woff/QCF_P${n_pad}.woff) format('woff');
}
.mushaf-page-${n} {
  font-family: 'Mushaf Page ${n}';
}
`;
translations = [
    'Saheeh International',
    'Hilali & Khan',
    'Dr. Ghali',
    'Ahmed Ali',
    'Ahmed Raza Khan',
    'Arberry',
    'Daryabadi',
    'Itani',
    'Maududi',
    'Mubarakpuri',
    'Pickthall',
    'Qarai',
    'Qaribullah & Darwish',
    'Sarwar',
    'Shakir',
    'Wahiduddin Khan',
    'Yusuf Ali'
];

let isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
let delay = (() => {
    let timer = 0;
    return (cb, ms) => {
        clearTimeout(timer);
        timer = setTimeout(cb, ms);
    };
})();
$('#results').on('click', '.trans-link', e => show_modal(e.target.getAttribute('href')));
let modal_spinner = $('<div id="modal-spinner" class="spinner"></div>');
function show_modal(href) {
    let [s, a] = href.slice(1).split('/');
    $('.modal-title').text(`Translations of ${s}:${a}`);
    $('.modal-body').html(modal_spinner);
    $('#modal').modal();
    $.getJSON('/trans.php', {s, a}, data => {
        data = data.map((d, i) => `
            <div class="translation">
              <h3>${translations[i]}</h3>
              <p>${d}</p>
            </div>
        `);
        let o = data.slice(0, 3).join('') + `<div class="extra">${data.slice(3).join('')}</div>`
        $('.modal-body').html(o + '<button class="more btn btn-light">more...</button>');
        $('#modal .more').click(e => {
            $(e.target).hide().prev().slideDown();
        });
    });
}
$('#ayah-search').on('input', e => {
    delay(() => {
        $('#ayah-search-spinner').show();
        $('#results').html('');
        $.getJSON('/s.php', {q: e.target.value}, data => {
            $('#ayah-search-spinner').hide();
            data.forEach(d => {
                $('#results').append(item_tpl(d, fns.get_surah_ayah(d[0])));
                let pg = d[5].split(',')[0];
                $(document.head).append(`<style>${mushaf_pg_font_tpl(pg, ('000' + pg).substr(-3, 3))}</style>`);
            });
        });
    }, isTouch ? 550 : 350);
});

let fns = {
    get_surah_ayah (ayah_id) {
        let i = 0;
        while (ayah_id > suwar[i][0])
            ayah_id -= suwar[i++][0];
        return {s: i + 1, a: ayah_id};
    },
    abs_ayahs: (() => {
        let c = 0;
        return suwar.map(x => { let r = c; c += x[0]; return r; });
    })(),
    get_ayah_id: (s, a) => fns.abs_ayahs[s-1] + a
};
