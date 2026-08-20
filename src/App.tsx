import { Canvas } from "@react-three/fiber";
import { ScrollControls } from "@react-three/drei";
import { DeskScene } from "./scene/DeskScene";
import { CameraRig } from "./scene/CameraRig";
import { LeftMonitorOverlay, RightMonitorOverlay, ScrollHint } from "./overlay/Overlays";

export default function App() {
  return (
    <>
      <Canvas
        shadows
        camera={{ fov: 42, position: [0, 1.7, 3.4], near: 0.05, far: 50 }}
      >
        <color attach="background" args={["#16161a"]} />
        <ScrollControls pages={6} damping={0.28}>
          <DeskScene />
          <CameraRig />
        </ScrollControls>
      </Canvas>

      <a className="skip-link" href="/resume.html">
        Skip to resume →
      </a>
      <ScrollHint />
      <LeftMonitorOverlay />
      <RightMonitorOverlay />
    </>
  );
}
