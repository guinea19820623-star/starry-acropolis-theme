// Generates the backdrop scene for 撫子的星空主題 and writes it as hooks/scene.js.
// Run from the mod folder: node tools/gen-scene.mjs hooks/scene.js
// It also writes tools/scene.preview.svg to open in a browser.
import { writeFileSync } from 'node:fs'

const out = process.argv[2]

// Fixed-seed random so everything stays where it is between builds.
let seed = 20261121
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 2
const f = n => Math.round(n * 10) / 10

// ======================= sky layer (1600 x 1000, slice) =======================

// Stars: five groups that twinkle out of step, three colours, three sizes.
const groups = [[], [], [], [], []]
for (let i = 0; i < 190; i++) {
  const x = rnd() * 1600
  const y = Math.pow(rnd(), 1.3) * 800
  const k = rnd()
  const r = k > 0.95 ? 1.8 : k > 0.75 ? 1.2 : k > 0.35 ? 0.85 : 0.6
  const c = rnd()
  const cls = c > 0.8 ? ' class="w"' : c > 0.62 ? ' class="b"' : ''
  groups[i % 5].push(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}"${cls}/>`)
}
const starGroups = groups.map((g, i) => `<g class="st s${i}" opacity="0.85">${g.join('')}</g>`).join('\n')

// Milky way: drawn along the x axis, then the group is turned onto a diagonal.
// Dust is dense at the core and thins out; a dark rift runs just off the middle.
const MW = { cx: 1150, cy: 260, angle: -32 }
const dust = []
for (let i = 0; i < 300; i++) {
  const along = (rnd() - 0.5) * 1500
  const fade = 1 - Math.abs(along) / 820
  const across = gauss() * 95 * (0.6 + fade * 0.5)
  // keep the rift a little emptier
  if (Math.abs(across - 12) < 10 && rnd() < 0.6) continue
  const r = rnd() > 0.9 ? 0.9 : 0.5
  const o = 0.25 + rnd() * 0.5 * Math.max(fade, 0.2)
  dust.push(`<circle cx="${f(MW.cx + along)}" cy="${f(MW.cy + across)}" r="${r}"${o > 0.5 ? ' class="d2"' : o > 0.35 ? ' class="d1"' : ''}/>`)
}

// Four-point sparkle stars, like the bright ones in the weather frame.
const sparkle = (x, y, s, cls) =>
  `<g class="sp ${cls}" transform="translate(${x} ${y})">` +
  `<circle r="${f(s * 1.3)}" class="sph"/>` +
  `<path d="M0 ${-s}L${f(s * 0.13)} ${f(-s * 0.13)}L${s} 0L${f(s * 0.13)} ${f(s * 0.13)}L0 ${s}L${f(-s * 0.13)} ${f(s * 0.13)}L${-s} 0L${f(-s * 0.13)} ${f(-s * 0.13)}Z"/></g>`
// Meteor shower: streaks fly out from a radiant above the top right edge,
// each on its own slow cycle so they never fall in step.
const RAD = [1520, -90]
const meteorSpec = [
  // start x, start y, length, cycle, delay
  [1300, 60, 130, 23, 1], [1180, 140, 110, 29, 5], [1420, 170, 90, 37, 9],
  [980, 90, 150, 23, 13], [1260, 260, 100, 31, 3], [860, 210, 120, 37, 21],
  [1100, 30, 80, 29, 17], [1380, 330, 110, 41, 26], [720, 120, 170, 43, 33],
  [1020, 300, 95, 31, 18],
]
const meteorCss = []
const meteors = meteorSpec
  .map(([x, y, len, cyc, del], i) => {
    const ang = (Math.atan2(y - RAD[1], x - RAD[0]) * 180) / Math.PI
    meteorCss.push(`.m${i}{animation:shoot ${cyc}s linear ${del}s infinite}`)
    const big = len >= 150
    return (
      `<g transform="translate(${x} ${y}) rotate(${f(ang)})"><g class="mv m${i}">` +
      `<path d="M0 -${big ? 1.4 : 1}L-${len} 0L0 ${big ? 1.4 : 1}Z" fill="url(#metT)"/>` +
      `<circle r="${big ? 5 : 3.5}" fill="url(#spg)"/><circle r="${big ? 1.7 : 1.3}" fill="#fff8e4"/></g></g>`
    )
  })
  .join('')

const sparkles = [
  sparkle(370, 180, 11, 'p0'),
  sparkle(222, 330, 8, 'p1'),
  sparkle(1228, 214, 10, 'p2'),
  sparkle(1076, 384, 9, 'p3'),
  sparkle(760, 226, 5, 'p4'),
  sparkle(1470, 120, 6, 'p1'),
  sparkle(560, 470, 5, 'p2'),
].join('')

// Night clouds: long lavender wisps low in the sky, lit from the city below.
const wisps = [
  [260, 640, 300, 26], [620, 690, 260, 20], [980, 655, 340, 24], [1380, 700, 280, 18],
  [140, 745, 220, 16], [820, 760, 300, 18], [1250, 600, 200, 14],
]
  .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`)
  .join('')

// Day clouds: soft banks, each a few overlapping white glows.
const cloudBanks = []
for (const [cx, cy, w] of [[250, 230, 300], [930, 150, 380], [640, 520, 320], [1360, 330, 260], [120, 610, 220], [1100, 640, 280]]) {
  for (let k = 0; k < 5; k++) {
    const x = cx + (rnd() - 0.5) * w
    const y = cy + (rnd() - 0.5) * 34
    cloudBanks.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(w * (0.35 + rnd() * 0.3))}" ry="${f(16 + rnd() * 22)}"/>`)
  }
}

// ======================= acropolis (corner layer, pinned bottom right) =======================

// Parthenon: eight columns, uplit from below.
const P = { left: 1222, right: 1442, base: 826, colH: 50 }
const pCols = []
for (let i = 0; i < 8; i++) {
  const cx = P.left + 10 + i * ((P.right - P.left - 20) / 7)
  pCols.push(
    `<rect x="${f(cx - 5)}" y="${P.base - P.colH}" width="10" height="${P.colH}"/>` +
      `<rect x="${f(cx - 7)}" y="${P.base - P.colH - 3}" width="14" height="3.5"/>`,
  )
}
// Erechtheion-like small temple to the left, and the Propylaea gate at the edge.
const smallCols = (left, n, gap, top, h, w) => {
  let s = ''
  for (let i = 0; i < n; i++) s += `<rect x="${f(left + i * gap)}" y="${top}" width="${w}" height="${h}"/>`
  return s
}

const cypress = (x, base, h, w) =>
  `<path d="M${x} ${base - h}C${f(x + w * 0.55)} ${f(base - h * 0.62)} ${f(x + w * 0.6)} ${f(base - h * 0.2)} ${f(x + w * 0.35)} ${base}H${f(x - w * 0.35)}C${f(x - w * 0.6)} ${f(base - h * 0.2)} ${f(x - w * 0.55)} ${f(base - h * 0.62)} ${x} ${base - h}Z"/>`
const trees = [
  cypress(1070, 930, 70, 16), cypress(1090, 936, 52, 13), cypress(1046, 950, 44, 12),
  cypress(1540, 900, 64, 15), cypress(1560, 908, 46, 12), cypress(1500, 935, 40, 11),
  cypress(1196, 822, 24, 7), cypress(1466, 822, 22, 6),
].join('')

// City lights at the foot of the rock: little windows and street lamps.
const lights = []
for (let i = 0; i < 46; i++) {
  const x = 1000 + rnd() * 600
  const y = 905 + Math.pow(rnd(), 0.7) * 95
  lights.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.9 + rnd() * 1.1)}"/>`)
}
const lightsA = lights.filter((_, i) => i % 2 === 0).join('')
const lightsB = lights.filter((_, i) => i % 2 === 1).join('')
const houses = []
for (let i = 0; i < 14; i++) {
  const x = 1000 + rnd() * 580
  const y = 925 + rnd() * 60
  const w = 10 + rnd() * 16
  houses.push(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(6 + rnd() * 6)}"/>`)
}

// Masonry lines on the lit wall.
const masonry = []
for (let y = 842; y < 866; y += 6) masonry.push(`M${1118 + (y - 842)} ${y}H${f(1514 - (y - 842) * 0.6)}`)


const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
<style>
.sky{fill:url(#skyN)}
.glow{fill:url(#horN)}
.mtA{fill:url(#mtAN)}
.mtB{fill:#121536}
.st circle{fill:#eef0ff}
.st .w{fill:#ffe0a0}
.st .b{fill:#cfe0ff}
.dust circle{fill:#d8d2f4;opacity:0.3}
.dust .d1{opacity:0.45}
.dust .d2{opacity:0.65}
.mw{fill:url(#mw)}
.mwc{fill:url(#mwc)}
.rift{fill:url(#riftG)}
.sp path{fill:#fff3d2}
.sph{fill:url(#spg)}
.wisp{fill:url(#wispN)}
.rock{fill:url(#rockN)}
.wall{fill:url(#wallN)}
.mason{stroke:#3a2716;stroke-width:0.7;opacity:0.35;fill:none}
.tree{fill:#090c22}
.house{fill:#2a2340;opacity:0.9}
.lit circle{fill:#ffcf72}
.tglow{fill:url(#tg)}
.cella{fill:url(#cellaN)}
.col{fill:url(#colN)}
.ent{fill:#b07a3c}
.ped{fill:#9a6a34}
.edge{stroke:#ffe2a0;stroke-width:0.9;fill:none;opacity:0.8}
.base{fill:#d9a556}
.day{display:none}
.mv{opacity:0}
@keyframes tw{0%,100%{opacity:0.95}50%{opacity:0.35}}
@keyframes spk{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.55;transform:scale(0.72)}}
@keyframes br{0%,100%{opacity:0.75}50%{opacity:1}}
@keyframes flick{0%,100%{opacity:0.9}50%{opacity:0.5}}
@keyframes shoot{0%{opacity:0;transform:translate(0px,0px)}1%{opacity:0.95}4.5%{opacity:0;transform:translate(340px,0px)}100%{opacity:0;transform:translate(340px,0px)}}
@keyframes drift{0%{transform:translate(0px,0px)}100%{transform:translate(50px,0px)}}
.s0{animation:tw 7s ease-in-out infinite}
.s1{animation:tw 9s ease-in-out -2s infinite}
.s2{animation:tw 11s ease-in-out -5s infinite}
.s3{animation:tw 8s ease-in-out -6s infinite}
.s4{animation:tw 13s ease-in-out -3s infinite}
.sp>*{transform-box:fill-box;transform-origin:center}
.p0>*{animation:spk 6s ease-in-out infinite}
.p1>*{animation:spk 8s ease-in-out -3s infinite}
.p2>*{animation:spk 7s ease-in-out -1s infinite}
.p3>*{animation:spk 9s ease-in-out -4s infinite}
.p4>*{animation:spk 5s ease-in-out -2s infinite}
.tglow{animation:br 10s ease-in-out infinite}
.la{animation:flick 6s ease-in-out infinite}
.lb{animation:flick 8s ease-in-out -3s infinite}
${meteorCss.join('\n')}
.drift{animation:drift 80s ease-in-out infinite alternate}
@media (prefers-color-scheme: light){
.sky{fill:url(#skyD)}
.glow{fill:url(#horD)}
.mtA{fill:#cbd3de}
.mtB{fill:#bcc6d3}
.night{display:none}
.day{display:inline}
.dawn{fill:url(#dawn)}
.cloud{fill:url(#cl)}
.rock{fill:url(#rockD)}
.wall{fill:url(#wallD)}
.mason{stroke:#a8987a;opacity:0.4}
.tree{fill:#7d8a72}
.house{fill:#e2d8c6;opacity:1}
.tglow{fill:url(#tgD)}
.cella{fill:#d3c8b3}
.col{fill:#f8f4ec;stroke:#a99a7e;stroke-width:0.6}
.ent{fill:#f3eee4;stroke:#a99a7e;stroke-width:0.6}
.ped{fill:#eee7da;stroke:#a99a7e;stroke-width:0.6}
.edge{stroke:#c29a4e;opacity:0.6}
.base{fill:#e9e1d1;stroke:#a99a7e;stroke-width:0.6}
}
</style>
<defs>
<linearGradient id="skyN" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#090d25"/><stop offset="0.4" stop-color="#131939"/><stop offset="0.72" stop-color="#222754"/><stop offset="0.9" stop-color="#363364"/><stop offset="1" stop-color="#463d6c"/>
</linearGradient>
<linearGradient id="skyD" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#bccce0"/><stop offset="0.55" stop-color="#dbe1e6"/><stop offset="1" stop-color="#f0e8da"/>
</linearGradient>
<radialGradient id="horN" cx="0.7" cy="1" r="0.65">
<stop offset="0" stop-color="#a0789a" stop-opacity="0.45"/><stop offset="0.5" stop-color="#6c5a90" stop-opacity="0.2"/><stop offset="1" stop-color="#6c5a90" stop-opacity="0"/>
</radialGradient>
<radialGradient id="horD" cx="0.7" cy="1" r="0.65">
<stop offset="0" stop-color="#fff0d4" stop-opacity="0.8"/><stop offset="1" stop-color="#fff0d4" stop-opacity="0"/>
</radialGradient>
<radialGradient id="dawn" cx="0.85" cy="0.72" r="0.5">
<stop offset="0" stop-color="#ffe9bf" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe9bf" stop-opacity="0"/>
</radialGradient>
<linearGradient id="mtAN" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#2a2a58"/><stop offset="1" stop-color="#171a40"/>
</linearGradient>
<radialGradient id="mw">
<stop offset="0" stop-color="#c4bdf0" stop-opacity="0.15"/><stop offset="0.55" stop-color="#9088cc" stop-opacity="0.06"/><stop offset="1" stop-color="#9088cc" stop-opacity="0"/>
</radialGradient>
<radialGradient id="mwc">
<stop offset="0" stop-color="#f0dcff" stop-opacity="0.16"/><stop offset="1" stop-color="#d9b8e8" stop-opacity="0"/>
</radialGradient>
<radialGradient id="riftG">
<stop offset="0" stop-color="#0c1030" stop-opacity="0.3"/><stop offset="1" stop-color="#0c1030" stop-opacity="0"/>
</radialGradient>
<radialGradient id="spg">
<stop offset="0" stop-color="#ffe9b8" stop-opacity="0.5"/><stop offset="1" stop-color="#ffe9b8" stop-opacity="0"/>
</radialGradient>
<radialGradient id="wispN">
<stop offset="0" stop-color="#9c86b8" stop-opacity="0.28"/><stop offset="1" stop-color="#9c86b8" stop-opacity="0"/>
</radialGradient>
<radialGradient id="cl">
<stop offset="0" stop-color="#ffffff" stop-opacity="0.42"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
<radialGradient id="tg">
<stop offset="0" stop-color="#f3c065" stop-opacity="0.45"/><stop offset="0.6" stop-color="#d99a4a" stop-opacity="0.12"/><stop offset="1" stop-color="#d99a4a" stop-opacity="0"/>
</radialGradient>
<radialGradient id="tgD">
<stop offset="0" stop-color="#fff8ea" stop-opacity="0.85"/><stop offset="1" stop-color="#fff8ea" stop-opacity="0"/>
</radialGradient>
<linearGradient id="rockN" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#4a3630"/><stop offset="0.2" stop-color="#2a2238"/><stop offset="1" stop-color="#0c0f27"/>
</linearGradient>
<linearGradient id="rockD" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#dccdb0"/><stop offset="1" stop-color="#c7b796"/>
</linearGradient>
<linearGradient id="wallN" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#6a4626"/><stop offset="0.6" stop-color="#a8733a"/><stop offset="1" stop-color="#d9a25a"/>
</linearGradient>
<linearGradient id="wallD" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#e8dcc4"/><stop offset="1" stop-color="#d4c4a4"/>
</linearGradient>
<linearGradient id="colN" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#d49b52"/><stop offset="1" stop-color="#ffe6ab"/>
</linearGradient>
<linearGradient id="cellaN" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#8a5a2a"/><stop offset="1" stop-color="#ffcf78"/>
</linearGradient>
<linearGradient id="metT" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#c9c2ff" stop-opacity="0"/><stop offset="0.7" stop-color="#f3e6ff" stop-opacity="0.45"/><stop offset="1" stop-color="#fff8e4" stop-opacity="1"/>
</linearGradient>
</defs>
<!-- sky, fills the whole box -->
<svg width="100%" height="100%" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<rect class="sky" x="-10" y="-10" width="1620" height="1020"/>
<g class="day">
<rect class="dawn" x="-10" y="-10" width="1620" height="1020"/>
<g class="drift">
<g class="cloud">${cloudBanks.join('')}</g>
</g>
</g>
<g class="night">
<g transform="rotate(${MW.angle} ${MW.cx} ${MW.cy})">
<ellipse class="mw" cx="${MW.cx}" cy="${MW.cy}" rx="760" ry="150"/>
<ellipse class="mw" cx="${MW.cx + 60}" cy="${MW.cy - 6}" rx="460" ry="78"/>
<ellipse class="mwc" cx="${MW.cx + 40}" cy="${MW.cy}" rx="300" ry="46"/>
<g class="dust">${dust.join('')}</g>
<ellipse class="rift" cx="${MW.cx + 30}" cy="${MW.cy + 14}" rx="460" ry="30"/>
</g>
${starGroups}
${sparkles}
<g class="shower">${meteors}</g>
<g class="wisp drift">${wisps}</g>
</g>
<rect class="glow" x="-10" y="520" width="1620" height="490"/>
<path class="mtA" d="M-10 1010V900C120 878 220 852 330 864S520 898 640 882S860 842 980 856S1200 892 1330 870S1520 842 1610 852V1010Z"/>
<path class="mtB" d="M-10 1010V950C140 934 300 922 460 936S760 958 920 944S1250 920 1420 934S1560 948 1610 942V1010Z"/>
</svg>
<!-- the acropolis on its rock, pinned to the bottom right corner -->
<svg width="100%" height="100%" viewBox="0 0 1600 1000" preserveAspectRatio="xMaxYMax meet">
<ellipse class="tglow" cx="1320" cy="820" rx="330" ry="150"/>
<path class="rock" d="M960 1010C990 980 1030 950 1062 922C1078 906 1090 892 1098 874L1108 846L1116 838L1200 836L1300 834L1420 835L1516 837L1526 846L1540 868C1558 884 1584 896 1610 904V1010Z"/>
<path class="wall" d="M1116 838L1200 836L1300 834L1420 835L1516 837L1526 850L1518 858L1490 862L1470 870L1420 868L1380 874L1330 870L1280 876L1230 871L1190 875L1150 869L1124 866L1110 856Z"/>
<path class="mason" d="${masonry.join('')}"/>
<g class="night house">${houses.join('')}</g>
<g class="night lit"><g class="la">${lightsA}</g><g class="lb">${lightsB}</g></g>
<g class="tree">${trees}</g>
<!-- Propylaea at the west edge -->
<rect class="cella" x="1128" y="818" width="46" height="18"/>
<g class="col">${smallCols(1130, 6, 8, 818, 18, 4)}</g>
<rect class="ent" x="1124" y="812" width="54" height="6"/>
<!-- Erechtheion -->
<rect class="cella" x="1180" y="806" width="34" height="22"/>
<g class="col">${smallCols(1182, 5, 7.5, 808, 20, 4)}</g>
<rect class="ent" x="1176" y="802" width="42" height="6"/>
<!-- Parthenon -->
<rect class="cella" x="${P.left + 6}" y="${P.base - P.colH}" width="${P.right - P.left - 12}" height="${P.colH}"/>
<rect class="base" x="${P.left - 12}" y="${P.base + 6}" width="${P.right - P.left + 24}" height="5"/>
<rect class="base" x="${P.left - 8}" y="${P.base + 3}" width="${P.right - P.left + 16}" height="4"/>
<rect class="base" x="${P.left - 4}" y="${P.base}" width="${P.right - P.left + 8}" height="4"/>
<g class="col">${pCols.join('')}</g>
<rect class="ent" x="${P.left - 6}" y="${P.base - P.colH - 15}" width="${P.right - P.left + 12}" height="12"/>
<path class="ped" d="M${P.left - 10} ${P.base - P.colH - 15}L${(P.left + P.right) / 2} ${P.base - P.colH - 44}L${P.right + 10} ${P.base - P.colH - 15}Z"/>
<path class="edge" d="M${P.left - 6} ${P.base - P.colH - 9}H${P.right + 6}M${P.left - 10} ${P.base - P.colH - 15}L${(P.left + P.right) / 2} ${P.base - P.colH - 44}L${P.right + 10} ${P.base - P.colH - 15}"/>
</svg>
</svg>`

const ts = `// Generated by tools/gen-scene.mjs: the backdrop scene of 撫子的星空主題.
// Night: a starry sky with the milky way, slow twinkling, a gentle meteor shower and the lit
// acropolis in the bottom right corner. Day: pale marble with the same acropolis.
export const SCENE = ${JSON.stringify(svg)}
`
writeFileSync(out, ts)
writeFileSync(out.replace(/hooks[\\/]scene\.js$/, 'tools/scene.preview.svg'), svg)
console.log('scene characters:', svg.length)
