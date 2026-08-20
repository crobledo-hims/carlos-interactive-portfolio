import { Room } from "./assets/Room";
import { Desk } from "./assets/Desk";
import { Monitors } from "./assets/Monitors";
import { Peripherals } from "./assets/Peripherals";
import { Trinkets } from "./assets/Trinkets";
import { DeskObjects } from "./assets/DeskObjects";
import { AeronChair } from "./assets/Chair";
import { Corner } from "./assets/Corner";
import { Plant } from "./assets/Plant";
import { WallTV } from "./assets/WallTV";
import { Lighting } from "./assets/Lighting";

/**
 * Carlos Robledo's home office, rebuilt procedurally: no external textures,
 * no HDRIs, no model files. Every surface here is geometry plus a canvas.
 *
 * The camera contract lives in Monitors.tsx (screen planes) and Desk.tsx
 * (top surface height) — CameraRig.tsx docks onto those exact numbers.
 *
 * Ambient motion lives in three places, each owning one `useFrame` inside
 * R3F's existing loop and each gated on `usePrefersReducedMotion`:
 *   Lighting/SunKey  -> the key light's position (louver bands drift)
 *   Plant            -> three leaf-cluster rotations
 *   DeskObjects/Steam-> three wisp transforms + opacities
 * Nothing else animates, and none of it touches React state.
 */
export function DeskScene() {
  return (
    <group>
      <Lighting />
      <Room />
      <WallTV />
      <Desk />
      <Monitors />
      <Peripherals />
      <Trinkets />
      <DeskObjects />
      <AeronChair />
      <Plant />
      <Corner />
    </group>
  );
}
