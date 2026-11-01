import {reflectionSettings,reflectionProfiles} from './reflection-policy.js';
export function syncReflectionUI(project) {
 const profile=document.getElementById('chrome-profile'),intensity=document.getElementById('chrome-intensity');
 if(!profile||!intensity)return;
 const settings=reflectionSettings(project.reflection);
 profile.value=settings.profile;intensity.value=settings.intensity;
 document.getElementById('chrome-intensity-value').textContent=settings.intensity.toFixed(2);
}
export function installReflectionUI(container,{getProject,onChange}) {
 const panel=document.createElement('details');panel.className='inspector-section';panel.id='chrome-settings';
 panel.innerHTML='<summary>クローム反射（全シーン共通）</summary><label>反射プリセット<select id="chrome-profile"><option value="classic">Classic — 従来の反射</option><option value="bright">Bright — 明るめ</option><option value="studio">Studio — コントラスト強め</option><option value="soft">Soft — 柔らかい反射</option></select></label><label>反射強度 <output id="chrome-intensity-value">1.60</output><input id="chrome-intensity" type="range" min="0" max="3" step="0.05" value="1.6"></label><button id="chrome-reset" type="button">従来の反射に戻す</button><p class="hint">クローム対象のGLBに適用。設定は作品と一緒に保存・公開されます。強度0では反射が消えます。</p>';
 container.append(panel);
 const profile=panel.querySelector('#chrome-profile'),intensity=panel.querySelector('#chrome-intensity');
 const update=settings=>{onChange(settings);syncReflectionUI(getProject());};
 profile.onchange=()=>update(reflectionSettings({profile:profile.value,intensity:reflectionProfiles[profile.value].intensity}));
 intensity.oninput=()=>update(reflectionSettings({profile:profile.value,intensity:Number(intensity.value)}));
 panel.querySelector('#chrome-reset').onclick=()=>update(reflectionSettings());
 syncReflectionUI(getProject());
}
