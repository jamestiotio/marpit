/** @module */
import marpitPlugin from '../../plugin'

/**
 * Marpit background image apply plugin.
 *
 * Apply parsed meta for background image / color into directives of each page.
 *
 * When inline SVG is enabled, it will reshape meta for advanced process instead
 * of converting to directives.
 *
 * @function backgroundImageApply
 * @param {MarkdownIt} md markdown-it instance.
 */
function _backgroundImageApply(md) {
  md.core.ruler.after(
    'marpit_inline_svg',
    'marpit_apply_background_image',
    ({ inlineMode, tokens }) => {
      if (inlineMode) return

      let current = {}

      for (const tb of tokens) {
        if (tb.type === 'marpit_slide_open') current.open = tb
        if (tb.type === 'marpit_inline_svg_content_open')
          current.svgContent = tb

        if (tb.type === 'marpit_slide_close') {
          if (current.images && current.images.length > 0) {
            if (current.svgContent) {
              // Reshape meta for advanced background
              current.svgContent.meta = {
                ...(current.svgContent.meta || {}),
                marpitBackground: {
                  direction: current.direction,
                  height: current.svgContent.attrGet('height'),
                  images: current.images,
                  open: current.open,
                  split: current.split,
                  splitSize: current.splitSize,
                  width: current.svgContent.attrGet('width'),
                },
              }
            } else {
              // Apply simple CSS background
              const img = current.images[current.images.length - 1]

              current.open.meta.marpitDirectives = {
                ...(current.open.meta.marpitDirectives || {}),
                backgroundImage: `url("${img.url}")`,
              }

              if (img.size)
                current.open.meta.marpitDirectives.backgroundSize = img.size
            }
          }
          current = {}
        }

        // Collect parsed inline image meta
        if (current.open && tb.type === 'inline')
          for (const t of tb.children) {
            if (t.type === 'image') {
              const {
                background,
                backgroundDirection,
                backgroundSize,
                backgroundSplit,
                backgroundSplitSize,
                color,
                filter,
                height,
                size,
                url,
                width,
              } = t.meta.marpitImage

              if (background && !url.match(/^\s*$/)) {
                if (color) {
                  // Background color
                  current.open.meta.marpitDirectives = {
                    ...(current.open.meta.marpitDirectives || {}),
                    backgroundColor: color,
                  }
                } else {
                  // Background image
                  current.images = [
                    ...(current.images || []),
                    {
                      filter,
                      height,
                      size: (() => {
                        const s = size || backgroundSize || undefined

                        return !['contain', 'cover'].includes(s) &&
                          (width || height)
                          ? `${width || s || 'auto'} ${height || s || 'auto'}`
                          : s
                      })(),
                      url,
                      width,
                    },
                  ]
                }
              }

              if (backgroundDirection) current.direction = backgroundDirection
              if (backgroundSplit) current.split = backgroundSplit
              if (backgroundSplitSize) current.splitSize = backgroundSplitSize
            }
          }
      }
    }
  )
}

export const backgroundImageApply = marpitPlugin(_backgroundImageApply)
export default backgroundImageApply
