import * as THREE from "three";

/**
 * Every surface in this scene is procedural: no external images, no HDRIs.
 * This module owns the CanvasTexture factory + all painters, keyed and cached
 * so a texture is generated at most once per session and shared by every mesh
 * that references it.
 */

/* ------------------------------------------------------------------ */
/* infrastructure                                                      */
/* ------------------------------------------------------------------ */

/** Deterministic PRNG so the room looks identical on every load. */
export function prng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export interface TexOptions {
  /** true for roughness / bump / alpha maps (keeps values linear). */
  data?: boolean;
  repeat?: [number, number];
  clamp?: boolean;
  aniso?: number;
}

const texCache = new Map<string, THREE.CanvasTexture>();

export function makeTexture(
  key: string,
  w: number,
  h: number,
  paint: Painter,
  opts: TexOptions = {},
): THREE.CanvasTexture {
  const hit = texCache.get(key);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) paint(ctx, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = opts.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  const wrap = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  tex.wrapS = wrap;
  tex.wrapT = wrap;
  if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  tex.anisotropy = opts.aniso ?? 4;
  tex.needsUpdate = true;
  texCache.set(key, tex);
  return tex;
}

/** Rounded rect path (hand-rolled: avoids relying on ctx.roundRect support). */
export function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

function hsl(h: number, s: number, l: number, a = 1): string {
  return a >= 1 ? `hsl(${h}, ${s}%, ${l}%)` : `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

/** Fine grey speckle, used to break up flat roughness fields. */
function speckle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  count: number,
  amp: number,
  base: number,
): void {
  const rnd = prng(seed);
  ctx.fillStyle = `rgb(${base},${base},${base})`;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < count; i++) {
    const v = Math.round(base + (rnd() - 0.5) * amp * 2);
    const r = 1 + rnd() * 3;
    ctx.fillStyle = `rgba(${v},${v},${v},0.5)`;
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ------------------------------------------------------------------ */
/* room                                                                */
/* ------------------------------------------------------------------ */

/**
 * LVP plank floor. One tile covers 1.8 m x 1.8 m -> 10 plank rows of 18 cm,
 * two 90 cm planks per row with a staggered running bond. Per-plank hue jitter
 * plus swept grain keeps the repeat from reading.
 */
export function floorAlbedo(): THREE.CanvasTexture {
  return makeTexture("floor-albedo", 1024, 1024, (ctx, W, H) => {
    const rnd = prng(4471);
    const rows = 10;
    const rowH = H / rows;
    const plankW = W / 2;

    ctx.fillStyle = "#8c5f38";
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < rows; r++) {
      const y0 = r * rowH;
      const offset = ((r * 0.383) % 1) * plankW;

      for (let k = -1; k <= 2; k++) {
        const x0 = offset + k * plankW;
        const hue = 27 + (rnd() - 0.5) * 8;
        const sat = 34 + (rnd() - 0.5) * 13;
        const lig = 43 + (rnd() - 0.5) * 10;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, y0, plankW, rowH);
        ctx.clip();

        ctx.fillStyle = hsl(hue, sat, lig);
        ctx.fillRect(x0 - 2, y0 - 2, plankW + 4, rowH + 4);

        // long-axis grain: soft swept strokes with the odd tight cathedral
        for (let g = 0; g < 120; g++) {
          const gy = y0 + rnd() * rowH;
          const dark = rnd() > 0.42;
          const amp = 2 + rnd() * 7;
          ctx.strokeStyle = hsl(
            hue + (dark ? -3 : 4),
            sat + (dark ? 6 : -8),
            lig + (dark ? -7 - rnd() * 8 : 7 + rnd() * 7),
            0.12 + rnd() * 0.22,
          );
          ctx.lineWidth = 0.6 + rnd() * 2.1;
          ctx.beginPath();
          ctx.moveTo(x0 - 4, gy);
          ctx.bezierCurveTo(
            x0 + plankW * 0.3,
            gy + (rnd() - 0.5) * amp,
            x0 + plankW * 0.7,
            gy + (rnd() - 0.5) * amp,
            x0 + plankW + 4,
            gy + (rnd() - 0.5) * amp * 0.5,
          );
          ctx.stroke();
        }

        // occasional knot
        if (rnd() > 0.55) {
          const kx = x0 + 40 + rnd() * (plankW - 80);
          const ky = y0 + rowH * (0.3 + rnd() * 0.4);
          for (let n = 0; n < 5; n++) {
            ctx.strokeStyle = hsl(hue - 4, sat + 10, lig - 12, 0.3 - n * 0.045);
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(kx, ky, 4 + n * 4.5, 2 + n * 2.2, 0.2, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.restore();

        // micro-bevel between planks: shadow on one side, catch-light on the other
        ctx.fillStyle = "rgba(46,26,12,0.42)";
        ctx.fillRect(x0, y0, 2.2, rowH);
        ctx.fillStyle = "rgba(255,232,200,0.14)";
        ctx.fillRect(x0 + 2.2, y0, 1.2, rowH);
      }

      ctx.fillStyle = "rgba(46,26,12,0.34)";
      ctx.fillRect(0, y0, W, 2.2);
      ctx.fillStyle = "rgba(255,232,200,0.12)";
      ctx.fillRect(0, y0 + 2.2, W, 1.2);
    }

    // broad tonal mottle so 5x5 tiling does not read as a checkerboard
    for (let i = 0; i < 26; i++) {
      const g = ctx.createRadialGradient(
        rnd() * W,
        rnd() * H,
        10,
        rnd() * W,
        rnd() * H,
        160 + rnd() * 240,
      );
      const warm = rnd() > 0.5;
      g.addColorStop(0, warm ? "rgba(255,214,160,0.05)" : "rgba(60,34,16,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  });
}

/** Matching floor roughness: seams glossier, plank faces satin, blotchy wear. */
export function floorRoughness(): THREE.CanvasTexture {
  return makeTexture(
    "floor-rough",
    512,
    512,
    (ctx, W, H) => {
      const rnd = prng(881);
      speckle(ctx, W, H, 881, 2600, 16, 158);
      const rows = 10;
      for (let r = 0; r < rows; r++) {
        const y0 = (r * H) / rows;
        ctx.fillStyle = "rgba(210,210,210,0.85)";
        ctx.fillRect(0, y0, W, 1.6);
        const offset = ((r * 0.383) % 1) * (W / 2);
        for (let k = -1; k <= 2; k++) {
          ctx.fillRect(offset + k * (W / 2), y0, 1.4, H / rows);
        }
      }
      for (let i = 0; i < 40; i++) {
        const g = ctx.createRadialGradient(
          rnd() * W,
          rnd() * H,
          4,
          rnd() * W,
          rnd() * H,
          40 + rnd() * 110,
        );
        g.addColorStop(0, rnd() > 0.5 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    },
    { data: true },
  );
}

/** Orange-peel wall paint. Used as a bump map only; colour stays flat greige. */
export function wallBump(): THREE.CanvasTexture {
  return makeTexture(
    "wall-bump",
    512,
    512,
    (ctx, W, H) => {
      speckle(ctx, W, H, 2027, 5200, 26, 128);
      const rnd = prng(3311);
      for (let i = 0; i < 900; i++) {
        const v = 128 + (rnd() - 0.5) * 44;
        ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
        ctx.beginPath();
        ctx.ellipse(rnd() * W, rnd() * H, 2 + rnd() * 6, 2 + rnd() * 6, rnd() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { data: true },
  );
}

/** Very light satin break-up for powder-coated steel and painted trim. */
export function satinRoughness(): THREE.CanvasTexture {
  return makeTexture(
    "satin-rough",
    256,
    256,
    (ctx, W, H) => {
      speckle(ctx, W, H, 5501, 1400, 12, 120);
    },
    { data: true },
  );
}

/** Warm gradient equirect used as scene.environment (procedural IBL). */
export function envEquirect(): THREE.CanvasTexture {
  return makeTexture(
    "env-equirect",
    512,
    256,
    (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0.0, "#fff6e6");
      g.addColorStop(0.42, "#f4ecdd");
      g.addColorStop(0.52, "#ddd5c8");
      g.addColorStop(0.78, "#a2764c");
      g.addColorStop(1.0, "#6d4b2c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // late-afternoon window: a hot warm slab plus a soft bounce opposite it
      const win = ctx.createRadialGradient(W * 0.27, H * 0.36, 4, W * 0.27, H * 0.36, W * 0.2);
      win.addColorStop(0, "#ffffff");
      win.addColorStop(0.35, "#ffe9c4");
      win.addColorStop(1, "rgba(255,233,196,0)");
      ctx.fillStyle = win;
      ctx.fillRect(0, 0, W, H);

      const bounce = ctx.createRadialGradient(W * 0.78, H * 0.5, 4, W * 0.78, H * 0.5, W * 0.26);
      bounce.addColorStop(0, "rgba(255,241,222,0.55)");
      bounce.addColorStop(1, "rgba(255,241,222,0)");
      ctx.fillStyle = bounce;
      ctx.fillRect(0, 0, W, H);

      // slat banding inside the window blob so glossy props catch louver lines
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#c8b596";
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(W * 0.13, H * (0.2 + i * 0.045), W * 0.28, H * 0.014);
      }
      ctx.globalAlpha = 1;
    },
    { clamp: true },
  );
}

/** Blown-out daylight seen through the shutters. */
export function skyGlow(): THREE.CanvasTexture {
  return makeTexture(
    "sky-glow",
    128,
    128,
    (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.55, "#fff4dd");
      g.addColorStop(0.8, "#f6e3c2");
      g.addColorStop(1, "#e6d6b8");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },
    { clamp: true },
  );
}

/* ------------------------------------------------------------------ */
/* desk                                                                */
/* ------------------------------------------------------------------ */

const SEVEN_SEG: Record<string, boolean[]> = {
  // a, b, c, d, e, f, g
  "0": [true, true, true, true, true, true, false],
  "1": [false, true, true, false, false, false, false],
  "2": [true, true, false, true, true, false, true],
  "3": [true, true, true, true, false, false, true],
  "4": [false, true, true, false, false, true, true],
  "5": [true, false, true, true, false, true, true],
  "6": [true, false, true, true, true, true, true],
  "7": [true, true, true, false, false, false, false],
  "8": [true, true, true, true, true, true, true],
  "9": [true, true, true, true, false, true, true],
};

function drawSevenSeg(
  ctx: CanvasRenderingContext2D,
  digit: string,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  colour: string,
): void {
  const segs = SEVEN_SEG[digit];
  if (!segs) return;
  ctx.fillStyle = colour;
  const half = h / 2;
  const bar = (bx: number, by: number, bw: number, bh: number) => ctx.fillRect(bx, by, bw, bh);
  if (segs[0]) bar(x + t, y, w - t * 2, t); // a
  if (segs[1]) bar(x + w - t, y + t, t, half - t * 1.5); // b
  if (segs[2]) bar(x + w - t, y + half + t * 0.5, t, half - t * 1.5); // c
  if (segs[3]) bar(x + t, y + h - t, w - t * 2, t); // d
  if (segs[4]) bar(x, y + half + t * 0.5, t, half - t * 1.5); // e
  if (segs[5]) bar(x, y + t, t, half - t * 1.5); // f
  if (segs[6]) bar(x + t, y + half - t * 0.5, w - t * 2, t); // g
}

/**
 * MAGNUS Pro front-edge control strip: dark glass with a glowing height
 * readout, tilt glyphs and preset dots. Doubles as the emissive map, so the
 * background is near-black and only the lit elements carry any value.
 */
export function controlStrip(): THREE.CanvasTexture {
  return makeTexture(
    "desk-control-strip",
    1024,
    128,
    (ctx, W, H) => {
      ctx.fillStyle = "#07080a";
      ctx.fillRect(0, 0, W, H);

      // faint gloss sweep across the glass
      const sweep = ctx.createLinearGradient(0, 0, W, H);
      sweep.addColorStop(0, "rgba(90,100,120,0.10)");
      sweep.addColorStop(0.35, "rgba(20,24,30,0.02)");
      sweep.addColorStop(0.62, "rgba(120,130,150,0.09)");
      sweep.addColorStop(1, "rgba(20,24,30,0.02)");
      ctx.fillStyle = sweep;
      ctx.fillRect(0, 0, W, H);

      // "143" seven-segment readout
      ctx.shadowColor = "rgba(226,238,255,0.9)";
      ctx.shadowBlur = 14;
      const digits = "143";
      const dw = 44;
      const dh = 74;
      for (let i = 0; i < digits.length; i++) {
        drawSevenSeg(ctx, digits[i], 96 + i * (dw + 18), 27, dw, dh, 8, "#eaf2ff");
      }
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(190,205,225,0.55)";
      ctx.font = `500 24px ${SANS}`;
      ctx.textBaseline = "alphabetic";
      ctx.fillText("cm", 292, 101);

      // tilt glyphs
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(120,240,160,0.8)";
      ctx.fillStyle = "#7ef0a2";
      ctx.beginPath();
      ctx.moveTo(432, 36);
      ctx.lineTo(462, 82);
      ctx.lineTo(402, 82);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = "rgba(255,110,110,0.8)";
      ctx.fillStyle = "#ff8080";
      ctx.beginPath();
      ctx.moveTo(524, 82);
      ctx.lineTo(554, 36);
      ctx.lineTo(494, 36);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // preset dots — one active
      const presets = ["#39424e", "#39424e", "#cfe0f5", "#39424e"];
      for (let i = 0; i < presets.length; i++) {
        ctx.fillStyle = presets[i];
        if (i === 2) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(207,224,245,0.9)";
        }
        ctx.beginPath();
        ctx.arc(672 + i * 62, 62, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // hairline bezel top/bottom
      ctx.fillStyle = "rgba(150,160,175,0.16)";
      ctx.fillRect(0, 0, W, 2);
      ctx.fillRect(0, H - 2, W, 2);
    },
    { clamp: true },
  );
}

/** MAGPAD leatherette: pebble grain, inset stitch box, embossed wordmark. */
export function matAlbedo(): THREE.CanvasTexture {
  return makeTexture(
    "mat-albedo",
    1024,
    448,
    (ctx, W, H) => {
      const rnd = prng(7742);
      ctx.fillStyle = "#efe8d8";
      ctx.fillRect(0, 0, W, H);

      // pebble grain
      for (let i = 0; i < 9000; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        const r = 1.2 + rnd() * 3.6;
        const light = rnd() > 0.5;
        ctx.fillStyle = light ? "rgba(255,255,252,0.30)" : "rgba(196,190,176,0.22)";
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * (0.6 + rnd() * 0.6), rnd() * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // very soft usage sheen where the keyboard and mouse live
      const wear = ctx.createRadialGradient(W * 0.55, H * 0.55, 20, W * 0.55, H * 0.55, W * 0.34);
      wear.addColorStop(0, "rgba(228,222,206,0.18)");
      wear.addColorStop(1, "rgba(228,222,206,0)");
      ctx.fillStyle = wear;
      ctx.fillRect(0, 0, W, H);

      // stitched border seam, 14 mm in from the edge
      const inset = 16;
      ctx.save();
      ctx.setLineDash([11, 8]);
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = "rgba(146,138,122,0.55)";
      rr(ctx, inset, inset, W - inset * 2, H - inset * 2, 12);
      ctx.stroke();
      // stitch relief: bright above, shadow below
      ctx.translate(0, -1.6);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      rr(ctx, inset, inset, W - inset * 2, H - inset * 2, 12);
      ctx.stroke();
      ctx.restore();

      // folded edge line just outside the stitch
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(206,199,184,0.5)";
      rr(ctx, 6, 6, W - 12, H - 12, 10);
      ctx.stroke();

      // subtle embossed wordmark near the right corner
      ctx.save();
      ctx.font = `600 21px ${SANS}`;
      ctx.textAlign = "right";
      ctx.letterSpacing = "5px";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText("MAGPAD", W - 52, H - 52);
      ctx.fillStyle = "rgba(176,168,152,0.55)";
      ctx.fillText("MAGPAD", W - 52.5, H - 53.4);
      ctx.restore();
    },
    { clamp: true },
  );
}

export function matBump(): THREE.CanvasTexture {
  return makeTexture(
    "mat-bump",
    512,
    224,
    (ctx, W, H) => {
      const rnd = prng(7743);
      speckle(ctx, W, H, 7743, 3000, 18, 128);
      const inset = 8;
      ctx.setLineDash([5.5, 4]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#f2f2f2";
      rr(ctx, inset, inset, W - inset * 2, H - inset * 2, 6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#5a5a5a";
      rr(ctx, 3, 3, W - 6, H - 6, 5);
      ctx.stroke();
      for (let i = 0; i < 1200; i++) {
        const v = 128 + (rnd() - 0.5) * 36;
        ctx.fillStyle = `rgba(${v},${v},${v},0.4)`;
        ctx.beginPath();
        ctx.arc(rnd() * W, rnd() * H, 1 + rnd() * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { data: true, clamp: true },
  );
}

/* ------------------------------------------------------------------ */
/* monitors                                                            */
/* ------------------------------------------------------------------ */

/** Tiny brand suggestion for the monitor chin (transparent background). */
export function monitorChin(): THREE.CanvasTexture {
  return makeTexture(
    "monitor-chin",
    128,
    64,
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(188,190,195,0.78)";
      ctx.font = `600 34px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "2px";
      ctx.fillText("LG", W / 2, H / 2 + 2);
    },
    { clamp: true },
  );
}

/* ------------------------------------------------------------------ */
/* peripherals                                                         */
/* ------------------------------------------------------------------ */

/** Fine brushed-aluminium roughness streaks for the MacBook lid. */
export function brushedRoughness(): THREE.CanvasTexture {
  return makeTexture(
    "brushed-rough",
    512,
    512,
    (ctx, W, H) => {
      const rnd = prng(3141);
      ctx.fillStyle = "rgb(96,96,96)";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 5200; i++) {
        const y = rnd() * H;
        const v = 96 + (rnd() - 0.5) * 34;
        ctx.strokeStyle = `rgba(${v},${v},${v},0.35)`;
        ctx.lineWidth = 0.6 + rnd() * 1.4;
        ctx.beginPath();
        ctx.moveTo(rnd() * W - 120, y);
        ctx.lineTo(rnd() * W + 120, y + (rnd() - 0.5) * 1.4);
        ctx.stroke();
      }
    },
    { data: true },
  );
}

/** MacBook lid decal: abstract rounded glyph + a small white "hims" sticker. */
export function laptopLid(): THREE.CanvasTexture {
  return makeTexture(
    "laptop-lid",
    512,
    384,
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);

      // abstract centred mark: a soft rounded lozenge with a notch
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.fillStyle = "rgba(74,78,84,0.85)";
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.bezierCurveTo(30, -34, 42, -12, 42, 8);
      ctx.bezierCurveTo(42, 30, 24, 42, 0, 42);
      ctx.bezierCurveTo(-24, 42, -42, 30, -42, 8);
      ctx.bezierCurveTo(-42, -12, -30, -34, 0, -34);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.ellipse(16, -32, 15, 12, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();

      // "hims" sticker near a corner
      ctx.save();
      ctx.translate(W * 0.185, H * 0.79);
      ctx.rotate(-0.05);
      rr(ctx, -44, -17, 88, 34, 6);
      ctx.fillStyle = "rgba(252,252,250,0.95)";
      ctx.fill();
      ctx.fillStyle = "#2a2a2c";
      ctx.font = `700 21px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "1px";
      ctx.fillText("hims", 0, 1);
      ctx.restore();
    },
    { clamp: true },
  );
}

/** Tiny "logi" wordmark for the keyboard's top edge strip. */
export function logiStrip(): THREE.CanvasTexture {
  return makeTexture(
    "logi-strip",
    256,
    32,
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(88,88,90,0.7)";
      ctx.font = `600 17px ${SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "1px";
      ctx.fillText("logi", W / 2, H / 2 + 1);
    },
    { clamp: true },
  );
}

/**
 * Mouse shell wrap. u (x axis) runs around the cross-section:
 * 0 = right flank, 0.25 = top ridge, 0.5 = thumb flank, 0.75 = underside.
 * v (y axis) runs back -> front.
 */
export function mouseAlbedo(): THREE.CanvasTexture {
  return makeTexture(
    "mouse-albedo",
    512,
    512,
    (ctx, W, H) => {
      const rnd = prng(5150);
      ctx.fillStyle = "#3a3c40";
      ctx.fillRect(0, 0, W, H);

      // top ridge slightly lighter
      const top = ctx.createLinearGradient(0, 0, W, 0);
      top.addColorStop(0.0, "rgba(70,73,78,0.0)");
      top.addColorStop(0.25, "rgba(84,88,94,0.55)");
      top.addColorStop(0.5, "rgba(70,73,78,0.0)");
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, W, H);

      // underside dark
      ctx.fillStyle = "rgba(16,17,19,0.75)";
      ctx.fillRect(W * 0.66, 0, W * 0.18, H);

      // thumb-side rubber zone: darker with a pebble grain
      ctx.save();
      ctx.beginPath();
      ctx.rect(W * 0.4, H * 0.2, W * 0.22, H * 0.56);
      ctx.clip();
      ctx.fillStyle = "#232529";
      ctx.fillRect(W * 0.4, H * 0.2, W * 0.22, H * 0.56);
      for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = rnd() > 0.5 ? "rgba(70,74,80,0.5)" : "rgba(8,9,11,0.5)";
        ctx.beginPath();
        ctx.arc(W * 0.4 + rnd() * W * 0.22, H * 0.2 + rnd() * H * 0.56, 1 + rnd() * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // right flank rubber grip strip
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, H * 0.26, W * 0.055, H * 0.42);
      ctx.clip();
      ctx.fillStyle = "#26282c";
      ctx.fillRect(0, H * 0.26, W * 0.055, H * 0.42);
      for (let i = 0; i < 500; i++) {
        ctx.fillStyle = "rgba(66,70,76,0.5)";
        ctx.beginPath();
        ctx.arc(rnd() * W * 0.055, H * 0.26 + rnd() * H * 0.42, 1 + rnd() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // button split lines
      ctx.strokeStyle = "rgba(12,13,15,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W * 0.25, H * 0.6);
      ctx.lineTo(W * 0.25, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.6);
      ctx.bezierCurveTo(W * 0.2, H * 0.58, W * 0.3, H * 0.58, W * 0.42, H * 0.6);
      ctx.stroke();
      ctx.strokeStyle = "rgba(96,100,108,0.3)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.605);
      ctx.bezierCurveTo(W * 0.2, H * 0.585, W * 0.3, H * 0.585, W * 0.42, H * 0.605);
      ctx.stroke();

      // side buttons on the thumb flank
      ctx.fillStyle = "rgba(20,21,24,0.9)";
      rr(ctx, W * 0.455, H * 0.55, W * 0.09, H * 0.055, 6);
      ctx.fill();
      rr(ctx, W * 0.455, H * 0.63, W * 0.09, H * 0.055, 6);
      ctx.fill();

      // fine soft-touch grain overall
      for (let i = 0; i < 5200; i++) {
        ctx.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.05)";
        ctx.fillRect(rnd() * W, rnd() * H, 1.6, 1.6);
      }
    },
    { clamp: true },
  );
}

export function mouseRoughness(): THREE.CanvasTexture {
  return makeTexture(
    "mouse-rough",
    256,
    256,
    (ctx, W, H) => {
      const rnd = prng(5151);
      ctx.fillStyle = "rgb(120,120,120)";
      ctx.fillRect(0, 0, W, H);
      // rubber zones much rougher
      ctx.fillStyle = "rgb(205,205,205)";
      ctx.fillRect(W * 0.4, H * 0.2, W * 0.22, H * 0.56);
      ctx.fillRect(0, H * 0.26, W * 0.055, H * 0.42);
      // top shell a touch glossier
      ctx.fillStyle = "rgba(86,86,86,0.7)";
      ctx.fillRect(W * 0.16, 0, W * 0.18, H);
      for (let i = 0; i < 3000; i++) {
        const v = 120 + (rnd() - 0.5) * 40;
        ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
        ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
      }
    },
    { data: true, clamp: true },
  );
}

/** Black leatherette with an inset stitch line — Razer-style wrist rest. */
export function leatheretteAlbedo(): THREE.CanvasTexture {
  return makeTexture(
    "leatherette-albedo",
    512,
    128,
    (ctx, W, H) => {
      const rnd = prng(6600);
      ctx.fillStyle = "#17171a";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 7000; i++) {
        ctx.fillStyle = rnd() > 0.5 ? "rgba(58,60,66,0.35)" : "rgba(4,4,6,0.4)";
        ctx.beginPath();
        ctx.ellipse(rnd() * W, rnd() * H, 1.2 + rnd() * 3, 1 + rnd() * 2.4, rnd() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.setLineDash([9, 7]);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = "rgba(96,98,104,0.55)";
      rr(ctx, 12, 12, W - 24, H - 24, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      const sheen = ctx.createLinearGradient(0, 0, 0, H);
      sheen.addColorStop(0, "rgba(150,155,165,0.10)");
      sheen.addColorStop(0.4, "rgba(0,0,0,0)");
      sheen.addColorStop(1, "rgba(0,0,0,0.25)");
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, W, H);
    },
    { clamp: true },
  );
}

/** Dock front face: recessed port slots, status LEDs, tiny white label. */
export function dockFront(): THREE.CanvasTexture {
  return makeTexture(
    "dock-front",
    512,
    128,
    (ctx, W, H) => {
      ctx.fillStyle = "#121214";
      ctx.fillRect(0, 0, W, H);
      const ports: [number, number, number, number][] = [
        [42, 44, 62, 30],
        [122, 44, 62, 30],
        [202, 50, 34, 18],
        [252, 50, 34, 18],
        [306, 46, 46, 26],
      ];
      for (const [x, y, w, h] of ports) {
        ctx.fillStyle = "#050506";
        rr(ctx, x, y, w, h, 4);
        ctx.fill();
        ctx.strokeStyle = "rgba(120,124,132,0.35)";
        ctx.lineWidth = 1.6;
        rr(ctx, x, y, w, h, 4);
        ctx.stroke();
        ctx.fillStyle = "rgba(150,154,162,0.30)";
        ctx.fillRect(x + 5, y + h * 0.58, w - 10, 3);
      }
      // status LEDs
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(120,220,150,0.9)";
      ctx.fillStyle = "#7de29a";
      ctx.beginPath();
      ctx.arc(376, 59, 4.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = "rgba(120,180,255,0.9)";
      ctx.fillStyle = "#8ec2ff";
      ctx.beginPath();
      ctx.arc(392, 59, 4.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // tiny white label
      ctx.fillStyle = "rgba(228,228,228,0.72)";
      ctx.font = `600 15px ${SANS}`;
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "2px";
      ctx.fillText("WAVLINK", 424, 60);
      ctx.letterSpacing = "0px";
    },
    { clamp: true },
  );
}

/* ------------------------------------------------------------------ */
/* chair, soft goods, wood                                             */
/* ------------------------------------------------------------------ */

/** Woven pellicle. Tiles at ~3.2 cm; repeat is set per-surface. */
export function pellicleAlbedo(): THREE.CanvasTexture {
  return makeTexture("pellicle-albedo", 256, 256, (ctx, W, H) => {
    const cells = 16;
    const c = W / cells;
    ctx.fillStyle = "#34353a";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const over = (i + j) % 2 === 0;
        const x = i * c;
        const y = j * c;
        // strand: horizontal on top for "over", vertical otherwise
        const g = ctx.createLinearGradient(x, y, over ? x : x + c, over ? y + c : y);
        g.addColorStop(0, "#4a4d54");
        g.addColorStop(0.45, "#9498a1");
        g.addColorStop(0.75, "#6d7178");
        g.addColorStop(1, "#3c3e44");
        ctx.fillStyle = g;
        if (over) ctx.fillRect(x, y + c * 0.13, c, c * 0.74);
        else ctx.fillRect(x + c * 0.13, y, c * 0.74, c);
      }
    }
    // shadow into the interstices
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    for (let i = 0; i <= cells; i++) {
      ctx.fillRect(i * c - 0.6, 0, 1.2, H);
      ctx.fillRect(0, i * c - 0.6, W, 1.2);
    }
  });
}

export function pellicleBump(): THREE.CanvasTexture {
  return makeTexture(
    "pellicle-bump",
    256,
    256,
    (ctx, W, H) => {
      const cells = 16;
      const c = W / cells;
      ctx.fillStyle = "rgb(96,96,96)";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
          const over = (i + j) % 2 === 0;
          const x = i * c;
          const y = j * c;
          const g = ctx.createLinearGradient(x, y, over ? x : x + c, over ? y + c : y);
          g.addColorStop(0, "rgb(70,70,70)");
          g.addColorStop(0.5, "rgb(215,215,215)");
          g.addColorStop(1, "rgb(70,70,70)");
          ctx.fillStyle = g;
          if (over) ctx.fillRect(x, y + c * 0.13, c, c * 0.74);
          else ctx.fillRect(x + c * 0.13, y, c * 0.74, c);
        }
      }
    },
    { data: true },
  );
}

/** Generic wood grain, tinted per prop via material colour. */
export function woodGrain(): THREE.CanvasTexture {
  return makeTexture("wood-grain", 512, 512, (ctx, W, H) => {
    const rnd = prng(9021);
    ctx.fillStyle = "#b9a189";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 340; i++) {
      const y = rnd() * H;
      const dark = rnd() > 0.4;
      ctx.strokeStyle = dark
        ? `rgba(112,88,64,${0.10 + rnd() * 0.28})`
        : `rgba(240,228,212,${0.08 + rnd() * 0.22})`;
      ctx.lineWidth = 0.8 + rnd() * 4.5;
      ctx.beginPath();
      ctx.moveTo(-10, y);
      ctx.bezierCurveTo(
        W * 0.3,
        y + (rnd() - 0.5) * 26,
        W * 0.7,
        y + (rnd() - 0.5) * 26,
        W + 10,
        y + (rnd() - 0.5) * 14,
      );
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const kx = rnd() * W;
      const ky = rnd() * H;
      for (let n = 0; n < 7; n++) {
        ctx.strokeStyle = `rgba(104,80,58,${0.24 - n * 0.03})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(kx, ky, 4 + n * 6, 2.4 + n * 3, 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });
}

/** Suede nap for the dog bed. Colour comes from the material. */
export function suedeBump(): THREE.CanvasTexture {
  return makeTexture(
    "suede-bump",
    256,
    256,
    (ctx, W, H) => {
      const rnd = prng(1717);
      ctx.fillStyle = "rgb(122,122,122)";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 9000; i++) {
        const v = 122 + (rnd() - 0.5) * 60;
        ctx.strokeStyle = `rgba(${v},${v},${v},0.4)`;
        ctx.lineWidth = 0.8;
        const x = rnd() * W;
        const y = rnd() * H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rnd() - 0.5) * 5, y + (rnd() - 0.5) * 5);
        ctx.stroke();
      }
    },
    { data: true },
  );
}

/** Ballistic-nylon weave for the backpack. */
export function nylonBump(): THREE.CanvasTexture {
  return makeTexture(
    "nylon-bump",
    256,
    256,
    (ctx, W, H) => {
      const rnd = prng(2626);
      ctx.fillStyle = "rgb(110,110,110)";
      ctx.fillRect(0, 0, W, H);
      const c = 8;
      for (let y = 0; y < H; y += c) {
        for (let x = 0; x < W; x += c) {
          const over = ((x / c + y / c) | 0) % 2 === 0;
          const v = 110 + (over ? 44 : -40) + (rnd() - 0.5) * 18;
          ctx.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`;
          if (over) ctx.fillRect(x, y + 1, c, c - 2);
          else ctx.fillRect(x + 1, y, c - 2, c);
        }
      }
    },
    { data: true },
  );
}

/* ------------------------------------------------------------------ */
/* ambient pass: plant, desk objects, steam, wall TV                   */
/* ------------------------------------------------------------------ */

/**
 * Leaf skin. Deliberately a *tileable* green field rather than a blade-shaped
 * cutout — the blade silhouette comes from geometry, which lets stems and
 * blades share one material (and one draw call per cluster).
 */
export function leafSkin(): THREE.CanvasTexture {
  return makeTexture("leaf-skin", 256, 256, (ctx, W, H) => {
    const rnd = prng(3377);
    ctx.fillStyle = "#5f7a51";
    ctx.fillRect(0, 0, W, H);

    // broad mottling: no two leaves should read as the same flat green
    for (let i = 0; i < 30; i++) {
      const g = ctx.createRadialGradient(
        rnd() * W,
        rnd() * H,
        4,
        rnd() * W,
        rnd() * H,
        30 + rnd() * 90,
      );
      const warm = rnd() > 0.5;
      g.addColorStop(0, warm ? "rgba(134,158,106,0.30)" : "rgba(58,78,48,0.28)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // fine vein streaks running roughly along the blade axis
    for (let i = 0; i < 150; i++) {
      const x = rnd() * W;
      ctx.strokeStyle =
        rnd() > 0.5 ? "rgba(146,170,118,0.16)" : "rgba(48,66,40,0.18)";
      ctx.lineWidth = 0.7 + rnd() * 1.6;
      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.bezierCurveTo(
        x + (rnd() - 0.5) * 20,
        H * 0.35,
        x + (rnd() - 0.5) * 20,
        H * 0.7,
        x + (rnd() - 0.5) * 14,
        H + 10,
      );
      ctx.stroke();
    }

    // waxy speckle
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = rnd() > 0.5 ? "rgba(255,255,240,0.05)" : "rgba(20,32,16,0.06)";
      ctx.fillRect(rnd() * W, rnd() * H, 1.6, 1.6);
    }
  });
}

/** Linen-ish notebook cover cloth. */
export function notebookCloth(): THREE.CanvasTexture {
  return makeTexture("notebook-cloth", 256, 256, (ctx, W, H) => {
    const rnd = prng(8102);
    ctx.fillStyle = "#4a5560";
    ctx.fillRect(0, 0, W, H);
    const c = 4;
    for (let y = 0; y < H; y += c) {
      for (let x = 0; x < W; x += c) {
        const over = ((x / c + y / c) | 0) % 2 === 0;
        ctx.fillStyle = over ? "rgba(255,255,255,0.055)" : "rgba(0,0,0,0.07)";
        if (over) ctx.fillRect(x, y + 1, c, c - 1);
        else ctx.fillRect(x + 1, y, c - 1, c);
      }
    }
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
      ctx.fillRect(rnd() * W, rnd() * H, 2, 1);
    }
  });
}

/** Page-block edge: fine cream striations, read on the notebook's four sides. */
export function pageEdges(): THREE.CanvasTexture {
  return makeTexture("page-edges", 128, 128, (ctx, W, H) => {
    const rnd = prng(4820);
    ctx.fillStyle = "#f2ede0";
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 2) {
      ctx.fillStyle = `rgba(176,166,146,${0.16 + rnd() * 0.22})`;
      ctx.fillRect(0, y, W, 1);
    }
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, "rgba(120,110,92,0.22)");
    shade.addColorStop(0.5, "rgba(120,110,92,0)");
    shade.addColorStop(1, "rgba(120,110,92,0.18)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
  });
}

/**
 * A single steam wisp: soft alpha, transparent at every edge so the ribbon
 * never shows a hard boundary. Used as `map` on an unlit basic material.
 */
export function steamWisp(): THREE.CanvasTexture {
  return makeTexture(
    "steam-wisp",
    128,
    256,
    (ctx, W, H) => {
      const rnd = prng(1904);
      ctx.clearRect(0, 0, W, H);

      // vertical envelope: nothing at the spout, fullest a third up, gone at the top
      for (let y = 0; y < H; y++) {
        const v = y / H;
        const along = Math.pow(Math.sin(Math.PI * Math.pow(v, 0.72)), 1.1);
        for (let x = 0; x < W; x += 1) {
          const u = x / W;
          const across = Math.pow(Math.sin(Math.PI * u), 1.25);
          const a = along * across;
          if (a <= 0.004) continue;
          ctx.fillStyle = `rgba(255,252,246,${a})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // torn edges + internal structure so it is not a smooth airbrush blob.
      // Concentric stops and a bounded fill rect keep each bite local — a
      // gradient whose two circles have different centres smears a cone
      // across the whole canvas and eats the wisp alive.
      ctx.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 26; i++) {
        const cx = rnd() * W;
        const cy = rnd() * H;
        const r = 8 + rnd() * 20;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(0,0,0,${0.18 + rnd() * 0.22})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = "source-over";
    },
    { clamp: true },
  );
}

/* ---- wall TV clock face (mutable: redrawn only on minute change) ---- */

export const CLOCK_W = 1024;
export const CLOCK_H = 576;

/** Bare canvas for textures whose content changes after creation. */
export function createMutableCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

/**
 * Paints the TV face: near-black panel, one large warm-white time readout.
 * Called once at build and then only when the displayed minute changes.
 */
export function paintClockFace(canvas: HTMLCanvasElement, time: string): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#15181e");
  bg.addColorStop(0.55, "#101319");
  bg.addColorStop(1, "#0c0e13");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // barely-there panel sheen so the screen is not a dead rectangle
  const sheen = ctx.createLinearGradient(0, 0, W, H);
  sheen.addColorStop(0, "rgba(90,110,140,0.045)");
  sheen.addColorStop(0.5, "rgba(20,26,34,0)");
  sheen.addColorStop(1, "rgba(80,96,124,0.035)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "6px";

  // shrink to fit long locale strings ("12:34 AM") without ever clipping
  let size = 162;
  ctx.font = `300 ${size}px ${SANS}`;
  const maxWidth = W * 0.78;
  const measured = ctx.measureText(time).width;
  if (measured > maxWidth) {
    size = Math.floor(size * (maxWidth / measured));
    ctx.font = `300 ${size}px ${SANS}`;
  }

  ctx.shadowColor = "rgba(255,232,196,0.34)";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#cdc1ab";
  ctx.fillText(time, W / 2, H / 2 + 4);
  ctx.shadowBlur = 0;
  ctx.letterSpacing = "0px";
}

/** Alternate TV faces used by the command easter egg. */
export function paintTvCommandFace(
  canvas: HTMLCanvasElement,
  mode: "hint" | "running" | "complete",
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#121820");
  bg.addColorStop(0.56, "#0d1319");
  bg.addColorStop(1, "#090d12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.5, H * 0.48, 0, W * 0.5, H * 0.48, W * 0.48);
  glow.addColorStop(0, mode === "complete" ? "rgba(105,210,145,0.13)" : "rgba(110,170,220,0.1)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 18;

  if (mode === "complete") {
    const status = "INTERVIEW REQUESTED".split(" ");
    ctx.shadowColor = "rgba(124,232,162,0.28)";
    ctx.fillStyle = "#a9dfb8";
    ctx.font = `600 78px ${SANS}`;
    ctx.letterSpacing = "4px";
    ctx.fillText(status[0], W / 2, H / 2 - 48);
    ctx.fillText(status[1], W / 2, H / 2 + 48);
  } else {
    ctx.shadowColor = "rgba(174,214,241,0.28)";
    ctx.fillStyle = "#b9d4df";
    ctx.font = `500 156px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.letterSpacing = "0px";
    ctx.fillText(">_", W / 2, H / 2 - 26);

    ctx.fillStyle = "#8fa6b0";
    ctx.font = `600 30px ${SANS}`;
    ctx.letterSpacing = "7px";
    ctx.fillText(mode === "running" ? "RUNNING COMMAND" : "RUN A COMMAND", W / 2, H / 2 + 128);
  }

  ctx.shadowBlur = 0;
  ctx.letterSpacing = "0px";
}
