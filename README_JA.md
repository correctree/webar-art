# ARARART Studio 0.17.1.3 統合・安定化版

2026-11-01 / 基準: webar-art-main(5).zip
元の0.17.1.3反射プリセット実装を取り込み、作品保存・公開へ統合しました。

## GitHubでの更新
1. 現在のリポジトリを Code → Download ZIP でバックアップ。
2. このZIPを展開。中の studio、tests、studio.html、dashboard.html、ar.html をアップロード対象にします。
3. GitHubのリポジトリ先頭で Add file → Upload files。上記フォルダとHTMLをまとめてドラッグ。
   ZIPそのものや外側フォルダはアップロードしません。既存の他ファイルは削除しません。
4. Commit changes → Actions でテスト・ビルド・公開がすべて成功するまで待ちます。
5. Renderを利用するStudioも同じコミットへデプロイします。Studioだけ古いと新設定が表示されません。
6. Studioを再読み込みし、画面の版番号が0.17.1.3になったことを確認。

## 反射設定を使う
1. プロジェクトを開き、作品の配置・設定欄の「クローム反射（全シーン共通）」を開きます。
2. Classic / Bright / Studio / Softを選択。プリセット変更時はその既定強度になります。
3. 反射強度を0〜3で調整。最初は1.0〜1.9で比較してください。0は反射を消します。
4. 「従来の反射に戻す」でClassic・1.6へ戻せます。
5. プロジェクト保存または制作ZIP保存を実行し、開き直して設定と見え方を確認。
6. 公開して更新完了を待ち、QRからiPhone Safariで確認。
設定はプロジェクト全体に適用されます。シーンや作品ごとの設定ではありません。
対象は名前にchrome等がある標準/物理材質、または高金属・低粗さ・無彩色の材質です。
通常の画像・Sprite・WebMは反射調整の対象外です。実際の周囲を撮影した映り込みではなく、生成した環境テクスチャです。

## URLでの一時比較
公開ARページのみ chromeProfile=bright&chromeIntensity=1.8 などを指定可能。
既に?scene=...があるURLには &chromeProfile=bright&chromeIntensity=1.8 を追加します。
これは保存設定を一時的に上書きし、作品データは変更しません。
保存した見え方を比較するときはこの2パラメータを外してください。
Studioでは保存設定を優先し、URL指定は使いません（元0.17.1.3からの変更）。

## PC / iPhoneの確認表（実機確認は未完了）
- Classicに戻す: 旧版に近い鏡面クローム、変形アニメーションが継続する。
- 4プリセット切替: 反射が変化し、強度変更が即時反映される。
- 保存→開き直す: プリセット・強度が保持される。
- 公開→QR: iPhoneでも設定が反映される。
- 作品削除→別GLB追加: 残ったクローム作品の反射が消えない。
- 別プロジェクトを開く: 前の作品の設定が混入しない。
- Sprite / WebM / 非金属GLB: 透過・アニメーション・色が従来どおり。
- 顔AR: 鼻・頭上への追従、画面外から戻った際の再検出。
- マーカーAR: 認識、見失った後の再検出。
- 空間AR: 床や机への配置・追跡。
- 各モード: 停止→再開始、別タブから戻って再開始。
問題があれば、端末・ARモード・プリセット/強度・公開URL・表示メッセージを記録してください。

## 検証
Node自動テスト226件成功。UI操作のDOMテスト、GLTF処理の模擬材質テスト、
全公開作品のJSON保存/復元、サーバー保存・複製・公開処理の設定保持を確認。
対象JSの構文検査成功。QR起動対策を保持。
依存パッケージ取得が403で拒否されたため、本環境で本番ビルドは未検証。
テストは実際のPC/iPhoneのWebGL描画、カメラ、GPU負荷を保証しません。
GitHub Actionsの実ビルドと上記実機確認が合格してから安定版と判定してください。

## 内部修正
- 保存設定reflection={profile,intensity}を検証し、Studio/公開プレイヤーで共用。
- 材質dispose時に管理対象から解除。共有環境テクスチャを作品削除で破棄しない。
- 旧プロジェクトはClassic・1.6。バージョン表示を統一。
- カメラ追跡・アニメーションの再生方式は変更しない。

## 戻す場合
バックアップから同名ファイルを復元して再デプロイ。
新規reflection-*.jsとテストは未参照となるため残しても起動に影響しません。
旧版では保存した反射設定は表示に使われません。

## 同梱ファイル
- ar.html
- dashboard.html
- studio.html
- studio/chrome-reflection-fix.js
- studio/editor.js
- studio/media.js
- studio/player.js
- studio/reflection-policy.js
- studio/reflection-ui.js
- studio/schema.js
- studio/startup.js
- studio/version.js
- tests/face-integration.test.mjs
- tests/guided-layout.test.mjs
- tests/reflection.test.mjs