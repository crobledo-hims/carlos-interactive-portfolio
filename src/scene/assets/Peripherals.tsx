import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { materials } from "../materials";
import { dockFront, laptopLid, logiStrip, mouseAlbedo, mouseRoughness } from "../textures";
import {
  bell,
  keycapGeometry,
  mergeParts,
  parametricGeometry,
  profile,
  type ControlPoint,
} from "../geometry";
import { DESK_SURFACE } from "./Desk";

const MAT_TOP = DESK_SURFACE + 0.004;

/* ------------------------------------------------------------------ */
/* MX Mechanical Mini — 75%, real keycaps rather than a painted plate   */
/* ------------------------------------------------------------------ */

type KeySpec = [widthUnits: number, tone: number]; // tone -1 = spacer

const UNIT = 0.018;
const KEY_GAP = 0.0026;
const FIELD_U = 16;

const a: KeySpec = [1, 0];
const m: KeySpec = [1, 1];

const ROWS: KeySpec[][] = [
  [[1, 2], [0.4, -1], m, m, m, m, [0.2, -1], m, m, m, m, [0.2, -1], m, m, m, m, [0.2, -1], m, m],
  [a, a, a, a, a, a, a, a, a, a, a, a, a, [2, 1], m],
  [[1.5, 1], a, a, a, a, a, a, a, a, a, a, a, a, [1.5, 1], m],
  [[1.75, 1], a, a, a, a, a, a, a, a, a, a, a, [2.25, 1], m],
  [[2.25, 1], a, a, a, a, a, a, a, a, a, a, [1.75, 1], m, m],
  [[1.25, 1], [1.25, 1], [1.25, 1], [6.25, 0], [1.25, 1], [1.25, 1], m, m, m, [0.5, -1]],
];

const TONE_COLOR = ["#e9e8e3", "#bcbcb8", "#9a9a9c"];

function useKeyField(): THREE.BufferGeometry {
  return useMemo(() => {
    const cap = keycapGeometry();
    const parts: { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    const rowDepth = UNIT;
    const fieldW = FIELD_U * UNIT;

    ROWS.forEach((row, r) => {
      const z = -((ROWS.length * rowDepth) / 2) + rowDepth / 2 + r * rowDepth;
      let cursor = 0;
      for (const [w, tone] of row) {
        if (tone >= 0) {
          const x = -fieldW / 2 + (cursor + w / 2) * UNIT;
          const kw = w * UNIT - KEY_GAP;
          const kd = UNIT - KEY_GAP;
          const matrix = new THREE.Matrix4()
            .makeScale(kw, 0.0078, kd)
            .setPosition(x, 0, z);
          parts.push({ geometry: cap, matrix, color: new THREE.Color(TONE_COLOR[tone]) });
        }
        cursor += w;
      }
    });

    const merged = mergeParts(parts, true);
    cap.dispose();
    return merged;
  }, []);
}

function Keyboard() {
  const M = materials();
  const keys = useKeyField();
  const capMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.58,
        metalness: 0.03,
      }),
    [],
  );
  const logo = useMemo(() => {
    const tex = logiStrip();
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  }, []);

  return (
    <group position={[-0.17, MAT_TOP, 0.11]} rotation={[-0.032, 0.025, 0]}>
      {/* body */}
      <RoundedBox
        args={[0.318, 0.013, 0.138]}
        radius={0.004}
        smoothness={3}
        position={[0, 0.0065, 0]}
        castShadow
        receiveShadow
        material={M.deviceBlackSoft}
      />
      {/* thin aluminium top plate the switches poke through */}
      <mesh position={[0, 0.0145, 0]} receiveShadow material={M.armWhite}>
        <boxGeometry args={[0.312, 0.004, 0.132]} />
      </mesh>
      {/* recessed dark field behind the caps so gaps read as shadow */}
      <mesh position={[0, 0.0162, 0.001]} material={M.graphiteDark}>
        <boxGeometry args={[0.296, 0.0012, 0.115]} />
      </mesh>
      <mesh geometry={keys} material={capMat} position={[0, 0.0166, 0.001]} castShadow />
      {/* tiny wordmark on the back edge */}
      <mesh position={[0.118, 0.0167, -0.0635]} rotation={[-Math.PI / 2, 0, 0]} material={logo}>
        <planeGeometry args={[0.026, 0.0032]} />
      </mesh>
    </group>
  );
}

/** Razer wrist rest: soft rounded leatherette bar, stitched edge, no logo. */
function WristRest() {
  const M = materials();
  return (
    <RoundedBox
      args={[0.324, 0.021, 0.06]}
      radius={0.0085}
      smoothness={4}
      position={[-0.17, MAT_TOP + 0.0105, 0.214]}
      rotation={[0, 0.025, 0]}
      castShadow
      receiveShadow
      material={M.leatherette}
    />
  );
}

/* ------------------------------------------------------------------ */
/* MX Master 3S — lofted ergonomic shell                                */
/* ------------------------------------------------------------------ */

const MOUSE_LEN = 0.126;

const MOUSE_W: ControlPoint[] = [
  [0.0, 0.008],
  [0.06, 0.026],
  [0.14, 0.034],
  [0.3, 0.0385],
  [0.5, 0.0385],
  [0.66, 0.035],
  [0.82, 0.028],
  [0.93, 0.018],
  [1.0, 0.004],
];

const MOUSE_H: ControlPoint[] = [
  [0.0, 0.009],
  [0.05, 0.027],
  [0.14, 0.042],
  [0.28, 0.0505],
  [0.4, 0.0495],
  [0.55, 0.0442],
  [0.7, 0.0362],
  [0.85, 0.026],
  [0.95, 0.016],
  [1.0, 0.006],
];

function Mouse() {
  const M = materials();

  const shell = useMemo(
    () =>
      parametricGeometry(
        40,
        30,
        (u, v, out) => {
          const phi = u * Math.PI * 2;
          const c = Math.cos(phi);
          const s = Math.sin(phi);
          const w = profile(MOUSE_W, v);
          const h = profile(MOUSE_H, v);

          let x = w * Math.sign(c) * Math.pow(Math.abs(c), 0.72);
          const yr = Math.sign(s) * Math.pow(Math.abs(s), 0.78);
          let y = yr > 0 ? h * yr : 0.0015 * (1 + yr);

          // thumb shelf: widen the left flank low down, dish the shell above it
          const shelf = bell(v, 0.42, 0.3) * Math.pow(Math.max(0, -c), 1.5);
          x -= 0.013 * shelf * bell(yr, 0.18, 0.42);
          y -= 0.0062 * shelf * bell(yr, 0.72, 0.28);

          out.set(x, y, 0.063 - MOUSE_LEN * v);
        },
        true,
      ),
    [],
  );

  const shellMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: mouseAlbedo(),
        roughnessMap: mouseRoughness(),
        roughness: 1,
        metalness: 0.06,
      }),
    [],
  );

  const wheelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#7c8087",
        roughness: 0.3,
        metalness: 0.92,
      }),
    [],
  );

  return (
    <group position={[0.235, DESK_SURFACE + 0.0005, 0.115]} rotation={[0, -0.07, 0]}>
      <mesh geometry={shell} material={shellMat} castShadow receiveShadow />
      {/* magnetic scroll wheel, inset just proud of the shell */}
      <mesh position={[0, 0.0345, -0.014]} rotation={[0, 0, Math.PI / 2]} material={wheelMat} castShadow>
        <cylinderGeometry args={[0.0118, 0.0118, 0.0062, 24]} />
      </mesh>
      <mesh position={[0, 0.0345, -0.014]} rotation={[0, 0, Math.PI / 2]} material={M.graphiteDark}>
        <cylinderGeometry args={[0.0122, 0.0122, 0.0034, 24]} />
      </mesh>
      {/* thumb wheel */}
      <mesh position={[-0.0405, 0.0195, 0.006]} material={wheelMat}>
        <cylinderGeometry args={[0.0062, 0.0062, 0.004, 16]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* MacBook Pro 14", closed                                              */
/* ------------------------------------------------------------------ */

function Laptop() {
  const M = materials();
  const lid = useMemo(() => {
    const tex = laptopLid();
    return new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      roughness: 0.3,
      metalness: 0.4,
    });
  }, []);

  const W = 0.3124;
  const D = 0.2215;

  return (
    <group position={[-0.6, MAT_TOP, 0.015]} rotation={[0, 0.3, 0]}>
      {[
        [-0.13, -0.088],
        [0.13, -0.088],
        [-0.13, 0.088],
        [0.13, 0.088],
      ].map(([fx, fz]) => (
        <mesh key={`${fx},${fz}`} position={[fx, 0.0007, fz]} material={M.deviceBlackSoft}>
          <cylinderGeometry args={[0.009, 0.009, 0.0014, 12]} />
        </mesh>
      ))}
      <RoundedBox
        args={[W, 0.0088, D]}
        radius={0.0035}
        smoothness={3}
        position={[0, 0.0058, 0]}
        castShadow
        receiveShadow
        material={M.laptopShell}
      />
      {/* clamshell gap */}
      <mesh position={[0, 0.0107, 0]} material={M.graphiteDark}>
        <boxGeometry args={[W - 0.004, 0.0016, D - 0.004]} />
      </mesh>
      <RoundedBox
        args={[W, 0.007, D]}
        radius={0.0028}
        smoothness={3}
        position={[0, 0.0148, 0]}
        castShadow
        receiveShadow
        material={M.laptopShell}
      />
      <mesh position={[0, 0.0184, 0]} rotation={[-Math.PI / 2, 0, 0]} material={lid}>
        <planeGeometry args={[0.2, 0.15]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* WAVLINK dock                                                         */
/* ------------------------------------------------------------------ */

function Dock() {
  const M = materials();
  const front = useMemo(() => {
    const tex = dockFront();
    return new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.35,
      roughness: 0.62,
      metalness: 0.15,
    });
  }, []);

  return (
    <group position={[-0.71, DESK_SURFACE, -0.352]} rotation={[0, 0.05, 0]}>
      <RoundedBox
        args={[0.212, 0.048, 0.078]}
        radius={0.005}
        smoothness={3}
        position={[0, 0.024, 0]}
        castShadow
        receiveShadow
        material={M.deviceBlack}
      />
      <mesh position={[0, 0.024, 0.0396]} material={front}>
        <planeGeometry args={[0.206, 0.0455]} />
      </mesh>
      {/* rubber feet keep it off the steel */}
      {[-0.085, 0.085].map((x) => (
        <mesh key={x} position={[x, 0.0012, 0]} material={M.deviceBlackSoft}>
          <boxGeometry args={[0.02, 0.0024, 0.06]} />
        </mesh>
      ))}
    </group>
  );
}

export function Peripherals() {
  return (
    <group>
      <Keyboard />
      <WristRest />
      <Mouse />
      <Laptop />
      <Dock />
    </group>
  );
}
