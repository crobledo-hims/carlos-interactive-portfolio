import * as THREE from "three";
import {
  brushedRoughness,
  floorAlbedo,
  floorRoughness,
  leatheretteAlbedo,
  matAlbedo,
  matBump,
  nylonBump,
  pellicleAlbedo,
  pellicleBump,
  satinRoughness,
  suedeBump,
  wallBump,
  woodGrain,
} from "./textures";

/**
 * Shared material instances. Built once, lazily, on first render — the scene
 * is static so nothing here is ever recreated or disposed mid-session.
 */

export interface SceneMaterials {
  wall: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  trimWhite: THREE.MeshStandardMaterial;
  deskSteel: THREE.MeshPhysicalMaterial;
  deskSteelSide: THREE.MeshPhysicalMaterial;
  matSurface: THREE.MeshPhysicalMaterial;
  deviceBlack: THREE.MeshStandardMaterial;
  deviceBlackSoft: THREE.MeshStandardMaterial;
  glossBlack: THREE.MeshPhysicalMaterial;
  screenGlass: THREE.MeshPhysicalMaterial;
  graphite: THREE.MeshStandardMaterial;
  graphiteDark: THREE.MeshStandardMaterial;
  pellicle: THREE.MeshPhysicalMaterial;
  aluminiumPolished: THREE.MeshStandardMaterial;
  armWhite: THREE.MeshStandardMaterial;
  laptopShell: THREE.MeshStandardMaterial;
  whitePlastic: THREE.MeshPhysicalMaterial;
  pine: THREE.MeshStandardMaterial;
  walnut: THREE.MeshStandardMaterial;
  whitewashWood: THREE.MeshStandardMaterial;
  leatherette: THREE.MeshPhysicalMaterial;
  suede: THREE.MeshPhysicalMaterial;
  nylon: THREE.MeshPhysicalMaterial;
  tanLeather: THREE.MeshStandardMaterial;
  acrylic: THREE.MeshPhysicalMaterial;
  paperWhite: THREE.MeshStandardMaterial;
  glassTape: THREE.MeshPhysicalMaterial;
}

let cache: SceneMaterials | null = null;

function repeated(tex: THREE.Texture, x: number, y: number): THREE.Texture {
  const clone = tex.clone();
  clone.needsUpdate = true;
  clone.wrapS = THREE.RepeatWrapping;
  clone.wrapT = THREE.RepeatWrapping;
  clone.repeat.set(x, y);
  return clone;
}

export function materials(): SceneMaterials {
  if (cache) return cache;

  const floorMap = repeated(floorAlbedo(), 5.55, 5.55);
  const floorRough = repeated(floorRoughness(), 5.55, 5.55);
  const wallNoise = repeated(wallBump(), 6, 3);
  const satin = repeated(satinRoughness(), 3, 3);
  const wood = woodGrain();

  cache = {
    wall: new THREE.MeshStandardMaterial({
      color: "#d9d5cc",
      roughness: 0.96,
      metalness: 0,
      bumpMap: wallNoise,
      bumpScale: 0.0016,
    }),

    floor: new THREE.MeshStandardMaterial({
      color: "#ffffff",
      map: floorMap,
      roughnessMap: floorRough,
      roughness: 0.62,
      metalness: 0,
    }),

    trimWhite: new THREE.MeshStandardMaterial({
      color: "#f7f6f2",
      roughness: 0.42,
      metalness: 0,
      roughnessMap: satin,
    }),

    // MAGNUS Pro top: powder-coated steel, satin with a faint clearcoat
    deskSteel: new THREE.MeshPhysicalMaterial({
      color: "#f1f1ed",
      roughness: 0.45,
      metalness: 0.12,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
      roughnessMap: repeated(satinRoughness(), 6, 3),
    }),
    deskSteelSide: new THREE.MeshPhysicalMaterial({
      color: "#ececea",
      roughness: 0.5,
      metalness: 0.1,
      clearcoat: 0.25,
      clearcoatRoughness: 0.45,
    }),

    // MAGPAD: leatherette, slightly warmer white than the steel
    matSurface: new THREE.MeshPhysicalMaterial({
      map: matAlbedo(),
      bumpMap: matBump(),
      bumpScale: 0.0009,
      roughness: 0.66,
      metalness: 0,
      sheen: 0.35,
      sheenRoughness: 0.75,
      sheenColor: new THREE.Color("#fff6e6"),
    }),

    deviceBlack: new THREE.MeshStandardMaterial({
      color: "#1a1a1c",
      roughness: 0.66,
      metalness: 0.18,
      roughnessMap: satin,
    }),
    deviceBlackSoft: new THREE.MeshStandardMaterial({
      color: "#232326",
      roughness: 0.88,
      metalness: 0.02,
    }),
    glossBlack: new THREE.MeshPhysicalMaterial({
      color: "#0a0b0d",
      roughness: 0.09,
      metalness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),

    // Panel glass: reads as dark "off" glass, keeps the blue emissive base so
    // the DOM overlay hand-off still lands on the same tone.
    screenGlass: new THREE.MeshPhysicalMaterial({
      color: "#0d1220",
      emissive: new THREE.Color("#1a2333"),
      emissiveIntensity: 1.1,
      roughness: 0.085,
      metalness: 0.0,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      reflectivity: 0.68,
      envMapIntensity: 0.95,
    }),

    graphite: new THREE.MeshStandardMaterial({
      color: "#4a4a50",
      roughness: 0.5,
      metalness: 0.28,
      roughnessMap: satin,
    }),
    graphiteDark: new THREE.MeshStandardMaterial({
      color: "#37373d",
      roughness: 0.66,
      metalness: 0.16,
    }),

    pellicle: new THREE.MeshPhysicalMaterial({
      map: repeated(pellicleAlbedo(), 14, 18),
      bumpMap: repeated(pellicleBump(), 14, 18),
      bumpScale: 0.0022,
      color: "#b9bcc4",
      roughness: 0.74,
      metalness: 0.04,
      sheen: 0.7,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color("#c8cedb"),
      side: THREE.DoubleSide,
    }),

    aluminiumPolished: new THREE.MeshStandardMaterial({
      color: "#b9bcc2",
      roughness: 0.17,
      metalness: 0.92,
    }),

    armWhite: new THREE.MeshStandardMaterial({
      color: "#e4e4e0",
      roughness: 0.33,
      metalness: 0.55,
      roughnessMap: satin,
    }),

    laptopShell: new THREE.MeshStandardMaterial({
      color: "#c9ccd1",
      roughness: 0.34,
      metalness: 0.88,
      roughnessMap: repeated(brushedRoughness(), 2, 1.4),
    }),

    // glossy ABS with a warm sheen standing in for subsurface bounce
    whitePlastic: new THREE.MeshPhysicalMaterial({
      color: "#f7f8f4",
      roughness: 0.24,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.07,
      sheen: 0.6,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color("#ffd7ab"),
    }),

    pine: new THREE.MeshStandardMaterial({
      color: "#d8b283",
      map: repeated(wood, 1, 1),
      roughness: 0.72,
      metalness: 0,
    }),
    walnut: new THREE.MeshStandardMaterial({
      color: "#4a3122",
      map: repeated(wood, 2.2, 1),
      roughness: 0.44,
      metalness: 0.06,
    }),
    whitewashWood: new THREE.MeshStandardMaterial({
      color: "#eae5dc",
      map: repeated(wood, 1.6, 1.6),
      roughness: 0.7,
      metalness: 0,
    }),

    leatherette: new THREE.MeshPhysicalMaterial({
      map: leatheretteAlbedo(),
      roughness: 0.58,
      metalness: 0.03,
      clearcoat: 0.35,
      clearcoatRoughness: 0.55,
    }),

    suede: new THREE.MeshPhysicalMaterial({
      color: "#a9b4c0",
      roughness: 0.97,
      metalness: 0,
      bumpMap: repeated(suedeBump(), 5, 5),
      bumpScale: 0.0016,
      sheen: 0.85,
      sheenRoughness: 0.85,
      sheenColor: new THREE.Color("#d3dce6"),
    }),

    nylon: new THREE.MeshPhysicalMaterial({
      color: "#1d1e22",
      roughness: 0.86,
      metalness: 0.04,
      bumpMap: repeated(nylonBump(), 8, 8),
      bumpScale: 0.0018,
      sheen: 0.4,
      sheenRoughness: 0.7,
      sheenColor: new THREE.Color("#6a707c"),
    }),

    tanLeather: new THREE.MeshStandardMaterial({
      color: "#a8794e",
      roughness: 0.62,
      metalness: 0,
    }),

    // clear acrylic slab: fakes transmission with a thin transparent shell so
    // no per-frame transmission pass is needed
    acrylic: new THREE.MeshPhysicalMaterial({
      color: "#e9f1f5",
      transparent: true,
      opacity: 0.22,
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),

    paperWhite: new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.94,
      metalness: 0,
    }),

    glassTape: new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.24,
      roughness: 0.28,
      metalness: 0,
      clearcoat: 0.6,
      depthWrite: false,
    }),
  };

  return cache;
}
