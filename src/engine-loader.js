let ready;
export function loadEngine() {
  if (ready) return ready;
  ready = new Promise((resolve, reject) => {
    let timer;
    const done = () => { clearTimeout(timer); window.removeEventListener('xrloaded', done); resolve(window.XR8); };
    window.addEventListener('xrloaded', done);
    const script = document.createElement('script');
    script.src = './external/xr/xr.js'; script.async = true;
    script.dataset.preloadChunks = 'slam';
    script.onerror = () => {
      clearTimeout(timer); window.removeEventListener('xrloaded', done);
      reject(new Error('ARエンジンを読み込めません。npm install と npm run build を実行して再公開してください。'));
    };
    timer = setTimeout(() => {
      window.removeEventListener('xrloaded', done);
      reject(new Error('ARエンジンの準備が完了しません。通信を確認してページを再読み込みしてください。'));
    }, 60000);
    document.head.append(script);
    if (window.XR8) done();
  });
  return ready;
}
