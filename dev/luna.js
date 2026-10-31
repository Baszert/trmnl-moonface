/* Luna: where the Moon is, how it is lit and how it is turned toward you.
   Position after Meeus, Astronomical Algorithms ch. 47 (60 terms), libration and the Sun's selenographic
   position after ch. 53 (optical and physical libration), as in astronomia (MIT, S. Keys and commenthol).
   Everything in radians unless a name ends in Deg. */
(function (root) {
  var R = Math.PI / 180, TAU = 2 * Math.PI, sin = Math.sin, cos = Math.cos, atan2 = Math.atan2, asin = Math.asin;
  var TA = [[0,0,1,0,6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],[0,0,2,0,213618,-569925],[0,1,0,0,-185116,48888],[0,0,0,2,-114332,-3149],[2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],[2,0,1,0,53322,-170733],[2,-1,0,0,45758,-204586],[0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],[0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],[0,0,1,-2,10980,79661],[4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],[4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208],[2,1,0,0,-6766,30824],[1,0,-1,0,-5163,-8379],[1,1,0,0,4987,-16675],[2,-1,1,0,4036,-12831],[2,0,2,0,3994,-10445],[4,0,0,0,3861,-11650],[2,0,-3,0,3665,14403],[0,1,-2,0,-2689,-7003],[2,0,-1,2,-2602,0],[2,-1,-2,0,2390,10056],[1,0,1,0,-2348,6322],[2,-2,0,0,2236,-9884],[0,1,2,0,-2120,5751],[0,2,0,0,-2069,0],[2,-2,-1,0,2048,-4950],[2,0,1,-2,-1773,4130],[2,0,0,2,-1595,0],[4,-1,-1,0,1215,-3958],[0,0,2,2,-1110,0],[3,0,-1,0,-892,3258],[2,1,1,0,-810,2616],[4,-1,-2,0,759,-1897],[0,2,-1,0,-713,-2117],[2,2,-1,0,-700,2354],[2,1,-2,0,691,0],[2,-1,0,-2,596,0],[4,0,1,0,549,-1423],[0,0,4,0,537,-1117],[4,-1,0,0,520,-1571],[1,0,-2,0,-487,-1739],[2,1,0,-2,-399,0],[0,0,2,-2,-381,-4421],[1,1,1,0,351,0],[3,0,-2,0,-340,0],[4,0,-3,0,330,0],[2,-1,2,0,327,0],[0,2,1,0,-323,1165],[1,1,-1,0,299,0],[2,0,3,0,294,0],[2,0,-1,-2,0,8752]];
  var TB = [[0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],[2,0,-1,1,55413],[2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],[2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],[2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],[2,-1,-1,-1,2065],[0,1,-1,-1,-1870],[4,0,-1,-1,1828],[0,1,0,1,-1794],[0,0,0,3,-1749],[0,1,-1,1,-1565],[1,0,0,1,-1491],[0,1,1,1,-1475],[0,1,1,-1,-1410],[0,1,0,-1,-1344],[1,0,0,-1,-1335],[0,0,3,1,1107],[4,0,0,-1,1021],[4,0,-1,1,833],[0,0,1,-3,777],[4,0,-2,1,671],[2,0,0,-3,607],[2,0,2,-1,596],[2,-1,1,-1,491],[2,0,-2,1,-451],[0,0,3,-1,439],[2,0,2,1,422],[2,0,-3,-1,421],[2,1,-1,1,-366],[2,1,0,1,-351],[4,0,0,1,331],[2,-1,1,1,315],[2,-2,0,-1,302],[0,0,1,3,-283],[2,1,1,-1,-229],[1,1,0,-1,223],[1,1,0,1,223],[0,1,-2,-1,-220],[2,1,-1,-1,-220],[1,0,1,1,-185],[2,-1,-2,-1,181],[0,1,2,1,-177],[4,0,-2,-1,176],[4,-1,-1,-1,166],[1,0,1,-1,-164],[4,0,1,-1,132],[1,0,-1,-1,-119],[4,-1,0,-1,115],[2,-2,0,1,107]];

  function horner(T) { var s = 0; for (var i = arguments.length - 1; i >= 1; i--) s = s * T + arguments[i]; return s; }
  function pmod(x, m) { x = x % m; return x < 0 ? x + m : x; }
  function T2000(jde) { return (jde - 2451545) / 36525; }
  function deltaT(year) { var t = year - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; }   // seconds, good for 2005 to 2050
  function jdeOf(ms) { return ms / 864e5 + 2440587.5 + deltaT(1970 + ms / 31556952e3) / 86400; }

  // arguments D, M, M', F and the node, in radians
  function args(T) {
    return {
      D: horner(T, 297.8501921 * R, 445267.1114034 * R, -0.0018819 * R, R / 545868, -R / 113065000),
      M: horner(T, 357.5291092 * R, 35999.0502909 * R, -0.0001536 * R, R / 24490000),
      Mp: horner(T, 134.9633964 * R, 477198.8675055 * R, 0.0087414 * R, R / 69699, -R / 14712000),
      F: horner(T, 93.272095 * R, 483202.0175233 * R, -0.0036539 * R, -R / 3526000, R / 863310000),
      O: horner(T, 125.0445479 * R, -1934.1362891 * R, 0.0020754 * R, R / 467441, -R / 60616000)
    };
  }
  // geocentric ecliptic longitude and latitude of the Moon (mean equinox of date, no nutation) and distance in km
  function moon(jde) {
    var T = T2000(jde), a = args(T), d = a.D, m = a.M, mp = a.Mp, f = a.F;
    var l1 = horner(T, 218.3164477 * R, 481267.88123421 * R, -0.0015786 * R, R / 538841, -R / 65194000);
    var a1 = 119.75 * R + 131.849 * R * T, a2 = 53.09 * R + 479264.29 * R * T, a3 = 313.45 * R + 481266.484 * R * T;
    var e = horner(T, 1, -0.002516, -0.0000074), e2 = e * e;
    var sl = 3958 * sin(a1) + 1962 * sin(l1 - f) + 318 * sin(a2), sr = 0;
    var sb = -2235 * sin(l1) + 382 * sin(a3) + 175 * sin(a1 - f) + 175 * sin(a1 + f) + 127 * sin(l1 - mp) - 115 * sin(l1 + mp);
    var i, r, arg, k;
    for (i = 0; i < TA.length; i++) {
      r = TA[i]; arg = d * r[0] + m * r[1] + mp * r[2] + f * r[3]; k = r[1] === 0 ? 1 : Math.abs(r[1]) === 1 ? e : e2;
      sl += r[4] * sin(arg) * k; sr += r[5] * cos(arg) * k;
    }
    for (i = 0; i < TB.length; i++) {
      r = TB[i]; arg = d * r[0] + m * r[1] + mp * r[2] + f * r[3]; k = r[1] === 0 ? 1 : Math.abs(r[1]) === 1 ? e : e2;
      sb += r[4] * sin(arg) * k;
    }
    return { lon: pmod(l1, TAU) + sl * 1e-6 * R, lat: sb * 1e-6 * R, range: 385000.56 + sr * 1e-3 };
  }
  // the Sun: geometric ecliptic longitude of date and distance in AU (Meeus ch. 25)
  function sun(jde) {
    var T = T2000(jde), L0 = horner(T, 280.46646, 36000.76983, 0.0003032) * R, M = horner(T, 357.52911, 35999.05029, -0.0001537) * R;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
    var e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T, nu = M + C * R;
    return { lon: pmod(L0 + C * R, TAU), range: 1.000001018 * (1 - e * e) / (1 + e * cos(nu)) };
  }
  function nutation(jde) {
    var T = T2000(jde), O = args(T).O, L = (280.4665 + 36000.7698 * T) * R, Lm = (218.3165 + 481267.8813 * T) * R;
    return {
      dpsi: (-17.2 * sin(O) - 1.32 * sin(2 * L) - 0.23 * sin(2 * Lm) + 0.21 * sin(2 * O)) / 3600 * R,
      deps: (9.2 * cos(O) + 0.57 * cos(2 * L) + 0.1 * cos(2 * Lm) - 0.09 * cos(2 * O)) / 3600 * R
    };
  }
  function obliquity(jde) { var T = T2000(jde); return (horner(T, 23.439291111, -0.013004167, -1.638888889e-7, 5.036111111e-7)) * R; }

  var I = 1.54242 * R, sI = sin(I), cI = cos(I);   // IAU inclination of the mean lunar equator
  // librations (optical and physical) for the ecliptic place (lam, bet), as seen from there: returns [l, b]
  function lib(lam, bet, q) {
    var W = lam - q.O, sW = sin(W), cW = cos(W), sb = sin(bet), cb = cos(bet);
    var A = atan2(sW * cb * cI - sb * sI, cW * cb), lo = pmod(A - q.F, TAU), bo = asin(-sW * cb * sI - sb * cI);
    var l = lo + (-q.tau + (q.rho * cos(A) + q.sigma * sin(A)) * Math.tan(bo)), b = bo + (q.sigma * cos(A) - q.rho * sin(A));
    if (l > Math.PI) l -= TAU;
    return [l, b];
  }
  // everything about the Moon at one moment (a JS time in ms)
  function state(ms) {
    var jde = jdeOf(ms), T = T2000(jde), a = args(T), D = a.D, M = a.M, Mp = a.Mp, F = a.F, O = a.O;
    var E = horner(T, 1, -0.002516, -0.0000074), K1 = 119.75 * R + 131.849 * R * T, K2 = 72.56 * R + 20.186 * R * T;
    var rho = (-0.02752 * cos(Mp) - 0.02245 * sin(F) + 0.00684 * cos(Mp - 2 * F) - 0.00293 * cos(2 * F) - 0.00085 * cos(2 * (F - D)) - 0.00054 * cos(Mp - 2 * D) - 0.0002 * sin(Mp + F) - 0.0002 * cos(Mp + 2 * F) - 0.0002 * cos(Mp - F) + 0.00014 * cos(Mp + 2 * (F - D))) * R;
    var sigma = (-0.02816 * sin(Mp) + 0.02244 * cos(F) - 0.00682 * sin(Mp - 2 * F) - 0.00279 * sin(2 * F) - 0.00083 * sin(2 * (F - D)) + 0.00069 * sin(Mp - 2 * D) + 0.0004 * cos(Mp + F) - 0.00025 * sin(2 * Mp) - 0.00023 * sin(Mp + 2 * F) + 0.0002 * cos(Mp - F) + 0.00019 * sin(Mp - F) + 0.00013 * sin(Mp + 2 * (F - D)) - 0.0001 * cos(Mp - 3 * F)) * R;
    var tau = (0.0252 * sin(M) * E + 0.00473 * sin(2 * (Mp - F)) - 0.00467 * sin(Mp) + 0.00396 * sin(K1) + 0.00276 * sin(2 * (Mp - D)) + 0.00196 * sin(O) - 0.00183 * cos(Mp - F) + 0.00115 * sin(Mp - 2 * D) - 0.00096 * sin(Mp - D) + 0.00046 * sin(2 * (F - D)) - 0.00039 * sin(Mp - F) - 0.00032 * sin(Mp - M - D) + 0.00027 * sin(2 * (Mp - D) - M) + 0.00023 * sin(K2) - 0.00014 * sin(2 * D) + 0.00014 * cos(2 * (Mp - F)) - 0.00012 * sin(Mp - 2 * F) - 0.00012 * sin(2 * Mp) + 0.00011 * sin(2 * (Mp - M - D))) * R;
    var q = { O: O, F: F, rho: rho, sigma: sigma, tau: tau };
    var mn = moon(jde), sn = sun(jde), nu = nutation(jde), eps = obliquity(jde) + nu.deps;
    // how the Earth sees the Moon: libration l (east positive), b; and the Sun as seen from the Moon: l0, b0
    var lb = lib(mn.lon, mn.lat, q);
    var dR = mn.range / (sn.range * 149597870.7);
    var lamH = sn.lon + Math.PI + 57.296 * R * dR * cos(mn.lat) * sin(sn.lon - mn.lon), betH = dR * mn.lat;
    var lb0 = lib(lamH, betH, q);
    // position angle of the lunar axis from celestial north (east positive)
    var V = O + nu.dpsi + sigma / sI, sV = sin(V), cV = cos(V), X = sin(I + rho) * sV, Y = sin(I + rho) * cV * cos(eps) - cos(I + rho) * sin(eps);
    var omega = atan2(X, Y), lamT = mn.lon + nu.dpsi;
    var ra = atan2(sin(lamT) * cos(eps) - Math.tan(mn.lat) * sin(eps), cos(lamT)), dec = asin(sin(mn.lat) * cos(eps) + cos(mn.lat) * sin(eps) * sin(lamT));
    var P = asin(Math.hypot(X, Y) * cos(ra - omega) / cos(lb[1])); if (P < 0) P += TAU;
    // phase: the angle at the Moon between the Earth and the Sun
    var psi = Math.acos(clamp(sin(dec) * 0 + cos(mn.lat) * cos(mn.lon - sn.lon), -1, 1)), AU = 149597870.7;
    var inc = atan2(sn.range * AU * sin(psi), mn.range - sn.range * AU * cos(psi));
    var elong = pmod(mn.lon - sn.lon, TAU);   // 0 new moon, pi full moon
    return {
      jde: jde, lon: mn.lon, lat: mn.lat, range: mn.range, ra: ra, dec: dec, eps: eps,
      lib: { l: lb[0], b: lb[1] }, sunsel: { l: lb0[0], b: lb0[1] }, P: P,
      frac: (1 + cos(inc)) / 2, elong: elong, waxing: elong < Math.PI,
      age: elong / TAU * 29.530588861, diameter: 2 * asin(1737.4 / mn.range) / R * 3600   // arc seconds
    };
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // altitude, azimuth and the screen orientation for an observer: topocentric RA/Dec, hour angle, parallactic angle
  function observe(st, ms, latDeg, lonDeg) {
    var jd = ms / 864e5 + 2440587.5, T = (jd - 2451545) / 36525;
    var gmst = pmod((280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T) * R, TAU);
    var lst = gmst + lonDeg * R, phi = latDeg * R;
    // parallax in RA/Dec (Meeus ch. 40), observer at sea level
    var pi = asin(6378.137 / st.range), H = lst - st.ra, u = Math.atan(0.99664719 * Math.tan(phi)), rs = 0.99664719 * sin(u), rc = cos(u);
    var dra = atan2(-rc * sin(pi) * sin(H), cos(st.dec) - rc * sin(pi) * cos(H));
    var dec2 = atan2((sin(st.dec) - rs * sin(pi)) * cos(dra), cos(st.dec) - rc * sin(pi) * cos(H)), H2 = H - dra;
    var alt = asin(sin(phi) * sin(dec2) + cos(phi) * cos(dec2) * cos(H2)), az = atan2(sin(H2), cos(H2) * sin(phi) - Math.tan(dec2) * cos(phi)) + Math.PI;
    // parallactic angle: the angle at the Moon between celestial north and the zenith (positive when the Moon is in the west)
    var qa = atan2(sin(H2), Math.tan(phi) * cos(dec2) - sin(dec2) * cos(H2));
    return { alt: alt, az: az, q: qa, lst: lst };
  }

  // the rotation that takes selenographic unit vectors to the screen (x right, y up, z toward you):
  // returns the three body axes X (lon 0, lat 0), Y (lon 90E) and Z (north) as screen vectors, plus the Sun as a screen vector
  function frame(st, qa, mode) {
    // angle of the lunar axis on the screen, counter-clockwise from "up": the position angle P, minus q when up is the zenith
    var ang = st.P - (mode === 'north' ? 0 : qa), l = st.lib.l, b = st.lib.b;
    var p = [-sin(ang), cos(ang), 0];   // the pole's direction in the image plane
    var Z = [cos(b) * p[0], cos(b) * p[1], sin(b)], zs = [0, 0, 1];
    var M = [(zs[0] - sin(b) * Z[0]) / cos(b), (zs[1] - sin(b) * Z[1]) / cos(b), (zs[2] - sin(b) * Z[2]) / cos(b)];
    var W = [Z[1] * M[2] - Z[2] * M[1], Z[2] * M[0] - Z[0] * M[2], Z[0] * M[1] - Z[1] * M[0]];
    var X = [cos(l) * M[0] - sin(l) * W[0], cos(l) * M[1] - sin(l) * W[1], cos(l) * M[2] - sin(l) * W[2]];
    var Y = [sin(l) * M[0] + cos(l) * W[0], sin(l) * M[1] + cos(l) * W[1], sin(l) * M[2] + cos(l) * W[2]];
    var l0 = st.sunsel.l, b0 = st.sunsel.b, c0 = cos(b0);
    var S = [0, 1, 2].map(function (i) { return c0 * cos(l0) * X[i] + c0 * sin(l0) * Y[i] + sin(b0) * Z[i]; });
    return { X: X, Y: Y, Z: Z, S: S };
  }

  var api = { state: state, observe: observe, frame: frame, jdeOf: jdeOf, moon: moon, sun: sun };
  if (typeof module !== 'undefined') module.exports = api; else root.LUNA = api;
})(this);
