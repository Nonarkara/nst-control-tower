/** Lightweight authored reconstruction meshes. Dimensions are not a surface survey. */
export type Profile = readonly (readonly [height: number, radius: number])[];
export const BELL_PROFILE: Profile = [
  [6, 10.5], [6.4, 10.7], [7, 10.9], [8, 11], [9, 10.95], [10, 10.8],
  [12, 10.3], [14, 9.6], [16, 8.8], [18, 7.9], [20, 7], [22, 6.1],
  [24, 5.3], [26, 4.6], [28, 4], [30, 3.5], [31.5, 3.1], [32.8, 2.8],
];
const spire: [number, number][] = [[36.3, 2.4]];
for (let z = 36.5; z < 53; z += .65) {
  const radius = 2.35 * Math.pow((56 - z) / (56 - 36.3), 1.35);
  spire.push([z, radius], [z + .12, radius + .10], [z + .24, radius]);
}
spire.push([54, .16], [55, .07], [56, .015]);
export const SPIRE_PROFILE: Profile = spire;

/** Revolve a height/radius profile about local Z, with smooth radial normals. */
export function latheMesh(profile: Profile, segments = 48) {
  const positions: number[] = [], normals: number[] = [], triangles: number[] = [];
  profile.forEach(([z, radius], i) => {
    const before = profile[Math.max(0, i - 1)]!, after = profile[Math.min(profile.length - 1, i + 1)]!;
    const slope = (after[1] - before[1]) / Math.max(.001, after[0] - before[0]);
    const length = Math.hypot(1, slope);
    for (let j = 0; j <= segments; j++) {
      const angle = j / segments * Math.PI * 2, c = Math.cos(angle), s = Math.sin(angle);
      positions.push(radius * c, radius * s, z);
      normals.push(c / length, s / length, -slope / length);
      if (i < profile.length - 1 && j < segments) {
        const a = i * (segments + 1) + j, b = a + segments + 1;
        triangles.push(a, a + 1, b + 1, a, b + 1, b);
      }
    }
  });
  return { attributes: {
    POSITION: { value: new Float32Array(positions), size: 3 },
    NORMAL: { value: new Float32Array(normals), size: 3 },
  }, indices: { value: new Uint16Array(triangles), size: 1 } };
}
