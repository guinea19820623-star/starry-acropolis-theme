/** The x of an azimuth (degrees from north): south in the middle. */
export declare function skyX(az: number): number
/** The y of an altitude, for stars. */
export declare function starY(alt: number): number
/** The y of an altitude for the sun and moon: behind the hills when set, off the top near the zenith. */
export declare function skyY(alt: number): number
