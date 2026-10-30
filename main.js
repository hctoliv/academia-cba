(() => {
  const WA = '5511983346442';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wa = msg => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;

  /* intro: porta de enrolar, uma vez por sessão (?intro força) */
  const ready = () => document.body.classList.add('ready');
  let seen = false;
  try { seen = sessionStorage.getItem('cba-intro') === '1'; } catch (e) {}
  if (/[?&]intro/.test(location.search)) seen = false;
  if (seen || reduce) {
    ready();
  } else {
    root.classList.add('intro-on');
    document.body.style.overflow = 'hidden';
    let done = false;
    const open = () => {
      if (done) return; done = true;
      root.classList.add('intro-up');
      document.body.style.overflow = '';
      setTimeout(ready, 350);
      setTimeout(() => root.classList.remove('intro-on', 'intro-up'), 1200);
      try { sessionStorage.setItem('cba-intro', '1'); } catch (e) {}
    };
    setTimeout(open, 2500);
    $('#intro').addEventListener('click', open);
    addEventListener('keydown', open, { once: true });
  }

  /* menu */
  const burger = $('#burger'), nav = $('#nav');
  burger.addEventListener('click', () => {
    const o = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
    document.body.style.overflow = o ? 'hidden' : '';
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); document.body.style.overflow = '';
  }));

  /* botões de modalidade abrem WhatsApp com a mensagem certa */
  $$('[data-wa]').forEach(a => {
    a.href = wa(`Oi, CBA! ${a.dataset.wa}. Vim pelo site.`);
    a.target = '_blank'; a.rel = 'noopener';
  });

  /* manifesto: palavras acendem com o scroll */
  const mt = $('#manifestoT');
  const hot = ['peso,', 'lutar', 'melhor', 'Todo', 'dia.'];
  mt.innerHTML = mt.textContent.trim().split(/\s+/)
    .map(w => `<span class="w${hot.includes(w) ? ' hot' : ''}">${w}</span>`).join(' ');
  const words = $$('.w', mt);

  /* horário ao vivo (São Paulo) */
  const HOURS = { 0: [10, 14], 1: [7, 24], 2: [7, 24], 3: [7, 24], 4: [7, 24], 5: [7, 24], 6: [10, 14] };
  const spNow = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(new Date()).map(x => [x.type, x.value]));
    const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    return { d, h: +p.hour + +p.minute / 60 };
  };
  const fmt = h => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`; };
  const hhmm = h => h === 24 ? '00h' : `${String(h).padStart(2, '0')}h`;
  const nextOpen = (d, h) => {
    for (let i = 0; i < 8; i++) {
      const dd = (d + i) % 7, [a] = HOURS[dd];
      if (i > 0 || h < a) return { i, dd, a };
    }
  };
  const DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  function updateStatus() {
    const { d, h } = spNow(), [a, b] = HOURS[d];
    const open = h >= a && h < b;
    let txt, short;
    if (open) {
      txt = `Aberto agora · fecha em ${fmt(b - h)}`;
      short = `Aberto agora · até ${hhmm(b)}`;
    } else {
      const n = nextOpen(d, h);
      const when = n.i === 0 ? 'hoje' : n.i === 1 ? 'amanhã' : DAYS[n.dd];
      txt = `Fechado · abre ${when} às ${hhmm(n.a)}`;
      short = `Fechado · abre ${when} ${hhmm(n.a)}`;
    }
    $('#statusTxt').textContent = txt;
    $('#liveTxt').textContent = short;
    $$('.dot-live').forEach(el => el.classList.toggle('open', open));
    $$('#board li').forEach(li => {
      const today = +li.dataset.d === d;
      li.classList.toggle('today', today);
      let now = $('.now', li);
      if (today) {
        if (!now) { now = document.createElement('em'); now.className = 'now'; $('i', li).appendChild(now); }
        now.style.left = `${h / 24 * 100}%`;
      } else if (now) now.remove();
    });
  }
  updateStatus();
  setInterval(updateStatus, 30000);

  /* barra: cada escolha vira anilha */
  const form = $('#picker'), gL = $('#platesL'), gR = $('#platesR'), kgEl = $('#kg'), prev = $('#msgPreview');
  const PLATE = { w: 34, gap: 4, x0L: 238, x0R: 762 };
  const PER_COLOR = '#5b5552';
  let kgShown = 20;
  function drawPlates() {
    const mods = $$('input[name=mod]:checked', form);
    const per = $('input[name=per]:checked', form);
    const list = mods.map(m => ({ c: m.dataset.plate, h: 210, k: 20, id: m.value }));
    if (per) list.push({ c: PER_COLOR, h: 150, k: 10, id: per.value });
    const keep = new Set(list.map(p => p.id));
    [gL, gR].forEach(g => $$(':scope > g', g).forEach(el => { if (!keep.has(el.dataset.id)) el.remove(); }));
    list.forEach((p, i) => {
      [[gL, PLATE.x0L - (i + 1) * (PLATE.w + PLATE.gap), 'l'], [gR, PLATE.x0R + i * (PLATE.w + PLATE.gap), 'r']].forEach(([g, x, side]) => {
        let el = $$(':scope > g', g).find(e => e.dataset.id === p.id);
        const y = 130 - p.h / 2;
        if (!el) {
          el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          el.dataset.id = p.id;
          el.innerHTML = `<g class="plate ${side}"><rect rx="5" width="${PLATE.w}" height="${p.h}" fill="${p.c}"/><rect rx="2" x="${PLATE.w / 2 - 3}" y="${p.h / 2 - 22}" width="6" height="44" fill="rgba(0,0,0,.35)"/><rect rx="5" width="${PLATE.w}" height="${p.h}" fill="url(#steel)" opacity=".18"/></g>`;
          g.appendChild(el);
        }
        el.setAttribute('transform', `translate(${x} ${y})`);
      });
    });
    const target = 20 + list.reduce((s, p) => s + p.k * 2, 0);
    countTo(kgEl, kgShown, target, 500, v => (kgShown = v));
    const nome = form.nome.value.trim();
    const parts = mods.map(m => m.value.toLowerCase());
    let msg = `Oi, CBA!${nome ? ` Aqui é ${nome}.` : ''} `;
    msg += parts.length ? `Quero treinar ${parts.length > 1 ? parts.slice(0, -1).join(', ') + ' e ' + parts.at(-1) : parts[0]}` : 'Quero treinar aí';
    msg += per ? `, de preferência ${per.value}.` : '.';
    msg += ' Vim pelo site.';
    prev.textContent = msg;
    return msg;
  }
  form.addEventListener('input', drawPlates);
  form.addEventListener('submit', e => { e.preventDefault(); window.open(wa(drawPlates()), '_blank', 'noopener'); });

  /* contadores */
  function countTo(el, from, to, dur, cb) {
    const dec = +(el.dataset.dec || 0), t0 = performance.now();
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3), v = from + (to - from) * e;
      el.textContent = v.toFixed(dec).replace('.', ',');
      if (p < 1) requestAnimationFrame(step); else cb && cb(to);
    };
    requestAnimationFrame(step);
  }

  /* reveals, contadores, vídeo */
  $$('.h2, .lead, .label, .sf-t, .status, .muted, .q-row, .map, .ct-btns').forEach(el => el.classList.add('rv'));
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add('in');
    if (el.dataset.count) countTo(el, 0, +el.dataset.count, 1500);
    io.unobserve(el);
  }), { threshold: .2 });
  $$('.rv, .pola, .stars, .board, .rev [data-count]').forEach(el => io.observe(el));

  const vio = new IntersectionObserver(es => es.forEach(en => {
    const v = en.target;
    if (en.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
  }), { threshold: .25 });
  $$('video[data-auto]').forEach(v => vio.observe(v));

  /* um único handler de scroll */
  const hd = $('#hd'), bar = $('#progress'), waF = $('.wa-float');
  const heroImg = $('.hero-bg img'), heroWord = $('.hero-word'), badge = $('.hero-badge');
  const man = $('.manifesto'), mods = $('.mods'), track = $('#modsTrack'), modIdx = $('#modIdx');
  const pars = $$('[data-par]'), door = $('.ct-door'), ct = $('.ct-photo');
  const zones = $$('[data-hd]');
  let lastY = scrollY, ticking = false;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  function frame() {
    ticking = false;
    const y = scrollY, vh = innerHeight, mobile = innerWidth <= 760;
    const max = document.documentElement.scrollHeight - vh;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    hd.classList.toggle('scrolled', y > 40);
    hd.classList.toggle('hide', y > lastY && y > vh * .8 && !nav.classList.contains('open'));
    lastY = y;
    const probe = 40;
    const z = zones.find(s => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    hd.classList.toggle('on-light', !!z && z.dataset.hd === 'light');
    waF.classList.toggle('show', y > vh * .6);

    if (y < vh * 1.2 && !reduce) {
      heroImg.style.transform = `scale(${1.08 + y / vh * .12}) translateY(${y * .18}px)`;
      heroWord.style.transform = `translateX(${-y * .35}px)`;
      badge.style.translate = `0 ${y * .25}px`;
    }

    // manifesto
    const mr = man.getBoundingClientRect();
    const mp = clamp((-mr.top + vh * .25) / (mr.height - vh * .6));
    const lit = Math.round(mp * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < lit));

    // modalidades: trilho horizontal
    if (!mobile) {
      const r = mods.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));
      const dist = track.scrollWidth - innerWidth;
      track.style.transform = `translate3d(${-p * dist}px,0,0)`;
      modIdx.textContent = '0' + Math.min(3, 1 + Math.floor(p * 3 * .999));
    }

    // parallax special forces
    pars.forEach(el => {
      const r = el.getBoundingClientRect();
      const c = (r.top + r.height / 2 - vh / 2);
      el.style.translate = `0 ${c * +el.dataset.par}px`;
    });

    // porta da fachada sobe conforme chega
    const cr = ct.getBoundingClientRect();
    door.style.setProperty('--d', clamp((cr.top - vh * .35) / (vh * .55)).toFixed(3));
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame);
  frame();
})();
