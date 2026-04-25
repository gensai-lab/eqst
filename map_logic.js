// map_logic.js

// --- 【設定】ここでアイコンの大きさを調整できます ---
const ICON_SIZE = 6;      // 震度アイコンのサイズ（px）
const SHINGEN_SIZE = 5;   // 震源アイコンのサイズ（px）
// ------------------------------------------------

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
});

// 3. 震度アイコンのファイル名変換
function getScaleFileName(scale) {
    const map = { 10: '1', 20: '2', 30: '3', 40: '4', 45: '5m', 50: '5p', 55: '6m', 60: '6p', 70: '7' };
    return map[scale] || null;
}

// 4. 深さ表記変換関数
function formatDepth(depth) {
    return depth === 0 ? "ごく浅い" : depth + "km";
}

// 5. アイコン描画
function renderIcons(filteredPoints) {
    // #icon-layer に描画することで常に地図の手前に表示
    const iconLayer = d3.select("#icon-layer");
    iconLayer.selectAll(".intensity-icon").remove();

    filteredPoints.forEach(p => {
        const match = p.addr.match(/^.+?[市町村区]/);
        const municipality = match ? match[0] : p.addr;
        const key = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][municipality]) 
                    ? AREA_MAPPING[p.pref][municipality] 
                    : municipality;

        const coord = pointsData[key];
        if (coord) {
            const [x, y] = window.projection([coord.lng, coord.lat]);
            const filename = getScaleFileName(p.scale);
            if (filename) {
                iconLayer.append("image")
                     .attr("class", "intensity-icon")
                     .attr("href", `https://gensai-lab.github.io/eqst/assets/icons/${filename}.png`)
                     .attr("x", x - (ICON_SIZE / 2))
                     .attr("y", y - (ICON_SIZE / 2))
                     .attr("width", ICON_SIZE)
                     .attr("height", ICON_SIZE);
            }
        }
    });
}

// 6. 震源地描画
function renderHypocenter(hypocenter) {
    // #icon-layer に描画することで常に地図の手前に表示
    const iconLayer = d3.select("#icon-layer");
    iconLayer.selectAll(".shingen-icon").remove();

    if (hypocenter && hypocenter.latitude && hypocenter.longitude) {
        const [x, y] = window.projection([hypocenter.longitude, hypocenter.latitude]);
        iconLayer.append("image")
           .attr("class", "shingen-icon")
           .attr("href", "https://gensai-lab.github.io/eqst/assets/icons/shingen.png")
           .attr("x", x - (SHINGEN_SIZE / 2))
           .attr("y", y - (SHINGEN_SIZE / 2))
           .attr("width", SHINGEN_SIZE)
           .attr("height", SHINGEN_SIZE);
    }
}

// 7. 中央配置ズーム
function zoomToFit(coords) {
    const svg = d3.select("#map-container");
    const width = window.innerWidth;
    const height = window.innerHeight;

    const minLng = d3.min(coords, d => d[0]);
    const maxLng = d3.max(coords, d => d[0]);
    const minLat = d3.min(coords, d => d[1]);
    const maxLat = d3.max(coords, d => d[1]);

    const p1 = window.projection([minLng, maxLat]);
    const p2 = window.projection([maxLng, minLat]);

    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const x = (p1[0] + p2[0]) / 2;
    const y = (p1[1] + p2[1]) / 2;
    
    const scale = Math.min(0.7 / Math.max(dx / width, dy / height), 8);
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    svg.call(
        zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
}

// 8. データ処理
async function processEarthquakeData(rawData) {
    await pointsReady;

    const points = rawData.points || (rawData.earthquake ? rawData.earthquake.points : []);
    const hypocenter = rawData.hypocenter || (rawData.earthquake ? rawData.earthquake.hypocenter : null);
    
    const maxPoints = {};
    points.forEach(p => {
        const match = p.addr.match(/^.+?[市町村区]/);
        const municipality = match ? match[0] : p.addr;
        const key = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][municipality]) ? AREA_MAPPING[p.pref][municipality] : municipality;
        
        if (!maxPoints[key] || p.scale > maxPoints[key].scale) {
            maxPoints[key] = p;
        }
    });

    const filteredPoints = Object.values(maxPoints);
    let pointsToFit = [];

    if (filteredPoints.length > 0) {
        renderIcons(filteredPoints);
        filteredPoints.forEach(p => {
             const match = p.addr.match(/^.+?[市町村区]/);
             const municipality = match ? match[0] : p.addr;
             const key = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][municipality]) ? AREA_MAPPING[p.pref][municipality] : municipality;
             if (pointsData[key]) pointsToFit.push([pointsData[key].lng, pointsData[key].lat]);
        });
    }
    
    if (hypocenter) {
        renderHypocenter(hypocenter);
        pointsToFit.push([hypocenter.longitude, hypocenter.latitude]);
    }

    if (pointsToFit.length > 0) {
        zoomToFit(pointsToFit);
    }
}

// 9. API取得と実行
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

setInterval(fetchLatestEarthquake, 10000);
fetchLatestEarthquake();
