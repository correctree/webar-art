# 添付ソースの確認

出典：prototype-0.31.0.12-custom-artwork-marker(1).zip。
完全リポジトリではなく差し替えTS、インストール／ステージスクリプト、マーカーデータ、印刷ページ等。既存のビルド設定や完全な依存セットはない。

確認した主なファイル：
- arMarkerUI.ts：refineMarkerPose／continuousMarkerRefinement、較正・姿勢補正・揺れ補正、HIRO／BLOCKS／KENマーカー選択、HUD。
- state.ts：SharedMediaObjectのtitle、type、assetRef、fallbackRef、visible、x/y/z、rotationX/Y/Z、scale等。
- artworkVisuals.ts：PlayCanvasの境界・選択表示等。PlayCanvasオブジェクトを前提とし、Three.jsへそのまま移植できない。

再利用したのはmk_1008.jpgの原画像と、独立した追跡／描画、認識状態・復帰の可視化という検証方針。旧マーカーデータや黒枠方式の姿勢補正コードはMindARへ移植しない。MindAR自身の姿勢推定とフィルターを利用する。

次段階で必要：実際のShared WorldエクスポートJSON（バージョン付き）、GLB／Sprite／映像／音の実ファイルまたは永続URL、タイムライン形式の代表例。state.tsだけでは全エクスポート形式は確定しない。作品座標を画像幅基準へ変換する原点・軸・縮尺の設計が必要。現版はROOM接続・インポートを実装していない。
