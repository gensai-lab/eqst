async function fetchEarthquakeData() {
    try {
        const response = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=1');
        const data = await response.json();
        if (data.length > 0) renderUI(data[0]);
    } catch (e) { console.error(e); }
}

// 日付フォーマット変換関数
function formatDate(timeStr) {
    // "2026/04/20 12:06:00" を想定して分割
    const parts = timeStr.split(' '); 
    const dateParts = parts[0].split('/'); // ['2026', '04', '20']
    const timeParts = parts[1].split(':'); // ['12', '06', '00']
    
    const day = parseInt(dateParts[2]);
    const hour = parseInt(timeParts[0]);
    const min = timeParts[1];
    
    return `${day}日 ${hour}時${min}分ごろ`;
}

function renderUI(eq) {
    // 日付変換を適用
    document.getElementById('time-val').innerText = formatDate(eq.earthquake.time);
    document.getElementById('mag-val').innerText = `M${eq.earthquake.hypocenter.magnitude.toFixed(1)}`;
    document.getElementById('hypo-val').innerText = eq.earthquake.hypocenter.name;
    document.getElementById('depth-val').innerText = `${eq.earthquake.hypocenter.depth}km`;
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
