import { WALK_BOUNDS, WALK_OBSTACLES } from './courtyard-layout.js';

export function canStandAt(x, z, radius = .22) {
  const b = WALK_BOUNDS;
  if (!Number.isFinite(x) || !Number.isFinite(z) || x < b.minX + radius || x > b.maxX - radius || z < b.minZ + radius || z > b.maxZ - radius) return false;
  return !WALK_OBSTACLES.some(o => x > o.minX - radius && x < o.maxX + radius && z > o.minZ - radius && z < o.maxZ + radius);
}

// Small steps prevent tunnelling through the narrow stone ruler. Independent
// axes let a visitor slide along a wall rather than get stuck on it.
export function moveOnGround(position, delta, radius = .22) {
  let { x, z } = position;
  const steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.z) / .07));
  const dx = delta.x / steps, dz = delta.z / steps;
  for (let step = 0; step < steps; step += 1) {
    if (canStandAt(x + dx, z, radius)) x += dx;
    if (canStandAt(x, z + dz, radius)) z += dz;
  }
  return { x, z };
}

export function clearWalkLine(from, to) {
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / .1));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    if (!canStandAt(from.x + (to.x - from.x) * t, from.z + (to.z - from.z) * t)) return false;
  }
  return true;
}

// Click-to-walk routes around the ruler and pavilion, rather than crossing them.
export function planWalkPath(from, to) {
  if (!canStandAt(to.x, to.z) || !canStandAt(from.x, from.z)) return [];
  if (clearWalkLine(from, to)) return [{ ...to }];
  const step = .4, b = WALK_BOUNDS;
  const width = Math.floor((b.maxX - b.minX) / step), depth = Math.floor((b.maxZ - b.minZ) / step);
  const point = (x, z) => ({ x: b.minX + (x + .5) * step, z: b.minZ + (z + .5) * step });
  const cell = p => ({ x: Math.max(0, Math.min(width - 1, Math.floor((p.x - b.minX) / step))), z: Math.max(0, Math.min(depth - 1, Math.floor((p.z - b.minZ) / step))) });
  const key = (x, z) => z * width + x;
  const closestCell = p => {
    const start = cell(p), candidates = [];
    for (let dz = -2; dz <= 2; dz += 1) for (let dx = -2; dx <= 2; dx += 1) {
      const x = start.x + dx, z = start.z + dz;
      if (x < 0 || x >= width || z < 0 || z >= depth) continue;
      const candidate = point(x, z);
      if (canStandAt(candidate.x, candidate.z) && clearWalkLine(p, candidate)) candidates.push({ x, z, distance: Math.hypot(p.x - candidate.x, p.z - candidate.z) });
    }
    return candidates.sort((a, c) => a.distance - c.distance)[0];
  };
  const start = closestCell(from), goal = closestCell(to);
  if (!start || !goal) return [];
  const startKey = key(start.x, start.z), goalKey = key(goal.x, goal.z);
  const open = [startKey], costs = new Map([[startKey, 0]]), previous = new Map(), closed = new Set();
  const heuristic = id => Math.hypot(id % width - goal.x, Math.floor(id / width) - goal.z);
  while (open.length) {
    open.sort((a, c) => costs.get(a) + heuristic(a) - costs.get(c) - heuristic(c));
    const id = open.shift();
    if (id === goalKey) {
      const route = [{ ...to }];
      let current = goalKey;
      while (current !== startKey) {
        route.unshift(point(current % width, Math.floor(current / width)));
        current = previous.get(current);
      }
      route.unshift(point(start.x, start.z));
      const shortened = [];
      let anchor = from, index = 0;
      while (index < route.length) {
        let next = index;
        while (next + 1 < route.length && clearWalkLine(anchor, route[next + 1])) next += 1;
        shortened.push(route[next]);
        anchor = route[next];
        index = next + 1;
      }
      return shortened;
    }
    closed.add(id);
    const x = id % width, z = Math.floor(id / width);
    for (let dz = -1; dz <= 1; dz += 1) for (let dx = -1; dx <= 1; dx += 1) {
      if (!(dx || dz)) continue;
      const nx = x + dx, nz = z + dz, next = key(nx, nz);
      if (nx < 0 || nx >= width || nz < 0 || nz >= depth || closed.has(next)) continue;
      if (!clearWalkLine(point(x, z), point(nx, nz))) continue;
      const cost = costs.get(id) + Math.hypot(dx, dz);
      if (cost >= (costs.get(next) ?? Infinity)) continue;
      costs.set(next, cost);
      previous.set(next, id);
      if (!open.includes(next)) open.push(next);
    }
  }
  return [];
}
