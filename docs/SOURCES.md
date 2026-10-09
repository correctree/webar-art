# 公式参照資料（2026-10-09確認）

- 8th Wall Engine integration / local SDK copy / Three.js camera pipeline:
  https://8thwall.org/docs/engine/overview
- XrController configuration / imageTargetData / image-only vs world tracking:
  https://8thwall.org/docs/api/engine/xrcontroller/configure
- hitTest input / surface estimates / pose result:
  https://8thwall.org/docs/api/engine/xrcontroller/hittest
- Image found/updated/lost events and tracking status:
  https://8thwall.org/docs/api/engine/xrcontroller/pipelinemodule
- onStart scene initialization and camera projection sync:
  https://8thwall.org/docs/api/engine/camerapipelinemodule/onstart
- onUpdate:
  https://8thwall.org/docs/api/engine/camerapipelinemodule/onupdate
- Official image target CLI workflow:
  https://github.com/8thwall/8thwall/blob/main/apps/image-target-cli/README.md
- SDK package version:
  https://github.com/8thwall/engine/blob/main/package.json
- Binary license and attribution:
  https://github.com/8thwall/engine/blob/main/LICENSE
- SDK open source / binary distinction:
  https://github.com/8thwall/8thwall

公式API仕様を使った実装。実機での追跡精度、対応OS全組合せ、元SDKバイナリの動作はここで確認していません。

## Marker Studio公式資料
- MindAR: https://github.com/hiukim/mind-ar-js
- ブラウザコンパイラ: https://github.com/hiukim/mind-ar-js/blob/master/examples/image-tracking/compile.html
- GitHub App user authentication: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-user-with-a-github-app
- Git trees: https://docs.github.com/en/rest/git/trees
- GitHub Pages deployment: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
