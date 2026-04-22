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

// 震源地アイコン描画ロジック（デバッグ用）
function renderHypocenter(hypocenter) {
    const svg = d3.select("#map-container");
    
    // 古いアイコンを削除
    svg.selectAll(".shingen-icon").remove();
    svg.selectAll(".debug-circle").remove(); // デバッグ用の円も削除

    console.log("--- 震源地デバッグ開始 ---");
    console.log("Hypocenterデータ詳細:", JSON.stringify(hypocenter));

    // 緯度経度のキー名を確認（両方のパターンを試す）
    const lat = hypocenter.latitude || hypocenter.lat;
    const lon = hypocenter.longitude || hypocenter.lon;

    if (typeof lat === 'undefined' || typeof lon === 'undefined') {
        console.error("緯度経度が見つかりません。データ構造を確認してください:", hypocenter);
        return;
    }

    console.log(`使用する座標: 緯度=${lat}, 経度=${lon}`);

    // 座標変換
    const [x, y] = projection([lon, lat]);
    console.log(`変換されたSVG座標: x=${x}, y=${y}`);

    if (isNaN(x) || isNaN(y)) {
        console.error("座標変換結果がNaNです。投影範囲外の可能性があります。");
        return;
    }

    // ★重要テスト：画像ではなく「赤い円」を描画する
    // これで表示されれば、画像パス(URL)や読み込みの問題
    // これでも表示されなければ、座標（projection）の問題
    svg.append("circle")
       .attr("class", "debug-circle")
       .attr("cx", x)
       .attr("cy", y)
       .attr("r", 15) // 半径15
       .attr("fill", "red")
       .attr("stroke", "white")
       .attr("stroke-width", 2);

    console.log("デバッグ用の赤い円を描画しました。");
}
