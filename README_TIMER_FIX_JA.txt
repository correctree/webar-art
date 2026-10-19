ARARART 0.12.2 — iPhone録画タイマーの呼び出し修正

■ 診断で判明した原因
添付の ararart-recording-diagnostic.json に started の直後、
Can only call Window.setTimeout on instances of Window
というstart-errorが記録されていました。録画状態stoppingに対してネイティブ録画状態recording、受信bytes=0でした。
実装ではsetTimeout/clearTimeoutを録画オブジェクトのプロパティへ保存し、this.setTimer()/this.clearTimer()として呼び出していたため、Windowを必要とする環境では呼び出し元のthisが録画オブジェクトとなり例外が発生します。
開始後の最大時間タイマーの設定と、停止時のタイマー解除が失敗し、MediaRecorder.stop()まで進めない構造でした。
0.12.2ではglobalThis.setTimeout()/globalThis.clearTimeout()を明示的に呼ぶラッパーへ修正しました。

■ 適用
1 ZIPを展開します。
2 GitHub correctree/webar-art の main のトップで Add file → Upload files。
3 中の ar.html、src、studio、tests をまとめてアップロードします。外側のフォルダー自体は入れません。
4 mainへコミットしGitHub Actionsの成功を確認。
5 iPhoneで以前の体験ページを開いているタブを閉じ、同じ体験URLを新しいタブで開きます。失敗した録画セッションを終わらせるためです。
6 PLAYER 0.12.2 を確認。古い表示なら ? があるURLには &v=0122、ないURLには ?v=0122 を付けます。
作品の再公開・Renderの再デプロイは不要です。

■ 確認
1 ARを開始して作品を表示。
2 「動画を撮影」を押し、5秒ほど待つ。
3 赤い「停止して保存へ」を押す。
4 プレビューが開き、カメラ背景と作品が入っているか確認。
5 「共有・写真へ保存」から、iPhoneの共有メニューで「ビデオを保存」が表示されたら選択。写真アプリで確認。
6 もう一度録画して停止できるか確認。
7 失敗時は「録画診断を保存」で新しいJSONを保存できます。
無音・最長30秒、最大15fps等の設定は0.12.1と同じです。

■ 検証
自動テスト126件成功、JavaScript構文確認成功。
追加した回帰テストでは、Windowと同じ呼び出し元を要求するタイマー関数を使い、デフォルトのタイマー経路で開始→手動停止→データ受信→保存用Blob生成、最大時間での自動停止、終了待ちタイムアウトの全てを確認しています。従来テストの注入タイマーでは検出できなかったthisの条件を検証します。
この診断エラーに対応するコードは修正しましたが、iPhone実機での動画エンコードと写真保存は未確認です。GitHub Actionsと実機で確認してください。
