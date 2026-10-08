# 技術選定 — 2026-10-09確認

|候補|0.1の判断|根拠・制約|
|---|---|---|
|MindAR 1.2.5|採用|公式リリースのLatestは1.2.5。画像追跡・WebGL／Worker・MIT。単独開発者による保守と公式記載あり。高頻度の保守や当作品の精度は保証できない。|
|Three.js|採用|追跡アンカー上の描画。0.160.0を互換性検証対象として固定。最新版という主張はしない。|
|WebXR|将来の別アダプター|ブラウザーAPIの存在だけでimmersive-arやhit-test対応とは判断できない。機能検出と実機検証が必要。今回iPhoneの平面認識を保証しない。|
|WebGPU|後続で検証|Safari 26でiOS等へ導入という公式発表。WebGPUは描画・計算APIであり、平面検出やSLAMを提供するものではない。MindARのWebGL処理を置き換えるにはエンジン側の変更が必要。|
|WebAssembly|後続で検証|画像処理等の候補。WASM自体は追跡エンジンではなく、実装・計測なしに精度や速度改善を約束しない。|
|商用SLAM／空間追跡SDK|未採用|iPhoneのブラウザー内平面配置の候補。ライセンス、料金、対象端末、保守、再配布条件を別途比較する。今回契約や依存なし。|
|Apple AR Quick Look|別の鑑賞経路|Apple公式のUSDZ等のARビューア。独自ブラウザー内の編集・同期・タイムラインをそのまま実行する経路とは分ける。|

最新技術を積極的に評価しつつ、0.1は画像追跡を優先。Safariの新機能については導入済みの公式資料を根拠とし、ユーザーの実機OS・GPUでの利用は未確認。新しいフォークも発見したが、API差異・保守・信頼性・ライセンスを未調査のため今回採用しない。

## 参考モデルと独自実装
- Adobe Aero：提供終了は2025-11-06（公式FAQ）。過去の空間配置・トリガー／アクションという制作体験を将来設計の参考にする。AeroのSDKやコードは使用しない。0.1では独自の相対位置・角度・大きさ調整だけを実装。
- Kivicube：画像／SLAM／平面／顔／身体などの追跡方式、ブラウザー鑑賞とQRの入口を参考にする。Kivicubeエンジンは使用しない。0.1は独自UIとMindAR画像追跡のみ。
- Artivive：物理作品を認識し映像・立体・音等を重ねる制作・鑑賞の流れ、画像の追跡適性を示す考え方を参考にする。Artiviveエンジンは使用しない。0.1に多層編集・星評価・タイムライン・QR自動生成は未実装。

## 公式出典
- MindAR repository / MIT / architecture：https://github.com/hiukim/mind-ar-js
- Releases：https://github.com/hiukim/mind-ar-js/releases
- ES Module installation：https://hiukim.github.io/mind-ar-js-doc/installation
- Compiler example：https://github.com/hiukim/mind-ar-js/blob/master/examples/image-tracking/compile.html
- Three example：https://github.com/hiukim/mind-ar-js/blob/master/examples/image-tracking/three.html
- Compiler：https://hiukim.github.io/mind-ar-js-doc/tools/compile/
- Adobe FAQ：https://helpx.adobe.com/aero/aero-end-of-support-faq.html
- Kivicube：https://www.kivicube.com/en/ar-tracking/
- Artivive：https://www.artivive.com/resources/create-art
- WebKit WebGPU：https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- WebXR on visionOS：https://webkit.org/blog/17640/webkit-features-for-safari-26-2/
- Apple Quick Look：https://developer.apple.com/quick-look-gallery/

取得できた公式ページだけを根拠にした調査。個別SDKの現時点の料金・今後のサポート期間は不明。商用サービスの追跡精度を無料実装で再現できるとは仮定しない。
