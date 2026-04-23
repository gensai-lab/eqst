const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  // ブラウザを起動
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  // ページ内のエラーをActionsのログに出力（デバッグ用）
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  // 画面サイズを設定（template.htmlに合わせて調整してください）
  await page.setViewport({ width: 1920, height: 1080 });
  
  // ★重要：アクセス先を template.html に変更
  console.log("Navigating to: https://gensai-lab.github.io/eqst/template.html");
  await page.goto('https://gensai-lab.github.io/eqst/template.html', { 
    waitUntil: 'networkidle0', // ネットワークが落ち着くまで待つ
    timeout: 60000 // タイムアウトを1分に設定
  });
  
  // ★重要：地図(#map-content)の描画を待たずに、情報パネル(#info-panelなど)が表示されたら撮影する
  // タイムアウトしてもエラーにせず、そのまま進める設定({ timeout: 10000 })
  console.log("Waiting for info panel...");
  await page.waitForSelector('#info-panel', { timeout: 10000 }).catch(() => {
      console.log("TIMEOUT: Info panel did not appear, proceeding anyway.");
  });

  // ファイル名の生成
  const now = new Date();
  const timestamp = now.getFullYear() + ('0'+(now.getMonth()+1)).slice(-2) + ('0'+now.getDate()).slice(-2) + ('0'+now.getHours()).slice(-2) + ('0'+now.getMinutes()).slice(-2);
  
  const dir = 'screenshots';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  
  const fileName = `${dir}/${timestamp}_eq_report.png`;
  
  // スクリーンショットを撮影
  await page.screenshot({ path: fileName, fullPage: true });
  console.log(`Saved: ${fileName}`);
  
  await browser.close();
})();
