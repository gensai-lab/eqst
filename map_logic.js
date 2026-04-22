// map_logic.js

let pointsData = {};

// ズーム設定：アニメーションを削除し、即時反映するように変更
const zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on("zoom", (event) => {
        d3.select("#map-content").attr("transform", event.transform);
    });

d3.select("#map-container").call(zoom);

// points.jsonの読み込み
const pointsReady = d3.json("assets/json/points.json").then(data => {
    pointsData = data;
});

// アイコンのファイル名取得
function getScaleFileName(scale) {
    if (!scale) return null;
    let name = String(scale).replace('弱', 'm').replace('強', 'p').replace('-', 'm').replace('+', 'p');
    return name;
}

// データの処理
async function processEarthquakeData(rawData) {
    await Promise.all([mapReady, pointsReady]);

    const points = rawData.points || (rawData.earthquake ? rawData.earthquake.points : null);
    let pointsToFit = [];

    // 震度アイコン描画
    if (points && points.length > 0) {
        renderIcons(points);
        points.forEach(p => {
             const match = p.addr.match(/^.+?[市町村区]/);
             const municipality = match ? match[0] : p.addr;
             const key = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][municipality]) ? AREA_MAPPING[p.pref][municipality] : municipality;
             if (pointsData[key]) pointsToFit.push([pointsData[key].lng, pointsData[key].lat]);
        });
    }
    
    // 震源地描画
    if (rawData.earthquake && rawData.earthquake.hypocenter) {
        renderHypocenter(rawData.earthquake.hypocenter);
        pointsToFit.push([rawData.earthquake.hypocenter.longitude, rawData.earthquake.hypocenter.latitude]);
    }

    // ズーム（アニメーションなし）
    if (pointsToFit.length > 0) {
        applyZoom(pointsToFit);
    }
}

// ズーム処理（アニメーションなし）
function applyZoom(coords) {
    const svg = d3.select("#map-container");
    const width = 800; // SVGの実際の幅
    const height = 600; // SVGの実際の高さ

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
    const scale = Math.min(0.7 / Math.max(dx / width, dy / height), 10);
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    // .transition() を削除し、即時適用
    svg.call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

// アイコン描画
function renderIcons(rawPoints) {
    const mapContent = d3.select("#map-content");
    mapContent.selectAll(".intensity-icon").remove();

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
                console.log(`アイコン描画: ${key} at x:${x} y:${y}`); // ★座標をデバッグ表示
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

// 震源地描画
function renderHypocenter(hypocenter) {
    const mapContent = d3.select("#map-content");
    mapContent.selectAll(".shingen-icon").remove();

    const lat = hypocenter.latitude;
    const lon = hypocenter.longitude;

    if (typeof lat !== 'undefined' && typeof lon !== 'undefined') {
        const [x, y] = projection([lon, lat]);
        console.log(`震源地描画: x:${x} y:${y}`); // ★座標をデバッグ表示
        mapContent.append("image")
           .attr("class", "shingen-icon")
           .attr("href", "https://gensai-lab.github.io/eqst/assets/icons/shingen.png")
           .attr("x", x - 20) 
           .attr("y", y - 20)
           .attr("width", 40)
           .attr("height", 40);
    }
}

// 定期実行
setInterval(fetchLatestEarthquake, 10000);
fetchLatestEarthquake();
