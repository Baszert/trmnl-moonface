/* Moonface: the page controller. Works out tonight's Moon (luna.js), draws the big ball and a week of small ones
   (moonface.js), and fills in the words. Edit this file, then run: node dev/build.mjs */
!function () {
  var D2R = Math.PI / 180, TAU = 2 * Math.PI, DAY = 864e5;
  var TEX = window.MF_TEX || 'https://baszert.github.io/trmnl-moon/';
  var FEATURES = /*FEATURES*/[];   // [name, latitude, longitude, diameter km, fame]

  /* ---------- text ---------- */
  var L = {
    en: { ph: ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'], lit: '{p}% lit', day: 'day {d}', rise: 'Moonrise', set: 'Moonset', dist: 'Distance', full: 'Full moon', nw: 'New moon', today: 'today', tmr: 'tomorrow', inn: 'in {n} days', sunrise: 'Sunrise on', sunset: 'Sunset on', look: 'Look for', setup: 'Set your location in the plugin settings', none: 'No moon data right now' },
    nl: { ph: ['Nieuwe maan', 'Wassende sikkel', 'Eerste kwartier', 'Wassende maan', 'Volle maan', 'Afnemende maan', 'Laatste kwartier', 'Afnemende sikkel'], lit: '{p}% verlicht', day: 'dag {d}', rise: 'Maanopkomst', set: 'Maanondergang', dist: 'Afstand', full: 'Volle maan', nw: 'Nieuwe maan', today: 'vandaag', tmr: 'morgen', inn: 'over {n} dagen', sunrise: 'Zonsopkomst op', sunset: 'Zonsondergang op', look: 'Kijk naar', setup: 'Stel je locatie in bij de plugin-instellingen', none: 'Even geen maangegevens' },
    de: { ph: ['Neumond', 'Zunehmende Sichel', 'Erstes Viertel', 'Zunehmender Mond', 'Vollmond', 'Abnehmender Mond', 'Letztes Viertel', 'Abnehmende Sichel'], lit: '{p}% beleuchtet', day: 'Tag {d}', rise: 'Mondaufgang', set: 'Monduntergang', dist: 'Entfernung', full: 'Vollmond', nw: 'Neumond', today: 'heute', tmr: 'morgen', inn: 'in {n} Tagen', sunrise: 'Sonnenaufgang bei', sunset: 'Sonnenuntergang bei', look: 'Schau nach', setup: 'Standort in den Plugin-Einstellungen festlegen', none: 'Gerade keine Monddaten' },
    fr: { ph: ['Nouvelle lune', 'Premier croissant', 'Premier quartier', 'Gibbeuse croissante', 'Pleine lune', 'Gibbeuse décroissante', 'Dernier quartier', 'Dernier croissant'], lit: '{p} % éclairée', day: 'jour {d}', rise: 'Lever', set: 'Coucher', dist: 'Distance', full: 'Pleine lune', nw: 'Nouvelle lune', today: 'aujourd’hui', tmr: 'demain', inn: 'dans {n} jours', sunrise: 'Lever du soleil sur', sunset: 'Coucher du soleil sur', look: 'À observer', setup: 'Indiquez votre lieu dans les réglages du plugin', none: 'Pas de données lunaires' },
    es: { ph: ['Luna nueva', 'Luna creciente', 'Cuarto creciente', 'Gibosa creciente', 'Luna llena', 'Gibosa menguante', 'Cuarto menguante', 'Luna menguante'], lit: '{p}% iluminada', day: 'día {d}', rise: 'Salida', set: 'Puesta', dist: 'Distancia', full: 'Luna llena', nw: 'Luna nueva', today: 'hoy', tmr: 'mañana', inn: 'en {n} días', sunrise: 'Amanecer en', sunset: 'Atardecer en', look: 'Busca', setup: 'Indica tu ubicación en los ajustes del plugin', none: 'Sin datos de la Luna' },
    it: { ph: ['Luna nuova', 'Luna crescente', 'Primo quarto', 'Gibbosa crescente', 'Luna piena', 'Gibbosa calante', 'Ultimo quarto', 'Luna calante'], lit: '{p}% illuminata', day: 'giorno {d}', rise: 'Sorge', set: 'Tramonta', dist: 'Distanza', full: 'Luna piena', nw: 'Luna nuova', today: 'oggi', tmr: 'domani', inn: 'tra {n} giorni', sunrise: 'Alba su', sunset: 'Tramonto su', look: 'Cerca', setup: 'Imposta la posizione nelle impostazioni del plugin', none: 'Nessun dato sulla Luna' },
    pt: { ph: ['Lua nova', 'Lua crescente', 'Quarto crescente', 'Crescente gibosa', 'Lua cheia', 'Minguante gibosa', 'Quarto minguante', 'Lua minguante'], lit: '{p}% iluminada', day: 'dia {d}', rise: 'Nascer', set: 'Pôr', dist: 'Distância', full: 'Lua cheia', nw: 'Lua nova', today: 'hoje', tmr: 'amanhã', inn: 'em {n} dias', sunrise: 'Nascer do sol em', sunset: 'Pôr do sol em', look: 'Procura', setup: 'Defina a localização nas definições do plugin', none: 'Sem dados da Lua' },
    sv: { ph: ['Nymåne', 'Tilltagande skära', 'Första kvarteret', 'Tilltagande måne', 'Fullmåne', 'Avtagande måne', 'Sista kvarteret', 'Avtagande skära'], lit: '{p}% belyst', day: 'dag {d}', rise: 'Månuppgång', set: 'Månnedgång', dist: 'Avstånd', full: 'Fullmåne', nw: 'Nymåne', today: 'i dag', tmr: 'imorgon', inn: 'om {n} dagar', sunrise: 'Soluppgång vid', sunset: 'Solnedgång vid', look: 'Titta på', setup: 'Ange din plats i pluginens inställningar', none: 'Inga mondata just nu' },
    da: { ph: ['Nymåne', 'Tiltagende segl', 'Første kvarter', 'Tiltagende måne', 'Fuldmåne', 'Aftagende måne', 'Sidste kvarter', 'Aftagende segl'], lit: '{p}% oplyst', day: 'dag {d}', rise: 'Måneopgang', set: 'Månenedgang', dist: 'Afstand', full: 'Fuldmåne', nw: 'Nymåne', today: 'i dag', tmr: 'i morgen', inn: 'om {n} dage', sunrise: 'Solopgang ved', sunset: 'Solnedgang ved', look: 'Se efter', setup: 'Angiv din placering i pluginnets indstillinger', none: 'Ingen månedata lige nu' },
    nb: { ph: ['Nymåne', 'Voksende månesigd', 'Første kvarter', 'Voksende måne', 'Fullmåne', 'Minkende måne', 'Siste kvarter', 'Minkende månesigd'], lit: '{p}% opplyst', day: 'dag {d}', rise: 'Månoppgang', set: 'Månenedgang', dist: 'Avstand', full: 'Fullmåne', nw: 'Nymåne', today: 'i dag', tmr: 'i morgen', inn: 'om {n} dager', sunrise: 'Soloppgang ved', sunset: 'Solnedgang ved', look: 'Se etter', setup: 'Angi stedet ditt i innstillingene for pluginen', none: 'Ingen månedata akkurat nå' },
    pl: { ph: ['Nów', 'Rosnący sierp', 'Pierwsza kwadra', 'Rosnący garb', 'Pełnia', 'Malejący garb', 'Ostatnia kwadra', 'Malejący sierp'], lit: '{p}% oświetlony', day: 'dzień {d}', rise: 'Wschód', set: 'Zachód', dist: 'Odległość', full: 'Pełnia', nw: 'Nów', today: 'dziś', tmr: 'jutro', inn: 'za {n} dni', sunrise: 'Wschód Słońca na', sunset: 'Zachód Słońca na', look: 'Szukaj', setup: 'Ustaw lokalizację w ustawieniach wtyczki', none: 'Brak danych o Księżycu' },
    fi: { ph: ['Uusikuu', 'Kasvava sirppi', 'Ensimmäinen neljännes', 'Kasvava kuu', 'Täysikuu', 'Vähenevä kuu', 'Viimeinen neljännes', 'Vähenevä sirppi'], lit: '{p}% valaistu', day: 'päivä {d}', rise: 'Kuu nousee', set: 'Kuu laskee', dist: 'Etäisyys', full: 'Täysikuu', nw: 'Uusikuu', today: 'tänään', tmr: 'huomenna', inn: '{n} päivän päästä', sunrise: 'Auringonnousu:', sunset: 'Auringonlasku:', look: 'Katso', setup: 'Aseta sijainti laajennuksen asetuksissa', none: 'Ei kuutietoja juuri nyt' }
  };
  var LANG_NAMES = { english: 'en', nederlands: 'nl', dutch: 'nl', deutsch: 'de', german: 'de', francais: 'fr', french: 'fr', espanol: 'es', spanish: 'es', italiano: 'it', italian: 'it', portugues: 'pt', portuguese: 'pt', svenska: 'sv', swedish: 'sv', dansk: 'da', danish: 'da', norsk: 'nb', norwegian: 'nb', no: 'nb', nn: 'nb', polski: 'pl', polish: 'pl', suomi: 'fi', finnish: 'fi' };

  /* ---------- helpers ---------- */
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  function fill(s, o) { return s.replace(/\{(\w)\}/g, function (m, k) { return o[k]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function put(root, k, v) { root.querySelectorAll('[data-mf="' + k + '"]').forEach(function (n) { n.textContent = v || ''; n.classList.toggle('hidden', !v); }); }

  /* ---------- the sky: rise and set, next phases, what sits on the terminator ---------- */
  function altitude(ms, lat, lon) { var st = LUNA.state(ms), ob = LUNA.observe(st, ms, lat, lon); return ob.alt / D2R + 0.83; }   // degrees above the rising line (refraction and the Moon's own radius)
  function cross(fn, t0, t1, up) {   // first moment fn crosses zero going up (or down) between t0 and t1, ms or null
    var a = fn(t0), step = 6e5;
    for (var t = t0 + step; t <= t1; t += step) {
      var b = fn(t);
      if ((a < 0) !== (b < 0) && (b > a) === up) { var lo = t - step, hi = t; for (var i = 0; i < 14; i++) { var m = (lo + hi) / 2; if ((fn(m) < 0) === (a < 0)) lo = m; else hi = m; } return hi; }
      a = b;
    }
    return null;
  }
  function nextPhase(ms, target) {   // next time the Moon is `target` radians ahead of the Sun (0 new, PI full)
    var f = function (t) { var e = LUNA.state(t).elong - target; e = ((e + 3 * Math.PI) % TAU) - Math.PI; return e; };
    var a = f(ms), step = 6 * 36e5;
    for (var t = ms + step; t < ms + 31 * DAY; t += step) {
      var b = f(t);
      if (a < 0 && b >= 0 && b - a < 1) { var lo = t - step, hi = t; for (var i = 0; i < 16; i++) { var m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; } return hi; }
      a = b;
    }
    return null;
  }
  // features lit by a low Sun and turned toward us (best known first); when the terminator is out of sight,
  // the best-known features that face us
  function terminator(st, fr) {
    var sl = st.sunsel, c0 = Math.cos(sl.b), sb = [c0 * Math.cos(sl.l), c0 * Math.sin(sl.l), Math.sin(sl.b)], eb = [fr.X[2], fr.Y[2], fr.Z[2]], hit = [], rest = [];
    FEATURES.forEach(function (f) {
      var la = f[1] * D2R, lo = f[2] * D2R, v = [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
      var seen = v[0] * eb[0] + v[1] * eb[1] + v[2] * eb[2], sun = v[0] * sb[0] + v[1] * sb[1] + v[2] * sb[2];
      if (seen < 0.3 || f[4] < 5) return;
      var e = Math.asin(Math.max(-1, Math.min(1, sun))) / D2R;
      if (e > 0 && e < 16 && f[4] >= 6) hit.push([f[0], f[4] + (16 - e) / 40]);
      else if (e >= 8 && f[4] >= 7) rest.push([f[0], f[4] + seen]);
    });
    hit.sort(function (a, b) { return b[1] - a[1]; }); rest.sort(function (a, b) { return b[1] - a[1]; });
    return { hit: hit.slice(0, 3).map(function (x) { return x[0]; }), rest: rest.slice(0, 3).map(function (x) { return x[0]; }) };
  }

  function model(D, now, cfg) {
    var T = L[cfg.lang], off = (D.off || 0) * 1000, lat = cfg.lat, lon = cfg.lon;
    var loc = function (ms, o) { return new Intl.DateTimeFormat(cfg.locale, Object.assign({ timeZone: 'UTC' }, o)).format(new Date(ms + off)); };
    var clock = function (ms) { if (ms == null) return '–'; var d = new Date(ms + off), h = d.getUTCHours(), m = pad(d.getUTCMinutes()); return cfg.h12 ? ((h + 11) % 12 + 1) + ':' + m + (h < 12 ? ' am' : ' pm') : pad(h) + ':' + m; };
    var st = LUNA.state(now), ob = LUNA.observe(st, now, lat, lon), fr = LUNA.frame(st, ob.q, cfg.tilt);
    var frac = st.elong / TAU, k = frac < 0.02 || frac >= 0.98 ? 0 : frac < 0.23 ? 1 : frac < 0.27 ? 2 : frac < 0.48 ? 3 : frac < 0.52 ? 4 : frac < 0.73 ? 5 : frac < 0.77 ? 6 : 7;
    var rise = cross(function (t) { return altitude(t, lat, lon); }, now, now + 30 * 36e5, true), set = cross(function (t) { return altitude(t, lat, lon); }, now, now + 30 * 36e5, false);
    var full = nextPhase(now, Math.PI), nw = nextPhase(now, 0);
    var inDays = function (ms) { var d0 = Math.floor((now + off) / DAY), d1 = Math.floor((ms + off) / DAY), n = d1 - d0; return n <= 0 ? T.today : n === 1 ? T.tmr : fill(T.inn, { n: n }); };
    var date = function (ms) { return loc(ms, { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', ''); };
    var dist = cfg.mi ? Math.round(st.range / 1.609344).toLocaleString(cfg.locale) + ' mi' : Math.round(st.range).toLocaleString(cfg.locale) + ' km';
    var nextIsFull = full && (!nw || full < nw), nextT = nextIsFull ? full : nw;
    var tm = st.frac > 0.03 ? terminator(st, fr) : { hit: [], rest: [] }, useHit = tm.hit.length >= 2;
    return {
      st: st, fr: fr, off: off, now: now, tilt: cfg.tilt,
      text: {
        a1: loc(now, { weekday: 'long' }).replace('.', ''), a2: Math.round(st.frac * 100) + '%', a3: T.ph[k],
        b1: nextIsFull ? T.full : T.nw, b2: inDays(nextT), b3: date(nextT),
        c1: T.rise, c2: clock(rise), c3: T.set + ' ' + clock(set),
        d1: useHit ? (st.waxing ? T.sunrise : T.sunset) : T.look, d2: (useHit ? tm.hit : tm.rest)[0] || '', d3: (useHit ? tm.hit : tm.rest).slice(1).join(' · ')
      }
    };
  }

  /* ---------- drawing ---------- */
  function palette(root) { var c = (root.closest('.screen') || {}).className || ''; return /screen--1bit/.test(c) ? 2 : /screen--2bit/.test(c) ? 4 : /screen--color-/.test(c) ? 2 : 16; }
  function flat() { var w = 64, h = 32, a = new Uint8Array(w * h).fill(170), z = new Float32Array(w * h); return { w: w, h: h, alb: a, hgt: z, sx: z, sy: z }; }
  // The canvas sits inside the Moon's own box (.mf-hero) and the Moon fills it, so where the Moon is and how big it is come from the layout alone.
  // The page can be scaled by the screen (the X is drawn at 1.8x) or by the device; that only decides how many pixels the canvas gets, never where the Moon lands.
  function paint(root, M, T, levels) {
    var hero = root.querySelector('.mf-hero'), cv = hero.querySelector('.mf-cv'), w = hero.offsetWidth, h = hero.offsetHeight; if (w < 8 || h < 8) return;
    var vs = hero.getBoundingClientRect().width / w, s = (isFinite(vs) && vs > 0.2 && vs < 8 ? vs : 1) * (window.devicePixelRatio || 1);
    cv.width = Math.round(w * s); cv.height = Math.round(h * s);
    var g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
    var o = { levels: levels, albPow: 3.5, gamma: 1.25, gain: 1.0, earthshine: levels > 4 ? 0.04 : 0.028, jitter: levels > 4 ? 0.03 : 0.2 };
    MOONFACE.draw(g, T, M.st, M.fr, Math.round(cv.width / 2), Math.round(cv.height / 2), Math.floor(Math.min(cv.width, cv.height) / 2) - 2, o);
    sky(root, hero, levels);
  }

  // a few stars around the Moon: the same ones every time (a fixed seed), on a layer over the whole screen, none on the Moon or behind the words
  function rel(el, root) { var x = 0, y = 0; while (el && el !== root) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return [x, y]; }
  function sky(root, hero, levels) {
    var cv = root.querySelector('.mf-sky'); if (!cv) return;
    var cw = root.offsetWidth, ch = root.offsetHeight, vs = root.getBoundingClientRect().width / Math.max(1, cw), s = (isFinite(vs) && vs > 0.2 && vs < 8 ? vs : 1) * (window.devicePixelRatio || 1);
    cv.width = Math.round(cw * s); cv.height = Math.round(ch * s); cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    var g = cv.getContext('2d'), hp = rel(hero, root), mx = hp[0] + hero.offsetWidth / 2, my = hp[1] + hero.offsetHeight / 2, mr = Math.min(hero.offsetWidth, hero.offsetHeight) / 2 * 1.06, boxes = [];
    root.querySelectorAll('.mf-c').forEach(function (c) { if (c.offsetWidth && c.offsetHeight) { var p = rel(c, root); boxes.push([p[0] - 10, p[1] - 10, p[0] + c.offsetWidth + 10, p[1] + c.offsetHeight + 10]); } });
    var seed = 20241031, rnd = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed >> 8) / 8388608; }, n = Math.round(cw * ch / (levels > 2 ? 4200 : 6500)), d = Math.max(1, Math.round(s * 0.9));
    var dot = function (x, y, rad) { g.beginPath(); g.arc(x + d / 2, y + d / 2, rad, 0, 6.2832); g.fill(); };
    for (var i = 0; i < n; i++) {
      var x = rnd() * cw, y = rnd() * ch, p = rnd(), q = rnd(), px = Math.round(x * s), py = Math.round(y * s);
      if (Math.hypot(x - mx, y - my) < mr || boxes.some(function (b) { return x > b[0] && x < b[2] && y > b[1] && y < b[3]; })) continue;
      var v = levels > 2 ? Math.round(255 * (0.45 + 0.55 * q)) : 255; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
      if (p > 0.97) dot(px, py, d * 1.9); else if (p > 0.8) dot(px, py, d * 1.1); else g.fillRect(px, py, d, d);
    }
  }

  /* ---------- per-root rendering ---------- */
  function render(root) {
    if (root.dataset.done) return;
    var ds = root.dataset, loc = String(ds.locale || 'en'), lang = norm(ds.lang);
    if (!lang || lang === 'auto') lang = norm(loc).slice(0, 2);
    lang = L[lang] ? lang : LANG_NAMES[lang] || 'en';
    var locale = norm(loc).slice(0, 2) === lang ? loc : lang, us = /en-us/i.test(loc), clock = norm(ds.clock), units = norm(ds.units);
    var lat = parseFloat(ds.lat), lon = parseFloat(ds.lon);
    if (isNaN(lat) || isNaN(lon)) { put(root, 'phase', L[lang].setup); return; }
    var D = null; try { D = JSON.parse(root.querySelector('.mf-data').textContent); } catch (e) { }
    D = D || {}; if (D.off == null) D.off = parseFloat(ds.off) || 0;
    var cfg = { lang: lang, locale: locale, lat: lat, lon: lon, h12: clock === '12' || (clock !== '24' && us), mi: units === 'imperial' || (units !== 'metric' && us), tilt: norm(ds.tilt) === 'north' ? 'north' : 'sky' };
    var now = parseInt(ds.ts, 10) * 1000 || Date.now();
    if (/^\d{4}-\d{2}-\d{2}/.test(ds.test || '')) now = Date.parse(ds.test.length > 10 ? ds.test + 'Z' : ds.test + 'T22:00:00Z') - D.off * 1000;
    var M = model(D, now, cfg);
    for (var k in M.text) put(root, k, M.text[k]);
    root.dataset.done = '1';
    var ratio = root.offsetWidth / Math.max(1, root.offsetHeight), kk = root.closest('.screen--lg') ? 1.15 : 1, tall = ratio < 1.1 || (ratio < 1.5 && root.offsetWidth < 560 * kk && root.dataset.view !== 'quadrant');
    root.classList.toggle('mf--tall', tall); root.classList.toggle('mf--boxy', !tall && ratio >= 1.1 && ratio < 1.5); root.classList.toggle('mf--narrow', root.offsetWidth < 300 * kk && (tall || root.dataset.view === 'half_vertical'));
    // stacked layouts: centre the ball in the space above the facts
    if (root.classList.contains('mf--tall') || root.dataset.view === 'half_vertical') {
      var hero = root.querySelector('.mf-hero'), cor = root.querySelector('.mf-corners'), pd = parseFloat(getComputedStyle(root).getPropertyValue('--pad')) || 16;
      if (hero && cor) { var room = cor.offsetTop - 2 * pd;   // above the facts
        if (hero.offsetHeight > room) { hero.style.maxHeight = room + 'px'; hero.style.width = room + 'px'; }
        hero.style.top = Math.max(pd, pd + (room - hero.offsetHeight) / 2) + 'px'; }
    }
    var dpr = window.devicePixelRatio || 1, wide = root.getBoundingClientRect().width * dpr;
    var tier = (wide > 1400 ? '2k' : '1k'), levels = palette(root);
    MOONFACE.textures(window.MF_TEX || TEX, tier).then(function (T) { paint(root, M, T, levels); }, function () { paint(root, M, flat(), levels); }).then(function () { root.dataset.painted = '1'; });
  }
  function run() { document.querySelectorAll('.mf').forEach(function (r) { try { render(r); } catch (e) { console.error(e); } }); }
  window.MOONFACEAPP = { run: run };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else setTimeout(run, 0);
}();
