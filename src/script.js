// 【どこか】データを格納するグローバル変数
window.currentEarthquakeData = null;

// P2P地震情報APIからデータを取得
async function fetchEarthquakeData() {
    try {
        const response = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=1');
        if (!response.ok) throw new Error('API取得失敗');
        
        const data = await response.json();
        
        if (data.length > 0) {
            window.currentEarthquakeData = data[0];
            console.log("最新データ取得:", window.currentEarthquakeData);
            renderUI(window.currentEarthquakeData);
        }
    } catch (error) {
        console.error("エラー:", error);
    }
}

// 震度数値をファイル名用に変換
function getScaleStr(scale) {
    const map = {
        10: "1", 20: "2", 30: "3", 40: "4",
        45: "5m", 50: "5p", 55: "6m", 60: "6p", 70: "7"
    };
    return map[scale] || null;
}

// UIの更新
function renderUI(earthquake) {
    const scale = earthquake.earthquake.maxScale;
    const scaleStr = getScaleStr(scale);
    
    // 最大震度画像の更新
    const img = document.getElementById('scale-img');
    if (scaleStr) {
        img.src = `../assets/banner/${scaleStr}.png`;
        img.style.display = 'block';
    }
    
    // テキスト情報の更新
    const infoText = document.getElementById('info-text');
    infoText.innerText = `${earthquake.earthquake.time} 震源: ${earthquake.earthquake.hypocenter.name}`;
}

// 地図の初期化
function initMap() {
    const map = L.map('map', { zoomControl: false, attributionControl: false })
                 .setView([36.0, 138.0], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    return map;
}

// 初期実行
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchEarthquakeData();
    
    // 30秒ごとに自動更新（必要に応じて調整）
    setInterval(fetchEarthquakeData, 30000);
});
