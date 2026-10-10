# WebAR Art 0.4.3 検証範囲
生成日：2026-10-10。

## 0.4.3の追加検証
ユーザーのSafari画像に「Can only call Window.fetch on instances of Window」が表示されました。AudioBankがfetchをプロパティに保存してthis.fetcher(url)と呼び、呼び出し元をAudioBankにしていたコードを確認しました。正しいglobalThisを呼び出し元にしていることを実際の既定fetch経路で検証するテストを追加しました。
この修正のiPhone実機結果は未確認です。

## 0.4.2の追加検証
AudioContext.resumeが完了する前に音を開始しないこと、シーン終了で再開待ち音声を取消すこと、ARのHTMLAudioElement.playをPromise待機前に直接呼ぶこと、同じ音を使う別作品の独立した再生、再タップ／終了／ミュートで停止、再生拒否のエラー通知を5件のfixtureテストで確認しました。
ユーザーから0.4.1のタップ・動き・シーン切替成功、tap.wavの直接再生成功、AR内の音の無音が報告されています。0.4.2の実機音声再生は未確認です。音の最終原因を断定するものではありません。
APIの参考：AudioContext.resumeは再開完了時に解決するPromiseを返します。HTMLMediaElement.playも再生開始／拒否をPromiseで通知します。
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume
https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play

## 0.4.1の追加検証
カメラvideoとcanvasを対象にしたcapture入力、UI除外、移動・キャンセル・別pointer・非アクティブ時の無反応、Touch Events代替、実描画領域の座標換算、補助判定の奥行きと範囲外拒否を検証しました。入力テストはEventTargetのfixtureです。iPhoneの実際のDOM重なりやSafariでの成功を証明するものではありません。
画像では0.4デモの表示とマーカー認識を確認しました。原因候補のイベント経路と当たり判定を修正しましたが、最終原因の断定と修正の実機確認はまだできていません。

## 実行結果
- Node自動テスト：35件成功、失敗・スキップなし。
- JavaScriptと設定の構文チェック、APPLY.shのbash構文チェック。
- 0.3データを0.4へ変換。認識データ、全素材、位置、自動再生とループを保持。
- 複数マーカー・複数シーン・共有音を含む公開データの検証。不足素材、参照先の不存在、シーン間の作品ID重複を拒否。
- 空のシーンを含む制作途中データは保存可能、公開前の必須条件は厳格に確認。
- タップによる再開・再生切替、非アクティブ作品への反応拒否、遅延切替、自動切替、シーン変更／終了時の予約取消を検証。
- 公開は単一コミットとnon-force更新。全シーンの素材と音の配信完了前はQR-readyを返さない。
- インストーラーは旧版をバックアップし、独自プロジェクト、既存認識データ、.envと.gitを保持。
- 実FFmpegで透過WebMをH.264 MP4へ変換し、色・アルファマスクを検証。
- 旧SDKモック、fixtureによる旧ビルド、HTTP認証・Origin拒否、Spriteフレームの既存テストも維持。

## 確認できていない範囲
この環境でnpm install --ignore-scriptsを実行しましたが、npmレジストリの8th Wall依存取得が403で拒否されました。実依存による0.4のViteビルド、PCブラウザーでの編集操作、複数画像のMindARコンパイル、iPhoneの同時追跡と音・動画・シーン切替は未確認です。
GitHub App認証、実アカウントへの公開、Render更新も実環境では確認していません。
0.3の導入とAR再生はユーザーから成功報告があります。それは0.4の実機検証とは区別しています。

APPLY.shはMac上で依存取得・全テスト・実ビルド・生成物確認を順番に実行し、どれかが失敗するとgit pushへ進みません。旧コードは自動バックアップします。
実機ARの成功を保証する報告ではありません。README_SETUP_JA.mdのデモと実機確認を実施してください。

## 今回の範囲
0.4はマーカーAR制作と公開の拡張です。音声入力、顔認識、ハンドトラッキングは実装対象に含めていません。既存のspace.htmlを保持していますが、今回は空間配置の追跡エンジンは変更していません。
