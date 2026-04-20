/* 画面全体を固定 */
body {
    margin: 0; padding: 0;
    width: 1920px; height: 1080px;
    overflow: hidden;
    position: relative;
    background-color: #000;
}

/* 地図を一番下のレイヤーに固定 */
#map {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 1;
}

/* 放送用ヘッダー（絶対配置で画面上部にピン留め） */
#broadcast-header {
    position: absolute;
    top: 20px; left: 20px; right: 20px;
    height: 120px;
    z-index: 1000; /* 地図より手前に出す */
    
    display: flex;
    align-items: center;
    gap: 20px;
}

/* 画像サイズを枠内に収めるための共通設定 */
img {
    height: 100%; /* コンテナの高さに合わせる */
    width: auto;
    object-fit: contain;
}

/* 各エリアの調整 */
#header-left { height: 100%; }
#header-center { height: 60%; display: flex; gap: 10px; }
#header-right { height: 60%; display: flex; flex-direction: column; gap: 5px; }
