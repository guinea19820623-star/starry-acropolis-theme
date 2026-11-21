// Writes the backdrop at several moments of today into a folder, with an
// index.html that shows them side by side.
// Run from the mod folder: node tools/preview.mjs <folder> [latitude] [longitude]
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { buildScene, sunAt } from '../hooks/sky.js'

const dir = process.argv[2] ?? 'tools/preview'
const lat = Number(process.argv[3] ?? 24.99)
const lon = Number(process.argv[4] ?? 121.3)
mkdirSync(dir, { recursive: true })

const today = new Date()
const times = ['05:30', '06:05', '06:30', '08:00', '12:00', '16:00', '16:50', '17:15', '17:40', '18:30', '22:00', '03:00']
const cards = times.map(hm => {
  const [h, m] = hm.split(':').map(Number)
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m).getTime()
  const name = `sky-${hm.replace(':', '')}.svg`
  writeFileSync(join(dir, name), buildScene(t, lat, lon))
  const { alt } = sunAt(t, lat, lon)
  return `<figure><iframe src="${name}"></iframe><figcaption>${hm} · sun ${alt.toFixed(1)}°</figcaption></figure>`
})
writeFileSync(
  join(dir, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>Sky preview</title>
<style>body{margin:0;padding:12px;background:#222;color:#ddd;font:13px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
figure{margin:0}iframe{width:100%;aspect-ratio:16/10;border:0;display:block}figcaption{padding:4px 2px}</style>
${cards.join('\n')}`,
)
console.log('wrote', times.length, 'moments to', dir)
