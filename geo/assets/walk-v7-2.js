/* V7-2 walks. The body stays the painting. Each leg is one filled
   shape in that painting's colors, so the knee cannot split open. */
(function (g) {
  "use strict";

  const specs = {};

  const phaseOf = { nearHind: 0, nearFore: 0.25, farHind: 0.5, farFore: 0.75 };
  const bendOf = { nearHind: 1, farHind: 1, nearFore: -1, farFore: -1 };
  const names = ["farHind", "farFore", "nearHind", "nearFore"];

  function footOffset(spec, phase, isHind) {
    const duty = spec.duty;
    const half = spec.stride * duty / 2;
    if (phase < duty) {
      const u = phase / duty;
      return { x: half * (1 - 2 * u), y: 0 };
    }
    const u = (phase - duty) / (1 - duty);
    const s = u * u * (3 - 2 * u);
    let x = half * (-1 + 2 * s);
    const y = -spec.lift * Math.sin(Math.PI * u);
    if (isHind) x -= half * 0.22 * Math.sin(Math.PI * u);
    return { x: x, y: y };
  }

  function ik(ax, ay, tx, ty, l1, l2, bend) {
    let dx = tx - ax;
    let dy = ty - ay;
    let dist = Math.hypot(dx, dy);
    const max = l1 + l2 - 0.8;
    const min = Math.abs(l1 - l2) + 0.8;
    if (dist < 0.001) {
      dx = 0;
      dy = min;
      dist = min;
    }
    if (dist > max) {
      dx *= max / dist;
      dy *= max / dist;
      dist = max;
    } else if (dist < min) {
      dx *= min / dist;
      dy *= min / dist;
      dist = min;
    }
    const cosA = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
    const ang = Math.atan2(dy, dx);
    const delta = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const knee = ang + bend * delta;
    return {
      jx: ax + Math.cos(knee) * l1,
      jy: ay + Math.sin(knee) * l1,
      fx: ax + dx,
      fy: ay + dy
    };
  }

  function quad(ctx, ax, ay, bx, by, ra, rb) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    ctx.beginPath();
    ctx.moveTo(ax + px * ra, ay + py * ra);
    ctx.lineTo(bx + px * rb, by + py * rb);
    ctx.lineTo(bx - px * rb, by - py * rb);
    ctx.lineTo(ax - px * ra, ay - py * ra);
    ctx.closePath();
  }

  function crop(full) {
    const w = full.width;
    const h = full.height;
    const ctx = full.getContext("2d", { willReadFrequently: true });
    const data = ctx.getImageData(0, 0, w, h).data;
    let x0 = w;
    let y0 = h;
    let x1 = 0;
    let y1 = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x;
          if (y < y0) y0 = y;
          if (x + 1 > x1) x1 = x + 1;
          if (y + 1 > y1) y1 = y + 1;
        }
      }
    }
    if (x1 <= x0 || y1 <= y0) return null;
    const image = document.createElement("canvas");
    image.width = x1 - x0;
    image.height = y1 - y0;
    image.getContext("2d").drawImage(full, x0, y0, image.width, image.height, 0, 0, image.width, image.height);
    return { image: image, x: x0, y: y0 };
  }

  function distToSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function rowHalf(data, w, h, y, bx, others) {
    if (y < 0 || y >= h) return null;
    let ix = Math.round(bx);
    const row = y * w;
    if (ix < 0 || ix >= w || data[(row + ix) * 4 + 3] < 28) {
      let found = -1;
      for (let rad = 1; rad < 22 && found < 0; rad++) {
        if (ix - rad >= 0 && data[(row + ix - rad) * 4 + 3] > 28) found = ix - rad;
        else if (ix + rad < w && data[(row + ix + rad) * 4 + 3] > 28) found = ix + rad;
      }
      if (found < 0) return null;
      ix = found;
    }
    let L = ix;
    while (L > 0 && data[(row + L - 1) * 4 + 3] > 28) L--;
    let R = ix;
    while (R + 1 < w && data[(row + R + 1) * 4 + 3] > 28) R++;
    others.forEach(function (ox) {
      if (ox < L || ox > R) return;
      const mid = (bx + ox) * 0.5;
      if (ox < bx) L = Math.max(L, Math.ceil(mid));
      else R = Math.min(R, Math.floor(mid));
    });
    if (R < L) return null;
    return Math.max(bx - L, R - bx);
  }

  function legHalf(data, w, h, leg, legs) {
    const samples = [];
    for (let y = Math.min(h - 1, Math.round(leg.foot[1])); y > leg.hip[1]; y--) {
      const span = (leg.foot[1] - leg.hip[1]) || 1;
      const t = Math.max(0, Math.min(1, (y - leg.hip[1]) / span));
      const bx = leg.hip[0] + (leg.foot[0] - leg.hip[0]) * t;
      const others = [];
      names.forEach(function (on) {
        const ol = legs[on];
        if (ol === leg) return;
        const os = (ol.foot[1] - ol.hip[1]) || 1;
        const ot = Math.max(0, Math.min(1, (y - ol.hip[1]) / os));
        others.push(ol.hip[0] + (ol.foot[0] - ol.hip[0]) * ot);
      });
      const rad = rowHalf(data, w, h, y, bx, others);
      if (rad == null) continue;
      if (samples.length >= 6) {
        const head = samples.slice(0, 6).sort(function (a, b) { return a - b; });
        if (rad > head[(head.length / 2) | 0] * 1.45 + 4) break;
      }
      samples.push(rad);
    }
    if (!samples.length) return 14;
    samples.sort(function (a, b) { return a - b; });
    return Math.min(samples[Math.min(samples.length - 1, (samples.length * 0.82) | 0)] + 3, w * 0.06);
  }

  function clippedWidth(data, w, y, x, bx, others) {
    const row = y * w;
    let L = x;
    let R = x;
    while (L > 0 && data[(row + L - 1) * 4 + 3] > 28) L--;
    while (R + 1 < w && data[(row + R + 1) * 4 + 3] > 28) R++;
    others.forEach(function (ox) {
      if (ox < L || ox > R) return;
      const mid = (bx + ox) * 0.5;
      if (ox < bx) L = Math.max(L, Math.ceil(mid));
      else R = Math.min(R, Math.floor(mid));
    });
    return R - L;
  }

  function buildMask(data, w, h, legs) {
    const mark = new Uint8Array(w * h);
    names.forEach(function (name, li) {
      const leg = legs[name];
      const code = li + 1;
      const hw = leg.halfW;
      const hip = leg.hip;
      const knee = leg.knee;
      const foot = leg.foot;
      const stack = [];
      function push(sx, sy) {
        const x = Math.round(sx);
        const y = Math.round(sy);
        if (x >= 0 && y >= 0 && x < w && y < h) stack.push(y * w + x);
      }
      push(foot[0], foot[1]);
      push(knee[0], knee[1]);
      push((hip[0] + knee[0]) / 2, (hip[1] + knee[1]) / 2);
      push((knee[0] + foot[0]) / 2, (knee[1] + foot[1]) / 2);
      const limit = hip[1] + 2;
      while (stack.length) {
        const n = stack.pop();
        if (mark[n]) continue;
        const x = n % w;
        const y = (n - x) / w;
        if (data[n * 4 + 3] < 28 || y < limit) {
          mark[n] = 9;
          continue;
        }
        if (Math.min(
          distToSeg(x, y, hip[0], hip[1], knee[0], knee[1]),
          distToSeg(x, y, knee[0], knee[1], foot[0], foot[1])
        ) > hw) {
          mark[n] = 9;
          continue;
        }
        const span = (foot[1] - hip[1]) || 1;
        const t = Math.max(0, Math.min(1, (y - hip[1]) / span));
        const bx = hip[0] + (foot[0] - hip[0]) * t;
        const oxs = [];
        names.forEach(function (on) {
          if (on === name) return;
          const ol = legs[on];
          const os = (ol.foot[1] - ol.hip[1]) || 1;
          const ot = Math.max(0, Math.min(1, (y - ol.hip[1]) / os));
          oxs.push(ol.hip[0] + (ol.foot[0] - ol.hip[0]) * ot);
        });
        if (clippedWidth(data, w, y, x, bx, oxs) > hw * 2.15) {
          mark[n] = 9;
          continue;
        }
        mark[n] = code;
        if (x > 0) stack.push(n - 1);
        if (x + 1 < w) stack.push(n + 1);
        if (y > 0) stack.push(n - w);
        if (y + 1 < h) stack.push(n + w);
      }
      leg.code = code;
    });
    const grown = new Uint8Array(mark);
    for (let n = 0; n < mark.length; n++) {
      const code = mark[n];
      if (code < 1 || code > 4) continue;
      const x = n % w;
      const y = (n - x) / w;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx * dx + dy * dy > 4) continue;
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const m = yy * w + xx;
          if (data[m * 4 + 3] > 16 && (grown[m] < 1 || grown[m] > 4)) grown[m] = code;
        }
      }
    }
    return grown;
  }

  function sample(src, x, y) {
    const ctx = src.getContext("2d", { willReadFrequently: true });
    const px = ctx.getImageData(Math.max(0, Math.round(x) - 2), Math.max(0, Math.round(y) - 2), 5, 5).data;
    let r = 0;
    let gch = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] > 180) {
        r += px[i];
        gch += px[i + 1];
        b += px[i + 2];
        n++;
      }
    }
    if (!n) return "rgb(120,100,80)";
    return "rgb(" + Math.round(r / n) + "," + Math.round(gch / n) + "," + Math.round(b / n) + ")";
  }

  function mapPoint(nx, ny, imgW, imgH, padTop, flip) {
    return [(flip ? 1 - nx : nx) * imgW, ny * imgH + padTop];
  }

  function prepare(img, spec) {
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const padTop = spec.pad ? Math.round(imgH * (1 / 0.54 - 1)) : 0;
    const base = document.createElement("canvas");
    base.width = imgW;
    base.height = imgH + padTop;
    const bctx = base.getContext("2d");
    if (spec.flipSrc) {
      bctx.save();
      bctx.translate(imgW, padTop);
      bctx.scale(-1, 1);
      bctx.drawImage(img, 0, 0);
      bctx.restore();
    } else {
      bctx.drawImage(img, 0, padTop);
    }

    const legs = {};
    names.forEach(function (name) {
      const src = spec.legs[name];
      const hip = mapPoint(src.hip[0], src.hip[1], imgW, imgH, padTop, spec.flipSrc);
      const knee = mapPoint(src.knee[0], src.knee[1], imgW, imgH, padTop, spec.flipSrc);
      const foot = mapPoint(src.foot[0], src.foot[1], imgW, imgH, padTop, spec.flipSrc);
      const rw = imgW;
      const rad = [src.r[0] * rw, src.r[1] * rw, src.r[2] * rw];
      legs[name] = {
        hip: hip,
        knee: knee,
        foot: foot,
        L1: Math.hypot(knee[0] - hip[0], knee[1] - hip[1]),
        L2: Math.hypot(foot[0] - knee[0], foot[1] - knee[1]),
        rad: rad,
        hind: name.indexOf("Hind") >= 0,
        bend: bendOf[name]
      };
    });
    const shot = bctx.getImageData(0, 0, base.width, base.height);
    const src = new Uint8ClampedArray(shot.data);
    keepLargest(src, base.width, base.height);
    const feetX = names.map(function (name) { return legs[name].foot[0]; });
    names.forEach(function (name, index) {
      const leg = legs[name];
      let xMin = 0;
      let xMax = base.width;
      feetX.forEach(function (fx, i) {
        if (i === index) return;
        const mid = (leg.foot[0] + fx) / 2;
        if (fx < leg.foot[0]) xMin = Math.max(xMin, mid);
        else xMax = Math.min(xMax, mid);
      });
      leg.xMin = xMin;
      leg.xMax = xMax;
      const found = findHip(src, base.width, base.height, leg.foot[0], leg.foot[1], leg.hip[1], xMin, xMax);
      if (found) {
        leg.hip = [found.x, found.y];
        const span = leg.foot[1] - leg.hip[1];
        const kneeT = span > 8 ? (leg.knee[1] - leg.hip[1]) / span : 0;
        if (kneeT < 0.3 || kneeT > 0.68) {
          const t = leg.hind ? 0.48 : 0.44;
          leg.knee = [
            leg.hip[0] + (leg.foot[0] - leg.hip[0]) * t,
            leg.hip[1] + span * t
          ];
        }
        leg.L1 = Math.hypot(leg.knee[0] - leg.hip[0], leg.knee[1] - leg.hip[1]);
        leg.L2 = Math.hypot(leg.foot[0] - leg.knee[0], leg.foot[1] - leg.knee[1]);
        const authored = spec.legs[name].r[0] * base.width;
        leg.halfW = Math.max(7, Math.min(found.hw, Math.max(authored * 1.8, found.hw * 0.72)));
      } else {
        leg.halfW = legHalf(src, base.width, base.height, leg, legs);
      }
    });
    if (spec === specs.lioncub) {
      const fix = {
        farHind: { hip: [90, 424], hw: 15 },
        nearHind: { hip: [146, 456], hw: 17 },
        farFore: { hip: [236, 448], hw: 16 },
        nearFore: { hip: [311, 362], hw: 15 }
      };
      names.forEach(function (name) {
        const leg = legs[name];
        const item = fix[name];
        leg.hip = item.hip;
        const span = leg.foot[1] - leg.hip[1];
        const t = leg.hind ? 0.46 : 0.42;
        leg.knee = [leg.hip[0] + (leg.foot[0] - leg.hip[0]) * t, leg.hip[1] + span * t];
        leg.L1 = Math.hypot(leg.knee[0] - leg.hip[0], leg.knee[1] - leg.hip[1]);
        leg.L2 = Math.hypot(leg.foot[0] - leg.knee[0], leg.foot[1] - leg.knee[1]);
        leg.halfW = item.hw;
      });
    }
    const pieces = buildPieces(src, base.width, base.height, legs);

    let ground = 0;
    names.forEach(function (name) {
      ground = Math.max(ground, legs[name].foot[1]);
    });
    spec.crouch = spec.heavy ? 10 : 14;
    const reaches = names.map(function (name) {
      const leg = legs[name];
      const height = Math.max(8, ground - leg.hip[1] - spec.crouch);
      const length = leg.L1 + leg.L2;
      if (length <= height + 1) return Math.max(18, Math.abs(leg.foot[0] - leg.hip[0]));
      return Math.sqrt(length * length - height * height) * 0.82;
    });
    const half = Math.max(16, Math.min.apply(null, reaches));
    spec.stride = half * 2 / spec.duty;
    spec.lift = (spec.heavy ? 18 : 32);
    if (spec === specs.lioncub) {
      spec.stride = Math.min(spec.stride, 54);
      spec.lift = 16;
      spec.crouch = 6;
    }
    spec.bob = spec.heavy ? 3 : 5;
    spec.skin = {
      w: base.width, h: base.height, legs: legs, ground: ground,
      src: src, src32: new Uint32Array(src.buffer), pieces: pieces
    };
    return spec.skin;
  }

  function project(x, y, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const len = Math.sqrt(len2);
    return {
      t: ((x - ax) * dx + (y - ay) * dy) / len2,
      d: ((x - ax) * -dy + (y - ay) * dx) / len
    };
  }

  function bindVertex(x, y, legs) {
    let best = null;
    names.forEach(function (name) {
      const leg = legs[name];
      const reach = Math.min(leg.halfW * 0.9, 34);
      const up = project(x, y, leg.hip[0], leg.hip[1], leg.knee[0], leg.knee[1]);
      const lo = project(x, y, leg.knee[0], leg.knee[1], leg.foot[0], leg.foot[1]);
      function consider(part, pr, t0, t1) {
        if (pr.t < t0 || pr.t > t1 || Math.abs(pr.d) > reach) return;
        const ad = Math.abs(pr.d);
        if (!best || ad < best.ad) best = { name: name, part: part, t: pr.t, d: pr.d, ad: ad, reach: reach, leg: leg };
      }
      consider("upper", up, -0.04, 1.05);
      consider("lower", lo, -0.08, 1.25);
    });
    if (!best) return [{ k: "", w: 1 }];
    const knee = best.leg.knee;
    const kd = Math.hypot(x - knee[0], y - knee[1]);
    const kr = Math.min(18, best.reach * 0.75);
    const up = project(x, y, best.leg.hip[0], best.leg.hip[1], knee[0], knee[1]);
    const lo = project(x, y, knee[0], knee[1], best.leg.foot[0], best.leg.foot[1]);
    const inf = [];
    if (kd < kr) {
      const blend = 1 - kd / kr;
      const keep = 1 - blend * 0.5;
      const share = blend * 0.5;
      if (best.part === "upper") {
        inf.push({ k: best.name, part: "upper", t: up.t, d: up.d, w: keep });
        inf.push({ k: best.name, part: "lower", t: lo.t, d: lo.d, w: share });
      } else {
        inf.push({ k: best.name, part: "lower", t: lo.t, d: lo.d, w: keep });
        inf.push({ k: best.name, part: "upper", t: up.t, d: up.d, w: share });
      }
    } else {
      inf.push({ k: best.name, part: best.part, t: best.t, d: best.d, w: 1 });
    }
    const thigh = inf[0];
    if (thigh.part === "upper" && thigh.t < 0.18) {
      const hb = (0.18 - Math.max(0, thigh.t)) / 0.18;
      inf.forEach(function (item) { item.w *= 1 - hb; });
      inf.push({ k: "", w: hb });
    }
    let sum = 0;
    inf.forEach(function (item) { sum += item.w; });
    inf.forEach(function (item) { item.w /= sum || 1; });
    return inf;
  }

  function distLeg(x, y, leg) {
    const up = project(x, y, leg.hip[0], leg.hip[1], leg.knee[0], leg.knee[1]);
    const lo = project(x, y, leg.knee[0], leg.knee[1], leg.foot[0], leg.foot[1]);
    function seg(pr, len) {
      if (pr.t >= 0 && pr.t <= 1) return Math.abs(pr.d);
      const end = pr.t < 0 ? 0 : 1;
      return Math.hypot((pr.t - end) * len, pr.d);
    }
    const l1 = Math.hypot(leg.knee[0] - leg.hip[0], leg.knee[1] - leg.hip[1]) || 1;
    const l2 = Math.hypot(leg.foot[0] - leg.knee[0], leg.foot[1] - leg.knee[1]) || 1;
    return Math.min(seg(up, l1), seg(lo, l2));
  }

  function assignLeg(v, name, leg) {
    const up = project(v.x, v.y, leg.hip[0], leg.hip[1], leg.knee[0], leg.knee[1]);
    const lo = project(v.x, v.y, leg.knee[0], leg.knee[1], leg.foot[0], leg.foot[1]);
    const upper = v.y <= leg.knee[1];
    const kd = Math.hypot(v.x - leg.knee[0], v.y - leg.knee[1]);
    const inf = [];
    if (kd < 16) {
      const blend = 1 - kd / 16;
      const keep = 1 - blend * 0.5;
      const share = blend * 0.5;
      if (upper) {
        inf.push({ k: name, part: "upper", t: up.t, d: up.d, w: keep });
        inf.push({ k: name, part: "lower", t: lo.t, d: lo.d, w: share });
      } else {
        inf.push({ k: name, part: "lower", t: lo.t, d: lo.d, w: keep });
        inf.push({ k: name, part: "upper", t: up.t, d: up.d, w: share });
      }
    } else if (upper) {
      inf.push({ k: name, part: "upper", t: up.t, d: up.d, w: 1 });
    } else {
      inf.push({ k: name, part: "lower", t: lo.t, d: lo.d, w: 1 });
    }
    if (upper && up.t < 0.22) {
      const hb = (0.22 - Math.max(0, up.t)) / 0.22 * 0.28;
      inf.forEach(function (item) { item.w *= 1 - hb; });
      inf.push({ k: "", w: hb });
    }
    let sum = 0;
    inf.forEach(function (item) { sum += item.w; });
    inf.forEach(function (item) { item.w /= sum || 1; });
    v.inf = inf;
    v.claim = name;
    v.claimD = distLeg(v.x, v.y, leg);
  }

  function claimLegs(verts, legs) {
    const ys = [];
    const seen = {};
    verts.forEach(function (v) {
      if (!seen[v.y]) {
        seen[v.y] = 1;
        ys.push(v.y);
      }
    });
    ys.sort(function (a, b) { return a - b; });
    const rows = {};
    verts.forEach(function (v) {
      (rows[v.y] || (rows[v.y] = [])).push(v);
    });
    names.forEach(function (name) {
      const leg = legs[name];
      const cap = Math.max(18, leg.halfW * 2.1);
      let win = null;
      for (let i = ys.length - 1; i >= 0; i--) {
        const y = ys[i];
        if (y > leg.foot[1] + 12) continue;
        if (y < leg.hip[1] - 8) break;
        const row = rows[y];
        if (!win) {
          const seeds = row.filter(function (v) {
            const d = distLeg(v.x, v.y, leg);
            return d < Math.min(leg.halfW, 30) && (!v.claim || v.claimD > d);
          });
          if (!seeds.length) continue;
          seeds.forEach(function (v) { assignLeg(v, name, leg); });
          win = {
            min: Math.min.apply(null, seeds.map(function (v) { return v.x; })),
            max: Math.max.apply(null, seeds.map(function (v) { return v.x; }))
          };
          continue;
        }
        const mid = (win.min + win.max) / 2;
        const next = [];
        row.forEach(function (v) {
          if (v.x < win.min - 8 || v.x > win.max + 8) return;
          if (v.x < mid - cap / 2 || v.x > mid + cap / 2) return;
          const d = distLeg(v.x, v.y, leg);
          if (v.claim && v.claimD <= d) return;
          next.push(v);
        });
        if (!next.length) {
          win = null;
          continue;
        }
        next.forEach(function (v) { assignLeg(v, name, leg); });
        const min = Math.min.apply(null, next.map(function (v) { return v.x; }));
        const max = Math.max.apply(null, next.map(function (v) { return v.x; }));
        win = {
          min: Math.max(mid - cap / 2, Math.max(win.min - 5, min)),
          max: Math.min(mid + cap / 2, Math.min(win.max + 5, max))
        };
      }
    });
  }

  function legOf(inf) {
    let name = "";
    let best = 0.42;
    inf.forEach(function (item) {
      if (item.k && item.w > best) {
        best = item.w;
        name = item.k;
      }
    });
    return name;
  }

  function nearOpaque(src, w, h, x, y, r) {
    const x0 = Math.max(0, Math.round(x - r));
    const y0 = Math.max(0, Math.round(y - r));
    const x1 = Math.min(w - 1, Math.round(x + r));
    const y1 = Math.min(h - 1, Math.round(y + r));
    for (let yy = y0; yy <= y1; yy += 2) {
      const row = yy * w;
      for (let xx = x0; xx <= x1; xx += 2) {
        if (src[(row + xx) * 4 + 3] > 24) return true;
      }
    }
    return false;
  }

  function buildMesh(src, w, h, legs) {
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < h; y += 3) {
      const row = y * w;
      for (let x = 0; x < w; x += 3) {
        if (src[(row + x) * 4 + 3] > 24) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    const step = 8;
    const x0 = Math.max(0, minX - step);
    const y0 = Math.max(0, minY - step);
    const cols = Math.ceil((maxX - x0) / step) + 1;
    const rows = Math.ceil((maxY - y0) / step) + 1;
    const index = new Int16Array(cols * rows);
    index.fill(-1);
    const verts = [];
    for (let j = 0; j < rows; j++) {
      const y = Math.min(h - 1, y0 + j * step);
      for (let i = 0; i < cols; i++) {
        const x = Math.min(w - 1, x0 + i * step);
        if (!nearOpaque(src, w, h, x, y, step * 0.72)) continue;
        index[j * cols + i] = verts.length;
        verts.push({ x: x, y: y, inf: [{ k: "", w: 1 }] });
      }
    }
    claimLegs(verts, legs);
    function solid(ia, ib, ic) {
      const group = {};
      let count = 0;
      [ia, ib, ic].forEach(function (id) {
        const name = legOf(verts[id].inf);
        if (!name || group[name]) return;
        group[name] = 1;
        count++;
      });
      if (count > 1) return "";
      const name = legOf(verts[ia].inf) || legOf(verts[ib].inf) || legOf(verts[ic].inf);
      const vx = (verts[ia].x + verts[ib].x + verts[ic].x) / 3;
      const vy = (verts[ia].y + verts[ib].y + verts[ic].y) / 3;
      const sx = Math.max(0, Math.min(w - 1, Math.round(vx)));
      const sy = Math.max(0, Math.min(h - 1, Math.round(vy)));
      if (src[(sy * w + sx) * 4 + 3] < 24 && !name) return "";
      if (!name) return "body";
      return name.indexOf("near") === 0 ? "near" : "far";
    }
    const far = [];
    const body = [];
    const near = [];
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = index[j * cols + i];
        const b = index[j * cols + i + 1];
        const c = index[(j + 1) * cols + i];
        const d = index[(j + 1) * cols + i + 1];
        [[a, b, c], [b, d, c]].forEach(function (tri) {
          if (tri[0] < 0 || tri[1] < 0 || tri[2] < 0) return;
          const layer = solid(tri[0], tri[1], tri[2]);
          const list = layer === "far" ? far : layer === "near" ? near : layer === "body" ? body : null;
          if (!list) return;
          list.push(tri[0], tri[1], tri[2]);
        });
      }
    }
    return { verts: verts, far: far, body: body, near: near };
  }

  function bonePoint(inf, posed) {
    const pose = posed[inf.k];
    const a = inf.part === "upper" ? pose.hip : pose.knee;
    const b = inf.part === "upper" ? pose.knee : pose.foot;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [a[0] + dx * inf.t + (-dy / len) * inf.d, a[1] + dy * inf.t + (dx / len) * inf.d];
  }

  function rasterTri(dst, dw, dh, src32, sw, sh, ax, ay, au, av, bx, by, bu, bv, cx, cy, cu, cv, fallback) {
    if (ay > by) {
      let t = ax; ax = bx; bx = t; t = ay; ay = by; by = t; t = au; au = bu; bu = t; t = av; av = bv; bv = t;
    }
    if (by > cy) {
      let t = bx; bx = cx; cx = t; t = by; by = cy; cy = t; t = bu; bu = cu; cu = t; t = bv; bv = cv; cv = t;
    }
    if (ay > by) {
      let t = ax; ax = bx; bx = t; t = ay; ay = by; by = t; t = au; au = bu; bu = t; t = av; av = bv; bv = t;
    }
    if (cy - ay < 0.05) return;
    const y0 = Math.max(0, Math.floor(ay));
    const y1 = Math.min(dh - 1, Math.ceil(cy));
    for (let y = y0; y <= y1; y++) {
      const yy = y + 0.5;
      if (yy < ay || yy > cy) continue;
      const tLong = (yy - ay) / (cy - ay);
      let xL = ax + (cx - ax) * tLong;
      let uL = au + (cu - au) * tLong;
      let vL = av + (cv - av) * tLong;
      let xR;
      let uR;
      let vR;
      if (yy < by || by - ay < 0.001) {
        const den = (by - ay) || 1;
        const t = (yy - ay) / den;
        xR = ax + (bx - ax) * t;
        uR = au + (bu - au) * t;
        vR = av + (bv - av) * t;
      } else {
        const den = (cy - by) || 1;
        const t = (yy - by) / den;
        xR = bx + (cx - bx) * t;
        uR = bu + (cu - bu) * t;
        vR = bv + (cv - bv) * t;
      }
      if (xL > xR) {
        let t = xL; xL = xR; xR = t; t = uL; uL = uR; uR = t; t = vL; vL = vR; vR = t;
      }
      const xStart = Math.max(0, Math.floor(xL));
      const xEnd = Math.min(dw - 1, Math.ceil(xR));
      const span = (xR - xL) || 1;
      const row = y * dw;
      for (let x = xStart; x <= xEnd; x++) {
        const t = (x + 0.5 - xL) / span;
        const u = uL + (uR - uL) * t;
        const v = vL + (vR - vL) * t;
        const sx = u <= 0 ? 0 : u >= sw - 1 ? sw - 1 : (u + 0.5) | 0;
        const sy = v <= 0 ? 0 : v >= sh - 1 ? sh - 1 : (v + 0.5) | 0;
        let pixel = src32[sy * sw + sx];
        if (pixel >>> 24 < 16) pixel = fallback;
        if (pixel >>> 24 < 16) continue;
        dst[row + x] = pixel;
      }
    }
  }

  function paintMesh(skin, posed, shift) {
    const mesh = skin.mesh;
    const verts = mesh.verts;
    const px = new Float32Array(verts.length);
    const py = new Float32Array(verts.length);
    for (let i = 0; i < verts.length; i++) {
      const vert = verts[i];
      let x = 0;
      let y = 0;
      vert.inf.forEach(function (inf) {
        if (!inf.k) {
          x += (vert.x) * inf.w;
          y += (vert.y + shift) * inf.w;
          return;
        }
        const p = bonePoint(inf, posed);
        x += p[0] * inf.w;
        y += p[1] * inf.w;
      });
      px[i] = x;
      py[i] = y;
    }
    const ctx = skin.sheet.getContext("2d", { willReadFrequently: true });
    const image = ctx.createImageData(skin.w, skin.h);
    const dst = new Uint32Array(image.data.buffer);
    const src32 = skin.src32;
    function paint(list) {
      for (let n = 0; n < list.length; n += 3) {
        const ia = list[n];
        const ib = list[n + 1];
        const ic = list[n + 2];
        const ax = px[ia];
        const ay = py[ia];
        const bx = px[ib];
        const by = py[ib];
        const cx = px[ic];
        const cy = py[ic];
        const mx = (ax + bx + cx) / 3;
        const my = (ay + by + cy) / 3;
        function grow(x, y) {
          const dx = x - mx;
          const dy = y - my;
          const len = Math.hypot(dx, dy) || 1;
          return [x + dx / len * 0.7, y + dy / len * 0.7];
        }
        const ga = grow(ax, ay);
        const gb = grow(bx, by);
        const gc = grow(cx, cy);
        function corner(u, v) {
          const sx = u <= 0 ? 0 : u >= skin.w - 1 ? skin.w - 1 : (u + 0.5) | 0;
          const sy = v <= 0 ? 0 : v >= skin.h - 1 ? skin.h - 1 : (v + 0.5) | 0;
          return src32[sy * skin.w + sx];
        }
        const ca = corner(verts[ia].x, verts[ia].y);
        const cb = corner(verts[ib].x, verts[ib].y);
        const cc = corner(verts[ic].x, verts[ic].y);
        const fallback = (ca >>> 24) > 16 ? ca : (cb >>> 24) > 16 ? cb : cc;
        rasterTri(dst, skin.w, skin.h, src32, skin.w, skin.h,
          ga[0], ga[1], verts[ia].x, verts[ia].y,
          gb[0], gb[1], verts[ib].x, verts[ib].y,
          gc[0], gc[1], verts[ic].x, verts[ic].y, fallback);
      }
    }
    paint(mesh.far);
    paint(mesh.body);
    paint(mesh.near);
    ctx.putImageData(image, 0, 0);
    return skin.sheet;
  }

  function bone(ctx, ax, ay, bx, by, wa, wb, color) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    ctx.beginPath();
    ctx.moveTo(ax + px * wa, ay + py * wa);
    ctx.lineTo(bx + px * wb, by + py * wb);
    ctx.lineTo(bx - px * wb, by - py * wb);
    ctx.lineTo(ax - px * wa, ay - py * wa);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function paintLeg(ctx, spec, leg, hip, knee, foot, far) {
    const color = far ? spec.legFar : spec.leg;
    const w = leg.halfW || 16;
    const upper = w * (spec.heavy ? 1.22 : 1.08);
    const mid = w * (spec.heavy ? 0.95 : 0.72);
    const lower = w * (spec.heavy ? 0.78 : 0.55);
    const lowerColor = spec.tan ? (far ? "#b89868" : "#c4a878") : color;
    const hx = hip[0];
    const hy = hip[1] - 6;
    bone(ctx, hx, hy, knee[0], knee[1], upper, mid, color);
    bone(ctx, knee[0], knee[1], foot[0], foot[1], mid, lower, lowerColor);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(knee[0], knee[1], mid * 0.72, 0, Math.PI * 2);
    ctx.fill();
    if (spec.stripe) {
      [0.38, 0.68].forEach(function (t) {
        bone(ctx,
          hip[0] + (knee[0] - hip[0]) * t, hip[1] + (knee[1] - hip[1]) * t,
          hip[0] + (knee[0] - hip[0]) * (t + 0.1), hip[1] + (knee[1] - hip[1]) * (t + 0.1),
          upper * 0.96, upper * 0.9, spec.stripe);
        bone(ctx,
          knee[0] + (foot[0] - knee[0]) * t, knee[1] + (foot[1] - knee[1]) * t,
          knee[0] + (foot[0] - knee[0]) * (t + 0.12), knee[1] + (foot[1] - knee[1]) * (t + 0.12),
          mid * 0.96, lower * 0.9, spec.stripe);
      });
    }
    const ang = Math.atan2(foot[1] - knee[1], foot[0] - knee[0]);
    ctx.save();
    ctx.translate(foot[0], foot[1]);
    ctx.rotate(ang - Math.PI / 2);
    ctx.fillStyle = spec.tan ? lowerColor : (spec.paw ? color : spec.hoof);
    ctx.beginPath();
    if (spec.paw) ctx.ellipse(0, 2, lower * 1.25, lower * 0.62, 0, 0, Math.PI * 2);
    else ctx.ellipse(0, 1, lower * 1.05, lower * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function poseLeg(spec, leg, cycle, plant, bob) {
    const phase = ((cycle - phaseOf[leg.name]) % 1 + 1) % 1;
    const walk = footOffset(spec, phase, leg.hind);
    const hip = [leg.hip[0], leg.hip[1] + bob];
    const paintedX = leg.foot[0] - leg.hip[0];
    const tx = hip[0] + walk.x * (1 - plant) + paintedX * plant;
    const ty = (spec.skin.ground + walk.y) * (1 - plant) + leg.foot[1] * plant;
    const solved = ik(hip[0], hip[1], tx, ty, leg.L1, leg.L2, leg.bend);
    return {
      hip: hip,
      knee: [
        solved.jx * (1 - plant) + leg.knee[0] * plant,
        solved.jy * (1 - plant) + (leg.knee[1] + bob) * plant
      ],
      foot: [solved.fx * (1 - plant) + leg.foot[0] * plant, solved.fy * (1 - plant) + leg.foot[1] * plant]
    };
  }

  function paintBone(data, w, h, src, mark, code, ax, ay, bx, by, rax, ray, rbx, rby, hw) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const len = Math.sqrt(len2);
    const px = -dy / len;
    const py = dx / len;
    const rdx = rbx - rax;
    const rdy = rby - ray;
    const rlen = Math.hypot(rdx, rdy) || 1;
    const rpx = -rdy / rlen;
    const rpy = rdx / rlen;
    const reach = hw + 2;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - reach));
    const x1 = Math.min(w - 1, Math.ceil(Math.max(ax, bx) + reach));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by) - reach));
    const y1 = Math.min(h - 1, Math.ceil(Math.max(ay, by) + reach));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ox = x - ax;
        const oy = y - ay;
        const t = (ox * dx + oy * dy) / len2;
        if (t < -0.08 || t > 1.14) continue;
        const d = ox * px + oy * py;
        if (d > reach || d < -reach) continue;
        const ix = Math.round(rax + t * rdx + d * rpx);
        const iy = Math.round(ray + t * rdy + d * rpy);
        if (ix < 0 || iy < 0 || ix >= w || iy >= h) continue;
        if (mark[iy * w + ix] !== code) continue;
        const si = (iy * w + ix) * 4;
        const a = src[si + 3];
        if (a < 16) continue;
        const di = (y * w + x) * 4;
        const da = a / 255;
        const oa = data[di + 3] / 255;
        const outA = da + oa * (1 - da);
        if (outA < 0.001) continue;
        data[di] = (src[si] * da + data[di] * oa * (1 - da)) / outA;
        data[di + 1] = (src[si + 1] * da + data[di + 1] * oa * (1 - da)) / outA;
        data[di + 2] = (src[si + 2] * da + data[di + 2] * oa * (1 - da)) / outA;
        data[di + 3] = outA * 255;
      }
    }
  }

  function layer(skin, key) {
    let canvas = skin[key];
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = skin.w;
      canvas.height = skin.h;
      skin[key] = canvas;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, skin.w, skin.h);
    return ctx;
  }

  function stampLegs(skin, spec, posed, which, far) {
    const ctx = layer(skin, which);
    which.forEach(function (name) {
      const pose = posed[name];
      const leg = skin.legs[name];
      const saved = leg.halfW;
      leg.halfW = saved * 0.82;
      paintLeg(ctx, spec, leg, pose.hip, pose.knee, pose.foot, far);
      leg.halfW = saved;
    });
    const image = ctx.getImageData(0, 0, skin.w, skin.h);
    which.forEach(function (name) {
      const pose = posed[name];
      const leg = skin.legs[name];
      paintBone(image.data, skin.w, skin.h, skin.src, skin.mark, leg.code,
        pose.hip[0], pose.hip[1], pose.knee[0], pose.knee[1],
        leg.hip[0], leg.hip[1], leg.knee[0], leg.knee[1], leg.halfW);
      paintBone(image.data, skin.w, skin.h, skin.src, skin.mark, leg.code,
        pose.knee[0], pose.knee[1], pose.foot[0], pose.foot[1],
        leg.knee[0], leg.knee[1], leg.foot[0], leg.foot[1], leg.halfW);
    });
    ctx.putImageData(image, 0, 0);
    return skin[which];
  }

  function keepLargest(data, w, h) {
    const seen = new Uint8Array(w * h);
    const stack = [];
    let bestN = 0;
    const drop = [];
    for (let i = 0; i < w * h; i++) {
      if (seen[i] || data[i * 4 + 3] < 28) continue;
      stack.push(i);
      seen[i] = 1;
      const cells = [i];
      while (stack.length) {
        const p = stack.pop();
        const x = p % w;
        const y = (p / w) | 0;
        if (x > 0) stackPush(p - 1);
        if (x + 1 < w) stackPush(p + 1);
        if (y > 0) stackPush(p - w);
        if (y + 1 < h) stackPush(p + w);
      }
      function stackPush(n) {
        if (seen[n] || data[n * 4 + 3] < 28) return;
        seen[n] = 1;
        cells.push(n);
        stack.push(n);
      }
      if (cells.length > bestN) bestN = cells.length;
      drop.push(cells);
    }
    drop.forEach(function (cells) {
      if (cells.length === bestN || cells.length > 900) return;
      cells.forEach(function (p) { data[p * 4 + 3] = 0; });
    });
  }

  function columnRun(src, w, h, x, y, xMin, xMax) {
    x = Math.round(x);
    y = Math.round(y);
    if (y < 0 || y >= h || x < 0 || x >= w) return null;
    const lo = xMin == null ? 0 : Math.max(0, Math.ceil(xMin));
    const hi = xMax == null ? w - 1 : Math.min(w - 1, Math.floor(xMax));
    if (src[(y * w + x) * 4 + 3] < 28) {
      let found = -1;
      for (let rad = 1; rad <= 16 && found < 0; rad++) {
        if (x - rad >= lo && src[(y * w + x - rad) * 4 + 3] > 28) found = x - rad;
        else if (x + rad <= hi && src[(y * w + x + rad) * 4 + 3] > 28) found = x + rad;
      }
      if (found < 0) return null;
      x = found;
    }
    let left = x;
    let right = x;
    while (left > lo && src[(y * w + left - 1) * 4 + 3] > 28) left--;
    while (right < hi && src[(y * w + right + 1) * 4 + 3] > 28) right++;
    return { x: (left + right) / 2, y: y, width: right - left + 1 };
  }

  function findHip(src, w, h, footX, footY, ceilingY, xMin, xMax) {
    let x = footX;
    let prev = null;
    let narrow = null;
    const recent = [];
    const acceptY = footY - Math.max(28, (footY - ceilingY) * 0.42);
    for (let y = Math.round(footY) - 4; y > ceilingY - 8 && y > 8; y--) {
      const got = columnRun(src, w, h, x, y, xMin, xMax);
      if (!got) break;
      if (prev && Math.abs(got.x - prev.x) > Math.max(22, prev.width * 0.85)) break;
      recent.push(got.width);
      if (recent.length > 16) recent.shift();
      const sorted = recent.slice().sort(function (a, b) { return a - b; });
      const med = sorted[sorted.length >> 1];
      if (recent.length >= 6 && got.width > med * 1.55 && got.width > med + 10 && y < acceptY) {
        const slim = recent.filter(function (wth) { return wth < med * 1.25; });
        const use = slim.length ? slim.sort(function (a, b) { return a - b; })[slim.length >> 1] : med;
        return {
          x: prev.x,
          y: Math.max(prev.y - 12, ceilingY),
          hw: use / 2
        };
      }
      if (got.width < med * 1.3) narrow = got;
      prev = got;
      x = got.x;
    }
    if (!narrow && !prev) return null;
    const at = narrow || prev;
    const sorted = recent.slice().sort(function (a, b) { return a - b; });
    const med = sorted.length ? sorted[sorted.length >> 1] : at.width;
    return { x: at.x, y: Math.max(at.y - 8, ceilingY), hw: med / 2 };
  }

  function stripAt(src, w, h, x, y, pxu, pyu, cap) {
    const lim = Math.ceil(cap);
    function side(dir) {
      let edge = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      let gap = 0;
      for (let s = 0; s <= lim; s++) {
        const sx = Math.round(x + pxu * dir * s);
        const sy = Math.round(y + pyu * dir * s);
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) break;
        const o = (sy * w + sx) * 4;
        if (src[o + 3] < 28) {
          gap++;
          if (gap > 2 && n) break;
          continue;
        }
        gap = 0;
        r += src[o];
        g += src[o + 1];
        b += src[o + 2];
        n++;
        edge = s;
      }
      return { edge: edge, r: r, g: g, b: b, n: n };
    }
    const neg = side(-1);
    const pos = side(1);
    const n = neg.n + pos.n;
    if (!n) return null;
    return {
      d: (pos.edge - neg.edge) / 2,
      hw: Math.max(4.5, (pos.edge + neg.edge) / 2),
      open: neg.edge >= lim - 1 || pos.edge >= lim - 1,
      color: "rgb(" + ((neg.r + pos.r) / n | 0) + "," + ((neg.g + pos.g) / n | 0) + "," + ((neg.b + pos.b) / n | 0) + ")"
    };
  }

  function traceProfile(src, w, h, leg) {
    const cap = Math.min(leg.halfW * 1.05, 38);
    const out = [];
    function add(part, t0, t1) {
      const a = part === "upper" ? leg.hip : leg.knee;
      const b = part === "upper" ? leg.knee : leg.foot;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const pxu = -dy / len;
      const pyu = dx / len;
      const steps = Math.max(5, Math.round(Math.abs(t1 - t0) * len / 7));
      for (let i = 0; i <= steps; i++) {
        const t = t0 + (t1 - t0) * (i / steps);
        const x = a[0] + dx * t;
        const y = a[1] + dy * t;
        const col = columnRun(src, w, h, x, y, leg.xMin, leg.xMax);
        let hw = cap * 0.7;
        let d = 0;
        let open = true;
        if (col && col.width < Math.max(cap * 2.5, 90)) {
          hw = Math.min(col.width / 2, leg.halfW * 1.15);
          d = (col.x - x) * pxu + ((col.y - y) * pyu);
          open = false;
        }
        const sx = col ? Math.round(col.x) : Math.round(x);
        const sy = Math.round(y);
        let dark = false;
        if (sx >= 0 && sy >= 0 && sx < w && sy < h) {
          const o = (sy * w + sx) * 4;
          if (src[o + 3] > 40) dark = src[o] * 0.25 + src[o + 1] * 0.59 + src[o + 2] * 0.16 < 78;
        }
        out.push({
          part: part, t: t, d: d, hw: hw,
          open: open, dark: dark
        });
      }
    }
    add("upper", 0, 1);
    add("lower", 0, 1.1);
    function anchor(part) {
      const solid = out.filter(function (s) {
        return s.part === part && !s.open && s.t > 0.28 && s.t < 0.82;
      });
      if (!solid.length) return null;
      solid.sort(function (a, b) { return a.hw - b.hw; });
      return solid[solid.length >> 1];
    }
    const upA = anchor("upper");
    const loA = anchor("lower");
    const thigh = upA || loA;
    if (thigh) {
      out.forEach(function (s) {
        if (s.part === "upper" && s.t < 0.42 && (s.open || s.hw > thigh.hw * 1.35)) {
          s.hw = thigh.hw;
          s.d = 0;
        }
      });
    }
    function smoothPart(part, key, maxStep) {
      const idx = [];
      out.forEach(function (s, i) { if (s.part === part) idx.push(i); });
      for (let pass = 0; pass < 2; pass++) {
        for (let k = 1; k < idx.length; k++) {
          const i = idx[k];
          const p = idx[k - 1];
          const delta = out[i][key] - out[p][key];
          if (delta > maxStep) out[i][key] = out[p][key] + maxStep;
          else if (delta < -maxStep) out[i][key] = out[p][key] - maxStep;
        }
        for (let k = idx.length - 2; k >= 0; k--) {
          const i = idx[k];
          const n = idx[k + 1];
          const delta = out[i][key] - out[n][key];
          if (delta > maxStep) out[i][key] = out[n][key] + maxStep;
          else if (delta < -maxStep) out[i][key] = out[n][key] - maxStep;
        }
      }
    }
    ["upper", "lower"].forEach(function (part) {
      smoothPart(part, "hw", 2.2);
      smoothPart(part, "d", 1.4);
    });
    const lowers = out.filter(function (s) { return s.part === "lower" && s.t <= 1; });
    let footHw = 6;
    lowers.forEach(function (s) { if (s.t > 0.72 && s.hw > footHw) footHw = s.hw; });
    out.forEach(function (s) {
      if (s.part === "lower" && s.t > 0.9) s.hw = Math.max(s.hw, footHw);
      s.hw = Math.max(5, s.hw);
    });
    return out;
  }

  function buildPuppet(src, w, h, legs) {
    const body = document.createElement("canvas");
    body.width = w;
    body.height = h;
    const bctx = body.getContext("2d");
    const image = bctx.createImageData(w, h);
    image.data.set(src);
    const px = image.data;
    names.forEach(function (name) {
      const leg = legs[name];
      const reach = Math.min(leg.halfW * 0.98, 36);
      const y0 = Math.max(0, Math.floor(leg.hip[1] + 12));
      const y1 = Math.min(h - 1, Math.ceil(leg.foot[1] + 8));
      const x0 = Math.max(0, Math.floor(Math.min(leg.hip[0], leg.knee[0], leg.foot[0]) - reach - 8));
      const x1 = Math.min(w - 1, Math.ceil(Math.max(leg.hip[0], leg.knee[0], leg.foot[0]) + reach + 8));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const i = (y * w + x) * 4;
          if (px[i + 3] < 20) continue;
          if (distLeg(x, y, leg) > reach) continue;
          let closer = false;
          for (let k = 0; k < names.length; k++) {
            if (names[k] === name) continue;
            if (distLeg(x, y, legs[names[k]]) + 1 < distLeg(x, y, leg)) {
              closer = true;
              break;
            }
          }
          if (!closer) px[i + 3] = 0;
        }
      }
    });
    bctx.putImageData(image, 0, 0);
    const profiles = {};
    names.forEach(function (name) {
      profiles[name] = traceProfile(src, w, h, legs[name]);
    });
    return { body: body, profiles: profiles };
  }

  function blank(w, h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }

  function buildPieces(src, w, h, legs) {
    const body = blank(w, h);
    const bodyCtx = body.getContext("2d");
    const bodyImage = bodyCtx.createImageData(w, h);
    bodyImage.data.set(src);
    const bodyPx = bodyImage.data;
    const pieces = {};
    names.forEach(function (name) {
      const leg = legs[name];
      const upper = blank(w, h);
      const lower = blank(w, h);
      const upImage = upper.getContext("2d").createImageData(w, h);
      const loImage = lower.getContext("2d").createImageData(w, h);
      const upPx = upImage.data;
      const loPx = loImage.data;
      const reach = Math.min(Math.max(leg.halfW * 1.05, 12), 38);
      const y0 = Math.max(0, Math.floor(leg.hip[1] - 6));
      const y1 = Math.min(h - 1, Math.ceil(leg.foot[1] + 8));
      const x0 = Math.max(0, Math.floor(Math.min(leg.hip[0], leg.knee[0], leg.foot[0]) - reach - 6));
      const x1 = Math.min(w - 1, Math.ceil(Math.max(leg.hip[0], leg.knee[0], leg.foot[0]) + reach + 6));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const o = (y * w + x) * 4;
          if (src[o + 3] < 28) continue;
          if (distLeg(x, y, leg) > reach) continue;
          let other = false;
          for (let k = 0; k < names.length; k++) {
            if (names[k] === name) continue;
            if (distLeg(x, y, legs[names[k]]) + 0.5 < distLeg(x, y, leg)) {
              other = true;
              break;
            }
          }
          if (other) continue;
          const kneeD = Math.hypot(x - leg.knee[0], y - leg.knee[1]);
          const overlap = kneeD < reach * 0.95;
          if (overlap || y <= leg.knee[1] + 12) {
            upPx[o] = src[o];
            upPx[o + 1] = src[o + 1];
            upPx[o + 2] = src[o + 2];
            upPx[o + 3] = src[o + 3];
          }
          if (overlap || y >= leg.knee[1] - 12) {
            loPx[o] = src[o];
            loPx[o + 1] = src[o + 1];
            loPx[o + 2] = src[o + 2];
            loPx[o + 3] = src[o + 3];
          }
        }
      }
      upper.getContext("2d").putImageData(upImage, 0, 0);
      lower.getContext("2d").putImageData(loImage, 0, 0);
      let r = 0;
      let gch = 0;
      let b = 0;
      let n = 0;
      for (let i = 0; i < loPx.length; i += 4) {
        if (loPx[i + 3] < 28) continue;
        r += loPx[i];
        gch += loPx[i + 1];
        b += loPx[i + 2];
        n++;
      }
      pieces[name] = {
        upper: upper,
        lower: lower,
        color: n ? "rgb(" + (r / n | 0) + "," + (gch / n | 0) + "," + (b / n | 0) + ")" : "rgb(120,100,80)",
        reach: reach,
        profile: traceProfile(src, w, h, leg)
      };
    });
    erasePaintedLegs(bodyPx, src, w, h, legs, pieces);
    bodyCtx.putImageData(bodyImage, 0, 0);
    return { body: body, parts: pieces };
  }

  function erasePaintedLegs(bodyPx, src, w, h, legs, pieces) {
    const mask = blank(w, h);
    const mctx = mask.getContext("2d");
    const posed = {};
    names.forEach(function (name) {
      const leg = legs[name];
      posed[name] = { hip: leg.hip, knee: leg.knee, foot: leg.foot };
    });
    const skin = { legs: legs, pieces: { parts: pieces } };
    names.forEach(function (name) {
      const secs = legOutline(skin, name, posed).map(function (sec) {
        return growSec(sec, 1.2);
      });
      const yCut = legs[name].hip[1] + 14;
      mctx.save();
      mctx.beginPath();
      mctx.rect(-4, yCut, w + 8, h + 8);
      mctx.clip();
      traceOutline(mctx, secs);
      mctx.fillStyle = "#fff";
      mctx.fill();
      mctx.restore();
    });
    const mp = mctx.getImageData(0, 0, w, h).data;
    for (let i = 0; i < mp.length; i += 4) {
      if (mp[i + 3] > 24) bodyPx[i + 3] = 0;
    }
    names.forEach(function (name) {
      const leg = legs[name];
      let x = leg.foot[0];
      const yStop = leg.hip[1] + (leg.foot[1] - leg.hip[1]) * 0.58;
      const limit = Math.max(leg.halfW * 2.7, 36);
      for (let y = Math.min(h - 1, Math.round(leg.foot[1] + 8)); y >= yStop; y--) {
        const col = columnRun(src, w, h, x, y, leg.xMin, leg.xMax);
        if (!col) continue;
        if (Math.abs(col.x - x) > Math.max(20, col.width)) break;
        if (col.width > limit) break;
        const pad = 3;
        const x0 = Math.max(0, Math.floor(col.x - col.width / 2) - pad);
        const x1 = Math.min(w - 1, Math.ceil(col.x + col.width / 2) + pad);
        for (let px = x0; px <= x1; px++) bodyPx[(y * w + px) * 4 + 3] = 0;
        x = col.x;
      }
    });
  }

  function wrapAngle(delta) {
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    const max = 0.62;
    if (delta > max) return max;
    if (delta < -max) return -max;
    return delta;
  }

  function drawPiece(ctx, image, restPivot, posePivot, restAngle, poseAngle) {
    ctx.save();
    ctx.translate(posePivot[0], posePivot[1]);
    ctx.rotate(wrapAngle(poseAngle - restAngle));
    ctx.translate(-restPivot[0], -restPivot[1]);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  }

  function crossSection(skin, name, sample, posed) {
    const leg = skin.legs[name];
    const a = sample.part === "upper" ? leg.hip : leg.knee;
    const b = sample.part === "upper" ? leg.knee : leg.foot;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    const left = sample.d - sample.hw;
    const right = sample.d + sample.hw;
    const poseL = bonePoint({ k: name, part: sample.part, t: sample.t, d: left }, posed);
    const poseR = bonePoint({ k: name, part: sample.part, t: sample.t, d: right }, posed);
    return {
      pL: poseL,
      pR: poseR,
      uL: [a[0] + dx * sample.t + px * left, a[1] + dy * sample.t + py * left],
      uR: [a[0] + dx * sample.t + px * right, a[1] + dy * sample.t + py * right]
    };
  }

  function growSec(sec, amount) {
    const mx = (sec.pL[0] + sec.pR[0]) * 0.5;
    const my = (sec.pL[1] + sec.pR[1]) * 0.5;
    function push(p) {
      const dx = p[0] - mx;
      const dy = p[1] - my;
      const len = Math.hypot(dx, dy) || 1;
      return [mx + dx / len * (len + amount), my + dy / len * (len + amount)];
    }
    return {
      pL: push(sec.pL), pR: push(sec.pR),
      dark: sec.dark, part: sec.part, t: sec.t, hw: sec.hw
    };
  }

  function separate(sec, minW) {
    let dx = sec.pR[0] - sec.pL[0];
    let dy = sec.pR[1] - sec.pL[1];
    let len = Math.hypot(dx, dy);
    if (len >= minW) return sec;
    if (len < 0.001) {
      dx = 1;
      dy = 0;
      len = 1;
    }
    const push = (minW - len) * 0.5;
    const ux = dx / len;
    const uy = dy / len;
    return {
      pL: [sec.pL[0] - ux * push, sec.pL[1] - uy * push],
      pR: [sec.pR[0] + ux * push, sec.pR[1] + uy * push],
      dark: sec.dark, part: sec.part, t: sec.t, hw: sec.hw
    };
  }

  function kneeBridge(pose, hw) {
    const hip = pose.hip;
    const knee = pose.knee;
    const foot = pose.foot;
    const a1 = Math.atan2(knee[1] - hip[1], knee[0] - hip[0]);
    const a2 = Math.atan2(foot[1] - knee[1], foot[0] - knee[0]);
    let delta = a2 - a1;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    const out = [];
    for (let i = 1; i <= 2; i++) {
      const ang = a1 + delta * (i / 3);
      const px = -Math.sin(ang);
      const py = Math.cos(ang);
      out.push({
        pL: [knee[0] - px * hw, knee[1] - py * hw],
        pR: [knee[0] + px * hw, knee[1] + py * hw],
        dark: false, part: "knee", t: i / 3, hw: hw
      });
    }
    return out;
  }

  function legOutline(skin, name, posed) {
    const prof = skin.pieces.parts[name].profile;
    const upper = [];
    const lower = [];
    prof.forEach(function (sample) {
      const sec = crossSection(skin, name, sample, posed);
      sec.dark = sample.dark;
      sec.part = sample.part;
      sec.t = sample.t;
      sec.hw = sample.hw;
      (sample.part === "upper" ? upper : lower).push(sec);
    });
    const hw = upper.length ? upper[upper.length - 1].hw : 10;
    const secs = upper.concat(kneeBridge(posed[name], hw), lower).map(function (sec) {
      return separate(sec, Math.max(8, hw * 0.72));
    });
    for (let i = 1; i < secs.length; i++) {
      const ax = secs[i - 1].pR[0] - secs[i - 1].pL[0];
      const ay = secs[i - 1].pR[1] - secs[i - 1].pL[1];
      const bx = secs[i].pR[0] - secs[i].pL[0];
      const by = secs[i].pR[1] - secs[i].pL[1];
      if (ax * bx + ay * by < 0) {
        const swap = secs[i].pL;
        secs[i].pL = secs[i].pR;
        secs[i].pR = swap;
      }
    }
    return secs;
  }

  function traceOutline(ctx, secs) {
    ctx.beginPath();
    ctx.moveTo(secs[0].pL[0], secs[0].pL[1]);
    for (let i = 1; i < secs.length; i++) ctx.lineTo(secs[i].pL[0], secs[i].pL[1]);
    for (let i = secs.length - 1; i >= 0; i--) ctx.lineTo(secs[i].pR[0], secs[i].pR[1]);
    ctx.closePath();
  }

  function traceSpan(ctx, secs) {
    ctx.beginPath();
    ctx.moveTo(secs[0].pL[0], secs[0].pL[1]);
    for (let i = 1; i < secs.length; i++) ctx.lineTo(secs[i].pL[0], secs[i].pL[1]);
    for (let i = secs.length - 1; i >= 0; i--) ctx.lineTo(secs[i].pR[0], secs[i].pR[1]);
    ctx.closePath();
  }

  function facetPoint(sec, towardLight) {
    const light = sec.pR[0] >= sec.pL[0] ? sec.pR : sec.pL;
    const dark = light === sec.pR ? sec.pL : sec.pR;
    return [
      dark[0] + (light[0] - dark[0]) * towardLight,
      dark[1] + (light[1] - dark[1]) * towardLight
    ];
  }

  function traceFacet(ctx, secs) {
    ctx.beginPath();
    const first = facetPoint(secs[0], 0.46);
    ctx.moveTo(first[0], first[1]);
    for (let i = 1; i < secs.length; i++) {
      const p = facetPoint(secs[i], 0.46);
      ctx.lineTo(p[0], p[1]);
    }
    for (let i = secs.length - 1; i >= 0; i--) {
      const p = facetPoint(secs[i], 1);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.closePath();
  }

  function paintPieces(ctx, spec, skin, posed, which) {
    which.forEach(function (name) {
      const raw = legOutline(skin, name, posed);
      if (raw.length < 2) return;
      const secs = raw.map(function (sec) { return growSec(sec, 2.6); });
      const far = name.indexOf("far") === 0;
      traceOutline(ctx, secs);
      ctx.fillStyle = far ? spec.legFar : spec.legFar;
      ctx.fill();
      if (!spec.stripe) {
        traceFacet(ctx, secs);
        ctx.fillStyle = far ? spec.legFar : spec.leg;
        ctx.fill();
      } else {
        ctx.fillStyle = far ? spec.legFar : spec.leg;
        ctx.fill();
        ctx.fillStyle = spec.stripe;
        for (let i = 0; i < raw.length - 1; i++) {
          if (!raw[i].dark || raw[i].part === "knee" || raw[i + 1].part === "knee") continue;
          traceSpan(ctx, [secs[i], secs[i + 1]]);
          ctx.fill();
        }
      }
      const lower = [];
      secs.forEach(function (sec, i) {
        if (raw[i].part !== "lower") return;
        if (spec.tan && raw[i].t > 0.28) lower.push(sec);
        else if (spec.stripe && raw[i].t > 0.8) lower.push(sec);
        else if (!spec.paw && !spec.tan && !spec.stripe && raw[i].t > 0.9) lower.push(sec);
      });
      if (lower.length > 1 && spec.hoof) {
        traceSpan(ctx, lower);
        ctx.fillStyle = spec.hoof;
        ctx.fill();
      }
    });
  }

  function paintLimbs(ctx, skin, posed, which) {
    which.forEach(function (name) {
      const prof = skin.puppet.profiles[name];
      const pose = posed[name];
      const kneeHw = prof.reduce(function (m, s) {
        return Math.abs(s.t - (s.part === "upper" ? 1 : 0)) < 0.08 ? Math.max(m, s.hw) : m;
      }, 8);
      const knee = bonePoint({ k: name, part: "upper", t: 1, d: 0 }, posed);
      ctx.fillStyle = prof[Math.min(prof.length - 1, (prof.length / 2) | 0)].color;
      ctx.beginPath();
      ctx.arc(knee[0], knee[1], kneeHw, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 1; i < prof.length; i++) {
        const a = prof[i - 1];
        const b = prof[i];
        if (a.part !== b.part) continue;
        const p0 = bonePoint({ k: name, part: a.part, t: a.t, d: a.d }, posed);
        const p1 = bonePoint({ k: name, part: b.part, t: b.t, d: b.d }, posed);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = a.hw + b.hw;
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.stroke();
      }
    });
  }

  function draw(ctx, id, cycle, plant) {
    const spec = specs[id];
    const skin = spec && spec.skin;
    if (!skin) return;
    const bob = Math.cos(cycle * Math.PI * 4) * spec.bob * (1 - plant);
    const drop = spec.crouch * (1 - plant);
    const posed = {};
    names.forEach(function (name) {
      const leg = skin.legs[name];
      leg.name = name;
      posed[name] = poseLeg(spec, leg, cycle, plant, bob + drop);
    });
    paintPieces(ctx, spec, skin, posed, ["farHind", "farFore"]);
    ctx.drawImage(skin.pieces.body, 0, bob + drop);
    paintPieces(ctx, spec, skin, posed, ["nearHind", "nearFore"]);
  }

  function applyPoster(id) {
    const spec = specs[id];
    const skin = spec.skin;
    const canvas = document.createElement("canvas");
    canvas.width = skin.w;
    canvas.height = skin.h;
    draw(canvas.getContext("2d"), id, 0, 1);
    const url = canvas.toDataURL("image/png");
    const def = g.ANIMAL_ANIMATIONS[id] || (g.ANIMAL_ANIMATIONS[id] = {});
    def.poster = url;
    def.v72Walk = true;
    if (!g.document) return;
    g.document.querySelectorAll('.animal[data-id="' + id + '"] img').forEach(function (img) {
      const el = img.closest(".animal");
      if (el && el.classList.contains("acting")) return;
      img.src = url;
    });
  }

  function mount(id) {
    const spec = specs[id];
    const img = new Image();
    img.decoding = "async";
    img.onload = function () {
      prepare(img, spec);
      applyPoster(id);
      const waiting = spec.waiting;
      spec.waiting = null;
      if (waiting && waiting.el && waiting.el.isConnected) start(waiting.el, id);
    };
    img.src = spec.src;
  }

  const runs = new Map();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function currentX(el) {
    const match = /(-?[\d.]+)px/.exec(el.style.translate || "");
    return match ? parseFloat(match[1]) : 0;
  }

  function stop(el) {
    const run = runs.get(el);
    if (!run) return;
    cancelAnimationFrame(run.frame);
    if (run.canvas) run.canvas.remove();
    if (run.img) run.img.style.visibility = "";
    el.classList.remove("acting");
    runs.delete(el);
  }

  function start(el, id) {
    const spec = specs[id];
    if (!el || !spec || runs.has(el)) return;
    if (!spec.skin) {
      spec.waiting = { el: el };
      return;
    }
    const skin = spec.skin;
    const layer = el.querySelector(".orientation");
    const img = el.querySelector(".sprite img");
    if (!layer || !img) return;
    const canvas = document.createElement("canvas");
    canvas.className = "walk-v72";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
    el.querySelector(".sprite").appendChild(canvas);
    img.style.visibility = "hidden";
    el.classList.add("acting");
    let dir = el.dataset.flip === "true" ? -1 : 1;
    const rect = el.getBoundingClientRect();
    const scale = layer.clientWidth / skin.w;
    const travel = spec.stride * (reduced ? 1 : spec.cycles) * scale;
    if (dir > 0 && rect.right + travel > innerWidth - 16) dir = -1;
    if (dir < 0 && rect.left - travel < 16) dir = 1;
    const spin = /rotate\(([^)]+)\)/.exec(layer.style.transform);
    layer.style.transform = "scaleX(" + dir + ")" + (spin ? " rotate(" + spin[1] + ")" : "");
    el.dataset.flip = String(dir < 0);
    const cycles = reduced ? 1 : spec.cycles;
    const period = reduced ? spec.period * 1.4 : spec.period;
    const intro = reduced ? 80 : 180;
    const outro = reduced ? 120 : 260;
    const run = { canvas: canvas, img: img, frame: 0, x: currentX(el), elapsed: 0, last: 0 };
    runs.set(el, run);
    const paint = function (now) {
      if (runs.get(el) !== run) return;
      const dt = run.last ? Math.min(34, now - run.last) : 16;
      run.last = now;
      run.elapsed += dt;
      const elapsed = run.elapsed;
      const walkFor = cycles * period;
      let cycle = 0;
      let plant = 1;
      let speed = 0;
      if (elapsed < intro) {
        plant = 1 - elapsed / intro;
        cycle = 0;
        speed = (1 - plant) * spec.stride / period;
      } else if (elapsed < intro + walkFor) {
        cycle = (elapsed - intro) / period;
        plant = 0;
        speed = spec.stride / period;
      } else if (elapsed < intro + walkFor + outro) {
        const u = (elapsed - intro - walkFor) / outro;
        plant = u;
        cycle = cycles;
        speed = (1 - u) * (1 - u) * spec.stride / period;
      } else {
        stop(el);
        return;
      }
      const cssW = layer.clientWidth;
      const cssH = layer.clientHeight;
      const dpr = Math.min(2, g.devicePixelRatio || 1);
      const bw = Math.max(1, Math.round(cssW * dpr));
      const bh = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(bw / skin.w, 0, 0, bh / skin.h, 0, 0);
      ctx.clearRect(0, 0, skin.w, skin.h);
      draw(ctx, id, cycle, plant);
      run.x += dir * speed * (cssW / skin.w) * dt;
      el.style.translate = run.x.toFixed(2) + "px 0px";
      run.frame = requestAnimationFrame(paint);
    };
    run.frame = requestAnimationFrame(paint);
  }

  if (g.ANIMAL_ANIMATIONS) {
    Object.keys(specs).forEach(function (id) {
      const def = g.ANIMAL_ANIMATIONS[id] || (g.ANIMAL_ANIMATIONS[id] = {});
      def.sheet = null;
      def.cel = null;
      def.rig = false;
      def.walk = false;
      def.v72Walk = true;
      def.label = "四拍迈步";
    });
  }

  if (g.AnimalAnims) {
    const api = g.AnimalAnims;
    const prevPlay = api.play.bind(api);
    const prevStop = api.stop.bind(api);
    const prevStopAll = api.stopAll.bind(api);
    const prevIs = api.isActing.bind(api);
    api.play = function (el, id) {
      id = id || (el && el.dataset && el.dataset.id);
      if (specs[id]) {
        start(el, id);
        return true;
      }
      return prevPlay(el, id);
    };
    api.stop = function (el) { stop(el); prevStop(el); };
    api.stopAll = function () { [...runs.keys()].forEach(stop); prevStopAll(); };
    api.isActing = function (el) { return runs.has(el) || prevIs(el); };
  }

  Object.keys(specs).forEach(mount);

  g.WalkV72 = {
    ids: Object.keys(specs),
    specs: specs,
    draw: draw,
    ready: function () {
      return Object.keys(specs).every(function (id) { return specs[id].skin; });
    }
  };
})(window);
