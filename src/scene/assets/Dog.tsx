import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

/* ------------------------------------------------------------------ */
/* The dog — an apricot cavapoo, sitting in the bolster bed            */
/* ------------------------------------------------------------------ */

/**
 * Modelled in Blender from a reference photo of Carlos's cavapoo, and
 * deliberately stylised rather than photoscanned: smooth metaball masses,
 * flat untextured base colours, no baked lighting. That is the same
 * treatment the droid and the cleaned Aeron get, and it is why the
 * photogrammetry plant was reverted — scanned detail and baked photographic
 * light read as a foreign object in a scene that is otherwise all
 * controlled materials.
 *
 * Five primitives (coat, ears, nose, eyes, tongue), ~22k triangles, no
 * texture maps at all — the whole animal is 101 KB.
 */

/* Meshopt-compressed, same as droid.glb and aeron-chair.glb; drei bundles
   the meshopt decoder, so this costs no extra decoder download. */
const DOG_GLB = "/models/dog.glb";

/**
 * The bolster bed in Corner.tsx sits at [-1.62, 0, 0.82] and its cushion
 * crowns at y ≈ 0.09, so the dog's floor contact rides there — the paws
 * sink a couple of millimetres into the suede, which is what selling
 * "sitting on a cushion" rather than "hovering over one" requires.
 */
const DOG_POS: [number, number, number] = [-1.62, 0.09, 0.8];

/**
 * The bolster's opening faces world ~(0.2, 0, 0.98) once the bed's own
 * 0.42 rad yaw is applied. The model is authored facing +Z, so this yaw
 * seats the dog looking out of the gap and slightly toward the desk.
 */
const DOG_ROT: [number, number, number] = [0, 0.28, 0];

function DogModel() {
  const { scene } = useGLTF(DOG_GLB, false);

  const model = useMemo(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return scene;
  }, [scene]);

  return <primitive object={model} position={DOG_POS} rotation={DOG_ROT} />;
}

useGLTF.preload(DOG_GLB, false);

/** No procedural stand-in — the bed simply sits empty until the GLB lands. */
export function Dog() {
  return (
    <Suspense fallback={null}>
      <DogModel />
    </Suspense>
  );
}
