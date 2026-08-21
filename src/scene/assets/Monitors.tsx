import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { materials } from "../materials";
import { monitorChin } from "../textures";
import { photoTexture } from "../photoTextures";
import { parametricGeometry } from "../geometry";

/**
 * HARD CONTRACT — the camera docks onto these exact transforms:
 *   group position [+-0.302, 1.13, -0.18], rotation.y = 0 (flat side-by-side)
 *   screen plane 0.59 x 0.34 at local z = 0.017
 * Bezels, housing, arms and dressing are built around those numbers.
 */

const MON_X = 0.302; // plates touch at x=0: side-by-side, no gap
const MON_Y = 1.13;
const MON_Z = -0.18;
const TILT = 0; // flat side-by-side per Carlos — no inward V

const SCREEN_W = 0.59;
const SCREEN_H = 0.34;
const SCREEN_Z = 0.017;

// front plate: 6 mm side/top border, 22 mm chin
const PLATE_W = 0.602;
const PLATE_H = 0.368;
const PLATE_CY = -0.008;
const CHIN_Y = PLATE_CY - PLATE_H / 2 + 0.011;

const VESA_Z = -0.062;

// arm hardware clamps just behind the desk's rear edge
const ARM_BASE_X = 0.4;
const ARM_BASE_Z = -0.443;

/** Logitech Brio: rounded bar, centred glass lens, clip tucked behind. */
function Webcam() {
  const M = materials();
  const lens = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#05070c",
        roughness: 0.04,
        metalness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.4,
      }),
    [],
  );

  return (
    <group position={[0, 0.199, -0.002]}>
      <RoundedBox
        args={[0.094, 0.027, 0.031]}
        radius={0.009}
        smoothness={3}
        castShadow
        material={M.deviceBlack}
      />
      {/* lens barrel + glass */}
      <mesh position={[0, 0, 0.0138]} rotation={[Math.PI / 2, 0, 0]} material={M.graphiteDark}>
        <cylinderGeometry args={[0.0092, 0.0092, 0.005, 20]} />
      </mesh>
      <mesh position={[0, 0, 0.0166]} rotation={[Math.PI / 2, 0, 0]} material={lens}>
        <cylinderGeometry args={[0.0072, 0.0078, 0.002, 20]} />
      </mesh>
      {/* mic pinholes */}
      {[-0.03, 0.03].map((x) => (
        <mesh key={x} position={[x, 0, 0.0152]} rotation={[Math.PI / 2, 0, 0]} material={M.graphiteDark}>
          <cylinderGeometry args={[0.0022, 0.0022, 0.002, 8]} />
        </mesh>
      ))}
      {/* clip foot hooking behind the panel */}
      <mesh position={[0, -0.015, -0.017]} rotation={[0.32, 0, 0]} castShadow material={M.deviceBlack}>
        <boxGeometry args={[0.052, 0.034, 0.004]} />
      </mesh>
    </group>
  );
}

/**
 * "DO IT FOR HER" memo taped under the chin. Built as a lightly curled sheet
 * so it catches the window light along one edge instead of reading as a decal.
 */
function Memo() {
  const M = materials();
  const tex = useMemo(() => photoTexture("/textures/memo.jpg"), []);
  const paper = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.92,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    [tex],
  );

  const sheet = useMemo(
    () =>
      parametricGeometry(14, 10, (u, v, out) => {
        const w = 0.118;
        const h = 0.078;
        const x = (u - 0.5) * w;
        const y = (0.5 - v) * h;
        // curls away from the bezel toward the bottom, with a slight cross-bow
        const curl = Math.pow(v, 2.1) * 0.016;
        const bow = Math.cos((u - 0.5) * Math.PI) * 0.0035 * v;
        out.set(x, y, curl + bow);
      }),
    [],
  );

  return (
    <group position={[0.072, -0.229, 0.0176]} rotation={[0, 0, -0.075]}>
      <mesh geometry={sheet} material={paper} castShadow />
      {/* clear tape strip across the top edge */}
      <mesh position={[0, 0.0355, 0.0012]} rotation={[0, 0, 0.05]} material={M.glassTape}>
        <planeGeometry args={[0.034, 0.016]} />
      </mesh>
    </group>
  );
}

function Panel({ side }: { side: 1 | -1 }) {
  const M = materials();
  const chinTex = useMemo(() => monitorChin(), []);
  const chinMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: chinTex, transparent: true, opacity: 0.9 }),
    [chinTex],
  );
  const qcDot = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#63c15a", roughness: 0.35, metalness: 0 }),
    [],
  );

  const tilt = -side * TILT;

  return (
    <group position={[side * MON_X, MON_Y, MON_Z]} rotation={[0, tilt, 0]}>
      {/* rear housing — thin at the edges with a central electronics bulge */}
      <RoundedBox
        args={[0.596, 0.362, 0.042]}
        radius={0.006}
        smoothness={3}
        position={[0, PLATE_CY, -0.0145]}
        castShadow
        receiveShadow
        material={M.deviceBlack}
      />
      <RoundedBox
        args={[0.3, 0.2, 0.032]}
        radius={0.008}
        smoothness={3}
        position={[0, -0.024, -0.047]}
        castShadow
        material={M.deviceBlack}
      />
      {/* VESA boss */}
      <mesh position={[0, PLATE_CY, VESA_Z]} material={M.graphiteDark}>
        <boxGeometry args={[0.104, 0.104, 0.014]} />
      </mesh>

      {/* matte front bezel — corners softened, near-borderless on three sides */}
      <RoundedBox
        args={[PLATE_W, PLATE_H, 0.01]}
        radius={0.004}
        smoothness={3}
        position={[0, PLATE_CY, 0.0115]}
        castShadow
        material={M.deviceBlackSoft}
      />

      {/* ---- CONTRACT: screen plane, do not move ---- */}
      <mesh position={[0, 0, SCREEN_Z]} material={M.screenGlass}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
      </mesh>

      {/* chin dressing */}
      <mesh position={[0, CHIN_Y, 0.0168]} material={chinMat}>
        <planeGeometry args={[0.026, 0.013]} />
      </mesh>
      <mesh position={[-PLATE_W / 2 + 0.017, CHIN_Y - 0.001, 0.0169]} material={qcDot}>
        <circleGeometry args={[0.0034, 12]} />
      </mesh>
      {/* joystick nub under the chin */}
      <mesh position={[0, PLATE_CY - PLATE_H / 2 - 0.004, -0.008]} material={M.graphiteDark}>
        <cylinderGeometry args={[0.005, 0.005, 0.012, 10]} />
      </mesh>

      {side === -1 && <Webcam />}
      {side === -1 && <Memo />}
    </group>
  );
}

/**
 * Ergonomic arm: rear clamp on the desk's back edge, a column, and a single
 * extension reaching forward and inward to the VESA boss. No cables — Carlos
 * wants this desk clean.
 */
function Arm({ side }: { side: 1 | -1 }) {
  const M = materials();
  const baseX = side * ARM_BASE_X;
  const baseZ = ARM_BASE_Z;

  const { len, rotY, midX, midZ, mountX, mountZ, tilt } = useMemo(() => {
    const t = -side * TILT;
    const mx = side * MON_X + VESA_Z * Math.sin(t);
    const mz = MON_Z + VESA_Z * Math.cos(t);
    const dx = mx - baseX;
    const dz = mz - baseZ;
    return {
      len: Math.hypot(dx, dz),
      rotY: -Math.atan2(dz, dx),
      midX: (baseX + mx) / 2,
      midZ: (baseZ + mz) / 2,
      mountX: mx,
      mountZ: mz,
      tilt: t,
    };
  }, [side, baseX, baseZ]);

  return (
    <group>
      {/* C-clamp gripping the desk's rear edge */}
      <mesh position={[baseX, 0.7655, -0.4]} castShadow material={M.armWhite}>
        <boxGeometry args={[0.062, 0.014, 0.08]} />
      </mesh>
      <mesh position={[baseX, 0.712, -0.4415]} castShadow material={M.armWhite}>
        <boxGeometry args={[0.054, 0.135, 0.028]} />
      </mesh>
      <mesh position={[baseX, 0.6575, -0.4]} castShadow material={M.armWhite}>
        <boxGeometry args={[0.058, 0.014, 0.062]} />
      </mesh>
      <mesh position={[baseX, 0.669, -0.398]} material={M.graphiteDark}>
        <cylinderGeometry args={[0.011, 0.011, 0.022, 12]} />
      </mesh>

      {/* column */}
      <mesh position={[baseX, 1.0, baseZ]} castShadow material={M.armWhite}>
        <cylinderGeometry args={[0.0195, 0.021, 0.48, 20]} />
      </mesh>
      <mesh position={[baseX, 1.243, baseZ]} material={M.armWhite}>
        <sphereGeometry args={[0.0205, 16, 10]} />
      </mesh>
      {/* pivot collar at the extension height */}
      <mesh position={[baseX, MON_Y, baseZ]} castShadow material={M.armWhite}>
        <cylinderGeometry args={[0.027, 0.027, 0.052, 20]} />
      </mesh>

      {/* extension boom, tapering toward the head */}
      <group position={[midX, MON_Y, midZ]} rotation={[0, rotY, 0]}>
        <mesh castShadow material={M.armWhite}>
          <boxGeometry args={[len, 0.036, 0.05]} />
        </mesh>
        <mesh position={[0, 0.022, 0]} material={M.armWhite}>
          <boxGeometry args={[len - 0.02, 0.008, 0.038]} />
        </mesh>
      </group>

      {/* tilt head, squared up with the panel */}
      <group position={[mountX, MON_Y, mountZ]} rotation={[0, tilt, 0]}>
        <mesh position={[0, 0, -0.026]} castShadow material={M.armWhite}>
          <cylinderGeometry args={[0.022, 0.022, 0.05, 16]} />
        </mesh>
        <mesh position={[0, 0, -0.008]} castShadow material={M.armWhite}>
          <boxGeometry args={[0.088, 0.088, 0.014]} />
        </mesh>
      </group>
    </group>
  );
}

export function Monitors() {
  return (
    <group>
      <Arm side={-1} />
      <Arm side={1} />
      <Panel side={-1} />
      <Panel side={1} />
    </group>
  );
}
