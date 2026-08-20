const WALL = "#d6d2c9";
const FLOOR = "#7d4e30";
const DESK_WHITE = "#f2f2ef";
const DEVICE_DARK = "#1c1c1e";
const SCREEN = "#0f1420";
const CHAIR_FRAME = "#3a3a3f";
const CHAIR_MESH = "#2b2b30";

// Arm-mounted LG monitor floating above the desk, per Carlos's real setup.
// `memo` adds the "DO IT FOR HER" cutout taped under the bezel (texture pass later).
function Monitor({
  x,
  tilt,
  webcam,
  memo,
}: {
  x: number;
  tilt: number;
  webcam?: boolean;
  memo?: boolean;
}) {
  return (
    <group position={[x, 1.13, -0.18]} rotation={[0, tilt, 0]}>
      {/* arm pole down to the rail */}
      <mesh position={[0, -0.22, -0.04]}>
        <boxGeometry args={[0.035, 0.32, 0.035]} />
        <meshStandardMaterial color="#c9c9c6" />
      </mesh>
      {/* body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.62, 0.37, 0.03]} />
        <meshStandardMaterial color={DEVICE_DARK} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[0.59, 0.34]} />
        <meshStandardMaterial color={SCREEN} emissive="#1a2333" emissiveIntensity={1.2} />
      </mesh>
      {webcam && (
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.08, 0.03, 0.04]} />
          <meshStandardMaterial color="#111113" />
        </mesh>
      )}
      {memo && (
        <mesh position={[0.08, -0.235, 0.01]} rotation={[0, 0, -0.04]}>
          <planeGeometry args={[0.1, 0.065]} />
          <meshStandardMaterial color="#8fc4e8" />
        </mesh>
      )}
    </group>
  );
}

function ShutterWindow() {
  const slats = Array.from({ length: 9 }, (_, i) => 0.95 + i * 0.15);
  return (
    <group position={[2.28, 0, 0.3]}>
      {/* frame */}
      {[
        { pos: [0, 0.86, 0], size: [0.06, 0.08, 1.3] },
        { pos: [0, 2.32, 0], size: [0.06, 0.08, 1.3] },
        { pos: [0, 1.59, -0.65], size: [0.06, 1.54, 0.08] },
        { pos: [0, 1.59, 0.65], size: [0.06, 1.54, 0.08] },
      ].map((f, i) => (
        <mesh key={i} position={f.pos as [number, number, number]}>
          <boxGeometry args={f.size as [number, number, number]} />
          <meshStandardMaterial color="#f5f5f2" />
        </mesh>
      ))}
      {/* louvers — these cast the signature light pattern */}
      {slats.map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[0, 0, 0.55]} castShadow>
          <boxGeometry args={[0.09, 0.015, 1.22]} />
          <meshStandardMaterial color="#f5f5f2" />
        </mesh>
      ))}
    </group>
  );
}

// Herman Miller Aeron, graphite — primitive approximation.
function AeronChair() {
  const armAngles = [0, 72, 144, 216, 288].map((d) => (d * Math.PI) / 180);
  return (
    <group position={[0, 0, 0.85]}>
      {/* star base + casters */}
      {armAngles.map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <mesh position={[0.16, 0.05, 0]}>
            <boxGeometry args={[0.3, 0.035, 0.05]} />
            <meshStandardMaterial color={CHAIR_FRAME} />
          </mesh>
          <mesh position={[0.29, 0.03, 0]}>
            <sphereGeometry args={[0.028, 12, 12]} />
            <meshStandardMaterial color="#232326" />
          </mesh>
        </group>
      ))}
      {/* gas lift */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.34, 12]} />
        <meshStandardMaterial color="#8f8f94" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* seat */}
      <mesh position={[0, 0.47, 0]} castShadow>
        <boxGeometry args={[0.47, 0.055, 0.43]} />
        <meshStandardMaterial color={CHAIR_MESH} />
      </mesh>
      {/* back, tilted slightly */}
      <group position={[0, 0.88, 0.19]} rotation={[0.12, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.46, 0.58, 0.045]} />
          <meshStandardMaterial color={CHAIR_MESH} />
        </mesh>
        {/* lumbar pad */}
        <mesh position={[0, -0.1, 0.035]}>
          <boxGeometry args={[0.3, 0.14, 0.025]} />
          <meshStandardMaterial color="#232326" />
        </mesh>
      </group>
      {/* armrests */}
      {[-0.245, 0.245].map((x) => (
        <group key={x} position={[x, 0, 0.06]}>
          <mesh position={[0, 0.585, 0]}>
            <boxGeometry args={[0.035, 0.18, 0.035]} />
            <meshStandardMaterial color={CHAIR_FRAME} />
          </mesh>
          <mesh position={[0, 0.69, -0.02]}>
            <boxGeometry args={[0.06, 0.028, 0.24]} />
            <meshStandardMaterial color="#232326" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function DeskScene() {
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={FLOOR} roughness={0.7} />
      </mesh>

      {/* back wall */}
      <mesh position={[0, 1.6, -1.2]} receiveShadow>
        <planeGeometry args={[8, 3.2]} />
        <meshStandardMaterial color={WALL} />
      </mesh>

      {/* left wall */}
      <mesh position={[-2.4, 1.6, 0.6]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 3.2]} />
        <meshStandardMaterial color={WALL} />
      </mesh>

      {/* right wall (light passes through; louvers cast the pattern) */}
      <mesh position={[2.3, 1.6, 0.6]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 3.2]} />
        <meshStandardMaterial color={WALL} />
      </mesh>

      <ShutterWindow />

      {/* white Secretlab MAGNUS standing desk */}
      <mesh position={[0, 0.74, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.035, 0.75]} />
        <meshStandardMaterial color={DESK_WHITE} />
      </mesh>
      {/* height-control strip, front-right edge */}
      <group position={[0.45, 0.74, 0.33]}>
        <mesh>
          <boxGeometry args={[0.5, 0.028, 0.012]} />
          <meshStandardMaterial color="#111113" />
        </mesh>
        <mesh position={[-0.14, 0, 0.007]}>
          <planeGeometry args={[0.05, 0.014]} />
          <meshStandardMaterial color="#dfe4ea" emissive="#dfe4ea" emissiveIntensity={0.8} />
        </mesh>
      </group>
      {/* wall-mounted power rail behind the desk */}
      <mesh position={[0, 0.86, -0.42]}>
        <boxGeometry args={[1.5, 0.11, 0.04]} />
        <meshStandardMaterial color="#eeeeeb" />
      </mesh>
      {/* T-legs with feet */}
      {[-0.7, 0.7].map((x) => (
        <group key={x} position={[x, 0, -0.05]}>
          <mesh position={[0, 0.37, 0]}>
            <boxGeometry args={[0.07, 0.74, 0.07]} />
            <meshStandardMaterial color="#e8e8e5" />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.09, 0.04, 0.6]} />
            <meshStandardMaterial color="#e8e8e5" />
          </mesh>
        </group>
      ))}

      <Monitor x={-0.45} tilt={0.18} webcam memo />
      <Monitor x={0.45} tilt={-0.18} />

      {/* white MAGPAD desk mat */}
      <mesh position={[-0.1, 0.762, 0.1]}>
        <boxGeometry args={[0.9, 0.005, 0.38]} />
        <meshStandardMaterial color="#f8f8f6" />
      </mesh>

      {/* closed MacBook with hims sticker (texture pass) */}
      <mesh position={[-0.52, 0.772, 0.06]} rotation={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.31, 0.015, 0.22]} />
        <meshStandardMaterial color="#cfd2d6" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* WAVLINK dock, back-left */}
      <mesh position={[-0.45, 0.785, -0.3]} castShadow>
        <boxGeometry args={[0.26, 0.045, 0.09]} />
        <meshStandardMaterial color="#161618" />
      </mesh>

      {/* MX Mechanical Mini + Razer wrist rest + MX Master */}
      <mesh position={[0, 0.769, 0.12]}>
        <boxGeometry args={[0.3, 0.014, 0.11]} />
        <meshStandardMaterial color="#eceff1" />
      </mesh>
      <mesh position={[0, 0.768, 0.22]}>
        <boxGeometry args={[0.36, 0.014, 0.06]} />
        <meshStandardMaterial color={DEVICE_DARK} />
      </mesh>
      <mesh position={[0.28, 0.772, 0.16]}>
        <boxGeometry args={[0.06, 0.026, 0.1]} />
        <meshStandardMaterial color="#4a4a4f" />
      </mesh>

      {/* Android figurine */}
      <group position={[-0.2, 0.758, -0.28]}>
        <mesh position={[0, 0.026, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.05, 16]} />
          <meshStandardMaterial color="#fbfbf9" />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.02, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#fbfbf9" />
        </mesh>
      </group>

      {/* graded No. 1 Dad card on its wooden easel */}
      <group position={[-0.06, 0.758, -0.29]} rotation={[-0.12, 0, 0]}>
        <mesh position={[0, 0.055, 0]} castShadow>
          <boxGeometry args={[0.06, 0.085, 0.008]} />
          <meshStandardMaterial color="#e9e6da" />
        </mesh>
        <mesh position={[0, 0.02, 0.012]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.055, 0.008, 0.03]} />
          <meshStandardMaterial color="#c9a575" />
        </mesh>
      </group>

      {/* "WILL SOURCE FOR $$" letterboard */}
      <group position={[0.12, 0.85, -0.3]} rotation={[-0.08, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.2, 0.02]} />
          <meshStandardMaterial color="#f5f5f0" />
        </mesh>
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.18, 0.16]} />
          <meshStandardMaterial color="#9aa0a3" />
        </mesh>
      </group>

      {/* family photo, wood frame */}
      <mesh position={[0.42, 0.83, -0.28]} rotation={[-0.06, -0.12, 0]} castShadow>
        <boxGeometry args={[0.18, 0.14, 0.015]} />
        <meshStandardMaterial color="#5a3d2b" />
      </mesh>

      {/* ceramic Facebook tile, flat on the desk */}
      <mesh position={[0.35, 0.762, 0.14]} rotation={[0, -0.1, 0]}>
        <boxGeometry args={[0.1, 0.006, 0.1]} />
        <meshStandardMaterial color="#1877f2" roughness={0.25} />
      </mesh>

      <AeronChair />

      {/* dog bed + backpack corner */}
      <group position={[-1.75, 0, 0.75]}>
        <mesh position={[0, 0.09, 0]} castShadow>
          <boxGeometry args={[0.75, 0.18, 0.55]} />
          <meshStandardMaterial color="#9aa0a6" roughness={0.9} />
        </mesh>
        <mesh position={[0.1, 0.34, -0.05]} rotation={[0.15, 0.4, -0.1]} castShadow>
          <boxGeometry args={[0.32, 0.42, 0.18]} />
          <meshStandardMaterial color="#1f1f22" roughness={0.8} />
        </mesh>
      </group>

      {/* warm afternoon light through the window (right side) */}
      <ambientLight intensity={0.5} color="#fff2e2" />
      <hemisphereLight intensity={0.35} color="#fff6e8" groundColor="#8a5a3a" />
      <directionalLight
        position={[7, 2.4, 0.6]}
        intensity={1.6}
        color="#ffdcae"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-bias={-0.0004}
      />
    </group>
  );
}
