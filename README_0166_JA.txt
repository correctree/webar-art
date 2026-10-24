ARARART 0.16.6 無限繰り返し追加

適用前提：0.16.5適用済みのcorrectree/webar-art。
ZIP内の6ファイルを、同じ階層・同じ名前で上書きしてください。
media.jsは含まれません。

1. ZIPを展開する。
2. GitHubのcorrectree/webar-art、mainへ各ファイルを既存と同じパスでアップロードしてCommit changes。
   studioフォルダーは既存studioへ、testsフォルダーは既存testsへ。ZIP自体をアップロードしないでください。
3. GitHub ActionsのPagesデプロイ成功を確認。
4. RenderのARARART StudioサービスでManual Deploy → Deploy latest commitを実行し、Liveを確認。
5. Studioを再読み込みし、0.16.6を確認。

使い方：
アクションレイヤーの回転・移動・拡大縮小の「繰り返し回数」で「無限」を選択。
保存して公開し、最新のQRからARを開いて確認してください。
既存公開作品に設定を反映するには再公開が必要です。

無限のACTIONは完了せず、次のACTIONへ進みません。
同じACTION内の他のレイヤーは並行して動作します。
往復OFFは従来同様に移動量・回転角度・倍率が累積します（サイズは既存の上限下限あり）。
往復ONは開始状態との往復を繰り返します。
Studioの停止で終了できます。再タップ時の動作は既存の再実行設定に従います。

検証：Node自動テスト199件成功。JSON保存互換、無限継続、往復、同時再生、停止・再開・リセットを確認。
実際のブラウザー、iPhone、GitHub Actions、Renderでの動作確認は未実施。
