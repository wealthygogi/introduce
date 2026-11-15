type DirectedEdge = { id: string; from: string; to: string; direction: string };

/** Reciprocal forward edges curve only when their identities differ. */
export function getCurvedEdgeIds(edges: readonly DirectedEdge[]): Set<string> {
  const byEndpoints = new Map<string, Set<string>>();
  const key = (from: string, to: string) => JSON.stringify([from, to]);
  for (const edge of edges) {
    if (edge.direction !== 'forward') continue;
    const endpoints = key(edge.from, edge.to);
    let ids = byEndpoints.get(endpoints);
    if (!ids) byEndpoints.set(endpoints, ids = new Set());
    ids.add(edge.id);
  }
  const curved = new Set<string>();
  for (const edge of edges) {
    if (edge.direction !== 'forward') continue;
    const reverse = byEndpoints.get(key(edge.to, edge.from));
    if (reverse && (reverse.size > 1 || !reverse.has(edge.id))) curved.add(edge.id);
  }
  return curved;
}
