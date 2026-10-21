ARARART 0.16.1 自動テスト修正

前提：0.16.1のプログラムをアップロード済みであること。
1. GitHub correctree/webar-art を開く。
2. ZIP内の tests/action-layer-moves.test.mjs を、リポジトリの同じパスへ上書きする。
   GitHubで tests フォルダーを開き Add file → Upload files からファイルをアップロードする。
3. mainへCommit changes。新しいActionsの完了を待つ。

テストを削除・無効化せず、グループ統合を成功として検証します。
競合、不正な入れ子、自分自身への移動、停止のグループ化、途中のシーン切替は拒否する確認を残しています。
実行プログラム・保存データの変更はありません。
