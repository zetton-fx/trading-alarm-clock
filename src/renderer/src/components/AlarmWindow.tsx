import React, { useEffect, useState } from 'react'
import { useAlarmStore } from '../store/alarmStore'
import { AlarmItem } from '../../../shared/types/alarm'
import { alarmSounds } from '../../../shared/types/alarm'

function AlarmWindow() {
  const {
    settings,
    loadAlarmSettings,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    deleteAllAlarms,
    updateGlobalSettings,
    getSortedAlarms
  } = useAlarmStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newAlarmName, setNewAlarmName] = useState('')
  const [newAlarmHour, setNewAlarmHour] = useState(12)
  const [newAlarmMinute, setNewAlarmMinute] = useState(0)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [currentAudioType, setCurrentAudioType] = useState<'alarm' | 'preAlarm' | null>(null)

  useEffect(() => {
    loadAlarmSettings()
  }, [loadAlarmSettings])

  // 音声再生の停止
  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
      setCurrentAudioType(null)
    }
  }

  // 音声プレビュー再生
  const playSound = async (soundFile: string, volume: number, audioType: 'alarm' | 'preAlarm') => {
    stopCurrentAudio() // 現在再生中の音声を停止
    
    try {
      let audioUrl: string
      
      // 開発時はViteの開発サーバーから、本番時はfile://プロトコルを使用
      if (window.location.hostname === 'localhost') {
        audioUrl = `/sounds/${soundFile}`
        console.log('開発環境 - 音声URL:', audioUrl)
      } else {
        const assetPath = await window.electronAPI.getAssetPath(`sounds/${soundFile}`)
        audioUrl = `file:///${assetPath.replace(/\\/g, '/')}`
        console.log('本番環境 - アセットパス:', assetPath)
        console.log('本番環境 - 音声URL:', audioUrl)
      }
      
      const audio = new Audio(audioUrl)
      audio.volume = volume / 100
      
      // 音声読み込み失敗時のイベント
      audio.addEventListener('error', (e) => {
        console.error('音声ファイルの読み込みエラー:', e)
        console.error('音声URL:', audioUrl)
      })
      
      // 再生終了時にstateをクリア
      audio.addEventListener('ended', () => {
        setCurrentAudio(null)
        setCurrentAudioType(null)
      })
      
      // 再生開始前にstateを設定
      setCurrentAudio(audio)
      setCurrentAudioType(audioType)
      console.log('ボタン状態を更新:', audioType)
      
      await audio.play()
      console.log('音声再生開始:', audioUrl)
      
    } catch (error) {
      console.error('音声ファイルの再生に失敗しました:', error)
      console.error('soundFile:', soundFile)
      console.error('audioType:', audioType)
      // エラー時はstateをリセット
      setCurrentAudio(null)
      setCurrentAudioType(null)
    }
  }

  // コンポーネントのアンマウント時に音声を停止
  useEffect(() => {
    return () => {
      stopCurrentAudio()
    }
  }, [])

  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  const handleAddAlarm = () => {
    const alarmName = newAlarmName.trim() || `${String(newAlarmHour).padStart(2, '0')}:${String(newAlarmMinute).padStart(2, '0')}`
    
    addAlarm({
      name: alarmName,
      hour: newAlarmHour,
      minute: newAlarmMinute,
      enabled: true,
      preAlarmEnabled: false
    })
    
    setNewAlarmName('')
    setNewAlarmHour(12)
    setNewAlarmMinute(0)
    setShowAddForm(false)
  }

  const handleToggleAlarm = (id: string, enabled: boolean) => {
    updateAlarm(id, { enabled })
  }

  const handleTogglePreAlarm = (id: string, preAlarmEnabled: boolean) => {
    updateAlarm(id, { preAlarmEnabled })
  }

  const sortedAlarms = getSortedAlarms()

  return (
    <div 
      className="h-screen bg-gray-100 flex flex-col"
      onClick={(e) => {
        // ボタン以外をクリックした場合は音声を停止
        if (currentAudio && !(e.target as HTMLElement).closest('button')) {
          stopCurrentAudio()
        }
      }}
    >
      {/* ヘッダー */}
      <div className="flex-shrink-0 p-6 pb-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800">アラーム管理</h1>
        </div>
      </div>

      {/* スクロール可能なアラーム一覧エリア */}
      <div className="flex-1 overflow-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* アラーム一覧 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">アラーム一覧</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                >
                  アラーム追加
                </button>
                <button
                  onClick={deleteAllAlarms}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                  disabled={sortedAlarms.length === 0}
                >
                  全て削除
                </button>
              </div>
            </div>

            {/* アラーム追加フォーム */}
            {showAddForm && (
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      時
                    </label>
                    <select
                      value={newAlarmHour}
                      onChange={(e) => setNewAlarmHour(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      分
                    </label>
                    <select
                      value={newAlarmMinute}
                      onChange={(e) => setNewAlarmMinute(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      アラーム名（任意）
                    </label>
                    <input
                      type="text"
                      value={newAlarmName}
                      onChange={(e) => setNewAlarmName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="アラーム名を入力"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleAddAlarm}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors min-w-[80px]"
                  >
                    追加
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors min-w-[100px]"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* アラームアイテム */}
            <div className="space-y-3">
              {sortedAlarms.length === 0 ? (
                <p className="text-gray-500 text-center py-8">アラームが設定されていません</p>
              ) : (
                sortedAlarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="text-2xl font-mono font-bold text-blue-600 min-w-[80px]">
                      {formatTime(alarm.hour, alarm.minute)}
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-800 font-medium">{alarm.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={alarm.preAlarmEnabled}
                          onChange={(e) => handleTogglePreAlarm(alarm.id, e.target.checked)}
                          className="w-4 h-4"
                        />
                        先行アラーム
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={alarm.enabled}
                          onChange={(e) => handleToggleAlarm(alarm.id, e.target.checked)}
                          className="w-4 h-4"
                        />
                        アラーム
                      </label>
                    </div>
                    <button
                      onClick={() => deleteAlarm(alarm.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="削除"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 固定表示される設定エリア */}
      <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200">
        <div className="px-6 py-4 overflow-auto">
          <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 先行アラーム設定 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">先行アラーム設定</h2>
                <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        アラート音
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={settings.globalPreAlarmSound}
                          onChange={(e) => updateGlobalSettings({ globalPreAlarmSound: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {alarmSounds.map((sound) => (
                            <option key={sound.value} value={sound.value}>
                              {sound.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            if (currentAudio && currentAudioType === 'preAlarm') {
                              stopCurrentAudio()
                            } else {
                              playSound(settings.globalPreAlarmSound, settings.globalPreAlarmVolume, 'preAlarm')
                            }
                          }}
                          className={`px-3 py-2 ${(currentAudio && currentAudioType === 'preAlarm') ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md transition-colors flex items-center gap-1`}
                          title={(currentAudio && currentAudioType === 'preAlarm') ? "音を停止" : "音を確認"}
                        >
                          {(currentAudio && currentAudioType === 'preAlarm') ? (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6,6H18V18H6V6Z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                            </svg>
                          )}
                          {(currentAudio && currentAudioType === 'preAlarm') ? '停止' : '確認'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ボリューム: {settings.globalPreAlarmVolume}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.globalPreAlarmVolume}
                        onChange={(e) => updateGlobalSettings({ globalPreAlarmVolume: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="relative group">
                          <span className="cursor-help border-b border-dotted border-gray-400">
                            アラーム設定時刻の何分前に鳴らす: {settings.globalPreAlarmMinutes}分
                          </span>
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none w-72 z-10">
                            先行アラームは事前準備のための機能です。<br />
                            例: 21:30の指標なら21:20に先行アラームで<br />
                            「もうすぐ指標です」と通知し、準備時間を確保。<br />
                            21:30に本アラームで「指標が発表」を通知します。
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={settings.globalPreAlarmMinutes}
                        onChange={(e) => updateGlobalSettings({ globalPreAlarmMinutes: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                </div>
              </div>

              {/* アラーム設定 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">アラーム設定</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      アラート音
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={settings.globalAlarmSound}
                        onChange={(e) => updateGlobalSettings({ globalAlarmSound: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {alarmSounds.map((sound) => (
                          <option key={sound.value} value={sound.value}>
                            {sound.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (currentAudio && currentAudioType === 'alarm') {
                            stopCurrentAudio()
                          } else {
                            playSound(settings.globalAlarmSound, settings.globalVolume, 'alarm')
                          }
                        }}
                        className={`px-3 py-2 ${currentAudio && currentAudioType === 'alarm' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md transition-colors flex items-center gap-1`}
                        title={currentAudio && currentAudioType === 'alarm' ? "音を停止" : "音を確認"}
                      >
                        {currentAudio && currentAudioType === 'alarm' ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6,6H18V18H6V6Z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                          </svg>
                        )}
                        {currentAudio && currentAudioType === 'alarm' ? '停止' : '確認'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ボリューム: {settings.globalVolume}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.globalVolume}
                      onChange={(e) => updateGlobalSettings({ globalVolume: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="relative group">
                        <span className="cursor-help border-b border-dotted border-gray-400">
                          アラーム設定時刻の何秒前に鳴らす: {settings.globalOffsetSeconds}秒
                        </span>
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none w-64 z-10">
                          アラーム音を鳴らすタイミングを調整します。<br />
                          設定時刻より少し早めに鳴らすことで、<br />
                          正確な時刻に行動を開始できます。
                          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={settings.globalOffsetSeconds}
                      onChange={(e) => updateGlobalSettings({ globalOffsetSeconds: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlarmWindow 