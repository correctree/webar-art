// Shared contain rectangle for video and overlay; never stretch the source.
export function containRect(sourceWidth,sourceHeight,boxWidth,boxHeight){
 if(![sourceWidth,sourceHeight,boxWidth,boxHeight].every(n=>Number.isFinite(n)&&n>0))return null;
 const scale=Math.min(boxWidth/sourceWidth,boxHeight/sourceHeight);
 const width=sourceWidth*scale,height=sourceHeight*scale;
 return {width,height,left:(boxWidth-width)/2,top:(boxHeight-height)/2};
}
