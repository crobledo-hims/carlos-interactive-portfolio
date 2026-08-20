import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { materials } from "../materials";
import { lathe, parametricGeometry } from "../geometry";
import { notebookCloth, pageEdges, steamWisp } from "../textures";
import { usePrefersReducedMotion } from "../reducedMotion";
import { DESK_SURFACE } from "./Desk";

/**
 * Three objects that make the desk look used rather than staged, placed
 * asymmetrically: notebook tucked behind the keyboard under the left monitor,
 * mug out on the right where a mug actually lives, AirPods case beside the
 * mouse. All three sit in gaps verified against the existing props — nothing
 * intersects, nothing overhangs the 1.7 x 0.75 top.
 */

/* ------------------------------------------------------------------ */
/* Notebook                                                            */
/* ------------------------------------------------------------------ */

function Notebook() {
  const M = materials();

  const cover = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#5c6875",
        map: notebookCloth(),
        roughness: 0.78,
        metalness: 0.02,
      }),
    [],
  );

  const pages = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        map: pageEdges(),
        roughness: 0.88,
        metalness: 0,
      }),
    [],
  );

  const band = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#22262c", roughness: 0.7 }),
    [],
  );

  const barrel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: "#26292e", roughness: 0.34, metalness: 0.45 }),
    [],
  );

  useEffect(
    () => () => {
      cover.dispose();
      pages.dispose();
      band.dispose();
      barrel.dispose();
    },
    [cover, pages, band, barrel],
  );

  const W = 0.148;
  const D = 0.212;

  return (
    <group position={[-0.27, DESK_SURFACE, -0.3]} rotation={[0, 0.22, 0]}>
      <RoundedBox
        args={[W, 0.0032, D]}
        radius={0.0012}
        smoothness={2}
        position={[0, 0.0016, 0]}
        castShadow
        receiveShadow
        material={cover}
      />
      <mesh position={[0, 0.0076, 0]} castShadow material={pages}>
        <boxGeometry args={[W - 0.008, 0.0088, D - 0.008]} />
      </mesh>
      <RoundedBox
        args={[W, 0.0034, D]}
        radius={0.0013}
        smoothness={2}
        position={[0, 0.0137, 0]}
        castShadow
        receiveShadow
        material={cover}
      />

      {/* elastic closure, wrapped round the fore-edge */}
      <mesh position={[0.05, 0.0077, 0]} material={band}>
        <boxGeometry args={[0.0062, 0.0168, D + 0.0022]} />
      </mesh>

      {/* pen resting across the cover */}
      <group position={[-0.004, 0.0198, 0.012]} rotation={[0, 0.55, Math.PI / 2]}>
        <mesh castShadow material={barrel}>
          <cylinderGeometry args={[0.0044, 0.0042, 0.132, 12]} />
        </mesh>
        <mesh position={[0, 0.052, 0.0042]} material={M.aluminiumPolished}>
          <boxGeometry args={[0.0034, 0.026, 0.0018]} />
        </mesh>
        <mesh position={[0, -0.069, 0]} material={M.aluminiumPolished}>
          <cylinderGeometry args={[0.0026, 0.0042, 0.008, 12]} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Mug + steam                                                         */
/* ------------------------------------------------------------------ */

// x chosen so the wisps rise against the right monitor rather than the bright
// wall — steam this faint only reads against a darker background
const MUG_POS: [number, number, number] = [0.5, DESK_SURFACE, 0.02];
const COFFEE_Y = 0.07;

const WISP_COUNT = 3;
const WISP_H = 0.16;
/** Long, mutually prime-ish periods so the composite loop never reads. */
const WISP_PERIOD = [6.8, 8.1, 7.3];
const WISP_PHASE = [0, 0.37, 0.71];
const WISP_YAW = [0.0, 1.15, -0.95];
const PEAK_OPACITY = 0.26;

function wispGeometry(seed: number): THREE.BufferGeometry {
  return parametricGeometry(5, 14, (u, v, out) => {
    const w = 0.012 + 0.05 * Math.pow(v, 0.8);
    const uu = u - 0.5;
    const swirl = Math.sin(v * 3.4 + seed) * 0.02;
    // bowed across u so the ribbon still has area when seen edge-on
    const bow = Math.sin(u * Math.PI) * w * 0.35;
    out.set(uu * w + swirl, v * WISP_H, bow + Math.cos(v * 2.6 + seed) * 0.012 * v);
  });
}

function Steam() {
  const reduced = usePrefersReducedMotion();
  const wisps = useRef<(THREE.Mesh | null)[]>([]);

  const geometries = useMemo(() => [wispGeometry(0), wispGeometry(2.1)], []);

  const mats = useMemo(() => {
    const map = steamWisp();
    return Array.from({ length: WISP_COUNT }, () => {
      const m = new THREE.MeshBasicMaterial({
        map,
        color: "#ffffff",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      return m;
    });
  }, []);

  useEffect(
    () => () => {
      for (const g of geometries) g.dispose();
      for (const m of mats) m.dispose();
    },
    [geometries, mats],
  );

  /**
   * The only per-frame writes are three transforms and three opacities.
   * No React state, no allocation, no material recompilation (opacity on an
   * already-transparent material does not invalidate the program).
   */
  const settled = useRef(false);

  useFrame(({ clock }) => {
    // Reduced motion: pose the wisps once, then do nothing at all.
    if (reduced && settled.current) return;

    for (let i = 0; i < WISP_COUNT; i++) {
      const mesh = wisps.current[i];
      if (!mesh) continue;
      const p = reduced
        ? 0.42
        : (clock.elapsedTime / WISP_PERIOD[i] + WISP_PHASE[i]) % 1;
      const fade = Math.pow(Math.sin(Math.PI * p), 1.35);

      mesh.position.set(
        0.016 * Math.sin(p * 2.4 + i),
        0.008 + 0.075 * p,
        0.013 * Math.sin(p * 1.9 + i * 2),
      );
      mesh.scale.set(0.5 + 1.15 * p, 0.7 + 0.45 * p, 0.5 + 1.15 * p);
      mesh.rotation.y = WISP_YAW[i] + p * 0.7;
      // reached through the mesh rather than the memoised array: this is an
      // imperative render loop, and routing opacity through React state would
      // re-render sixty times a second
      (mesh.material as THREE.MeshBasicMaterial).opacity = PEAK_OPACITY * fade;
    }
    settled.current = true;
  });

  return (
    <group position={[0, COFFEE_Y, 0]}>
      {Array.from({ length: WISP_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            wisps.current[i] = el;
          }}
          geometry={geometries[i % geometries.length]}
          material={mats[i]}
          renderOrder={12}
        />
      ))}
    </group>
  );
}

function Mug() {
  const body = useMemo(
    () =>
      lathe(
        [
          [0, 0],
          [0.03, 0],
          [0.0385, 0.008],
          [0.0405, 0.022],
          [0.0425, 0.082],
          [0.0432, 0.0935],
          [0.0428, 0.096],
          [0.0388, 0.0962],
          [0.0378, 0.088],
          [0.0352, 0.02],
          [0, 0.016],
        ],
        36,
      ),
    [],
  );

  const glaze = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ded3c0",
        roughness: 0.32,
        metalness: 0,
        clearcoat: 0.7,
        clearcoatRoughness: 0.22,
      }),
    [],
  );

  const coffee = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#3a2416",
        roughness: 0.14,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      }),
    [],
  );

  useEffect(
    () => () => {
      body.dispose();
      glaze.dispose();
      coffee.dispose();
    },
    [body, glaze, coffee],
  );

  const ARC = 4.3;

  return (
    <group position={MUG_POS} rotation={[0, -0.55, 0]}>
      <mesh geometry={body} castShadow receiveShadow material={glaze} />
      <mesh position={[0, COFFEE_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} material={coffee}>
        <circleGeometry args={[0.0362, 28]} />
      </mesh>
      {/* handle: partial torus centred on +x, opening back toward the wall */}
      <mesh
        position={[0.0415, 0.056, 0]}
        rotation={[0, 0, -ARC / 2]}
        castShadow
        material={glaze}
      >
        <torusGeometry args={[0.027, 0.0058, 10, 22, ARC]} />
      </mesh>
      <Steam />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* AirPods Pro case                                                    */
/* ------------------------------------------------------------------ */

function EarbudCase() {
  const shell = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#f5f5f2",
        roughness: 0.3,
        metalness: 0,
        clearcoat: 0.65,
        clearcoatRoughness: 0.18,
      }),
    [],
  );

  const seam = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#c3c3bf", roughness: 0.5 }),
    [],
  );

  const led = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d8ded6",
        emissive: new THREE.Color("#8fe6a4"),
        emissiveIntensity: 0.5,
        roughness: 0.3,
      }),
    [],
  );

  useEffect(
    () => () => {
      shell.dispose();
      seam.dispose();
      led.dispose();
    },
    [shell, seam, led],
  );

  const W = 0.0606;
  const D = 0.0217;

  return (
    <group position={[0.36, DESK_SURFACE, 0.135]} rotation={[0, -0.4, 0]}>
      <RoundedBox
        args={[W, 0.0316, D]}
        radius={0.0085}
        smoothness={4}
        position={[0, 0.0158, 0]}
        castShadow
        receiveShadow
        material={shell}
      />
      {/* lid seam — the whole reason it reads as a case and not a pebble */}
      <mesh position={[0, 0.03205, 0]} material={seam}>
        <boxGeometry args={[W - 0.001, 0.0009, D - 0.001]} />
      </mesh>
      <RoundedBox
        args={[W, 0.0128, D]}
        radius={0.006}
        smoothness={4}
        position={[0, 0.0389, 0]}
        castShadow
        material={shell}
      />
      {/* status pinlight, front face */}
      <mesh position={[0, 0.0125, D / 2 + 0.0004]} material={led}>
        <circleGeometry args={[0.0018, 10]} />
      </mesh>
    </group>
  );
}

export function DeskObjects() {
  return (
    <group>
      <Notebook />
      <Mug />
      <EarbudCase />
    </group>
  );
}
