const WALL = "#d6d2c9";
const FLOOR = "#7d4e30";
const DESK_WHITE = "#f2f2ef";
const DEVICE_DARK = "#1c1c1e";
const SCREEN = "#0f1420";

// Arm-mounted monitor floating above the desk, per Carlos's real setup.
function Monitor({ x, tilt, webcam }: { x: number; tilt: number; webcam?: boolean }) {
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

      {/* white standing desk */}
      <mesh position={[0, 0.74, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.035, 0.75]} />
        <meshStandardMaterial color={DESK_WHITE} />
      </mesh>
      {/* power rail along the back edge */}
      <mesh position={[0, 0.79, -0.38]}>
        <boxGeometry args={[1.7, 0.09, 0.05]} />
        <meshStandardMaterial color="#e9e9e6" />
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

      <Monitor x={-0.45} tilt={0.18} webcam />
      <Monitor x={0.45} tilt={-0.18} />

      {/* closed MacBook */}
      <mesh position={[-0.55, 0.768, 0.12]} rotation={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.31, 0.015, 0.22]} />
        <meshStandardMaterial color="#cfd2d6" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* white keyboard + wrist rest + mouse */}
      <mesh position={[0, 0.766, 0.16]}>
        <boxGeometry args={[0.44, 0.012, 0.15]} />
        <meshStandardMaterial color="#eceff1" />
      </mesh>
      <mesh position={[0, 0.766, 0.26]}>
        <boxGeometry args={[0.44, 0.014, 0.06]} />
        <meshStandardMaterial color={DEVICE_DARK} />
      </mesh>
      <mesh position={[0.32, 0.77, 0.19]}>
        <boxGeometry args={[0.06, 0.024, 0.1]} />
        <meshStandardMaterial color="#2b2b2e" />
      </mesh>

      {/* "WILL SOURCE FOR $$" letterboard (texture pass later) */}
      <group position={[0.02, 0.92, -0.3]} rotation={[-0.08, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.28, 0.02]} />
          <meshStandardMaterial color="#f5f5f0" />
        </mesh>
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.24, 0.24]} />
          <meshStandardMaterial color="#e4e2da" />
        </mesh>
      </group>

      {/* photo frames + paper stack */}
      <mesh position={[0.42, 0.85, -0.3]} rotation={[-0.06, -0.15, 0]} castShadow>
        <boxGeometry args={[0.17, 0.13, 0.015]} />
        <meshStandardMaterial color="#242426" />
      </mesh>
      <mesh position={[-0.32, 0.83, -0.3]} rotation={[-0.06, 0.12, 0]} castShadow>
        <boxGeometry args={[0.12, 0.15, 0.015]} />
        <meshStandardMaterial color="#242426" />
      </mesh>
      <mesh position={[0.68, 0.775, -0.15]} rotation={[0, -0.08, 0]}>
        <boxGeometry args={[0.24, 0.035, 0.18]} />
        <meshStandardMaterial color="#e8e6df" />
      </mesh>

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
