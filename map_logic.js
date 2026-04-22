// map_logic.js

let pointsData = {}; // 座標データ格納用
// 注意: AREA_MAPPING は別ファイル(mapping.js)で読み込まれている前提です

// points.jsonの読み込み
const pointsReady = d3.json("assets/json/points.json").then(data => {
    pointsData = data;
    console.log("座標データの読み込みが完了しました。");
});

// 震度アイコンのファイル名マッピング
function getScaleFileName(scale) {
    // 震度: 10=1, 20=2, 30=3, 40=4, 45=5弱, 50=5強, 55=6弱, 60=6強, 70=7
    const map = { 10: '1', 20: '2', 30: '3', 40: '4', 45: '5m', 50: '5p', 55: '6m', 60: '6p', 70: '7' };
    return map[scale] || null;
}

// --- P2P直接取得機能 ---
async function fetchLatestEarthquake() {
    try {
        const response = await fetch("https://api.p2pquake.net/v2/history?codes=551&limit=1");
        const data = await response.json();
        
        if (data && data.length > 0) {
            const latestEarthquake = data[0];
            console.log("P2P APIから最新データを受信:", latestEarthquake);
            processEarthquakeData(latestEarthquake);
        }
    } catch (err) {
        console.error("P2P APIの取得に失敗しました:", err);
    }
}

// データの処理と描画
async function processEarthquakeData(rawData) {
    // 地図と座標の準備を待つ
    await Promise.all([mapReady, pointsReady]);

    // 震度アイコンの描画 (rawData.earthquake.points があるか確認)
    if (rawData.earthquake && rawData.earthquake.points) {
        renderIcons(rawData.earthquake.points);
    } else {
        console.warn("震度情報(points)が見つかりません。");
    }
    
    // 震源地の描画
    if (rawData.earthquake && rawData.earthquake.hypocenter) {
        renderHypocenter(rawData.earthquake.hypocenter);
    }
}

// 定期実行 (10秒ごと)
setInterval(fetchLatestEarthquake, 10000);
fetchLatestEarthquake(); // 初回実行

// --- アイコン描画ロジック ---
function renderIcons(rawPoints) {
    const svg = d3.select("#map-container");
    svg.selectAll(".intensity-icon").remove(); // 古い震度アイコンを削除

    rawPoints.forEach(p => {
        // AREA_MAPPINGを使用して、P2Pの地点名を座標用キーに変換
        const regionName = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][p.addr]) ? 
                            AREA_MAPPING[p.pref][p.addr] : null;

        if (!regionName) return; // マッピングがない地点はスキップ

        const coord = pointsData[regionName];
        
        if (coord) {
            const [x, y] = projection([coord.lng, coord.lat]);
            const filename = getScaleFileName(p.scale);
            
            if (filename) {
                svg.append("image")
                   .attr("class", "intensity-icon")
                   .attr("href", `https://gensai-lab.github.io/eqst/assets/icons/${filename}.png`)
                   .attr("x", x - 20) // サイズに応じて調整
                   .attr("y", y - 20)
                   .attr("width", 40)
                   .attr("height", 40);
            }
        }
    });
    console.log(`震度アイコンを ${rawPoints.length} 個配置しました。`);
}

// --- 震源地アイコン描画ロジック ---
function renderHypocenter(hypocenter) {
    const svg = d3.select("#map-container");
    svg.selectAll(".shingen-icon").remove();

    const lat = hypocenter.latitude;
    const lon = hypocenter.longitude;

    if (typeof lat !== 'undefined' && typeof lon !== 'undefined') {
        const [x, y] = projection([lon, lat]);

        if (!isNaN(x) && !isNaN(y)) {
            svg.append("image")
               .attr("class", "shingen-icon")
               .attr("href", "https://gensai-lab.github.io/eqst/assets/icons/shingen.png")
               .attr("x", x - 25)
               .attr("y", y - 25)
               .attr("width", 50)
               .attr("height", 50);
            console.log(`震源地を表示しました: (${lat}, ${lon})`);
        }
    }
}
