import React, { useEffect, useState } from 'react'

function App() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setDate(
        `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now
          .getDate())
          .padStart(2, '0')}`
      )
      setTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
          now.getSeconds()
        ).padStart(2, '0')}`
      )
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSettings = () => window.electronAPI?.openSettings()
  const handleClose = () => window.electronAPI?.closeApp()

  return (
    <div className="relative w-full h-full">
      {/* ドラッグ可能なアプリ左側の範囲（時計に被る幅） */}
      <div
        className="absolute top-0 left-0 w-[100px] h-full drag-region cursor-move hover:bg-blue-300 bg-opacity-50 z-20"
      />

      {/* 時計＋ボタン部分 */}
      <div className="relative z-10 flex items-center justify-center h-full group">
        {/* ボタン：hover時に表示 */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 no-drag">
          {/* 設定ボタン */}
          <button
            onClick={handleSettings}
            className="w-10 h-10 flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white rounded-full shadow-lg"
            title="設定"
          >
            <svg
              className="w-[26px] h-[26px] block"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19.43 12.98c.04-.32.07-.66.07-1s-.03-.68-.07-1l2.11-1.65a.5.5 0 0 0 .11-.66l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a8.12 8.12 0 0 0-1.73-.99L14.5 2.5a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0-.5.5l-.38 2.57a8.12 8.12 0 0 0-1.73.99l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .11.66l2.11 1.65c-.04.32-.07.66-.07 1s.03.68.07 1l-2.11 1.65a.5.5 0 0 0-.11.66l2 3.46a.5.5 0 0 0 .6.22l2.49-1c.54.4 1.12.73 1.73.99l.38 2.57a.5.5 0 0 0 .5.5h4c.28 0 .5-.22.5-.5l.38-2.57c.61-.26 1.19-.59 1.73-.99l2.49 1a.5.5 0 0 0 .6-.22l2-3.46a.5.5 0 0 0-.11-.66l-2.11-1.65zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z" />
            </svg>
          </button>

          {/* 終了ボタン */}
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center bg-red-500 hover:bg-red-400 text-white rounded-full shadow-lg"
            title="終了"
          >
            <svg className="w-6 h-6 block" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        </div>

        {/* 時計本体 */}
        <div className="text-center">
          <div className="digital-font text-green-400 bg-black px-8 py-4 rounded-lg border-2 border-green-400 shadow-lg">
            <div className="text-4xl mb-2">{date}</div>
            <div className="border-t border-green-400 my-2" />
            <div className="text-6xl">{time}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
