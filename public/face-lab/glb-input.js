// Validate content after selection: do not depend on iOS MIME associations.
export function validateGlb(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20)throw new Error('GLBファイルではありません（データが短すぎます）。');
 const view=new DataView(buffer);
 if(view.getUint32(0,true)!==0x46546c67)throw new Error('GLB形式ではありません。.glbファイルを選んでください。');
 if(view.getUint32(4,true)!==2)throw new Error('GLBバージョン2を選んでください。');
 if(view.getUint32(8,true)!==buffer.byteLength)throw new Error('GLBが不完全です。ダウンロード完了後に選び直してください。');
 return buffer;
}
