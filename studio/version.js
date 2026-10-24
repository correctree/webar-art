export const APP_VERSION='0.16.5';
export function applyAppVersion(root=document){for(const el of root.querySelectorAll('[data-app-version]'))el.textContent=(el.dataset.versionPrefix||'')+APP_VERSION;}
