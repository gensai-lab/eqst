// map_logic.js

let pointsData = {}; // 座標データ格納用
// 注意: AREA_MAPPING は別ファイル(mapping.js)で読み込まれている前提です

// points.jsonの読み込み
const pointsReady = d3.json("assets/json/points.json").then(data => {
    pointsData = data;
    console.log("座標データの読み込みが完了しました。");
});

// ★震度アイコンのファイル名マッピングを修正
function getScaleFileName(scale) {
    // APIから来る可能性のある文字列（'1', '5-', 等）をそのままファイル名にする
    // ただし、画像ファイル名に使えない文字があればここで変換する
    if (!scale) return null;
    
    // 文字列に変換し、'弱'を'm'、'強'を'p'に置換（もし画像がそういう名前なら）
    // あなたの画像ファイル名が '5-.png' なら、ここは `return String(scale);` で良い。
    let name = String(scale)
        .replace('弱', 'm')
        .replace('強', 'p')
        .replace('-', 'm') // '5-' を '5m' に
        .replace('+', 'p'); // '5+' を '5p' に
        
    return name;
}

// ★ズーム機能の定義を「SVG全体の親グループ」を対象にするように修正
const zoom = d3.zoom()
    .scaleExtent([1, 10]) // 拡大縮小の範囲
    .on("zoom", (event) => {
        // ★SVG内の「すべての地図要素（path, image等）」が入った g タグ全体を動かす
        // そのため、描画関数内でのd3.select先もここ（#map-content）にする。
        d3.select("#map-content").attr("transform", event.transform);
    });

// 地図SVGにズーム動作を付与
d3.select("#map-container").call(zoom);

// --- P2P直接取得機能 ---
async function fetchLatestEarthquake() {
    try {
        // P2P API (v2) から最新の地震（codes=551）を1件取得
        const response = await fetch("https://api.p2pquake.net/v2/history?codes=551&limit=1");
        const data = await response.json();
        
        if (data && data.length > 0) {
            const latestEarthquake = data[0];
            console.log("P2P APIから最新データを受信:", latestEarthquake);
            processEarthquakeData(latestEarthquake);
        }
    } catch (err) {
        console.error("P2P APIの取得に失敗しました:", err);
    }
}

// ★データの処理と描画（最重要修正：pointsの場所を自動判定）
async function processEarthquakeData(rawData) {
    // 地図と座標の準備を待つ
    await Promise.all([mapReady, pointsReady]);

    // 【修正：最重要】pointsがどこにあるか柔軟に探す
    const points = rawData.points || (rawData.earthquake ? rawData.earthquake.points : null);

    // 1. まずアイコンと震源を描画し、ズーム用の座標を収集
    let pointsToFit = [];

    if (points && points.length > 0) {
        console.log(`震度情報を発見 (${points.length}件)。アイコンを描画します。`);
        renderIcons(points);

        // ズーム用に震度観測点の座標を収集
        points.forEach(p => {
             // addr から市町村名を抽出
             const match = p.addr.match(/^.+?[市町村区]/);
             const municipality = match ? match[0] : p.addr;

             // mapping.js を適用
             const key = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][municipality]) 
                         ? AREA_MAPPING[p.pref][municipality] 
                         : municipality;

             // points.json から座標を取得して追加
             if (pointsData[key]) {
                 pointsToFit.push([pointsData[key].lng, pointsData[key].lat]);
             }
        });
    } else {
        // 警告ではなくログにする（正常なケースもあるため）
        console.log("今回のデータには詳細な震度情報(points)が含まれていません。");
    }
    
    // 震源地の描画と座標収集
    if (rawData.earthquake && rawData.earthquake.hypocenter) {
        renderHypocenter(rawData.earthquake.hypocenter);
        // 震源地座標を追加
        pointsToFit.push([rawData.earthquake.hypocenter.longitude, rawData.earthquake.hypocenter.latitude]);
    }

    // 2. 収集したすべての座標に合わせてズーム (アニメーション付き)
    if (pointsToFit.length > 0) {
        zoomToFit(pointsToFit);
    }
}

// --- ズームしてフィットさせる関数 (SVGサイズに合わせて要調整) ---
function zoomToFit(coords) {
    const svg = d3.select("#map-container");
    // ★あなたのSVGの実際の大きさ（viewBox等）に合わせて調整してください
    const width = 800; 
    const height = 600; 

    // 全ての点の minLng, maxLng, minLat, maxLat を計算
    const minLng = d3.min(coords, d => d[0]);
    const maxLng = d3.max(coords, d => d[0]);
    const minLat = d3.min(coords, d => d[1]);
    const maxLat = d3.max(coords, d => d[1]);

    // プロジェクション（経緯度 -> SVG座標）に変換
    const p1 = projection([minLng, maxLat]); // 左上
    const p2 = projection([maxLng, minLat]); // 右下

    // 適切なスケール（拡大率）を計算
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const x = (p1[0] + p2[0]) / 2;
    const y = (p1[1] + p2[1]) / 2;
    // 画面の 70% (0.7) に収まるように、かつ最大10倍まで
    const scale = Math.min(0.7 / Math.max(dx / width, dy / height), 10); 
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    // アニメーションでズーム移動
    svg.transition().duration(1500).ease(d3.easeCubicOut).call(
        zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
}

// 定期実行 (10秒ごと)
setInterval(fetchLatestEarthquake, 10000);
fetchLatestEarthquake(); // 初回実行

// --- アイコン描画ロジック (修正：描画先をズーム用グループに) ---
function renderIcons(rawPoints) {
    // ★描画先を、地図全体が入ったグループ「#map-content」に変更
    const mapContent = d3.select("#map-content"); 
    mapContent.selectAll(".intensity-icon").remove(); // 古いアイコンを削除

    rawPoints.forEach(p => {
        // 市町村名抽出 -> mapping -> points.json照合 のフロー
        const match = p.addr.match(/^.+?[市町村区]/);
        const municipality = match ? match[0] : p.addr;
        const key = (typeof AREA_MAPPING !== 'undefined' && AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][municipality]) 
                    ? AREA_MAPPING[p.pref][municipality] 
                    : municipality;

        const coord = pointsData[key];
        
        if (coord) {
            const [x, y] = projection([coord.lng, coord.lat]);
            const filename = getScaleFileName(p.scale);
            
            if (filename) {
                mapContent.append("image")
                   .attr("class", "intensity-icon")
                   .attr("href", `https://gensai-lab.github.io/eqst/assets/icons/${filename}.png`)
                   // 中心合わせのために、サイズ(30)の半分(15)を引く
                   .attr("x", x - 15) 
                   .attr("y", y - 15)
                   .attr("width", 30) // サイズを少し小さく
                   .attr("height", 30);
            }
        } else {
            // points.json に座標がない場合の警告（開発用）
            // console.warn(`[スキップ] 座標なし: ${key} (${p.pref} ${p.addr})`);
        }
    });
}

// --- 震源地アイコン描画ロジック (修正：描画先をズーム用グループに) ---
function renderHypocenter(hypocenter) {
    // ★描画先を、地図全体が入ったグループ「#map-content」に変更
    const mapContent = d3.select("#map-content"); 
    mapContent.selectAll(".shingen-icon").remove(); // 古い震源を削除

    const lat = hypocenter.latitude;
    const lon = hypocenter.longitude;

    if (typeof lat !== 'undefined' && typeof lon !== 'undefined') {
        const [x, y] = projection([lon, lat]);

        if (!isNaN(x) && !isNaN(y)) {
            mapContent.append("image")
               .attr("class", "shingen-icon")
               .attr("href", "https://gensai-lab.github.io/eqst/assets/icons/shingen.png")
               // 中心合わせのために、サイズ(40)の半分(20)を引く
               .attr("x", x - 20) 
               .attr("y", y - 20)
               .attr("width", 40) // 震度アイコンより少し大きく
               .attr("height", 40);
            console.log(`震源地を表示しました: (${lat}, ${lon})`);
        }
    }
}
