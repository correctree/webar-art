# FACE LAB 0.1.1 モジュール読込対策

画像で確認したエラー: TypeError: Importing a module script failed.
失敗したモジュールとHTTP状態は画像からは不明です。

変更:
- Three.jsは既存ビルドが作る vendor/three から同一サイトで取得。
- MediaPipe JS/WASMは0.10.18で統一。jsDelivrのモジュール読込・WASM準備失敗時はunpkgへ切替。
- カメラ/Three.js/MediaPipe/モデル/推論の段階を表示。MediaPipe読込失敗時はURLを表示。
- 顔モデル本体のURLは変更なし。GPUとCPUのモデル作成が両方失敗した場合は停止します。

適用:
前版FACE LAB 0.1が導入済みのリポジトリへ、ZIP内のpublicとtestsを最上位からフォルダーごとアップロード。
public/face-lab/index.html と main.js は上書き、loader.js と tests/face-lab-loader.test.mjs は新規。
既存geometry.jsとビルドスクリプトはそのまま必要です。
Actions成功後、Render Manual Deploy → Deploy latest commit。
iPhone Safariで https://ararart-studio.onrender.com/face-lab/index.html?v=011 を開く。
画面上部の FACE LAB 0.1.1 を確認し、カメラ開始。
再び停止した場合、段階とエラー全文のスクリーンショットを送ってください。

検証: 構文チェック成功。自動テスト206件成功（今回の3件は通信を模擬し、切替・エラーURL・キャンセルを確認）。
この作業環境ではCDN取得が403のため、実配信内容とiPhone実動作は未確認。修正により解決したとはまだ断定できません。
全体ビルドは依存ライブラリ未導入につき未確認。

根拠: 添付エラー画像、public/face-lab/main.js、scripts/build.mjs の vendor/three コピー処理。
MediaPipe 0.10.18参照: https://github.com/google-ai-edge/mediapipe/issues/5828
