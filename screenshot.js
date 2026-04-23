const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // 画面サイズを固定
  await page.setViewport({ width: 1280, height: 720 });

  // サイトへアクセス
  await page.goto('https://gensai-lab.github.io/eqst/', { waitUntil: 'networkidle0' });

  // 地図の要素が表示されるまで待機
  await page.waitForSelector('#map-content');
  await new Promise(r => setTimeout(r, 3000)); // 3秒待機

  // 撮影
  await page.screenshot({ path: 'map-snapshot.png' });
  await browser.close();
})();
