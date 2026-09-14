const header = document.getElementById('site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

// Navbar shrinks smoothly after the user starts scrolling and returns at the top.
(function initNavbarScrollState(){
  if (!header) return;
  let ticking = false;

  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 36);
    ticking = false;
  };

  update();
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
})();

menuToggle?.addEventListener('click', () => {
  const open = mobileMenu?.classList.toggle('open') ?? false;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});

mobileLinks.forEach(link => link.addEventListener('click', () => {
  mobileMenu?.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Abrir menu');
}));

document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    if (!item) return;
    const willOpen = !item.classList.contains('is-open');
    item.classList.toggle('is-open', willOpen);
    button.setAttribute('aria-expanded', String(willOpen));
    item.querySelector('.faq-answer')?.setAttribute('aria-hidden', String(!willOpen));
  });
});

// Always-on infinite marquees. This intentionally overrides any legacy CSS
// animation conflicts by driving the track transform directly every frame.
(function initAlwaysOnMarquees() {
  const specs = [
    { track: document.querySelector('.portfolio-track'), group: '.portfolio-group', direction: 1, speed: 18 },
    { track: document.querySelector('.review-track'), group: '.review-group', direction: -1, speed: 16 }
  ];

  const marquees = specs.filter(item => item.track).map(item => {
    const firstGroup = item.track.querySelector(item.group);
    if (!firstGroup) return null;

    // JS is the authoritative motion layer; CSS remains only as fallback.
    item.track.style.setProperty('animation', 'none', 'important');
    item.track.style.setProperty('transition', 'none', 'important');

    return {
      ...item,
      firstGroup,
      distance: 0,
      position: 0,
      lastTime: performance.now()
    };
  }).filter(Boolean);

  function measure(m) {
    const previousDistance = m.distance;
    m.distance = m.firstGroup.getBoundingClientRect().width;
    if (!Number.isFinite(m.distance) || m.distance <= 0) return;

    if (previousDistance <= 0) {
      // Projects start one full copy to the left and travel right.
      // Reviews start at zero and travel left.
      m.position = m.direction > 0 ? -m.distance : 0;
    } else if (m.direction > 0) {
      m.position = ((m.position % m.distance) + m.distance) % m.distance - m.distance;
    } else {
      m.position = -(((Math.abs(m.position) % m.distance) + m.distance) % m.distance);
    }
    m.track.style.setProperty('transform', `translate3d(${m.position}px,0,0)`, 'important');
  }

  marquees.forEach(measure);

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => marquees.forEach(measure));
    marquees.forEach(m => ro.observe(m.firstGroup));
  } else {
    window.addEventListener('resize', () => marquees.forEach(measure), { passive: true });
  }

  function frame(now) {
    for (const m of marquees) {
      if (m.distance <= 0) {
        measure(m);
        m.lastTime = now;
        continue;
      }

      const dt = Math.min((now - m.lastTime) / 1000, 0.1);
      m.lastTime = now;
      m.position += m.direction * m.speed * dt;

      if (m.direction > 0) {
        while (m.position >= 0) m.position -= m.distance;
      } else {
        while (m.position <= -m.distance) m.position += m.distance;
      }

      m.track.style.setProperty('transform', `translate3d(${m.position.toFixed(3)}px,0,0)`, 'important');
    }
    requestAnimationFrame(frame);
  }

  if (marquees.length) requestAnimationFrame(frame);
})();


// Exactly three subtle lateral text reveals. They return to their side when leaving view.
(function initSideReveals(){
  const items = Array.from(document.querySelectorAll('.side-reveal')).slice(0, 3);
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, {
    threshold: 0.22,
    rootMargin: '-4% 0px -10% 0px'
  });

  items.forEach(el => observer.observe(el));
})();

// Project previews intentionally stay on the current page while availability is pending.
(function initUnavailableProjectNotice(){
  const projectLinks = document.querySelectorAll('.portfolio-view');
  if (!projectLinks.length) return;

  const notice = document.createElement('div');
  notice.className = 'project-unavailable-notice';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.textContent = 'Projeto indisponível no momento.';
  document.body.appendChild(notice);

  let hideTimer;
  projectLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      window.clearTimeout(hideTimer);
      notice.classList.add('is-visible');
      hideTimer = window.setTimeout(() => {
        notice.classList.remove('is-visible');
      }, 2600);
    });
  });
})();
