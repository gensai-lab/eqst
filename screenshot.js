const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  await page.goto('https://gensai-lab.github.io/eqst/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('#map-content');
  await new Promise(r => setTimeout(r, 3000)); // 描画待機

  // 1. データの取得（画面上の要素から文字列を取得）
  const hypoName = await page.$eval('#hypo-val', el => el.innerText.trim());
  
  // 震度画像からファイル名を取得し、震度に変換する簡単なロジック
  const intensity = await page.$eval('#max-scale-container img', img => {
      const src = img.src;
      if (src.includes('7.png')) return '震度7';
      if (src.includes('6p.png')) return '震度6強';
      if (src.includes('6m.png')) return '震度6弱';
      if (src.includes('5p.png')) return '震度5強';
      if (src.includes('5m.png')) return '震度5弱';
      if (src.includes('4.png')) return '震度4';
      if (src.includes('3.png')) return '震度3';
      if (src.includes('2.png')) return '震度2';
      if (src.includes('1.png')) return '震度1';
      return '震度不明';
  }).catch(() => '震度なし');

  // 2. 日時の取得（ファイル名用）
  const now = new Date();
  const timestamp = now.getFullYear() + 
    ('0' + (now.getMonth()+1)).slice(-2) + 
    ('0' + now.getDate()).slice(-2) + 
    ('0' + now.getHours()).slice(-2) + 
    ('0' + now.getMinutes()).slice(-2);

  // 3. 保存先の作成と保存
  const dir = 'screenshots';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  
  const fileName = `${timestamp}_${hypoName}_${intensity}.png`;
  await page.screenshot({ path: `${dir}/${fileName}` });
  
  console.log(`Saved: ${dir}/${fileName}`);
  await browser.close();
})();
