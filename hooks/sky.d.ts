export { sunAt, moonAt } from './astro.js'

/** Whether the app should be in its light mode: from sunrise to sunset. */
export declare function isDaytime(ms: number, lat: number, lon: number): boolean

/**
 * The whole backdrop SVG for the moment `ms`, animated through the next 24
 * hours; `snow` adds falling snow over the scene.
 */
export declare function buildScene(ms: number, lat: number, lon: number, options?: { snow?: boolean }): string
