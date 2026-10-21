# ARARART Studio 0.16.2 — 公開処理の効率化

0.16.1＋自動テスト修正版を適用済みの correctree/webar-art 向け差し替え版です。
既存の制作データは同梱していません。AR Playerのバージョン表示は変更しません。

## 実装内容

1. 対象コミットのActionsが60秒経っても見つからない場合、一度だけ起動を再要求。権限がない場合は手動実行の案内とActionsへのリンクを表示します。公開の経過時間を表示し、確認中もStudioで編集できます。通信エラーは再試行し、20分で確認を一時停止。「公開状況を再確認」で再開できます。
2. 素材のGit blobハッシュとサイズをPCで照合し、変更のない素材はPC→Render・Render→GitHubの両方で再送信を省略します。サーバーは現在のGitツリーで再照合します。mainが途中で更新された場合は409で停止。各24MB・合計48MBの制限は再利用素材を含めて維持します。
3. public/scenes/だけの更新で、同じプログラム版の検証済みランタイムがキャッシュにあれば、依存導入・全プログラムテスト・アプリ再ビルドを省略。作品データは毎回検証・反映します。キャッシュがない場合、プログラムが変わった場合は通常ビルドと全テストへ戻ります。
4. package-lock.jsonとnpm ci、npmダウンロードキャッシュを利用。GitHubへの素材送信は最大3件、公開素材のHEAD確認は最大4件の並列処理です。今回のコミットのデプロイ成功・revision一致・ARページ・必要素材を確認するまでQRは出しません。

## 適用手順

1. ZIPを展開します。
2. https://github.com/correctree/webar-art を開きます。
3. ZIP内の以下のファイルを、GitHubの同じパスへアップロード・上書きし、mainへコミットします。可能なら一つのコミットでまとめてください。
   - studio.html
   - studio/editor.js
   - studio/schema.js
   - studio/publication-client.js
   - publisher/github.mjs
   - publisher/server.mjs
   - publisher/publication-utils.mjs
   - scripts/publication-build.mjs
   - tests/publisher.test.mjs
   - tests/publication-fast.test.mjs
   - tests/server.test.mjs
   - tests/guided-layout.test.mjs
   - .github/workflows/pages.yml
4. .githubがMacで見えない場合はFinderでCommand + Shift + .を押します。GitHubの既存の .github/workflows/pages.yml を開き、鉛筆ボタンでZIP内の同ファイル全文に置き換えても構いません。ファイル名はpages.ymlのままにします。
5. Actions → Deploy WebAR Art の成功を確認。起動しない場合はRun workflow → Branch main → Run workflow。初回は通常ビルドでキャッシュを作ります。
6. RenderのARARART Studioサービスで Manual Deploy → Deploy latest commit を実行し、Liveを待ちます。GitHub Pagesだけの更新ではサーバーの差分送信APIは更新されません。
7. Studioを再読み込みし、STUDIO 0.16.2 を確認。GitHubへログインします。
8. 既存作品の位置などを少し変更して公開。素材再利用の表示→公開確認→QR表示を確認します。作品だけの更新ではActionsのランタイム復元がヒットし、依存導入・全テスト・ビルドがSkippedになります。素材検証・反映とデプロイは毎回実行します。
9. 画像を一つ追加して公開し、変更素材だけ送信されることを確認します。

環境変数・永続ディスクの変更は不要です。
GitHub AppのActionsがRead-onlyの場合、自動の起動再要求は失敗しますが、Studioのリンクから手動実行できます。自動復旧を使う場合だけ、利用中GitHub AppのActionsをRead and writeに変更し、GitHubのインストール側の権限更新承認を完了してStudioで再接続してください。権限はプログラムから自動変更しません。
RenderのAuto-Deployは既存の手動デプロイ運用（テンプレートautoDeploy:false）を維持してください。作品公開のコミットごとにRenderまで再起動すると、メモリー内の公開ジョブ情報が失われる場合があります。

## 検証範囲

- 再生成後にnpm testを実行：186件成功、失敗0。
- 変更JSの構文、workflow YAML、ZIPのCRCと展開、同梱ファイルとの一致を確認。
- GitHub APIはスタブ、UIは最小DOMのテストです。実アカウントのActions、Render、実ブラウザー、iPhoneでの確認は未実施です。
- 前回の依存パッケージ取得がHTTP403となったため、実アプリ全体のViteビルドは確認できていません。初回GitHub Actionsで確認してください。
- 実際の短縮時間は未計測です。初回は通常ビルド、2回目以降の作品だけの更新からキャッシュによる短縮が働きます。GitHubのキュー待ちと配信待ちは残ります。

## 参照

https://docs.github.com/en/rest/git/trees
https://docs.github.com/en/rest/actions/workflows
https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching
https://github.com/actions/setup-node/blob/main/README.md
