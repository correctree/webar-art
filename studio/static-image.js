// Store PNG as PNG so the canvas alpha channel survives save and publish.
export async function prepareStaticImage(file,{decode,createCanvas}){
 const extension=file.name.split('.').pop().toLowerCase(),png=extension==='png';
 if(!png&&!['jpg','jpeg'].includes(extension))throw Error('PNG/JPEG画像を選択してください。');
 const header=new Uint8Array(await file.slice(0,8).arrayBuffer());
 if(png?![137,80,78,71,13,10,26,10].every((v,i)=>header[i]===v):!(header[0]===255&&header[1]===216&&header[2]===255))throw Error('画像ファイルの形式が拡張子と一致しません。');
 const image=await decode(file),width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)throw Error('画像のサイズを確認できません。');
 const ratio=Math.min(1,4096/Math.max(width,height)),canvas=createCanvas();canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('画像を処理できません。');ctx.drawImage(image,0,0,canvas.width,canvas.height);
 const mime=png?'image/png':'image/jpeg',blob=await new Promise(resolve=>canvas.toBlob(resolve,mime,png?undefined:.95));
 if(!blob||blob.type!==mime)throw Error('画像の保存形式を維持できません。');
 return {blob,extension:png?'png':'jpg',width:canvas.width,height:canvas.height};
}
export function staticImageMaterialOptions(src){return /\.png$/i.test(src)?{transparent:true,alphaTest:.015,depthWrite:false}:{transparent:false,alphaTest:0,depthWrite:true};}
