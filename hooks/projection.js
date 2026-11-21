// Where a direction in the sky lands on the 1600 x 1000 backdrop. The viewer
// faces south with east on the left. A Mercator projection: the horizon stays
// a straight line where the hills are, and shapes keep their angles, so a
// constellation looks like itself wherever it is. 7 pixels a degree shows
// about 228 degrees of azimuth and up to about 77 degrees of altitude.

const R = Math.PI / 180
const SCALE = 7
const K = (SCALE * 180) / Math.PI
const HORIZON = 860

/** The x of an azimuth (degrees from north): south in the middle. */
export function skyX(az) {
  const d = ((((az - 180) % 360) + 540) % 360) - 180
  return 800 + d * SCALE
}

/** The y of an altitude, for stars: unclamped, so the zenith runs off the top. */
export function starY(alt) {
  return HORIZON - K * Math.log(Math.tan((45 + Math.min(alt, 89.5) / 2) * R))
}

/**
 * The y of an altitude for the sun and moon: behind the hills when set, and
 * like the stars when high, so near the zenith they pass off the top of the
 * view instead of sliding along its edge.
 */
export function skyY(alt) {
  return starY(Math.max(-8, alt))
}
