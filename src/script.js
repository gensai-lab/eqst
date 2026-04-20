// 震度数値をファイル名の文字列に変換
function getScaleStr(scale) {
    const map = { 10: "1", 20: "2", 30: "3", 40: "4", 45: "5m", 50: "5p", 55: "6m", 60: "6p", 70: "7" };
    return map[scale] || "1";
}

// ヘッダーの描画ロジック
function updateHeader(data) {
    const banner = document.getElementById('header-banner');
    banner.innerHTML = '';
    
    const maxScale = data.earthquake.maxScale;
    const longPeriod = data.earthquake.longPeriodGroundMotion;

    if (longPeriod) {
        // 長周期地震動あり：縦並び
        banner.style.flexDirection = 'column';
        
        const imgS = document.createElement('img');
        imgS.src = `assets/banner/cj_s${getScaleStr(maxScale)}.png`;
        
        const imgC = document.createElement('img');
        imgC.src = `assets/banner/cj_c${longPeriod.maxScale}.png`;
        
        banner.appendChild(imgS);
        banner.appendChild(imgC);
    } else {
        // 長周期地震動なし：単一画像
        banner.style.flexDirection = 'row';
        
        const img = document.createElement('img');
        img.src = `assets/banner/${getScaleStr(maxScale)}.png`;
        banner.appendChild(img);
    }
}

// 地図の初期化 (Leaflet)
const map = L.map('map', { zoomControl: false }).setView([36, 138], 6);
// ここに TopoJSON を読み込んで描画する処理を追加していきます
