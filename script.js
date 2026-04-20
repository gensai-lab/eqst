// --- グローバル変数 ---
let eewImg, farImg;
let saibunData, prefData;
let map, mapLayer;

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
    } catch (e) { console.error("地図データの読み込みに失敗しました:", e); }
}

// --- 震度色定義 ---
function getShindoColor(scale) {
    const colors = {
        0: '#ffffff', 10: '#b0e0e6', 20: '#87ceeb', 30: '#ffff00', 
        40: '#ffa500', 45: '#ff4500', 50: '#ff0000', 55: '#b22222', 
        60: '#8b0000', 70: '#800080'
    };
    return colors[scale] || '#cccccc';
}

// --- 震度マップ更新（外部mapping.jsを利用） ---
function updateMap(points) {
    if (mapLayer) map.removeLayer(mapLayer);
    const geojson = topojson.feature(saibunData, saibunData.objects.saibun);

    const regionMaxScales = {};

    points.forEach(p => {
        // mapping.jsで定義した AREA_MAPPING を利用
        const prefCities = typeof AREA_MAPPING !== 'undefined' ? AREA_MAPPING[p.pref] : null;
        
        if (prefCities) {
            // その都道府県内の市区町村を走査
            for (const cityName in prefCities) {
                // 部分一致判定
                if (p.addr.startsWith(cityName)) {
                    const regionName = prefCities[cityName];
                    const currentMax = regionMaxScales[regionName] || 0;
                    if (p.scale > currentMax) {
                        regionMaxScales[regionName] = p.scale;
                    }
                    break;
                }
            }
        }
    });

    mapLayer = L.geoJSON(geojson, {
        style: (feature) => {
            const mapName = feature.properties.name;
            const maxScale = regionMaxScales[mapName] || 0;
            return {
                fillColor: maxScale > 0 ? getShindoColor(maxScale) : '#ffffff',
                weight: 0.5,
                opacity: 1,
                color: '#333',
                fillOpacity: maxScale > 0 ? 0.7 : 0.3
            };
        }
    }).addTo(map);
}

// --- 日付フォーマット ---
function formatDate(timeStr) {
    const parts = timeStr.split(' '); 
    const dateParts = parts[0].split('/'); 
    const timeParts = parts[1].split(':'); 
    return `${parseInt(dateParts[2])}<span class="unit">日</span> ${parseInt(timeParts[0])}<span class="unit">時</span> ${timeParts[1]}<span class="unit">分ごろ</span>`;
}

// --- バナー操作系 ---
function createBannerImg(filename) {
    const img = document.createElement('img');
    img.src = `assets/banner/${filename}.png`;
    return img;
}

function createTsunamiImg(filename) {
    const img = document.createElement('img');
    img.src = `assets/banner/${filename}.png`;
    img.id = 'tsunami-banner';
    return img;
}

function initBanners() {
    const infoContainer = document.getElementById('info-banner-container');
    const eewFarContainer = document.createElement('div');
    eewFarContainer.id = 'eew-far-container';
    infoContainer.appendChild(eewFarContainer);
    
    eewImg = createBannerImg('eew');
    eewImg.classList.add('banner-item');
    eewFarContainer.appendChild(eewImg);
    
    farImg = createBannerImg('enchi');
    farImg.classList.add('banner-item');
    eewFarContainer.appendChild(farImg);
}

// --- UI更新処理 ---
function renderUI(eq) {
    document.getElementById('time-val').innerHTML = formatDate(eq.earthquake.time);
    document.getElementById('mag-val').innerText = `M${eq.earthquake.hypocenter.magnitude.toFixed(1)}`;
    document.getElementById('hypo-val').innerText = eq.earthquake.hypocenter.name;
    document.getElementById('depth-val').innerText = `${eq.earthquake.hypocenter.depth}km`;

    const scaleContainer = document.getElementById('max-scale-container');
    scaleContainer.innerHTML = '';
    const scaleMap = { 10: '1', 20: '2', 30: '3', 40: '4', 45: '5m', 50: '5p', 55: '6m', 60: '6p', 70: '7' };
    
    if (eq.earthquake.longPeriodIntensity && eq.earthquake.longPeriodIntensity > 0) {
        scaleContainer.appendChild(createBannerImg((eq.earthquake.maxScale && scaleMap[eq.earthquake.maxScale]) ? `cj_s${scaleMap[eq.earthquake.maxScale]}` : 'cj_s0'));
        scaleContainer.appendChild(createBannerImg(`cj_c${eq.earthquake.longPeriodIntensity}`));
    } else {
        scaleContainer.appendChild(createBannerImg((eq.earthquake.maxScale && scaleMap[eq.earthquake.maxScale]) ? scaleMap[eq.earthquake.maxScale] : '0'));
    }

    const infoContainer = document.getElementById('info-banner-container');
    const existingTsunami = document.getElementById('tsunami-banner');
    if (existingTsunami) existingTsunami.remove();
    
    const tsunamiMap = { 'None': 'tm_n', 'Watch': 'tm_j', 'Advisory': 'tm_i', 'Warning': 'tm_i', 'Alarm': 'tm_i' };
    infoContainer.prepend(createTsunamiImg(tsunamiMap[eq.earthquake.domesticTsunami] || 'tm_n'));

    eewImg.classList.toggle('active', eq.earthquake.eew);
    farImg.classList.toggle('active', eq.earthquake.hypocenter.name.includes('海外'));

    if (eq.points) updateMap(eq.points);
}

function initMap() {
    map = L.map('map', { zoomControl: false, attributionControl: false, dragging: false, zoom: false }).setView([36.0, 138.0], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    await loadMapData();
    initBanners();
    fetchEarthquakeData();
    setInterval(fetchEarthquakeData, 30000);
});
