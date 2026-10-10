# 公開サーバーのGitHub接続（0.5.0）

localhostの直接公開にはこの設定は不要です。Renderで制作する場合の初回設定です。

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

