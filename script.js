let saibunData, prefData;
let map, saibunLayer, prefLayer;

// --- APIデータ取得 ---
async function fetchEarthquakeData() {
    try {
        const response = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=1');
        const data = await response.json();
        if (data.length > 0) renderUI(data[0]);
    } catch (e) { console.error("データ取得エラー:", e); }
}

// --- 地図データ読み込み ---
async function loadMapData() {
    try {
        const [saibunRes, prefRes] = await Promise.all([
            fetch('assets/json/saibun.json'),
            fetch('assets/json/todoufuken.json')
        ]);
        saibunData = await saibunRes.json();
        prefData = await prefRes.json();
        drawMap();
    } catch (e) { console.error("データ読み込みエラー:", e); }
}

// --- 地図描画 ---
function drawMap() {
    // 県境レイヤー（下に配置）
    prefLayer = L.geoJSON(topojson.feature(prefData, prefData.objects.todoufuken), {
        style: { color: '#7F7F7F', weight: 1.5, fill: false, opacity: 1 }
    }).addTo(map);

    // 細分区域レイヤー（上に配置、塗り色指定）
    saibunLayer = L.geoJSON(topojson.feature(saibunData, saibunData.objects.saibun), {
        style: { fillColor: '#BFBFBF', color: '#A6A6A6', weight: 0.5, fillOpacity: 1 }
    }).addTo(map);
}

// --- 震度色定義 ---
function getShindoColor(scale) {
    const colors = {
        0: '#BFBFBF', 10: '#b0e0e6', 20: '#87ceeb', 30: '#ffff00', 
        40: '#ffa500', 45: '#ff4500', 50: '#ff0000', 55: '#b22222', 
        60: '#8b0000', 70: '#800080'
    };
    return colors[scale] || '#BFBFBF';
}

// --- 震度更新ロジック ---
function updateMap(points) {
    saibunLayer.setStyle((feature) => {
        const regionName = feature.properties.name;
        let maxScale = 0;

        points.forEach(p => {
            const prefCities = typeof AREA_MAPPING !== 'undefined' ? AREA_MAPPING[p.pref] : null;
            if (prefCities) {
                for (const cityName in prefCities) {
                    if (p.addr.startsWith(cityName) && prefCities[cityName] === regionName) {
                        if (p.scale > maxScale) maxScale = p.scale;
                    }
                }
            }
        });

        return {
            fillColor: maxScale > 0 ? getShindoColor(maxScale) : '#BFBFBF',
            color: '#A6A6A6',
            weight: 0.5,
            fillOpacity: 1
        };
    });
}

// --- UI更新 ---
function renderUI(eq) {
    document.getElementById('time-val').innerText = eq.earthquake.time;
    document.getElementById('mag-val').innerText = `M${eq.earthquake.hypocenter.magnitude.toFixed(1)}`;
    document.getElementById('hypo-val').innerText = eq.earthquake.hypocenter.name;
    document.getElementById('depth-val').innerText = `${eq.earthquake.hypocenter.depth}km`;

    const scaleContainer = document.getElementById('max-scale-container');
    scaleContainer.innerHTML = '';
    
    // 震度アイコンの読み込みパス設定
    const scaleMap = { 10: '1', 20: '2', 30: '3', 40: '4', 45: '5m', 50: '5p', 55: '6m', 60: '6p', 70: '7' };
    if (eq.earthquake.maxScale) {
        const img = document.createElement('img');
        img.src = `assets/icons/${scaleMap[eq.earthquake.maxScale] || '0'}.png`;
        scaleContainer.appendChild(img);
    }

    if (eq.points) updateMap(eq.points);
}

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', () => {
    map = L.map('map', { zoomControl: false, attributionControl: false, dragging: false, zoom: false }).setView([36.0, 138.0], 5);
    loadMapData();
    fetchEarthquakeData();
    setInterval(fetchEarthquakeData, 30000);
});
