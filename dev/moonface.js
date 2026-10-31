/* Moonface: draws the Moon as a lit 3D ball, one pixel at a time, from NASA's LRO elevation and colour maps.
   - the ball is turned the way it is seen from your place (libration, tilt)
   - every pixel is lit by the Sun where it really is, using the local slope of the ground, and casts shadows
   - the night side shows a little Earthshine
   - the result is dithered to what the screen can show: black and white, or 16 grays */
(function (root) {
  var PI = Math.PI, sin = Math.sin, cos = Math.cos, sqrt = Math.sqrt, atan2 = Math.atan2, asin = Math.asin, RM = 1737.4;

  /* ---------- textures: two images become typed arrays ---------- */
  function load(url) {
    return new Promise(function (ok, bad) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () {
        var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
        var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
        var d = g.getImageData(0, 0, im.width, im.height).data, a = new Uint8Array(im.width * im.height);
        for (var i = 0; i < a.length; i++) a[i] = d[i * 4];
        ok({ w: im.width, h: im.height, a: a });
      };
      im.onerror = function () { bad(new Error('texture ' + url)); };
      im.src = url;
    });
  }
  // base: folder with albedo-1k.webp and relief-1k.webp (or 2k); returns { w, h, alb, hgt, sx, sy }
  function textures(base, tier) {
    return Promise.all([load(base + 'albedo-' + tier + '.webp'), load(base + 'relief-' + tier + '.webp')]).then(function (r) {
      var w = r[1].w, h = r[1].h, hg = new Float32Array(w * h), sx = new Float32Array(w * h), sy = new Float32Array(w * h), i, j;
      for (i = 0; i < hg.length; i++) hg[i] = (r[1].a[i] - 127.5) / 127.5 * 2.5;   // km above the local trend
      var d = RM * PI / h;   // km per texel along a meridian
      // a light blur first (the 8-bit steps would otherwise show as terraces), then central differences
      var bl = new Float32Array(w * h);
      for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
        var s = 0, n = 0;
        for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) { var jj = Math.min(h - 1, Math.max(0, j + dj)), ii = (i + di + w) % w, k = (dj === 0 && di === 0) ? 4 : (dj === 0 || di === 0) ? 2 : 1; s += hg[jj * w + ii] * k; n += k; }
        bl[j * w + i] = s / n;
      }
      for (j = 0; j < h; j++) {
        var lat = (0.5 - (j + 0.5) / h) * PI, dx = d * Math.max(cos(lat), 0.05), jn = Math.max(0, j - 1), js = Math.min(h - 1, j + 1);
        for (i = 0; i < w; i++) {
          var ie = (i + 1) % w, iw = (i - 1 + w) % w;
          sx[j * w + i] = (bl[j * w + ie] - bl[j * w + iw]) / (2 * dx);
          sy[j * w + i] = (bl[jn * w + i] - bl[js * w + i]) / ((js - jn) * d);
        }
      }
      return { w: w, h: h, alb: r[0].w === w ? r[0].a : resample(r[0], w, h), hgt: bl, sx: sx, sy: sy };
    });
  }
  function resample(t, w, h) { var o = new Uint8Array(w * h); for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) o[j * w + i] = t.a[Math.floor(j * t.h / h) * t.w + Math.floor(i * t.w / w)]; return o; }

  /* ---------- the ball ---------- */
  // luminance (0..1) of every pixel of a disc of radius r (in pixels), returned as { L, size }, size = 2r+2
  // frame: axes X, Y, Z and the Sun S from LUNA.frame; sunsel and lib from LUNA.state
  function shade(T, st, fr, r, o) {
    o = o || {};
    var size = Math.ceil(2 * r) + 4, L = new Float32Array(size * size), c = size / 2, w = T.w, h = T.h;
    var X = fr.X, Y = fr.Y, Z = fr.Z, sl = st.sunsel, c0 = cos(sl.b), sb = [c0 * cos(sl.l), c0 * sin(sl.l), sin(sl.b)];
    var eb = [X[2], Y[2], Z[2]];   // the direction to the observer in lunar coordinates
    var ex = o.exaggerate || 2.2, earth = (o.earthshine == null ? 0.07 : o.earthshine) * (1 - st.frac * 0.85), shadowMax = o.shadowSteps || 26;
    var exS = ex * (o.shadowBoost || 1.7), albPow = o.albPow || 2.6, gain = o.gain || 1.2, w0 = 0.82, x, y, i, j;
    var alb = T.alb, sxA = T.sx, syA = T.sy, hg = T.hgt;
    function bil(a, u, v) {
      var u0 = Math.floor(u), v0 = Math.floor(v), fu = u - u0, fv = v - v0; u0 = ((u0 % w) + w) % w; var u1 = (u0 + 1) % w; v0 = Math.max(0, Math.min(h - 1, v0)); var v1 = Math.min(h - 1, v0 + 1);
      return (a[v0 * w + u0] * (1 - fu) + a[v0 * w + u1] * fu) * (1 - fv) + (a[v1 * w + u0] * (1 - fu) + a[v1 * w + u1] * fu) * fv;
    }
    for (j = 0; j < size; j++) for (i = 0; i < size; i++) {
      x = (i + 0.5 - c) / r; y = -(j + 0.5 - c) / r;
      var rr = x * x + y * y; if (rr >= 1.08) continue;
      var edge = rr <= 1 ? 1 : Math.max(0, 1 - (sqrt(rr) - 1) * r);   // one pixel of anti-aliasing
      var rc = Math.min(rr, 0.99999), zz = sqrt(1 - rc), xx = rr > 1 ? x / sqrt(rr) * sqrt(rc) : x, yy = rr > 1 ? y / sqrt(rr) * sqrt(rc) : y;
      var vx = xx * X[0] + yy * X[1] + zz * X[2], vy = xx * Y[0] + yy * Y[1] + zz * Y[2], vz = xx * Z[0] + yy * Z[1] + zz * Z[2];
      var phi = asin(Math.max(-1, Math.min(1, vz))), lam = atan2(vy, vx), u = (lam + PI) / (2 * PI) * w - 0.5, v = (PI / 2 - phi) / PI * h - 0.5;
      var A = bil(alb, u, v) / 255, sx = bil(sxA, u, v), sy = bil(syA, u, v);
      A = Math.pow(A, albPow) * (albPow > 2.6 ? 1.9 * Math.pow(1.35, albPow - 2.6) : 1.9);   // from the stretched colour map back toward reflectance: maria dark, highlands bright
      var cl = cos(lam), sL = sin(lam), cp = cos(phi), sp = sin(phi);
      // local normal: up tilted away from the slope (exaggerated so the relief reads)
      var nx = vx - ex * (sx * -sL + sy * -sp * cl), ny = vy - ex * (sx * cl + sy * -sp * sL), nz = vz - ex * (sy * cp), nl = 1 / sqrt(nx * nx + ny * ny + nz * nz);
      nx *= nl; ny *= nl; nz *= nl;
      var mu0g = vx * sb[0] + vy * sb[1] + vz * sb[2], mu0 = nx * sb[0] + ny * sb[1] + nz * sb[2], mu = Math.max(0.02, nx * eb[0] + ny * eb[1] + nz * eb[2]);
      var lum;
      if (mu0g <= 0 || mu0 <= 0) lum = earth * A;
      else {
        // does a hill between here and the Sun throw its shadow on this pixel? A soft edge, like a real penumbra
        var lit = 1;
        if (mu0g < 0.42) {
          var tx = sb[0] - mu0g * vx, ty = sb[1] - mu0g * vy, tz = sb[2] - mu0g * vz, tn = 1 / Math.max(1e-6, sqrt(tx * tx + ty * ty + tz * tz)); tx *= tn; ty *= tn; tz *= tn;
          var elev = asin(Math.min(1, mu0g)), h0 = bil(hg, u, v), s = 2, occ = -1;
          for (var k = 0; k < shadowMax; k++) {
            s += 3 + k * 0.9;   // km, growing steps
            var ang = s / RM, qx = vx * cos(ang) + tx * sin(ang), qy = vy * cos(ang) + ty * sin(ang), qz = vz * cos(ang) + tz * sin(ang);
            var ph = asin(Math.max(-1, Math.min(1, qz))), la = atan2(qy, qx), hh = bil(hg, (la + PI) / (2 * PI) * w - 0.5, (PI / 2 - ph) / PI * h - 0.5);
            var rise = ((hh - h0) * exS - s * s / (2 * RM)) / s;   // how steeply the ground climbs toward the Sun (exaggerated like the slopes)
            if (rise > occ) occ = rise;
          }
          var margin = Math.atan(occ) - elev, pen = 0.035;   // radians of penumbra
          lit = margin <= -pen ? 1 : margin >= pen ? 0 : 0.5 - 0.5 * margin / pen;
          lit = lit * lit * (3 - 2 * lit);
        }
        lum = earth * A * (1 - lit) + A * ((1 - w0) * mu0 + w0 * 2 * mu0 / (mu0 + mu)) * 0.62 * gain * (0.6 + 0.4 * Math.min(1, mu0g * 6 + 0.1)) * lit;
      }
      L[j * size + i] = lum * edge;
    }
    return { L: L, size: size };
  }

  /* ---------- dithering ---------- */
  // Floyd and Steinberg error diffusion to `levels` grays (2 = black and white); L in 0..1, returns 0..255 bytes per pixel
  function dither(L, w, h, levels, curve, jitter) {
    var f = new Float32Array(L.length), out = new Uint8Array(L.length), i, x, y;
    for (i = 0; i < L.length; i++) {
      var hsh = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b); hsh ^= hsh >>> 13; hsh = Math.imul(hsh, 0xc2b2ae35); hsh ^= hsh >>> 16;
      f[i] = curve(Math.max(0, Math.min(1, L[i]))) + (L[i] > 0 ? ((hsh >>> 0) / 4294967295 - 0.5) * (jitter == null ? 0.05 : jitter) : 0);
    }
    var q = levels - 1;
    for (y = 0; y < h; y++) {
      var rev = y & 1;   // serpentine: alternate direction, no streaks
      for (var xi = 0; xi < w; xi++) {
        x = rev ? w - 1 - xi : xi; i = y * w + x;
        var v = f[i], n = Math.max(0, Math.min(q, Math.round(v * q))), e = v - n / q; out[i] = Math.round(n / q * 255);
        var dx = rev ? -1 : 1;
        if (x + dx >= 0 && x + dx < w) f[i + dx] += e * 7 / 16;
        if (y + 1 < h) {
          if (x - dx >= 0 && x - dx < w) f[i + w - dx] += e * 3 / 16;
          f[i + w] += e * 5 / 16;
          if (x + dx >= 0 && x + dx < w) f[i + w + dx] += e * 1 / 16;
        }
      }
    }
    return out;
  }

  // draw one moon onto a canvas context, centred at (cx, cy) with radius r (all in device pixels)
  function draw(ctx, T, st, fr, cx, cy, r, o) {
    o = o || {};
    var s = shade(T, st, fr, r, o), size = s.size, levels = o.levels || 2, gamma = o.gamma || 1.7;
    var bytes = dither(s.L, size, size, levels, function (v) { return Math.pow(v, 1 / gamma); }, o.jitter);
    var img = ctx.createImageData(size, size);
    for (var i = 0; i < bytes.length; i++) { img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = bytes[i]; img.data[i * 4 + 3] = 255; }
    ctx.putImageData(img, Math.round(cx - size / 2), Math.round(cy - size / 2));
  }

  var api = { textures: textures, shade: shade, dither: dither, draw: draw };
  if (typeof module !== 'undefined') module.exports = api; else root.MOONFACE = api;
})(this);
