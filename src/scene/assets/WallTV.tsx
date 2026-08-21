import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { materials } from "../materials";
import {
  CLOCK_H,
  CLOCK_W,
  createMutableCanvas,
  paintClockFace,
  paintTvCommandFace,
} from "../textures";
import { getLocalTime, onLocalMinute } from "../../lib/localClock";
import { getHireCarlosSnapshot, useHireCarlosSnapshot } from "../../easterEgg/hireCarlos";

/**
 * Wall-mounted TV on the back wall, centred on x = 0 behind the monitors,
 * showing the visitor's local time.
 *
 * HEIGHT IS COMPOSITION-DRIVEN. At the opening 1280x720 framing the intro
 * card occupies screen y 172..433; the TV's bottom edge projects to y ~153,
 * so the panel clears the card entirely instead of tangling with it behind
 * the frosted glass. That pushes it higher on the wall than "slightly above
 * the monitors" would suggest on its own — the card wins that trade.
 *
 * The face is a CanvasTexture repainted ONLY when the displayed minute
 * changes (see src/lib/localClock.ts). Nothing here runs per frame.
 */

const TV_W = 0.86;
const TV_H = 0.4838; // 16:9
const TV_Y = 2.142;
const TV_Z = -1.196; // wall inner face is z = -1.2

const BEZEL = 0.011;
const SCREEN_W = TV_W - BEZEL * 2;
const SCREEN_H = TV_H - BEZEL * 2 - 0.006; // marginally deeper chin
const SCREEN_CY = 0.003;

interface MutableTvClock {
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
}

function createTvClock(): MutableTvClock {
  const canvas = createMutableCanvas(CLOCK_W, CLOCK_H);
  paintClockFace(canvas, getLocalTime());
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return { canvas, texture };
}

function showClockTime(clock: MutableTvClock, time: string) {
  paintClockFace(clock.canvas, time);
  clock.texture.needsUpdate = true;
}

function showCommandFace(clock: MutableTvClock, phase: "hint" | "running" | "complete") {
  paintTvCommandFace(clock.canvas, phase);
  clock.texture.needsUpdate = true;
}

export function WallTV() {
  const M = materials();
  const hireCarlos = useHireCarlosSnapshot();

  // Painted with the correct time at construction, so the first rendered
  // frame is already right — no placeholder flash on init.
  const [clock] = useState(createTvClock);

  useEffect(() => {
    return onLocalMinute((time) => {
      if (getHireCarlosSnapshot().phase !== "idle") return;
      // Uploaded by the next render of the existing loop; no rAF of our own.
      showClockTime(clock, time);
    });
  }, [clock]);

  useEffect(() => {
    if (hireCarlos.phase === "idle") showClockTime(clock, getLocalTime());
    else showCommandFace(clock, hireCarlos.phase);
  }, [clock, hireCarlos.phase]);

  const screenMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: clock.texture,
        emissiveMap: clock.texture,
        emissive: new THREE.Color("#ffe9c8"),
        // deliberately low: the TV must sit behind the monitors and the intro,
        // not compete with them
        emissiveIntensity: 0.34,
        roughness: 0.15,
        metalness: 0,
      }),
    [clock.texture],
  );

  const shell = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#17181b",
        roughness: 0.42,
        metalness: 0.35,
      }),
    [],
  );

  const standby = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a2c30",
        emissive: new THREE.Color("#ffb27a"),
        emissiveIntensity: 0.35,
        roughness: 0.3,
      }),
    [],
  );

  useEffect(
    () => () => {
      clock.texture.dispose();
      screenMat.dispose();
      shell.dispose();
      standby.dispose();
    },
    [clock, screenMat, shell, standby],
  );

  return (
    <group position={[0, TV_Y, TV_Z]}>
      {/* low-profile wall bracket, hidden behind the panel */}
      <mesh position={[0, -0.02, 0.006]} material={M.graphiteDark}>
        <boxGeometry args={[0.26, 0.19, 0.014]} />
      </mesh>

      {/* panel: thin, modern, near-borderless */}
      <RoundedBox
        args={[TV_W, TV_H, 0.03]}
        radius={0.005}
        smoothness={3}
        position={[0, 0, 0.026]}
        castShadow
        receiveShadow
        material={shell}
      />

      <mesh position={[0, SCREEN_CY, 0.0415]} material={screenMat}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
      </mesh>

      {/* standby pinlight under the chin — a detail, not a feature */}
      <mesh position={[0, -TV_H / 2 + 0.005, 0.0418]} material={standby}>
        <circleGeometry args={[0.0026, 10]} />
      </mesh>
    </group>
  );
}
