const TSUNAMI_IMAGES = {
    'None': 'assets/banner/tm_n.png',
    'Checking': 'assets/banner/tm_j.png',
    'Warning': 'assets/banner/tm_i.png',
    'Advisory': 'assets/banner/tm_i.png'
};

function renderUI(eq) {
    if (!eq || !eq.earthquake) return;
    const e = eq.earthquake;

    document.getElementById('time-val').innerHTML = formatDate(e.time);
    document.getElementById('mag-val').innerText = `M${e.hypocenter.magnitude.toFixed(1)}`;
    document.getElementById('hypo-val').innerText = e.hypocenter.name;
    document.getElementById('depth-val').innerText = `${e.hypocenter.depth}km`;

    // 震度アイコン描画
    const scaleContainer = document.getElementById('max-scale-container');
    scaleContainer.innerHTML = '';
    const scaleMap = { 10: '1', 20: '2', 30: '3', 40: '4', 45: '5m', 50: '5p', 55: '6m', 60: '6p', 70: '7' };
    
    // 最大震度が定義されている場合のみ画像を作成
    if (e.maxScale && scaleMap[e.maxScale]) {
        const img = document.createElement('img');
        img.src = `assets/banner/${scaleMap[e.maxScale]}.png`;
        scaleContainer.appendChild(img);
    }

    // 津波バナー
    const tsunamiImg = document.getElementById('status-tsunami');
    const status = e.domesticTsunami || 'None';
    tsunamiImg.src = TSUNAMI_IMAGES[status] || TSUNAMI_IMAGES['None'];
    tsunamiImg.classList.add('active');

    // EEWと遠地地震
    document.getElementById('status-eew').classList.toggle('active', eq.isEew === true);
    document.getElementById('status-enchi').classList.toggle('active', e.hypocenter.name.includes('海外'));

    sendToMap(eq);
}

function formatDate(timeStr) {
    const [datePart, timePart] = timeStr.split(' ');
    const [day] = datePart.split('/').slice(-1);
    const [hour, min] = timePart.split(':');
    return `${parseInt(day)}<span class="unit">日 </span>${parseInt(hour)}<span class="unit">時 </span>${parseInt(min)}<span class="unit">分ごろ</span>`;
}

function sendToMap(data) {
    const frame = document.getElementById('map-frame');
    if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'UPDATE_MAP', data: data }, '*');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchEarthquakeData();
    setInterval(fetchEarthquakeData, 30000);
});
