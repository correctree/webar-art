# WebAR Art 0.3.0 — Marker Studio
PCブラウザでマーカーと複合作品を制作し、GitHub Pagesへ公開してiPhoneで再生します。

入口:
- studio.html: PC編集、マーカー生成、GLB・動画・Sprite、公開とQR
- ar.html?scene=demo: 同梱マーカーARの3形式デモ
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
