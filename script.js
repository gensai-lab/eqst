// バナーの画像パス定義
const TSUNAMI_IMAGES = {
    'None': 'assets/banner/tm_n.png',
    'Checking': 'assets/banner/tm_j.png',
    'Warning': 'assets/banner/tm_i.png',
    'Advisory': 'assets/banner/tm_i.png'
};

// 1. 地震データの取得
async function fetchEarthquakeData() {
    try {
        const response = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=1');
        const data = await response.json();
        if (data.length > 0) {
            renderUI(data[0]);
        }
    } catch (e) {
        console.error("データ取得エラー:", e);
    }
}

// 2. UIの描画処理
function renderUI(eq) {
    if (!eq || !eq.earthquake) return;
    const e = eq.earthquake;

    // テキスト要素の更新
    const timeVal = document.getElementById('time-val');
    if (timeVal) timeVal.innerHTML = formatDate(e.time);
    
    const magVal = document.getElementById('mag-val');
    if (magVal) magVal.innerText = `M${e.hypocenter.magnitude.toFixed(1)}`;
    
    const hypoVal = document.getElementById('hypo-val');
    if (hypoVal) hypoVal.innerText = e.hypocenter.name;
    
    const depthVal = document.getElementById('depth-val');
    if (depthVal) depthVal.innerText = `${e.hypocenter.depth}km`;

    // 最大震度の表示
    const scaleContainer = document.getElementById('max-scale-container');
    if (scaleContainer) {
        scaleContainer.innerHTML = ''; // 一度クリア
        const scaleMap = { 10: '1', 20: '2', 30: '3', 40: '4', 45: '5m', 50: '5p', 55: '6m', 60: '6p', 70: '7' };
        
        if (e.maxScale && scaleMap[e.maxScale]) {
            const img = document.createElement('img');
            img.src = `assets/banner/${scaleMap[e.maxScale]}.png`;
            img.style.display = 'block'; // 画像をブロック要素に
            scaleContainer.appendChild(img);
        }
    }

    // 津波画像の切り替え
    const tsunamiImg = document.getElementById('status-tsunami');
    if (tsunamiImg) {
        const status = e.domesticTsunami || 'None';
        tsunamiImg.src = TSUNAMI_IMAGES[status] || TSUNAMI_IMAGES['None'];
        tsunamiImg.classList.add('active');
    }

    // EEWと遠地地震の更新
    const eewImg = document.getElementById('status-eew');
    if (eewImg) eewImg.classList.toggle('active', eq.isEew === true);
    
    const enchiImg = document.getElementById('status-enchi');
    if (enchiImg) enchiImg.classList.toggle('active', e.hypocenter.name.includes('海外'));

    // 地図へデータを送信
    sendToMap(eq);
}

// 3. 日付フォーマット（単位のspan付き）
function formatDate(timeStr) {
    const [datePart, timePart] = timeStr.split(' ');
    const [year, month, day] = datePart.split('/');
    const [hour, min, sec] = timePart.split(':');
    return `${parseInt(day)}<span class="unit">日 </span>${parseInt(hour)}<span class="unit">時 </span>${parseInt(min)}<span class="unit">分ごろ</span>`;
}

// 4. 地図iframeへのデータ送信
function sendToMap(data) {
    const frame = document.getElementById('map-frame');
    if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'UPDATE_MAP', data: data }, '*');
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    fetchEarthquakeData();
    setInterval(fetchEarthquakeData, 30000);
});
