// map_logic.js
let pointsData = {}; // 座標データ格納用

// 座標データ(points.json)の読み込み
d3.json("assets/json/points.json").then(data => {
    pointsData = data;
});

// 震度アイコンのファイル名解決関数
function getScaleFileName(scale) {
    const map = { 10: '1', 20: '2', 30: '3', 40: '4', 45: '5m', 50: '5p', 55: '6m', 60: '6p', 70: '7' };
    return map[scale] || null;
}

// 描画メイン処理
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_MAP') {
        const rawPoints = event.data.data.earthquake.points;
        const svg = d3.select("#map-container");

        // 前回のアイコンを全削除
        svg.selectAll(".intensity-icon").remove();

        rawPoints.forEach(p => {
            // 1. 市町村名(p.addr)と都道府県名(p.pref)から細分地域名を特定
            // mapping.js の AREA_MAPPING を使用
            const regionName = (AREA_MAPPING[p.pref] && AREA_MAPPING[p.pref][p.addr]) ? 
                                AREA_MAPPING[p.pref][p.addr] : null;

            if (!regionName) return; // マッピングが見つからない場合はスキップ

            // 2. 細分地域名から座標を取得
            const coord = pointsData[regionName];
            
            if (coord) {
                const [x, y] = projection([coord.lng, coord.lat]);
                const filename = getScaleFileName(p.scale);
                
                if (filename) {
                    svg.append("image")
                       .attr("class", "intensity-icon")
                       .attr("href", `assets/icons/${filename}.png`)
                       .attr("x", x - 20)
                       .attr("y", y - 20)
                       .attr("width", 40)
                       .attr("height", 40);
                }
            }
        });
    }
});
