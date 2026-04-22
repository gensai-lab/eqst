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

// 3. デバッグ用：震度アイコン描画（画像ではなく赤い丸）
function renderIcons(points) {
    const mapContent = d3.select("#map-content");
    // アイコンや丸をクリア
    mapContent.selectAll(".intensity-icon").remove();

    points.forEach(p => {
        const match = p.addr.match(/^.+?[市町村区]/);
        const municipality = match ? match[0] : p.addr;
        const key = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][municipality]) 
                    ? AREA_MAPPING[p.pref][municipality] 
                    : municipality;

        const coord = pointsData[key];
        
        if (coord) {
            // window.projection を使用
            const [x, y] = window.projection([coord.lng, coord.lat]);
            
            mapContent.append("circle")
               .attr("class", "intensity-icon")
               .attr("cx", x)
               .attr("cy", y)
               .attr("r", 5)
               .attr("fill", "red");
        }
    });
}

// 4. デバッグ用：震源地描画（画像ではなく青い丸）
function renderHypocenter(hypocenter) {
    const mapContent = d3.select("#map-content");
    mapContent.selectAll(".shingen-icon").remove();

    if (hypocenter && hypocenter.latitude && hypocenter.longitude) {
        // window.projection を使用
        const [x, y] = window.projection([hypocenter.longitude, hypocenter.latitude]);

        mapContent.append("circle")
           .attr("class", "shingen-icon")
           .attr("cx", x)
           .attr("cy", y)
           .attr("r", 10)
           .attr("fill", "blue");
    }
}

// 5. ズーム適用
function applyZoom(coords) {
    const svg = d3.select("#map-container");
    const width = 800; 
    const height = 600; 

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

    svg.call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

// 6. データ処理と実行
async function processEarthquakeData(rawData) {
    await pointsReady;

    const points = rawData.points || (rawData.earthquake ? rawData.earthquake.points : []);
    const hypocenter = rawData.hypocenter || (rawData.earthquake ? rawData.earthquake.hypocenter : null);

    let pointsToFit = [];

    if (points.length > 0) {
        renderIcons(points);
        points.forEach(p => {
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
        applyZoom(pointsToFit);
    }
}

// 7. API取得関数
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

// 実行
setInterval(fetchLatestEarthquake, 10000);
fetchLatestEarthquake();
