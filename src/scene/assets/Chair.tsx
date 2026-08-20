import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { materials } from "../materials";
import {
  panelOutline,
  parametricGeometry,
  profile,
  tubeFromPoints,
  type ControlPoint,
  type SurfaceFn,
} from "../geometry";

/**
 * Herman Miller Aeron, graphite. The back is the whole silhouette of the
 * chair, so it is a genuine lofted surface — waisted plan, horizontal wrap
 * around the sitter, and an S-shaped lumbar curve in section — with a tube
 * traced around its own boundary for the frame. Boxes would kill it.
 */

const BACK_H = 0.6;
const WRAP_R = 0.42;

const BACK_HALF_W: ControlPoint[] = [
  [0.0, 0.145],
  [0.05, 0.183],
  [0.2, 0.19],
  [0.4, 0.184],
  [0.62, 0.204],
  [0.82, 0.222],
  [0.93, 0.218],
  [0.985, 0.185],
  [1.0, 0.105],
];

/** Section curve: pushes forward at the lumbar, leans away at the shoulders. */
const BACK_SECTION: ControlPoint[] = [
  [0.0, 0.024],
  [0.22, -0.03],
  [0.5, -0.004],
  [0.78, 0.024],
  [1.0, 0.056],
];

function backSurface(inset = 0, zOffset = 0): SurfaceFn {
  return (u, v, out) => {
    const uu = u * 2 - 1;
    const hw = Math.max(0.001, profile(BACK_HALF_W, v) - inset);
    const a = (uu * hw) / WRAP_R;
    out.set(
      WRAP_R * Math.sin(a),
      v * BACK_H,
      WRAP_R * (1 - Math.cos(a)) + profile(BACK_SECTION, v) + zOffset,
    );
  };
}

const SEAT_HALF_W: ControlPoint[] = [
  [0.0, 0.175],
  [0.1, 0.207],
  [0.35, 0.232],
  [0.7, 0.234],
  [0.92, 0.212],
  [1.0, 0.168],
];

function seatSurface(inset = 0): SurfaceFn {
  return (u, v, out) => {
    const uu = u * 2 - 1;
    const hw = Math.max(0.001, profile(SEAT_HALF_W, v) - inset);
    // dished across, hollowed front-to-back, waterfall lip at the leading edge
    const waterfall = 0.034 * Math.pow(Math.max(0, (0.13 - v) / 0.13), 2);
    const y = -0.021 * uu * uu - 0.018 * Math.pow(Math.sin(Math.PI * v), 1.3) - waterfall;
    out.set(uu * hw, y, -0.225 + 0.45 * v);
  };
}

function Casters() {
  const M = materials();
  const felt = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#5c5c60", roughness: 0.95 }),
    [],
  );
  return (
    <group position={[0.312, 0, 0]}>
      <mesh position={[0, 0.076, 0]} castShadow material={M.graphite}>
        <cylinderGeometry args={[0.011, 0.011, 0.05, 12]} />
      </mesh>
      <mesh position={[0, 0.05, 0.004]} castShadow material={M.graphite}>
        <boxGeometry args={[0.028, 0.05, 0.056]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh
            position={[0, 0.0268, s * 0.018]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
            material={M.graphiteDark}
          >
            <cylinderGeometry args={[0.0268, 0.0268, 0.012, 18]} />
          </mesh>
          <mesh position={[0, 0.0268, s * 0.0245]} rotation={[Math.PI / 2, 0, 0]} material={felt}>
            <cylinderGeometry args={[0.0242, 0.0242, 0.0022, 18]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Base() {
  const M = materials();
  const armGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.05, 0.058);
    s.lineTo(0.2, 0.041);
    s.lineTo(0.3, 0.026);
    s.lineTo(0.33, 0.021);
    s.lineTo(0.33, -0.021);
    s.lineTo(0.3, -0.026);
    s.lineTo(0.2, -0.041);
    s.lineTo(0.05, -0.058);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, {
      depth: 0.03,
      bevelEnabled: true,
      bevelSize: 0.005,
      bevelThickness: 0.005,
      bevelSegments: 2,
      curveSegments: 2,
    });
  }, []);

  const angles = useMemo(() => [0, 72, 144, 216, 288].map((d) => (d * Math.PI) / 180 + 0.35), []);

  return (
    <group>
      {angles.map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <mesh
            geometry={armGeo}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.056, 0]}
            castShadow
            receiveShadow
            material={M.graphite}
          />
          <Casters />
        </group>
      ))}
      {/* hub */}
      <mesh position={[0, 0.075, 0]} castShadow material={M.graphite}>
        <cylinderGeometry args={[0.062, 0.072, 0.062, 24]} />
      </mesh>
      <mesh position={[0, 0.108, 0]} material={M.graphiteDark}>
        <cylinderGeometry args={[0.042, 0.062, 0.02, 24]} />
      </mesh>
    </group>
  );
}

function GasLift() {
  const M = materials();
  return (
    <group>
      <mesh position={[0, 0.16, 0]} castShadow material={M.graphiteDark}>
        <cylinderGeometry args={[0.031, 0.034, 0.13, 20]} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow material={M.aluminiumPolished}>
        <cylinderGeometry args={[0.0235, 0.0235, 0.2, 20]} />
      </mesh>
      <mesh position={[0, 0.398, 0]} material={M.graphiteDark}>
        <cylinderGeometry args={[0.036, 0.03, 0.036, 20]} />
      </mesh>
    </group>
  );
}

function Armrest({ side }: { side: -1 | 1 }) {
  const M = materials();
  return (
    <group position={[side * 0.238, 0, 0.015]}>
      {/* height-adjustable stalk */}
      <mesh position={[0, 0.505, 0]} castShadow material={M.graphite}>
        <boxGeometry args={[0.03, 0.115, 0.04]} />
      </mesh>
      <mesh position={[0, 0.585, -0.005]} rotation={[0, 0, side * 0.06]} castShadow material={M.graphite}>
        <boxGeometry args={[0.026, 0.075, 0.034]} />
      </mesh>
      <mesh position={[0, 0.624, -0.012]} castShadow material={M.graphiteDark}>
        <boxGeometry args={[0.046, 0.014, 0.09]} />
      </mesh>
      {/* soft pad, angled very slightly inward */}
      <RoundedBox
        args={[0.058, 0.023, 0.238]}
        radius={0.0095}
        smoothness={4}
        position={[0, 0.642, -0.018]}
        rotation={[0, side * 0.05, 0]}
        castShadow
        material={M.deviceBlackSoft}
      />
    </group>
  );
}

function Back() {
  const M = materials();

  const panel = useMemo(() => parametricGeometry(34, 40, backSurface(0.008, 0), false), []);
  const frame = useMemo(
    () => tubeFromPoints(panelOutline(backSurface(0, 0), 26, 12), 0.016, 190, 8, true),
    [],
  );
  const lumbar = useMemo(
    () =>
      parametricGeometry(24, 6, (u, v, out) => {
        backSurface(0.028, -0.016)(u, 0.13 + v * 0.16, out);
      }),
    [],
  );

  return (
    <group position={[0, 0.462, 0.222]} rotation={[0.19, 0, 0]}>
      <mesh geometry={panel} material={M.pellicle} castShadow receiveShadow />
      <mesh geometry={frame} material={M.graphite} castShadow receiveShadow />
      <mesh geometry={lumbar} material={M.deviceBlackSoft} castShadow />
      {/* posts tying the back frame into the tilt mechanism */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * 0.155, 0.012, 0.02]}
          rotation={[-0.19, 0, 0]}
          castShadow
          material={M.graphite}
        >
          <boxGeometry args={[0.034, 0.09, 0.05]} />
        </mesh>
      ))}
    </group>
  );
}

function Seat() {
  const M = materials();
  const panel = useMemo(() => parametricGeometry(28, 26, seatSurface(0.009), false), []);
  const frame = useMemo(
    () => tubeFromPoints(panelOutline(seatSurface(0), 20, 12), 0.017, 150, 8, true),
    [],
  );

  return (
    <group position={[0, 0.472, 0.01]}>
      <mesh geometry={panel} material={M.pellicle} castShadow receiveShadow />
      <mesh geometry={frame} material={M.graphite} castShadow receiveShadow />
    </group>
  );
}

export function AeronChair() {
  const M = materials();
  return (
    <group position={[0, 0, 0.85]} rotation={[0, 0.07, 0]}>
      <Base />
      <GasLift />
      {/* tilt mechanism housing */}
      <RoundedBox
        args={[0.2, 0.078, 0.28]}
        radius={0.02}
        smoothness={3}
        position={[0, 0.428, 0.01]}
        castShadow
        material={M.graphite}
      />
      {/* tilt tension knob + paddle */}
      <mesh position={[0, 0.412, -0.145]} rotation={[Math.PI / 2, 0, 0]} material={M.graphiteDark}>
        <cylinderGeometry args={[0.021, 0.021, 0.03, 16]} />
      </mesh>
      <mesh position={[0.16, 0.418, 0.02]} rotation={[0, 0, 0.1]} material={M.graphiteDark}>
        <boxGeometry args={[0.12, 0.012, 0.026]} />
      </mesh>

      <Seat />
      <Back />
      <Armrest side={-1} />
      <Armrest side={1} />
    </group>
  );
}
