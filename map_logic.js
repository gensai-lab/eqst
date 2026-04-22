// map_logic.js

let pointsData = {}; // 座標データ格納用
// ズーム機能の定義 (map-container全体に適用)
const zoom = d3.zoom()
    .scaleExtent([1, 8]) // 拡大縮小の範囲
    .on("zoom", (event) => {
        d3.select("#map-container g").attr("transform", event.transform);
    });

// 地図SVGにズーム動作を付与
d3.select("#map-container").call(zoom);

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
        const response = await fetch("https://api.p2pquake.net/v2/history?codes=551&limit=1");
        const data = await response.json();
        
        if (data && data.length > 0) {
            const latestEarthquake = data[0];
            processEarthquakeData(latestEarthquake);
        }
    } catch (err) {
        console.error("P2P APIの取得に失敗しました:", err);
    }
}

// データの処理と描画
async function processEarthquakeData(rawData) {
    await Promise.all([mapReady, pointsReady]);

    // 1. まずアイコンと震源を描画
    let pointsToFit = [];
    if (rawData.earthquake && rawData.earthquake.points) {
        renderIcons(rawData.earthquake.points);
        // ズーム用に座標を収集
        rawData.earthquake.points.forEach(p => {
             const match = p.addr.match(/^.+?[市町村区]/);
             const municipality = match ? match[0] : p.addr;
             const key = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][municipality]) ? AREA_MAPPING[p.pref][municipality] : municipality;
             if (pointsData[key]) pointsToFit.push([pointsData[key].lng, pointsData[key].lat]);
        });
    }
    
    if (rawData.earthquake && rawData.earthquake.hypocenter) {
        renderHypocenter(rawData.earthquake.hypocenter);
        // ズーム用に震源地座標を追加
        pointsToFit.push([rawData.earthquake.hypocenter.longitude, rawData.earthquake.hypocenter.latitude]);
    }

    // 2. 収集した座標に合わせてズーム
    if (pointsToFit.length > 0) {
        zoomToFit(pointsToFit);
    }
}

// --- ズームしてフィットさせる関数 ---
function zoomToFit(coords) {
    const svg = d3.select("#map-container");
    const width = 800; // SVGの幅に合わせて調整してください
    const height = 600; // SVGの高さに合わせて調整してください

    // 全ての点のmin/maxを計算
    const minLng = d3.min(coords, d => d[0]);
    const maxLng = d3.max(coords, d => d[0]);
    const minLat = d3.min(coords, d => d[1]);
    const maxLat = d3.max(coords, d => d[1]);

    // プロジェクション座標に変換
    const p1 = projection([minLng, maxLat]); // 左上
    const p2 = projection([maxLng, minLat]); // 右下

    // 適切なスケールを計算 (少し余裕を持たせる)
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const x = (p1[0] + p2[0]) / 2;
    const y = (p1[1] + p2[1]) / 2;
    const scale = Math.min(0.8 / Math.max(dx / width, dy / height), 8);
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    // アニメーションでズーム
    svg.transition().duration(1000).call(
        zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
}

// 定期実行 (10秒ごと)
setInterval(fetchLatestEarthquake, 10000);
fetchLatestEarthquake();

// --- アイコン描画ロジック ---
function renderIcons(rawPoints) {
    const svg = d3.select("#map-container g"); // gタグ内に描画するように変更
    svg.selectAll(".intensity-icon").remove();

    rawPoints.forEach(p => {
        const match = p.addr.match(/^.+?[市町村区]/);
        const municipality = match ? match[0] : p.addr;
        const key = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][municipality]) 
                    ? AREA_MAPPING[p.pref][municipality] 
                    : municipality;

        const coord = pointsData[key];
        if (coord) {
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

// --- 震源地アイコン描画ロジック ---
function renderHypocenter(hypocenter) {
    const svg = d3.select("#map-container g"); // gタグ内に描画するように変更
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
        }
    }
}
