// script.js

// 1. 震度数値をファイル名の文字列（1, 2, 5m, 6pなど）に変換するヘルパー
function getScaleStr(scale) {
    const map = {
        10: "1", 20: "2", 30: "3", 40: "4",
        45: "5m", 50: "5p", 55: "6m", 60: "6p", 70: "7"
    };
    return map[scale] || "1";
}

// 2. ヘッダー画像の描画ロジック
// 【修正点】../ を付与して、srcフォルダから一つ上の階層のassetsへアクセスするようにしました
function updateHeader(earthquakeData) {
    const banner = document.getElementById('header-banner');
    if (!banner) return;
    
    banner.innerHTML = ''; // 一旦クリア
    
    const maxScale = earthquakeData.maxScale;
    const longPeriod = earthquakeData.longPeriodGroundMotion; // 長周期地震動の情報

    if (longPeriod) {
        // --- 長周期地震動あり：上下並び ---
        banner.style.flexDirection = 'column';
        banner.style.gap = '5px'; 

        // 上段：最大震度画像 (cj_sX.png)
        const imgS = document.createElement('img');
        imgS.src = `../assets/banner/cj_s${getScaleStr(maxScale)}.png`;
        imgS.style.height = '100px'; 
        
        // 下段：長周期階級画像 (cj_cX.png)
        const imgC = document.createElement('img');
        imgC.src = `../assets/banner/cj_c${longPeriod.maxScale}.png`;
        imgC.style.height = '100px';
        
        banner.appendChild(imgS);
        banner.appendChild(imgC);
    } else {
        // --- 長周期地震動なし：横並び（単一画像） ---
        banner.style.flexDirection = 'row';
        
        const img = document.createElement('img');
        img.src = `../assets/banner/${getScaleStr(maxScale)}.png`;
        img.style.height = '100px';
        banner.appendChild(img);
    }
}

// 3. 地図の初期化 (Leaflet)
function initMap() {
    const map = L.map('map', { 
        zoomControl: false, 
        attributionControl: false 
    }).setView([36.0, 138.0], 6);

    // タイルレイヤー
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    }).addTo(map);

    return map;
}

// 4. メイン処理
function renderSimulation(data) {
    // 地図の初期化
    const map = initMap();

    // ヘッダーの更新
    updateHeader(data.earthquake);
    
    console.log("シミュレーションの描画準備完了", data);
}

// テスト用データ（長周期地震動ありのケース）
const dummyData = {
    earthquake: {
        maxScale: 50, // 5強
        longPeriodGroundMotion: { maxScale: 2 } 
    }
};

// 読み込み完了後に実行
document.addEventListener('DOMContentLoaded', () => {
    renderSimulation(dummyData);
});
