import { useRef, useEffect, RefObject } from 'react'

export const useWindowDrag = (draggableRef: RefObject<HTMLElement | null>): void => {
  const isDragging = useRef(false)
  const initialMousePos = useRef({ x: 0, y: 0 })
  const initialWindowPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseDown = async (e: MouseEvent) => {
      // ボタンなど、インタラクティブな要素の上ではドラッグを開始しない
      if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) {
        return
      }
      
      const currentWindowPos = await window.electronAPI.getWindowPosition()
      if (!currentWindowPos) return

      isDragging.current = true
      initialMousePos.current = { x: e.screenX, y: e.screenY }
      initialWindowPos.current = currentWindowPos
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const dx = e.screenX - initialMousePos.current.x
        const dy = e.screenY - initialMousePos.current.y
        const newX = initialWindowPos.current.x + dx
        const newY = initialWindowPos.current.y + dy

        window.electronAPI.setWindowPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    const draggableElement = draggableRef.current
    if (draggableElement) {
      draggableElement.addEventListener('mousedown', handleMouseDown)
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      if (draggableElement) {
        draggableElement.removeEventListener('mousedown', handleMouseDown)
      }
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggableRef])
}