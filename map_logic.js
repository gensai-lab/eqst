// map_logic.js

let pointsData = {}; // 座標データ格納用
// 注意: AREA_MAPPING は別ファイル(mapping.js)で読み込まれている前提です

// ★ズーム機能の定義を修正
const zoom = d3.zoom()
    .scaleExtent([1, 10]) // 拡大縮小の範囲
    .on("zoom", (event) => {
        // ★SVG内の「すべての要素」が入った g タグ全体をトランスフォーメーションさせる
        d3.select("#map-container > g").attr("transform", event.transform);
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

    // 1. まずアイコンと震源を描画
    let pointsToFit = [];
    if (rawData.earthquake && rawData.earthquake.points && rawData.earthquake.points.length > 0) {
        renderIcons(rawData.earthquake.points);
        // ズーム用に座標を収集
        rawData.earthquake.points.forEach(p => {
             const match = p.addr.match(/^.+?[市町村区]/);
             const municipality = match ? match[0] : p.addr;
             const key = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][municipality]) ? AREA_MAPPING[p.pref][municipality] : municipality;
             if (pointsData[key]) pointsToFit.push([pointsData[key].lng, pointsData[key].lat]);
        });
    } else {
        console.log("震度情報(points)は見つかりませんでした。");
    }
    
    if (rawData.earthquake && rawData.earthquake.hypocenter) {
        renderHypocenter(rawData.earthquake.hypocenter);
        // ズーム用に震源地座標を追加
        pointsToFit.push([rawData.earthquake.hypocenter.longitude, rawData.earthquake.hypocenter.latitude]);
    }

    // 2. 収集した座標に合わせてズーム (アニメーション付き)
    if (pointsToFit.length > 0) {
        zoomToFit(pointsToFit);
    }
}

// --- ズームしてフィットさせる関数 (修正版) ---
function zoomToFit(coords) {
    const svg = d3.select("#map-container");
    // ★SVGの実際のサイズ（viewBoxなど）に合わせて調整が必要です
    // コンソールで svg.node().getBBox() を実行して確認すると確実です
    const width = 800; 
    const height = 600; 

    // 全ての点の min/max を計算
    const minLng = d3.min(coords, d => d[0]);
    const maxLng = d3.max(coords, d => d[0]);
    const minLat = d3.min(coords, d => d[1]);
    const maxLat = d3.max(coords, d => d[1]);

    // プロジェクション座標に変換
    const p1 = projection([minLng, maxLat]); // 左上
    const p2 = projection([maxLng, minLat]); // 右下

    // 適切なスケールを計算 (0.7倍の余裕を持たせる)
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const x = (p1[0] + p2[0]) / 2;
    const y = (p1[1] + p2[1]) / 2;
    const scale = Math.min(0.7 / Math.max(dx / width, dy / height), 10); // 最大10倍まで
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    // アニメーションでズーム
    svg.transition().duration(1500).ease(d3.easeCubicOut).call(
        zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
}

// 定期実行 (10秒ごと)
setInterval(fetchLatestEarthquake, 10000);
fetchLatestEarthquake(); // 初回実行

// --- アイコン描画ロジック (修正版) ---
function renderIcons(rawPoints) {
    // ★描画先を「zoom用のgタグ」の中に変更
    // map.html 側で、都道府県や細分区域の path が入っている g タグをこれにする必要があります
    const svg = d3.select("#map-container > g"); 
    svg.selectAll(".intensity-icon").remove(); // 古い震度アイコンを削除

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
                   .attr("x", x - 15) // ★サイズ縮小に合わせて中心合わせも調整
                   .attr("y", y - 15)
                   .attr("width", 30) // ★サイズを小さく (40 -> 30)
                   .attr("height", 30);
            }
        }
    });
}

// --- 震源地アイコン描画ロジック (修正版) ---
function renderHypocenter(hypocenter) {
    // ★描画先を「zoom用のgタグ」の中に変更
    const svg = d3.select("#map-container > g"); 
    svg.selectAll(".shingen-icon").remove();

    const lat = hypocenter.latitude;
    const lon = hypocenter.longitude;

    if (typeof lat !== 'undefined' && typeof lon !== 'undefined') {
        const [x, y] = projection([lon, lat]);

        if (!isNaN(x) && !isNaN(y)) {
            svg.append("image")
               .attr("class", "shingen-icon")
               .attr("href", "https://gensai-lab.github.io/eqst/assets/icons/shingen.png")
               .attr("x", x - 20) // ★サイズ縮小に合わせて中心合わせも調整
               .attr("y", y - 20)
               .attr("width", 40) // ★サイズを小さく (50 -> 40)
               .attr("height", 40);
        }
    }
}
