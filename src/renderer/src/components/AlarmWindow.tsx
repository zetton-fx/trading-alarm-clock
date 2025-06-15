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

  useEffect(() => {
    loadAlarmSettings()
  }, [loadAlarmSettings])

  // 音声再生の停止
  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
    }
  }

  // 音声プレビュー再生
  const playSound = (soundFile: string, volume: number) => {
    stopCurrentAudio() // 現在再生中の音声を停止
    
    try {
      const audio = new Audio(`/src/assets/sounds/${soundFile}`)
      audio.volume = volume / 100
      audio.play()
      setCurrentAudio(audio)
      
      // 再生終了時にstateをクリア
      audio.addEventListener('ended', () => {
        setCurrentAudio(null)
      })
    } catch (error) {
      console.error('音声ファイルの再生に失敗しました:', error)
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">アラーム管理</h1>

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

        {/* アラーム設定 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">アラーム設定</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  onClick={() => playSound(settings.globalAlarmSound, settings.globalVolume)}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center gap-1"
                  title="音を確認"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                  </svg>
                  確認
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
                表示時刻の何秒前に鳴らす: {settings.globalOffsetSeconds}秒
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

        {/* 先行アラーム設定 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">先行アラーム設定</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={settings.globalPreAlarmEnabled}
                  onChange={(e) => updateGlobalSettings({ globalPreAlarmEnabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">先行アラームを有効にする</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                何分前に鳴らす: {settings.globalPreAlarmMinutes}分
              </label>
              <input
                type="range"
                min="1"
                max="30"
                value={settings.globalPreAlarmMinutes}
                onChange={(e) => updateGlobalSettings({ globalPreAlarmMinutes: parseInt(e.target.value) })}
                className="w-full"
                disabled={!settings.globalPreAlarmEnabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                アラート音
              </label>
              <div className="flex gap-2">
                <select
                  value={settings.globalPreAlarmSound}
                  onChange={(e) => updateGlobalSettings({ globalPreAlarmSound: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!settings.globalPreAlarmEnabled}
                >
                  {alarmSounds.map((sound) => (
                    <option key={sound.value} value={sound.value}>
                      {sound.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => playSound(settings.globalPreAlarmSound, settings.globalPreAlarmVolume)}
                  disabled={!settings.globalPreAlarmEnabled}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-md transition-colors flex items-center gap-1"
                  title="音を確認"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                  </svg>
                  確認
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
                disabled={!settings.globalPreAlarmEnabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlarmWindow 