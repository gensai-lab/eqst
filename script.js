async function fetchEarthquakeData() {
    try {
        const response = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=1');
        const data = await response.json();
        if (data.length > 0) renderUI(data[0]);
    } catch (e) { console.error("データ取得エラー:", e); }
}

function sendToMap(data) {
    const frame = document.getElementById('map-frame');
    if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'UPDATE_MAP', data: data }, '*');
    }
}

function formatDate(timeStr) {
    const [datePart, timePart] = timeStr.split(' ');
    const [year, month, day] = datePart.split('/');
    const [hour, min, sec] = timePart.split(':');
    return `${parseInt(day)}<span class="unit">日 </span>${parseInt(hour)}<span class="unit">時 </span>${parseInt(min)}<span class="unit">分ごろ</span>`;
}

function renderUI(eq) {
    const e = eq.earthquake;
    
    // UI更新（要素がある場合のみ更新する安全策）
    const timeVal = document.getElementById('time-val');
    if(timeVal) timeVal.innerHTML = formatDate(e.time);
    
    const magVal = document.getElementById('mag-val');
    if(magVal) magVal.innerText = `M${e.hypocenter.magnitude.toFixed(1)}`;
    
    const hypoVal = document.getElementById('hypo-val');
    if(hypoVal) hypoVal.innerText = e.hypocenter.name;
    
    const depthVal = document.getElementById('depth-val');
    if(depthVal) depthVal.innerText = `${e.hypocenter.depth}km`;

    // 震度バナー
    const scaleContainer = document.getElementById('max-scale-container');
    if(scaleContainer) {
        scaleContainer.innerHTML = '';
        const scaleMap = { 10: '1', 20: '2', 30: '3', 40: '4', 45: '5m', 50: '5p', 55: '6m', 60: '6p', 70: '7' };
        if (e.maxScale && scaleMap[e.maxScale]) {
            const img = document.createElement('img');
            img.src = `assets/banner/${scaleMap[e.maxScale]}.png`;
            scaleContainer.appendChild(img);
        }
    }

    // 状況バナーの更新
    const tsunami = document.getElementById('status-tsunami');
    if(tsunami) tsunami.classList.toggle('active', e.domesticTsunami === 'None');
    
    const eew = document.getElementById('status-eew');
    if(eew) eew.classList.toggle('active', eq.isEew === true);
    
    const enchi = document.getElementById('status-enchi');
    if(enchi) enchi.classList.toggle('active', e.hypocenter.name.includes('海外'));

    // 地図へ送信
    sendToMap(eq);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchEarthquakeData();
    setInterval(fetchEarthquakeData, 30000);
});
