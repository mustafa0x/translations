lbls = {
    verified: '<span class="lbl verified" data-toggle="tooltip" title="This translation is generally accurate and without major issues.">✓</span>',
    'has-issues': '<span class="lbl has-issues" data-toggle="tooltip" title="This translation is known to have issues."></span>',
    unknown: '<span class="lbl unknown" data-toggle="tooltip" title="This translation\'s quality is unknown."></span>',
    qpc: '<span class="lbl qpc" data-toggle="tooltip" title="This translation is published by the Qur\'an Printing Complex in Medinah, KSA.">QPC</span>',
    pdf: '<span class="lbl pdf">PDF</span>',
    info: '<span class="lbl info" data-toggle="popover" data-trigger="focus" data-content="Disabled popover"></span>',
    dl: '<a href="#" class="lbl dl"></a>',
}
let cat_tpl = (id, t, langs) => `
<div class="row justify-content-center" id="region-${id}">
  <div class="col-12"><h2>${t}</h2></div>
  ${langs.join('')}
</div>`;
let lang_tpl = (c, d, items) => `
<div class="col-4" id="lang-${d[0]}">
  <div class="card">
    <div class="card-body">
      <h3 class="card-title">${d[1]} ${flag_tpl(c)}</h3>
      <h4>(${d[2]} · ${d[3]})</h4>
    </div>
    <ul class="list-group list-group-flush">
      ${items.map(x => '<li class="list-group-item">'+x+'</li>').join('')}
    </ul>
  </div>
</div>`;
let flag_tpl = c => c ? `<img src="https://cdn.rawgit.com/hjnilsson/country-flags/6dc35d6c/svg/${c}.svg">` : '';
let item_tpl = (d, attrs) => `
<div class="lbl-cont">${attrs.map(x => lbls[x]).join(' ')}</div>
<a class="src ${attrs.map(x => 'p-' + x).join(' ')}" data-src="${d[0]}" data-pages="${d[1].pages || ''}" data-ext="${d[1].ext || ''}" href="#${d[0]}">
  <div class="src-title">${d[1].auth}</div>
  <div class="author"></div>
</a>`;
function load_frame(el) {
    var ds = el.dataset,
        isMobile = $(window).width() <= 600,
        pg = 1, frame, url;
    if (el.dataset.pages)
        url = `/br.html#dir/${ds.src.split('.')[1]}/ext/${ds.ext || 'png'}/pages/${ds.pages}/page/${pg}/mode/1up`;
    else
        url = 'https://docs.google.com/viewer?embedded=true&url=http://qbahth.com/qpcm/pdf/' + ds.src.split('.')[1] + '.pdf';
    frame = $(`<iframe src="${url}" id="frame"></iframe>`);
    frame.hide();
    if (isMobile)
        frame.addClass('full-screen');
    $(isMobile ? 'body' : '#modal .modal-body').append(frame);
    $(window).resize(frame_resize);
    frame.one('load', function() {
        frame.width($('.modal-body').width()).height($(window).innerHeight() - 250).show();
        frame[0].contentWindow.br.resizePageView1up();
        if ($(window).width() <= 400)
            setTimeout(function() {
                frame[0].contentWindow.br.zoom(1);
                frame[0].contentWindow.br.zoom(1);
            }, 500);
    });
}
function frame_resize() {
    var frame = $('#frame');
    frame.width('100%');
    frame.height($(window).innerHeight() - 250);
    if (frame[0].contentWindow.br)
        frame[0].contentWindow.br.resizePageView1up();
}
function frame_close() {
    $('#frame').remove();
    $(window).off('resize', frame_resize);
}
window.addEventListener('popstate', () => {
    if ($('#modal')[0])
        $('#modal').modal('hide');
});

$.each(regions, (k, v) => {
    let langs = v[2].map(ln_ar => {
        if (!srcs[ln_ar[1]]) {
            console.log(ln_ar[1]);
            return;
        }
        let items = srcs[ln_ar[1]].map(x => item_tpl(x, x[1].attrs)); // ['info', 'dl'].concat(x[1].attrs)
        return lang_tpl(ln_ar[0], ln_ar.slice(1), items);
    });
    $('#main').append(cat_tpl(k, `${v[0]} · ${v[1]}`, langs));
});
$('#main [data-toggle="tooltip"]').tooltip(); //{container: 'body'}
$('#main [data-toggle="popover"]').popover();
$('.card-title img').click(e => {
// https://en.m.wikipedia.org/wiki/ISO_639:mnk
});
$('.card-body h4').click(e => {
// https://en.m.wikipedia.org/wiki/ISO_3166-1:ZA
});

$('a.src').click(e => {
    // $('.modal-title').text($('#container h1').text() + ' – ' + title);
    $('#modal').modal();
    load_frame(e.currentTarget);
});


