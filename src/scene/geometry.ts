import * as THREE from "three";

/**
 * Geometry helpers. Everything here is pure and called from useMemo, so no
 * allocation happens on a frame; the scene is fully static once mounted.
 */

/* ------------------------------------------------------------------ */
/* curve / profile maths                                               */
/* ------------------------------------------------------------------ */

export type ControlPoint = [t: number, value: number];

function smoothstep(x: number): number {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
}

/**
 * Smoothly interpolated piecewise profile. Control points must be sorted by t.
 * Used for every hand-authored silhouette (chair back width, mouse loft, ...).
 */
export function profile(points: ControlPoint[], t: number): number {
  const c = Math.min(1, Math.max(0, t));
  if (c <= points[0][0]) return points[0][1];
  const last = points[points.length - 1];
  if (c >= last[0]) return last[1];
  for (let i = 0; i < points.length - 1; i++) {
    const [t0, v0] = points[i];
    const [t1, v1] = points[i + 1];
    if (c >= t0 && c <= t1) {
      const k = smoothstep((c - t0) / (t1 - t0));
      return v0 + (v1 - v0) * k;
    }
  }
  return last[1];
}

/** Gaussian-ish bump, 1 at `center`, ~0 beyond `width`. */
export function bell(x: number, center: number, width: number): number {
  const d = (x - center) / width;
  return Math.exp(-d * d * 3.0);
}

/* ------------------------------------------------------------------ */
/* parametric surfaces                                                 */
/* ------------------------------------------------------------------ */

export type SurfaceFn = (u: number, v: number, out: THREE.Vector3) => void;

/**
 * Builds an indexed grid surface from a parametric function over (u, v) in
 * [0,1]^2. When `closedU` the first and last columns coincide and their
 * normals are averaged so no lighting seam shows.
 */
export function parametricGeometry(
  nu: number,
  nv: number,
  fn: SurfaceFn,
  closedU = false,
): THREE.BufferGeometry {
  const cols = nu + 1;
  const rows = nv + 1;
  const count = cols * rows;
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const tmp = new THREE.Vector3();

  for (let j = 0; j < rows; j++) {
    const v = j / nv;
    for (let i = 0; i < cols; i++) {
      const u = i / nu;
      fn(u, v, tmp);
      const k = j * cols + i;
      positions[k * 3] = tmp.x;
      positions[k * 3 + 1] = tmp.y;
      positions[k * 3 + 2] = tmp.z;
      uvs[k * 2] = u;
      // matches PlaneGeometry's convention (uv.y = 1 at v = 0) so canvas
      // textures land right way up on these surfaces
      uvs[k * 2 + 1] = 1 - v;
    }
  }

  const indices: number[] = [];
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  if (closedU) {
    const normal = geo.getAttribute("normal") as THREE.BufferAttribute;
    for (let j = 0; j < rows; j++) {
      const a = j * cols;
      const b = a + nu;
      const nx = (normal.getX(a) + normal.getX(b)) * 0.5;
      const ny = (normal.getY(a) + normal.getY(b)) * 0.5;
      const nz = (normal.getZ(a) + normal.getZ(b)) * 0.5;
      const len = Math.hypot(nx, ny, nz) || 1;
      normal.setXYZ(a, nx / len, ny / len, nz / len);
      normal.setXYZ(b, nx / len, ny / len, nz / len);
    }
    normal.needsUpdate = true;
  }

  geo.computeBoundingSphere();
  return geo;
}

/** Boundary loop of a parametric panel, for running a frame tube around it. */
export function panelOutline(fn: SurfaceFn, sideSteps: number, capSteps: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const push = (u: number, v: number) => {
    const p = new THREE.Vector3();
    fn(u, v, p);
    pts.push(p);
  };
  for (let i = 0; i < sideSteps; i++) push(1, i / sideSteps);
  for (let i = 0; i < capSteps; i++) push(1 - i / capSteps, 1);
  for (let i = 0; i < sideSteps; i++) push(0, 1 - i / sideSteps);
  for (let i = 0; i < capSteps; i++) push(i / capSteps, 0);
  return pts;
}

export function tubeFromPoints(
  points: THREE.Vector3[],
  radius: number,
  tubular: number,
  radial = 8,
  closed = true,
): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points, closed, "centripetal", 0.5);
  return new THREE.TubeGeometry(curve, tubular, radius, radial, closed);
}

/* ------------------------------------------------------------------ */
/* merging                                                             */
/* ------------------------------------------------------------------ */

interface MergePart {
  geometry: THREE.BufferGeometry;
  matrix?: THREE.Matrix4;
  color?: THREE.Color;
}

/**
 * Minimal geometry merge (position / normal / uv / colour). Keeps repeated
 * props — keycaps, casters, louvers — down to a single draw call.
 */
export function mergeParts(parts: MergePart[], withColor = false): THREE.BufferGeometry {
  let vertexTotal = 0;
  let indexTotal = 0;
  const prepared = parts.map((p) => {
    const geo = p.matrix ? p.geometry.clone().applyMatrix4(p.matrix) : p.geometry;
    const pos = geo.getAttribute("position");
    const idx = geo.getIndex();
    vertexTotal += pos.count;
    indexTotal += idx ? idx.count : pos.count;
    return { geo, color: p.color };
  });

  const positions = new Float32Array(vertexTotal * 3);
  const normals = new Float32Array(vertexTotal * 3);
  const uvs = new Float32Array(vertexTotal * 2);
  const colors = withColor ? new Float32Array(vertexTotal * 3) : null;
  const indices = new Uint32Array(indexTotal);

  let vOff = 0;
  let iOff = 0;
  for (const { geo, color } of prepared) {
    const pos = geo.getAttribute("position");
    const nrm = geo.getAttribute("normal");
    const uv = geo.getAttribute("uv");
    const idx = geo.getIndex();

    for (let i = 0; i < pos.count; i++) {
      positions[(vOff + i) * 3] = pos.getX(i);
      positions[(vOff + i) * 3 + 1] = pos.getY(i);
      positions[(vOff + i) * 3 + 2] = pos.getZ(i);
      if (nrm) {
        normals[(vOff + i) * 3] = nrm.getX(i);
        normals[(vOff + i) * 3 + 1] = nrm.getY(i);
        normals[(vOff + i) * 3 + 2] = nrm.getZ(i);
      }
      if (uv) {
        uvs[(vOff + i) * 2] = uv.getX(i);
        uvs[(vOff + i) * 2 + 1] = uv.getY(i);
      }
      if (colors) {
        colors[(vOff + i) * 3] = color ? color.r : 1;
        colors[(vOff + i) * 3 + 1] = color ? color.g : 1;
        colors[(vOff + i) * 3 + 2] = color ? color.b : 1;
      }
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) indices[iOff + i] = idx.getX(i) + vOff;
      iOff += idx.count;
    } else {
      for (let i = 0; i < pos.count; i++) indices[iOff + i] = vOff + i;
      iOff += pos.count;
    }
    vOff += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  merged.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  if (colors) merged.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeBoundingSphere();
  return merged;
}

/* ------------------------------------------------------------------ */
/* small reusable primitives                                           */
/* ------------------------------------------------------------------ */

/** Superellipse ring — a square with generously rounded corners. */
function roundedSquareRing(n: number, power: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    pts.push([
      Math.sign(c) * Math.pow(Math.abs(c), 2 / power),
      Math.sign(s) * Math.pow(Math.abs(s), 2 / power),
    ]);
  }
  return pts;
}

/**
 * A keycap: unit footprint in X/Z, y from 0 to 1, tapered with a chamfered
 * top rim. Scaled per key at merge time.
 */
export function keycapGeometry(): THREE.BufferGeometry {
  const ring = roundedSquareRing(16, 5.5);
  const levels: [number, number][] = [
    [0.5, 0.0],
    [0.5, 0.62],
    [0.455, 0.9],
    [0.4, 1.0],
  ];

  const positions: number[] = [];
  const indices: number[] = [];
  const n = ring.length;

  for (const [scale, y] of levels) {
    for (const [rx, rz] of ring) positions.push(rx * scale, y, rz * scale);
  }
  for (let l = 0; l < levels.length - 1; l++) {
    for (let i = 0; i < n; i++) {
      const a = l * n + i;
      const b = l * n + ((i + 1) % n);
      const c = (l + 1) * n + i;
      const d = (l + 1) * n + ((i + 1) % n);
      indices.push(a, c, b, b, c, d);
    }
  }
  // top cap fan
  const topStart = (levels.length - 1) * n;
  const centreIndex = positions.length / 3;
  positions.push(0, 1, 0);
  for (let i = 0; i < n; i++) {
    indices.push(topStart + i, centreIndex, topStart + ((i + 1) % n));
  }
  // bottom cap fan (keeps the merged mesh watertight for shadows)
  const bottomCentre = positions.length / 3;
  positions.push(0, 0, 0);
  for (let i = 0; i < n; i++) {
    indices.push(((i + 1) % n), bottomCentre, i);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((positions.length / 3) * 2), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Lathe profile helper: revolve a 2D outline given as [radius, y] pairs. */
export function lathe(points: [number, number][], segments = 32): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
}

/** Extruded flat star, used for the letterboard ornament. */
export function starGeometry(outer: number, inner: number, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const spikes = 5;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: depth * 0.35,
    bevelThickness: depth * 0.3,
    bevelSegments: 2,
    curveSegments: 2,
  });
}
