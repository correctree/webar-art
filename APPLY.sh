#!/bin/bash
set -euo pipefail
SOURCE="$(cd "$(dirname "$0")" && pwd)"
DESTINATION="$HOME/webar-art-0.1"
node -e 'if(Number(process.versions.node.split(".")[0])<22){console.error("Node.js 22以上が必要です。");process.exit(1)}'
if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then
  if command -v brew >/dev/null; then
    brew install ffmpeg
  else
    echo 'FFmpegが必要です。Homebrewを導入して brew install ffmpeg を実行してください。'
    exit 1
  fi
fi
node "$SOURCE/scripts/install-repo.mjs" "$DESTINATION"
cd "$DESTINATION"
npm install --ignore-scripts
npm test
npm run build
node scripts/check-studio-dist.mjs
FILES=(.github/workflows/pages.yml LICENSE-MIT src scripts tests studio publisher package.json package-lock.json index.html print.html studio.html ar.html vite.studio.config.mjs public/scenes/demo public/scenes/demo-interactive README.md README_SETUP_JA.md TEST_REPORT.md docs .gitignore .dockerignore .env.example Dockerfile render.yaml APPLY.sh)
git add -- "${FILES[@]}"
if ! git diff --cached --quiet -- "${FILES[@]}"; then
  git commit --only -m "Add linked scale shadows and per-artwork tap switches in WebAR Art 0.5.1" -- "${FILES[@]}"
fi
git push
echo '初回プログラムをGitHubへ送信しました。Actionsの公開完了後、ar.html?scene=demo-interactive をiPhoneで確認できます。'
echo 'PC編集: http://localhost:8080/studio.html'
echo 'GitHub直接公開の初回設定: README_SETUP_JA.md を参照してください。'
if [ "${WEBAR_SKIP_START:-0}" != "1" ]; then
  if command -v open >/dev/null; then
    (sleep 3; open http://localhost:8080/studio.html) &
  fi
  npm start
fi
