// map_logic.js

let pointsData = {}; // 座標データ格納用

// points.jsonの読み込み（これもPromiseとして扱う）
const pointsReady = d3.json("assets/json/points.json").then(data => {
    pointsData = data;
    console.log("座標データの読み込みが完了しました。");
});

// 震度アイコンのファイル名マッピング
function getScaleFileName(scale) {
    const map = { 10: '1', 20: '2', 30: '3', 40: '4', 45: '5m', 50: '5p', 55: '6m', 60: '6p', 70: '7' };
    return map[scale] || null;
}

// 親画面(index.html)からのデータ受信リスナー
window.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'UPDATE_MAP') {
        const rawData = event.data.data;
        console.log("地震データを受信:", rawData);

        // --- 重要：地図と座標データ両方の準備が整うのを待つ ---
        try {
            await Promise.all([mapReady, pointsReady]);
        } catch (err) {
            console.error("準備中にエラーが発生しました:", err);
            return;
        }

        // 震度アイコンの描画
        if (rawData.earthquake && rawData.earthquake.points) {
            renderIcons(rawData.earthquake.points);
        }
        
        // 震源地の描画
        if (rawData.earthquake && rawData.earthquake.hypocenter) {
            renderHypocenter(rawData.earthquake.hypocenter);
        }
    }
});

// アイコン描画ロジック
function renderIcons(rawPoints) {
    const svg = d3.select("#map-container");
    svg.selectAll(".intensity-icon").remove();

    console.log("--- アイコン描画開始。受信したデータ数:", rawPoints.length, "---");

    rawPoints.forEach(p => {
        // 1. マッピングの確認
        const regionName = (AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][p.addr]) ? 
                            AREA_MAPPING[p.pref][p.addr] : null;

        if (!regionName) {
            console.warn(`[NG] マッピングが見つかりません: ${p.pref} ${p.addr}`);
            return; 
        }

        // 2. 座標データの確認
        const coord = pointsData[regionName];
        
        if (coord) {
            const [x, y] = projection([coord.lng, coord.lat]);
            const filename = getScaleFileName(p.scale);
            
            if (filename) {
                svg.append("image")
                   .attr("class", "intensity-icon")
                   .attr("href", `https://gensai-lab.github.io/eqst/assets/icons/${filename}.png`)
                   .attr("x", x - 20)
                   .attr("y", y - 20)
                   .attr("width", 40)
                   .attr("height", 40);
            }
        } else {
            console.warn(`[NG] 座標データが存在しません: ${regionName}`);
        }
    });
}

// 震源地アイコン描画ロジック
function renderHypocenter(hypocenter) {
    const svg = d3.select("#map-container");
    
    // 古い震源地アイコンを削除
    svg.selectAll(".shingen-icon").remove();

    console.log("--- 震源地描画 ---", hypocenter);

    // P2P API仕様に基づき latitude / longitude を使用
    const lat = hypocenter.latitude;
    const lon = hypocenter.longitude;

    if (typeof lat === 'undefined' || typeof lon === 'undefined') {
        console.warn("震源地データに緯度経度が含まれていません:", hypocenter);
        return;
    }

    // D3のprojectionは [経度, 緯度] の順
    const [x, y] = projection([lon, lat]);

    if (!isNaN(x) && !isNaN(y)) {
        svg.append("image")
           .attr("class", "shingen-icon")
           .attr("href", "https://gensai-lab.github.io/eqst/assets/icons/shingen.png")
           .attr("x", x - 25)
           .attr("y", y - 25)
           .attr("width", 50)
           .attr("height", 50);
        console.log(`震源地を表示しました: (${lat}, ${lon}) at (${x}, ${y})`);
    } else {
        console.error("座標変換でNaNが発生しました:", {x, y});
    }
}
