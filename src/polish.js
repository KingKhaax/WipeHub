'use strict';
(() => {
  const nav = document.querySelector('.navtabs');
  const ind = nav && nav.querySelector('.nav-ind');
  if (nav && ind) {
    let ready = false;
    const place = () => {
      const on = nav.querySelector('.home-btn.on');
      if (!on || !on.offsetWidth) { ind.style.opacity = '0'; return; }
      ind.style.opacity = '1';
      ind.style.width = on.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
      if (!ready) requestAnimationFrame(() => { ready = true; ind.classList.add('ready'); });
    };
    new MutationObserver(place).observe(nav, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true, characterData: true });
    addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    place();
  }

  const label = (btnId, spanId) => {
    const span = document.getElementById(spanId);
    const btn = document.getElementById(btnId);
    if (!span || !btn) return;
    if (btn.title) btn.dataset.keepTitle = '1';
    const sync = () => {
      const txt = span.textContent.trim();
      if (!txt) return;
      btn.setAttribute('aria-label', txt);
      if (!btn.dataset.keepTitle) btn.title = txt;
    };
    new MutationObserver(sync).observe(span, { childList: true, characterData: true, subtree: true });
    sync();
  };
  label('langBtn', 'langLabel');
  label('exportBtn', 'exportLabel');

  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('.chipsel button[data-chip]');
    if (!b) return;
    const box = b.closest('.chipsel');
    const input = box.querySelector('input[type="hidden"]');
    if (input) input.value = b.dataset.chip;
    box.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  });
})();

// Orden de títulos para lectores de pantalla (no cambia nada de lo que se ve): el título de la página es un h1 oculto y cada título
// de la pantalla baja a lo sumo un nivel más que el anterior (así no se saltan niveles)
(function () {
  const main = document.getElementById('main');
  if (!main) return;
  let queued = false;
  const fix = () => {
    queued = false;
    let last = 1;
    main.querySelectorAll('h2, h3, h4, h5, h6').forEach((h) => {
      const level = Math.min(Number(h.tagName[1]), last + 1);
      if (h.getAttribute('aria-level') !== String(level)) h.setAttribute('aria-level', String(level));
      last = level;
    });
  };
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(fix); } }).observe(main, { childList: true, subtree: true });
  fix();
})();
