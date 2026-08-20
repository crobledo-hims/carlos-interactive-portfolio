import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { materials } from "../materials";
import { controlStrip } from "../textures";

/**
 * Secretlab MAGNUS Pro in white. The top's position (y 0.74, 0.035 thick ->
 * 0.7575 surface) and 1.7 x 0.75 footprint are fixed by the camera contract;
 * everything below it is free.
 */

const TOP_Y = 0.74;
const TOP_THICK = 0.035;
const TOP_Z = -0.05;
export const DESK_SURFACE = TOP_Y + TOP_THICK / 2; // 0.7575
const FRONT_EDGE = TOP_Z + 0.375;
const BACK_EDGE = TOP_Z - 0.375;

/** The integrated height controller: dark glass inlay with a lit readout. */
function ControlStrip() {
  const M = materials();
  const face = useMemo(() => {
    const tex = controlStrip();
    return new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 1.25,
      roughness: 0.12,
      metalness: 0.1,
      toneMapped: true,
    });
  }, []);

  return (
    <group position={[0.44, 0.7375, FRONT_EDGE]}>
      {/* recessed glass bed */}
      <mesh position={[0, 0, -0.006]} material={M.glossBlack}>
        <boxGeometry args={[0.312, 0.028, 0.012]} />
      </mesh>
      <mesh position={[0, 0, 0.0012]} material={face}>
        <planeGeometry args={[0.3, 0.0242]} />
      </mesh>
      {/* hairline chrome surround */}
      <mesh position={[0, 0, -0.0005]} material={M.aluminiumPolished}>
        <boxGeometry args={[0.318, 0.032, 0.006]} />
      </mesh>
    </group>
  );
}

function Leg({ x }: { x: number }) {
  const M = materials();
  return (
    <group position={[x, 0, TOP_Z]}>
      {/* upper stage, bolted under the top */}
      <RoundedBox
        args={[0.094, 0.443, 0.094]}
        radius={0.008}
        smoothness={3}
        position={[0, 0.5005, 0]}
        castShadow
        receiveShadow
        material={M.deskSteelSide}
      />
      {/* lower telescoping stage */}
      <RoundedBox
        args={[0.076, 0.31, 0.076]}
        radius={0.007}
        smoothness={3}
        position={[0, 0.195, 0]}
        castShadow
        receiveShadow
        material={M.trimWhite}
      />
      {/* seam collar between stages */}
      <mesh position={[0, 0.3455, 0]} material={M.deskSteelSide}>
        <boxGeometry args={[0.099, 0.014, 0.099]} />
      </mesh>
      {/* long foot with chamfered ends */}
      <RoundedBox
        args={[0.082, 0.044, 0.64]}
        radius={0.014}
        smoothness={3}
        position={[0, 0.033, 0]}
        castShadow
        receiveShadow
        material={M.deskSteelSide}
      />
      {[-0.27, 0.27].map((z) => (
        <mesh key={z} position={[0, 0.007, z]} material={M.deviceBlackSoft}>
          <cylinderGeometry args={[0.017, 0.019, 0.014, 12]} />
        </mesh>
      ))}
    </group>
  );
}


/** MAGPAD: leatherette mat over the left ~60% of the top. */
function DeskMat() {
  const M = materials();
  return (
    <mesh position={[-0.3, DESK_SURFACE + 0.002, 0.055]} receiveShadow material={M.matSurface}>
      <boxGeometry args={[1.0, 0.004, 0.42]} />
    </mesh>
  );
}

export function Desk() {
  const M = materials();
  return (
    <group>
      <RoundedBox
        args={[1.7, TOP_THICK, 0.75]}
        radius={0.006}
        smoothness={3}
        position={[0, TOP_Y, TOP_Z]}
        castShadow
        receiveShadow
        material={M.deskSteel}
      />
      {/* underside frame beam tying the columns together */}
      <mesh position={[0, 0.6885, TOP_Z]} castShadow material={M.deskSteelSide}>
        <boxGeometry args={[1.22, 0.058, 0.1]} />
      </mesh>
      <mesh position={[0, 0.712, BACK_EDGE + 0.075]} material={M.deskSteelSide}>
        <boxGeometry args={[1.5, 0.018, 0.06]} />
      </mesh>

      <Leg x={-0.7} />
      <Leg x={0.7} />
      <ControlStrip />
      <DeskMat />
    </group>
  );
}
