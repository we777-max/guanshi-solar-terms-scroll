// Metres; +X east, +Y up, -Z north, matching the exported guibiao.
export const GROUND_Y = .38;
export const EYE_HEIGHT = 1.62;
export const GNOMON = Object.freeze({ x: 1.15, y: GROUND_Y, z: 1.65, datum: .12, height: 2 });
export const WALK_BOUNDS = Object.freeze({ minX: -6.45, maxX: 6.45, minZ: -5.8, maxZ: 4.4 });
export const WALK_OBSTACLES = Object.freeze([
  { minX: GNOMON.x - .26, maxX: GNOMON.x + .26, minZ: GNOMON.z - 5.66, maxZ: GNOMON.z + .36 },
  { minX: 4.9, maxX: 8.5, minZ: -6.1, maxZ: -2.15 },
  { minX: -6.6, maxX: -5.5, minZ: -5.75, maxZ: -4.55 },
  ...Array.from({ length: 5 }, (_, i) => ({ minX: -6.4, maxX: -6.2, minZ: -5.95 + i * 2.13, maxZ: -5.75 + i * 2.13 })),
]);
export const WALK_START = Object.freeze({ x: 4.8, z: 4.0, targetX: .8, targetY: 1.18, targetZ: -.8 });
export const GNOMON_APPROACH = Object.freeze({ x: 3.15, z: 3.15 });
