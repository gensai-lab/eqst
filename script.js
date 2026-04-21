// 画像の定義
const TSUNAMI_IMAGES = {
    'None': 'assets/banner/tm_n.png',
    'Checking': 'assets/banner/tm_j.png',
    'Warning': 'assets/banner/tm_i.png',
    'Advisory': 'assets/banner/tm_i.png'
};

async function fetchEarthquakeData() {
    try {
        const response = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=1');
        const data = await response.json();
        if (data.length > 0) renderUI(data[0]);
    } catch (e) { console.error("データ取得エラー:", e); }
}

function renderUI(eq) {
    if (!eq || !eq.earthquake) return;
    const e = eq.earthquake;

    // テキスト更新
    document.getElementById('time-val').innerHTML = formatDate(e.time);
    document.getElementById('mag-val').innerText = `M${e.hypocenter.magnitude.toFixed(1)}`;
    document.getElementById('hypo-val').innerText = e.hypocenter.name;
    document.getElementById('depth-val').innerText = `${e.hypocenter.depth}km`;

    // 津波画像の切り替え
    const tsunamiImg = document.getElementById('status-tsunami');
    const status = e.domesticTsunami || 'None';
    tsunamiImg.src = TSUNAMI_IMAGES[status] || TSUNAMI_IMAGES['None'];
    tsunamiImg.classList.add('active'); // 津波情報は常に表示状態にする想定

    // EEWと遠地地震の更新
    document.getElementById('status-eew').classList.toggle('active', eq.isEew === true);
    document.getElementById('status-enchi').classList.toggle('active', e.hypocenter.name.includes('海外'));

    // 地図更新
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
