const GRAY = "#8a8a92";
const DARK = "#55555c";
const SCREEN = "#0f1420";

function Monitor({ x, tilt }: { x: number; tilt: number }) {
  return (
    <group position={[x, 0.77, -0.12]} rotation={[0, tilt, 0]}>
      {/* stand */}
      <mesh position={[0, 0.05, 0.02]}>
        <boxGeometry args={[0.06, 0.1, 0.06]} />
        <meshStandardMaterial color={DARK} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.22, 0.015, 0.16]} />
        <meshStandardMaterial color={DARK} />
      </mesh>
      {/* body */}
      <mesh position={[0, 0.19, 0]}>
        <boxGeometry args={[0.62, 0.37, 0.035]} />
        <meshStandardMaterial color={DARK} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 0.19, 0.019]}>
        <planeGeometry args={[0.58, 0.33]} />
        <meshStandardMaterial color={SCREEN} emissive="#1a2333" emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}

export function DeskScene() {
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#3a3a40" />
      </mesh>

      {/* back wall */}
      <mesh position={[0, 1.6, -1.2]}>
        <planeGeometry args={[8, 3.2]} />
        <meshStandardMaterial color="#4a4a52" />
      </mesh>

      {/* desk top */}
      <mesh position={[0, 0.74, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.04, 0.75]} />
        <meshStandardMaterial color={GRAY} />
      </mesh>

      {/* desk legs */}
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0.37, -0.05]}>
          <boxGeometry args={[0.05, 0.74, 0.6]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
      ))}

      <Monitor x={-0.45} tilt={0.18} />
      <Monitor x={0.45} tilt={-0.18} />

      {/* keyboard + mouse */}
      <mesh position={[-0.05, 0.765, 0.18]}>
        <boxGeometry args={[0.45, 0.015, 0.15]} />
        <meshStandardMaterial color={DARK} />
      </mesh>
      <mesh position={[0.35, 0.765, 0.2]}>
        <boxGeometry args={[0.06, 0.02, 0.1]} />
        <meshStandardMaterial color={DARK} />
      </mesh>

      {/* chair */}
      <group position={[0, 0, 0.85]}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.48, 0.06, 0.48]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
        <mesh position={[0, 0.72, 0.24]}>
          <boxGeometry args={[0.48, 0.6, 0.06]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.06, 0.44, 0.06]} />
          <meshStandardMaterial color="#2e2e33" />
        </mesh>
      </group>

      <ambientLight intensity={0.45} />
      <directionalLight position={[2.5, 4, 2]} intensity={1.1} castShadow />
      <pointLight position={[0, 1.4, 0.6]} intensity={0.35} color="#aac4ff" />
    </group>
  );
}
