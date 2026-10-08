export class TrackingState {
 constructor(){this.seen=false;this.found=0;this.lost=0;this.value='idle';}
 event(type){if(type==='found'){this.found++;this.value=this.seen?'reacquired':'tracking';this.seen=true;}else if(type==='lost'){this.lost++;this.value='lost';}else this.value=type;return this.value;}
}
export function errorMessage(e){const n=e?.name;return n==='NotAllowedError'?'カメラの許可が必要です。Safariのサイト設定を確認して再開してください。':n==='NotFoundError'?'利用できるカメラがありません。':n==='NotReadableError'?'カメラを使用できません。他のカメラアプリを閉じて再開してください。':`開始できませんでした：${e?.message||String(e)}`;}
