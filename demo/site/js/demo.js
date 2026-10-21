// Демо-копия сайта (папка demo/). Подменяет запросы к Google Apps Script:
// заявки и письма не отправляются, настоящий каталог и таблица не меняются.
(function () {
  var host = null;
  try { if (window.parent !== window && window.parent.TYAGA_DEMO) host = window.parent.TYAGA_DEMO; } catch (e) {}
  // Страница открыта без оболочки demo/index.html — всё равно работаем как демо
  if (!host) host = { theme: 'light', catalog: null, saved: function () {}, booked: function () {}, show: function () { location.href = 'index.html'; } };

  // Тёмная тема — отдельная таблица стилей, включается классом на <html>
  var root = document.documentElement;
  root.classList.toggle('demo-dark', host.theme === 'dark');
  document.write('<link rel="stylesheet" href="css/demo-dark.css?v=2">');

  // Свои ключи хранилища, чтобы демо не трогало кэш каталога настоящего сайта
  var P = 'tyaga_demo:', S = Storage.prototype;
  var get = S.getItem, set = S.setItem, del = S.removeItem;
  S.getItem = function (k) { return get.call(this, P + k); };
  S.setItem = function (k, v) { return set.call(this, P + k, v); };
  S.removeItem = function (k) { return del.call(this, P + k); };

  function answer(obj, ms) {
    return new Promise(function (ok) {
      setTimeout(function () {
        ok(new Response(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }, ms);
    });
  }

  var realFetch = window.fetch;
  window.fetch = function (url, opt) {
    var u = String(url && url.url || url);
    if (u.indexOf('script.google.com') < 0) return realFetch.apply(this, arguments);
    if (!opt || !opt.body) return answer({ success: true, products: host.catalog || DEFAULT_TOOLS }, 250);
    var body = {}; try { body = JSON.parse(opt.body); } catch (e) {}
    if (body.action === 'login') return answer({ success: true, products: host.catalog }, 500);
    if (body.action === 'uploadImage') return answer({ success: true, url: body.dataUrl }, 700);
    if (body.action === 'saveProducts') {
      host.catalog = body.products;
      setTimeout(function () { host.saved(); }, 0);
      return answer({ success: true }, 700);
    }
    host.booked(body);
    return answer({ success: true }, 900); // заявка с сайта
  };

  document.addEventListener('DOMContentLoaded', function () {
    var pw = document.getElementById('pw');
    if (pw) { pw.value = 'demo'; pw.placeholder = 'В демо подходит любой пароль'; }
  });

  // «Открыть сайт» в админке переключает демо на сайт, а не открывает новую вкладку
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[target=_blank][href^="index.html"]');
    if (a) { e.preventDefault(); host.show('site'); }
  }, true);
})();
