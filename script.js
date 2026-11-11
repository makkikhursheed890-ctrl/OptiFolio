const nav = document.getElementById('nav');
  const toggle = nav.querySelector('.nav__toggle');
 
  const closeMenu = () => {
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
 
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    scrollAnchor = window.scrollY;
  });
 
  // link click par band
  nav.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', closeMenu));
 
  // page scroll par band (10px se zyada scroll ho to, taake chota jitter ignore ho)
  let scrollAnchor = 0;
  window.addEventListener('scroll', () => {
    if (Math.abs(window.scrollY - scrollAnchor) > 10) closeMenu();
  }, { passive: true });
 
  // menu ke bahar click/tap par band
  document.addEventListener('click', e => {
    if (!nav.contains(e.target)) closeMenu();
  });
 
  // Escape dabane par band
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
 
  // desktop size par aate hi reset
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
 
  /* ---------- LOGO SLIDER: auto-scroll + swipe/drag + pause on hover ---------- */
  (() => {
    const box = document.getElementById('brands');
    const track = box.querySelector('.brands__track');
    const originals = [...track.children];
    const SPEED = 0.6;              // px per frame (~36px/sec) – kam/zyada karne ke liye change karein
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
 
    let setW = 0, pos = 0, last = 0, hover = false, touching = false, dragging = false, resumeT;
 
    function build() {
      track.querySelectorAll('[data-clone]').forEach(n => n.remove());
      // ek set ki width (spacing samet)
      track.append(originals[0].cloneNode(true));
      const probe = track.lastElementChild;
      setW = probe.offsetLeft - originals[0].offsetLeft;
      probe.remove();
      if (!setW) return;
      const sets = Math.ceil(box.clientWidth / setW) + 2;
      for (let i = 1; i < sets; i++) {
        originals.forEach(li => {
          const c = li.cloneNode(true);
          c.dataset.clone = '1';
          c.setAttribute('aria-hidden', 'true');
          track.append(c);
        });
      }
      pos = box.scrollLeft = setW;   // beech se start taake peechay swipe bhi ho sake
      last = pos;
    }
 
    function tick() {
      if (setW) {
        // agar user ne swipe/drag kiya to uski position le lo
        if (Math.abs(box.scrollLeft - last) > 1.5) pos = box.scrollLeft;
        if (!hover && !touching && !dragging && !reduce) pos += SPEED;
        // infinite loop
        if (pos >= setW * 2) pos -= setW;
        else if (pos <= 1)   pos += setW;
        box.scrollLeft = pos;
        last = box.scrollLeft;
      }
      requestAnimationFrame(tick);
    }
 
    // hover pe ruk jaye (sirf mouse)
    box.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
    box.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hover = false; });
 
    // touch swipe: chhorne ke baad thori der (momentum) ruk kar dobara chale
    box.addEventListener('touchstart', () => { touching = true; clearTimeout(resumeT); }, { passive: true });
    const endTouch = () => { clearTimeout(resumeT); resumeT = setTimeout(() => touching = false, 1500); };
    box.addEventListener('touchend', endTouch, { passive: true });
    box.addEventListener('touchcancel', endTouch, { passive: true });
 
    // desktop pe mouse se drag
    let startX = 0, startScroll = 0;
    box.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true; startX = e.clientX; startScroll = box.scrollLeft;
      box.classList.add('is-dragging');
      box.setPointerCapture(e.pointerId);
    });
    box.addEventListener('pointermove', e => {
      if (dragging) box.scrollLeft = startScroll - (e.clientX - startX);
    });
    const endDrag = () => { dragging = false; box.classList.remove('is-dragging'); };
    box.addEventListener('pointerup', endDrag);
    box.addEventListener('pointercancel', endDrag);
 
    // tab ya keyboard focus mai bhi ruk jaye
    box.addEventListener('focusin', () => hover = true);
    box.addEventListener('focusout', () => hover = false);
 
    let rT;
    addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(build, 150); });
    addEventListener('load', build);
    build();
    requestAnimationFrame(tick);
  })();


  /* play dabane par image ki jagah video chal jaye */
  (() => {
    const media = document.getElementById('pod-media');
    const btn = media.querySelector('.pod__play');
 
    btn.addEventListener('click', () => {
      const src = btn.dataset.video;
      if (!src || src.includes('VIDEO_ID')) return;   // jab tak asli link na ho kuch nahi hoga
 
      const frame = document.createElement('iframe');
      frame.src = src;
      frame.title = 'Podcast video';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      media.replaceChildren(frame);
    });
  })();

  /* ---------- EPISODES SLIDER: auto-slide + swipe/drag + hover pause + dots ---------- */
(() => {
  const track = document.getElementById('ep-track');
  if (!track) return;
  const dotsBox = document.getElementById('ep-dots');
  const cards = [...track.children];

  const DELAY = 3500;                                   // har slide ke beech ka waqt (ms)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let step = 0, perView = 1, maxIndex = 0;
  let hover = false, touching = false, dragging = false, focused = false, visible = true;
  let timer, resumeT, rafId;

  /* --- measurements --- */
  function measure() {
    step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    if (step <= 0) step = track.clientWidth || 1;
    const gap = step - cards[0].offsetWidth;
    perView = Math.max(1, Math.round((track.clientWidth + gap) / step));
    maxIndex = Math.max(0, cards.length - perView);
  }

  const current = () => Math.min(maxIndex, Math.max(0, Math.round(track.scrollLeft / step)));

  function goTo(i, smooth = true) {
    i = Math.min(maxIndex, Math.max(0, i));
    track.scrollTo({ left: i * step, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  }

  /* --- dots --- */
  function buildDots() {
    dotsBox.innerHTML = '';
    dotsBox.hidden = maxIndex === 0;
    for (let i = 0; i <= maxIndex; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ep__dot';
      b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      b.addEventListener('click', () => { goTo(i); start(); });
      dotsBox.append(b);
    }
    updateDots();
  }

  function updateDots() {
    const c = current();
    [...dotsBox.children].forEach((d, i) => {
      d.classList.toggle('is-active', i === c);
      d.setAttribute('aria-current', i === c ? 'true' : 'false');
    });
  }

  track.addEventListener('scroll', () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(updateDots);
  }, { passive: true });

  /* --- autoplay --- */
  function next() {
    if (hover || touching || dragging || focused || !visible || document.hidden) return;
    measure();                                  // har baar dobara naap: images/fonts load hone ke baad bhi sahi rahe
    if (maxIndex <= 0) return;
    const c = current();
    goTo(c >= maxIndex ? 0 : c + 1);            // aakhir par wapas pehle slide par
  }

  function start() { clearInterval(timer); timer = setInterval(next, DELAY); }

  /* hover pe ruk jaye (sirf mouse) */
  track.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
  track.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hover = false; start(); } });

  /* touch swipe: chhorne ke baad thori der ruk kar dobara chale */
  track.addEventListener('touchstart', () => { touching = true; clearTimeout(resumeT); }, { passive: true });
  const endTouch = () => { clearTimeout(resumeT); resumeT = setTimeout(() => { touching = false; start(); }, 2000); };
  track.addEventListener('touchend', endTouch, { passive: true });
  track.addEventListener('touchcancel', endTouch, { passive: true });

  /* keyboard se focus aaye tabhi ruke (mouse click se focus hone par autoplay band NAHI hoga) */
  track.addEventListener('focusin', e => { focused = e.target.matches(':focus-visible'); });
  track.addEventListener('focusout', () => { focused = false; start(); });
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current() + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current() - 1); }
  });

  /* --- desktop pe mouse se drag --- */
  let startX = 0, startScroll = 0, moved = 0;
  track.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true; moved = 0; startX = e.clientX; startScroll = track.scrollLeft;
    track.classList.add('is-dragging');
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    track.scrollLeft = startScroll - dx;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    goTo(Math.round(track.scrollLeft / step));   // sab se qareeb card par snap
    start();
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  /* drag ke baad galti se link na khul jaye */
  track.addEventListener('click', e => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);

  /* --- sirf tab chale jab slider screen par nazar aaye (section nahi, khud slider dekhte han) --- */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.1 }).observe(track);
  }
  document.addEventListener('visibilitychange', start);

  /* --- init / resize --- */
  function init() {
    const idx = step ? Math.round(track.scrollLeft / step) : 0;   // resize se pehle wala slide yaad rakho
    measure();
    buildDots();
    goTo(idx, false);
  }
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(init, 150); });
  addEventListener('load', init);
  init();
  start();
})();