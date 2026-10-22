// Közös felső menü: a menüpontok fogd és vidd módszerrel átrendezhetők (egérrel, érintéssel hosszan nyomva, billentyűzettel Alt + nyíl).
// A sorrend nézőnként, a böngészőben marad meg; a „↺” gomb visszaállítja az alapsorrendet.
// Az első helyen álló menüpont a kezdőlap: az anyag megnyitásakor az jön be elsőként, és az „AI-szabályzat” felirat is oda visz.
(function () {
  var KULCS = 'fomenu-sorrend', MARAD = '#attekintes';
  var sor = document.querySelector('.fomenu .fm-linkek');
  if (!sor) return;
  var alap = [].map.call(sor.children, function (a) { return a.getAttribute('href'); });
  var olvas = function () { try { return JSON.parse(localStorage.getItem(KULCS) || 'null'); } catch (e) { return null; } };
  var ment = function (lista) { try { if (lista) localStorage.setItem(KULCS, JSON.stringify(lista)); else localStorage.removeItem(KULCS); } catch (e) {} };
  var sorrend = function () { return [].map.call(sor.children, function (a) { return a.getAttribute('href').split('#')[0]; }); };
  var marka = document.querySelector('.fomenu .fm-marka');

  // visszaállító gomb
  var vissza = document.createElement('button');
  vissza.type = 'button'; vissza.className = 'fm-vissza'; vissza.textContent = '↺'; vissza.title = 'A menü alapsorrendje'; vissza.setAttribute('aria-label', 'A menü alapsorrendjének visszaállítása');
  sor.parentNode.appendChild(vissza);
  // az Áttekintés menüpont #attekintes jellel visz az index.html-re, így kattintásra nem irányít tovább a kezdőlapra
  var frissit = function () {
    var l = sorrend(); vissza.hidden = l.join() === alap.join();
    if (marka) marka.setAttribute('href', l[0]);
    var att = sor.querySelector('a[href^="index.html"]'); if (att) att.setAttribute('href', l[0].indexOf('index.html') === 0 ? 'index.html' : 'index.html' + MARAD);
  };
  var cim = function (a) { return a.getAttribute('href').split('#')[0]; };
  var alkalmaz = function (lista) {
    if (!lista) return;
    lista.forEach(function (h) { var a = sor.querySelector('a[href^="' + h + '"]'); if (a) sor.appendChild(a); });
    alap.forEach(function (h) { if (lista.indexOf(h) < 0) { var a = sor.querySelector('a[href^="' + h + '"]'); if (a) sor.appendChild(a); } });
  };
  alkalmaz(olvas()); frissit();
  vissza.addEventListener('click', function () { alkalmaz(alap); ment(null); frissit(); });

  // kezdőlap: ha az anyag az index.html-lel nyílik meg (jel nélkül), az első menüpont lapja jöjjön be;
  // az Áttekintés menüpont és az oldalon belüli ugrások jellel (#…) érkeznek, ezeknél marad az Áttekintés
  var aktiv = sor.querySelector('[aria-current]');
  var elso = sorrend()[0];
  if (aktiv && cim(aktiv) === 'index.html' && elso !== 'index.html' && !location.hash) { location.replace(elso); return; }

  if (aktiv) sor.scrollLeft = aktiv.offsetLeft - sor.offsetLeft - 16;
  [].forEach.call(sor.children, function (a) { a.draggable = false; a.title = 'Kattints a megnyitáshoz, fogd és vidd az átrendezéshez (billentyűzettel: Alt + nyíl). Az első helyen álló lap a kezdőlap.'; });

  // húzás
  var fogott = null, kezdX = 0, kezdY = 0, huz = false, tartas = null, kattTilt = false;
  var hova = function (x) {
    var tobbi = [].filter.call(sor.children, function (e) { return e !== fogott; });
    for (var i = 0; i < tobbi.length; i++) { var r = tobbi[i].getBoundingClientRect(); if (x < r.left + r.width / 2) return tobbi[i]; }
    return null;
  };
  var indit = function () { huz = true; fogott.classList.add('fm-huzott'); sor.classList.add('fm-rendez'); };
  var vege = function () {
    clearTimeout(tartas);
    if (fogott) { fogott.classList.remove('fm-huzott'); sor.classList.remove('fm-rendez'); }
    if (huz) { kattTilt = true; setTimeout(function () { kattTilt = false; }, 0); var l = sorrend(); ment(l.join() === alap.join() ? null : l); frissit(); }
    fogott = null; huz = false;
  };
  sor.addEventListener('pointerdown', function (e) {
    var a = e.target.closest('a'); if (!a || e.button > 0) return;
    fogott = a; kezdX = e.clientX; kezdY = e.clientY; huz = false;
    if (e.pointerType !== 'mouse') tartas = setTimeout(function () { if (fogott) { indit(); try { a.setPointerCapture(e.pointerId); } catch (x) {} } }, 350);
  });
  sor.addEventListener('pointermove', function (e) {
    if (!fogott) return;
    if (!huz) {
      if (e.pointerType === 'mouse' && Math.abs(e.clientX - kezdX) > 6) { indit(); try { fogott.setPointerCapture(e.pointerId); } catch (x) {} }
      else if (e.pointerType !== 'mouse' && Math.hypot(e.clientX - kezdX, e.clientY - kezdY) > 10) { clearTimeout(tartas); fogott = null; }
      return;
    }
    e.preventDefault();
    var cel = hova(e.clientX);
    if (cel !== fogott.nextElementSibling) sor.insertBefore(fogott, cel);
  });
  sor.addEventListener('pointerup', vege);
  sor.addEventListener('pointercancel', vege);
  sor.addEventListener('click', function (e) { if (kattTilt) { e.preventDefault(); e.stopPropagation(); } }, true);
  sor.addEventListener('contextmenu', function (e) { if (huz) e.preventDefault(); });

  // billentyűzet: Alt + bal/jobb nyíl
  sor.addEventListener('keydown', function (e) {
    var a = e.target.closest('a'); if (!a || !e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    if (e.key === 'ArrowLeft' && a.previousElementSibling) sor.insertBefore(a, a.previousElementSibling);
    if (e.key === 'ArrowRight' && a.nextElementSibling) sor.insertBefore(a.nextElementSibling, a);
    a.focus(); var l = sorrend(); ment(l.join() === alap.join() ? null : l); frissit();
  });
})();
