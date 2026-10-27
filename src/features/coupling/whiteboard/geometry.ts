export type Point = { x: number; y: number };
export type EdgeGeometry = { start: Point; end: Point; path: string };

export function getEdgeGeometry(a: Point, b: Point, curved: boolean): EdgeGeometry {
  const dx = b.x - a.x, dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  const ux = length === 0 ? 1 : dx / length;
  const uy = length === 0 ? 0 : dy / length;
  if (!curved) {
    const start = { x: a.x + ux * 38, y: a.y + uy * 38 };
    const end = { x: b.x - ux * 38, y: b.y - uy * 38 };
    return { start, end, path: `M ${start.x} ${start.y} L ${end.x} ${end.y}` };
  }
  const control = { x: (a.x + b.x) / 2 - uy * 28, y: (a.y + b.y) / 2 + ux * 28 };
  const cdx = control.x - a.x, cdy = control.y - a.y;
  const clen = Math.hypot(cdx, cdy) || 1;
  const start = { x: a.x + cdx / clen * 38, y: a.y + cdy / clen * 38 };
  const edx = control.x - b.x, edy = control.y - b.y;
  const elen = Math.hypot(edx, edy) || 1;
  const end = { x: b.x + edx / elen * 38, y: b.y + edy / elen * 38 };
  return { start, end, path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}` };
}

export function worldPoint(clientX: number, clientY: number, rect: DOMRect, view: Point & { zoom: number }): Point {
  return { x: (clientX - rect.left - view.x) / view.zoom, y: (clientY - rect.top - view.y) / view.zoom };
}
export function clampZoom(value: number): number { return Math.max(0.04, Math.min(4, value)); }
export function zoomAround(view: Point & { zoom: number }, nextZoom: number, x: number, y: number): Point & { zoom: number } {
  const zoom = clampZoom(nextZoom);
  const worldX = (x - view.x) / view.zoom, worldY = (y - view.y) / view.zoom;
  return { zoom, x: x - worldX * zoom, y: y - worldY * zoom };
}
