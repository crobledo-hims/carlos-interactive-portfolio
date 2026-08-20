import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";
import { overlayState } from "../overlayState";

type View = { pos: [number, number, number]; target: [number, number, number] };

const OVERVIEW: View = { pos: [0, 1.7, 3.4], target: [0, 1.05, 0] };
const SEATED: View = { pos: [0, 1.2, 1.25], target: [0, 0.96, 0] };
const LEFT_MON: View = { pos: [-0.45, 0.97, 0.62], target: [-0.45, 0.96, -0.1] };
const RIGHT_MON: View = { pos: [0.45, 0.97, 0.62], target: [0.45, 0.96, -0.1] };
const OUTRO: View = { pos: [1.6, 1.9, 3.0], target: [0, 1.0, 0] };

// Piecewise camera track over scroll offset 0..1. Repeated views hold the camera.
const KEYS: { t: number; v: View }[] = [
  { t: 0.0, v: OVERVIEW },
  { t: 0.2, v: SEATED },
  { t: 0.3, v: SEATED },
  { t: 0.44, v: LEFT_MON },
  { t: 0.58, v: LEFT_MON },
  { t: 0.68, v: RIGHT_MON },
  { t: 0.82, v: RIGHT_MON },
  { t: 1.0, v: OUTRO },
];

// Overlay fully visible inside [inLo, inHi], fading over `fade` at each edge.
const LEFT_WINDOW = { inLo: 0.47, inHi: 0.55, fade: 0.03 };
const RIGHT_WINDOW = { inLo: 0.71, inHi: 0.79, fade: 0.03 };

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
    overlayState.hint = THREE.MathUtils.clamp(1 - t * 12, 0, 1);
  });

  return null;
}
