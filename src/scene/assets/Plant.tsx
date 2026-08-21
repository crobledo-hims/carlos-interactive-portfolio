import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { lathe, mergeParts, parametricGeometry, profile, type ControlPoint } from "../geometry";
import { leafSkin, prng, satinRoughness } from "../textures";
import { usePrefersReducedMotion } from "../reducedMotion";

/**
 * Floor plant beside the window. Each leaf is a stem tube and a blade lofted
 * along one shared spline, so the blade continues the stem's arc instead of
 * being glued onto it — that continuity is most of what makes a stylised
 * plant read as a plant.
 *
 * Twelve leaves are merged into THREE cluster meshes. The clusters are the
 * animation unit: each sways on its own slow sine, which is what buys the
 * asymmetric, never-in-step motion without twelve draw calls.
 */

const POS: [number, number, number] = [1.86, 0, -0.78];
const POT_H = 0.3;
const SOIL_Y = 0.275;

const CLUSTERS = 3;
const LEAVES_PER_CLUSTER = 4;

/** Sway is deliberately below the threshold of notice: ~7 mm at the tip. */
const SWAY = 0.012;
const SWAY_PERIODS = [11.3, 14.1, 9.7];

const BLADE_WIDTH: ControlPoint[] = [
  [0.0, 0.1],
  [0.1, 0.44],
  [0.38, 1.0],
  [0.7, 0.86],
  [0.9, 0.42],
  [1.0, 0.0],
];

// Spine in the leaf's own frame: rises, arcs outward in +x, droops at the tip.
const SPINE: [number, number, number][] = [
  [0, 0, 0],
  [0.02, 0.3, 0.01],
  [0.085, 0.58, 0.02],
  [0.165, 0.78, 0.02],
  [0.275, 0.93, 0.01],
  [0.395, 1.0, -0.02],
];

/** Where along the spline the petiole ends and the blade begins. */
const BLADE_START = 0.56;

const PLANE_NORMAL = new THREE.Vector3(0, 0, 1);

/**
 * Frame at parameter t: `bin` is perpendicular to the leaf's arc plane (the
 * blade spreads along it), `nor` lies in the plane (the blade cups along it).
 */
function frameAt(curve: THREE.CatmullRomCurve3, t: number) {
  const point = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();
  const bin = PLANE_NORMAL.clone()
    .addScaledVector(tangent, -PLANE_NORMAL.dot(tangent))
    .normalize();
  const nor = new THREE.Vector3().crossVectors(tangent, bin).normalize();
  return { point, bin, nor };
}

function buildLeaf(length: number, width: number): THREE.BufferGeometry[] {
  const curve = new THREE.CatmullRomCurve3(
    SPINE.map(([x, y, z]) => new THREE.Vector3(x * length, y * length, z * length)),
    false,
    "centripetal",
    0.5,
  );

  const stem = parametricGeometry(
    5,
    10,
    (u, v, out) => {
      const t = v * BLADE_START;
      const { point, bin, nor } = frameAt(curve, t);
      const r = 0.005 * length * 1.6 * (1 - 0.45 * v);
      const a = u * Math.PI * 2;
      out.copy(point).addScaledVector(bin, Math.cos(a) * r).addScaledVector(nor, Math.sin(a) * r);
    },
    true,
  );

  const blade = parametricGeometry(8, 12, (u, v, out) => {
    const t = BLADE_START + v * (1 - BLADE_START);
    const { point, bin, nor } = frameAt(curve, t);
    const half = width * profile(BLADE_WIDTH, v);
    const uu = u * 2 - 1;
    out
      .copy(point)
      .addScaledVector(bin, uu * half)
      // cupped along the midrib — reads as a fold under raking window light
      .addScaledVector(nor, -0.28 * uu * uu * half);
  });

  return [stem, blade];
}

function useFoliage(): THREE.BufferGeometry[] {
  return useMemo(() => {
    const rnd = prng(60421);
    const clusters: THREE.BufferGeometry[] = [];
    const scratch: THREE.BufferGeometry[] = [];

    for (let c = 0; c < CLUSTERS; c++) {
      const parts: { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4 }[] = [];

      for (let i = 0; i < LEAVES_PER_CLUSTER; i++) {
        const length = 0.5 + rnd() * 0.24;
        const width = 0.05 + rnd() * 0.024;
        const pieces = buildLeaf(length, width);
        scratch.push(...pieces);

        // azimuth walks around the pot with jitter, so no two leaves are
        // evenly spaced and the canopy never reads as radially symmetric
        const azimuth =
          ((c * LEAVES_PER_CLUSTER + i) / (CLUSTERS * LEAVES_PER_CLUSTER)) * Math.PI * 2 +
          (rnd() - 0.5) * 0.85;
        const lean = -0.26 + rnd() * 0.5;
        const roll = (rnd() - 0.5) * 0.5;

        const matrix = new THREE.Matrix4()
          .makeTranslation((rnd() - 0.5) * 0.05, 0, (rnd() - 0.5) * 0.05)
          .multiply(new THREE.Matrix4().makeRotationY(azimuth))
          .multiply(new THREE.Matrix4().makeRotationZ(lean))
          .multiply(new THREE.Matrix4().makeRotationX(roll));

        for (const geometry of pieces) parts.push({ geometry, matrix });
      }

      clusters.push(mergeParts(parts));
    }

    // the per-leaf pieces only existed to be merged
    for (const g of scratch) g.dispose();
    return clusters;
  }, []);
}

function ProceduralPlant() {
  const reduced = usePrefersReducedMotion();
  const clusters = useFoliage();
  const groups = useRef<(THREE.Group | null)[]>([]);

  const potGeo = useMemo(
    () =>
      lathe(
        [
          [0, 0],
          [0.108, 0],
          [0.118, 0.014],
          [0.132, 0.09],
          [0.15, 0.24],
          [0.158, POT_H],
          [0.1445, POT_H + 0.004],
          [0.1405, POT_H - 0.03],
          [0.126, 0.07],
          [0, 0.055],
        ],
        36,
      ),
    [],
  );

  const potMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#cfc7b8",
        roughness: 0.62,
        metalness: 0.03,
        roughnessMap: satinRoughness(),
      }),
    [],
  );

  const soilMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#463829", roughness: 0.97 }),
    [],
  );

  const leafMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#7d9668",
        map: leafSkin(),
        roughness: 0.62,
        metalness: 0,
        sheen: 0.45,
        sheenRoughness: 0.55,
        sheenColor: new THREE.Color("#c9d8b4"),
        side: THREE.DoubleSide,
      }),
    [],
  );

  useEffect(
    () => () => {
      for (const g of clusters) g.dispose();
      potGeo.dispose();
      potMat.dispose();
      soilMat.dispose();
      leafMat.dispose();
    },
    [clusters, potGeo, potMat, soilMat, leafMat],
  );

  // Static pose under reduced motion — the leaves simply stop where they are.
  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < groups.current.length; i++) {
      const group = groups.current[i];
      if (!group) continue;
      const w = (Math.PI * 2) / SWAY_PERIODS[i];
      group.rotation.z = Math.sin(t * w + i * 2.1) * SWAY;
      group.rotation.x = Math.sin(t * w * 0.73 + i * 3.7) * SWAY * 0.7;
    }
  });

  return (
    <group position={POS}>
      <mesh geometry={potGeo} castShadow receiveShadow material={potMat} />
      <mesh position={[0, SOIL_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={soilMat}>
        <circleGeometry args={[0.142, 28]} />
      </mesh>

      {clusters.map((geometry, i) => (
        <group
          key={i}
          position={[0, SOIL_Y - 0.01, 0]}
          ref={(el) => {
            groups.current[i] = el;
          }}
        >
          <mesh geometry={geometry} material={leafMat} castShadow receiveShadow />
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Photoscanned replacement                                            */
/* ------------------------------------------------------------------ */

/**
 * Poly Haven "Potted Plant 01" (CC0, polyhaven.com/a/potted_plant_01):
 * a photoscanned ficus in a terracotta pot. Taken from the 1k glTF at
 * 176k triangles and cut to ~10.2k with meshoptimizer (gltf-transform
 * simplify), diffuse maps at 512 and normal maps at 256, then
 * meshopt-compressed — 246 KB on the wire.
 *
 * Roughness/AO maps were dropped for constant roughness factors: at three
 * metres they were paying ~90 KB for detail no pixel resolves. The 1k
 * source ships no alpha channel, so the leaves are real geometry and the
 * material's MASK mode was a no-op — it is OPAQUE here, which also spares
 * the alpha-test branch on 6k triangles.
 *
 * The procedural plant above stays as the Suspense fallback.
 */
const PLANT_GLB = "/models/potted-plant.glb";

/** 1.336 m tall in the file; 0.72 puts it at 0.96 m with a 0.34 m pot, which
 *  is the footprint the procedural version was blocked out to occupy. */
const MODEL_SCALE = 0.72;
const MODEL_ROT: [number, number, number] = [0, 0.5, 0];

/** Model-space height where the stems leave the soil — the sway pivot. */
const FOLIAGE_PIVOT = 0.4;

/** Node names carrying stems and leaves; the pot and its fill stay put. */
const FOLIAGE_NODES = ["potted_plant_01_stem", "potted_plant_01_leaves"];

const MODEL_SWAY = 0.009;
const MODEL_SWAY_PERIOD = 11.3;

function PlantModel() {
  const reduced = usePrefersReducedMotion();
  const { scene } = useGLTF(PLANT_GLB, false);

  /**
   * The loaded scene is cached by url, so it is cloned before being taken
   * apart. Stems and leaves are re-parented under one group pivoted at the
   * soil line: that group is what sways, so the pot stays nailed to the
   * floor instead of rocking with the canopy.
   */
  const { root, pivot } = useMemo(() => {
    const root = scene.clone(true);
    const pivot = new THREE.Group();
    pivot.position.set(0, FOLIAGE_PIVOT, 0);

    for (const name of FOLIAGE_NODES) {
      const node = root.getObjectByName(name);
      if (!node) continue;
      node.position.y -= FOLIAGE_PIVOT;
      pivot.add(node);
    }
    root.add(pivot);

    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return { root, pivot };
  }, [scene]);

  // Same contract as the procedural version: one slow sine, well under the
  // threshold of notice, and nothing at all under reduced motion.
  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    const w = (Math.PI * 2) / MODEL_SWAY_PERIOD;
    pivot.rotation.z = Math.sin(t * w) * MODEL_SWAY;
    pivot.rotation.x = Math.sin(t * w * 0.73 + 3.7) * MODEL_SWAY * 0.7;
  });

  return <primitive object={root} position={POS} rotation={MODEL_ROT} scale={MODEL_SCALE} />;
}

useGLTF.preload(PLANT_GLB, false);

export function Plant() {
  return (
    <Suspense fallback={<ProceduralPlant />}>
      <PlantModel />
    </Suspense>
  );
}
