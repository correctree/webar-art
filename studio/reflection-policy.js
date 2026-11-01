export const reflectionProfiles=Object.freeze({
 classic:{intensity:1.6,exposure:1,contrast:1,softness:1},
 bright:{intensity:1.9,exposure:1.2,contrast:.86,softness:1.15},
 studio:{intensity:1.5,exposure:1,contrast:1.25,softness:.78},
 soft:{intensity:1.4,exposure:1.05,contrast:.78,softness:1.6}
});
export function reflectionSettings(value={}) {
 const profile=Object.hasOwn(reflectionProfiles,value?.profile)?value.profile:'classic';
 const intensity=Number.isFinite(value?.intensity)?Math.max(0,Math.min(3,value.intensity)):reflectionProfiles[profile].intensity;
 return {profile,intensity};
}
export function validateReflection(value) {
 if(value===undefined)return;
 if(!value||typeof value!=='object'||Array.isArray(value)||!Object.hasOwn(reflectionProfiles,value.profile)||!Number.isFinite(value.intensity)||value.intensity<0||value.intensity>3)throw new Error('クローム反射の設定が不正です。強度は0〜3です。');
}
// URL overrides are preview-only on the public player; the saved project remains unchanged.
export function playbackReflection(value,search='') {
 const params=new URLSearchParams(search),saved=reflectionSettings(value);
 const requested=params.get('chromeProfile');
 const profile=Object.hasOwn(reflectionProfiles,requested)?requested:saved.profile;
 const raw=params.get('chromeIntensity');
 const intensity=raw!==null&&raw.trim()!==''&&Number.isFinite(Number(raw))?Number(raw):(profile!==saved.profile?reflectionProfiles[profile].intensity:saved.intensity);
 return reflectionSettings({profile,intensity});
}
