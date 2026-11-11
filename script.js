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