// news-image-20261125 — "World News, Wednesday 25 November 2026"
// A newspaper front page drawn entirely in code: masthead, a drawn storm scene for the
// postponed 100th Macy's Thanksgiving Day Parade, a markets strip, three drawn scene
// panels (Hormuz mines, US tariffs, Shenzhou-24) and 24 verified stories of the day.
// Everything is original drawn work — no photos, no copied artwork, no network, no
// randomness, no clock: the same bytes come out of every run.
// Node 22, standard library only. Run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join } from "node:path";

// ---------------------------------------------------------------- 5x7 bitmap font
// Each glyph is 7 rows; each row is 5 bits, bit 4 = leftmost pixel. Hand-written,
// verified by rendering a specimen of the whole charset before use.
const FONT = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30], E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17], I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 25, 21, 19, 17, 17, 17], O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16], Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4], U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  "0": [14, 17, 19, 21, 25, 17, 14], "1": [4, 12, 4, 4, 4, 4, 14], "2": [14, 17, 1, 6, 8, 16, 31],
  "3": [31, 2, 4, 2, 1, 17, 14], "4": [2, 6, 10, 18, 31, 2, 2], "5": [31, 16, 30, 1, 1, 17, 14],
  "6": [6, 8, 16, 30, 17, 17, 14], "7": [31, 1, 2, 4, 8, 8, 8], "8": [14, 17, 17, 14, 17, 17, 14],
  "9": [14, 17, 17, 15, 1, 2, 12],
  a: [0, 0, 14, 1, 15, 17, 15], b: [16, 16, 30, 17, 17, 17, 30], c: [0, 0, 14, 16, 16, 17, 14],
  d: [1, 1, 15, 17, 17, 17, 15], e: [0, 0, 14, 17, 31, 16, 14], f: [6, 8, 8, 30, 8, 8, 8],
  g: [0, 15, 17, 17, 15, 1, 14], h: [16, 16, 30, 17, 17, 17, 17], i: [4, 0, 12, 4, 4, 4, 14],
  j: [2, 0, 6, 2, 2, 2, 12], k: [16, 16, 18, 20, 24, 20, 18], l: [12, 4, 4, 4, 4, 4, 14],
  m: [0, 0, 26, 21, 21, 21, 21], n: [0, 0, 30, 17, 17, 17, 17], o: [0, 0, 14, 17, 17, 17, 14],
  p: [0, 0, 30, 17, 17, 30, 16], q: [0, 0, 15, 17, 17, 15, 1], r: [0, 0, 22, 25, 16, 16, 16],
  s: [0, 0, 15, 16, 14, 1, 30], t: [4, 4, 14, 4, 4, 4, 3], u: [0, 0, 17, 17, 17, 19, 13],
  v: [0, 0, 17, 17, 17, 10, 4], w: [0, 0, 17, 17, 21, 21, 10], x: [0, 0, 17, 10, 4, 10, 17],
  y: [0, 0, 17, 17, 15, 1, 14], z: [0, 0, 31, 2, 4, 8, 31],
  " ": [0, 0, 0, 0, 0, 0, 0], ".": [0, 0, 0, 0, 0, 12, 12], ",": [0, 0, 0, 0, 12, 4, 8],
  ":": [0, 12, 12, 0, 12, 12, 0], ";": [0, 12, 12, 0, 12, 4, 8], "!": [4, 4, 4, 4, 4, 0, 4],
  "?": [14, 17, 1, 2, 4, 0, 4], "'": [4, 4, 8, 0, 0, 0, 0], '"': [10, 10, 0, 0, 0, 0, 0],
  "-": [0, 0, 0, 14, 0, 0, 0], "\u2013": [0, 0, 0, 14, 0, 0, 0], "\u2014": [0, 0, 0, 31, 0, 0, 0],
  "(": [2, 4, 8, 8, 8, 4, 2], ")": [8, 4, 2, 2, 2, 4, 8], "/": [1, 1, 2, 4, 8, 16, 16],
  "%": [25, 25, 2, 4, 8, 19, 19], $: [4, 15, 20, 14, 5, 30, 4], "+": [0, 4, 4, 31, 4, 4, 0],
  "&": [12, 18, 20, 8, 21, 18, 13], "@": [14, 17, 23, 21, 23, 16, 14], "#": [10, 10, 31, 10, 31, 10, 10],
  "\u00b7": [0, 0, 0, 12, 12, 0, 0], "=": [0, 0, 31, 0, 31, 0, 0], "\u00d7": [0, 17, 10, 4, 10, 17, 0],
  "~": [0, 0, 0, 10, 21, 0, 0],
  "\u20ac": [14, 17, 30, 17, 30, 17, 14], "\u00a3": [6, 8, 8, 30, 8, 8, 31],
};

// ---------------------------------------------------------------- canvas
const W = 1024, H = 1024;
const px = new Uint8Array(W * H * 4);
const PAPER = [247, 242, 231], INK = [27, 42, 74], NAVY = [22, 35, 61], NAVYDEEP = [16, 26, 46];
const RED = [164, 31, 47], GOLD = [185, 138, 29], GOLDL = [212, 175, 55], GREY = [107, 111, 120];
const WHITE = [255, 255, 255], CREAM = [240, 236, 226], BORDER = [203, 196, 180], LIGHTGREY = [226, 224, 218];
const C_AM = [164, 31, 47], C_EU = [27, 42, 74], C_ME = [138, 90, 0], C_AS = [15, 107, 79], C_AF = [122, 59, 143], C_UA = [47, 95, 138];
const C_TECH = [90, 40, 120], C_VAT = [185, 138, 29], C_PAC = [0, 110, 120], C_SCI = [60, 90, 160], C_SPO = [190, 60, 30];

function set(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
}
function fillAll(c) { for (let i = 0; i < W * H; i++) { px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2]; px[i * 4 + 3] = 255; } }
function rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, c); }
function hline(x, y, w, c) { for (let i = x; i < x + w; i++) set(i, y, c); }
function vline(x, y, h, c) { for (let j = y; j < y + h; j++) set(x, j, c); }
function line(x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  for (;;) { set(x, y, c); if (x === x1 && y === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; } }
}
function fillCircle(cx, cy, r, c) {
  for (let y = -r; y <= r; y++) { const dx = Math.floor(Math.sqrt(r * r - y * y)); for (let x = -dx; x <= dx; x++) set(cx + x, cy + y, c); }
}
function circleOutline(cx, cy, r, c, thick = 1) {
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180;
    for (let t = 0; t < thick; t++) set(Math.round(cx + (r - t) * Math.cos(rad)), Math.round(cy + (r - t) * Math.sin(rad)), c);
  }
}
function ellipseOutline(cx, cy, rx, ry, c) {
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180;
    set(Math.round(cx + rx * Math.cos(rad)), Math.round(cy + ry * Math.sin(rad)), c);
  }
}
function fillPoly(pts, c) {
  let minY = 1e9, maxY = -1e9;
  for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) set(x, y, c);
  }
}
function vGrad(x, y, w, h, top, bot) {
  for (let j = 0; j < h; j++) {
    const t = h <= 1 ? 0 : j / (h - 1);
    rect(x, y + j, w, 1, [Math.round(top[0] + (bot[0] - top[0]) * t), Math.round(top[1] + (bot[1] - top[1]) * t), Math.round(top[2] + (bot[2] - top[2]) * t)]);
  }
}
function roundedRect(x, y, w, h, r, c) {
  rect(x + r, y, w - 2 * r, h, c); rect(x, y + r, w, h - 2 * r, c);
  fillCircle(x + r, y + r, r, c); fillCircle(x + w - r - 1, y + r, r, c);
  fillCircle(x + r, y + h - r - 1, r, c); fillCircle(x + w - r - 1, y + h - r - 1, r, c);
}
function rectOutline(x, y, w, h, c, t = 1) {
  for (let k = 0; k < t; k++) { hline(x, y + k, w, c); hline(x, y + h - 1 - k, w, c); vline(x + k, y, h, c); vline(x + w - 1 - k, y, h, c); }
}

// ---------------------------------------------------------------- text
function drawChar(ch, x, y, s, c) {
  const g = FONT[ch] || FONT["?"];
  for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
    if (g[r] & (1 << (4 - col))) rect(x + col * s, y + r * s, s, s, c);
  }
}
function textWidth(str, s) { return str.length === 0 ? 0 : str.length * 6 * s - s; }
function drawText(str, x, y, s, c, bold = false) {
  let cx = x;
  for (const ch of str) {
    drawChar(ch, cx, y, s, c);
    if (bold) drawChar(ch, cx + 1, y, s, c);
    cx += 6 * s;
  }
  return cx;
}
function drawTextC(str, x, w, y, s, c, bold = false) {
  drawText(str, x + Math.floor((w - textWidth(str, s)) / 2), y, s, c, bold);
}
function drawTextR(str, xRight, y, s, c, bold = false) {
  drawText(str, xRight - textWidth(str, s), y, s, c, bold);
}
function wrap(str, maxW, s) {
  const words = str.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur === "" ? w : cur + " " + w;
    if (textWidth(t, s) <= maxW) cur = t;
    else { if (cur !== "") lines.push(cur); cur = w; }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- small pictograms (18x18 box)
function icon(kind, x, y, c) {
  switch (kind) {
    case "gavel": rect(x + 2, y + 2, 14, 4, c); line(x + 9, y + 6, x + 14, y + 16, c); line(x + 10, y + 6, x + 15, y + 16, c); rect(x + 3, y + 15, 12, 2, c); break;
    case "bolt": fillPoly([[x + 11, y], [x + 4, y + 10], [x + 8, y + 10], [x + 6, y + 18], [x + 14, y + 7], [x + 10, y + 7]], c); break;
    case "chat": roundedRect(x + 1, y + 2, 16, 11, 2, c); fillPoly([[x + 5, y + 13], [x + 8, y + 13], [x + 5, y + 17]], c); rect(x + 4, y + 5, 10, 1, PAPER); rect(x + 4, y + 8, 7, 1, PAPER); break;
    case "coins": rect(x + 3, y + 3, 12, 3, c); rect(x + 3, y + 8, 12, 3, c); rect(x + 3, y + 13, 12, 3, c); break;
    case "doc": rectOutline(x + 4, y + 1, 10, 16, c); rect(x + 6, y + 4, 6, 1, c); rect(x + 6, y + 7, 6, 1, c); rect(x + 6, y + 10, 6, 1, c); break;
    case "plane": fillPoly([[x + 1, y + 9], [x + 17, y + 7], [x + 17, y + 10], [x + 1, y + 11]], c); fillPoly([[x + 7, y + 9], [x + 10, y + 2], [x + 12, y + 9]], c); fillPoly([[x + 9, y + 11], [x + 11, y + 16], [x + 13, y + 11]], c); break;
    case "ballot": rectOutline(x + 2, y + 2, 14, 14, c, 2); line(x + 5, y + 10, x + 8, y + 13, c); line(x + 8, y + 13, x + 14, y + 5, c); line(x + 5, y + 11, x + 8, y + 14, c); line(x + 8, y + 14, x + 14, y + 6, c); break;
    case "boat": fillPoly([[x + 1, y + 11], [x + 17, y + 11], [x + 14, y + 16], [x + 4, y + 16]], c); vline(x + 9, y + 2, 9, c); fillPoly([[x + 10, y + 2], [x + 10, y + 10], [x + 16, y + 10]], c); break;
    case "target": circleOutline(x + 9, y + 9, 8, c, 2); fillCircle(x + 9, y + 9, 5, c); fillCircle(x + 9, y + 9, 2, PAPER); break;
    case "scales": vline(x + 9, y + 1, 14, c); hline(x + 3, y + 3, 13, c); fillPoly([[x + 2, y + 4], [x + 5, y + 4], [x + 3, y + 9], [x + 4, y + 9]], c); fillPoly([[x + 13, y + 4], [x + 16, y + 4], [x + 14, y + 9], [x + 15, y + 9]], c); rect(x + 6, y + 15, 7, 2, c); break;
    case "candle": rect(x + 7, y + 8, 4, 9, c); fillCircle(x + 9, y + 4, 3, GOLD); rect(x + 8, y + 15, 3, 2, c); break;
    case "heart": fillCircle(x + 6, y + 6, 4, c); fillCircle(x + 12, y + 6, 4, c); fillPoly([[x + 2, y + 7], [x + 16, y + 7], [x + 9, y + 17]], c); break;
    case "missile": fillPoly([[x + 9, y + 1], [x + 12, y + 7], [x + 6, y + 7]], c); rect(x + 6, y + 7, 6, 8, c); fillPoly([[x + 6, y + 15], [x + 2, y + 17], [x + 6, y + 17]], c); fillPoly([[x + 12, y + 15], [x + 16, y + 17], [x + 12, y + 17]], c); break;
    case "envelope": rectOutline(x + 1, y + 4, 16, 11, c, 2); line(x + 2, y + 5, x + 9, y + 11, c); line(x + 16, y + 5, x + 9, y + 11, c); break;
    case "chart": rect(x + 2, y + 11, 4, 6, c); rect(x + 7, y + 7, 4, 10, c); rect(x + 12, y + 3, 4, 14, c); break;
    case "chip": rectOutline(x + 4, y + 4, 10, 10, c, 2); rect(x + 7, y + 7, 4, 4, c); hline(x + 1, y + 7, 3, c); hline(x + 1, y + 11, 3, c); hline(x + 14, y + 7, 3, c); hline(x + 14, y + 11, 3, c); vline(x + 7, y + 1, 3, c); vline(x + 11, y + 1, 3, c); vline(x + 7, y + 14, 3, c); vline(x + 11, y + 14, 3, c); break;
    case "helmet": fillCircle(x + 9, y + 9, 7, c); rect(x + 2, y + 9, 14, 7, PAPER); rect(x + 1, y + 14, 16, 2, c); rect(x + 8, y + 2, 2, 7, c); break;
    case "flag": vline(x + 4, y + 1, 16, c); fillPoly([[x + 5, y + 2], [x + 16, y + 5], [x + 5, y + 8]], c); break;
    case "mega": fillPoly([[x + 1, y + 6], [x + 8, y + 4], [x + 8, y + 14], [x + 1, y + 12]], c); rect(x + 8, y + 4, 7, 10, c); rect(x + 4, y + 14, 3, 3, c); line(x + 16, y + 5, x + 17, y + 4, c); line(x + 16, y + 9, x + 17, y + 10, c); break;
    case "jet": fillPoly([[x + 1, y + 9], [x + 8, y + 6], [x + 17, y + 8], [x + 17, y + 10], [x + 8, y + 12]], c); fillPoly([[x + 8, y + 8], [x + 11, y + 2], [x + 13, y + 8]], c); fillPoly([[x + 9, y + 10], [x + 11, y + 16], [x + 13, y + 10]], c); break;
    case "cloud": fillCircle(x + 6, y + 10, 4, c); fillCircle(x + 11, y + 8, 5, c); fillCircle(x + 14, y + 11, 3, c); rect(x + 3, y + 10, 13, 4, c); break;
    case "star": fillPoly([[x + 9, y + 1], [x + 11, y + 7], [x + 17, y + 7], [x + 12, y + 11], [x + 14, y + 17], [x + 9, y + 13], [x + 4, y + 17], [x + 6, y + 11], [x + 1, y + 7], [x + 7, y + 7]], c); break;
    case "flame": fillPoly([[x + 9, y + 1], [x + 14, y + 8], [x + 12, y + 12], [x + 15, y + 17], [x + 9, y + 17], [x + 3, y + 17], [x + 6, y + 12], [x + 4, y + 8]], c); fillCircle(x + 9, y + 13, 3, GOLD); break;
    case "ball": circleOutline(x + 9, y + 9, 8, c, 2); fillPoly([[x + 7, y + 5], [x + 11, y + 5], [x + 12, y + 9], [x + 9, y + 13], [x + 6, y + 9]], c); break;
    case "sat": rect(x + 6, y + 6, 6, 6, c); rect(x + 1, y + 8, 4, 2, c); rect(x + 13, y + 8, 4, 2, c); line(x + 9, y + 6, x + 12, y + 2, c); fillCircle(x + 13, y + 1, 1, c); break;
    case "rocket": fillPoly([[x + 9, y + 1], [x + 12, y + 6], [x + 6, y + 6]], c); rect(x + 6, y + 6, 6, 8, c); fillPoly([[x + 6, y + 14], [x + 3, y + 17], [x + 6, y + 17]], c); fillPoly([[x + 12, y + 14], [x + 15, y + 17], [x + 12, y + 17]], c); fillPoly([[x + 8, y + 14], [x + 10, y + 14], [x + 9, y + 18]], GOLD); break;
    default: rect(x + 3, y + 3, 12, 12, c);
  }
}

// ---------------------------------------------------------------- drawn scenes
function drawGlobe(x, y, r, c) {
  circleOutline(x, y, r, c, 2);
  ellipseOutline(x, y, Math.round(r * 0.45), r, c);
  hline(x - r, y, 2 * r, c);
  const ry = Math.round(r * 0.55);
  const dx = Math.round(Math.sqrt(r * r - ry * ry));
  hline(x - dx, y - ry, 2 * dx, c);
  hline(x - dx, y + ry, 2 * dx, c);
}

// Hero: Thanksgiving storm over New York — dark sky, wind-bent rain, skyline, a big
// striped balloon tugged low by its tethers, a "POSTPONED" ribbon across the sky.
function drawHeroScene(x, y, w, h) {
  vGrad(x, y, w, h, [38, 52, 76], [88, 102, 126]);
  // storm clouds
  fillCircle(x + 70, y + 26, 30, [52, 64, 84]); fillCircle(x + 105, y + 20, 22, [52, 64, 84]); fillCircle(x + 140, y + 32, 18, [60, 72, 92]);
  fillCircle(x + 420, y + 20, 26, [52, 64, 84]); fillCircle(x + 452, y + 30, 18, [60, 72, 92]); fillCircle(x + 500, y + 18, 15, [52, 64, 84]);
  fillCircle(x + 280, y + 14, 16, [60, 72, 92]);
  // wind streaks, bent rain — fixed pattern, deterministic
  for (let i = 0; i < 40; i++) {
    const rx = x + ((i * 113 + 41) % (w - 12)) + 6;
    const ry = y + ((i * 61 + 23) % (h - 70)) + 10;
    line(rx, ry, rx - 6, ry + 10, [150, 166, 190]);
  }
  for (let i = 0; i < 8; i++) {
    const wx = x + ((i * 173 + 60) % (w - 90)) + 30;
    const wy = y + 46 + ((i * 37) % 40);
    hline(wx, wy, 46, [170, 184, 206]);
  }
  // skyline, back layer
  const back = [[0, 84, 44], [50, 66, 38], [94, 92, 48], [148, 74, 34], [188, 96, 42], [360, 80, 40], [406, 62, 34], [446, 92, 44], [496, 76, 30]];
  for (const b of back) rect(x + b[0], y + h - b[1], b[2], b[1], [24, 34, 52]);
  // skyline, front layer with lit windows
  const front = [[12, 54, 32], [58, 40, 28], [112, 62, 38], [170, 46, 28], [280, 56, 34], [336, 42, 28], [396, 52, 32], [460, 44, 28]];
  for (const b of front) {
    const bx = x + b[0], bh = b[1], bw = b[2];
    rect(bx, y + h - bh, bw, bh, [16, 24, 40]);
    for (let wy = y + h - bh + 8; wy < y + h - 6; wy += 12)
      for (let wx = bx + 5; wx < bx + bw - 4; wx += 9)
        if (((wx * 7 + wy * 13) % 5) < 2) rect(wx, wy, 3, 4, GOLDL);
  }
  rect(x, y + h - 14, w, 14, [12, 18, 30]); // street
  // the balloon: big striped sphere leaning in the wind, gold "100" badge
  const cx = x + Math.round(w * 0.5), cy = y + 92, r = 54;
  for (let py = cy - r; py <= cy + r; py++) {
    for (let px2 = cx - r; px2 <= cx + r; px2++) {
      const dx = px2 - cx, dy = py - cy;
      if (dx * dx + dy * dy <= r * r) {
        const band = Math.floor((dx + (py - cy) * 0.35 + r) / 17);
        set(px2, py, band % 2 === 0 ? CREAM : (band % 4 === 1 ? RED : GOLD));
      }
    }
  }
  circleOutline(cx, cy, r, [20, 28, 48], 2);
  fillCircle(cx + r - 6, cy - r + 6, 14, GOLDL);
  circleOutline(cx + r - 6, cy - r + 6, 14, [120, 88, 10], 1);
  drawTextC("100", cx + r - 20, 28, cy - r + 1, 1, INK, true);
  // tethers pulled taut down to the street
  line(cx - 24, cy + 48, cx - 44, y + h - 14, [220, 220, 210]);
  line(cx + 24, cy + 48, cx + 44, y + h - 14, [220, 220, 210]);
  line(cx, cy + 54, cx, y + h - 14, [220, 220, 210]);
  for (const hx of [cx - 44, cx, cx + 44]) fillCircle(hx, y + h - 16, 3, [220, 220, 210]);
  // POSTPONED ribbon
  rect(x + 14, y + 12, 148, 22, RED);
  drawTextC("POSTPONED", x + 14, 148, y + 17, 2, WHITE, true);
}

// Hormuz: a tanker at dusk with smoke and naval mines in the water.
function drawHormuzScene(x, y, w, h) {
  vGrad(x, y, w, h, [214, 176, 130], [168, 128, 92]);
  fillCircle(x + w - 52, y + 20, 15, [236, 206, 130]); // low sun
  // smoke plume over the far tanker
  const smoke = [[210, 22, 9], [218, 14, 12], [228, 8, 14], [238, 16, 10]];
  for (const s of smoke) fillCircle(x + s[0], y + s[1], s[2], [120, 116, 110]);
  rect(x, y + h - 26, w, 26, [44, 78, 104]); // sea
  hline(x, y + h - 20, w, [130, 175, 205]); hline(x + 24, y + h - 14, w - 48, [130, 175, 205]);
  // tanker hull + superstructure
  fillPoly([[x + 16, y + h - 34], [x + w - 40, y + h - 34], [x + w - 52, y + h - 14], [x + 30, y + h - 14]], [27, 42, 74]);
  rect(x + 20, y + h - 40, w - 66, 6, [164, 31, 47]);
  rect(x + w - 78, y + h - 62, 26, 28, WHITE);
  rect(x + w - 74, y + h - 58, 18, 4, [27, 42, 74]); rect(x + w - 74, y + h - 50, 18, 4, [27, 42, 74]);
  vline(x + w - 65, y + h - 74, 12, [27, 42, 74]);
  fillPoly([[x + w - 65, y + h - 74], [x + w - 50, y + h - 70], [x + w - 65, y + h - 66]], RED);
  // deck tanks
  for (let i = 0; i < 4; i++) {
    const tx = x + 34 + i * 52;
    fillCircle(tx + 18, y + h - 46, 11, [200, 205, 212]);
    rect(tx + 7, y + h - 46, 22, 6, [200, 205, 212]);
  }
  // naval mines: spiked spheres bobbing in the foreground
  for (const m of [[x + 46, y + h - 8], [x + 96, y + h - 5], [x + 150, y + h - 9]]) {
    fillCircle(m[0], m[1], 7, [30, 30, 34]);
    for (let a = 0; a < 8; a++) {
      const rad = (a * Math.PI) / 4;
      line(m[0], m[1], Math.round(m[0] + 10 * Math.cos(rad)), Math.round(m[1] + 10 * Math.sin(rad)), [30, 30, 34]);
    }
    fillCircle(m[0], m[1], 3, [90, 90, 96]);
  }
  // flame lick on the far tanker
  fillPoly([[x + 214, y + h - 40], [x + 224, y + h - 40], [x + 219, y + h - 56]], [230, 120, 30]);
  fillPoly([[x + 216, y + h - 40], [x + 222, y + h - 40], [x + 219, y + h - 50]], [245, 200, 60]);
}

// Tariffs: container ship at sea with a dock crane.
function drawTariffScene(x, y, w, h) {
  vGrad(x, y, w, h, [223, 231, 240], [198, 208, 220]);
  rect(x, y + h - 30, w, 30, [38, 84, 124]);
  hline(x, y + h - 26, w, [120, 170, 205]); hline(x + 20, y + h - 18, w - 40, [120, 170, 205]);
  // crane silhouette, right
  rect(x + w - 46, y + 8, 5, h - 38, [27, 42, 74]);
  rect(x + w - 78, y + 8, 36, 5, [27, 42, 74]);
  line(x + w - 46, y + 13, x + w - 70, y + 34, [27, 42, 74]);
  line(x + w - 70, y + 34, x + w - 70, y + 44, [27, 42, 74]);
  rect(x + w - 74, y + 44, 8, 6, [27, 42, 74]);
  // ship hull
  fillPoly([[x + 18, y + h - 34], [x + w - 96, y + h - 34], [x + w - 108, y + h - 14], [x + 34, y + h - 14]], [27, 42, 74]);
  rect(x + 22, y + h - 40, w - 130, 6, [164, 31, 47]);
  // containers, three stacks
  const cols = [RED, [38, 84, 124], GOLD, [15, 107, 79], RED, [38, 84, 124]];
  for (let s = 0; s < 3; s++) {
    const bx = x + 34 + s * 58;
    for (let l = 0; l < (s === 1 ? 3 : 2); l++) {
      rect(bx, y + h - 46 - l * 13, 52, 11, cols[(s * 2 + l) % cols.length]);
      rectOutline(bx, y + h - 46 - l * 13, 52, 11, [255, 255, 255], 1);
    }
  }
  // bridge tower + flag
  rect(x + w - 92, y + h - 62, 20, 28, WHITE);
  rect(x + w - 88, y + h - 58, 12, 4, [27, 42, 74]); rect(x + w - 88, y + h - 50, 12, 4, [27, 42, 74]);
  vline(x + w - 82, y + h - 76, 14, [27, 42, 74]);
  fillPoly([[x + w - 82, y + h - 76], [x + w - 66, y + h - 72], [x + w - 82, y + h - 68]], RED);
}

// Shenzhou-24: a rocket climbing through a night sky full of stars, over its launch pad.
function drawRocketScene(x, y, w, h) {
  vGrad(x, y, w, h, [14, 22, 44], [44, 58, 88]);
  // stars — fixed pattern, deterministic
  for (let i = 0; i < 26; i++) {
    const sx = x + ((i * 67 + 13) % (w - 8)) + 4;
    const sy = y + ((i * 41 + 7) % (h - 40)) + 4;
    fillCircle(sx, sy, (i % 5 === 0) ? 2 : 1, [220, 224, 236]);
  }
  // launch pad
  rect(x, y + h - 16, w, 16, [52, 50, 46]);
  rect(x + 40, y + h - 34, 12, 18, [90, 88, 82]);
  rect(x + w - 56, y + h - 34, 12, 18, [90, 88, 82]);
  hline(x + 40, y + h - 36, 12, [140, 138, 130]); hline(x + w - 56, y + h - 36, 12, [140, 138, 130]);
  // rocket body, mid-flight
  const rx = x + Math.round(w * 0.5), ry = y + 24;
  fillPoly([[rx, ry], [rx + 9, ry + 12], [rx - 9, ry + 12]], [200, 30, 40]);
  rect(rx - 9, ry + 12, 18, 26, WHITE);
  rectOutline(rx - 9, ry + 12, 18, 26, [27, 42, 74], 1);
  fillCircle(rx, ry + 20, 4, [120, 170, 205]);
  fillPoly([[rx - 9, ry + 38], [rx - 18, ry + 46], [rx - 9, ry + 46]], [200, 30, 40]);
  fillPoly([[rx + 9, ry + 38], [rx + 18, ry + 46], [rx + 9, ry + 46]], [200, 30, 40]);
  // exhaust flame + smoke (stays inside the 86px scene)
  fillPoly([[rx - 8, ry + 46], [rx + 8, ry + 46], [rx, ry + 56]], [230, 120, 30]);
  fillPoly([[rx - 4, ry + 46], [rx + 4, ry + 46], [rx, ry + 50]], [245, 200, 60]);
  fillCircle(rx - 22, y + h - 22, 12, [170, 166, 158]);
  fillCircle(rx + 24, y + h - 24, 14, [170, 166, 158]);
  fillCircle(rx + 6, y + h - 20, 10, [190, 186, 178]);
  // small moon
  fillCircle(x + 44, y + 20, 12, [232, 228, 210]);
  fillCircle(x + 40, y + 16, 3, [210, 206, 188]); fillCircle(x + 48, y + 24, 2, [210, 206, 188]);
}

// ---------------------------------------------------------------- the day's stories
// Every headline below passed the date check in notes/verification.md: it happened or
// was first reported on Wednesday 25 November 2026, by event date.
const BRIEFS = [
  // left column: Americas, Europe, Middle East
  { n: 1, h: "US economy grows 4.3% in Q3", tag: "AMERICAS", src: "BEA", c: C_AM, ic: "chart" },
  { n: 2, h: "Cartagena siege ends, all freed", tag: "AMERICAS", src: "Reuters", c: C_AM, ic: "flag" },
  { n: 3, h: "FCC clears 1M SpaceX satellites", tag: "TECH", src: "Reuters", c: C_TECH, ic: "sat" },
  { n: 4, h: "Army destroys lead-azide stockpile", tag: "AMERICAS", src: "AP", c: C_AM, ic: "helmet" },
  { n: 5, h: "Six found dead after plane crash", tag: "AMERICAS", src: "AP", c: C_AM, ic: "plane" },
  { n: 6, h: "Spain heads to snap vote on Sunday", tag: "EUROPE", src: "Daily Summary", c: C_EU, ic: "ballot" },
  { n: 7, h: "Nations tell Russia: halt riot agent", tag: "EUROPE", src: "Reuters", c: C_EU, ic: "cloud" },
  { n: 8, h: "Ukraine drones hit Samara refineries", tag: "UKRAINE WAR", src: "Daily Summary", c: C_UA, ic: "jet" },
  { n: 9, h: "BBC: 490,334 Russian soldiers dead", tag: "EUROPE", src: "BBC", c: C_EU, ic: "doc" },
  { n: 10, h: "Houthis claim Ras Tanura strike", tag: "MIDDLE EAST", src: "Daily Summary", c: C_ME, ic: "flame" },
  { n: 11, h: "Israel kills Hamas security chief", tag: "MIDDLE EAST", src: "Daily Summary", c: C_ME, ic: "target" },
  { n: 12, h: "Pope Leo XIV laments COP31 failure", tag: "VATICAN", src: "Daily Summary", c: C_VAT, ic: "heart" },
  // right column: Asia, Africa, Pacific, science, sport
  { n: 13, h: "N. Korea expels Swiss envoy", tag: "ASIA", src: "Reuters", c: C_AS, ic: "envelope" },
  { n: 14, h: "China-Cambodia drills begin", tag: "ASIA", src: "Daily Summary", c: C_AS, ic: "flag" },
  { n: 15, h: "Bangladesh garment wage up 36%", tag: "ASIA", src: "Reuters", c: C_AS, ic: "coins" },
  { n: 16, h: "Hong Kong marks Tai Po anniversary", tag: "ASIA", src: "Reuters", c: C_AS, ic: "candle" },
  { n: 17, h: "Cairo tanker fire kills 31", tag: "AFRICA", src: "AP", c: C_AF, ic: "flame" },
  { n: 18, h: "Ramaphosa wins Farmgate court bid", tag: "AFRICA", src: "Reuters", c: C_AF, ic: "scales" },
  { n: 19, h: "Sudan: RSF drone strikes kill 19", tag: "AFRICA", src: "Daily Summary", c: C_AF, ic: "heart" },
  { n: 20, h: "Australia-Solomon Islands treaty", tag: "PACIFIC", src: "Daily Summary", c: C_PAC, ic: "doc" },
  { n: 21, h: "Hera unveils first Dimorphos images", tag: "SCIENCE", src: "CNN", c: C_SCI, ic: "star" },
  { n: 22, h: "Sinner out after knee surgery", tag: "SPORT", src: "bworldonline", c: C_SPO, ic: "heart" },
  { n: 23, h: "Champions League: Liverpool 3-0", tag: "SPORT", src: "Daily Summary", c: C_SPO, ic: "ball" },
  { n: 24, h: "Lakers beat Jazz, Doncic scores 28", tag: "SPORT", src: "bworldonline", c: C_SPO, ic: "ball" },
];
const STATS = [
  { v: "+0.33%", l: "DOW JONES" }, { v: "-0.25%", l: "S&P 500" }, { v: "-0.62%", l: "NASDAQ" },
  { v: "-3.9%", l: "NVIDIA" }, { v: "+11.5%", l: "HP" },
];

// ---------------------------------------------------------------- layout
function draw() {
  fillAll(PAPER);
  const M = 26, CW = W - 2 * M; // margins, content width 972

  // masthead
  drawGlobe(M + 26, 54, 24, INK);
  drawText("WORLD NEWS", M + 64, 28, 8, INK, true);
  drawTextR("WEDNESDAY \u00b7 25 NOVEMBER 2026", W - M, 48, 2, RED, true);
  rect(M, 96, CW, 3, GOLD);
  hline(M, 102, CW, INK);

  // hero: storm scene left, headline right on navy
  const hy = 110, hh = 208;
  rect(M, hy, CW, hh, NAVY);
  drawHeroScene(M, hy, 554, hh);
  const tx = M + 566, tw = CW - 566;
  drawText("UNITED STATES \u00b7 THANKSGIVING DAY", tx, hy + 18, 2, GOLDL, true);
  const hl = wrap("Storm grounds the 100th Macy's parade", tw, 3);
  let yy = hy + 44;
  for (const l of hl) { drawText(l, tx, yy, 3, WHITE, true); yy += 22; }
  const sf = wrap("First weather postponement in its history. The march moves to Saturday as gusts hit 60 mph; NBC airs last year's parade.", tw, 2);
  yy += 6;
  for (const l of sf) { drawText(l, tx, yy, 2, CREAM); yy += 15; }
  drawText("100th parade \u00b7 2.5-mile route \u00b7 a first in 100 years", tx, hy + hh - 24, 1, [170, 180, 200]);

  // markets strip
  const sy = 330, sh = 54, bw = Math.floor((CW - 4 * 8) / 5);
  for (let i = 0; i < 5; i++) {
    const bx = M + i * (bw + 8);
    rect(bx, sy, bw, sh, WHITE);
    rectOutline(bx, sy, bw, sh, BORDER, 1);
    drawTextC(STATS[i].v, bx, bw, sy + 10, 3, STATS[i].v[0] === "+" ? C_AS : RED, true);
    drawTextC(STATS[i].l, bx, bw, sy + 36, 1, GREY);
  }
  drawText("Wall St. whipsaw: Dow erases a 1,100-point fall to end green \u00b7 US markets shut Thursday for Thanksgiving", M, 392, 1, GREY);

  // section divider
  hline(M, 416, CW, INK);
  drawText("THE DAY IN BRIEF", M, 424, 2, RED, true);
  drawTextR("28 STORIES", W - M, 424, 2, GREY, true);

  // three drawn scene panels
  const py = 446, ph = 140, pw = Math.floor((CW - 2 * 12) / 3);
  const panels = [
    { draw: drawHormuzScene, h1: "Mines hit tankers in the Gulf", h2: "Iran says two struck; US disputes", sub: "Houthis claim Ras Tanura refinery hit" },
    { draw: drawTariffScene, h1: "US proposes tariffs on 14 partners", h2: "China 20%, EU 15% \u00b7 hearing Jan 25", sub: "Section 301 probe on excess capacity" },
    { draw: drawRocketScene, h1: "Pakistan's first astronaut in orbit", h2: "Shenzhou-24 docks at Tiangong", sub: "Launched 00:18 UTC with two crew" },
  ];
  for (let i = 0; i < 3; i++) {
    const px0 = M + i * (pw + 12);
    rect(px0, py, pw, ph, WHITE);
    rectOutline(px0, py, pw, ph, BORDER, 1);
    panels[i].draw(px0 + 1, py + 1, pw - 2, 86);
    const h1Lines = wrap(panels[i].h1, pw - 20, 2).slice(0, 2);
    let ty = py + 92;
    for (const l of h1Lines) { drawText(l, px0 + 10, ty, 2, INK, true); ty += 14; }
    drawText(panels[i].h2, px0 + 10, ty + 2, 1, INK, true);
    drawText(panels[i].sub, px0 + 10, ty + 13, 1, GREY);
  }

  // briefs: two columns, twelve rows
  const by = 600, rowH = 30, colW = Math.floor((CW - 14) / 2);
  for (let col = 0; col < 2; col++) {
    const cx0 = M + col * (colW + 14);
    for (let r = 0; r < 12; r++) {
      const b = BRIEFS[col * 12 + r];
      const ry = by + r * rowH;
      drawTextR(String(b.n), cx0 + 20, ry + 2, 2, RED, true);
      icon(b.ic, cx0 + 26, ry + 1, b.c);
      drawText(b.h, cx0 + 50, ry + 2, 2, INK, true);
      drawText(b.tag, cx0 + 50, ry + 19, 1, b.c, true);
      const tagW = textWidth(b.tag, 1);
      drawText(" \u00b7 " + b.src, cx0 + 50 + tagW, ry + 19, 1, GREY);
    }
  }

  // date check
  const dy = 968;
  rect(M, dy, CW, 40, NAVY);
  drawText("DATE CHECK \u2014 Every story above happened or was first reported", M + 12, dy + 7, 2, WHITE, true);
  drawText("on Wednesday 25 November 2026, by event date. Sources: Reuters, BBC, CNN, AP, BEA.", M + 12, dy + 25, 1, CREAM);
}

// ---------------------------------------------------------------- PNG encoder (deterministic)
function crc32(buf) {
  const t = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let c = 0xffffffff;
  for (const b of buf) c = t[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 4));
  for (let r = 0; r < H; r++) { raw[r * (1 + W * 4)] = 0; Buffer.from(px.buffer, r * W * 4, W * 4).copy(raw, r * (1 + W * 4) + 1); }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

draw();
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), encodePNG());
