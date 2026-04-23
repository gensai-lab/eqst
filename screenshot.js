const puppeteer = require('puppeteer');

(async () => {
  // ブラウザを起動
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // あなたのGitHub PagesのURLを指定
  await page.goto('https://gensai-lab.github.io/eqst/', { waitUntil: 'networkidle0' });

  // 地図の要素が読み込まれるまで少し待つ（必要に応じて調整）
  await page.waitForSelector('#map-content');
  await new Promise(r => setTimeout(r, 2000)); // 2秒待機（描画の余裕を持たせる）

  // スクリーンショットを撮影
  await page.screenshot({ path: 'map-snapshot.png' });

  await browser.close();
})();
