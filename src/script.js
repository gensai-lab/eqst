window.currentEarthquakeData = null;

async function fetchEarthquakeData() {
    try {
        const response = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=1');
        if (!response.ok) throw new Error('API取得失敗');
        const data = await response.json();
        
        if (data.length > 0) {
            window.currentEarthquakeData = data[0];
            renderUI(window.currentEarthquakeData);
        }
    } catch (error) {
        console.error("API Error:", error);
    }
}

function getScaleStr(scale) {
    const map = { 10:"1", 20:"2", 30:"3", 40:"4", 45:"5m", 50:"5p", 55:"6m", 60:"6p", 70:"7" };
    return map[scale] || null;
}

function renderUI(earthquake) {
    // 1. 最大震度画像
    const scale = earthquake.earthquake.maxScale;
    const scaleStr = getScaleStr(scale);
    const img = document.getElementById('scale-img');
    
    if (scaleStr) {
        // ※画像パスは実際の環境に合わせてください
        img.src = `../assets/banner/${scaleStr}.png`;
        img.style.display = 'block';
    }

    // 2. 長周期地震動
    const lpInfo = earthquake.longPeriodEarthquakeInfo;
    const lpDiv = document.getElementById('lp-info');
    if (lpInfo && lpInfo.maxScale >= 1) {
        lpDiv.innerText = `長周期地震動 階級${lpInfo.maxScale}`;
        lpDiv.style.display = 'block';
    } else {
        lpDiv.style.display = 'none';
    }
    
    // 3. テキスト
    const infoText = document.getElementById('info-text');
    infoText.innerText = `${earthquake.earthquake.time} 震源: ${earthquake.earthquake.hypocenter.name}`;
}

function initMap() {
    const map = L.map('map', { 
        zoomControl: false, 
        attributionControl: false,
        dragging: false, // ニュース風なら地図は固定が綺麗です
        zoom: false
    }).setView([36.0, 138.0], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    return map;
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchEarthquakeData();
    setInterval(fetchEarthquakeData, 30000);
});
