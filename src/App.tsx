import { Canvas } from "@react-three/fiber";
import { ScrollControls } from "@react-three/drei";
import { DeskScene } from "./scene/DeskScene";
import { CameraRig } from "./scene/CameraRig";
import { LeftMonitorOverlay, RightMonitorOverlay } from "./overlay/Overlays";
import { IntroOverlay } from "./overlay/IntroOverlay";

export default function App() {
  return (
    <>
      <Canvas
        shadows
        camera={{ fov: 42, position: [0, 1.7, 3.4], near: 0.05, far: 50 }}
      >
        <color attach="background" args={["#cfc9bf"]} />
        <ScrollControls pages={4} damping={0.28}>
          <DeskScene />
          <CameraRig />
        </ScrollControls>
      </Canvas>

      <IntroOverlay />
      <LeftMonitorOverlay />
      <RightMonitorOverlay />
    </>
  );
}
