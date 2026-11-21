// The sky for a given moment: where the sun is, and what the next 24 hours
// look like from there, as one long CSS animation that starts now.
import { STYLE, DEFS, NIGHT_SKY, CLOUDS, MT_A, MT_B, ACRO_DAY, ACRO_SHADE, ACRO_NIGHT, SNOW, SNOW_STYLE } from './parts.js'
import { sunAt, moonAt } from './astro.js'
import { skyX, skyY } from './projection.js'
import { STAR_STYLE, starfield } from './starfield.js'

export { sunAt, moonAt }

const R = Math.PI / 180
const DAY_MS = 86400000

/** Whether the app should be in its light mode: from sunrise to sunset. */
export function isDaytime(ms, lat, lon) {
  return sunAt(ms, lat, lon).alt > -1
}

// ---------- colours by the sun's altitude ----------

const toRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const toHex = rgb => '#' + rgb.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')

// anchors: [altitude, value], altitudes rising; a value is a number or a #hex
function at(anchors, alt) {
  if (alt <= anchors[0][0]) return anchors[0][1]
  for (let i = 1; i < anchors.length; i++) {
    const [a1, v1] = anchors[i]
    if (alt <= a1) {
      const [a0, v0] = anchors[i - 1]
      const t = (alt - a0) / (a1 - a0)
      if (typeof v0 === 'number') return v0 + (v1 - v0) * t
      const c0 = toRgb(v0)
      const c1 = toRgb(v1)
      return toHex(c0.map((c, k) => c + (c1[k] - c) * t))
    }
  }
  return anchors[anchors.length - 1][1]
}

// The sky gradient, top to horizon, at each altitude.
const SKY = [
  [-18, ['#090d25', '#131939', '#222754', '#363364', '#463d6c']],
  [-12, ['#0c1230', '#18204a', '#2b3364', '#46457a', '#5d4f80']],
  [-6, ['#18264f', '#2f4377', '#5d5f92', '#a57890', '#d98f78']],
  [-2, ['#2c4479', '#56699a', '#a88aa4', '#ec9a78', '#ffae68']],
  [1, ['#4f74a8', '#8299bf', '#d0aea6', '#f6b884', '#ffc677']],
  [5, ['#7d9fcb', '#a9bfd8', '#dccbbc', '#f3d3a6', '#f9dcac']],
  [10, ['#98b6da', '#b8cde2', '#dad9d4', '#efe0c6', '#f5e4c6']],
  [15, ['#b3c8e0', '#c8d7e6', '#dbe1e6', '#e9e6df', '#f0e8da']],
]
const skyStop = k => SKY.map(([a, v]) => [a, v[k]])

const CHANNELS = {
  night: [[-12, 1], [-5, 0]],
  cloud: [[-7, 0], [0, 0.9], [10, 1]],
  cloudColor: [[-6, '#b48fb0'], [-1, '#ffc9a8'], [8, '#ffffff']],
  glowColor: [[-12, '#a0789a'], [-5, '#f0806a'], [0, '#ff9a50'], [5, '#ffbe70'], [14, '#fff0d4']],
  glowOpacity: [[-12, 0.45], [-5, 0.75], [0, 0.95], [6, 0.8], [14, 0.6]],
  sun: [[-3, 0], [0.5, 1]],
  sunColor: [[0, '#ff9a50'], [5, '#ffd27a'], [20, '#fff6dc']],
  mtA: [[-12, '#2a2a58'], [-4, '#5a4a74'], [0, '#8a7c98'], [8, '#cbd3de']],
  mtB: [[-12, '#121536'], [-4, '#3e3458'], [0, '#6f6480'], [8, '#bcc6d3']],
  shade: [[-6, 0.9], [-1, 0.55], [2, 0.2], [6, 0]],
  golden: [[-1, 0], [3, 0.38], [10, 0.12], [16, 0]],
  lit: [[-6, 1], [-2, 0]],
}

function stateAt(ms, lat, lon) {
  const { alt, az } = sunAt(ms, lat, lon)
  const moon = moonAt(ms, lat, lon)
  const v = name => at(CHANNELS[name], alt)
  return {
    sky: [0, 1, 2, 3, 4].map(k => at(skyStop(k), alt)),
    night: v('night'),
    cloud: v('cloud'),
    cloudColor: v('cloudColor'),
    glowColor: v('glowColor'),
    glowOpacity: v('glowOpacity'),
    sun: v('sun'),
    sunColor: v('sunColor'),
    sunX: skyX(az),
    sunY: skyY(alt),
    moonX: skyX(moon.az),
    moonY: skyY(moon.alt),
    // up above the hills, paler by day
    moon: at([[-2, 0], [1, 1]], moon.alt) * at([[-6, 1], [4, 0.6]], alt),
    mtA: v('mtA'),
    mtB: v('mtB'),
    shade: v('shade'),
    golden: v('golden'),
    lit: v('lit'),
  }
}

// ---------- the animation ----------

const n2 = x => Math.round(x * 100) / 100
const n0 = x => Math.round(x)
const translate = ([x, y]) => `translate(${n0(x)}px,${n0(y)}px)`

// Each animated element: its class, and the CSS properties it animates, each
// a colour (c), a number (n) or a place on the sky (p, which counts only while
// the element can be seen).
const ELEMENTS = [
  ...[0, 1, 2, 3, 4].map(k => ({ cls: `k${k}`, props: [['stop-color', s => s.sky[k], 'c']] })),
  { cls: 'khor', props: [['stop-color', s => s.glowColor, 'c'], ['stop-opacity', s => n2(s.glowOpacity), 'n']] },
  { cls: 'ksun', seen: s => s.sun, props: [['transform', s => [s.sunX, s.sunY], 'p'], ['opacity', s => n2(s.sun), 'n']] },
  { cls: 'ksunc', props: [['stop-color', s => s.sunColor, 'c']] },
  { cls: 'kmoon', seen: s => s.moon, props: [['transform', s => [s.moonX, s.moonY], 'p'], ['opacity', s => n2(s.moon), 'n']] },
  { cls: 'knight', props: [['opacity', s => n2(s.night), 'n']] },
  { cls: 'kcloud', props: [['opacity', s => n2(s.cloud), 'n']] },
  { cls: 'kclc', props: [['stop-color', s => s.cloudColor, 'c']] },
  { cls: 'kmta', props: [['fill', s => s.mtA, 'c']] },
  { cls: 'kmtb', props: [['fill', s => s.mtB, 'c']] },
  { cls: 'kshade', props: [['opacity', s => n2(s.shade), 'n']] },
  { cls: 'kgold', props: [['opacity', s => n2(s.golden), 'n']] },
  { cls: 'klit', props: [['opacity', s => n2(s.lit), 'n']] },
]

const colorGap = (a, b) => Math.max(...toRgb(a).map((c, k) => Math.abs(c - toRgb(b)[k])))

// Whether an element looks different between two states, so the still
// stretches of its day need few keyframes.
function differs({ seen, props }, a, b) {
  return props.some(([, get, kind]) => {
    const [x, y] = [get(a), get(b)]
    if (kind === 'c') return colorGap(x, y) > 5
    if (kind === 'n') return Math.abs(x - y) > 0.03
    return (seen(a) > 0 || seen(b) > 0) && Math.hypot(x[0] - y[0], x[1] - y[1]) > 50
  })
}

// The moon's face for the moment it is drawn: its phase, lit side turned
// toward the sun, or Earth's shadow across it during an eclipse.
const MOON_R = 24
const MARIA = '<circle cx="-7" cy="-6" r="7"/><circle cx="6" cy="-9" r="5"/><circle cx="4" cy="5" r="8"/><circle cx="-9" cy="9" r="4"/>'

function moonFace(m, sun) {
  const r = MOON_R
  const turn = (Math.atan2(skyY(sun.alt) - skyY(m.alt), skyX(sun.az) - skyX(m.az)) * 180) / Math.PI
  const inShadow = m.umbra > 0
  const glow = `<circle r="90" fill="url(#moonG)" opacity="${n2(0.25 + 0.75 * m.lit)}"/>`
  if (inShadow || (m.penumbral && m.lit > 0.97)) {
    // full moon in Earth's shadow: the umbra bites in, and turns it copper when total
    const scale = r / m.radius
    const total = m.umbra >= 1
    const shadow = inShadow
      ? `<circle cx="${n2(m.dx * scale)}" cy="${n2(m.dy * scale)}" r="${n2(m.shadow * scale * 1.06)}" fill="#5a2416" opacity="0.35" clip-path="url(#moonDisk)"/>` +
        `<circle cx="${n2(m.dx * scale)}" cy="${n2(m.dy * scale)}" r="${n2(m.shadow * scale)}" fill="${total ? '#9a3a22' : '#3e1a14'}" opacity="${total ? 0.82 : 0.9}" clip-path="url(#moonDisk)"/>`
      : ''
    return `${total ? '' : glow}<clipPath id="moonDisk"><circle r="${r}"/></clipPath>` +
      `<circle r="${r}" fill="#f2efe4" opacity="${m.penumbral ? 0.88 : 1}"/><g fill="#d9d4c6" opacity="0.3">${MARIA}</g>${shadow}`
  }
  const rx = n2(r * Math.abs(1 - 2 * m.lit))
  const sweep = m.lit < 0.5 ? 0 : 1
  return `${glow}<clipPath id="moonLit"><path transform="rotate(${n2(turn)})" d="M0 -${r}A${r} ${r} 0 0 1 0 ${r}A${rx} ${r} 0 0 ${sweep} 0 -${r}Z"/></clipPath>` +
    `<g clip-path="url(#moonLit)"><circle r="${r}" fill="#f4f1e6"/><g fill="#d9d4c6" opacity="0.3">${MARIA}</g></g>`
}

const STEP_MS = 10 * 60 * 1000
const STEPS = DAY_MS / STEP_MS

/**
 * The whole backdrop SVG for the moment `ms`, seen from `lat`, `lon`. Its
 * markup holds the sky as it is now, so it is right with animation taken out;
 * its animation carries the sky through the next 24 hours.
 */
export function buildScene(ms, lat, lon, options = {}) {
  const states = []
  for (let k = 0; k <= STEPS; k++) states.push(stateAt(ms + k * STEP_MS, lat, lon))

  // each element keeps the keyframes where it changes, and the one just before each
  const css = ELEMENTS.map(el => {
    const keep = new Set([0, STEPS])
    let last = 0
    for (let k = 1; k < STEPS; k++) {
      if (differs(el, states[k], states[last])) {
        keep.add(k - 1)
        keep.add(k)
        last = k
      }
    }
    const steps = [...keep]
      .sort((a, b) => a - b)
      .map(k => {
        const values = el.props.map(([prop, get, kind]) => `${prop}:${kind === 'p' ? translate(get(states[k])) : get(states[k])}`)
        return `${n2((k / STEPS) * 100)}%{${values.join(';')}}`
      })
      .join('')
    return `@keyframes ${el.cls}{${steps}}\n.${el.cls}{animation:${el.cls} 86400s linear infinite}`
  }).join('\n')

  const s = states[0]
  const face = moonFace(moonAt(ms, lat, lon), sunAt(ms, lat, lon))
  const sky = s.sky
  const offsets = [0, 0.4, 0.72, 0.9, 1]

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
<style>
${STYLE}
${STAR_STYLE}
${css}
${options.snow ? SNOW_STYLE : ''}
</style>
<defs>
${DEFS}
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
${sky.map((c, k) => `<stop class="k${k}" offset="${offsets[k]}" stop-color="${c}"/>`).join('')}
</linearGradient>
<radialGradient id="hor" cx="0.7" cy="1" r="0.65">
<stop class="khor" offset="0" stop-color="${s.glowColor}" stop-opacity="${n2(s.glowOpacity)}"/><stop offset="1" stop-color="#fff0d4" stop-opacity="0"/>
</radialGradient>
<radialGradient id="sunG">
<stop offset="0" stop-color="#fffaf0"/><stop class="ksunc" offset="0.1" stop-color="${s.sunColor}"/><stop class="ksunc" offset="0.2" stop-color="${s.sunColor}" stop-opacity="0.4"/><stop offset="0.5" stop-color="#ffd9a0" stop-opacity="0.12"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/>
</radialGradient>
<radialGradient id="moonG">
<stop offset="0" stop-color="#eef0ff" stop-opacity="0.35"/><stop offset="1" stop-color="#eef0ff" stop-opacity="0"/>
</radialGradient>
<radialGradient id="cl">
<stop class="kclc" offset="0" stop-color="${s.cloudColor}" stop-opacity="0.42"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
</defs>
<!-- sky, fills the whole box -->
<svg width="100%" height="100%" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<rect x="-10" y="-10" width="1620" height="1020" fill="url(#sky)"/>
<g class="ksun" transform="translate(${n0(s.sunX)} ${n0(s.sunY)})" opacity="${n2(s.sun)}"><circle r="190" fill="url(#sunG)"/></g>
<g class="knight" opacity="${n2(s.night)}">
${starfield(ms, lat, lon)}
${NIGHT_SKY}
</g>
<g class="kmoon" transform="translate(${n0(s.moonX)} ${n0(s.moonY)})" opacity="${n2(s.moon)}">${face}</g>
<g class="kcloud" opacity="${n2(s.cloud)}"><g class="drift" fill="url(#cl)">${CLOUDS}</g></g>
<rect x="-10" y="520" width="1620" height="490" fill="url(#hor)"/>
<path class="kmta" fill="${s.mtA}" d="${MT_A}"/>
<path class="kmtb" fill="${s.mtB}" d="${MT_B}"/>
</svg>
<!-- the acropolis on its rock, pinned to the bottom right corner -->
<svg width="100%" height="100%" viewBox="0 0 1600 1000" preserveAspectRatio="xMaxYMax meet">
${ACRO_DAY}
<g class="kgold" fill="#ffaa4a" opacity="${n2(s.golden)}">${ACRO_SHADE}</g>
<g class="kshade" fill="#1b1733" opacity="${n2(s.shade)}">${ACRO_SHADE}</g>
<g class="klit" opacity="${n2(s.lit)}">${ACRO_NIGHT}</g>
</svg>${options.snow ? `
<!-- snow, over everything -->
<svg width="100%" height="100%" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice"><g class="snow">${SNOW}</g></svg>` : ''}
</svg>`
}
