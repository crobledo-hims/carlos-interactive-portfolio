import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { RoundedBox, useGLTF } from "@react-three/drei";
import { materials } from "../materials";
import { photoTexture } from "../photoTextures";
import { lathe, starGeometry } from "../geometry";
import { DESK_SURFACE } from "./Desk";

/* ------------------------------------------------------------------ */
/* Android figurine — ~7.5 cm classic bugdroid                          */
/* Blender-built GLB with the real G-shield sticker; the procedural     */
/* version below stays as the Suspense fallback while it streams in.    */
/* ------------------------------------------------------------------ */

const DROID_POS: [number, number, number] = [-0.055, DESK_SURFACE, -0.3];
const DROID_ROT: [number, number, number] = [0, 0.22, 0];

/* Meshopt-compressed; drei bundles the meshopt decoder, so no extra
   decoder download — Draco was rejected for its 250KB cold-cache cost. */
const DROID_GLB = "/models/droid.glb";

function DroidModel() {
  const { scene } = useGLTF(DROID_GLB, false);
  const model = useMemo(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return scene;
  }, [scene]);
  return <primitive object={model} position={DROID_POS} rotation={DROID_ROT} />;
}

useGLTF.preload(DROID_GLB, false);

function Droid() {
  const M = materials();

  const bodyGeo = useMemo(
    () =>
      lathe(
        [
          [0, 0.0145],
          [0.0142, 0.0145],
          [0.0178, 0.0163],
          [0.019, 0.0197],
          [0.019, 0.0445],
          [0, 0.0445],
        ],
        28,
      ),
    [],
  );

  const domeGeo = useMemo(() => {
    const pts: [number, number][] = [[0, 0]];
    for (let i = 0; i <= 12; i++) {
      const t = (i / 12) * (Math.PI / 2);
      pts.push([0.019 * Math.cos(t), 0.019 * Math.sin(t)]);
    }
    return lathe(pts, 28);
  }, []);

  const badge = useMemo(() => {
    const tex = photoTexture("/textures/droid-badge.png");
    return new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.3 });
  }, []);

  const eye = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#17181c", roughness: 0.12, clearcoat: 1 }),
    [],
  );

  return (
    <group position={DROID_POS} rotation={DROID_ROT}>
      {/* legs */}
      {[-0.0088, 0.0088].map((x) => (
        <mesh key={x} position={[x, 0.0087, 0]} castShadow material={M.whitePlastic}>
          <capsuleGeometry args={[0.0062, 0.005, 4, 12]} />
        </mesh>
      ))}
      <mesh geometry={bodyGeo} castShadow receiveShadow material={M.whitePlastic} />
      <mesh geometry={domeGeo} position={[0, 0.0468, 0]} castShadow material={M.whitePlastic} />

      {/* stub arms */}
      {[-0.0262, 0.0262].map((x) => (
        <mesh key={x} position={[x, 0.0312, 0]} castShadow material={M.whitePlastic}>
          <capsuleGeometry args={[0.0068, 0.019, 4, 12]} />
        </mesh>
      ))}

      {/* antennae */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0.0468, 0]} rotation={[0, 0, -s * 0.52]}>
          <mesh position={[0, 0.0272, 0]} material={M.whitePlastic}>
            <cylinderGeometry args={[0.0013, 0.0013, 0.017, 8]} />
          </mesh>
        </group>
      ))}

      {/* eyes */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.0064, 0.0548, 0.016]} material={eye}>
          <sphereGeometry args={[0.0023, 10, 8]} />
        </mesh>
      ))}

      {/* chest badge — the actual G shield sticker, cut out with alpha */}
      <mesh position={[0, 0.031, 0.0193]} material={badge}>
        <planeGeometry args={[0.016, 0.0153]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Graded "No. 1 Dad" card on a pine easel                              */
/* ------------------------------------------------------------------ */

function GradedCard() {
  const M = materials();
  const face = useMemo(() => {
    const tex = photoTexture("/textures/card-face.jpg");
    return new THREE.MeshPhysicalMaterial({
      map: tex,
      roughness: 0.28,
      metalness: 0.35,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
    });
  }, []);
  const label = useMemo(() => {
    const tex = photoTexture("/textures/card-label.jpg");
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
  }, []);

  return (
    <group position={[0.115, DESK_SURFACE, -0.315]} rotation={[0, -0.12, 0]}>
      {/* easel: two front uprights + ledge, one back leg */}
      <group rotation={[-0.16, 0, 0]}>
        {[-0.029, 0.029].map((x) => (
          <mesh key={x} position={[x, 0.038, -0.004]} castShadow material={M.pine}>
            <boxGeometry args={[0.007, 0.076, 0.007]} />
          </mesh>
        ))}
        <mesh position={[0, 0.005, 0.004]} castShadow material={M.pine}>
          <boxGeometry args={[0.075, 0.008, 0.016]} />
        </mesh>
        <mesh position={[0, 0.062, -0.004]} material={M.pine}>
          <boxGeometry args={[0.075, 0.007, 0.007]} />
        </mesh>
      </group>
      <mesh position={[0, 0.03, -0.032]} rotation={[0.38, 0, 0]} castShadow material={M.pine}>
        <boxGeometry args={[0.008, 0.085, 0.008]} />
      </mesh>

      {/* slab sits in the ledge, leaning with the easel */}
      <group position={[0, 0.069, 0.0035]} rotation={[-0.16, 0, 0]}>
        {/* grading label at the top of the slab */}
        <mesh position={[0, 0.0478, 0.0005]} material={label}>
          <planeGeometry args={[0.06, 0.0175]} />
        </mesh>
        {/* card inside */}
        <mesh position={[0, -0.0102, 0.0005]} castShadow material={face}>
          <planeGeometry args={[0.058, 0.0943]} />
        </mesh>
        <mesh position={[0, 0, -0.0008]} material={M.paperWhite}>
          <boxGeometry args={[0.064, 0.114, 0.0016]} />
        </mesh>
        {/* acrylic shell — thin, glossy, visible edge */}
        <mesh material={M.acrylic}>
          <boxGeometry args={[0.077, 0.121, 0.0088]} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Letterboard                                                          */
/* ------------------------------------------------------------------ */

function Letterboard() {
  const M = materials();
  const felt = useMemo(() => {
    const tex = photoTexture("/textures/letterboard-corrected.webp");
    return new THREE.MeshStandardMaterial({
      map: tex,
      bumpMap: tex,
      bumpScale: 0.0014,
      roughness: 0.93,
      metalness: 0,
    });
  }, []);
  const star = useMemo(() => starGeometry(0.012, 0.0052, 0.005), []);
  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#e6c98a", roughness: 0.35, metalness: 0.6 }),
    [],
  );

  const half = 0.11;
  const border = 0.021;

  return (
    <group position={[0.7, DESK_SURFACE, -0.225]} rotation={[-0.12, -0.5, 0]}>
      <group position={[0, half, 0]}>
        {/* backing panel */}
        <mesh position={[0, 0, -0.004]} castShadow receiveShadow material={M.whitewashWood}>
          <boxGeometry args={[half * 2, half * 2, 0.012]} />
        </mesh>
        {/* grey felt face */}
        <mesh position={[0, 0, 0.0032]} material={felt}>
          <planeGeometry args={[half * 2 - border * 2, half * 2 - border * 2]} />
        </mesh>
        {/* frame */}
        {[
          { p: [0, half - border / 2, 0.001] as [number, number, number], s: [half * 2, border, 0.02] as [number, number, number] },
          { p: [0, -half + border / 2, 0.001] as [number, number, number], s: [half * 2, border, 0.02] as [number, number, number] },
          { p: [-half + border / 2, 0, 0.001] as [number, number, number], s: [border, half * 2 - border * 2, 0.02] as [number, number, number] },
          { p: [half - border / 2, 0, 0.001] as [number, number, number], s: [border, half * 2 - border * 2, 0.02] as [number, number, number] },
        ].map((f, i) => (
          <mesh key={i} position={f.p} castShadow receiveShadow material={M.whitewashWood}>
            <boxGeometry args={f.s} />
          </mesh>
        ))}
        {/* ornament */}
        <mesh geometry={star} position={[0, half + 0.008, -0.001]} castShadow material={brass} />
      </group>
      {/* discreet kickstand */}
      <mesh position={[0, 0.055, -0.045]} rotation={[0.42, 0, 0]} castShadow material={M.whitewashWood}>
        <boxGeometry args={[0.03, 0.13, 0.008]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Family photo, walnut frame                                           */
/* ------------------------------------------------------------------ */

function PhotoFrame() {
  const M = materials();
  const photo = useMemo(() => {
    const tex = photoTexture("/textures/family-photo.jpg");
    return new THREE.MeshPhysicalMaterial({
      map: tex,
      roughness: 0.12,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    });
  }, []);

  const w = 0.19;
  const h = 0.155;
  const border = 0.019;

  return (
    <group position={[-0.76, DESK_SURFACE, -0.24]} rotation={[-0.12, 0.62, 0]}>
      <group position={[0, h / 2, 0]}>
        <mesh position={[0, 0, -0.004]} castShadow receiveShadow material={M.walnut}>
          <boxGeometry args={[w, h, 0.01]} />
        </mesh>
        {[
          { p: [0, h / 2 - border / 2, 0.002] as [number, number, number], s: [w, border, 0.016] as [number, number, number] },
          { p: [0, -h / 2 + border / 2, 0.002] as [number, number, number], s: [w, border, 0.016] as [number, number, number] },
          { p: [-w / 2 + border / 2, 0, 0.002] as [number, number, number], s: [border, h - border * 2, 0.016] as [number, number, number] },
          { p: [w / 2 - border / 2, 0, 0.002] as [number, number, number], s: [border, h - border * 2, 0.016] as [number, number, number] },
        ].map((f, i) => (
          <mesh key={i} position={f.p} castShadow receiveShadow material={M.walnut}>
            <boxGeometry args={f.s} />
          </mesh>
        ))}
        {/* wide white mat */}
        <mesh position={[0, 0, 0.0035]} material={M.paperWhite}>
          <planeGeometry args={[w - border * 2, h - border * 2]} />
        </mesh>
        <mesh position={[0, 0, 0.0038]} material={photo}>
          <planeGeometry args={[0.108, 0.081]} />
        </mesh>
      </group>
      <mesh position={[0, 0.05, -0.042]} rotation={[0.4, 0, 0]} castShadow material={M.walnut}>
        <boxGeometry args={[0.028, 0.115, 0.006]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Hand-painted ceramic tile                                            */
/* ------------------------------------------------------------------ */

function CeramicTile() {
  const body = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#1d4fae",
        roughness: 0.12,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
      }),
    [],
  );
  const glaze = useMemo(() => {
    const tex = photoTexture("/textures/tile.jpg");
    return new THREE.MeshPhysicalMaterial({
      map: tex,
      roughness: 0.11,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.1,
    });
  }, []);

  return (
    <group position={[0.46, DESK_SURFACE, 0.175]} rotation={[0, -0.15, 0]}>
      <RoundedBox
        args={[0.1, 0.011, 0.1]}
        radius={0.004}
        smoothness={4}
        position={[0, 0.0055, 0]}
        castShadow
        receiveShadow
        material={body}
      />
      <mesh position={[0, 0.0126, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glaze}>
        <planeGeometry args={[0.097, 0.097]} />
      </mesh>
    </group>
  );
}

export function Trinkets() {
  return (
    <group>
      <Suspense fallback={<Droid />}>
        <DroidModel />
      </Suspense>
      <GradedCard />
      <Letterboard />
      <PhotoFrame />
      <CeramicTile />
    </group>
  );
}
