'use strict';
// «Copiar imagen» y «Guardar PNG» en cada pestaña de estadísticas: se fotografía lo que se ve (cabecera, selectores y tabla o barras)
// con un SVG que contiene una copia de la pantalla con sus estilos, las imágenes y las fuentes incrustadas, y se pinta en un lienzo.
// Las listas con barras (Daño, Sanación…) ya traen sus propios botones: ahí no se añaden otros.

const SHOT_SKIP = 'script,style,.shot-bar,.sortbar-export,[data-no-shot],.wlt-foot,.wlt-plus,.refresh-btn';

// Pestañas que no son una tabla o un reparto de barras (no llevan botones de imagen)
function shotWanted(view) {
  if (!view || view.querySelector('[data-action="export-img"],[data-action="export-wcl"],[data-action="shot"]')) return false;
  if (view.querySelector('.empty,.error-box') && !view.querySelector('table,.ranked,.wlt,.bars,.chart,.rk-table,.legend')) return false;
  return !!view.querySelector('table,.ranked,.wlt,.bars,.chart,.rk-table,.deaths,.legend,svg,canvas');
}

function addShotBar() {
  const view = document.getElementById('view');
  if (!view || view.querySelector('.shot-bar') || !shotWanted(view)) return;
  const bar = document.createElement('div');
  bar.className = 'sortbar shot-bar';
  bar.innerHTML = `<span class="grow"></span><button type="button" class="chip" data-action="shot" data-m="copy" title="${esc(LL('Copiar esta pantalla como imagen', 'Copy this screen as an image'))}">📋 ${LL('Copiar imagen', 'Copy image')}</button><button type="button" class="chip" data-action="shot" data-m="save" title="${esc(LL('Guardar esta pantalla como imagen PNG', 'Save this screen as a PNG image'))}">💾 ${LL('Guardar PNG', 'Save PNG')}</button>`;
  const hdr = view.querySelector('.hdr');
  if (hdr) hdr.insertAdjacentElement('afterend', bar); else view.prepend(bar);
}

const shotBlobToData = (blob) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ok(null); r.readAsDataURL(blob); });
// Una imagen ya cargada en pantalla, pasada a datos con un lienzo (sirve cuando la red no deja pedirla otra vez)
function shotImgToData(img) {
  try {
    if (!img.complete || !img.naturalWidth) return null;
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    cv.getContext('2d').drawImage(img, 0, 0);
    return cv.toDataURL('image/png');
  } catch { return null; }
}
// Segundo camino: cargar la imagen como imagen (con CORS) y pasarla a datos; no depende de lo que la política de seguridad deje pedir con fetch
function shotLoadCors(url) {
  return new Promise((ok) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => ok(shotImgToData(im));
    im.onerror = () => ok(null);
    im.src = /^https?:/.test(url) ? `${url}${url.includes('?') ? '&' : '?'}wtshot=1` : url; // otra dirección: evita la copia guardada sin CORS
    setTimeout(() => ok(null), 8000);
  });
}
async function shotInlineUrl(url) {
  if (!url || url.startsWith('data:')) return url;
  try {
    // «reload»: si el navegador ya guardó la imagen sin permiso CORS (al mostrarla en pantalla), esa copia no sirve; se pide de nuevo
    const r = await fetch(url, { cache: 'reload' });
    if (r.ok) return await shotBlobToData(await r.blob());
  } catch { /* se prueba el otro camino */ }
  return shotLoadCors(url);
}

// Fuentes del documento en uso, con los archivos incrustados (un SVG usado como imagen no puede cargar nada de fuera)
async function shotFontCss() {
  const out = [];
  for (const sheet of [...document.styleSheets]) {
    let rules; try { rules = [...sheet.cssRules]; } catch { continue; }
    for (const rule of rules) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const src = rule.style.getPropertyValue('src');
      const m = src.match(/url\(["']?([^"')]+)["']?\)/);
      if (!m || !/latin/i.test(m[1]) || /latin-ext/i.test(m[1])) continue; // solo el alfabeto latino básico: la imagen pesa menos
      const abs = new URL(m[1], sheet.href || location.href).href;
      const data = await shotInlineUrl(abs);
      if (!data) continue;
      out.push(`@font-face{font-family:${rule.style.getPropertyValue('font-family')};font-weight:${rule.style.getPropertyValue('font-weight') || 400};font-style:${rule.style.getPropertyValue('font-style') || 'normal'};src:url(${data})}`);
    }
  }
  return out.join('\n');
}

// Copia de un elemento con todos los estilos calculados puestos en línea
async function shotClone(src) {
  const clone = src.cloneNode(true);
  const srcAll = [src, ...src.querySelectorAll('*')];
  const cloAll = [clone, ...clone.querySelectorAll('*')];
  const jobs = [];
  srcAll.forEach((el, i) => {
    const c = cloAll[i];
    if (!c || !c.style) return;
    const cs = getComputedStyle(el);
    let css = '';
    for (let k = 0; k < cs.length; k++) { const p = cs[k]; css += `${p}:${cs.getPropertyValue(p)};`; }
    c.setAttribute('style', css);
    if (c.tagName === 'IMG') jobs.push(shotInlineUrl(el.currentSrc || el.src).then((d) => { d = d || shotImgToData(el); if (d) c.setAttribute('src', d); else c.removeAttribute('src'); c.removeAttribute('srcset'); c.removeAttribute('loading'); }));
    const bg = cs.backgroundImage;
    if (bg && bg.includes('url(')) {
      jobs.push((async () => {
        let out = bg;
        for (const m of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
          if (m[1].startsWith('data:')) continue;
          const d = await shotInlineUrl(m[1]);
          out = d ? out.replace(m[0], `url("${d}")`) : out.replace(m[0], 'url("data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=")');
        }
        c.style.backgroundImage = out;
      })());
    }
    if (c.tagName === 'CANVAS') { try { const im = document.createElement('img'); im.setAttribute('src', el.toDataURL()); im.setAttribute('style', c.getAttribute('style')); c.replaceWith(im); } catch { /* lienzo manchado */ } }
  });
  clone.querySelectorAll(SHOT_SKIP).forEach((n) => n.remove());
  await Promise.all(jobs);
  return clone;
}

async function shotRender(el) {
  const w = Math.ceil(el.scrollWidth), h = Math.ceil(el.scrollHeight);
  const clone = await shotClone(el);
  const bg = getComputedStyle(document.body).backgroundColor || '#0f1013';
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  clone.style.cssText += `;width:${w}px;height:auto;margin:0;overflow:visible;box-sizing:border-box;padding:16px;background:${bg};`;
  const fonts = await shotFontCss();
  const xml = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h + 32}"><style>${fonts}</style><foreignObject x="0" y="0" width="100%" height="100%">${xml}</foreignObject></svg>`;
  const img = new Image();
  await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; });
  const scale = Math.min(2, 8000 / Math.max(w, h + 32));
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * scale); cv.height = Math.round((h + 32) * scale);
  const g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height);
  g.drawImage(img, 0, 0, cv.width, cv.height);
  return new Promise((ok) => { try { cv.toBlob((b) => ok(b), 'image/png'); } catch { ok(null); } });
}

async function shotExport(mode) {
  const view = document.getElementById('view');
  if (!view) return;
  const title = (view.querySelector('.hdr h1')?.textContent || 'WipeHub').replace(/\s+/g, ' ').trim();
  let blob = null;
  try { blob = await shotRender(view); } catch (e) { console.warn('shot', e); }
  if (!blob) return toast(LL('No se pudo crear la imagen', 'Could not create the image'));
  if (mode === 'save') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `WipeHub - ${title}.png`.replace(/[\\/:*?"<>|]/g, '-');
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return toast(LL('Imagen guardada', 'Image saved'));
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    showCopiedPop(LL('Imagen: ya puedes pegarla', 'Image: you can paste it now'));
  } catch { showCopiedPop(LL('Usa «Guardar PNG»', 'Use “Save PNG”'), false); }
}

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action="shot"]');
  if (el) shotExport(el.dataset.m);
});
