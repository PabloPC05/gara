import { useCallback } from 'react'
import { MIN_RESIZE_WIDTH, MAX_RESIZE_RATIO } from '../constants'

export function useDrawerResize(drawerRef, onResizeEnd) {
  return useCallback(
    (e) => {
      e.preventDefault()
      const drawer = drawerRef.current
      if (!drawer) return

      const startX = e.clientX
      const startWidth = drawer.getBoundingClientRect().width
      const maxWidth = window.innerWidth * MAX_RESIZE_RATIO

      drawer.style.transition = 'none'
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const overlay = drawer.parentElement
      const fastaBar = document.querySelector('[data-slot="fasta-bar"]')
      if (fastaBar) fastaBar.style.transition = 'none'

      const onMove = (ev) => {
        const w = Math.min(
          Math.max(startWidth + (startX - ev.clientX), MIN_RESIZE_WIDTH),
          maxWidth,
        )
        drawer.style.width = `${w}px`
        drawer.style.maxWidth = `${w}px`
        if (overlay) {
          overlay.style.setProperty('--details-width', `${w}px`)
          overlay.style.setProperty('--details-sidebar-width', `${w}px`)
        }
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        onResizeEnd(drawer.getBoundingClientRect().width)
        drawer.style.transition = ''
        if (fastaBar) fastaBar.style.transition = ''
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [drawerRef, onResizeEnd],
  )
}
