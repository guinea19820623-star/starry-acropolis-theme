import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { buildScene, isDaytime, sunAt } from './sky.js'

// 撫子的星空主題: the sky over the acropolis follows the real sun, from dawn
// through noon and dusk to a starry night, and the app's light and dark mode
// follow it too. The moon keeps its real place and phase (eclipses included),
// and snow falls when it is snowing where you are.
// Colors follow the starry weather frame: night indigo, bright gold, marble white.
const { theme, problems } = makeColors({
  label: '撫子的星空',
  id: 'nadeshiko-starry',
  roles: { accent: '#d6a53e', danger: '#c8524a', success: '#6a9e55', warning: '#d48a2c', pro: '#9a8bd6' },
  light: {
    roles: { accent: '#a9781f', warning: '#b8741a' },
    gray: {
      anchors: {
        'surface-0': '#ebe3d3',
        'surface-1': '#f1eadd',
        'surface-2': '#f8f3ea',
        'text-primary': '#1c2336',
        'text-secondary': '#384056',
        'text-muted': '#555c70',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#151a33',
        'surface-1': '#1a2040',
        'surface-2': '#1f2648',
        'surface-3': '#232a4d',
        'text-primary': '#f3ece0',
        'text-secondary': '#d5cdbe',
        'text-muted': '#b1a998',
      },
    },
  },
})

// Taoyuan, unless the person sets their own place in the plugin's options.
const DEFAULT_LAT = 24.99
const DEFAULT_LON = 121.3

// WMO weather codes for snow, as Open-Meteo reports them.
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86])

const SCENE = 'starry-temple'

const lookFor = (isDay: boolean): ThemeSetArgs => ({
  colors: theme,
  backdrop: { scene: SCENE, glass: { blur: 14, opacity: 0.62 } },
  overrideColorScheme: isDay ? 'light' : 'dark',
})

const toNumber = (value: unknown, fallback: number) => {
  const n = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(n) ? n : fallback
}

// active: whether the session's one theme is this sky. Another theme plugin
// may set its own later; then the sky stops switching light and dark (and
// stops asking about the weather) so it never takes that theme's place.
type Sky = { lat: number; lon: number; snowing: boolean; active: boolean }

// Whether a theme.set names this sky's scene
const isMine = (args: ThemeSetArgs) => {
  const b = args.backdrop

  return typeof b === 'object' && b !== null && 'scene' in b && b.scene === SCENE
}

// Asks Open-Meteo whether it is snowing at the sky's place, and redraws when
// that changes. Any failure leaves the sky as it was, until the next check.
async function checkWeather($: EngineInterface, sky: Sky) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${sky.lat}&longitude=${sky.lon}&current=weather_code`
    const reply = await $.http.fetch(url)

    if (!reply.ok) {
      return
    }
    const code = (JSON.parse(reply.text) as { current?: { weather_code?: number } }).current?.weather_code
    const snowing = code !== undefined && SNOW_CODES.has(code)

    if (snowing !== sky.snowing) {
      sky.snowing = snowing
      $.ui.invalidate('ui.render')
    }
  } catch {
    // no weather this time
  }
}

export const register: Register = (on, options) => {
  const lat = toNumber(options.latitude, DEFAULT_LAT)
  const lon = toNumber(options.longitude, DEFAULT_LON)
  // auto: ask Open-Meteo; off: never snow, no network; snow: always snow
  const weather = options.weather === 'off' || options.weather === 'snow' ? options.weather : 'auto'
  let isDay: boolean | undefined
  const sky: Sky = { lat, lon, snowing: weather === 'snow', active: false }

  // One theme stands at a time, the latest set, whichever plugin set it:
  // follow every set and clear, and keep to this sky only while it stands.
  on('theme.set', async ($, e, next) => {
    const result = await next(e)

    if (!('deny' in result)) {
      sky.active = isMine(e)
    }

    return result
  })

  on('theme.clear', async ($, e, next) => {
    const result = await next(e)

    if (!('deny' in result)) {
      sky.active = false
    }

    return result
  })

  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    isDay = isDaytime(await $.clock.now(), lat, lon)
    const set = await $.theme.set(lookFor(isDay))

    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }
    // the plugin's own set may not pass through its own theme.set hook
    sky.active = set.isDrawn || set.requestId !== undefined
    if (weather === 'auto') {
      void checkWeather($, sky)
    }

    // Once a minute: switch light and dark at sunrise and sunset. Draw the sky
    // again every quarter of an hour, so it stays on time after a sleep, and
    // every 5 minutes at night, so the stars keep turning. Every half hour:
    // look at the weather. All of it only while the sky is the theme.
    let minutes = 0

    $.clock.every(60_000, () => {
      minutes += 1
      if (!sky.active) {
        return
      }
      void (async () => {
        const now = await $.clock.now()
        const nowDay = isDaytime(now, lat, lon)
        const every = sunAt(now, lat, lon).alt < -6 ? 5 : 15

        if (nowDay !== isDay) {
          isDay = nowDay
          await $.theme.set(lookFor(nowDay))
        } else if (minutes % every === 0) {
          $.ui.invalidate('ui.render')
        }
        if (weather === 'auto' && minutes % 30 === 0) {
          await checkWeather($, sky)
        }
      })()
    })

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== 'starry-temple') {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)
    const source = buildScene(await $.clock.now(), lat, lon, { snow: sky.snowing })

    return (
      <Svg
        source={source}
        alt={`古希臘衛城坐在岩石台地上，天色跟著真實的太陽變化，月亮照著真實的位置與月相${sky.snowing ? '，正在下雪' : ''}`}
        isInteractive
      />
    )
  })
}
