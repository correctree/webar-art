export function canvasPoint(clientX, clientY, rect) {
  if (!rect.width || !rect.height) return null;
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? {x, y} : null;
}
export function surfaceHit(hits) {
  const rank = {DETECTED_SURFACE: 0, ESTIMATED_SURFACE: 1};
  return [...hits].filter(h => h.type in rank &&
    ['x', 'y', 'z'].every(k => Number.isFinite(h.position?.[k])))
    .sort((a, b) => rank[a.type] - rank[b.type] || (a.distance ?? 0) - (b.distance ?? 0))[0] ?? null;
}
export function targetMatches(expected, detail) { return !!expected && detail?.name === expected; }
export function validTarget(data) {
  return data && typeof data.imagePath === 'string' && data.imagePath.length > 0 &&
    ['PLANAR', 'CYLINDER', 'CONICAL'].includes(data.type) && data.properties && typeof data.properties === 'object';
}
export function targetName(data) { return data?.properties?.name || data?.name || null; }
export function validAssetName(name) {
  return typeof name === 'string' && /^[^/\\]+\.(glb|png|jpe?g|webp)$/i.test(name);
}
