/** The sun's altitude and azimuth in degrees (azimuth from north, clockwise). */
export declare function sunAt(ms: number, lat: number, lon: number): { alt: number; az: number }

/** The moon's place, phase and Earth's shadow on it. */
export declare function moonAt(
  ms: number,
  lat: number,
  lon: number,
): {
  alt: number
  az: number
  lit: number
  waxing: boolean
  umbra: number
  penumbral: boolean
  dx: number
  dy: number
  shadow: number
  radius: number
}
