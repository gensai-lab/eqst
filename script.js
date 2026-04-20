async function fetchEarthquakeData() {
    try {
        const response = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=1');
        const data = await response.json();
        if (data.length > 0) renderUI(data[0]);
    } catch (e) { console.error(e); }
}

function formatDate(timeStr) {
    const parts = timeStr.split(' '); 
    const dateParts = parts[0].split('/'); 
    const timeParts = parts[1].split(':'); 
    
    const day = parseInt(dateParts[2]);
    const hour = parseInt(timeParts[0]);
    const min = timeParts[1];
    
    return `${day}<span class="unit">日</span><span class="space"> </span>${hour}<span class="unit">時</span><span class="space"> </span>${min}<span class="unit">分ごろ</span>`;
}

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

function renderUI(eq) {
    document.getElementById('time-val').innerHTML = formatDate(eq.earthquake.time);
    document.getElementById('mag-val').innerText = `M${eq.earthquake.hypocenter.magnitude.toFixed(1)}`;
    document.getElementById('hypo-val').innerText = eq.earthquake.hypocenter.name;
    document.getElementById('depth-val').innerText = `${eq.earthquake.hypocenter.depth}km`;

    // 最大震度・長周期
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
        const cName = `cj_c${lpIntensity}`;
        scaleContainer.appendChild(createBannerImg(sName));
        scaleContainer.appendChild(createBannerImg(cName));
    } else {
        const sName = (maxScale && scaleMap[maxScale]) ? scaleMap[maxScale] : '0';
        scaleContainer.appendChild(createBannerImg(sName));
    }

    // 情報バナー（津波、EEW、遠地）
    const infoContainer = document.getElementById('info-banner-container');
    infoContainer.innerHTML = '';

    // 津波
    const tsunamiMap = { 'None': 'tm_n', 'Warning': 'tm_k', 'Alarm': 'tm_o', 'Advisory': 'tm_c', 'Watch': 'tm_j' };
    const tsunamiFileName = tsunamiMap[eq.earthquake.domesticTsunami] || 'tm_n';
    infoContainer.appendChild(createTsunamiImg(tsunamiFileName));

    // EEWと遠地地震コンテナ
    const eewFarContainer = document.createElement('div');
    eewFarContainer.id = 'eew-far-container';
    infoContainer.appendChild(eewFarContainer);

    // EEW
    if (eq.earthquake.eew) {
        const eewImg = createBannerImg('eew'); // ファイル名を eew.png に修正
        eewImg.classList.add('banner-item');
        eewImg.style.display = 'block';
        eewFarContainer.appendChild(eewImg);
    }

    // 遠地地震
    if (eq.earthquake.hypocenter.name.includes('海外')) {
        const farImg = createBannerImg('enchi'); // ファイル名を enchi.png に修正
        farImg.classList.add('banner-item');
        farImg.style.display = 'block';
        eewFarContainer.appendChild(farImg);
    }
}

function initMap() {
    const map = L.map('map', { 
        zoomControl: false, attributionControl: false, dragging: false, zoom: false 
    }).setView([36.0, 138.0], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchEarthquakeData();
    setInterval(fetchEarthquakeData, 30000);
});

// 【テスト用】様々なパターンを呼び出せる関数
window.testDisplay = (scenario) => {
    let testData = {
        earthquake: {
            time: "2026/04/20 12:00:00",
            hypocenter: { name: "テスト震源", magnitude: 7.0, depth: 10 },
            maxScale: 30,
            longPeriodIntensity: 0,
            domesticTsunami: 'None', // 初期値
            eew: false,             // 初期値
        }
    };

    if (scenario === 'full') {
        // 全てを表示（津波警報 + EEW + 遠地地震）
        testData.earthquake.domesticTsunami = 'Warning';
        testData.earthquake.eew = true;
        testData.earthquake.hypocenter.name = '海外（テスト震源）';
    } else if (scenario === 'tsunami') {
        // 津波警報のみ
        testData.earthquake.domesticTsunami = 'Warning';
    } else if (scenario === 'eew') {
        // EEWのみ
        testData.earthquake.eew = true;
    } else if (scenario === 'far') {
        // 遠地地震のみ
        testData.earthquake.hypocenter.name = '海外（テスト震源）';
    }

    renderUI(testData);
    console.log(`テストシナリオ「${scenario}」を適用しました。`);
};
