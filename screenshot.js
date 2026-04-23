const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('https://gensai-lab.github.io/eqst/', { waitUntil: 'networkidle0' });
  
  // 地図描画を待つ
  await page.waitForSelector('#map-content', { timeout: 30000 });
  
  // ファイル名の生成
  const now = new Date();
  const timestamp = now.getFullYear() + ('0'+(now.getMonth()+1)).slice(-2) + ('0'+now.getDate()).slice(-2) + ('0'+now.getHours()).slice(-2) + ('0'+now.getMinutes()).slice(-2);
  
  // (IDなどから情報を取得してファイル名を決める ※ここは適宜調整してください)
  const fileName = `screenshots/${timestamp}_map.png`;
  
  await page.screenshot({ path: fileName });
  console.log(`Saved: ${fileName}`);
  await browser.close();
})();
