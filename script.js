// --- グローバル変数 ---
let eewImg, farImg;

// --- APIデータ取得 ---
async function fetchEarthquakeData() {
    try {
        const response = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=1');
        const data = await response.json();
        if (data.length > 0) renderUI(data[0]);
    } catch (e) { console.error(e); }
}

// --- 日付フォーマット ---
function formatDate(timeStr) {
    const parts = timeStr.split(' '); 
    const dateParts = parts[0].split('/'); 
    const timeParts = parts[1].split(':'); 
    
    const day = parseInt(dateParts[2]);
    const hour = parseInt(timeParts[0]);
    const min = timeParts[1];
    
    return `${day}<span class="unit">日</span><span class="space"> </span>${hour}<span class="unit">時</span><span class="space"> </span>${min}<span class="unit">分ごろ</span>`;
}

// --- ヘルパー関数 ---
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

// --- 初期化処理（バナー生成） ---
function initBanners() {
    const infoContainer = document.getElementById('info-banner-container');
    const eewFarContainer = document.createElement('div');
    eewFarContainer.id = 'eew-far-container';
    infoContainer.appendChild(eewFarContainer);
    
    // EEW画像と遠地地震画像を先に生成して追加しておく
    eewImg = createBannerImg('eew');
    eewImg.classList.add('banner-item');
    eewFarContainer.appendChild(eewImg);
    
    farImg = createBannerImg('enchi');
    farImg.classList.add('banner-item');
    eewFarContainer.appendChild(farImg);
}

// --- UI更新処理 ---
function renderUI(eq) {
    // 1. テキスト反映
    document.getElementById('time-val').innerHTML = formatDate(eq.earthquake.time);
    document.getElementById('mag-val').innerText = `M${eq.earthquake.hypocenter.magnitude.toFixed(1)}`;
    document.getElementById('hypo-val').innerText = eq.earthquake.hypocenter.name;
    document.getElementById('depth-val').innerText = `${eq.earthquake.hypocenter.depth}km`;

    // 2. 最大震度・長周期画像
    const scaleContainer = document.getElementById('max-scale-container');
    scaleContainer.innerHTML = '';
    const scaleMap = { 
        10: '1', 20: '2', 30: '3', 40: '4', 
        45: '5m', 50: '5p', 55: '6m', 60: '6p', 70: '7' 
    };
    
    const maxScale = eq.earthquake.maxScale;
    const lpIntensity = eq.earthquake.longPeriodIntensity;

    if (lpIntensity && lpIntensity > 0) {
        const sName = (maxScale && scaleMap[maxScale]) ? `cj_s${scaleMap[maxScale]}` : 'cj_s0';
        scaleContainer.appendChild(createBannerImg(sName));
        scaleContainer.appendChild(createBannerImg(`cj_c${lpIntensity}`));
    } else {
        const sName = (maxScale && scaleMap[maxScale]) ? scaleMap[maxScale] : '0';
        scaleContainer.appendChild(createBannerImg(sName));
    }

    // 3. 津波情報（バナー更新）
    const infoContainer = document.getElementById('info-banner-container');
    // 津波バナーを一旦探して削除
    const existingTsunami = document.getElementById('tsunami-banner');
    if (existingTsunami) existingTsunami.remove();
    
    const tsunamiMap = { 'None': 'tm_n', 'Warning': 'tm_k', 'Alarm': 'tm_o', 'Advisory': 'tm_c', 'Watch': 'tm_j' };
    const tFileName = tsunamiMap[eq.earthquake.domesticTsunami] || 'tm_n';
    
    // コンテナの先頭に津波画像を挿入
    const tsunamiBanner = createTsunamiImg(tFileName);
    infoContainer.prepend(tsunamiBanner);

    // 4. EEW/遠地地震 opacity 制御
    eewImg.classList.toggle('active', eq.earthquake.eew);
    farImg.classList.toggle('active', eq.earthquake.hypocenter.name.includes('海外'));
}

// --- 地図初期化 ---
function initMap() {
    const map = L.map('map', { 
        zoomControl: false, attributionControl: false, dragging: false, zoom: false 
    }).setView([36.0, 138.0], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

// --- ページ読み込み時 ---
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initBanners();
    fetchEarthquakeData();
    setInterval(fetchEarthquakeData, 30000);
});

// --- テスト用関数 ---
window.testDisplay = (scenario) => {
    let testData = {
        earthquake: {
            time: "2026/04/20 12:00:00",
            hypocenter: { name: "テスト震源", magnitude: 7.0, depth: 10 },
            maxScale: 30,
            longPeriodIntensity: 0,
            domesticTsunami: 'None',
            eew: false,
        }
    };

    if (scenario === 'full') {
        testData.earthquake.domesticTsunami = 'Warning';
        testData.earthquake.eew = true;
        testData.earthquake.hypocenter.name = '海外（テスト震源）';
    } else if (scenario === 'tsunami') {
        testData.earthquake.domesticTsunami = 'Warning';
    } else if (scenario === 'eew') {
        testData.earthquake.eew = true;
    } else if (scenario === 'far') {
        testData.earthquake.hypocenter.name = '海外（テスト震源）';
    }

    renderUI(testData);
};
