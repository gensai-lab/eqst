async function fetchEarthquakeData() {
    try {
        const response = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=1');
        const data = await response.json();
        if (data.length > 0) renderUI(data[0]);
    } catch (e) { console.error(e); }
}

// 日付フォーマット変換関数
function formatDate(timeStr) {
    const parts = timeStr.split(' '); 
    const dateParts = parts[0].split('/'); 
    const timeParts = parts[1].split(':'); 
    
    const day = parseInt(dateParts[2]);
    const hour = parseInt(timeParts[0]);
    const min = timeParts[1];
    
    return `${day}<span class="unit">日</span><span class="space"> </span>${hour}<span class="unit">時</span><span class="space"> </span>${min}<span class="unit">分ごろ</span>`;
}

// 震度コードを文字に変換する関数
function getScaleText(s) {
    switch(s) {
        case 10: return '1';
        case 20: return '2';
        case 30: return '3';
        case 40: return '4';
        case 45: return '5<span class="unit">弱</span>';
        case 50: return '5<span class="unit">強</span>';
        case 55: return '6<span class="unit">弱</span>';
        case 60: return '6<span class="unit">強</span>';
        case 70: return '7';
        default: return '-';
    }
}

function renderUI(eq) {
    // データ反映
    document.getElementById('time-val').innerHTML = formatDate(eq.earthquake.time);
    document.getElementById('mag-val').innerText = `M${eq.earthquake.hypocenter.magnitude.toFixed(1)}`;
    document.getElementById('hypo-val').innerText = eq.earthquake.hypocenter.name;
    document.getElementById('depth-val').innerText = `${eq.earthquake.hypocenter.depth}km`;
    
    // 最大震度反映（HTML形式で反映）
    document.getElementById('max-scale-val').innerHTML = getScaleText(eq.earthquake.maxScale);
}

function initMap() {
    const map = L.map('map', { 
        zoomControl: false, 
        attributionControl: false, 
        dragging: false, 
        zoom: false 
    }).setView([36.0, 138.0], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchEarthquakeData();
    setInterval(fetchEarthquakeData, 30000);
});
