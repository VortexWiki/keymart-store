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
  const lines = [];
  lines.push('<!DOCTYPE html>');
  lines.push('<html lang="en">');
  lines.push('<head>');
  lines.push('<meta charset="UTF-8">');
  lines.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  lines.push('<title>Key-Mart Store</title>');
  lines.push('<style>');
  lines.push('* { box-sizing: border-box; margin: 0; padding: 0; }');
  lines.push('body { background: #0d1117; color: #c9d1d9; font-family: Segoe UI, sans-serif; max-width: 960px; margin: 0 auto; padding: 2rem 1rem 5rem; }');
  lines.push('h1 { font-size: 2rem; color: #f0c040; margin-bottom: 0.5rem; }');
  lines.push('.intro { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1.5rem; }');
  lines.push('.intro p { margin-top: 0.4rem; }');
  lines.push('.intro code { background: #0d1117; padding: 2px 6px; border-radius: 4px; color: #79c0ff; }');
  lines.push('.subtitle { color: #8b949e; font-size: 0.9rem; }');
  lines.push('.stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }');
  lines.push('.stat-box { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 0.6rem 1.2rem; font-size: 0.9rem; color: #8b949e; }');
  lines.push('.stat-box span { color: #f0c040; font-weight: bold; }');
  lines.push('.controls { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }');
  lines.push('input.search { background: #161b22; border: 1px solid #30363d; border-radius: 6px; color: #c9d1d9; padding: 0.5rem 1rem; font-size: 0.95rem; flex: 1; min-width: 200px; }');
  lines.push('input.search:focus { outline: none; border-color: #58a6ff; }');
  lines.push('.filter-btn { background: #21262d; border: 1px solid #30363d; border-radius: 6px; color: #c9d1d9; padding: 0.5rem 0.9rem; cursor: pointer; font-size: 0.85rem; transition: all 0.15s; }');
  lines.push('.filter-btn:hover, .filter-btn.active { background: #f0c040; color: #0d1117; border-color: #f0c040; }');
  lines.push('.wishlist-bar { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 0.8rem 1.2rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }');
  lines.push('.wishlist-count { color: #8b949e; font-size: 0.9rem; }');
  lines.push('.wishlist-count span { color: #f0c040; font-weight: bold; }');
  lines.push('.copy-wishlist-btn { background: #238636; border: none; border-radius: 6px; color: white; padding: 0.5rem 1.2rem; cursor: pointer; font-size: 0.9rem; font-weight: bold; }');
  lines.push('.copy-wishlist-btn:hover { background: #2ea043; }');
  lines.push('.clear-btn { background: transparent; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; padding: 0.5rem 0.8rem; cursor: pointer; font-size: 0.85rem; }');
  lines.push('.clear-btn:hover { border-color: #f85149; color: #f85149; }');
  lines.push('table { width: 100%; border-collapse: collapse; }');
  lines.push('.category-header td { background: #1f2937; color: #f0c040; font-weight: bold; font-size: 1rem; padding: 0.7rem 1rem; border-top: 2px solid #30363d; }');
  lines.push('.category-header.hidden { display: none; }');
  lines.push('tr.item-row:hover td { background: #161b22; }');
  lines.push('tr.item-row.hidden { display: none; }');
  lines.push('tr.item-row.selected td { background: #1a2744; }');
  lines.push('td { padding: 0.4rem 0.6rem; border-bottom: 1px solid #21262d; vertical-align: middle; }');
  lines.push('.td-check { width: 30px; }');
  lines.push('.td-icon { width: 36px; }');
  lines.push('.item-icon { width: 24px; height: 24px; object-fit: contain; }');
  lines.push('.td-name a { color: #58a6ff; text-decoration: none; }');
  lines.push('.td-name a:hover { text-decoration: underline; }');
  lines.push('.qty-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }');
  lines.push('.qty-green { background: #1a3a2a; color: #3fb950; }');
  lines.push('.qty-gray { background: #21262d; color: #8b949e; }');
  lines.push('.spinner { display: flex; align-items: center; gap: 4px; }');
  lines.push('.spin-btn { background: #21262d; border: 1px solid #30363d; border-radius: 4px; color: #c9d1d9; width: 24px; height: 24px; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0; }');
  lines.push('.spin-btn:hover { background: #30363d; }');
  lines.push('.spin-val { min-width: 24px; text-align: center; font-size: 0.9rem; color: #f0c040; font-weight: bold; }');
  lines.push('.offer-input { background: #0d1117; border: 1px solid #30363d; border-radius: 4px; color: #c9d1d9; padding: 3px 8px; font-size: 0.85rem; width: 140px; transition: border-color 0.2s; }');
  lines.push('.offer-input:focus { outline: none; border-color: #58a6ff; }');
  lines.push('.offer-input.error { border-color: #f85149; }');
  lines.push('.copy-btn { background: #21262d; border: 1px solid #30363d; border-radius: 4px; color: #c9d1d9; padding: 3px 8px; cursor: pointer; font-size: 0.85rem; }');
  lines.push('.copy-btn:hover { background: #30363d; }');
  lines.push('.bgm-player { position: fixed; bottom: 1rem; right: 1rem; z-index: 999; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 0.5rem 1rem; display: flex; align-items: center; gap: 0.6rem; }');
  lines.push('.bgm-player span { font-size: 0.8rem; color: #8b949e; }');
  lines.push('.bgm-btn { background: #21262d; border: 1px solid #30363d; border-radius: 4px; color: #c9d1d9; padding: 3px 10px; cursor: pointer; font-size: 0.9rem; }');
  lines.push('.bgm-btn:hover { background: #30363d; }');
  lines.push('.toast { position: fixed; bottom: 4rem; right: 1rem; background: #238636; color: white; padding: 0.7rem 1.4rem; border-radius: 8px; font-size: 0.9rem; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 1000; }');
  lines.push('.toast.show { opacity: 1; }');
  lines.push('footer { text-align: center; color: #8b949e; font-size: 0.8rem; margin-top: 2rem; }');
  lines.push('</style>');
  lines.push('</head>');
  lines.push('<body>');
  lines.push('<h1>&#x1F6D2; Key-Mart\' Store</h1>');
  lines.push('<div class="intro">');
  lines.push('<p class="subtitle">&#x1F4E6; Inventory last updated on ' + dateStr + '</p>');
  lines.push('<p>To make an offer, tag <strong>' + DISCORD_USERNAME + '</strong> with the item name and your price.</p>');
  lines.push('<p>Example: <code>' + DISCORD_USERNAME + ' Crimson Revolver x2 - offer: 50,000z total</code></p>');
  lines.push('</div>');
  lines.push('<div class="stats">');
  lines.push('<div class="stat-box">Total items: <span>' + totalItems + '</span></div>');
  lines.push('<div class="stat-box">Updated: <span id="time-ago">just now</span></div>');
  lines.push('</div>');
  lines.push('<div class="controls">');
  lines.push('<input type="text" class="search" id="search" placeholder="Search items...">');
  lines.push('<button class="filter-btn active" onclick="filterCat(\'all\', this)">All</button>');
  lines.push(filterButtons);
  lines.push('</div>');
  lines.push('<div class="wishlist-bar">');
  lines.push('<div class="wishlist-count">Wishlist: <span id="wish-count">0</span> item(s)</div>');
  lines.push('<button class="copy-wishlist-btn" onclick="copyWishlist()">Copy Wishlist Message</button>');
  lines.push('<button class="clear-btn" onclick="clearWishlist()">Clear</button>');
  lines.push('</div>');
  lines.push('<table id="inventory-table"><tbody>');
  lines.push(tableRows);
  lines.push('</tbody></table>');
  lines.push('<footer>Key-Mart\' Store - SovereignRO - ' + dateStr + '</footer>');
  lines.push('<div class="bgm-player">');
  lines.push('<span>BGM</span>');
  lines.push('<audio id="bgm" src="' + BGM_URL + '" loop></audio>');
  lines.push('<button class="bgm-btn" id="music-btn" onclick="toggleMusic()">Play</button>');
  lines.push('</div>');
  lines.push('<div class="toast" id="toast"></div>');
  lines.push('<script>');
  lines.push('var UPDATED_AT = ' + nowMs + ';');
  lines.push('var DISCORD_USER = "' + DISCORD_USERNAME + '";');
  lines.push('document.addEventListener("click", function startBgm() {');
  lines.push('  var audio = document.getElementById("bgm");');
  lines.push('  audio.play().then(function() { document.getElementById("music-btn").textContent = "Pause"; }).catch(function() {});');
  lines.push('  document.removeEventListener("click", startBgm);');
  lines.push('}, { once: true });');
  lines.push('function showToast(msg, error) {');
  lines.push('  var t = document.getElementById("toast");');
  lines.push('  t.textContent = msg;');
  lines.push('  t.style.background = error ? "#b91c1c" : "#238636";');
  lines.push('  t.classList.add("show");');
  lines.push('  setTimeout(function() { t.classList.remove("show"); }, 2500);');
  lines.push('}');
  lines.push('function changeQty(id, delta, max) {');
  lines.push('  var el = document.getElementById("spin-" + id);');
  lines.push('  var val = parseInt(el.textContent) + delta;');
  lines.push('  if (val < 1) val = 1;');
  lines.push('  if (max && val > max) val = max;');
  lines.push('  el.textContent = val;');
  lines.push('}');
  lines.push('function getSelectedQty(id) {');
  lines.push('  var el = document.getElementById("spin-" + id);');
  lines.push('  return el ? parseInt(el.textContent) : 1;');
  lines.push('}');
  lines.push('function copyItem(id, name, maxQty) {');
  lines.push('  var offerEl = document.querySelector(".offer-input[data-id=\\"" + id + "\\"]");');
  lines.push('  var offer = offerEl ? offerEl.value.trim() : "";');
  lines.push('  if (!offer) {');
  lines.push('    if (offerEl) { offerEl.classList.add("error"); offerEl.focus(); }');
  lines.push('    showToast("Please enter an offer first", true);');
  lines.push('    return;');
  lines.push('  }');
  lines.push('  offerEl.classList.remove("error");');
  lines.push('  var qty = getSelectedQty(id);');
  lines.push('  var text = DISCORD_USER + " " + name + " x" + qty + " - offer: " + offer + "z total";');
  lines.push('  navigator.clipboard.writeText(text).then(function() { showToast("Copied!"); });');
  lines.push('}');
  lines.push('function updateWishCount() {');
  lines.push('  document.getElementById("wish-count").textContent = document.querySelectorAll(".item-check:checked").length;');
  lines.push('}');
  lines.push('document.addEventListener("change", function(e) {');
  lines.push('  if (e.target.classList.contains("item-check")) {');
  lines.push('    e.target.closest("tr").classList.toggle("selected", e.target.checked);');
  lines.push('    updateWishCount();');
  lines.push('  }');
  lines.push('});');
  lines.push('document.addEventListener("input", function(e) {');
  lines.push('  if (e.target.classList.contains("offer-input") && e.target.value.trim()) {');
  lines.push('    e.target.classList.remove("error");');
  lines.push('  }');
  lines.push('});');
  lines.push('function copyWishlist() {');
  lines.push('  var checked = Array.from(document.querySelectorAll(".item-check:checked"));');
  lines.push('  if (checked.length === 0) { showToast("No items selected", true); return; }');
  lines.push('  var hasError = false;');
  lines.push('  checked.forEach(function(cb) {');
  lines.push('    var offerEl = document.querySelector(".offer-input[data-id=\\"" + cb.dataset.id + "\\"]");');
  lines.push('    if (!offerEl || !offerEl.value.trim()) { if (offerEl) offerEl.classList.add("error"); hasError = true; }');
  lines.push('    else if (offerEl) offerEl.classList.remove("error");');
  lines.push('  });');
  lines.push('  if (hasError) { showToast("Please fill in all offers", true); return; }');
  lines.push('  var msg = DISCORD_USER + " I am interested in the following items:\\n\\n";');
  lines.push('  checked.forEach(function(cb) {');
  lines.push('    var qty = getSelectedQty(cb.dataset.id);');
  lines.push('    var offerEl = document.querySelector(".offer-input[data-id=\\"" + cb.dataset.id + "\\"]");');
  lines.push('    var offer = offerEl ? offerEl.value.trim() : "???";');
  lines.push('    msg += "- " + cb.dataset.name + " x" + qty + " - offer: " + offer + "z total\\n";');
  lines.push('  });');
  lines.push('  navigator.clipboard.writeText(msg).then(function() { showToast("Wishlist copied!"); });');
  lines.push('}');
  lines.push('function clearWishlist() {');
  lines.push('  document.querySelectorAll(".item-check:checked").forEach(function(cb) {');
  lines.push('    cb.checked = false;');
  lines.push('    cb.closest("tr").classList.remove("selected");');
  lines.push('  });');
  lines.push('  document.querySelectorAll(".offer-input").forEach(function(i) { i.value = ""; i.classList.remove("error"); });');
  lines.push('  document.querySelectorAll(".spin-val").forEach(function(el) { el.textContent = "1"; });');
  lines.push('  updateWishCount();');
  lines.push('}');
  lines.push('var activeFilter = "all";');
  lines.push('function filterCat(cat, btn) {');
  lines.push('  activeFilter = cat;');
  lines.push('  document.querySelectorAll(".filter-btn").forEach(function(b) { b.classList.remove("active"); });');
  lines.push('  btn.classList.add("active");');
  lines.push('  applyFilters();');
  lines.push('}');
  lines.push('document.getElementById("search").addEventListener("input", applyFilters);');
  lines.push('function applyFilters() {');
  lines.push('  var q = document.getElementById("search").value.toLowerCase();');
  lines.push('  document.querySelectorAll("tr.item-row").forEach(function(row) {');
  lines.push('    var nameMatch = row.dataset.name.includes(q);');
  lines.push('    var catMatch = activeFilter === "all" || row.dataset.cat === activeFilter;');
  lines.push('    row.classList.toggle("hidden", !(nameMatch && catMatch));');
  lines.push('  });');
  lines.push('  document.querySelectorAll("tr.category-header").forEach(function(header) {');
  lines.push('    var cat = header.dataset.cat;');
  lines.push('    var visible = Array.from(document.querySelectorAll("tr.item-row[data-cat=\\"" + cat + "\\"]")).some(function(r) { return !r.classList.contains("hidden"); });');
  lines.push('    header.classList.toggle("hidden", !visible);');
  lines.push('  });');
  lines.push('}');
  lines.push('function toggleMusic() {');
  lines.push('  var audio = document.getElementById("bgm");');
  lines.push('  var btn = document.getElementById("music-btn");');
  lines.push('  if (audio.paused) { audio.play(); btn.textContent = "Pause"; }');
  lines.push('  else { audio.pause(); btn.textContent = "Play"; }');
  lines.push('}');
  lines.push('setInterval(function() {');
  lines.push('  var diff = Math.floor((Date.now() - UPDATED_AT) / 60000);');
  lines.push('  var el = document.getElementById("time-ago");');
  lines.push('  if (!el) return;');
  lines.push('  if (diff < 1) el.textContent = "just now";');
  lines.push('  else if (diff < 60) el.textContent = diff + "m ago";');
  lines.push('  else el.textContent = Math.floor(diff / 60) + "h ago";');
  lines.push('}, 30000);');
  lines.push('<\/script>');
  lines.push('</body>');
  lines.push('</html>');
  return lines.join('\n');
}

async function run() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  console.log("Logging in...");
  await page.goto('https://sovereignro.com/?module=account&action=login', { waitUntil: 'networkidle2' });

  await page.waitForSelector('input[name="username"]', { timeout: 10000 });
  await page.type('input[name="username"]', process.env.RO_USERNAME);
  await page.type('input[name="password"]', process.env.RO_PASSWORD);

  await Promise.all([
    page.click('input[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  console.log("Logged in, URL: " + page.url());

  console.log("Loading storage...");
  await page.goto('https://sovereignro.com/?module=storage', { waitUntil: 'networkidle2' });

  const rawItems = await page.evaluate(function() {
    const rows = Array.from(document.querySelectorAll("table tr")).slice(1);
    const items = [];
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 2) continue;
      const nameEl = row.querySelector("span.item_name");
      if (!nameEl) continue;
      const name = nameEl.textContent.trim();
      const link = row.querySelector("a[href*='module=item']");
      const idMatch = link ? link.href.match(/id=(\d+)/) : null;
      if (!idMatch) continue;
      const id = idMatch[1];
      const qtyCell = cells.find(function(td) {
        return /^\d+$/.test(td.textContent.trim()) && !td.querySelector("a") && td.className === "";
      });
      const qty = qtyCell ? parseInt(qtyCell.textContent.trim()) : 1;
      items.push({ id: id, name: name, qty: qty });
    }
    return items;
  });

  const map = {};
  for (const item of rawItems) {
    if (map[item.id]) map[item.id].qty += item.qty;
    else map[item.id] = { id: item.id, name: item.name, qty: item.qty };
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
        const type = await itemPage.evaluate(function() {
          const ths = Array.from(document.querySelectorAll("th"));
          const th = ths.find(function(x) { return x.textContent.trim() === "Type"; });
          return th && th.nextElementSibling ? th.nextElementSibling.textContent.trim() : null;
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
    groups[type].push({ id: items[i].id, name: items[i].name, qty: items[i].qty, icon: "https://sovereignro.com/" + items[i].id + ".png" });
  }

  const sortedCategories = Object.keys(groups).sort();
  for (const cat of sortedCategories) {
    groups[cat].sort(function(a, b) { return a.name.localeCompare(b.name); });
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
    tableRows += '<tr class="category-header" data-cat="' + cat + '"><td colspan="7">' + cat + '</td></tr>';
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

  const filterButtons = sortedCategories.map(function(cat) {
    return '<button class="filter-btn" onclick="filterCat(\'' + cat + '\', this)">' + cat + '</button>';
  }).join('');

  const html = buildHTML(dateStr, nowMs, totalItems, tableRows, filterButtons);
  fs.writeFileSync('index.html', html);
  console.log("index.html generated successfully!");
}

run().catch(console.error);
