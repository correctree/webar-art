# WebAR Art 0.3.0 — 初回設定と利用手順

## 重要な確認範囲
このパッケージは、添付された0.2のソースを基に制作しています。
既存のindex.htmlと成功したspace.htmlは維持し、新しいstudio.htmlとar.htmlを追加しています。
新しい画像ARはMindAR 1.2.5＋Three.jsです。8th Wallの旧ページはそのまま残ります。
実機の追跡、外部GitHub認証、実際の公開はこの環境では未確認です。TEST_REPORT.mdを参照してください。

## 1. Macへ適用
ZIPをDownloadsへ保存し、案内されたコマンドを実行してください。
APPLY.shはNode.js 22以上を確認し、FFmpegがなければ既存Homebrewで導入します。
旧ソースを ~/webar-art-backups/ に保存し、npm install --ignore-scripts・テスト・ビルド・公開ファイル確認・GitHubへのpushを行います。
元のpublic/space.html、生成済みマーカー、独自素材、.git、.envは保持します。
新しいバージョンのデモ public/scenes/demo は更新します。
最初のnpm install --ignore-scriptsで依存バージョンを固定したpackage-lock.jsonを生成します。以後それをgitへ保存します。

完了後は http://localhost:8080/studio.html が開きます。
localhostでPC制作・マーカー生成・動画変換・制作ZIP保存ができます。
サーバーを終了するにはターミナルでControl+C。再開は次のコマンドです。

```bash
cd "$HOME/webar-art-0.1"
npm start
```

## 2. 同梱デモをiPhoneで確認
GitHub ActionsのDeploy WebAR Artが成功した後、次をiPhone Safariで開きます。
https://correctree.github.io/webar-art/ar.html?scene=demo

マーカーは次の画像を紙へ印刷するかPC画面に表示してください。
https://correctree.github.io/webar-art/scenes/demo/marker.jpg

「ARを開始」を一度タップし、カメラを許可してマーカー全体へ向けます。
立体、透過動画、157 Spriteの3作品が同じマーカーに追従します。
動画が止まる場合は表示される「動画を再生」をタップしてください。
カメラからマーカーが外れると作品を非表示にします。背景へ回った場合もカメラを終了します。

## 3. ブラウザからのGitHub直接公開を設定
直接公開はGitHub Appと公開サーバーを一度設定する必要があります。ZIPを適用しただけでは認証は有効になりません。
PATをブラウザやpublicへ入力・保存する必要はありません。トークンはサーバーのメモリ内に保持します。

### A. Renderに公開サーバーを作る
1. Renderで New → Web Service。
2. correctree/webar-art を接続。
3. RuntimeはDocker。Dockerfileはリポジトリ直下のDockerfile。
4. Health Check Pathは /health。
5. 自動デプロイはOFF。作品を公開するたびにサーバーが再起動することを防ぎます。
6. サービスのURLを控えます。例: https://webar-art-studio-xxxx.onrender.com
7. 次の環境変数を設定します。
   APP_ORIGIN: 控えたURL（末尾の / なし）
   GITHUB_OWNER: correctree
   GITHUB_REPO: webar-art
   GITHUB_BRANCH: main
   GITHUB_ALLOWED_LOGINS: correctree

無料サービスを利用する場合、休止からの起動待ちや動画変換のCPU負荷により遅くなることがあります。
Renderのプランや料金は利用時点の画面で確認してください。継続運用時の費用は別途発生する場合があります。

### B. GitHub Appを作る
GitHub → Settings → Developer settings → GitHub Apps → New GitHub App。
次を設定します。
- GitHub App name: 他と重複しない名前。例 correctree-webar-art-studio
- Homepage URL: 控えたRender URL
- Callback URL: 控えたRender URL + /auth/callback
- Webhook Active: OFF（この実装はポーリング方式）
- Repository permissions:
  Contents: Read and write
  Actions: Read-only
  Deployments: Read-only
  Pages: Read-only
  Metadata: Read-only（自動）
- Account permissions / Subscribe to events: 不要
- Install: 自分のアカウントのwebar-artリポジトリだけを選択

AppのClient IDを控え、Client secretを生成します。
Renderの環境変数へ次を追加し、サービスを再デプロイしてください。
GITHUB_CLIENT_ID: Client ID
GITHUB_CLIENT_SECRET: Client secret
秘密情報はチャット、GitHubのファイル、ブラウザの作品データに入れないでください。

### C. 接続と公開
Renderの studio.html をPCで開き、「GitHubに接続」を押します。
correctreeアカウントで認証後、Studioへ戻り「GitHub接続済み」が出れば接続完了です。
マーカーと作品を編集し、体験ID・タイトルを指定して「公開する」を押します。
初回はdemoを別作品へ変更せず、体験IDをart-001に変更して公開してください。

送信 → GitHub Actions → 該当コミットのgithub-pagesデプロイ成功 → 版番号と素材の配信確認 → QR表示、の順に進みます。
QRはar.html?scene=体験IDを指し、同じ体験IDの更新ではURLは変わりません。
QRは保存・URLコピーができます。認証情報はQRへ含めません。
公開処理は最大約10分画面で待ちます。画面を再読込すると同じ確認処理を再開します。
サーバーが再起動すると認証・ジョブ情報は消えます。再接続後「公開版を編集へ読込」で確認してください。

## 4. 制作
- マーカー: PNG/JPEGを選択。ブラウザで特徴点を生成し、.mindを素材に含めます。
- マーカー生成中は編集操作を停止します。WebGLが使えないPCでは生成できません。
- 3D画面: マーカー幅を1、中心を原点とします。X=左右、Y=上下、Z=マーカーから手前。
- GLB: 画像・形状を内包するGLB。Draco対応。KTX2・Meshopt拡張はこの版では未対応。
- WebM/MP4: 60秒以内・24MB以内。Safari向けH.264をサーバーで生成し、実際のARでは変換後を使用します。
- 透過WebM: VP8/VP9のalpha_mode=1に対応。色とアルファを左右に詰めたMP4を生成し、AR側のシェーダーで透過を再現。
- 通常WebM: H.264へ変換。通常動画として再生。
- 動画の音声: この版は常にミュート。複数作品の映像を同時に再生します。
- Sprite: PNGシート＋JSONをまとめたZIP。添付157形式を対応。FPS未指定は12、画面で変更可能。
- .sprite: ZIP形式なら読込可能。JSON単独や別の独自バイナリは対応外。
- Spriteシート: 長辺4096px以内に自動縮小。元のフレーム構造と透過を保持。
- 作品: 最大24個。ただしiPhone 11 Pro Maxではまず3〜6個・軽い素材で試してください。
- 同時再生: GLB・Sprite・動画が同時に動作。フレーム単位の厳密な動画同期を保証する実装ではありません。
- 制作データ: IndexedDBへ自動保存。ZIPで明示保存・復元も可能。
- GitHub PagesのStudio: 編集・マーカー生成・ZIP保存のみ。動画追加・直接公開はRenderかlocalhostのStudio。
- 公開素材: 合計48MB以内、各24MB以内。GitHubへ送る原動画とSafari用動画の両方を含みます。
- 新しい素材は一括コミット。既存シーンや古い素材は自動削除しません。
- マーカーありのみ。マーカーなしのGLB配置は従来space.htmlへ移動します。

## 5. 実機の合格確認
1. デモのGLB・動画・Spriteが同時に動く。
2. 印刷マーカーを動かすと全作品が一緒に追従する。
3. 見失うと非表示、再認識で復帰。
4. 新しいマーカーをPCで生成し、別の体験IDで公開できる。
5. 配置・回転・サイズ・FPSの編集がiPhoneへ反映される。
6. 同じ体験IDを更新して同じQRで新しい版を見られる。
7. カメラ終了後、同じページで再開できる。
8. WebM透過部分に黒背景が出ない。
9. 公開失敗時にQRを「新しい公開完了」として表示しない。

不具合時は処理名とエラーをStudioに表示します。一般的な成功と実機の追跡成功を区別します。

## 参照
MindAR公式: https://hiukim.github.io/mind-ar-js-doc/installation/
Compiler公式例: https://github.com/hiukim/mind-ar-js/blob/master/examples/image-tracking/compile.html
GitHub App認証: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app
GitHub Git trees: https://docs.github.com/en/rest/git/trees
GitHub Pages: https://docs.github.com/en/rest/pages/pages
FFmpeg: https://ffmpeg.org/ffmpeg-filters.html#alphaextract

ブラウザ専用のMindAR処理を使用し、Node用canvasのネイティブビルドは使用しません。依存インストールは --ignore-scripts を指定しています。Viteのプラットフォーム別esbuildパッケージを使用します。旧8th Wall CLIを別途使う場合はその依存のセットアップが必要な場合があります。
