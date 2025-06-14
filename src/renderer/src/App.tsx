import React, { useEffect, useState } from 'react'
import { useSettingsStore } from './store/settingsStore'
import SettingsWindow from './components/SettingsWindow'
import { sizeMapping } from '../../shared/types/settings'

function App() {
  // URLフラグメントを確認して設定ウィンドウかどうかを判定
  const isSettingsWindow = window.location.hash === '#settings'
  
  // 設定ウィンドウの場合は設定コンポーネントのみを表示
  if (isSettingsWindow) {
    return <SettingsWindow />
  }
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  
  const { settings, openSettings, loadSettings, isSettingsOpen } = useSettingsStore()
  
  console.log('App レンダリング - isSettingsOpen:', isSettingsOpen)

  // 初期設定の読み込み
  useEffect(() => {
    loadSettings()
    
    // 設定変更の監視
    window.electronAPI?.onSettingsUpdated((updatedSettings: any) => {
      console.log('設定が更新されました:', updatedSettings)
      useSettingsStore.getState().setSettings(updatedSettings)
    })
    
    // クリーンアップ
    return () => {
      window.electronAPI?.removeSettingsUpdatedListener()
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
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [settings.displayFormat])

  const handleSettings = () => {
    console.log('設定ボタンがクリックされました')
    window.electronAPI?.openSettings()
    console.log('electronAPI.openSettings()を呼び出しました')
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
          className="absolute top-0 left-0 w-[100px] h-full drag-region cursor-move hover:bg-blue-300 bg-opacity-50 z-20"
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

            <div 
              className={`px-8 py-4 rounded-lg border-2 shadow-lg ${getFontClass()}`}
              style={getBoxStyle()}
            >
              {date && (
                <>
                  <div 
                    style={{
                      ...getTextStyle(),
                      fontSize: `${currentSizeSettings.fontSize.date}px`
                    }}
                    className="mb-2"
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
              >
                {time}
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}

export default App
