// --- グローバル変数 ---
let saibunData, prefData;
let map, saibunLayer, prefLayer; // レイヤーを細分区域と県境で分けます

// --- 地図データ読み込み ---
async function loadMapData() {
    try {
        const [saibunRes, prefRes] = await Promise.all([
            fetch('assets/json/saibun.json'),
            fetch('assets/json/todoufuken.json')
        ]);
        saibunData = await saibunRes.json();
        prefData = await prefRes.json();
        
        // データの読み込み完了後にマップを描画
        drawMapLayers();
    } catch (e) { console.error("地図データの読み込みに失敗しました:", e); }
}

// --- 地図レイヤーの初期描画 ---
function drawMapLayers() {
    // 1. 県境レイヤー（下に配置）
    prefLayer = L.geoJSON(topojson.feature(prefData, prefData.objects.todoufuken), {
        style: { color: '#7F7F7F', weight: 1.5, fill: false }
    }).addTo(map);

    // 2. 細分区域レイヤー（上に配置、初期は #BFBFBF で塗りつぶし）
    saibunLayer = L.geoJSON(topojson.feature(saibunData, saibunData.objects.saibun), {
        style: { fillColor: '#BFBFBF', color: '#A6A6A6', weight: 0.5, fillOpacity: 1 }
    }).addTo(map);
}

// --- 震度色定義（ご指定の仕様に合わせて更新） ---
function getShindoColor(scale) {
    const colors = {
        0: '#BFBFBF', // 未発生時は塗り色と同じ
        10: '#E0FFFF', 20: '#87CEFA', 30: '#FFFF00', 
        40: '#FFA500', 45: '#FF4500', 50: '#FF0000', 
        55: '#B22222', 60: '#8B0000', 70: '#800080'
    };
    return colors[scale] || '#BFBFBF';
}

// --- 震度マップ更新 ---
function updateMap(points) {
    // レイヤーのスタイルを更新
    saibunLayer.setStyle((feature) => {
        const mapName = feature.properties.name;
        let maxScale = 0;

        // 震度判定ロジック
        points.forEach(p => {
            const prefCities = typeof AREA_MAPPING !== 'undefined' ? AREA_MAPPING[p.pref] : null;
            if (prefCities) {
                for (const cityName in prefCities) {
                    if (p.addr.startsWith(cityName) && prefCities[cityName] === mapName) {
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

// --- 地図の初期化 ---
function initMap() {
    map = L.map('map', { 
        zoomControl: false, 
        attributionControl: false, 
        dragging: false, 
        zoom: false 
    }).setView([37.5, 137.5], 5); // 中心座標を少し調整
    
    // 背景色を指定
    map.getContainer().style.backgroundColor = '#1E346F';
}

// ... (他はそのまま)
