# WebAR Art 0.4.4 — 2マーカー同時表示

## 適用
DownloadsへWebAR-Art-0.4.4-dual-marker.zipを保存します。Studioのサーバーを動かしているターミナルでControl+Cを押してから実行します。

```bash
unzip -o "$HOME/Downloads/WebAR-Art-0.4.4-dual-marker.zip" -d "$HOME/Downloads"
bash "$HOME/Downloads/WebAR-Art-0.4.4/APPLY.sh"
```

旧版とpublic全体は自動バックアップし、独自の公開プロジェクトart-001は保持します。Macでテスト・ビルドが成功してからプログラムをGitHubへpushします。

## 2マーカーの制作
1. http://localhost:8080/studio.html をPCで開き、STUDIO 0.4.4を確認します。
2. 「制作データを開く」で成功したart-001-project.zipを読み込みます。音の設定も引き継ぐので、宝石だけに音を付けたZIPを使ってください。
3. 複製元のシーン1と、作品が配置されている1枚目のマーカーを選択します。この専用操作は登録マーカー1枚のプロジェクトで使います。
4. 左上の「2マーカー同時表示を作る」内の「2枚目の画像を選択」で、1枚目とは異なるPNG/JPEGを選びます。明暗差と細部のある画像で、両辺200px以上を使用してください。既存のマーカーを色だけ変えた画像や、よく似た模様は避けてください。
5. 全画像をまとめて認識データを生成します。完了まで操作を待ちます。生成にはPCのWebGLが必要です。このZIPにはユーザーの2枚目の認識データは含まれていません。
6. 新しい「2マーカー同時表示」シーンが開始シーンになり、体験IDはart-002になります。元のシーンは残り、各マーカーに複製元と同じ作品セットが配置されます。複製元が3作品なら、計6作品です。
7. 「編集中のマーカー」で切り替え、AとBの作品をそれぞれ編集できます。PC編集画面は1枚ずつ表示します。ARでは両方を同時に追跡します。
8. 作品の音・動き・自動再生・位置は引き継ぎます。確認用シーンではタップ後のシーン移動とシーン自動切替はOFFになります。必要なら確認後に編集してください。
9. 「全マーカーを表示・印刷」で画像を表示します。2枚を別々の紙へ印刷して横に並べるか、PC画面内で両画像を表示してください。マーカー全体が隠れないようにします。
10. 「制作データ保存」でart-002-project.zipをDownloadsへ保存します。

## 公開
新しいターミナルで以下を実行します。Studioサーバーは動かしたままで構いません。

```bash
(
set -e
cd "$HOME/webar-art-0.1"
mkdir -p public/scenes/art-002
unzip -o "$HOME/Downloads/art-002-project.zip" -d public/scenes/art-002
npm run build
node scripts/check-studio-dist.mjs
git add -- public/scenes/art-002
if ! git diff --cached --quiet -- public/scenes/art-002; then
  git commit --only -m "Publish dual-marker art-002" -- public/scenes/art-002
fi
git push
)
```

GitHub ActionsのDeploy WebAR Artが成功後、iPhone Safariで開きます。
https://correctree.github.io/webar-art/ar.html?scene=art-002&v=044

## 合格確認
- PLAYER 0.4.4を確認し、ARを開始します。
- 最初の場面は「2マーカー同時表示」です。
- 2枚を同時に映すと「認識 2 / 2 枚」が表示され、それぞれの画像上に作品が現れます。
- Aを移動するとAの作品だけが追従し、BはBの位置に残ります。
- Aを隠すと「認識 1 / 2 枚」になり、Bの作品は表示・再生を続けます。
- Aを再び映すと作品が戻り、「認識 2 / 2 枚」になります。
- 両方の宝石でタップの動きと音が反応します。複製元で音を外した動画・Spriteは無音のままです。
- この確認用シーンではタップしても別のシーンへ移動しません。
- 終了と再開も確認します。

## 検証範囲
自動テストで同時配置用データ、複製の独立性、認識データ生成の順序、片方を見失った時の状態、同じシーンのタップ処理を検証しています。Compilerはfixtureでの検証です。この環境では実MindARの2枚生成、iPhoneの同時追跡は未確認です。画像の特徴と端末負荷により追跡結果は変わります。
