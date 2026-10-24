# FACE LAB 0.1.2 再開時の縦横比対策
前提: FACE LAB 0.1.1適用済み。

public と tests フォルダーをリポジトリ最上位からアップロード。
index.html/main.jsは上書き、layout.js/tests/face-lab-layout.test.mjsは追加。
Actions成功 → Render Deploy latest commit。
https://ararart-studio.onrender.com/face-lab/index.html?v=012
上部の0.1.2を確認。

変更: 表示枠は縦向き3:4、横向き4:3。カメラ映像と3Dオーバーレイに同一のcontain矩形を適用。
再開/映像サイズ変更/画面回転でサイズを再同期。映像が横長で取得された場合は上下に余白を入れ、変形しない。
縦向きでは480×640、横向きでは640×480を希望値として要求。ただし端末が必ず従う保証はない。
元コードは映像のw/hを表示枠に反映していた。Safariが再開時に異なるサイズを返したかは実機ログ未取得のため未確定。

確認: 縦持ちで開始→停止→再開を3回。顔が横に伸びないこと、鼻への追従、横持ち→縦持ち後の重なりを確認。
検証: node構文チェック成功、npm test 210件成功。追加4件は映像比率変化・回転・未取得寸法の計算確認。
iPhone実機と全体ビルドは未確認。
出典: public/face-lab/main.js / layout.js / index.html。
