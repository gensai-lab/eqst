// map_logic.js

let pointsData = {};

// 1. ズーム機能の初期化
const zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on("zoom", (event) => {
        d3.select("#map-content").attr("transform", event.transform);
    });

d3.select("#map-container").call(zoom);

// 2. 座標データ(points.json)読み込み
const pointsReady = d3.json("assets/json/points.json").then(data => {
    pointsData = data;
    console.log("座標データ読み込み完了");
});

// 3. アイコンファイル名変換
function getScaleFileName(scale) {
    if (!scale) return null;
    return String(scale).replace('弱', 'm').replace('強', 'p').replace('-', 'm').replace('+', 'p');
}

// 4. アイコン描画ロジック
function renderIcons(points) {
    const mapContent = d3.select("#map-content");
    mapContent.selectAll(".intensity-icon").remove();

    points.forEach(p => {
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
                mapContent.append("image")
                   .attr("class", "intensity-icon")
                   .attr("href", `https://gensai-lab.github.io/eqst/assets/icons/${filename}.png`)
                   .attr("x", x - 15)
                   .attr("y", y - 15)
                   .attr("width", 30)
                   .attr("height", 30);
            }
        }
    });
}

// 5. 震源地描画ロジック
function renderHypocenter(hypocenter) {
    const mapContent = d3.select("#map-content");
    mapContent.selectAll(".shingen-icon").remove();

    if (hypocenter && hypocenter.latitude && hypocenter.longitude) {
        const [x, y] = projection([hypocenter.longitude, hypocenter.latitude]);
        mapContent.append("image")
           .attr("class", "shingen-icon")
           .attr("href", "https://gensai-lab.github.io/eqst/assets/icons/shingen.png")
           .attr("x", x - 20)
           .attr("y", y - 20)
           .attr("width", 40)
           .attr("height", 40);
    }
}

// 6. ズーム適用（アニメーションなし）
function applyZoom(coords) {
    const svg = d3.select("#map-container");
    const width = 800; 
    const height = 600; 

    const minLng = d3.min(coords, d => d[0]);
    const maxLng = d3.max(coords, d => d[0]);
    const minLat = d3.min(coords, d => d[1]);
    const maxLat = d3.max(coords, d => d[1]);

    const p1 = projection([minLng, maxLat]);
    const p2 = projection([maxLng, minLat]);

    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const x = (p1[0] + p2[0]) / 2;
    const y = (p1[1] + p2[1]) / 2;
    
    const scale = Math.min(0.7 / Math.max(dx / width, dy / height), 8);
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    // 即時適用
    svg.call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

// 7. データ処理と実行（重要：構造を自動判定）
async function processEarthquakeData(rawData) {
    await pointsReady; // データ読み込み完了を待つ

    // ★重要：pointsがどこにあるか自動判定
    const points = rawData.points || (rawData.earthquake ? rawData.earthquake.points : []);
    const hypocenter = rawData.hypocenter || (rawData.earthquake ? rawData.earthquake.hypocenter : null);

    console.log("検知したpointsデータ:", points);

    let pointsToFit = [];

    // アイコン描画
    if (points.length > 0) {
        renderIcons(points);
        points.forEach(p => {
             const match = p.addr.match(/^.+?[市町村区]/);
             const municipality = match ? match[0] : p.addr;
             const key = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][municipality]) ? AREA_MAPPING[p.pref][municipality] : municipality;
             if (pointsData[key]) pointsToFit.push([pointsData[key].lng, pointsData[key].lat]);
        });
    }
    
    // 震源地描画
    if (hypocenter) {
        renderHypocenter(hypocenter);
        pointsToFit.push([hypocenter.longitude, hypocenter.latitude]);
    }

    // ズーム
    if (pointsToFit.length > 0) {
        applyZoom(pointsToFit);
    }
}

// 8. API取得関数
async function fetchLatestEarthquake() {
    try {
        const response = await fetch("https://api.p2pquake.net/v2/history?codes=551&limit=1");
        const data = await response.json();
        if (data && data.length > 0) {
            processEarthquakeData(data[0]);
        }
    } catch (err) {
        console.error("APIエラー:", err);
    }
}

// 9. 最後に実行
setInterval(fetchLatestEarthquake, 10000);
fetchLatestEarthquake();
