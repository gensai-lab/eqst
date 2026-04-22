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
    if (rawData.earthquake && rawData.earthquake.points && rawData.earthquake.points.length > 0) {
        renderIcons(rawData.earthquake.points);
    } else {
        console.log("今回は震度情報(points)を含まないデータ、または震度データなしの速報です。");
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
        // 1. 自動抽出: 「市」「町」「村」「区」で文字列をカットする
        const match = p.addr.match(/^.+?[市町村区]/);
        const municipality = match ? match[0] : p.addr;

        // 2. mapping.js による変換 (例外対応)
        // AREA_MAPPINGに登録があればそちらを優先、なければ自動抽出した名前を使う
        const key = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][municipality]) 
                    ? AREA_MAPPING[p.pref][municipality] 
                    : municipality;

        // 3. points.json で座標を照合
        const coord = pointsData[key];
        
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
        } else {
            console.warn(`[スキップ] 座標が見つかりません: ${p.pref} ${p.addr} (抽出: ${municipality} -> キー: ${key})`);
        }
    });
    console.log(`震度アイコンを ${rawPoints.length} 個配置しようと試みました。`);
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
