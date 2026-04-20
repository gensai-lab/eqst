// 震度文字列変換
function getScaleStr(scale) {
    const map = { 10:"1", 20:"2", 30:"3", 40:"4", 45:"5m", 50:"5p", 55:"6m", 60:"6p", 70:"7" };
    return map[scale] || "1";
}

// ヘッダー描画関数
function updateHeader(data) {
    const leftBox = document.getElementById('header-left');
    leftBox.innerHTML = ''; // クリア

    // 震度画像の追加
    const img = document.createElement('img');
    img.src = `../assets/banner/${getScaleStr(data.maxScale)}.png`;
    leftBox.appendChild(img);
}

// 地図初期化
function initMap() {
    const map = L.map('map', { zoomControl: false, attributionControl: false })
                 .setView([36.0, 138.0], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    return map;
}

// 実行処理
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    // テスト：震度5強(50)
    updateHeader({ maxScale: 50 });
});
