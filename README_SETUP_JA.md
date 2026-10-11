# WebAR Art 0.6.1 — Web Studio・プロジェクト管理・追跡安定化

## 1. Macに適用
編集データは制作ZIPへ保存してください。現在のStudioを起動しているターミナルでControl+C。
ZIPをDownloadsへ保存し、次を実行します。

```bash
unzip -o "$HOME/Downloads/WebAR-Art-0.6.1-web-studio.zip" -d "$HOME/Downloads"
bash "$HOME/Downloads/WebAR-Art-0.6.1/APPLY.sh"
```

既存のMacリポジトリ $HOME/webar-art-0.1 へ適用します。旧ソースをバックアップし、依存導入・テスト・本番ビルド・配信ファイル検査を通してからGitHubへpushします。.git・.env・.studio-data・独自の公開素材は保持します。
起動後 http://localhost:8080/dashboard.html を開きます。

## 2. 現在の制作データを一覧へ登録
旧版のブラウザー自動保存は同じブラウザーのStudioに残っています。
「Studioを開く」→必要なら制作ZIPを復元→「保存・公開」→保存フォルダー選択→「プロジェクトを保存」。
「プロジェクト一覧へ」を押すと保存した作品がカードとして表示されます。
既存のサーバー保存は初回一覧表示時に登録されます。ZIPをDownloadsへ保存しただけでは一覧へ追加されません。

## 3. ダッシュボード
新規作成／最近保存したもの／すべて／フォルダー／ゴミ箱、検索、サムネイル一覧を用意。
カードの「開く」で保存版を編集します。名前変更、複製、ZIP保存、保存フォルダー変更、ゴミ箱への移動、復元に対応。
ゴミ箱は制作データを隠す操作です。公開ページの削除や永久削除は行いません。
Webフォルダーはプロジェクトを整理する分類です。PCのFinderのフォルダーとは別です。
一覧のカードは「保存済みプロジェクト」で、公開状態・QRはStudioの「保存・公開」で確認します。

## 4. PCの指定フォルダーへZIPを保存
ChromeまたはEdge等の対応ブラウザーで、Studio「保存・公開」→「PCの保存先フォルダーを選ぶ」→対象フォルダーの書込を許可。
以後「制作ZIPを保存」で選択先へ 体験ID-project.zip を書き込みます。同じ名前は最新版で置き換わります。旧版を残す場合はZIP名を変更するか別のフォルダーを指定してください。
選択先は同じPC・ブラウザーに記憶します。権限を再要求する場合があります。
「ZIPダウンロードに戻す」で通常のダウンロードへ戻ります。
非対応ブラウザーはZIPダウンロードを使用します。保存場所はブラウザーの設定で指定してください。

## 5. 他のPCから使うWeb Studio（初回のみ）
このZIPでサーバー用プログラムを用意しています。公開サーバーの開設・GitHub App設定は別途必要です。
既にRenderでWebAR Artの制作サーバーを使っている場合は、下記設定を確認してManual Deployします。
Shared Worldのサーバーとは別サービスです。

1. GitHub Actionsで今回の更新が成功したことを確認。
2. Render → New → Web Service → correctree/webar-art → Docker。
3. 永続保存のためPersistent Diskに対応するプランを選択。費用はRenderの作成画面で確認。
4. DiskのMount Pathを /var/data に設定。
5. Environmentに以下を設定。

| キー | 値 |
|---|---|
| APP_ORIGIN | https://今回のRenderサービスURL（末尾/なし） |
| DRAFT_DIR | /var/data/webar-drafts |
| GITHUB_OWNER | correctree |
| GITHUB_REPO | webar-art |
| GITHUB_BRANCH | main |
| GITHUB_ALLOWED_LOGINS | correctree |

6. Health Check Pathは /health。Auto DeployはOFF。作品公開のpushごとに制作サーバーが再起動しないようにします。
7. docs/GITHUB_CONNECTION_JA.mdの手順でGitHub Appを作り、Client IDとClient SecretをRenderの環境変数へ設定。Contents Read and write等の権限を設定し、webar-artへインストール。
8. Manual Deploy → Deploy latest commit。
9. https://今回のRenderサービスURL/dashboard.html を開き「GitHubでログイン」。
10. 同じアカウントで別のPCから同じURLへアクセスしてログインすれば、同じプロジェクト一覧を開けます。

render.yamlも同じ構成のBlueprintです。Starterプラン・1GBのDiskを指定しています。適用前にRenderの料金と設定を確認してください。
Diskなしのサーバーでは再デプロイ後の保存維持は保証できません。
トークンとClient Secretはブラウザーの作品データやGitHubへ入れません。

## 6. ローカルの作品をWeb Studioへ移す
MacのStudioで制作ZIPを保存→RenderのStudioでZIPを復元→「プロジェクトを保存」。
localhostの「local」保存とRenderのGitHubユーザー保存は別です。自動転送されません。
Web版は初回「プロジェクトを保存」以後、変更から約3秒で自動保存します。初回保存前はブラウザー自動保存だけです。
保存は公開版を変更しません。iPhoneの体験を更新するには「公開する」が必要です。
サーバー再起動／認証期限切れ時はログインし直してください。画面の保存失敗表示を確認し、必要ならZIPで保管します。
複数PCが同じプロジェクトを更新した場合、古い保存日時からの上書きを拒否します。一覧から開き直すか、制作ZIPとして別に保存してください。共同編集の同期ではありません。

## 7. 追跡の安定化を確認
「マーカー・シーン」の「追跡モード」は「安定重視」が初期値。「追従重視」は動きへの追従を強めます。
位置・角度・サイズを平滑化し、急な変化は約120ms継続するまで保留。一瞬の認識ロストは約120ms保持し、長いロストでは非表示。再認識時は約70msの安定待ちを入れます。単位は描画時刻で、端末性能により実時間の見え方は変わります。
影も同じ安定化済みの座標へ追従します。誤認識を完全に防ぐものではありません。
「公開する」で更新→GitHub Actions完了→iPhoneを再読み込み→PLAYER 0.6.1を確認。
カメラ静止時のぶれ、ゆっくり移動、マーカーを隠して戻す、2枚マーカー、影とタップ反応を確認してください。

## 8. 視点操作
背景を左ドラッグ：マーカーZ軸の周囲を360°回転、見上げ／見下ろし。
右ドラッグ：平行移動。ホイール：拡大縮小。「視点を戻す」は残しています。45°回転ボタンは削除しました。

## 検証範囲
自動テストと構文検査は実行。今回の環境ではnpmの依存取得が403で拒否され、本番ビルド・実ブラウザー・Renderの実デプロイ・iPhone実機は未確認です。
APPLY.shはMacで本番ビルドと配信ファイル検査を行います。TEST_REPORT.mdに検証詳細を記載。
顔・手・マーカーレスの新規体験タイプは今回含めていません。
