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

async function run() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to login page...");
  await page.goto('https://sovereignro.com/?module=account&action=login', { waitUntil: 'networkidle2' });

  await page.screenshot({ path: 'debug-login.png' });
  console.log("Title: " + await page.title());
  console.log("URL: " + page.url());

  const pageHtml = await page.content();
  console.log("HTML snippet: " + pageHtml.substring(0, 1000));

  await browser.close();
}

run().catch(console.error);
