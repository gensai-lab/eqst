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

// 画像生成ヘルパー
function createImg(filename) {
    const img = document.createElement('img');
    img.src = `assets/banner/${filename}.png`;
    return img;
}

function renderUI(eq) {
    // 既存テキスト反映
    document.getElementById('time-val').innerHTML = formatDate(eq.earthquake.time);
    document.getElementById('mag-val').innerText = `M${eq.earthquake.hypocenter.magnitude.toFixed(1)}`;
    document.getElementById('hypo-val').innerText = eq.earthquake.hypocenter.name;
    document.getElementById('depth-val').innerText = `${eq.earthquake.hypocenter.depth}km`;

    // ▼ 画像表示ロジック
    const container = document.getElementById('max-scale-container');
    container.innerHTML = ''; // 一度クリア

    const scaleMap = { 
        10: '1', 20: '2', 30: '3', 40: '4', 
        45: '5m', 50: '5p', 55: '6m', 60: '6p', 70: '7' 
    };
    
    const maxScale = eq.earthquake.maxScale; // 震度コード
    const lpIntensity = eq.earthquake.longPeriodIntensity; // 長周期コード (1~4)

    // ロジック分岐
    if (lpIntensity && lpIntensity > 0) {
        // --- 長周期が観測されている場合 ---
        const sName = (maxScale && scaleMap[maxScale]) ? `cj_s${scaleMap[maxScale]}` : 'cj_s0';
        const cName = `cj_c${lpIntensity}`;
        
        container.appendChild(createImg(sName)); // 上段
        container.appendChild(createImg(cName)); // 下段
    } else {
        // --- 長周期が観測されていない場合 ---
        const sName = (maxScale && scaleMap[maxScale]) ? scaleMap[maxScale] : '0';
        
        container.appendChild(createImg(sName)); // 震度画像のみ
    }
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

// 【テスト用】コンソールで実行すると強制的に表示をテストできる関数
window.testLPGM = () => {
    const testData = {
        earthquake: {
            time: "2026/04/20 12:00:00",
            hypocenter: { name: "テスト用震源", magnitude: 7.0, depth: 10 },
            maxScale: 55, // 震度6弱（テスト用）
            longPeriodIntensity: 3 // 長周期地震動階級3（テスト用）
        }
    };
    renderUI(testData);
    console.log("テストデータを適用しました。");
};
