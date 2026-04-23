const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // ★追加：Webページ内のエラーやログを、Actionsのログに出力する
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure().errorText));

  await page.setViewport({ width: 1280, height: 720 });

  try {
    console.log("Navigating to page...");
    // タイムアウトを少し長めに設定(60秒)
    await page.goto('https://gensai-lab.github.io/eqst/', { waitUntil: 'networkidle0', timeout: 60000 });
    console.log("Navigation complete.");

    console.log("Waiting for selector...");
    await page.waitForSelector('#map-content', { timeout: 30000 });
    console.log("Selector found!");

    // データの取得と保存処理
    const hypoName = await page.$eval('#hypo-val', el => el.innerText.trim()).catch(() => '不明');
    const intensity = await page.$eval('#max-scale-container img', img => img.src).catch(() => 'なし');
    
    // (中略: 保存ファイル名の生成ロジックは以前のものを使用してください)
    const now = new Date();
    const timestamp = now.getFullYear() + ('0' + (now.getMonth()+1)).slice(-2) + ('0' + now.getDate()).slice(-2) + ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2);
    
    const dir = 'screenshots';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const fileName = `${timestamp}_${hypoName}_${intensity.split('/').pop().split('.')[0]}.png`;
    
    await page.screenshot({ path: `${dir}/${fileName}` });
    console.log(`Saved: ${dir}/${fileName}`);

  } catch (e) {
    console.error("DEBUG: Failed to take screenshot. Taking full-page debug screenshot...");
    await page.screenshot({ path: 'debug-error.png' }); // エラー時の全画面保存
    throw e; // エラー終了させる
  }

  await browser.close();
})();
