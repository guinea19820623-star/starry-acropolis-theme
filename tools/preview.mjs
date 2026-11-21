// Writes the backdrop at several moments into a folder, with an index.html
// that shows them side by side: today's sky, a few moon phases, the total
// lunar eclipse of 3 March 2026 and a snowy night.
// Run from the mod folder: node tools/preview.mjs <folder> [latitude] [longitude]
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { buildScene, moonAt, sunAt } from '../hooks/sky.js'

const dir = process.argv[2] ?? 'tools/preview'
const lat = Number(process.argv[3] ?? 24.99)
const lon = Number(process.argv[4] ?? 121.3)
mkdirSync(dir, { recursive: true })

const today = new Date()
const todayAt = hm => {
  const [h, m] = hm.split(':').map(Number)
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m).getTime()
}
const moments = [
  ...['05:30', '06:30', '08:00', '12:00', '16:50', '17:15', '17:40', '21:00'].map(hm => [`today ${hm}`, todayAt(hm)]),
  ['crescent · 2026-11-12 18:20', Date.parse('2026-11-12T18:20:00+08:00')],
  ['first quarter · 2026-11-17 19:30', Date.parse('2026-11-17T19:30:00+08:00')],
  ['waning · 2026-11-30 06:00', Date.parse('2026-11-30T06:00:00+08:00')],
  ['eclipse, partial · 2026-03-03 18:45', Date.parse('2026-03-03T18:45:00+08:00')],
  ['eclipse, total · 2026-03-03 19:35', Date.parse('2026-03-03T19:35:00+08:00')],
  ['snow · today 21:00', todayAt('21:00'), { snow: true }],
]
const cards = moments.map(([label, t, options], i) => {
  const name = `sky-${String(i).padStart(2, '0')}.svg`
  writeFileSync(join(dir, name), buildScene(t, lat, lon, options))
  const sun = sunAt(t, lat, lon)
  const moon = moonAt(t, lat, lon)
  const note = `sun ${sun.alt.toFixed(0)}° · moon ${moon.alt.toFixed(0)}°, ${Math.round(moon.lit * 100)}% lit${moon.umbra > 0 ? `, umbra ${moon.umbra.toFixed(2)}` : ''}`
  return `<figure><iframe src="${name}"></iframe><figcaption>${label} · ${note}</figcaption></figure>`
})
writeFileSync(
  join(dir, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>Sky preview</title>
<style>body{margin:0;padding:12px;background:#222;color:#ddd;font:13px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
figure{margin:0}iframe{width:100%;aspect-ratio:16/10;border:0;display:block}figcaption{padding:4px 2px}</style>
${cards.join('\n')}`,
)
console.log('wrote', moments.length, 'moments to', dir)
