import { useMemo } from "react";
import * as THREE from "three";
import { materials } from "../materials";
import { skyGlow } from "../textures";

/**
 * The shell: LVP plank floor, greige walls, white baseboards, and the right
 * wall built as four solid slabs around a real window opening. Because those
 * slabs cast shadows, the sun only enters through the opening — the shutter
 * louvers then chop that patch into the louver bands that rake the floor and
 * the left wall. That is the signature of this room, so the geometry here is
 * lighting hardware as much as it is set dressing.
 */

const WALL_TOP = 3.4;
const WALL_RIGHT_X = 2.3; // inner face
const WALL_THICK = 0.12;
const WALL_LEFT_X = -2.4;
const WALL_BACK_Z = -1.2;

const WIN = { y0: 0.86, y1: 2.32, z0: -0.35, z1: 0.95 };
const WIN_H = WIN.y1 - WIN.y0;
const WIN_W = WIN.z1 - WIN.z0;
const WIN_CZ = (WIN.z0 + WIN.z1) / 2;
const WIN_CY = (WIN.y0 + WIN.y1) / 2;

const SIDE_Z0 = -2.4;
const SIDE_Z1 = 4.0;
const SIDE_LEN = SIDE_Z1 - SIDE_Z0;
const SIDE_CZ = (SIDE_Z0 + SIDE_Z1) / 2;

type Box = { pos: [number, number, number]; size: [number, number, number] };

function Baseboard({
  length,
  position,
  rotationY = 0,
}: {
  length: number;
  position: [number, number, number];
  rotationY?: number;
}) {
  const M = materials();
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.05, 0]} receiveShadow castShadow material={M.trimWhite}>
        <boxGeometry args={[length, 0.1, 0.017]} />
      </mesh>
      {/* cap bead — reads as a milled profile from across the room */}
      <mesh position={[0, 0.106, -0.002]} receiveShadow material={M.trimWhite}>
        <boxGeometry args={[length, 0.013, 0.022]} />
      </mesh>
      <mesh position={[0, 0.0955, 0.0075]} material={M.trimWhite}>
        <boxGeometry args={[length, 0.006, 0.006]} />
      </mesh>
    </group>
  );
}

function WindowWall() {
  const M = materials();
  const slabs: Box[] = useMemo(
    () => [
      // under the sill
      { pos: [0, WIN.y0 / 2, SIDE_CZ], size: [WALL_THICK, WIN.y0, SIDE_LEN] },
      // above the head
      {
        pos: [0, (WIN.y1 + WALL_TOP) / 2, SIDE_CZ],
        size: [WALL_THICK, WALL_TOP - WIN.y1, SIDE_LEN],
      },
      // returns either side of the opening
      {
        pos: [0, WIN_CY, (SIDE_Z0 + WIN.z0) / 2],
        size: [WALL_THICK, WIN_H, WIN.z0 - SIDE_Z0],
      },
      {
        pos: [0, WIN_CY, (WIN.z1 + SIDE_Z1) / 2],
        size: [WALL_THICK, WIN_H, SIDE_Z1 - WIN.z1],
      },
    ],
    [],
  );

  return (
    <group position={[WALL_RIGHT_X + WALL_THICK / 2, 0, 0]}>
      {slabs.map((s, i) => (
        <mesh key={i} position={s.pos} castShadow receiveShadow material={M.wall}>
          <boxGeometry args={s.size} />
        </mesh>
      ))}
    </group>
  );
}

function WindowTrim() {
  const M = materials();
  const casingW = 0.08;
  const proud = 0.026;
  const x = WALL_RIGHT_X - proud / 2;

  return (
    <group>
      {/* jamb liner inside the reveal */}
      <mesh position={[WALL_RIGHT_X + WALL_THICK / 2, WIN.y1 + 0.005, WIN_CZ]} material={M.trimWhite}>
        <boxGeometry args={[WALL_THICK, 0.012, WIN_W]} />
      </mesh>
      <mesh position={[WALL_RIGHT_X + WALL_THICK / 2, WIN_CY, WIN.z0 - 0.006]} material={M.trimWhite}>
        <boxGeometry args={[WALL_THICK, WIN_H, 0.012]} />
      </mesh>
      <mesh position={[WALL_RIGHT_X + WALL_THICK / 2, WIN_CY, WIN.z1 + 0.006]} material={M.trimWhite}>
        <boxGeometry args={[WALL_THICK, WIN_H, 0.012]} />
      </mesh>

      {/* picture-frame casing on the room side */}
      <mesh position={[x, WIN.y1 + casingW / 2, WIN_CZ]} castShadow material={M.trimWhite}>
        <boxGeometry args={[proud, casingW, WIN_W + casingW * 2]} />
      </mesh>
      <mesh position={[x, WIN_CY, WIN.z0 - casingW / 2]} castShadow material={M.trimWhite}>
        <boxGeometry args={[proud, WIN_H, casingW]} />
      </mesh>
      <mesh position={[x, WIN_CY, WIN.z1 + casingW / 2]} castShadow material={M.trimWhite}>
        <boxGeometry args={[proud, WIN_H, casingW]} />
      </mesh>

      {/* stool + apron */}
      <mesh position={[WALL_RIGHT_X - 0.055, WIN.y0 - 0.016, WIN_CZ]} castShadow material={M.trimWhite}>
        <boxGeometry args={[0.15, 0.028, WIN_W + casingW * 2 + 0.04]} />
      </mesh>
      <mesh position={[x, WIN.y0 - 0.075, WIN_CZ]} castShadow material={M.trimWhite}>
        <boxGeometry args={[proud, 0.09, WIN_W + 0.03]} />
      </mesh>
    </group>
  );
}

/**
 * Plantation shutters, half-open. The louvers are the only thing standing
 * between the sun and the room, so they carry castShadow and are tuned
 * (chord 105 mm, 9 leaves, ~52 degrees) to throw readable bands at ~3 m.
 */
function Shutters() {
  const M = materials();
  const louverMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f6f5f1",
        roughness: 0.55,
        metalness: 0,
        // backlit white timber picks up a little glow on the room side
        emissive: new THREE.Color("#ffeed6"),
        emissiveIntensity: 0.22,
      }),
    [],
  );

  const louvers = useMemo(() => {
    const n = 9;
    const top = WIN.y1 - 0.06;
    const bottom = WIN.y0 + 0.06;
    return Array.from({ length: n }, (_, i) => bottom + ((top - bottom) * i) / (n - 1));
  }, []);

  const stileW = 0.055;
  const frameX = WALL_RIGHT_X + 0.012;

  return (
    <group>
      {/* shutter frame inside the opening */}
      <mesh position={[frameX, WIN.y0 + stileW / 2, WIN_CZ]} castShadow material={M.trimWhite}>
        <boxGeometry args={[0.032, stileW, WIN_W]} />
      </mesh>
      <mesh position={[frameX, WIN.y1 - stileW / 2, WIN_CZ]} castShadow material={M.trimWhite}>
        <boxGeometry args={[0.032, stileW, WIN_W]} />
      </mesh>
      <mesh position={[frameX, WIN_CY, WIN.z0 + stileW / 2]} castShadow material={M.trimWhite}>
        <boxGeometry args={[0.032, WIN_H, stileW]} />
      </mesh>
      <mesh position={[frameX, WIN_CY, WIN.z1 - stileW / 2]} castShadow material={M.trimWhite}>
        <boxGeometry args={[0.032, WIN_H, stileW]} />
      </mesh>
      {/* centre mullion: two panels, like the reference */}
      <mesh position={[frameX, WIN_CY, WIN_CZ]} castShadow material={M.trimWhite}>
        <boxGeometry args={[0.032, WIN_H, 0.04]} />
      </mesh>

      {louvers.map((y) => (
        <mesh
          key={y}
          position={[WALL_RIGHT_X + 0.01, y, WIN_CZ]}
          rotation={[0, 0, 0.9]}
          castShadow
          material={louverMat}
        >
          <boxGeometry args={[0.105, 0.013, WIN_W - 0.1]} />
        </mesh>
      ))}
    </group>
  );
}

export function Room() {
  const M = materials();
  const glow = useMemo(() => skyGlow(), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={M.floor}>
        <planeGeometry args={[10, 10]} />
      </mesh>

      <mesh position={[0, WALL_TOP / 2, WALL_BACK_Z]} receiveShadow material={M.wall}>
        <planeGeometry args={[8, WALL_TOP]} />
      </mesh>

      <mesh
        position={[WALL_LEFT_X, WALL_TOP / 2, SIDE_CZ]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
        material={M.wall}
      >
        <planeGeometry args={[SIDE_LEN, WALL_TOP]} />
      </mesh>

      {/* Ceiling — never in frame, but it stops the key light from spilling
          over the top of the walls and washing out the shadowed side of the
          room. It is a light blocker first and a surface second. */}
      <mesh position={[0, WALL_TOP, SIDE_CZ]} rotation={[Math.PI / 2, 0, 0]} castShadow material={M.trimWhite}>
        <planeGeometry args={[5.2, SIDE_LEN]} />
      </mesh>

      <WindowWall />
      <WindowTrim />
      <Shutters />

      {/* blown-out exterior seen through the louvers */}
      <mesh position={[3.05, 1.6, WIN_CZ]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[3.6, 3.4]} />
        <meshBasicMaterial map={glow} toneMapped={false} />
      </mesh>

      <Baseboard length={4.7} position={[-0.05, 0, WALL_BACK_Z + 0.009]} />
      <Baseboard length={3.9} position={[WALL_LEFT_X + 0.009, 0, 0.75]} rotationY={Math.PI / 2} />
      <Baseboard length={3.9} position={[WALL_RIGHT_X - 0.009, 0, 0.75]} rotationY={-Math.PI / 2} />
    </group>
  );
}
