import React, { useState, useEffect } from 'react'

function App() {
  // 現在時刻と日付を状態として管理
  const [time, setTime] = useState<string>('')
  const [date, setDate] = useState<string>('')

  // 日付を YYYY/MM/DD 形式でフォーマットする関数
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}/${month}/${day}`
  }

  // 時刻を HH:MM:SS 形式でフォーマットする関数
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  // コンポーネントがマウントされたときに時計を開始
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      setTime(formatTime(now))
      setDate(formatDate(now))
    }

    // 初期値を設定
    updateDateTime()
    
    // 1秒ごとに時刻を更新するインターバルを設定
    const interval = setInterval(updateDateTime, 1000)

    // コンポーネントがアンマウントされたときにインターバルをクリア
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center h-full drag-region">
      <div className="text-center">
        <div className="digital-font text-green-400 bg-black px-8 py-4 rounded-lg border-2 border-green-400 shadow-lg">
          <div className="text-4xl mb-2">{date}</div>
          <div className="border-t border-green-400 my-2"></div>
          <div className="text-6xl">{time}</div>
        </div>
      </div>
    </div>
  )
}

export default App 