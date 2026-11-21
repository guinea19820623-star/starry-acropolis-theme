/** The sun's altitude and azimuth in degrees (azimuth from north, clockwise). */
export declare function sunAt(ms: number, lat: number, lon: number): { alt: number; az: number }

/** Whether the app should be in its light mode: from sunrise to sunset. */
export declare function isDaytime(ms: number, lat: number, lon: number): boolean

/** The whole backdrop SVG for the moment `ms`, animated through the next 24 hours. */
export declare function buildScene(ms: number, lat: number, lon: number): string
