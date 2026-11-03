// Bone Show Productions: site interactions
(() => {
  // Where quote requests are emailed. Keep in sync with the address in index.html.
  const BOOKING_EMAIL = 'gamracyjayben@gmail.com';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Header: solid background once scrolled ----------
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- Mobile nav ----------
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  const setNav = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
    header.classList.toggle('nav-open', open);
  };
  toggle.addEventListener('click', () => setNav(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
  });

  // ---------- Reveal on scroll ----------
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        // Stagger siblings that enter together
        const siblings = [...entry.target.parentElement.children].filter((c) => c.classList.contains('reveal'));
        entry.target.style.transitionDelay = `${Math.min(siblings.indexOf(entry.target), 4) * 70}ms`;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    reveals.forEach((el) => io.observe(el));
  }

  // ---------- Hero background video ----------
  const heroVideo = document.getElementById('hero-video');
  const heroToggle = document.getElementById('hero-toggle');
  let heroUserPaused = false;

  // Optional trim + slow-mo: data-end loops back before a scene cut, data-rate sets the speed
  const heroEnd = parseFloat(heroVideo.dataset.end) || Infinity;
  heroVideo.defaultPlaybackRate = heroVideo.playbackRate = parseFloat(heroVideo.dataset.rate) || 1;
  const heroLoop = (t) => { if (t >= heroEnd) heroVideo.currentTime = 0; };
  // Per-frame check where supported so the cut never flashes; timeupdate is the coarse backup
  if ('requestVideoFrameCallback' in heroVideo) {
    const tick = (now, meta) => { heroLoop(meta.mediaTime); heroVideo.requestVideoFrameCallback(tick); };
    heroVideo.requestVideoFrameCallback(tick);
  }
  heroVideo.addEventListener('timeupdate', () => heroLoop(heroVideo.currentTime));

  const setHero = (playing) => {
    heroToggle.setAttribute('aria-pressed', String(playing));
    heroToggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} background video`);
    if (playing) heroVideo.play().catch(() => setHero(false));
    else heroVideo.pause();
  };

  if (reduceMotion) {
    // Show the still poster frame instead of motion
    heroVideo.removeAttribute('autoplay');
    setHero(false);
  }
  heroToggle.addEventListener('click', () => {
    heroUserPaused = heroToggle.getAttribute('aria-pressed') === 'true';
    setHero(!heroUserPaused);
  });
  // Save battery/CPU while the hero is scrolled out of view
  if (!reduceMotion && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (!heroUserPaused) setHero(entry.isIntersecting);
    }, { threshold: 0.1 }).observe(heroVideo);
  }

  // ---------- Video reel: autoplay while visible, user can pause ----------
  const reelItems = document.querySelectorAll('.reel-item');
  const setPlaying = (video, btn, playing) => {
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace(/^(Play|Pause)/, playing ? 'Pause' : 'Play'));
    if (playing) video.play().catch(() => setPlaying(video, btn, false));
    else video.pause();
  };

  reelItems.forEach((item) => {
    const video = item.querySelector('video');
    const btn = item.querySelector('.reel-toggle');
    btn.addEventListener('click', () => {
      const playing = btn.getAttribute('aria-pressed') !== 'true';
      item.dataset.userPaused = String(!playing);
      setPlaying(video, btn, playing);
    });
  });

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        const video = target.querySelector('video');
        const btn = target.querySelector('.reel-toggle');
        if (target.dataset.userPaused === 'true') return;
        setPlaying(video, btn, isIntersecting);
      });
    }, { threshold: 0.4 });
    reelItems.forEach((item) => vio.observe(item));
  } else {
    // Without autoplay, load the first frame so tiles aren't blank
    reelItems.forEach((item) => { item.querySelector('video').preload = 'metadata'; });
  }

  // ---------- Lightbox ----------
  const dialog = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCap = document.getElementById('lb-cap');
  const shots = [...document.querySelectorAll('#masonry .shot img')];
  let current = 0;
  let opener = null;

  const show = (i) => {
    current = (i + shots.length) % shots.length;
    const img = shots[current];
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = `${img.alt} (${current + 1} of ${shots.length})`;
  };

  if (typeof dialog.showModal === 'function') {
    shots.forEach((img, i) => {
      img.closest('.shot').setAttribute('aria-label', `View larger: ${img.alt}`);
      img.closest('.shot').addEventListener('click', (e) => {
        opener = e.currentTarget;
        show(i);
        dialog.showModal();
      });
    });
    dialog.querySelector('.lb-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.lb-prev').addEventListener('click', () => show(current - 1));
    dialog.querySelector('.lb-next').addEventListener('click', () => show(current + 1));
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
    // Click on the dark area (not the photo or buttons) closes
    dialog.addEventListener('click', (e) => { if (e.target === dialog || e.target.tagName === 'FIGURE') dialog.close(); });
    dialog.addEventListener('close', () => { lbImg.src = ''; opener?.focus(); });
  }

  // ---------- Package buttons preselect the form ----------
  const pkgSelect = document.getElementById('f-package');
  document.querySelectorAll('[data-package]').forEach((btn) => {
    btn.addEventListener('click', () => { pkgSelect.value = btn.dataset.package; });
  });

  // ---------- Quote form: validate, then open a pre-filled email ----------
  const form = document.getElementById('quote-form');
  const note = document.getElementById('form-note');
  const dateInput = document.getElementById('f-date');
  dateInput.min = new Date().toISOString().split('T')[0];

  const checks = {
    name: (v) => (v.trim() ? '' : 'Please enter your name.'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email, like name@example.com.'),
    date: (v) => (v ? '' : 'Please choose your event date. A best guess is fine.'),
  };

  const validate = (input) => {
    const msg = checks[input.name](input.value);
    const err = document.getElementById(`${input.id}-err`);
    err.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };

  Object.keys(checks).forEach((name) => {
    const input = form.elements[name];
    input.addEventListener('blur', () => { if (input.value) validate(input); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validate(input); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const invalid = Object.keys(checks).map((n) => form.elements[n]).filter((input) => !validate(input));
    if (invalid.length) { invalid[0].focus(); return; }

    const d = Object.fromEntries(new FormData(form));
    const subject = `Quote request: ${d.type} on ${d.date}`;
    const body = [
      `Name: ${d.name}`,
      `Email: ${d.email}`,
      `Phone: ${d.phone || '-'}`,
      `Event date: ${d.date}`,
      `Event type: ${d.type}`,
      `Package: ${d.package}`,
      `Venue: ${d.venue || '-'}`,
      '',
      d.message || '',
    ].join('\n');

    window.location.href = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    note.textContent = `Your email app should open now. If it doesn't, email us directly at ${BOOKING_EMAIL}.`;
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
