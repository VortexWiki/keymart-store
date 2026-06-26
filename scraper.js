const puppeteer = require('puppeteer');
const fs = require('fs');

const DISCORD_USERNAME = "@aptvortex";
const BGM_URL = "https://raw.githubusercontent.com/VortexWiki/keymart-store/main/01.mp3";

const TYPE_MAP = {
  "Weapon": "Weapons",
  "Armor": "Armor",
};

function normalizeType(raw) {
  if (!raw) return "Unknown";
  const base = raw.split("-")[0].trim();
  return TYPE_MAP[base] ?? base;
}

function buildHTML(dateStr, nowMs, totalItems, tableRows, filterButtons) {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>Key-Mart Store</title>',
    '<style>',
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    'body { background: #0d1117; color: #c9d1d9; font-family: Segoe UI, sans-serif; max-width: 960px; margin: 0 auto; padding: 2rem 1rem 5rem; }',
    'h1 { font-size: 2rem; color: #f0c040; margin-bottom: 0.5rem; }',
    '.intro { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1.5rem; }',
    '.intro p { margin-top: 0.4rem; }',
    '.intro code { background: #0d1117; padding: 2px 6px; border-radius: 4px; color: #79c0ff; }',
    '.subtitle { color: #8b949e; font-size: 0.9rem; }',
    '.stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }',
    '.stat-box { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 0.6rem 1.2rem; font-size: 0.9rem; color: #8b949e; }',
    '.stat-box span { color: #f0c040; font-weight: bold; }',
    '.controls { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }',
    'input.search { background: #161b22; border: 1px solid #30363d; border-radius: 6px; color: #c9d1d9; padding: 0.5rem 1rem; font-size: 0.95rem; flex: 1; min-width: 200px; }',
    'input.search:focus { outline: none; border-color: #58a6ff; }',
    '.filter-btn { background: #21262d; border: 1px solid #30363d; border-radius: 6px; color: #c9d1d9; padding: 0.5rem 0.9rem; cursor: pointer; font-size: 0.85rem; transition: all 0.15s; }',
    '.filter-btn:hover, .filter-btn.active { background: #f0c040; color: #0d1117; border-color: #f0c040; }',
    '.wishlist-bar { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 0.8rem 1.2rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }',
    '.wishlist-count { color: #8b949e; font-size: 0.9rem; }',
    '.wishlist-count span { color: #f0c040; font-weight: bold; }',
    '.copy-wishlist-btn { background: #238636; border: none; border-radius: 6px; color: white; padding: 0.5rem 1.2rem; cursor: pointer; font-size: 0.9rem; font-weight: bold; }',
    '.copy-wishlist-btn:hover { background: #2ea043; }',
    '.clear-btn { background: transparent; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; padding: 0.5rem 0.8rem; cursor: pointer; font-size: 0.85rem; }',
    '.clear-btn:hover { border-color: #f85149; color: #f85149; }',
    'table { width: 100%; border-collapse: collapse; }',
    '.category-header td { background: #1f2937; color: #f0c040; font-weight: bold; font-size: 1rem; padding: 0.7rem 1rem; border-top: 2px solid #30363d; }',
    '.category-header.hidden { display: none; }',
    'tr.item-row:hover td { background: #161b22; }',
    'tr.item-row.hidden { display: none; }',
    'tr.item-row.selected td { background: #1a2744; }',
    'td { padding: 0.4rem 0.6rem; border-bottom: 1px solid #21262d; vertical-align: middle; }',
    '.td-check { width: 30px; }',
    '.td-icon { width: 36px; }',
    '.item-icon { width: 24px; height: 24px; object-fit: contain; }',
    '.td-name a { color: #58a6ff; text-decoration: none; }',
    '.td-name a:hover { text-decoration: underline; }',
    '.qty-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }',
    '.qty-green { background: #1a3a2a; color: #3fb950; }',
    '.qty-gray { background: #21262d; color: #8b949e; }',
    '.spinner { display: flex; align-items: center; gap: 4px; }',
    '.spin-btn { background: #21262d; border: 1px solid #30363d; border-radius: 4px; color: #c9d1d9; width: 24px; height: 24px; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0; }',
    '.spin-btn:hover { background: #30363d; }',
    '.spin-val { min-width: 24px; text-align: center; font-size: 0.9rem; color: #f0c040; font-weight: bold; }',
    '.offer-input { background: #0d1117; border: 1px solid #30363d; border-radius: 4px; color: #c9d1d9; padding: 3px 8px; font-size: 0.85rem; width: 140px; transition: border-color 0.2s; }',
    '.offer-input:focus { outline: none; border-color: #58a6ff; }',
    '.offer-input.error { border-color: #f85149; }',
    '.copy-btn { background: #21262d; border: 1px solid #30363d; border-radius: 4px; color: #c9d1d9; padding: 3px 8px; cursor: pointer; font-size: 0.85rem; }',
    '.copy-btn:hover { background: #30363d; }',
    '.bgm-player { position: fixed; bottom: 1rem; right: 1rem; z-index: 999; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 0.5rem 1rem; display: flex; align-items: center; gap: 0.6rem; }',
    '.bgm-player span { font-size: 0.8rem; color: #8b949e; }',
    '.bgm-btn { background: #21262d; border: 1px solid #30363d; border-radius: 4px; color: #c9d1d9; padding: 3px 10px; cursor: pointer; font-size: 0.9rem; }',
    '.bgm-btn:hover { background: #30363d; }',
    '.toast { position: fixed; bottom: 4rem; right: 1rem; background: #238636; color: white; padding: 0.7rem 1.4rem; border-radius: 8px; font-size: 0.9rem; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 1000; }',
    '.toast.show { opacity: 1; }',
    'footer { text-align: center; color: #8b949e; font-size: 0.8rem; margin-top: 2rem; }',
    '</style>',
    '</head>',
    '<body>',
    '<h1>&#x1F6D2; Key-Mart\' Store</h1>',
    '<div class="intro">',
    '<p class="subtitle">&#x1F4E6; Inventory last updated on ' + dateStr + '</p>',
    '<p>To make an offer, tag <strong>' + DISCORD_USERNAME + '</strong> with the item name and your price.</p>',
    '<p>Example: <code>' + DISCORD_USERNAME + ' Crimson Revolver x2 - offer: 50,000z total</code></p>',
    '</div>',
    '<div class="stats">',
    '<div class="stat-box">Total items: <span>' + totalItems + '</span></div>',
    '<div class="stat-box">Updated: <span id="time-ago">just now</span></div>',
    '</div>',
    '<div class="controls">',
    '<input type="text" class="search" id="search" placeholder="Search items...">',
    '<button class="filter-btn active" onclick="filterCat(\'all\', this)">All</button>',
    filterButtons,
    '</div>',
    '<div class="wishlist-bar">',
    '<div class="wishlist-count">Wishlist: <span id="wish-count">0</span> item(s)</div>',
    '<button class="copy-wishlist-btn" onclick="copyWishlist()">&#x1F4CB; Copy Wishlist Message</button>',
    '<button class="clear-btn" onclick="clearWishlist()">&#x2715; Clear</button>',
    '</div>',
    '<table id="inventory-table"><tbody>',
    tableRows,
    '</tbody></table>',
    '<footer>Key-Mart\' Store &middot; SovereignRO &middot; ' + dateStr + '</footer>',
    '<div class="bgm-player">',
    '<span>&#x1F3B5; BGM</span>',
    '<audio id="bgm" src="' + BGM_URL + '" loop></audio>',
    '<button class="bgm-btn" id="music-btn" onclick="toggleMusic()">&#x25B6;&#xFE0F;</button>',
    '</div>',
    '<div class="toast" id="toast"></div>',
    '<script>',
    'const UPDATED_AT = ' + nowMs + ';',
    'const DISCORD_USER = "' + DISCORD_USERNAME + '";',
    'document.addEventListener("click", function startBgm() {',
    '  const audio = document.getElementById("bgm");',
    '  audio.play().then(() => { document.getElementById("music-btn").textContent = "⏸️"; }).catch(() => {});',
    '  document.removeEventListener("click", startBgm);',
    '}, { once: true });',
    'function showToast(msg, error) {',
    '  const t = document.getElementById("toast");',
    '  t.textContent = msg;',
    '  t.style.background = error ? "#b91c1c" : "#238636";',
    '  t.classList.add("show");',
    '  setTimeout(() => t.classList.remove("show"), 2500);',
    '}',
    'function changeQty(id, delta, max) {',
    '  const el = document.getElementById("spin-" + id);',
    '  let val = parseInt(el.textContent) + delta;',
    '  if (val < 1) val = 1;',
    '  if (max && val > max) val = max;',
    '  el.textContent = val;',
    '}',
    'function getSelectedQty(id) {',
    '  return parseInt(document.getElementById("spin-" + id)?.textContent ?? 1);',
    '}',
    'function copyItem(id, name, maxQty) {',
    '  const offerEl = document.querySelector(".offer-input[data-id=" + id + "]");',
    '  const offer = offerEl?.value?.trim();',
    '  if (!offer) { offerEl.classList.add("error"); offerEl.focus(); showToast("Please enter an offer first", true); return; }',
    '  offerEl.classList.remove("error");',
    '  const qty = getSelectedQty(id);',
    '  const text = DISCORD_USER + " " + name + " x" + qty + " - offer: " + offer + "z total";',
    '  navigator.clipboard.writeText(text).then(() => showToast("Copied!"));',
    '}',
    'function updateWishCount() {',
    '  document.getElementById("wish-count").textContent = document.querySelectorAll(".item-check:checked").length;',
    '}',
    'document.addEventListener("change", e => {',
    '  if (e.target.classList.contains("item-check")) {',
    '    e.target.closest("tr").classList.toggle("selected", e.target.checked);',
    '    updateWishCount();',
    '  }',
    '});',
    'document.addEventListener("input", e => {',
    '  if (e.target.classList.contains("offer-input") && e.target.value.trim()) {',
    '    e.target.classList.remove("error");',
    '  }',
    '});',
    'function copyWishlist() {',
    '  const checked = [...document.querySelectorAll(".item-check:checked")];',
    '  if (checked.length === 0) { showToast("No items selected", true); return; }',
    '  let hasError = false;',
    '  for (const cb of checked) {',
    '    const offerEl = document.querySelector(".offer-input[data-id=" + cb.dataset.id + "]");',
    '    if (!offerEl?.value?.trim()) { offerEl.classList.add("error"); hasError = true; }',
    '    else offerEl.classList.remove("error");',
    '  }',
    '  if (hasError) { showToast("Please fill in all offers", true); return; }',
    '  let msg = DISCORD_USER + " I am interested in the following items:\\n\\n";',
    '  for (const cb of checked) {',
    '    const qty = getSelectedQty(cb.dataset.id);',
    '    const offer = document.querySelector(".offer-input[data-id=" + cb.dataset.id + "]").value.trim();',
    '    msg += "- " + cb.dataset.name + " x" + qty + " - offer: " + offer + "z total\\n";',
    '  }',
    '  navigator.clipboard.writeText(msg).then(() => showToast("Wishlist copied!"));',
    '}',
    'function clearWishlist() {',
    '  document.querySelectorAll(".item-check:checked").forEach(cb => {',
    '    cb.checked = false;',
    '    cb.closest("tr").classList.remove("selected");',
    '  });',
    '  document.querySelectorAll(".offer-input").forEach(i => { i.value = ""; i.classList.remove("error"); });',
    '  document.querySelectorAll(".spin-val").forEach(el => el.textContent = "1");',
    '  updateWishCount();',
    '}',
    'let activeFilter = "all";',
    'function filterCat(cat, btn) {',
    '  activeFilter = cat;',
    '  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));',
    '  btn.classList.add("active");',
    '  applyFilters();',
    '}',
    'document.getElementById("search").addEventListener("input", applyFilters);',
    'function applyFilters() {',
    '  const q = document.getElementById("search").value.toLowerCase();',
    '  document.querySelectorAll("tr.item-row").forEach(row => {',
    '    const nameMatch = row.dataset.name.includes(q);',
    '    const catMatch = activeFilter === "all" || row.dataset.cat === activeFilter;',
    '    row.classList.toggle("hidden", !(nameMatch && catMatch));',
    '  });',
    '  document.querySelectorAll("tr.category-header").forEach(header => {',
    '    const cat = header.dataset.cat;',
    '    const visible = [...document.querySelectorAll("tr.item-row[data-cat=" + cat + "]")].some(r => !r.classList.contains("hidden"));',
    '    header.classList.toggle("hidden", !visible);',
    '  });',
    '}',
    'function toggleMusic() {',
    '  const audio = document.getElementById("bgm");',
    '  const btn = document.getElementById("music-btn");',
    '  if (audio.paused) { audio.play(); btn.textContent = "⏸️"; }',
    '  else { audio.pause(); btn.textContent = "▶️"; }',
    '}',
    'setInterval(() => {',
    '  const diff = Math.floor((Date.now() - UPDATED_AT) / 60000);',
    '  const el = document.getElementById("time-ago");',
    '  if (diff < 1) el.textContent = "just now";',
    '  else if (diff < 60) el.textContent = diff + "m ago";',
    '  else el.textContent = Math.floor(diff / 60) + "h ago";',
    '}, 30000);',
    '<\/script>',
    '</body>',
    '</html>'
  ].join('\n');
}

async function run() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  console.log("Logging in...");
  await page.goto('https://sovereignro.com/?module=account&action=login', { waitUntil: 'networkidle2' });

  await page.type('input[name="username"]', process.env.RO_USERNAME);
  await page.type('input[name="password"]', process.env.RO_PASSWORD);
  await Promise.all([
    page.click('input[type="submit"], button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  console.log("Loading storage...");
  await page.goto('https://sovereignro.com/?module=storage', { waitUntil: 'networkidle2' });

  const rawItems = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("table tr")].slice(1);
    const items = [];
    for (const row of rows) {
      const cells = [...row.querySelectorAll("td")];
      if (cells.length < 2) continue;
      const nameEl = row.querySelector("span.item_name");
      if (!nameEl) continue;
      const name = nameEl.textContent.trim();
      const link = row.querySelector("a[href*='module=item']");
      const idMatch = link?.href.match(/id=(\d+)/);
      if (!idMatch) continue;
      const id = idMatch[1];
      const qty = parseInt(
        cells.find(td =>
          /^\d+$/.test(td.textContent.trim()) &&
          !td.querySelector("a") &&
          td.className === ""
        )?.textContent.trim()
      ) || 1;
      items.push({ id, name, qty });
    }
    return items;
  });

  const map = {};
  for (const item of rawItems) {
    if (map[item.id]) map[item.id].qty += item.qty;
    else map[item.id] = { ...item };
  }
  const items = Object.values(map);

  console.log(rawItems.length + " rows -> " + items.length + " unique items. Fetching types...");

  const CONCURRENCY = 5;
  const results = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      const item = items[i];
      try {
        const itemPage = await browser.newPage();
        await itemPage.goto("https://sovereignro.com/?module=item&action=view&id=" + item.id, { waitUntil: 'networkidle2' });
        const type = await itemPage.evaluate(() => {
          const th = [...document.querySelectorAll("th")].find(x => x.textContent.trim() === "Type");
          return th?.nextElementSibling?.textContent.trim() ?? null;
        });
        await itemPage.close();
        results[i] = normalizeType(type);
      } catch(e) {
        results[i] = "Unknown";
      }
      if ((i + 1) % 10 === 0) console.log((i + 1) + "/" + items.length + "...");
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();

  const groups = {};
  for (let i = 0; i < items.length; i++) {
    const type = results[i];
    if (!groups[type]) groups[type] = [];
    groups[type].push({ ...items[i], icon: "https://sovereignro.com/" + items[i].id + ".png" });
  }

  const sortedCategories = Object.keys(groups).sort();
  for (const cat of sortedCategories) {
    groups[cat].sort((a, b) => a.name.localeCompare(b.name));
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
  const nowMs = now.getTime();
  const totalItems = items.length;

  let tableRows = "";
  for (const cat of sortedCategories) {
    tableRows += '<tr class="category-header" data-cat="' + cat + '"><td colspan="6">' + cat + '</td></tr>';
    for (const item of groups[cat]) {
      const qtyClass = item.qty > 1 ? "qty-green" : "qty-gray";
      const safeName = item.name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
      tableRows += '<tr class="item-row" data-name="' + item.name.toLowerCase() + '" data-cat="' + cat + '">';
      tableRows += '<td class="td-check"><input type="checkbox" class="item-check" data-id="' + item.id + '" data-name="' + item.name + '" data-qty="' + item.qty + '"></td>';
      tableRows += '<td class="td-icon"><img src="' + item.icon + '" alt="' + item.name + '" class="item-icon" onerror="this.style.display=\'none\'"></td>';
      tableRows += '<td class="td-name"><a href="https://sovereignro.com/?module=item&action=view&id=' + item.id + '" target="_blank">' + item.name + '</a></td>';
      tableRows += '<td class="td-qty"><span class="qty-badge ' + qtyClass + '">x' + item.qty + '</span></td>';
      tableRows += '<td class="td-spinner"><div class="spinner">';
      tableRows += '<button class="spin-btn" onclick="changeQty(\'' + item.id + '\', -1)">-</button>';
      tableRows += '<span class="spin-val" id="spin-' + item.id + '">1</span>';
      tableRows += '<button class="spin-btn" onclick="changeQty(\'' + item.id + '\', 1, ' + item.qty + ')">+</button>';
      tableRows += '</div></td>';
      tableRows += '<td class="td-offer"><input type="text" class="offer-input" placeholder="offer / total (z)" data-id="' + item.id + '"></td>';
      tableRows += '<td class="td-copy"><button class="copy-btn" onclick="copyItem(\'' + item.id + '\',\'' + safeName + '\',' + item.qty + ')">Copy</button></td>';
      tableRows += '</tr>';
    }
  }

  const filterButtons = sortedCategories.map(cat =>
    '<button class="filter-btn" onclick="filterCat(\'' + cat + '\', this)">' + cat + '</button>'
  ).join('');

  const html = buildHTML(dateStr, nowMs, totalItems, tableRows, filterButtons);
  fs.writeFileSync('index.html', html);
  console.log("index.html generated successfully!");
}

run().catch(console.error);
