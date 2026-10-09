# WebAR Art 0.2.0

8th Wall Engine Binary 1.0.0 + Three.js 0.160.1を使用する、画像AR・空間配置・作品読込・タップ反応の実装版。
旧版とは独立したソース一式です。画像認識・空間追跡の精度とiPhone動作は実機検証待ちです。

## 実装した機能

- 画像AR：MK 1008のターゲットに追従。見失うと非表示、再取得で表示。
- 空間AR：8th WallのSLAMとhitTestで得られた推定／検出面へタップ配置。再配置。
- 作品：同梱GLB（メッシュ・アニメーション内包）／MK 1008の画像。ローカルGLB・PNG・JPEG・WebPの読込。
- 反応：作品のメッシュをタップした時だけ、回転・浮遊・GLBアニメーションの再生／停止。短い拡大反応。
- 音：明示的にONにした後、作品タップで合成音。
- UI：AR中は小さな操作バー。大きさ調整は設定パネルに格納。
- 終了・バックグラウンド移動時のカメラ停止。再開時は新規ARセッション。

画像ARと空間ARは独立したモード。画像から空間へのアンカー引継ぎ、永続アンカー、実物の遮蔽、多人数同期、映像読込はこの版に含みません。
空間配置は水平な床・机を想定し、実寸の保証はありません。任意の壁面に沿わせる実装ではありません。
ローカル読込は今回の表示のみで、アップロード・作品保存は行いません。
GLBは画像等を内包したファイルを使用。Draco対応、KTX2圧縮テクスチャは未対応です。

## Macで既存リポジトリへ導入

ZIPはフォルダ `webar-art-0.2` を含みます。Node.js 20以上を使用してください。

```bash
unzip -o "$HOME/Downloads/webar-art-0.2.0-8thwall-threejs.zip" -d "$HOME/Downloads"
cd "$HOME/Downloads/webar-art-0.2"
npm run install:repo -- "$HOME/webar-art-0.1"
cd "$HOME/webar-art-0.1"
npm install
npm run target:prepare
```

導入スクリプトは、リポジトリの隣の `webar-art-backups` に旧版の対象ファイルをバックアップします。
既存のpublic内の `.mind` と作品画像は保持しますが、旧src・scripts・testsは新構成へ置換します。
旧 `prepare.html` は残る場合がありますが、この版のターゲット作成には使用しません。
Gitへのcommit/pushはスクリプトでは実行しません。

## 画像ターゲットの作成（初回）

`npm run target:prepare` は、インストール済みの8th Wall公式CLIを起動します。
対話画面で、次の内容を入力／選択してください。CLIの表示文言は同梱ツールのものを確認してください。

| 設定 | 入力・選択 |
| --- | --- |
| 画像パス | `public/targets/mk_1008.jpg` |
| 形状 | 平面／Planar |
| クロップ | まず既定の中央クロップ |
| 出力フォルダ | `image-targets` |
| ターゲット名 | `mk_1008` |

CLI終了後に生成JSONを自動検索し、`public/targets/target.json` とトラッキング画像を配置します。
自動検索できなければ次を実行してください（JSON名は実際の出力に合わせる）。

```bash
npm run target:import -- image-targets/mk_1008.json
```

これまでのMindAR用 `.mind` は8th Wallでは使えません。
紙には元のMK 1008の画像を使用。黒枠は不要。CLIが使用した中央部分がカメラに映るようにします。
ターゲット未生成でも空間ARは開始できますが、画像ARの開始は無効になり準備方法が表示されます。

## 検証・公開

```bash
npm test
npm run build
git status --short
git add .gitignore .github/workflows/pages.yml package.json package-lock.json index.html print.html src scripts tests public docs README.md TEST_REPORT.md
git commit -m "WebAR Art 0.2: 8th Wall image and world AR"
git push
```

GitHub Actions成功後、次をiPhone Safariで開きます。
https://correctree.github.io/webar-art/?v=0.2.0

ページ上に `WebAR Art 0.2` と表示されることを確認。`?tracking=stable` / `baseline` はこの版では使用しません。
既存のGitHub Pages設定（Actions）を利用できます。新しいリポジトリは不要です。
SDK一式はnpm installで取得し、ビルド時にdistへコピーします。Pages実行時にCDNからThree.jsを読み込む構成ではありません。

PCでファイルを確認する場合は `npm run dev` → http://localhost:8080/。
iPhoneへPCのHTTP LANアドレスを渡してもカメラを開始できないため、公開済みHTTPS URLを使用してください。

## iPhoneの主要確認

1. 空間に置く → カメラ許可 → 床や机へ向けてゆっくり動かす → 指示が変わったらタップして配置。
2. 配置した立体をタップ → 動く → 再度タップ → 止まる。音ON後はタップ時に音が出る。
3. 再配置 → 別の場所をタップ。設定 → 大きさを変更 → 閉じる。
4. 終了 → 紙の作品に重ねる → 開始 → MK 1008にかざす。紙を外すと消え、戻すと再表示。
5. 終了 → 自分のGLB／PNGを読込 → 空間ARまたは画像ARで表示、タップ反応。
6. アプリ切替 → カメラ停止 → Safariへ戻る → 開始して再開。

## 出典とライセンス

実装は公式Camera Pipeline、Threejs.xrScene、XrController.configure/hitTest、画像イベントの仕様に基づいています。
公式サンプルのソースを取得してそのまま複製したものではありません。参照先は [docs/SOURCES.md](docs/SOURCES.md)。
このZIPに8th WallのSDKバイナリは同梱していません。Macのnpm installで公式配布物を取得します。
SDKはMITではなくXR Engine License Agreementの対象。ビルドで著作権・ライセンス全文を保持し、UIにクレジットを表示します。
将来、追跡機能を主価値とする有料SDK・AR制作基盤として販売する場合には、ライセンスの制限を別途確認してください。
今回のWebAR作品表示と、将来の商用オーサリングサービスの扱いを同一と断定していません。
