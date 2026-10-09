# WebAR Art 0.2.0 検証範囲

生成日：2026-10-09。

## 結果

- `npm test`：10テスト成功（SDKモック・依存ファイルfixtureを含む）。
- src/scripts/tests内のJavaScript・MJS構文チェック：成功。
- 既存リポジトリへの導入：一時リポジトリで旧版バックアップ・src/testsの置換・既存`.mind`の保持・Gitメタデータの保持を確認。
- `npm install`：npmレジストリへのアクセスが403で拒否され、依存を取得できず。
- `npm run build`：実依存がないため停止。依存欠落の案内が表示されることを確認。ビルドのコピー処理自体はfixtureで検証。
- ブラウザーUI検証：Playwrightのブラウザー実行ファイルがなく未実施。ブラウザー描画の確認済みとは扱わない。

## 自動検証の対象

- canvas座標変換、推定／検出面のみを採用する配置判定。
- 画像ターゲット名の照合、GLB・画像形式の制限。
- カメラ開始・終了・再開、SDK設定、画像イベント、例外時の停止（SDKモック）。
- CLI生成JSONの取込とGitHub Pagesサブパスでの画像URL解決。
- SDKの追加ファイル・Three.js addons・デコーダ・ライセンスのビルドコピー（依存ファイルのfixture）。
- 同梱GLBのヘッダー、バッファ範囲、埋込アニメーションの時間。
- 導入スクリプトの旧版バックアップ、既存ターゲット・Gitメタデータの保持。

## 未確認

- 実際のnpm install / 実SDKを使うビルド：実行環境からnpmへのネットワーク接続が制限されているため未確認。
- 公式CLIを実行してMK 1008のターゲットを生成する処理：Macで実行が必要。
- SDK・Three.js統合の実ブラウザー描画、GLTFLoaderによる実ファイル読込、raycaster反応。
- iPhone Safariのカメラ、画像追跡、SLAM、配置、音声、再開。
- GitHub Actions本番デプロイ。

SDKモック／fixtureの成功は、AR動作や追跡精度の成功を意味しません。READMEのiPhone主要確認を公開後に実施してください。
