import type { Point, EdgeGeometry } from './geometry';
import { getEdgeGeometry } from './geometry';

export type GesturePointer = { id: number; client: Point };
export function closestNode(point: Point, nodes: readonly { id: string; x: number; y: number }[], radius = 38): string | null {
  let nearest: string | null = null, distance = radius;
  for (const node of nodes) {
    const d = Math.hypot(node.x - point.x, node.y - point.y);
    if (d <= distance) { nearest = node.id; distance = d; }
  }
  return nearest;
}
export function getConnectedEdgeGeometry(
  edge: { from: string; to: string }, nodes: readonly { id: string; x: number; y: number }[], curved: boolean,
): EdgeGeometry | null {
  const a = nodes.find(node => node.id === edge.from), b = nodes.find(node => node.id === edge.to);
  return a && b ? getEdgeGeometry(a, b, curved) : null;
}
export function getPinch(view: Point & { zoom: number }, first: Point, second: Point, initialDistance: number, anchor: Point): Point & { zoom: number } {
  const zoom = Math.max(.04, Math.min(4, view.zoom * Math.hypot(second.x - first.x, second.y - first.y) / Math.max(1, initialDistance)));
  return { zoom, x: anchor.x - ((anchor.x - view.x) / view.zoom) * zoom, y: anchor.y - ((anchor.y - view.y) / view.zoom) * zoom };
}
