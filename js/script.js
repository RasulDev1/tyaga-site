// ===== НАСТРОЙКИ =====
// Адрес веб-приложения Google Apps Script, которое присылает заявки на почту
var SHEET_URL = 'https://script.google.com/macros/s/AKfycbwX9mU2-DTutYcObEBymqs_kydthmDVBgkD-o6AJRiYv_x23DjInf57RkGnXEQ9tLE8/exec';
var PHONE_DISPLAY = '+7 (989) 932-87-75';
var PHONE_LINK = 'tel:+79899328775';

// Доставка: null — «рассчитаем при звонке», 0 — «бесплатно», число — фиксированная цена в рублях
var DELIVERY_PRICE = null;

// Каталог: чтобы изменить цену или залог — поменяйте числа здесь
var TOOLS = [
  { id:'drill',   name:'Перфоратор SDS-Plus',        spec:'800 Вт, 3 режима, бурение до 26 мм',          price:500,  deposit:5000,  img:'images/perforator.webp',     pos:'48% 45%' },
  { id:'screw',   name:'Шуруповёрт аккумуляторный',  spec:'18 В, 2 аккумулятора, зарядное устройство',   price:400,  deposit:3000,  img:'images/shurupovert.webp',    pos:'50% 40%' },
  { id:'grinder', name:'УШМ (болгарка) 230 мм',      spec:'2200 Вт, плавный пуск, защитный кожух',       price:450,  deposit:4000,  img:'images/bolgarka.webp',       pos:'40% 60%' },
  { id:'saw',     name:'Циркулярная пила',           spec:'1400 Вт, глубина пропила до 65 мм',           price:600,  deposit:6000,  img:'images/pila.webp',           pos:'50% 48%' },
  { id:'level',   name:'Лазерный нивелир',           spec:'3 плоскости по 360°, штатив в комплекте',     price:700,  deposit:10000, img:'images/nivelir.webp',        pos:'60% 68%' },
  { id:'breaker', name:'Отбойный молоток',           spec:'1600 Вт, SDS-Max, энергия удара 25 Дж',       price:1200, deposit:15000, img:'images/otboynik.webp',       pos:'50% 30%' },
  { id:'mixer',   name:'Бетономешалка 180 л',        spec:'800 Вт, 220 В, на колёсах',                   price:900,  deposit:8000,  img:'images/betonomeshalka.webp', pos:'45% 45%' },
  { id:'vacuum',  name:'Строительный пылесос',       spec:'30 л, класс пыли L, розетка для инструмента', price:500,  deposit:5000,  img:'images/pylesos.webp',        pos:'65% 55%' }
];
// =====================

(function () {
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var rub = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0₽'; };
  var ru = function (v) { var p = (v || '').split('-'); return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : v; };
  var word = function (n) { return (n % 10 === 1 && n % 100 !== 11) ? 'сутки' : 'суток'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };

  var now = new Date();
  var picked = '';
  $('start').value = iso(now); $('start').min = iso(now);
  $('end').value = iso(new Date(now.getTime() + 86400000)); $('end').min = $('start').value;

  function cur() { return TOOLS.filter(function (t) { return t.id === picked; })[0] || null; }
  function deliveryText() { return DELIVERY_PRICE === null ? 'при звонке' : (DELIVERY_PRICE === 0 ? 'бесплатно' : rub(DELIVERY_PRICE)); }
  function deliverySum() { return typeof DELIVERY_PRICE === 'number' ? DELIVERY_PRICE : 0; }

  $('tool').innerHTML += TOOLS.map(function (t) {
    return '<option value="' + t.id + '">' + esc(t.name) + ' — ' + rub(t.price) + '/сутки</option>';
  }).join('');
  function pick(id) { picked = id; $('tool').value = id; renderGrid(); render(); }

  function renderGrid() {
    $('grid').innerHTML = TOOLS.map(function (t) {
      var sel = t.id === picked;
      return '<div class="card' + (sel ? ' sel' : '') + '">' +
        '<div class="card-img"><img loading="lazy" src="' + t.img + '" alt="' + esc(t.name) + '" style="object-position:' + t.pos + '"><span class="card-tag">ВЫБРАНО</span></div>' +
        '<div class="card-body"><div class="card-info"><div class="card-name">' + esc(t.name) + '</div><div class="card-spec">' + esc(t.spec) + '</div></div>' +
        '<div class="card-prices"><div><small>Сутки</small><span class="p">' + rub(t.price) + '</span></div><div class="d"><small>Залог</small>' + rub(t.deposit) + '</div></div>' +
        '<button type="button" data-id="' + t.id + '">' + (sel ? 'Выбрано' : 'Выбрать') + '</button></div></div>';
    }).join('');
  }

  function calc() {
    var s = $('start').value, e = $('end').value;
    var diff = Math.round((new Date(e + 'T00:00:00') - new Date(s + 'T00:00:00')) / 86400000);
    var valid = !!s && !!e && !isNaN(diff) && diff >= 0;
    var days = valid ? Math.max(1, diff) : 0;
    return { valid: valid, days: days, start: s, end: e };
  }

  function render() {
    var c = cur(), k = calc();
    if (c) { $('selImg').src = c.img; $('selImg').alt = c.name; $('selImg').style.objectPosition = c.pos; }
    $('selImg').hidden = !c; $('selPh').style.display = c ? 'none' : '';
    $('days').textContent = k.valid ? k.days + ' ' + word(k.days) : '—';
    $('price').textContent = c ? rub(c.price) : '—';
    $('rent').textContent = c && k.valid ? rub(k.days * c.price) : '—';
    $('deposit').textContent = c ? rub(c.deposit) : '—';
    $('delivery').textContent = deliveryText();
    $('total').textContent = c && k.valid ? rub(k.days * c.price + c.deposit + deliverySum()) : '—';
    $('totalNote').textContent = c && k.valid
      ? 'Из них ' + rub(c.deposit) + ' — залог, вернём при сдаче инструмента.' + (DELIVERY_PRICE === null ? ' Доставка — отдельно, назовём при звонке.' : '')
      : 'Выберите инструмент, чтобы рассчитать стоимость.';
    if (touched.tool) check('tool');
    $('end').min = $('start').value;
    if (touched.start) check('start'); if (touched.end) check('end');
  }

  // ===== Валидация =====
  function fmtPhone(v) {
    var d = v.replace(/\D/g, '');
    if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var r = '+7';
    if (d.length > 1) r += ' (' + d.slice(1, 4);
    if (d.length > 4) r += ') ' + d.slice(4, 7);
    if (d.length > 7) r += '-' + d.slice(7, 9);
    if (d.length > 9) r += '-' + d.slice(9, 11);
    return r;
  }
  var checks = {
    tool: function () { return picked ? '' : 'Выберите инструмент из списка или в каталоге'; },
    start: function () {
      var v = $('start').value;
      if (!v) return 'Выберите дату получения';
      if (v < iso(new Date())) return 'Дата получения не может быть в прошлом';
      return '';
    },
    end: function () {
      var v = $('end').value;
      if (!v) return 'Выберите дату возврата';
      if ($('start').value && v < $('start').value) return 'Дата возврата раньше даты получения';
      return '';
    },
    name: function () {
      var v = $('name').value.trim();
      if (!v) return 'Введите имя';
      if (v.replace(/[^A-Za-zА-Яа-яЁё]/g, '').length < 2) return 'Имя слишком короткое';
      if (!/^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё\s\-]*$/.test(v)) return 'Имя может содержать только буквы, пробел и дефис';
      return '';
    },
    phone: function () {
      var d = $('phone').value.replace(/\D/g, '');
      if (!d) return 'Введите номер телефона';
      if (d.length < 11) return 'Номер неполный — нужно 10 цифр после +7';
      if (d[1] !== '9' && d[1] !== '4' && d[1] !== '8') return 'Проверьте код номера';
      return '';
    },
    address: function () {
      var v = $('address').value.trim();
      if (!v) return 'Укажите адрес доставки';
      if (v.replace(/[^A-Za-zА-Яа-яЁё0-9]/g, '').length < 6 || !/\d/.test(v)) return 'Укажите улицу и номер дома';
      return '';
    },
    agree: function () {
      return $('agree').checked ? '' : 'Без согласия на обработку персональных данных мы не можем принять заявку';
    }
  };
  var touched = {};
  function check(id, force) {
    var err = checks[id]();
    var show = err && (force || touched[id]);
    $(id).classList.toggle('err', !!show);
    $('e-' + id).textContent = show ? err : '';
    $('e-' + id).classList.toggle('on', !!show);
    return !err;
  }
  function checkAll() {
    var ok = true, first = null;
    ['tool', 'start', 'end', 'name', 'phone', 'address', 'agree'].forEach(function (id) {
      touched[id] = true;
      if (!check(id, true)) { ok = false; if (!first) first = id; }
    });
    if (first) $(first).focus();
    return ok;
  }

  function showWarn(t) { $('warn').textContent = t; $('warn').style.display = t ? 'block' : 'none'; }
  function showMsg(t, ok) { $('msg').innerHTML = t; $('msg').className = 'msg ' + (ok ? 'ok' : 'bad'); }
  function clearMsg() { $('msg').className = 'msg'; $('msg').innerHTML = ''; }

  $('grid').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-id]');
    if (!b) return;
    pick(b.getAttribute('data-id')); clearMsg();
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
  });
  ['start', 'end'].forEach(function (id) { $(id).addEventListener('change', function () { touched[id] = true; render(); clearMsg(); }); });
  $('phone').addEventListener('input', function () { $('phone').value = fmtPhone($('phone').value); if (touched.phone) check('phone'); });
  $('name').addEventListener('input', function () { if (touched.name) check('name'); });
  $('agree').addEventListener('change', function () { touched.agree = true; check('agree'); });
  $('tool').addEventListener('change', function () { touched.tool = true; pick($('tool').value); clearMsg(); });
  $('address').addEventListener('input', function () { if (touched.address) check('address'); });
  ['name', 'phone', 'address'].forEach(function (id) { $(id).addEventListener('blur', function () { touched[id] = true; check(id); }); });

  $('bookBtn').addEventListener('click', function () {
    var c = cur(), k = calc();
    if (!checkAll() || !k.valid) { showWarn('Заполните все поля корректно — ошибки отмечены красным.'); return; }
    showWarn('');
    var name = $('name').value.trim(), phone = $('phone').value.trim(), address = $('address').value.trim();
    if ($('honey').value) { return; } // защита от спам-ботов

    if (!SHEET_URL) { showMsg('Приём заявок ещё не настроен. Пожалуйста, позвоните нам: <a href="' + PHONE_LINK + '">' + PHONE_DISPLAY + '</a>', false); return; }

    var btn = $('bookBtn');
    btn.disabled = true; btn.textContent = 'Отправляем…'; clearMsg();

    var payload = {
      'Инструмент': c.name,
      'Дата получения': ru(k.start),
      'Дата возврата': ru(k.end),
      'Срок': k.days + ' ' + word(k.days),
      'Аренда': rub(k.days * c.price),
      'Залог': rub(c.deposit),
      'Доставка': DELIVERY_PRICE === null ? 'рассчитать и назвать клиенту при звонке' : deliveryText(),
      'Итого при получении': rub(k.days * c.price + c.deposit + deliverySum()) + (DELIVERY_PRICE === null ? ' + доставка' : ''),
      'Адрес доставки': address,
      'Имя': name,
      'Телефон': phone,
      'Согласие на обработку ПДн': 'Дано ' + new Date().toLocaleString('ru-RU') + ' (редакция согласия и политики от 25.09.2026), страница: ' + location.href
    };

    // На локальном компьютере (Live Server) показываем техническую причину ошибки
    var isLocal = /^(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(location.hostname) || location.protocol === 'file:';
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);

    // text/plain — чтобы браузер не делал предварительный CORS-запрос, который Apps Script не поддерживает
    fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    })
    .then(function (r) {
      return r.text().then(function (t) {
        var data; try { data = JSON.parse(t); } catch (e) { data = { success: false, message: 'HTTP ' + r.status + ': ' + t.slice(0, 200) }; }
        return data;
      });
    })
    .then(function (data) {
      console.log('[ТЯГА] Ответ таблицы:', data);
      if (data && (data.success === true || data.success === 'true')) {
        showMsg('Заявка принята: ' + esc(c.name) + ', ' + ru(k.start) + ' — ' + ru(k.end) + '. Перезвоним для подтверждения.', true);
        $('name').value = ''; $('phone').value = ''; $('address').value = ''; $('agree').checked = false; touched = {};
      } else {
        throw new Error((data && data.message) || 'неизвестная ошибка');
      }
    })
    .catch(function (err) {
      var reason = err && err.name === 'AbortError' ? 'сервис не ответил за 20 секунд' : (err && err.message) || String(err);
      console.error('[ТЯГА] Ошибка отправки заявки:', err);
      showMsg('Не удалось отправить заявку. Пожалуйста, позвоните нам: <a href="' + PHONE_LINK + '">' + PHONE_DISPLAY + '</a>' +
        (isLocal ? '<br><small style="opacity:.8">Техническая причина (видно только при локальном запуске): ' + esc(reason) + '</small>' : ''), false);
    })
    .then(function () { clearTimeout(timer); btn.disabled = false; btn.textContent = 'Забронировать'; });
  });

  // Плавающие кнопки мессенджеров прячем, пока на экране форма бронирования и подвал — чтобы не закрывали кнопки
  if ('IntersectionObserver' in window) {
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      document.querySelector('.float-chat').classList.toggle('away', !!(visible.booking || visible.contacts));
    }, { threshold: 0.05 });
    io.observe($('booking')); io.observe($('contacts'));
  }

  renderGrid(); render();
})();
