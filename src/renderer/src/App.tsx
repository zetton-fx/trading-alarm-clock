import React, { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from './store/settingsStore'
import { useAlarmStore } from './store/alarmStore'
import SettingsWindow from './components/SettingsWindow'
import AlarmWindow from './components/AlarmWindow'
import { sizeMappingDateTime, sizeMappingTime } from '../../shared/types/settings'

// -------------------------------------------------------
// グローバルに 1 本だけ保持する Audio インスタンス
// どのコンポーネントから呼ばれても同じ Audio が使われるため
// アラーム音が同時に複数鳴ることを物理的に防げる
// -------------------------------------------------------
let globalAudio: HTMLAudioElement | null = null

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
  const [alarmTimeoutId, setAlarmTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [isInitialDisplay, setIsInitialDisplay] = useState(true);
  
  const { settings, openSettings, loadSettings, isSettingsOpen } = useSettingsStore()
  const { settings: alarmSettings, loadAlarmSettings, setSettings: setAlarmSettings } = useAlarmStore()

  // 音声管理
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  // ページ読み込み時に音声コンテキストを即座に準備
  useEffect(() => {
    const initAudio = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        setAudioContext(ctx)
        console.log('音声コンテキスト初期化完了')
      } catch (error) {
        console.error('音声コンテキスト初期化失敗:', error)
      }
    }

    // Electronアプリでは即座に音声を有効化
    initAudio()
  }, [])

  // 確実に音声を再生する関数（Electron autoplay policy対応）
  const playAlarmAudio = async (soundFile: string, volume: number = 80) => {
    try {
      console.log('音声再生開始:', soundFile)
      
      // グローバル Audio を停止
      if (globalAudio) {
        console.log('既存音声を停止します:', globalAudio.src)
        try {
          globalAudio.pause()
          globalAudio.currentTime = 0
          globalAudio.src = ''
          globalAudio.load()
        } catch (stopErr) {
          console.warn('音声停止中にエラー:', stopErr)
        }
        globalAudio = null
        setCurrentAudio(null)
      }
      
      // 少し待機してから新しい音声を開始（確実に前の音声が停止するため）
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 複数の音声再生手法を試行
      const audioSources = [
        `/sounds/${soundFile}`,
        `./sounds/${soundFile}`,
        `sounds/${soundFile}`,
        `src/assets/sounds/${soundFile}`
      ]
      
      let createdAudios: HTMLAudioElement[] = [] // 作成したAudioオブジェクトを追跡
      
      for (const src of audioSources) {
        try {
          console.log('音声ソース試行:', src)
          const audio = new Audio(src)
          createdAudios.push(audio) // 作成したAudioを記録
          
          audio.volume = volume / 100
          audio.preload = 'auto'
          audio.loop = true // ループ再生でアラームらしく
          
          // AudioContextがある場合は必ずresumeする
          if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume()
            console.log('AudioContext resumed')
          }
          
          // 音声を即座に再生
          await audio.play()
          
          // 成功した場合、他の失敗したAudioオブジェクトをクリーンアップ
          createdAudios.forEach(a => {
            if (a !== audio) {
              try {
                a.pause()
                a.src = ''
              } catch (cleanupError) {
                console.warn('Audio cleanup error:', cleanupError)
              }
            }
          })
          
          globalAudio = audio // グローバルに保存
          setCurrentAudio(audio) // React state にも保存（UI デバッグ用）
          console.log('音声再生成功:', src)
          return // 成功したら他の試行をスキップ
          
        } catch (err) {
          console.warn(`音声ソース ${src} で失敗:`, err)
          continue // 次のソースを試行
        }
      }
      
      // 全て失敗した場合、作成したAudioオブジェクトをクリーンアップ
      createdAudios.forEach(audio => {
        try {
          audio.pause()
          audio.src = ''
        } catch (cleanupError) {
          console.warn('Final cleanup error:', cleanupError)
        }
      })
      
      // 全ての試行が失敗した場合の最後の手段
      console.log('全ての音声ソース試行が失敗、最後の手段を実行')
      const fallbackAudio = new Audio()
      fallbackAudio.volume = volume / 100
      fallbackAudio.loop = true
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
      globalAudio = fallbackAudio
      setCurrentAudio(fallbackAudio)
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

  // 全ての音声を強制停止する関数
  const stopAllAudio = () => {
    console.log('🔇 全ての音声を強制停止します')
    
    // ページ内の全てのaudioエレメントを取得して停止
    const allAudioElements = document.querySelectorAll('audio')
    allAudioElements.forEach((audio, index) => {
      try {
        console.log(`Audio要素 ${index} を停止:`, audio.src)
        audio.pause()
        audio.currentTime = 0
        audio.src = ''
        audio.load()
      } catch (error) {
        console.warn(`Audio要素 ${index} の停止中にエラー:`, error)
      }
    })
    
    // currentAudioも停止
    if (currentAudio) {
      try {
        currentAudio.pause()
        currentAudio.currentTime = 0
        currentAudio.src = ''
        currentAudio.load()
        currentAudio.onended = null
        currentAudio.onerror = null
        currentAudio.onloadstart = null
        currentAudio.oncanplay = null
      } catch (error) {
        console.warn('currentAudio停止中にエラー:', error)
      }
    }
    
    setCurrentAudio(null)
    console.log('全ての音声停止完了')
  }

  // 音声を停止する関数
  const stopAlarmAudio = () => {
    if (globalAudio) {
      console.log('音声停止処理開始:', globalAudio.src)
      try {
        globalAudio.pause()
        globalAudio.currentTime = 0
        globalAudio.src = ''
        globalAudio.load()
        globalAudio.onended = null
        globalAudio.onerror = null
        globalAudio.onloadstart = null
        globalAudio.oncanplay = null
      } catch (stopError) {
        console.warn('音声停止処理中にエラー:', stopError)
      }
      globalAudio = null
      setCurrentAudio(null)
      console.log('音声停止完了')
    } else {
      console.log('停止する音声がありません')
    }
    
    // 念のため全ての音声も停止
    stopAllAudio()
  }

  // アラーム通知が消える時に音声を確実に停止
  useEffect(() => {
    if (!alarmNotification && currentAudio) {
      console.log('アラーム通知が消えたため音声を停止します')
      stopAlarmAudio()
    }
  }, [alarmNotification, currentAudio])

  // ESCキーでアラーム通知を消す
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && alarmNotification) {
        console.log('ESCキーでアラーム通知を消します')
        if (alarmTimeoutId) {
          clearTimeout(alarmTimeoutId)
          setAlarmTimeoutId(null)
        }
        stopAlarmAudio()
        setAlarmNotification(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [alarmNotification, alarmTimeoutId])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialDisplay(false);
    }, 1000); // 1秒後に非表示に

    return () => clearTimeout(timer);
  }, []); // 空の依存配列で、コンポーネントマウント時に一度だけ実行

  // 初期設定の読み込み
  useEffect(() => {
    loadSettings()
    loadAlarmSettings()
    
    // デバッグ用のグローバル関数を追加
    if (typeof window !== 'undefined') {
      (window as any).debugShowSettings = async () => {
        const memorySettings = await window.electronAPI?.debugGetMemorySettings()
        const memoryAlarmSettings = await window.electronAPI?.debugGetMemoryAlarmSettings()
        console.group('🔧 メモリ上の設定情報')
        console.log('📱 アプリ設定 (メインプロセス):', memorySettings)
        console.log('⏰ アラーム設定 (メインプロセス):', memoryAlarmSettings)
        console.log('📱 アプリ設定 (レンダラープロセス):', settings)
        console.log('⏰ アラーム設定 (レンダラープロセス):', alarmSettings)
        console.groupEnd()
        return {
          mainProcess: {
            appSettings: memorySettings,
            alarmSettings: memoryAlarmSettings
          },
          rendererProcess: {
            appSettings: settings,
            alarmSettings: alarmSettings
          }
        }
      }
      
      (window as any).debugShowAlarmSettings = async () => {
        const memoryAlarmSettings = await window.electronAPI?.debugGetMemoryAlarmSettings()
        console.group('⏰ アラーム設定詳細')
        console.log('メインプロセス (実際にアラーム発動で使用):', memoryAlarmSettings)
        console.log('レンダラープロセス (UI表示用):', alarmSettings)
            console.log('🔊 グローバルアラーム音:', memoryAlarmSettings?.globalAlarmSound)
    console.log('🔊 グローバル先行アラーム音:', memoryAlarmSettings?.globalPreAlarmSound)
    console.log('🔉 グローバルボリューム:', memoryAlarmSettings?.globalVolume + '%')
    console.log('🔉 グローバル先行アラームボリューム:', memoryAlarmSettings?.globalPreAlarmVolume + '%')
    console.log('⏰ メインアラーム自動停止:', memoryAlarmSettings?.globalAlarmAutoStop ? 'ON (30秒後)' : 'OFF')
    console.log('⏰ 先行アラーム自動停止:', memoryAlarmSettings?.globalPreAlarmAutoStop ? 'ON (15秒後)' : 'OFF')
    console.log('📝 登録済みアラーム数:', memoryAlarmSettings?.alarms?.length || 0)
        console.groupEnd()
        return memoryAlarmSettings
      }
      
      (window as any).debugShowAppSettings = async () => {
        const memorySettings = await window.electronAPI?.debugGetMemorySettings()
        console.group('📱 アプリ設定詳細')
        console.log('メインプロセス:', memorySettings)
        console.log('レンダラープロセス:', settings)
        console.log('📏 サイズ:', memorySettings?.size)
        console.log('📌 常に前面表示:', memorySettings?.alwaysOnTop)
        console.log('🎨 フォント:', memorySettings?.font)
        console.log('🎨 文字色:', memorySettings?.textColor)
        console.log('🎨 背景色:', memorySettings?.backgroundColor)
        console.groupEnd()
        return memorySettings
      }
      
      // ヘルプ関数
      (window as any).debugHelp = () => {
        console.group('🛠️ デバッグ関数ヘルプ')
        console.log('📋 debugShowSettings() - 全設定を表示')
        console.log('⏰ debugShowAlarmSettings() - アラーム設定のみ表示')
        console.log('📱 debugShowAppSettings() - アプリ設定のみ表示')
        console.log('❓ debugHelp() - このヘルプを表示')
        console.groupEnd()
      }
      
      console.log('🛠️ デバッグ関数が利用可能です。debugHelp() でヘルプを表示できます。')
    }
    
    // 設定変更の監視
    window.electronAPI?.onSettingsUpdated((updatedSettings: any) => {
      console.log('設定が更新されました:', updatedSettings)
      useSettingsStore.getState().setSettings(updatedSettings)
    })
    
    // アラーム設定変更の監視
    window.electronAPI?.onAlarmSettingsUpdated((updatedAlarmSettings: any) => {
      console.log('アラーム設定が更新されました:', updatedAlarmSettings)
      setAlarmSettings(updatedAlarmSettings)
    })
    
    // アラーム通知の監視
    const handleAlarmTriggered = (alarmData: any) => {
      // 新しいアラーム再生前に必ず既存の音声を停止
      stopAlarmAudio()
      console.log('メインアラーム発動:', alarmData)
      
      // 既存のアラームがある場合は停止
      if (alarmNotification) {
        console.log('🔄 既存のアラームを停止して新しいメインアラームに切り替えます')
        setAlarmNotification(null) // ポップアップを確実に閉じる
      }
      
      // 既存のタイマーをクリア
      if (alarmTimeoutId) {
        clearTimeout(alarmTimeoutId)
        setAlarmTimeoutId(null)
      }
      
      const newNotification = {
        type: 'alarm' as const,
        name: alarmData.name,
        hour: alarmData.hour,
        minute: alarmData.minute,
        timestamp: Date.now()
      }
      console.log('🔔 新しいメインアラーム通知を設定:', newNotification)
      setAlarmNotification(newNotification)
      
      // 最新のアラーム設定を取得してから音声を再生
      const currentAlarmSettings = useAlarmStore.getState().settings
      console.log('音声再生に使用する設定:', {
        sound: currentAlarmSettings.globalAlarmSound,
        volume: currentAlarmSettings.globalVolume
      })
      playAlarmAudio(currentAlarmSettings.globalAlarmSound, currentAlarmSettings.globalVolume)
      
      // 自動停止設定に基づいて30秒後に通知を自動で消す（音声も停止）
      if (currentAlarmSettings.globalAlarmAutoStop) {
        const timeoutId = setTimeout(() => {
          console.log('メインアラーム自動停止: 30秒経過')
          stopAlarmAudio()
          setAlarmNotification(null)
          setAlarmTimeoutId(null)
        }, 30000)
        setAlarmTimeoutId(timeoutId)
      } else {
        console.log('メインアラーム自動停止: OFF - 手動停止まで継続')
      }
    }

    const handlePreAlarmTriggered = (alarmData: any) => {
      // 新しいアラーム再生前に必ず既存の音声を停止
      stopAlarmAudio()
      console.log('先行アラーム発動:', alarmData)
      
      // 既存のアラームがある場合は停止
      if (alarmNotification) {
        console.log('🔄 既存のアラームを停止して新しい先行アラームに切り替えます')
        setAlarmNotification(null) // ポップアップを確実に閉じる
      }
      
      // 既存のタイマーをクリア
      if (alarmTimeoutId) {
        clearTimeout(alarmTimeoutId)
        setAlarmTimeoutId(null)
      }
      
      const newNotification = {
        type: 'pre-alarm' as const,
        name: alarmData.name,
        hour: alarmData.hour,
        minute: alarmData.minute,
        timestamp: Date.now()
      }
      console.log('🔔 新しい先行アラーム通知を設定:', newNotification)
      setAlarmNotification(newNotification)
      
      // 最新のアラーム設定を取得してから音声を再生
      const currentAlarmSettings = useAlarmStore.getState().settings
      console.log('先行アラーム音声再生に使用する設定:', {
        sound: currentAlarmSettings.globalPreAlarmSound,
        volume: currentAlarmSettings.globalPreAlarmVolume
      })
      playAlarmAudio(currentAlarmSettings.globalPreAlarmSound, currentAlarmSettings.globalPreAlarmVolume)
      
      // 自動停止設定に基づいて15秒後に通知を自動で消す（音声も停止）
      if (currentAlarmSettings.globalPreAlarmAutoStop) {
        const timeoutId = setTimeout(() => {
          console.log('先行アラーム自動停止: 15秒経過')
          stopAlarmAudio()
          setAlarmNotification(null)
          setAlarmTimeoutId(null)
        }, 15000)
        setAlarmTimeoutId(timeoutId)
      } else {
        console.log('先行アラーム自動停止: OFF - 手動停止まで継続')
      }
    }

    // IPCイベントリスナーを登録
    window.electronAPI?.onAlarmTriggered?.(handleAlarmTriggered)
    window.electronAPI?.onPreAlarmTriggered?.(handlePreAlarmTriggered)
    
    // クリーンアップ
    return () => {
      // 音声を停止
      stopAlarmAudio()
      // タイマーをクリア
      if (alarmTimeoutId) {
        clearTimeout(alarmTimeoutId)
      }
      window.electronAPI?.removeSettingsUpdatedListener()
      window.electronAPI?.removeAlarmSettingsUpdatedListener()
      // アラームリスナーのクリーンアップ（必要に応じて）
    }
  }, [loadSettings, loadAlarmSettings, setAlarmSettings])

  // 時計の更新 - requestAnimationFrame で毎フレーム監視、秒が変わった瞬間だけ setState
  useEffect(() => {
    let animFrameId: number
    let lastSec = -1

    const update = () => {
      const now = new Date()
      const s = now.getSeconds()
      if (s !== lastSec) {
        lastSec = s
        if (settings.displayFormat === 'datetime') {
          setDate(
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
          )
        } else {
          setDate('')
        }
        setTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        )
      }
      animFrameId = requestAnimationFrame(update)
    }

    animFrameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animFrameId)
  }, [settings.displayFormat])

  // カウントダウン用ビープ音を再生（次の分の :00.000 に絶対スケジューリング）
  const playCountdownBeeps = (pitchBeep: number, pitchBell: number, bellDuration: number) => {
    try {
      const gainValue = settings.countdownVolume / 100
      const ctx = getBeepAudioCtx()

      // 次の分の :00.000 が AudioContext 時間で何秒後かを計算
      const now = new Date()
      const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
      const bellTime = ctx.currentTime + msToNextMinute / 1000

      // ピーンの 3, 2, 1 秒前と ピーン自体をスケジュール
      const offsets = [-3.0, -2.0, -1.0, 0.0]
      offsets.forEach((offset, i) => {
        const startTime = bellTime + offset
        if (startTime <= ctx.currentTime + 0.01) return // 過去の音はスキップ

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        const isLast = i === 3
        const freq = isLast ? pitchBell : pitchBeep
        const duration = isLast ? bellDuration : 0.15
        gain.gain.setValueAtTime(gainValue, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
        osc.frequency.value = freq
        osc.start(startTime)
        osc.stop(startTime + duration + 0.1)
      })
    } catch (e) {
      console.error('カウントダウンビープ再生エラー:', e)
    }
  }

  // カウントダウン用アナウンスを再生（ビープとは独立）
  const playCountdownAnnouncement = (text: string) => {
    try {
      if ((window as any).electronAPI.platform === 'linux') {
        ;(window as any).electronAPI.speakText(text)
      } else {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'ja-JP'
        utterance.rate = 1.2
        speechSynthesis.speak(utterance)
      }
    } catch (e) {
      console.error('アナウンス再生エラー:', e)
    }
  }

  // カウントダウンの優先種別を判定（上位優先）
  type CountdownType = 'hour' | '15min' | '5min' | '1min'
  const getCountdownType = (m: number): CountdownType | null => {
    if (settings.countdownEveryHour && m === 0) return 'hour'
    if (settings.countdownEvery15Min && m % 15 === 0) return '15min'
    if (settings.countdownEvery5Min && m % 5 === 0) return '5min'
    if (settings.countdownEveryMinute) return '1min'
    return null
  }

  // カウントダウン用AudioContextを再利用（毎回作成するとラグが発生するため）
  const beepAudioCtxRef = useRef<AudioContext | null>(null)
  const getBeepAudioCtx = (): AudioContext => {
    if (!beepAudioCtxRef.current || beepAudioCtxRef.current.state === 'closed') {
      beepAudioCtxRef.current = new AudioContext()
    }
    return beepAudioCtxRef.current
  }

  // カウントダウン チェック（100ms間隔で監視、重複防止にrefを使用）
  const lastBeepKey = useRef<string>('')
  const lastAnnounceKey = useRef<string>('')

  useEffect(() => {
    const check = () => {
      const now = new Date()
      const h = now.getHours()
      const m = now.getMinutes()
      const s = now.getSeconds()

      // 次の分の節目を確認（:57のピーンが次の分の:00に鳴るため）
      const nextM = (m + 1) % 60
      const nextH = m === 59 ? (h + 1) % 24 : h
      const type = getCountdownType(nextM)
      if (!type) return

      // アナウンス（:50〜:54の広いウィンドウでキャッチ）
      if (s >= 50 && s <= 54) {
        const key = `announce:${h}:${m}`
        if (lastAnnounceKey.current !== key) {
          lastAnnounceKey.current = key
          let text: string | null = null
          if (type === 'hour' && settings.countdownEveryHourAnnounce) {
            text = `まもなく${nextH}時です`
          } else if (type === '15min' && settings.countdownEvery15MinAnnounce) {
            text = `まもなく${nextM}分です`
          } else if (type === '5min' && settings.countdownEvery5MinAnnounce) {
            text = `まもなく${nextM}分です`
          }
          if (text) playCountdownAnnouncement(text)
        }
      }

      // ビープ（:54〜:59の広いウィンドウでキャッチ、絶対スケジューリングで :00 に正確に同期）
      if (s >= 54 && s <= 59) {
        const key = `beep:${h}:${m}`
        if (lastBeepKey.current !== key) {
          lastBeepKey.current = key
          if (type === 'hour')       playCountdownBeeps(1568, 2093, 1.2)
          else if (type === '15min') playCountdownBeeps(1319, 2093, 1.2)
          else if (type === '5min')  playCountdownBeeps(1047, 2093, 1.2)
          else if (type === '1min')  playCountdownBeeps(880, 1760, 0.8)
        }
      }
    }

    const timer = setInterval(check, 100)
    return () => clearInterval(timer)
  }, [settings.countdownEveryMinute, settings.countdownEvery5Min, settings.countdownEvery15Min,
      settings.countdownEveryHour, settings.countdownEvery5MinAnnounce,
      settings.countdownEvery15MinAnnounce, settings.countdownEveryHourAnnounce])

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
    // 発光強度0の場合はglow効果なし
    const intensity = settings.glowIntensity * 0.5; // 発光強度を半分に調整
    const glow = intensity > 0 
      ? `0 0 ${intensity * 1}px ${settings.glowColor}, 
         0 0 ${intensity * 2}px ${settings.glowColor}, 
         0 0 ${intensity * 3}px ${settings.glowColor},
         0 0 ${intensity * 5}px ${settings.glowColor}aa,
         0 0 ${intensity * 8}px ${settings.glowColor}66,
         0 1px 0 ${settings.glowColor}cc,
         1px 0 0 ${settings.glowColor}cc,
         0 -1px 0 ${settings.glowColor}cc,
         -1px 0 0 ${settings.glowColor}cc`
      : 'none'
    
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
    // 発光強度0の場合はglow効果なし
    const intensity = settings.glowIntensity * 0.5; // 発光強度を半分に調整
    const boxGlow = intensity > 0
        ? `0 0 ${intensity * 1}px ${settings.glowColor}, 
     0 0 ${intensity * 2}px ${settings.glowColor}, 
     0 0 ${intensity * 4}px ${settings.glowColor}aa,
     0 0 ${intensity * 6}px ${settings.glowColor}66,
     inset 0 0 ${intensity * 1}px ${settings.glowColor}33`
        : 'none'

    return {
        backgroundColor: settings.textColor, // 枠線の色
        padding: '3px', // これが枠線の太さになる
        boxShadow: boxGlow, // 発光効果
    }
  }

  const sizeMapping = settings.displayFormat === 'time' ? sizeMappingTime : sizeMappingDateTime
  const currentSizeSettings = sizeMapping[settings.size]

  return (
    <>
      <div className="relative w-full h-full draggable" style={{ backgroundColor: 'transparent' }}>
        {/* 時計＋ボタン部分 */}
        <div
          className="relative z-10 flex items-center justify-center h-full group"
        >
          {/* 時計本体 */}
          <div className="relative text-center w-full h-full">
            {/* ボタン：hover時に表示 - 時計の右上に配置（ウィンドウサイズが動的に調整される） */}
            <div className={`absolute top-2 right-2 flex gap-2 transition-opacity duration-500 no-drag z-30 ${isInitialDisplay ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {/* 設定ボタン */}
              <button
                onClick={handleSettings}
                className="flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white rounded-full shadow-lg"
                title="アプリ設定"
                style={{
                  width: `${currentSizeSettings.buttonSize.sub}px`,
                  height: `${currentSizeSettings.buttonSize.sub}px`
                }}
              >
                <svg
                  className="block"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{
                    width: `${currentSizeSettings.iconSize.sub}px`,
                    height: `${currentSizeSettings.iconSize.sub}px`
                  }}
                >
                  <path d="M19.43 12.98c.04-.32.07-.66.07-1s-.03-.68-.07-1l2.11-1.65a.5.5 0 0 0 .11-.66l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a8.12 8.12 0 0 0-1.73-.99L14.5 2.5a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0-.5.5l-.38 2.57a8.12 8.12 0 0 0-1.73.99l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .11.66l2.11 1.65c-.04.32-.07.66-.07 1s.03.68.07 1l-2.11 1.65a.5.5 0 0 0-.11.66l2 3.46a.5.5 0 0 0 .6.22l2.49-1c.54.4 1.12.73 1.73.99l.38 2.57a.5.5 0 0 0 .5.5h4c.28 0 .5-.22.5-.5l.38-2.57c.61-.26 1.19-.59 1.73-.99l2.49 1a.5.5 0 0 0 .6-.22l2-3.46a.5.5 0 0 0-.11-.66l-2.11-1.65zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z" />
                </svg>
              </button>

              {/* 終了ボタン */}
              <button
                onClick={handleClose}
                className="flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white rounded-full shadow-lg"
                title="終了"
                style={{
                  width: `${currentSizeSettings.buttonSize.sub}px`,
                  height: `${currentSizeSettings.buttonSize.sub}px`
                }}
              >
                <svg
                  className="block"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{
                    width: `${currentSizeSettings.iconSize.sub}px`,
                    height: `${currentSizeSettings.iconSize.sub}px`
                  }}
                >
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
              </button>
            </div>

            {/* アラーム追加ボタン：hover時に表示 - 時計の中央下に配置 */}
            <div className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 transition-opacity duration-500 no-drag z-30 ${isInitialDisplay ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <button
                onClick={handleAddAlarm}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-colors duration-200"
                title="アラーム追加"
                style={{
                  width: `${currentSizeSettings.buttonSize.main}px`,
                  height: `${currentSizeSettings.buttonSize.main}px`
                }}
              >
                <svg
                  className="block"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{
                    width: `${currentSizeSettings.iconSize.main}px`,
                    height: `${currentSizeSettings.iconSize.main}px`
                  }}
                >
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
              </button>
            </div>

            <div
              className="w-full h-full rounded-lg shadow-lg"
              style={getBoxStyle()}
            >
              <div
                className={`w-full h-full flex flex-col items-center justify-center rounded-lg ${getFontClass()}`}
                style={{ ...getBackgroundStyle(), ...getTextStyle() }}
              >
                {settings.displayFormat === 'datetime' && date && (
                  (() => {
                    const sizeMapping = sizeMappingDateTime;
                    const currentSizeSettings = sizeMapping[settings.size];
                    return (
                      <>
                        <div
                          style={{
                            fontSize: `${currentSizeSettings.fontSize.date}px`
                          }}
                          className={`${settings.size === 1 ? '' : 'mb-1'} select-none`}
                        >
                          {date}
                        </div>
                        <div
                          className={`${settings.size === 1 ? 'mt-0 mb-1' : 'my-1'} mx-auto w-5/6`}
                          style={{
                            borderColor: settings.textColor,
                            borderTopWidth: 1,
                            boxShadow: settings.glowIntensity > 0
                              ? `0 0 ${settings.glowIntensity * 1}px ${settings.glowColor}, 0 0 ${settings.glowIntensity * 3}px ${settings.glowColor}aa`
                              : `0 0 1px ${settings.glowColor}44`
                          }}
                        />
                      </>
                    )
                  })()
                )}
                <div
                  style={{
                    fontSize: `${currentSizeSettings.fontSize.time}px`
                  }}
                  className="select-none"
                >
                  {time}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* シンプルなアラーム通知 */}
        {alarmNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-drag">
            <div className="relative w-full h-full flex items-center justify-center">
              
              {/* ミニマルなアラーム通知 */}
              <div 
                className="relative rounded-xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700"
                style={{
                  width: `${currentSizeSettings.popup.width}px`,
                  padding: `${currentSizeSettings.popup.padding}px`,
                  backdropFilter: 'blur(20px)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)'
                }}
              >
                
                {/* isCompactPopupがtrueでない場合のみ、アラーム名と時刻を表示 */}
                {!(currentSizeSettings as any).isCompactPopup && (
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-3"
                       style={{ 
                         fontSize: `${currentSizeSettings.popup.nameSize}px`,
                         lineHeight: '1.2'
                       }}
                    >
                      {alarmNotification.name}
                    </p>
                    
                    <p className="font-mono font-light text-gray-900 dark:text-gray-100 mb-4"
                       style={{ fontSize: `${currentSizeSettings.popup.timeSize}px` }}
                    >
                      {String(alarmNotification.hour).padStart(2, '0')}:
                      {String(alarmNotification.minute).padStart(2, '0')}
                    </p>
                  </div>
                )}
                
                {/* シンプルなボタン */}
                <button
                  onClick={() => {
                    if (alarmTimeoutId) {
                      clearTimeout(alarmTimeoutId)
                      setAlarmTimeoutId(null)
                    }
                    stopAlarmAudio()
                    setAlarmNotification(null)
                  }}
                  className="w-full rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95"
                  style={{ 
                    padding: `${currentSizeSettings.popup.buttonPadding}px`,
                    fontSize: `${currentSizeSettings.popup.buttonFontSize}px`
                  }}
                >
                  OK
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