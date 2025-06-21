import { useRef, useEffect, RefObject } from 'react'

export const useWindowDrag = (draggableRef: RefObject<HTMLElement | null>): void => {
  const isDragging = useRef(false)
  const dragStarted = useRef(false)
  const initialMousePos = useRef({ x: 0, y: 0 })
  const initialWindowPos = useRef({ x: 0, y: 0 })
  const lastUpdateTime = useRef(0)
  const dragStartTimer = useRef<NodeJS.Timeout | null>(null)
  
  // ドラッグ設定
  const DRAG_START_DELAY = 100 // ms - ドラッグ開始までの遅延
  const MIN_DRAG_DISTANCE = 5 // px - ドラッグ開始に必要な最小移動距離
  const UPDATE_THROTTLE = 16 // ms - 更新間隔（約60fps）

  useEffect(() => {
    const handleMouseDown = async (e: MouseEvent) => {
      // ボタンなど、インタラクティブな要素の上ではドラッグを開始しない
      if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) {
        return
      }
      
      // 左クリックのみ対応
      if (e.button !== 0) {
        return
      }
      
      const currentWindowPos = await window.electronAPI.getWindowPosition()
      if (!currentWindowPos) return

      // ドラッグ準備状態に設定
      isDragging.current = true
      dragStarted.current = false
      initialMousePos.current = { x: e.screenX, y: e.screenY }
      initialWindowPos.current = currentWindowPos
      
      // ドラッグ開始の遅延タイマーを設定
      dragStartTimer.current = setTimeout(() => {
        dragStarted.current = true
      }, DRAG_START_DELAY)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      
      const dx = e.screenX - initialMousePos.current.x
      const dy = e.screenY - initialMousePos.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // 最小移動距離に達していない場合は何もしない
      if (distance < MIN_DRAG_DISTANCE && !dragStarted.current) {
        return
      }
      
      // ドラッグが正式に開始されていない場合は開始する
      if (!dragStarted.current) {
        dragStarted.current = true
        if (dragStartTimer.current) {
          clearTimeout(dragStartTimer.current)
          dragStartTimer.current = null
        }
        // メインプロセスにドラッグ開始を通知
        window.electronAPI.dragStart()
      }
      
      // フレームレート制限
      const now = Date.now()
      if (now - lastUpdateTime.current < UPDATE_THROTTLE) {
        return
      }
      lastUpdateTime.current = now
      
      // ウィンドウ位置を更新
      const newX = initialWindowPos.current.x + dx
      const newY = initialWindowPos.current.y + dy
      
      // ウィンドウ位置の更新を非同期で実行（ブロッキングを避ける）
      requestAnimationFrame(() => {
        window.electronAPI.setWindowPosition({ x: newX, y: newY })
      })
    }

    const handleMouseUp = () => {
      // ドラッグが開始されていた場合はメインプロセスに終了を通知
      if (dragStarted.current) {
        window.electronAPI.dragEnd()
      }
      
      // ドラッグ状態をリセット
      isDragging.current = false
      dragStarted.current = false
      
      // タイマーをクリア
      if (dragStartTimer.current) {
        clearTimeout(dragStartTimer.current)
        dragStartTimer.current = null
      }
    }

    // ウィンドウからフォーカスが外れた場合もドラッグを停止
    const handleBlur = () => {
      // ドラッグが開始されていた場合はメインプロセスに終了を通知
      if (dragStarted.current) {
        window.electronAPI.dragEnd()
      }
      
      isDragging.current = false
      dragStarted.current = false
      
      if (dragStartTimer.current) {
        clearTimeout(dragStartTimer.current)
        dragStartTimer.current = null
      }
    }

    const draggableElement = draggableRef.current
    if (draggableElement) {
      draggableElement.addEventListener('mousedown', handleMouseDown)
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('blur', handleBlur)
    }

    return () => {
      if (draggableElement) {
        draggableElement.removeEventListener('mousedown', handleMouseDown)
      }
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('blur', handleBlur)
      
      // クリーンアップ時にタイマーもクリア
      if (dragStartTimer.current) {
        clearTimeout(dragStartTimer.current)
        dragStartTimer.current = null
      }
      
      // クリーンアップ時にドラッグが進行中の場合は終了を通知
      if (dragStarted.current) {
        window.electronAPI.dragEnd()
      }
    }
  }, [draggableRef])
}