# WebAR Art 0.1.0 — IMAGE TARGET

Shared Worldから独立した、黒枠なしMK 1008＋キューブの最小プロトタイプです。Shared Worldのリポジトリ・公開環境は変更しません。

## 起動（Mac）
Node.js 20以上、python3が必要です。npm installは不要です。

```bash
unzip "$HOME/Downloads/webar-art-0.1.0-image-target.zip" -d "$HOME/webar-art-0.1"
cd "$HOME/webar-art-0.1"
npm test
npm run build
npm run dev
```
http://localhost:8080/prepare.html をPCのChromeまたはSafariで開き、「認識データを作成」を押してください。初回はCDNからMindARを取得します。処理中は画面を閉じないでください。

完成後「認識データを保存」を押し、Downloadsに保存されたmk_1008.mindを次のコマンドで配置します。認識データはこの配布ZIPには未収録です。

```bash
cp "$HOME/Downloads/mk_1008.mind" public/targets/mk_1008.mind
npm run build
```

データは同じブラウザーのIndexedDBにも保存されるため、そのPCではすぐindex.htmlで開始できます。別端末では.mindを配信するか、その端末でも初回作成が必要です。プライベートブラウズや保存データ削除でIndexedDBは失われることがあります。

もし組み込み作成画面で失敗した場合：公式 https://hiukim.github.io/mind-ar-js-doc/tools/compile/ でpublic/targets/mk_1008.jpgをコンパイルし、ダウンロードしたtargets.mindをmk_1008.mindへ改名して同じ場所に置いてください。公式コンパイラーの版はアプリと異なる場合があるため、その場合の互換性も実機で確認します。

## 新しいGitHubリポジトリへの反映
GitHubで新規の空リポジトリ「webar-art」を作成してください。Shared WorldのリポジトリURLは使いません。README等の自動生成は選択しません。

```bash
cd "$HOME/webar-art-0.1"
git init -b main
git add .
git commit -m "WebAR Art 0.1 image target prototype"
git remote add origin https://github.com/YOUR_ACCOUNT/webar-art.git
git push -u origin main
```
YOUR_ACCOUNTは実際のGitHubアカウント名へ置き換えてください。Settings → Pages → SourceでGitHub Actionsを選び、ActionsのDeploy WebAR Artが完了するとURLが表示されます。必要ならActionsからRun workflowを実行します。料金・非公開リポジトリのPages対応はご利用プラン次第です。公開URLの利用は作品画像が閲覧可能になることを踏まえて選択してください。本作業ではリモート作成・公開は行っていません。

## iPhone確認
PCのlocalhost URLやHTTPのLANアドレスではなく、配信されたHTTPS URLをSafariで開きます。
1. print.htmlから黒枠なしの作品を印刷するか、別の画面へ表示。元画像全体、縦横比を維持します。
2. カメラ開始 → 許可。作品全体を正面付近から映します。
3. 「認識中」→「追跡中」、青いキューブを確認します。
4. 静止10秒、ゆっくり移動、傾ける、隠して戻す。追跡／見失い／再取得を確認します。
5. 大きさ・左右・上下・角度を調整します。キューブは作品面の手前に立ち上がります。単位は画像幅=1の相対値で、実寸mmの測定ではありません。
6. 終了後カメラ表示と利用インジケーターが終了するか、再開できるかを確認します。
7. 許可を拒否し、案内表示と、Safari設定で許可変更後の再開を確認します。
8. ホームへ移動・画面ロック後にセッションが停止し、戻って手動再開できるか確認します。
9. 縦横画面切替も確認。認識精度・遅延・回転時の整合性は未検証です。

## 構成
- src/mindar-adapter.js：追跡エンジン・アンカー・カメラ管理。
- src/artwork-view.js：キューブ描画・位置・角度・大きさ。
- src/app.js：鑑賞画面と開始／終了の制御。
- src/prepare.js、store.js：端末内の画像コンパイルと認識データ保存。
- docs/TECHNOLOGY.md：技術選定・参考モデル・出典。
- docs/SHARED_WORLD_REUSE.md：確認した既存ソースと再利用方針。
- TEST_REPORT.md：実施済み・未検証。

外部依存：MindAR 1.2.5、Three.js 0.160.0をjsDelivrからバージョン固定で取得。CDNアクセスが必要で、完全オフラインではありません。今回のアプリに商用SDK・契約・バックエンド・課金処理は含めていません。依存コードのAPI互換性・CDN配信・実機動作はこの環境で未確認です。
