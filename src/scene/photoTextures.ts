import * as THREE from "three";

/**
 * Real-photo textures, perspective-corrected from close-ups of the actual
 * desk objects (see public/textures/). Loaded async; the material renders
 * untextured for a frame or two and fills in when the JPEG arrives, which
 * is invisible behind the intro fade.
 */

const cache = new Map<string, THREE.Texture>();

export function photoTexture(url: string): THREE.Texture {
  const hit = cache.get(url);
  if (hit) return hit;

  const tex = new THREE.TextureLoader().load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  cache.set(url, tex);
  return tex;
}
