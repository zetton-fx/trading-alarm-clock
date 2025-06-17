import React, { useEffect, useState } from 'react'
import { useSettingsStore } from './store/settingsStore'
import SettingsWindow from './components/SettingsWindow'
import AlarmWindow from './components/AlarmWindow'
import { sizeMapping } from '../../shared/types/settings'

function App() {
  // URLフラグメントを確認して設定ウィンドウかアラームウィンドウかどうかを判定
  const isSettingsWindow = window.location.hash === '#settings'
  const isAlarmWindow = window.location.hash === '#alarm'
  
  // 設定ウィンドウの場合は設定コンポーネントのみを表示
  if (isSettingsWindow) {
    return <SettingsWindow />
  }
  
  // アラームウィンドウの場合はアラームコンポーネントのみを表示
  if (isAlarmWindow) {
    return <AlarmWindow />
  }

  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const [alarmNotification, setAlarmNotification] = useState<{
    type: 'alarm' | 'pre-alarm'
    name: string
    hour: number
    minute: number
    timestamp: number
  } | null>(null)
  
  const { settings, openSettings, loadSettings, isSettingsOpen } = useSettingsStore()

  // 音声を事前読み込みして autoplay policy に対応
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)

  // ページ読み込み時に音声コンテキストを準備
  useEffect(() => {
    const initAudio = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        setAudioContext(ctx)
        setIsAudioEnabled(true)
        console.log('音声コンテキスト初期化完了')
      } catch (error) {
        console.error('音声コンテキスト初期化失敗:', error)
      }
    }

    // 最初のクリックで音声を有効化
    const enableAudio = () => {
      initAudio()
      document.removeEventListener('click', enableAudio)
      document.removeEventListener('keydown', enableAudio)
    }

    document.addEventListener('click', enableAudio)
    document.addEventListener('keydown', enableAudio)
    
    return () => {
      document.removeEventListener('click', enableAudio)
      document.removeEventListener('keydown', enableAudio)
    }
  }, [])

  // 確実に音声を再生する関数（Electron autoplay policy対応）
  const playAlarmAudio = async (soundFile: string) => {
    try {
      console.log('音声再生開始:', soundFile)
      
      // 複数の音声再生手法を試行
      const audioSources = [
        `/sounds/${soundFile}`,
        `./sounds/${soundFile}`,
        `sounds/${soundFile}`,
        `src/assets/sounds/${soundFile}`
      ]
      
      for (const src of audioSources) {
        try {
          console.log('音声ソース試行:', src)
          const audio = new Audio(src)
          audio.volume = 0.8
          audio.preload = 'auto'
          
          // AudioContextがある場合は必ずresumeする
          if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume()
            console.log('AudioContext resumed')
          }
          
          // 音声を即座に再生
          await audio.play()
          console.log('音声再生成功:', src)
          return // 成功したら他の試行をスキップ
          
        } catch (err) {
          console.warn(`音声ソース ${src} で失敗:`, err)
          continue // 次のソースを試行
        }
      }
      
      // 全ての試行が失敗した場合の最後の手段
      console.log('全ての音声ソース試行が失敗、最後の手段を実行')
      const fallbackAudio = new Audio()
      fallbackAudio.volume = 0.8
      fallbackAudio.src = `/sounds/${soundFile}`
      
      // 強制的に音声コンテキストを作成・再開
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        setAudioContext(ctx)
        if (ctx.state === 'suspended') {
          await ctx.resume()
        }
      }
      
      // 最後の試行
      await fallbackAudio.play()
      console.log('fallback音声再生成功')
      
    } catch (error) {
      console.error('全ての音声再生試行が失敗:', error)
      
      // 最後の最後の手段：Web Audio APIを使用
      try {
        console.log('Web Audio API で音声再生を試行')
        if (audioContext) {
          // シンプルなビープ音を生成
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 1)
          
          console.log('Web Audio API でビープ音を再生しました')
        }
      } catch (webAudioError) {
        console.error('Web Audio API でも失敗:', webAudioError)
      }
    }
  }
  
  console.log('App レンダリング - isSettingsOpen:', isSettingsOpen)

  // 初期設定の読み込み
  useEffect(() => {
    loadSettings()
    
    // 設定変更の監視
    window.electronAPI?.onSettingsUpdated((updatedSettings: any) => {
      console.log('設定が更新されました:', updatedSettings)
      useSettingsStore.getState().setSettings(updatedSettings)
    })
    
    // アラーム通知の監視
    const handleAlarmTriggered = (alarmData: any) => {
      console.log('アラーム発動:', alarmData)
      setAlarmNotification({
        type: 'alarm',
        name: alarmData.name,
        hour: alarmData.hour,
        minute: alarmData.minute,
        timestamp: Date.now()
      })
      
      // アラーム音を再生（レンダラープロセス側）
      playAlarmAudio('alarm-upbeat-piano-and-trumpet.mp3')
      
      // 5秒後に通知を自動で消す
      setTimeout(() => {
        setAlarmNotification(null)
      }, 5000)
    }

    const handlePreAlarmTriggered = (alarmData: any) => {
      console.log('先行アラーム発動:', alarmData)
      setAlarmNotification({
        type: 'pre-alarm',
        name: alarmData.name,
        hour: alarmData.hour,
        minute: alarmData.minute,
        timestamp: Date.now()
      })
      
      // 先行アラーム音を再生（レンダラープロセス側）
      playAlarmAudio('alarm-electric-timer-beeping.mp3')
      
      // 5秒後に通知を自動で消す
      setTimeout(() => {
        setAlarmNotification(null)
      }, 5000)
    }

    // IPCイベントリスナーを登録
    window.electronAPI?.onAlarmTriggered?.(handleAlarmTriggered)
    window.electronAPI?.onPreAlarmTriggered?.(handlePreAlarmTriggered)
    
    // クリーンアップ
    return () => {
      window.electronAPI?.removeSettingsUpdatedListener()
      // アラームリスナーのクリーンアップ（必要に応じて）
    }
  }, [loadSettings])

  // 時計の更新
  useEffect(() => {
    const update = () => {
      const now = new Date()
      if (settings.displayFormat === 'datetime') {
        setDate(
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now
            .getDate())
            .padStart(2, '0')}`
        )
      } else {
        setDate('')
      }
      setTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
          now.getSeconds()
        ).padStart(2, '0')}`
      )
    }
    update()
    const timer = setInterval(update, 100)
    return () => clearInterval(timer)
  }, [settings.displayFormat])

  const handleSettings = () => {
    console.log('設定ボタンがクリックされました')
    window.electronAPI?.openSettings()
    console.log('electronAPI.openSettings()を呼び出しました')
  }
  
  const handleAddAlarm = () => {
    console.log('アラーム追加ボタンがクリックされました')
    // TODO: アラーム追加ウィンドウを開く処理を実装
    window.electronAPI?.openAlarmWindow()
    console.log('electronAPI.openAlarmWindow()を呼び出しました')
  }
  
  const handleClose = () => window.electronAPI?.closeApp()

  // 設定に基づくスタイルを生成
  const getFontClass = () => {
    switch (settings.font) {
      case 'DSEG7Classic':
        return 'font-dseg7-classic'
      case 'DSEG7ClassicMini':
        return 'font-dseg7-classic-mini'
      case 'DSEG7Modern':
        return 'font-dseg7-modern'
      case 'DSEG7ModernMini':
        return 'font-dseg7-modern-mini'
      case 'DSEG14Classic':
        return 'font-dseg14-classic'
      case 'DSEG14ClassicMini':
        return 'font-dseg14-classic-mini'
      case 'DSEG14Modern':
        return 'font-dseg14-modern'
      case 'DSEG14ModernMini':
        return 'font-dseg14-modern-mini'
      default:
        return ''
    }
  }

  const getTextStyle = () => {
    const glow = settings.glowIntensity > 0 
      ? `0 0 ${settings.glowIntensity * 1}px ${settings.glowColor}, 
         0 0 ${settings.glowIntensity * 2}px ${settings.glowColor}, 
         0 0 ${settings.glowIntensity * 3}px ${settings.glowColor},
         0 0 ${settings.glowIntensity * 5}px ${settings.glowColor}aa,
         0 0 ${settings.glowIntensity * 8}px ${settings.glowColor}66,
         0 1px 0 ${settings.glowColor}cc,
         1px 0 0 ${settings.glowColor}cc,
         0 -1px 0 ${settings.glowColor}cc,
         -1px 0 0 ${settings.glowColor}cc`
      : `0 1px 0 ${settings.glowColor}44,
         1px 0 0 ${settings.glowColor}44,
         0 -1px 0 ${settings.glowColor}44,
         -1px 0 0 ${settings.glowColor}44`
    
    // フォントウェイトの変換
    const getFontWeight = () => {
      switch (settings.fontWeight) {
        case 'light': return 300
        case 'regular': return 'normal'
        case 'bold': return 'bold'
        default: return 'normal'
      }
    }
    
    return {
      color: settings.textColor,
      textShadow: glow,
      fontFamily: settings.font.startsWith('DSEG7') || settings.font.startsWith('DSEG14')
        ? undefined 
        : settings.font,
      fontWeight: getFontWeight(),
      fontStyle: settings.fontStyle
    }
  }

  const getBackgroundStyle = () => ({
    backgroundColor: settings.backgroundColor
  })

  const getBoxStyle = () => {
    const boxGlow = settings.glowIntensity > 0 
      ? `0 0 ${settings.glowIntensity * 1}px ${settings.glowColor}, 
         0 0 ${settings.glowIntensity * 2}px ${settings.glowColor}, 
         0 0 ${settings.glowIntensity * 4}px ${settings.glowColor}aa,
         0 0 ${settings.glowIntensity * 6}px ${settings.glowColor}66,
         inset 0 0 ${settings.glowIntensity * 1}px ${settings.glowColor}33`
      : `0 0 1px ${settings.glowColor}66`
    return {
      ...getBackgroundStyle(),
      borderColor: settings.textColor,
      borderWidth: '2px',
      boxShadow: boxGlow
    }
  }

  const currentSizeSettings = sizeMapping[settings.size]

  return (
    <>
      <div className="relative w-full h-full" style={{ backgroundColor: 'transparent' }}>
        {/* ドラッグ可能なアプリ左側の範囲（時計に被る幅） */}
        <div
          className="absolute top-0 left-0 w-[40%] h-full drag-region cursor-move hover:bg-blue-300 bg-opacity-50 z-20"
        />

        {/* 時計＋ボタン部分 */}
        <div 
          className="relative z-10 flex items-center justify-center h-full group"
          onMouseEnter={() => window.electronAPI?.expandWindowForButtons()}
          onMouseLeave={() => window.electronAPI?.restoreWindowSize()}
        >
          {/* 時計本体 */}
          <div className="relative text-center">
            {/* ボタン：hover時に表示 - 時計の右上に配置（ウィンドウサイズが動的に調整される） */}
            <div className="absolute -top-2 -right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 no-drag z-30">
              {/* 設定ボタン */}
              <button
                onClick={handleSettings}
                className="w-10 h-10 flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white rounded-full shadow-lg"
                title="アプリ設定"
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
                className="w-10 h-10 flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white rounded-full shadow-lg"
                title="終了"
              >
                <svg className="w-5 h-5 block mx-auto" style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
              </button>
            </div>

            {/* アラーム追加ボタン：hover時に表示 - 時計の中央下に配置 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 no-drag z-30">
              <button
                onClick={handleAddAlarm}
                className="w-16 h-16 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-colors duration-200"
                title="アラーム追加"
              >
                <svg className="w-10 h-10 block" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
              </button>
            </div>

            <div 
              className={`px-8 py-4 rounded-lg border-2 shadow-lg ${getFontClass()}`}
              style={getBoxStyle()}
            >
              {/* 音声有効化メッセージ */}
              {!isAudioEnabled && (
                <div 
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs px-2 py-1 rounded"
                  style={{
                    background: 'rgba(255, 255, 0, 0.9)',
                    color: '#000',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    animation: 'blink 1s infinite'
                  }}
                >
                  クリックして音声を有効化
                </div>
              )}
              
              {date && (
                <>
                  <div 
                    style={{
                      ...getTextStyle(),
                      fontSize: `${currentSizeSettings.fontSize.date}px`
                    }}
                    className="mb-2 select-none"
                  >
                    {date}
                  </div>
                  <div 
                    className="my-2" 
                    style={{ 
                      borderColor: settings.textColor, 
                      borderTopWidth: 1,
                      boxShadow: settings.glowIntensity > 0 
                        ? `0 0 ${settings.glowIntensity * 1}px ${settings.glowColor}, 0 0 ${settings.glowIntensity * 3}px ${settings.glowColor}aa` 
                        : `0 0 1px ${settings.glowColor}44`
                    }} 
                  />
                </>
              )}
              <div 
                style={{
                  ...getTextStyle(),
                  fontSize: `${currentSizeSettings.fontSize.time}px`
                }}
                className="select-none"
              >
                {time}
              </div>
            </div>
          </div>
        </div>

        {/* アラーム通知 */}
        {alarmNotification && (
          <div className="fixed top-4 right-4 z-50 animate-bounce">
            <div className={`px-6 py-4 rounded-lg shadow-lg border-2 ${
              alarmNotification.type === 'alarm' 
                ? 'bg-red-500 border-red-600 text-white' 
                : 'bg-yellow-500 border-yellow-600 text-black'
            }`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {alarmNotification.type === 'alarm' ? '🔔' : '⏰'}
                </div>
                <div>
                  <div className="font-bold text-lg">
                    {alarmNotification.type === 'alarm' ? 'アラーム！' : '先行アラーム'}
                  </div>
                  <div className="text-sm">
                    {alarmNotification.name}
                  </div>
                  <div className="text-sm">
                    {String(alarmNotification.hour).padStart(2, '0')}:
                    {String(alarmNotification.minute).padStart(2, '0')}
                  </div>
                </div>
                <button
                  onClick={() => setAlarmNotification(null)}
                  className="ml-4 w-8 h-8 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-40 rounded-full transition-colors"
                  title="閉じる"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </>
  )
}

export default App
