// Bound startup waits; callers must not continue initialization after a timeout.
export async function withDeadline(work, ms, label) {
 let timer;
 try {
  return await Promise.race([
   Promise.resolve().then(work),
   new Promise((_, reject) => { timer=setTimeout(() => reject(new Error(label+'の待機時間を超えました。通信を確認して再読み込みしてください。')), ms); })
  ]);
 } finally { clearTimeout(timer); }
}
