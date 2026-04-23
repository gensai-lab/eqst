const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('https://gensai-lab.github.io/eqst/template.html', { waitUntil: 'networkidle0' });

  // 日時取得
  const now = new Date();
  const timestamp = now.getFullYear() + 
    ('0'+(now.getMonth()+1)).slice(-2) + 
    ('0'+now.getDate()).slice(-2) + 
    ('0'+now.getHours()).slice(-2) + 
    ('0'+now.getMinutes()).slice(-2);

  // ★ファイル名を「yyyyMMddHHmm.png」に変更
  const fileName = `screenshots/${timestamp}.png`;
  
  await page.screenshot({ path: fileName, fullPage: true });
  console.log(`Saved: ${fileName}`);
  
  await browser.close();
})();
