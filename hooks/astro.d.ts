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

/** A star's altitude and azimuth from right ascension and declination (degrees, J2000). */
export declare function starAt(ra: number, dec: number, ms: number, lat: number, lon: number): { alt: number; az: number }

/** Galactic longitude and latitude (degrees) to right ascension and declination. */
export declare function galacticToEquatorial(l: number, b: number): { ra: number; dec: number }
