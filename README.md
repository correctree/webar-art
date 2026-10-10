# WebAR Art 0.4.4 — Interactive Marker Studio
PCブラウザで複数マーカー・シーン・タップと音の反応を制作し、GitHub Pagesへ公開してiPhoneで再生します。

入口:
- studio.html: PC編集、マーカー生成、GLB・動画・Sprite、公開とQR
- ar.html?scene=demo-interactive: タップ・音・2シーンの3形式デモ
- ar.html?scene=demo: 従来0.3のデモ
- space.html: 実機で成功した従来のAR Quick Look空間配置
- index.html: 既存8th Wall 0.2プレイヤー

`npm install --ignore-scripts` → `npm test` → `npm run build` → `npm start`。
Node.js 22以上、動画処理にFFmpegが必要です。
[日本語の設定・運用手順](README_SETUP_JA.md)と[検証範囲](TEST_REPORT.md)を先に確認してください。

## ライセンス
新規実装コード: MIT。
Three.js・MindAR・JSZip: MIT。QRCode: MIT。
既存8th Wall Distributed Engine BinaryはNiantic Spatialの独自ライセンスです。MITではありません。
旧プレイヤーの著作権・免責・ライセンス表示を維持しています。
添付されたマーカーと157 Spriteはユーザー提供素材です。このパッケージは権利を再許諾しません。
新しい動画デモは生成したテスト素材です。

0.3 ZIPは0.4へ自動変換。マーカーは8枚登録、同時追跡2枚。シーン12個、全体48作品。音声入力・顔・手の追跡は今後の版で追加します。

0.4.4: iPhone向けタップcapture、表示範囲の補助判定、受付メッセージ、反応確認ボタン。

0.4.4: ARの音をタップ内のnative audio再生へ変更。PCはAudioContext.resume完了を待機。音声テストとエラー表示を追加。

0.4.4: 2枚目の画像から同時表示シーンを作成、全マーカー印刷、AR認識枚数表示。[制作と公開](docs/DUAL_MARKER_JA.md)。
