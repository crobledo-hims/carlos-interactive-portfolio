import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { envEquirect } from "../textures";
import { usePrefersReducedMotion } from "../reducedMotion";

/**
 * Late-afternoon sun from the right, through the plantation shutters.
 *
 * The right wall is solid geometry with a window-shaped hole in it, so the key
 * light's shadow map does the work: everything outside the opening is blocked,
 * and the shutter louvers slice what gets through into bands that rake the
 * floor, the desk and the base of the left wall.
 *
 * The sun sits at ~22 degrees elevation. That angle is load-bearing: any
 * higher and the patch never clears the desk to reach the left side of the
 * room; any lower and the bands slide behind the back wall. Brightness comes
 * from the ambient/hemisphere/IBL trio rather than from softening the key, so
 * the bands stay crisp while the room reads sun-lit and airy — never moody.
 *
 * drei's <SoftShadows> is deliberately NOT used: its PCSS shader chunk
 * predates three's `shadowIntensity` uniform and fails to link on r185.
 *
 * <ContactShadows> stays frames={1}. It is baked from a top-down orthographic
 * camera and represents contact occlusion, not sun direction, so the drifting
 * key light creates no mismatch with it — there is nothing to re-bake.
 */

/** Procedural IBL: a warm gradient equirect run through PMREM. No HDRI files. */
function ProceduralEnvironment({ intensity = 0.5 }: { intensity?: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const source = envEquirect();
    source.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromEquirectangular(source);
    // oxlint-disable-next-line react/immutability -- installing scene IBL is the point
    scene.environment = target.texture;
    scene.environmentIntensity = intensity;
    pmrem.dispose();
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, scene, intensity]);

  return null;
}

/* ------------------------------------------------------------------ */
/* the sun, and its slow drift                                         */
/* ------------------------------------------------------------------ */

const SUN_BASE: [number, number, number] = [7.06, 2.86, 1.15];
/**
 * Swing is tiny on purpose: the louver bands travel ~25 cm in z and ~15 cm in
 * x over a half cycle. Reads as time passing, not as a moving sun. Elevation
 * moves by only 0.8 degrees, so N.L on the floor changes by ~3% — a gradual
 * warm/cool breath rather than any flicker.
 */
const SUN_SWING: [number, number, number] = [0, 0.1, 0.5];
const SUN_PERIOD = 140; // seconds for a full there-and-back

/**
 * Seconds between light-position writes.
 *
 * Measured: moving this light EVERY frame costs ~16 fps (50 -> 34 at 2560x1440).
 * Touching a shadow-casting light invalidates the shadow map and the lights
 * uniform block for every material, and that is not free at 146 casters.
 *
 * It is also entirely unnecessary. Peak sun speed is 2pi*0.5/140 = 22 mm/s, and
 * the floor patch moves at about half that. One step of 1/4 s therefore shifts
 * the shadow by ~2.8 mm, against a shadow-map texel of 11 m / 2048 = 5.4 mm —
 * about half a texel, so most steps do not change a single shadow
 * pixel. The motion is continuous to the eye and costs a tenth as much.
 */
const SUN_STEP = 1 / 4;

function SunKey() {
  const reduced = usePrefersReducedMotion();
  const light = useRef<THREE.DirectionalLight>(null);
  const nextWrite = useRef(0);

  /**
   * The only per-frame work in the lighting rig is a clock comparison; four
   * times a second that turns into three floats on the light position.
   *
   * sin() rather than an accumulating angle: the path reverses smoothly at
   * both ends, so there is no loop seam and no unbounded drift over a long
   * session.
   */
  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    if (t < nextWrite.current) return;
    nextWrite.current = t + SUN_STEP;

    const l = light.current;
    if (!l) return;
    const k = Math.sin((t * Math.PI * 2) / SUN_PERIOD);
    l.position.set(
      SUN_BASE[0] + SUN_SWING[0] * k,
      SUN_BASE[1] + SUN_SWING[1] * k,
      SUN_BASE[2] + SUN_SWING[2] * k,
    );
  });

  return (
    <directionalLight
      ref={light}
      position={SUN_BASE}
      intensity={7.2}
      color="#ffdcae"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-5.5}
      shadow-camera-right={5.5}
      shadow-camera-top={5.5}
      shadow-camera-bottom={-5.5}
      shadow-camera-near={1}
      shadow-camera-far={18}
      shadow-bias={-0.00018}
      shadow-normalBias={0.014}
      shadow-intensity={0.95}
    />
  );
}

export function Lighting() {
  return (
    <>
      <ProceduralEnvironment intensity={0.38} />

      <ambientLight intensity={0.16} color="#fff3e2" />
      <hemisphereLight intensity={0.3} color="#fff8ee" groundColor="#c0906a" />

      <SunKey />

      {/* cool fill standing in for skylight bouncing off the far wall */}
      <directionalLight position={[-3.4, 2.4, 3.2]} intensity={0.55} color="#e6ecf7" />
      {/* warm kicker so the desk front edge and chair mesh never go flat */}
      <directionalLight position={[1.6, 1.3, 3.6]} intensity={0.42} color="#ffe6c8" />
      {/* soft bounce back off the floor onto undersides */}
      <directionalLight position={[-1.2, -2.0, 1.4]} intensity={0.16} color="#f0d3ae" />

      <ContactShadows
        position={[0, 0.005, 0.25]}
        scale={4.8}
        blur={2.4}
        far={1.0}
        opacity={0.36}
        resolution={1024}
        frames={1}
        color="#5b4a37"
      />
    </>
  );
}
