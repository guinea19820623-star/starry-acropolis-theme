import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { SCENE } from './scene.js'

// 撫子的星空主題: a starry night over the acropolis, a pale blue sky by day.
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

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'starry-temple', glass: { blur: 14, opacity: 0.62 } },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    const set = await $.theme.set(LOOK)

    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== 'starry-temple') {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    return (
      <Svg
        source={SCENE}
        alt="古希臘衛城坐在岩石台地上，夜裡星星慢慢閃、流星雨從右上方落下；白天是淡藍天空與柔雲"
        isInteractive
      />
    )
  })
}
