import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { envEquirect } from "../textures";

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

export function Lighting() {
  return (
    <>
      <ProceduralEnvironment intensity={0.38} />

      <ambientLight intensity={0.16} color="#fff3e2" />
      <hemisphereLight intensity={0.3} color="#fff8ee" groundColor="#c0906a" />

      {/* key: the sun, aimed so the window patch lands across the desk and
          carries on to the base of the left wall */}
      <directionalLight
        position={[7.06, 2.86, 1.15]}
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
