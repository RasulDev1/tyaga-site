// ===== НАСТРОЙКИ =====
// Адрес веб-приложения Google Apps Script: принимает заявки и хранит каталог, который правится в admin.html
var SHEET_URL = 'https://script.google.com/macros/s/AKfycbwX9mU2-DTutYcObEBymqs_kydthmDVBgkD-o6AJRiYv_x23DjInf57RkGnXEQ9tLE8/exec';

// Каталог по умолчанию. Показывается, пока в админ-панели ничего не сохранено (или если скрипт не ответил).
// Цены и товары теперь удобнее менять через admin.html.
var DEFAULT_TOOLS = [
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

// Загружает каталог из Apps Script. cb(list) получает массив товаров или null, если сохранённого каталога нет / ошибка.
function loadCatalog(cb, timeoutMs) {
  var done = false;
  var finish = function (v) { if (!done) { done = true; cb(v); } };
  setTimeout(function () { finish(null); }, timeoutMs || 8000);
  fetch(SHEET_URL + '?action=products&t=' + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (d) { finish(d && d.success && Array.isArray(d.products) ? d.products : null); })
    .catch(function () { finish(null); });
}
