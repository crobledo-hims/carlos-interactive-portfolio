import { Room } from "./assets/Room";
import { Desk } from "./assets/Desk";
import { Monitors } from "./assets/Monitors";
import { Peripherals } from "./assets/Peripherals";
import { Trinkets } from "./assets/Trinkets";
import { AeronChair } from "./assets/Chair";
import { Corner } from "./assets/Corner";
import { Lighting } from "./assets/Lighting";

/**
 * Carlos Robledo's home office, rebuilt procedurally: no external textures,
 * no HDRIs, no model files. Every surface here is geometry plus a canvas.
 *
 * The camera contract lives in Monitors.tsx (screen planes) and Desk.tsx
 * (top surface height) — CameraRig.tsx docks onto those exact numbers.
 */
export function DeskScene() {
  return (
    <group>
      <Lighting />
      <Room />
      <Desk />
      <Monitors />
      <Peripherals />
      <Trinkets />
      <AeronChair />
      <Corner />
    </group>
  );
}
