const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('https://gensai-lab.github.io/eqst/template.html', { waitUntil: 'networkidle0' });

  // 日本時間(JST)で日時を取得
  const now = new Date();
  const jstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  
  const timestamp = jstTime.getFullYear() + 
    ('0' + (jstTime.getMonth() + 1)).slice(-2) + 
    ('0' + jstTime.getDate()).slice(-2) + 
    ('0' + jstTime.getHours()).slice(-2) + 
    ('0' + jstTime.getMinutes()).slice(-2);

  const fileName = `screenshots/${timestamp}.png`;
  
  await page.screenshot({ path: fileName, fullPage: true });
  console.log(`Saved: ${fileName}`);
  
  await browser.close();
})();
