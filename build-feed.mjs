// Сборщик YML-фида KAIDZENDAO из выбранных страниц Tilda (opt.kaidzendao.ru).
// Тащит name/price/priceold/description/picture с каждой страницы товара.
// B24U индексирует только <name>, <description>, <price> — поэтому описание обогащаем
// категорией, синонимами и промо-меткой, чтобы ретрив доставал по разговорным запросам.

import { writeFileSync } from 'node:fs';

// Категории берём из пути URL; промо-метку — из группировки владельца.
// promo: 'sale' = месячное снижение цены, 'reco' = рекомендуем, 'budget' = бюджетная.
const ITEMS = [
  // — снижение цены (стулья)
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/722978306512-stul-maik', cat: 'stul', promo: 'sale' },
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/312263015432-derevyannii-stul-dzhet', cat: 'wood', promo: 'sale' },
  { u: 'https://opt.kaidzendao.ru/stulya/derevyannie-stulya/tproduct/101688041562-stul-makalan-2', cat: 'wood', promo: 'sale' },
  // — рекомендации
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/596804054012-stul-deli-obivka-velyur', cat: 'stul', promo: 'reco' },
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/543014865262-stul-luna-obivka-velyur', cat: 'stul', promo: 'reco' },
  { u: 'https://opt.kaidzendao.ru/tproduct/910721036642-stul-veno-ultra', cat: 'stul', promo: 'reco' },
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/845965282632-stul-vilyams', cat: 'stul', promo: 'reco' },
  { u: 'https://opt.kaidzendao.ru/stulya/derevyannie-stulya/tproduct/979427452712-stul-veno-plyus', cat: 'wood', promo: 'reco' },
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/191241140022-stul-babl', cat: 'stul', promo: 'reco' },
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/281087571562-stul-tolyatti', cat: 'stul', promo: 'reco' },
  // — бюджетные
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/109190143872-stul-zefir-lait', cat: 'stul', promo: 'budget' },
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/994740814822-stul-zefir-bolshoi', cat: 'stul', promo: 'budget' },
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/924286891362-stul-bronks', cat: 'stul', promo: 'budget' },
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/162488095782-stul-sietl', cat: 'stul', promo: 'budget' },
  // — кресла
  { u: 'https://opt.kaidzendao.ru/myagkaya-mebel/kresla/tproduct/185536219412-kreslo-tolyatti', cat: 'kreslo' },
  { u: 'https://opt.kaidzendao.ru/myagkaya-mebel/kresla/tproduct/359766781622-kreslo-makalan', cat: 'kreslo' },
  { u: 'https://opt.kaidzendao.ru/myagkaya-mebel/kresla/tproduct/785124249382-kreslo-vasko', cat: 'kreslo' },
  { u: 'https://opt.kaidzendao.ru/myagkaya-mebel/kresla/tproduct/876030634552-kreslo-babl', cat: 'kreslo' },
  // — диваны
  { u: 'https://opt.kaidzendao.ru/myagkaya-mebel/divany/tproduct/973066684842-divan-byudzhet', cat: 'divan' },
  { u: 'https://opt.kaidzendao.ru/myagkaya-mebel/divany/tproduct/856293893992-divan-klassik', cat: 'divan' },
  { u: 'https://opt.kaidzendao.ru/myagkaya-mebel/divany/tproduct/649508459442-divan-vasko', cat: 'divan' },
  { u: 'https://opt.kaidzendao.ru/myagkaya-mebel/divany/tproduct/203277739122-divan-kioto', cat: 'divan' },
  { u: 'https://opt.kaidzendao.ru/myagkaya-mebel/divany/tproduct/277641843812-divan-mouro', cat: 'divan' },
  { u: 'https://opt.kaidzendao.ru/myagkaya-mebel/divany/tproduct/499656644312-divan-babl', cat: 'divan' },
  // — барные стулья
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/237298456092-stul-babl-barnii', cat: 'bar' },
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/723439114352-stul-maik-barnii', cat: 'bar' },
  { u: 'https://opt.kaidzendao.ru/stulya/tproduct/834450317532-stul-rimini-barnii', cat: 'bar' },
];

const CATS = {
  stul:   { id: 1, name: 'Стулья',            syn: 'стул, стулья для кафе и ресторана, обеденный стул' },
  wood:   { id: 2, name: 'Деревянные стулья', syn: 'деревянный стул, стул из дерева, деревянные стулья' },
  kreslo: { id: 3, name: 'Кресла',            syn: 'кресло, мягкое кресло, кресла для зала' },
  divan:  { id: 4, name: 'Диваны',            syn: 'диван, мягкий диван, диваны для кафе и ресторана' },
  bar:    { id: 5, name: 'Барные стулья',     syn: 'барный стул, барные стулья, стул для барной стойки' },
};
const PROMO = {
  sale:   'Месячное снижение цены — выгодное предложение.',
  reco:   'Рекомендуемая модель.',
  budget: 'Бюджетная модель.',
};

const attr = (html, prop) => {
  const m = html.match(new RegExp(`<meta\\s+property="${prop}"\\s+content="([^"]*)"`, 'i'))
        || html.match(new RegExp(`<meta\\s+name="${prop}"\\s+content="([^"]*)"`, 'i'));
  return m ? decode(m[1]) : '';
};
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  .replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&mdash;/g, '—').replace(/&nbsp;/g, ' ').trim();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const priceFrom = (html) => {
  // основная цена товара: itemprop price content="9000.00"
  const m = html.match(/itemprop="price"\s+content="([0-9.]+)"/i)
        || html.match(/"price":"([0-9]+)\.\d{2,4}"/);
  return m ? Math.round(parseFloat(m[1])) : null;
};
const oldPriceFrom = (html) => {
  const m = html.match(/"priceold":"([0-9][0-9 ]*)/);
  if (!m) return null;
  const n = parseInt(m[1].replace(/\s/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const zone = (p) => {
  if (p == null) return '';
  const k = Math.ceil(p / 1000) * 1000;
  return ` Ценовая категория: до ${k.toLocaleString('ru-RU')} руб.`;
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fetchPage = async (url) => {
  const delays = [0, 2000, 5000, 9000, 15000];
  let last = '';
  for (const d of delays) {
    if (d) await sleep(d);
    const r = await fetch(url, { headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ru-RU,ru;q=0.9',
    } });
    if (r.ok) return r.text();
    last = `HTTP ${r.status}`;
  }
  throw new Error(last);
};

const offers = [];
for (const it of ITEMS) {
  const id = it.u.match(/tproduct\/(\d+)/)[1];
  try {
    const html = await fetchPage(it.u);
    const name = attr(html, 'og:title') || '';
    const baseDesc = attr(html, 'og:description') || '';
    const picture = attr(html, 'og:image') || '';
    const price = priceFrom(html);
    const oldp = oldPriceFrom(html);
    const c = CATS[it.cat];
    const promoLine = it.promo ? ' ' + PROMO[it.promo] : '';
    // Цену в описание НЕ кладём: B24U отдаёт модели только name+description,
    // поэтому без числа в тексте бот цену не озвучит. Цена идёт структурным <price> на карточку.
    const desc = `${baseDesc} ${c.name}. Запросы: ${c.syn}.${promoLine} Опт, доставка по РФ.`.replace(/\s+/g, ' ').trim();
    offers.push({ id, name, desc, price, oldp, picture, url: it.u, catId: c.id });
    console.log(`OK  ${id}  ${name}  ${price ?? '—'}${oldp ? ' (old ' + oldp + ')' : ''}`);
  } catch (e) {
    console.log(`ERR ${id}  ${it.u}  ${e.message}`);
  }
  await sleep(1200);
}

const now = '2026-06-17T00:00:00+03:00';
const catXml = Object.values(CATS).map(c => `      <category id="${c.id}">${esc(c.name)}</category>`).join('\n');
const offXml = offers.map(o => {
  const lines = [
    `    <offer id="${o.id}" available="true">`,
    `      <url>${esc(o.url)}</url>`,
    o.price != null ? `      <price>${o.price}</price>` : '',
    o.oldp != null ? `      <oldprice>${o.oldp}</oldprice>` : '',
    `      <currencyId>RUB</currencyId>`,
    `      <categoryId>${o.catId}</categoryId>`,
    o.picture ? `      <picture>${esc(o.picture)}</picture>` : '',
    `      <vendor>KAIDZENDAO</vendor>`,
    `      <vendorCode>${o.id}</vendorCode>`,
    `      <quantity>1</quantity>`,
    `      <name>${esc(o.name)}</name>`,
    `      <description>${esc(o.desc)}</description>`,
    `    </offer>`,
  ].filter(Boolean);
  return lines.join('\n');
}).join('\n');

const yml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${now}">
  <shop>
    <name>KAIDZENDAO</name>
    <company>KAIDZENDAO</company>
    <url>https://opt.kaidzendao.ru</url>
    <currencies>
      <currency id="RUB" rate="1"/>
    </currencies>
    <categories>
${catXml}
    </categories>
    <offers>
${offXml}
    </offers>
  </shop>
</yml_catalog>
`;

writeFileSync(new URL('./kaidzendao-feed.xml', import.meta.url), yml, 'utf8');
console.log(`\nИтого офферов: ${offers.length} / ${ITEMS.length}`);
console.log(`Без цены: ${offers.filter(o => o.price == null).map(o => o.id).join(', ') || 'нет'}`);
console.log(`Файл: kaidzendao-feed.xml`);
