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
            // mapReady は map.html 内で定義されている Promise
            await Promise.all([mapReady, pointsReady]);
        } catch (err) {
            console.error("準備中にエラーが発生しました:", err);
            return;
        }

        // 震度アイコンの描画
        renderIcons(rawData.earthquake.points);
        
        // 震源地の描画
        if (rawData.earthquake.hypocenter) {
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

        console.log(`Checking: ${p.pref} ${p.addr} -> 変換結果: ${regionName}`);

        if (!regionName) {
            console.warn(`[NG] マッピングが見つかりません: ${p.pref} ${p.addr}`);
            return; 
        }

        // 2. 座標データの確認
        const coord = pointsData[regionName];
        
        if (coord) {
            console.log(`[OK] ${regionName} の座標発見:`, coord);
            const [x, y] = projection([coord.lng, coord.lat]);
            const filename = getScaleFileName(p.scale);
            
            if (filename) {
                console.log(`[OK] アイコン描画: assets/icons/${filename}.png at (${x}, ${y})`);
                svg.append("image")
                   .attr("class", "intensity-icon")
                   .attr("href", `assets/icons/${filename}.png`)
                   .attr("x", x - 20)
                   .attr("y", y - 20)
                   .attr("width", 40)
                   .attr("height", 40);
            } else {
                console.warn(`[NG] アイコンファイル名が不明: scale=${p.scale}`);
            }
        } else {
            console.warn(`[NG] 座標データが存在しません (points.jsonにキーがない): ${regionName}`);
        }
    });
    
    console.log("--- アイコン描画処理終了 ---");
}

// 震源地アイコン描画ロジック
function renderHypocenter(hypocenter) {
    const svg = d3.select("#map-container");
    
    // 古い震源地アイコンを削除
    svg.selectAll(".shingen-icon").remove();

    // P2P APIから渡されるのは { lat: 緯度, lon: 経度 }
    // D3のprojectionは [経度, 緯度] の順で渡す必要があるため入れ替える
    const [x, y] = projection([hypocenter.lon, hypocenter.lat]);

    if (!isNaN(x) && !isNaN(y)) {
        console.log(`[OK] 震源地を描画: (${hypocenter.lat}, ${hypocenter.lon}) at (${x}, ${y})`);
        
        svg.append("image")
           .attr("class", "shingen-icon")
           .attr("href", "https://gensai-lab.github.io/eqst/assets/icons/shingen.png")
           .attr("x", x - 25) // アイコンサイズに合わせて調整（例：50pxなら-25）
           .attr("y", y - 25)
           .attr("width", 50)
           .attr("height", 50);
    } else {
        console.warn(`[NG] 震源地の座標変換に失敗しました:`, hypocenter);
    }
}
