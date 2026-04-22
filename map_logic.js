// map_logic.js

let pointsData = {}; // 座標データ格納用

// points.jsonの読み込み
const pointsReady = d3.json("assets/json/points.json").then(data => {
    pointsData = data;
    console.log("座標データの読み込みが完了しました。");
});

// 震度アイコンのファイル名マッピング
function getScaleFileName(scale) {
    const map = { 10: '1', 20: '2', 30: '3', 40: '4', 45: '5m', 50: '5p', 55: '6m', 60: '6p', 70: '7' };
    return map[scale] || null;
}

// --- P2P直接取得機能 ---
async function fetchLatestEarthquake() {
    try {
        console.log("P2P APIから最新情報を取得中...");
        const response = await fetch("https://api.p2pquake.net/v2/history?codes=551&limit=1");
        const data = await response.json();
        
        if (data && data.length > 0) {
            const latestEarthquake = data[0];
            console.log("P2P APIからデータを受信:", latestEarthquake);
            processEarthquakeData(latestEarthquake);
        }
    } catch (err) {
        console.error("P2P APIの取得に失敗しました:", err);
    }
}

// データの処理と描画の統合関数
async function processEarthquakeData(rawData) {
    // 地図と座標の準備を待つ
    await Promise.all([mapReady, pointsReady]);

    // 震度アイコンの描画
    if (rawData.earthquake && rawData.earthquake.points) {
        renderIcons(rawData.earthquake.points);
    }
    
    // 震源地の描画
    if (rawData.earthquake && rawData.earthquake.hypocenter) {
        renderHypocenter(rawData.earthquake.hypocenter);
    }
}

// 定期実行 (10秒ごと)
setInterval(fetchLatestEarthquake, 10000);
// 初回実行
fetchLatestEarthquake();

// --- 従来のメッセージリスナー (併用可能) ---
window.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'UPDATE_MAP') {
        console.log("親画面からデータを受信しました");
        processEarthquakeData(event.data.data);
    }
});

// アイコン描画ロジック
function renderIcons(rawPoints) {
    const svg = d3.select("#map-container");
    svg.selectAll(".intensity-icon").remove();

    rawPoints.forEach(p => {
        const regionName = (AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][p.addr]) ? 
                            AREA_MAPPING[p.pref][p.addr] : null;

        if (regionName && pointsData[regionName]) {
            const coord = pointsData[regionName];
            const [x, y] = projection([coord.lng, coord.lat]);
            const filename = getScaleFileName(p.scale);
            
            if (filename) {
                svg.append("image")
                   .attr("class", "intensity-icon")
                   .attr("href", `https://gensai-lab.github.io/eqst/assets/icons/${filename}.png`)
                   .attr("x", x - 20)
                   .attr("y", y - 20)
                   .attr("width", 40)
                   .attr("height", 40);
            }
        }
    });
}

// 震源地アイコン描画ロジック
function renderHypocenter(hypocenter) {
    const svg = d3.select("#map-container");
    svg.selectAll(".shingen-icon").remove();

    // P2P API v2のレスポンス構造に合わせて latitude/longitude を取得
    const lat = hypocenter.latitude;
    const lon = hypocenter.longitude;

    if (typeof lat === 'undefined' || typeof lon === 'undefined') {
        console.warn("震源地データに緯度経度が含まれていません:", hypocenter);
        return;
    }

    const [x, y] = projection([lon, lat]);

    if (!isNaN(x) && !isNaN(y)) {
        svg.append("image")
           .attr("class", "shingen-icon")
           .attr("href", "https://gensai-lab.github.io/eqst/assets/icons/shingen.png")
           .attr("x", x - 25)
           .attr("y", y - 25)
           .attr("width", 50)
           .attr("height", 50);
        console.log(`震源地を配置: (${lat}, ${lon}) at (${x}, ${y})`);
    } else {
        console.error("震源地の座標変換に失敗しました（範囲外の可能性）:", {x, y});
    }
}
