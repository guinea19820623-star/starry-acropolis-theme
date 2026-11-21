// The sun and the moon as seen from a place on Earth: where they are, the
// moon's phase, and how deep the moon sits in Earth's shadow. Low-precision
// series (a few tenths of a degree), which is plenty for a painted sky.

const R = Math.PI / 180
const DAY_MS = 86400000
const days = ms => ms / DAY_MS + 2440587.5 - 2451545.0
const norm = a => ((a % 360) + 360) % 360
const sin = deg => Math.sin(deg * R)
const cos = deg => Math.cos(deg * R)

function sunEcliptic(d) {
  const g = 357.529 + 0.98560028 * d
  const q = 280.459 + 0.98564736 * d
  return norm(q + 1.915 * sin(g) + 0.02 * sin(2 * g))
}

// Main terms of Meeus' series (Astronomical Algorithms, tables 47.A and 47.B).
const LON = [
  [6.288774, 0, 0, 1, 0], [1.274027, 2, 0, -1, 0], [0.658314, 2, 0, 0, 0], [0.213618, 0, 0, 2, 0],
  [-0.185116, 0, 1, 0, 0], [-0.114332, 0, 0, 0, 2], [0.058793, 2, 0, -2, 0], [0.057066, 2, -1, -1, 0],
  [0.053322, 2, 0, 1, 0], [0.045758, 2, -1, 0, 0], [-0.040923, 0, 1, -1, 0], [-0.03472, 1, 0, 0, 0],
  [-0.030383, 0, 1, 1, 0], [0.015327, 2, 0, 0, -2], [-0.012528, 0, 0, 1, 2], [0.01098, 0, 0, 1, -2],
  [0.010675, 4, 0, -1, 0], [0.010034, 0, 0, 3, 0], [0.008548, 4, 0, -2, 0], [-0.007888, 2, 1, -1, 0],
  [-0.006766, 2, 1, 0, 0], [-0.005163, 1, 0, -1, 0], [0.004987, 1, 1, 0, 0], [0.004036, 2, -1, 1, 0],
]
const LAT = [
  [5.128122, 0, 0, 0, 1], [0.280602, 0, 0, 1, 1], [0.277693, 0, 0, 1, -1], [0.173237, 2, 0, 0, -1],
  [0.055413, 2, 0, -1, 1], [0.046271, 2, 0, -1, -1], [0.032573, 2, 0, 0, 1], [0.017198, 0, 0, 2, 1],
  [0.009266, 2, 0, 1, -1], [0.008822, 0, 0, 2, -1], [0.008216, 2, -1, 0, -1], [0.004324, 2, 0, -2, -1],
  [0.0042, 2, 0, 1, 1],
]
const DIST = [
  [-20905.355, 0, 0, 1, 0], [-3699.111, 2, 0, -1, 0], [-2955.968, 2, 0, 0, 0], [-569.925, 0, 0, 2, 0],
  [48.888, 0, 1, 0, 0], [-3.149, 0, 0, 0, 2], [246.158, 2, 0, -2, 0], [-152.138, 2, -1, -1, 0],
  [-170.733, 2, 0, 1, 0], [-204.586, 2, -1, 0, 0], [-129.62, 0, 1, -1, 0], [108.743, 1, 0, 0, 0],
  [104.755, 0, 1, 1, 0],
]

function moonEcliptic(d) {
  const L = 218.3164477 + 13.17639648 * d
  const D = 297.8501921 + 12.19074912 * d
  const Ms = 357.5291092 + 0.98560028 * d
  const M = 134.9633964 + 13.06499295 * d
  const F = 93.272095 + 13.22935024 * d
  const arg = ([, a, b, c, e]) => a * D + b * Ms + c * M + e * F
  const lambda = L + LON.reduce((sum, t) => sum + t[0] * sin(arg(t)), 0)
  const beta = LAT.reduce((sum, t) => sum + t[0] * sin(arg(t)), 0)
  const dist = 385000.56 + DIST.reduce((sum, t) => sum + t[0] * cos(arg(t)), 0)
  return { lambda: norm(lambda), beta, dist }
}

// ecliptic longitude and latitude (degrees) to altitude and azimuth
function horizontal(lambda, beta, d, lat, lon) {
  const e = (23.439 - 0.00000036 * d) * R
  const l = lambda * R
  const b = beta * R
  const ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l))
  const dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l))
  const gmst = (280.46061837 + 360.98564736629 * d) * R
  const H = gmst + lon * R - ra
  const phi = lat * R
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) / R
  const az = norm(Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(H)) / R)
  return { alt, az }
}

/** The sun's altitude and azimuth (degrees; azimuth from north, clockwise). */
export function sunAt(ms, lat, lon) {
  const d = days(ms)
  return horizontal(sunEcliptic(d), 0, d, lat, lon)
}

/**
 * The moon: altitude and azimuth (with the parallax that lowers it a little),
 * the lit fraction of its face, whether it is waxing, and Earth's shadow on it.
 * `umbra` is the eclipse's umbral magnitude: above 0 a bite is taken out, 1 or
 * more is a total eclipse. `dx`, `dy` are the moon's offset from the shadow's
 * centre (degrees, east and north), `shadow` the umbra's radius and `radius`
 * the moon's, both in degrees.
 */
export function moonAt(ms, lat, lon) {
  const d = days(ms)
  const sun = sunEcliptic(d)
  const moon = moonEcliptic(d)
  const { alt, az } = horizontal(moon.lambda, moon.beta, d, lat, lon)
  const parallax = Math.asin(6378.14 / moon.dist) / R
  const elongation = Math.acos(cos(moon.beta) * cos(moon.lambda - sun)) / R
  const anti = norm(sun + 180)
  let dl = moon.lambda - anti
  if (dl > 180) dl -= 360
  if (dl < -180) dl += 360
  const dx = dl * cos(moon.beta)
  const dy = moon.beta
  const sep = Math.hypot(dx, dy)
  const radius = 0.2725 * parallax
  const shadow = 1.02 * (parallax + 0.00244 - 0.2666)
  const penumbra = 1.02 * (parallax + 0.00244 + 0.2666)
  return {
    alt: alt - parallax * cos(alt),
    az,
    lit: (1 - cos(elongation)) / 2,
    waxing: norm(moon.lambda - sun) < 180,
    umbra: (shadow + radius - sep) / (2 * radius),
    penumbral: sep < penumbra + radius,
    dx,
    dy,
    shadow,
    radius,
  }
}
