// The night sky as it really is at a moment and place: the stars down to
// magnitude 4.5, the Greek-myth constellations drawn in faint gold, the milky
// way laid along the galactic plane, and a few deep-sky objects.
import { galacticToEquatorial, starAt } from './astro.js'
import { skyX, starY } from './projection.js'
import { FIGURES, STARS } from './stars.js'

const n1 = x => Math.round(x * 10) / 10
const n2 = x => Math.round(x * 100) / 100

export const STAR_STYLE = `.fig{fill:none;stroke:#e6c57e;stroke-width:0.9;stroke-linecap:round;stroke-linejoin:round;opacity:0.3}
.mwb{fill:url(#mwB)}
.dso{fill:url(#dso)}`

const DEFS = `<defs>
<radialGradient id="mwB"><stop offset="0" stop-color="#d6cff5" stop-opacity="1"/><stop offset="0.45" stop-color="#b3a9e0" stop-opacity="0.55"/><stop offset="1" stop-color="#9a90cc" stop-opacity="0"/></radialGradient>
<radialGradient id="dso"><stop offset="0" stop-color="#f4eeff" stop-opacity="0.9"/><stop offset="0.4" stop-color="#d7cdf2" stop-opacity="0.35"/><stop offset="1" stop-color="#c8bce8" stop-opacity="0"/></radialGradient>
<radialGradient id="neb"><stop offset="0" stop-color="#ffd6e8" stop-opacity="0.8"/><stop offset="1" stop-color="#e2a6cf" stop-opacity="0"/></radialGradient>
</defs>`

// a place on the backdrop, or null when it is below the hills or behind the viewer
function place(ra, dec, ms, lat, lon, minAlt = 0.5) {
  const { alt, az } = starAt(ra, dec, ms, lat, lon)
  if (alt < minAlt) return null
  const x = skyX(az)
  const y = starY(alt)
  if (x < -60 || x > 1660 || y < -60) return null
  return [x, y]
}

const sparkle = (x, y, s, k) =>
  `<g class="sp p${k}" transform="translate(${n1(x)} ${n1(y)})"><circle r="${n1(s * 1.3)}" class="sph"/>` +
  `<path d="M0 ${-s}L${n1(s * 0.13)} ${n1(-s * 0.13)}L${s} 0L${n1(s * 0.13)} ${n1(s * 0.13)}L0 ${s}L${n1(-s * 0.13)} ${n1(s * 0.13)}L${-s} 0L${n1(-s * 0.13)} ${n1(-s * 0.13)}Z"/></g>`

function stars(ms, lat, lon) {
  const groups = [[], [], [], [], []]
  const bright = []
  for (let i = 0; i < STARS.length; i += 4) {
    const [ra, dec, mag, bv] = STARS.slice(i, i + 4)
    const at = place(ra, dec, ms, lat, lon)
    if (!at) continue
    const k = (i / 4) % 5
    if (mag < 0.8) {
      // the brightest stars twinkle as four-point sparkles, as in the weather frame
      bright.push(sparkle(at[0], at[1], n1(7 + (0.8 - mag) * 2.5), k))
      continue
    }
    const r = n1(Math.max(0.6, 2.4 - 0.42 * mag))
    const tint = bv < 0 ? ' class="b"' : bv > 0.8 ? ' class="w"' : ''
    groups[k].push(`<circle cx="${n1(at[0])}" cy="${n1(at[1])}" r="${r}"${tint}/>`)
  }
  return groups.map((g, k) => `<g class="st s${k}" opacity="0.85">${g.join('')}</g>`).join('\n') + bright.join('')
}

function figures(ms, lat, lon) {
  const paths = []
  for (const lines of Object.values(FIGURES)) {
    for (const line of lines) {
      let d = ''
      let last = null
      for (let i = 0; i < line.length; i += 2) {
        const at = place(line[i], line[i + 1], ms, lat, lon, -2)
        // a jump means the line went round behind the viewer: start a new stroke
        if (!at || (last && Math.abs(at[0] - last[0]) > 400)) {
          last = null
          if (!at) continue
        }
        d += `${last ? 'L' : 'M'}${n1(at[0])} ${n1(at[1])}`
        last = at
      }
      if (d.includes('L')) paths.push(d)
    }
  }
  return paths.length ? `<path class="fig" d="${paths.join('')}"/>` : ''
}

const gap = (a, b) => ((((a - b) % 360) + 540) % 360) - 180

// How bright the milky way is at a galactic longitude and latitude: richest
// toward the centre in Sagittarius, a second swell in Cygnus, and the dark
// Great Rift running from Cygnus down to Sagittarius.
function glow(l, b) {
  const centre = Math.exp(-((gap(l, 0) / 50) ** 2))
  const cygnus = 0.35 * Math.exp(-((gap(l, 75) / 25) ** 2))
  const width = 6 + 6 * centre
  let v = (0.28 + 0.72 * centre + cygnus) * Math.exp(-((b / width) ** 2))
  if (gap(l, 40) > -30 && gap(l, 40) < 30 && b > -1 && b < 4) v *= 0.35
  return v
}

// Fixed-seed random for the milky way's dust, so it holds still between draws.
function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

// the galactic plane at latitude b, from l0 to l1, as screen points; null where hidden
function along(l0, l1, b, ms, lat, lon) {
  const pts = []
  for (let l = l0; l <= l1 + 0.01; l += 3) {
    const { ra, dec } = galacticToEquatorial(l, b)
    pts.push(place(ra, dec, ms, lat, lon, -6))
  }
  return pts
}
const stroke = pts => {
  let d = ''
  let last = null
  for (const at of pts) {
    if (!at || (last && Math.abs(at[0] - last[0]) > 300)) {
      last = null
      if (!at) continue
    }
    d += `${last ? 'L' : 'M'}${n1(at[0])} ${n1(at[1])}`
    last = at
  }
  return d.includes('L') ? d : ''
}

function milkyWay(ms, lat, lon) {
  // the band: soft layers, wide and faint to narrow, so its edges fade out;
  // the bulge toward Sagittarius and the Cygnus stretch get layers of their own
  const soft = (l0, l1, widths, opacity) => {
    const d = stroke(along(l0, l1, 0, ms, lat, lon))
    return d ? widths.map(w => `<path d="${d}" stroke-width="${w}" stroke-opacity="${opacity}"/>`).join('') : ''
  }
  const band = [
    soft(0, 360, [110, 80, 55, 32, 16], 0.035),
    soft(-55, 55, [190, 140, 100, 64, 34], 0.03),
    soft(-25, 30, [150, 95, 50], 0.04),
    soft(55, 95, [120, 80, 45], 0.03),
  ]
  // star clouds: Sagittarius, Scutum and Cygnus
  const clouds = [[4, -4, 70, 0.55], [27, -2, 38, 0.4], [76, 1, 55, 0.4], [-10, -2, 45, 0.35]]
    .map(([l, b, r, o]) => {
      const { ra, dec } = galacticToEquatorial((l + 360) % 360, b)
      const at = place(ra, dec, ms, lat, lon, -4)
      return at ? `<circle class="mwb" cx="${n1(at[0])}" cy="${n1(at[1])}" r="${r}" opacity="${o}"/>` : ''
    })
    .join('')
  // the Great Rift, a lane of dust from Cygnus down to Sagittarius
  const rift = stroke(along(6, 72, 1.5, ms, lat, lon))
  const rnd = seeded(20261122)
  const dust = []
  for (let i = 0; i < 420; i++) {
    const l = rnd() * 360
    const b = (rnd() + rnd() + rnd() - 1.5) * 9
    const v = glow(l, b)
    if (v < 0.15) continue
    const { ra, dec } = galacticToEquatorial(l, b)
    const at = place(ra, dec, ms, lat, lon)
    if (!at) continue
    dust.push(`<circle cx="${n1(at[0])}" cy="${n1(at[1])}" r="0.5"${v > 0.6 ? ' class="d2"' : v > 0.35 ? ' class="d1"' : ''}/>`)
  }
  return `<g fill="none" stroke="#c9c1ee" stroke-linejoin="round" stroke-linecap="round">${band.join('')}</g>${clouds}` +
    (rift ? `<g fill="none" stroke="#0c1030" stroke-linecap="round" stroke-linejoin="round">${[26, 16, 8].map(w => `<path d="${rift}" stroke-width="${w}" stroke-opacity="0.12"/>`).join('')}</g>` : '') +
    `<g class="dust">${dust.join('')}</g>`
}

// The Andromeda galaxy, the Pleiades and the Orion nebula: soft glows.
function deepSky(ms, lat, lon) {
  const out = []
  const m31 = place(10.68, 41.27, ms, lat, lon)
  const tip = place(11.9, 42.6, ms, lat, lon)
  if (m31 && tip) {
    const turn = (Math.atan2(tip[1] - m31[1], tip[0] - m31[0]) * 180) / Math.PI
    out.push(`<ellipse class="dso" cx="${n1(m31[0])}" cy="${n1(m31[1])}" rx="16" ry="5" transform="rotate(${n1(turn)} ${n1(m31[0])} ${n1(m31[1])})" opacity="0.75"/>`)
  }
  const m45 = place(56.75, 24.12, ms, lat, lon)
  if (m45) out.push(`<circle class="dso" cx="${n1(m45[0])}" cy="${n1(m45[1])}" r="10" opacity="0.45"/>`)
  const m42 = place(83.82, -5.39, ms, lat, lon)
  if (m42) out.push(`<circle cx="${n1(m42[0])}" cy="${n1(m42[1])}" r="6" fill="url(#neb)" opacity="0.7"/>`)
  return out.join('')
}

/** The real night sky over `lat`, `lon` at `ms`, as SVG markup for the 1600 x 1000 sky. */
export function starfield(ms, lat, lon) {
  return `${DEFS}\n${milkyWay(ms, lat, lon)}\n${deepSky(ms, lat, lon)}\n${figures(ms, lat, lon)}\n${stars(ms, lat, lon)}`
}
