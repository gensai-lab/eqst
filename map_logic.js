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

        renderIcons(rawData.earthquake.points);
    }
});

// アイコン描画ロジック
function renderIcons(rawPoints) {
    const svg = d3.select("#map-container");

    // 古いアイコンを全削除
    svg.selectAll(".intensity-icon").remove();
    console.log("古いアイコンを削除しました。新規アイコンの配置を開始します。");

    rawPoints.forEach(p => {
        // 1. AREA_MAPPINGを使って市町村名(addr)と都道府県名(pref)から細分地域名を特定
        const regionName = (AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][p.addr]) ? 
                            AREA_MAPPING[p.pref][p.addr] : null;

        if (!regionName) {
            console.warn(`マッピングが見つかりません: ${p.pref} ${p.addr}`);
            return; // マッピングが見つからない場合はスキップ
        }

        // 2. pointsDataを使って座標を取得
        const coord = pointsData[regionName];
        
        if (coord) {
            // projection は map.html 内で定義されている関数
            const [x, y] = projection([coord.lng, coord.lat]);
            const filename = getScaleFileName(p.scale);
            
            if (filename) {
                svg.append("image")
                   .attr("class", "intensity-icon")
                   .attr("href", `assets/icons/${filename}.png`)
                   .attr("x", x - 20) // 中央配置用のオフセット
                   .attr("y", y - 20)
                   .attr("width", 40)
                   .attr("height", 40);
            }
        } else {
            console.warn(`座標データが見つかりません: ${regionName}`);
        }
    });

    console.log("アイコンの配置が完了しました。");
}
