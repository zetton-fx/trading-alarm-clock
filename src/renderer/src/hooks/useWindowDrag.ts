import { useRef, useEffect, RefObject } from 'react'

export const useWindowDrag = (draggableRef: RefObject<HTMLElement | null>): void => {
  const isDragging = useRef(false)
  // マウスカーソルとウィンドウ左上の相対位置（オフセット）を保持
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseDown = async (e: MouseEvent) => {
      // ボタンなど、インタラクティブな要素の上ではドラッグを開始しない
      if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) {
        return
      }

      isDragging.current = true
      
      // 現在のウィンドウとカーソルの位置を一度だけ取得
      const windowPos = await window.electronAPI.getWindowPosition()
      const cursorPoint = await window.electronAPI.getCursorScreenPoint()

      if (windowPos) {
        // ドラッグ開始時のオフセットを計算して保存
        dragOffset.current = {
          x: windowPos.x - cursorPoint.x,
          y: windowPos.y - cursorPoint.y
        }
      }
    }

    const handleMouseMove = async (e: MouseEvent) => {
      if (isDragging.current) {
        // リアルタイムでカーソル位置を取得
        const cursorPoint = await window.electronAPI.getCursorScreenPoint()
        
        // カーソル位置にオフセットを加算して、新しいウィンドウ位置を決定
        const newX = cursorPoint.x + dragOffset.current.x
        const newY = cursorPoint.y + dragOffset.current.y
        
        // メインプロセスにウィンドウの移動を要求
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