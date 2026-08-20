import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";
import { overlayState } from "../overlayState";

type View = { pos: [number, number, number]; target: [number, number, number] };

const OVERVIEW: View = { pos: [0, 1.7, 3.4], target: [0, 1.1, 0] };
const SEATED: View = { pos: [0, 1.35, 1.25], target: [0, 1.13, 0] };
const LEFT_MON: View = { pos: [-0.302, 1.14, 0.55], target: [-0.302, 1.13, -0.18] };
const RIGHT_MON: View = { pos: [0.302, 1.14, 0.55], target: [0.302, 1.13, -0.18] };
const OUTRO: View = { pos: [1.6, 1.9, 3.0], target: [0, 1.05, 0] };

// Piecewise camera track over scroll offset 0..1. Repeated views hold the camera.
// The Work desktop docks early (t=0.24 of a 4-page track) so one deliberate
// wheel gesture — or the intro's "Enter workspace" button — reaches it.
const KEYS: { t: number; v: View }[] = [
  { t: 0.0, v: OVERVIEW },
  { t: 0.12, v: SEATED },
  { t: 0.24, v: LEFT_MON },
  { t: 0.42, v: LEFT_MON },
  { t: 0.54, v: RIGHT_MON },
  { t: 0.72, v: RIGHT_MON },
  { t: 1.0, v: OUTRO },
];

// Overlay fully visible inside [inLo, inHi], fading over `fade` at each edge.
const LEFT_WINDOW = { inLo: 0.27, inHi: 0.4, fade: 0.035 };
const RIGHT_WINDOW = { inLo: 0.57, inHi: 0.7, fade: 0.035 };

// Scroll offset the "Enter workspace" button animates to (center of the
// left-monitor hold).
export const WORK_DOCK_OFFSET = (LEFT_WINDOW.inLo + LEFT_WINDOW.inHi) / 2;

function smoothstep(x: number) {
  return x * x * (3 - 2 * x);
}

function windowAlpha(t: number, w: { inLo: number; inHi: number; fade: number }) {
  const rise = THREE.MathUtils.clamp((t - (w.inLo - w.fade)) / w.fade, 0, 1);
  const fall = THREE.MathUtils.clamp(((w.inHi + w.fade) - t) / w.fade, 0, 1);
  return Math.min(rise, fall);
}

export function CameraRig() {
  const scroll = useScroll();
  const pos = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());

  useFrame(({ camera }) => {
    overlayState.scrollEl = scroll.el;
    const t = scroll.offset;

    let i = 0;
    while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const span = b.t - a.t;
    const local = span > 0 ? smoothstep(THREE.MathUtils.clamp((t - a.t) / span, 0, 1)) : 0;

    pos.current.fromArray(a.v.pos).lerp(new THREE.Vector3(...b.v.pos), local);
    target.current.fromArray(a.v.target).lerp(new THREE.Vector3(...b.v.target), local);

    camera.position.copy(pos.current);
    camera.lookAt(target.current);

    overlayState.left = windowAlpha(t, LEFT_WINDOW);
    overlayState.right = windowAlpha(t, RIGHT_WINDOW);
    // Intro hero fades out well before the camera docks on the left monitor.
    overlayState.intro = THREE.MathUtils.clamp(1 - t / 0.16, 0, 1);
  });

  return null;
}
