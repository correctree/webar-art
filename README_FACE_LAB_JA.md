# ARARART FACE LAB 0.1 — 第1段階

基準: ユーザー提供 webar-art-main(3).zip / Studio 0.16.6。
既存Studioのバージョン、保存形式、マーカーAR、空間配置は変更していません。
このZIPは差し替え・追加分だけです。既存リポジトリを削除せず適用してください。

## 適用
1. public/face-lab フォルダーをそのまま追加（index.html / main.js / geometry.js）。
2. scripts/build-studio-assets.mjs を同じ場所へ上書き。
3. tests/face-lab.test.mjs を追加。
4. GitHubへコミットしActionsの成功を確認。
5. Renderで Manual Deploy → Deploy latest commit。
6. iPhone Safariから https://ararart-studio.onrender.com/face-lab/ を開く。
   このサーバーがディレクトリURLを処理しない場合、必ず
   https://ararart-studio.onrender.com/face-lab/index.html を開いてください。
7. カメラ開始 → 許可。初回モデル取得には通信が必要です。

制作画面にモード選択はまだ追加していません。作品の再公開は不要。
切り戻しは scripts/build-studio-assets.mjs の最終行の face-lab コピーを削除し、追加ファイルを削除して再デプロイ。

## iPhone実機確認（結果とiOSバージョンをお知らせください）
- 鼻: 正面で目印が鼻先付近に重なる。
- 左右・上下移動: 映像と目印が同じ方向へ動く。
- 顔の傾き・左右向き: 作品の向きが追従する。
- 距離: 顔に近づくと作品が大きくなる。
- 頭上: 配置先を切替、額より上へ移る。
- 画面外: 作品が消え、戻ると再検出する。
- 縦横: 映像と作品の位置がずれない。
- 停止: カメラインジケーター消灯。再開を3回確認。
- 別タブ・画面ロック: 停止。戻ったら開始ボタンで再開。
- 3分動作: 推論回数/秒、推論ms、発熱やフリーズを記録。
- 任意の10MB以下の埋込GLBを読み込んで確認。GLBは送信されません。
- 既存Studioでマーカー切替・保存・プレビューを確認。

## 実装と限界
MediaPipe tasks-vision 0.10.22、Three.js 0.160.1を固定URLで読込。
顔モデルは float16/1 を使用。GPU初期化失敗時はCPUで再試行。
推論はメインスレッド上で10/15/20回/秒に制限。Worker分離は未実装。
顔特徴点を映像ピクセル座標へ変換し、姿勢行列で回転、顔幅でサイズを調整。
これは簡易投影であり、カメラ校正した物理的に正確な3D貼付けではありません。
鼻は特徴点1、頭上は額・顎方向からのオフセットです。深い横向きや遮蔽は実測が必要。
標準目印は軽量な手続き生成3D形状。GLB読込は静止形状のみで、アニメーションは未対応。
映像・顔特徴点を保存・送信するコードはありません。CDNへライブラリ等の取得リクエストは発生します。
カメラ許可待ち自体はブラウザーの制御下です。停止後に許可が完了した場合も取得したトラックを解除します。

## 検証記録
node --check: main.js成功。
npm test: 203件成功（既存199 + 追加4）。追加分は座標変換・不正入力を確認。
全体ビルド: 依存ファイル node_modules/three/build/three.module.js 不在で未完了。
実ブラウザー、外部CDN/モデル到達、iPhoneカメラ・GPU・負荷: 未検証。
自動テストの成功は実機での追従成功を意味しません。

## 次の段階
本版でiPhone検証 → 結果を反映 → Studioのfaceモード・鼻/頭アンカー・保存検証・公開ルーティングを統合。
この順序のため、本版にはStudio保存/公開統合と表情トリガーは含めません。

## 出典
Google公式 Web Face Landmarker:
https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js
ソース根拠: 同梱 public/face-lab/main.js / geometry.js、元リポジトリ publisher/server.mjs / scripts/build-studio-assets.mjs。
