import { useMemo } from "react";
import * as THREE from "three";
import { materials } from "../materials";
import { lathe, parametricGeometry, profile, type ControlPoint } from "../geometry";

/**
 * The left corner of the room: the dog's bolster bed and a soft-body backpack
 * propped against the wall. Both are lofted rather than boxed — soft goods
 * read as soft only if their silhouette has no straight lines in it.
 */

function DogBed() {
  const M = materials();

  const cushionMat = useMemo(() => {
    const m = M.suede.clone();
    m.color = new THREE.Color("#8794a4");
    return m;
  }, [M.suede]);

  const base = useMemo(
    () =>
      lathe(
        [
          [0, 0],
          [0.34, 0],
          [0.392, 0.016],
          [0.404, 0.046],
          [0.392, 0.072],
          [0.34, 0.084],
          [0.18, 0.09],
          [0, 0.092],
        ],
        40,
      ),
    [],
  );

  // dished cushion inside the bolster, a shade darker so the rim reads
  const cushion = useMemo(
    () =>
      parametricGeometry(36, 12, (u, v, out) => {
        const a = u * Math.PI * 2;
        const r = 0.3 * v;
        out.set(Math.cos(a) * r, 0.104 - 0.034 * Math.pow(v, 1.5), Math.sin(a) * r);
      }),
    [],
  );

  const ARC = Math.PI * 1.46;
  // rotated so the bolster's opening faces the room, not the wall
  const START = -3.645;

  return (
    <group position={[-1.32, 0, 0.3]} rotation={[0, 0.42, 0]} scale={[1, 1, 0.86]}>
      <mesh geometry={base} castShadow receiveShadow material={M.suede} />
      <mesh geometry={cushion} receiveShadow material={cushionMat} />
      {/* bolster rim, open at the front so it reads as a dog bed */}
      <mesh
        position={[0, 0.122, 0]}
        rotation={[Math.PI / 2, 0, START]}
        castShadow
        receiveShadow
        material={M.suede}
      >
        <torusGeometry args={[0.318, 0.082, 14, 44, ARC]} />
      </mesh>
      {/* rolled ends of the bolster */}
      {[START, START + ARC].map((a) => (
        <mesh
          key={a}
          position={[Math.cos(a) * 0.318, 0.122, Math.sin(a) * 0.318]}
          castShadow
          material={M.suede}
        >
          <sphereGeometry args={[0.082, 18, 14]} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Backpack                                                            */
/* ------------------------------------------------------------------ */

// Envelope keeps the sides near-vertical and rounds only the last few percent
// at each end, so the pack reads as a stuffed slab rather than an egg.
const PACK_ENV: ControlPoint[] = [
  [0.0, 0.0],
  [0.02, 0.58],
  [0.07, 0.86],
  [0.16, 0.97],
  [0.5, 1.0],
  [0.82, 0.99],
  [0.9, 0.93],
  [0.965, 0.66],
  [1.0, 0.0],
];

function Backpack() {
  const M = materials();

  const body = useMemo(
    () =>
      parametricGeometry(
        30,
        28,
        (u, v, out) => {
          const phi = u * Math.PI * 2;
          const c = Math.cos(phi);
          const s = Math.sin(phi);
          const env = profile(PACK_ENV, v);
          // belly bulge: fullest around the middle, tapering toward the base
          const fill = 0.86 + 0.22 * Math.sin(Math.PI * Math.pow(v, 0.85));
          const w = 0.163 * env * (0.94 + 0.08 * Math.sin(Math.PI * v));
          const d = 0.1 * env * fill;
          const y = 0.008 + 0.49 * Math.min(1, Math.max(0, (v - 0.03) / 0.94));
          out.set(
            w * Math.sign(c) * Math.pow(Math.abs(c), 0.45),
            y,
            d * Math.sign(s) * Math.pow(Math.abs(s), 0.45),
          );
        },
        true,
      ),
    [],
  );

  const straps = useMemo(
    () =>
      [-1, 1].map((s) => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(s * 0.045, 0.475, -0.045),
          new THREE.Vector3(s * 0.085, 0.395, -0.115),
          new THREE.Vector3(s * 0.082, 0.26, -0.138),
          new THREE.Vector3(s * 0.058, 0.12, -0.115),
          new THREE.Vector3(s * 0.04, 0.045, -0.075),
        ]);
        return new THREE.TubeGeometry(curve, 26, 0.021, 8, false);
      }),
    [],
  );

  return (
    // leans into the wall; yaw turns the harness side toward the room so it
    // reads as a backpack and not a beanbag
    <group position={[-2.12, 0, 0.2]} rotation={[0, 0, 0.11]}>
      <group rotation={[0, -2.45, 0]}>
        <mesh geometry={body} castShadow receiveShadow material={M.nylon} />

        {/* lid flap over the top */}
        <mesh position={[0, 0.455, 0.012]} scale={[0.152, 0.07, 0.098]} castShadow material={M.nylon}>
          <sphereGeometry args={[1, 22, 14]} />
        </mesh>

        {/* front pocket */}
        <mesh position={[0, 0.15, 0.078]} scale={[0.122, 0.105, 0.05]} castShadow material={M.nylon}>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>

        {/* zips */}
        <mesh position={[0, 0.232, 0.082]} rotation={[0.22, 0, 0]} material={M.graphiteDark}>
          <boxGeometry args={[0.19, 0.008, 0.006]} />
        </mesh>
        <mesh position={[0, 0.398, 0.052]} rotation={[0.75, 0, 0]} material={M.graphiteDark}>
          <boxGeometry args={[0.215, 0.008, 0.006]} />
        </mesh>

        {/* small tan leather patch, no logo */}
        <mesh position={[0, 0.3, 0.088]} rotation={[0.1, 0, 0]} material={M.tanLeather}>
          <planeGeometry args={[0.048, 0.032]} />
        </mesh>

        {/* padded harness facing the room */}
        {straps.map((g, i) => (
          <mesh key={i} geometry={g} castShadow material={M.nylon} />
        ))}
        {/* sternum strap */}
        <mesh position={[0, 0.33, -0.128]} material={M.graphiteDark}>
          <boxGeometry args={[0.15, 0.012, 0.008]} />
        </mesh>

        {/* haul loop */}
        <mesh position={[0, 0.5, -0.03]} rotation={[Math.PI / 2, 0, 0]} castShadow material={M.nylon}>
          <torusGeometry args={[0.036, 0.009, 8, 20, Math.PI]} />
        </mesh>
      </group>
    </group>
  );
}

export function Corner() {
  return (
    <group>
      <DogBed />
      <Backpack />
    </group>
  );
}
