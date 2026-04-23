const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('https://gensai-lab.github.io/eqst/template.html', { waitUntil: 'networkidle0' });

  // ★重要：ここで各要素のIDを指定（template.htmlに合わせて書き換えてください）
  const hypo = await page.$eval('#hypo-id', el => el.innerText.trim()).catch(() => '震源不明');
  const shindo = await page.$eval('#shindo-id', el => el.innerText.trim()).catch(() => '震度不明');

  // 日時取得
  const now = new Date();
  const timestamp = now.getFullYear() + 
    ('0'+(now.getMonth()+1)).slice(-2) + 
    ('0'+now.getDate()).slice(-2) + 
    ('0'+now.getHours()).slice(-2) + 
    ('0'+now.getMinutes()).slice(-2);

  // ファイル名を生成
  const fileName = `screenshots/${timestamp}_${hypo}_${shindo}.png`;
  
  await page.screenshot({ path: fileName, fullPage: true });
  console.log(`Saved: ${fileName}`);
  
  await browser.close();
})();
