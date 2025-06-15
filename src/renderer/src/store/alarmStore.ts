import { create } from 'zustand'
import { AlarmItem, AlarmSettings, defaultAlarmSettings } from '../../../shared/types/alarm'

interface AlarmStore {
  settings: AlarmSettings
  isAlarmWindowOpen: boolean
  loadAlarmSettings: () => Promise<void>
  saveAlarmSettings: () => Promise<void>
  addAlarm: (alarm: Omit<AlarmItem, 'id'>) => void
  updateAlarm: (id: string, updates: Partial<AlarmItem>) => void
  deleteAlarm: (id: string) => void
  deleteAllAlarms: () => void
  updateGlobalSettings: (updates: Partial<Omit<AlarmSettings, 'alarms'>>) => void
  setAlarmWindowOpen: (open: boolean) => void
  getSortedAlarms: () => AlarmItem[]
}

export const useAlarmStore = create<AlarmStore>((set, get) => ({
  settings: defaultAlarmSettings,
  isAlarmWindowOpen: false,

  loadAlarmSettings: async () => {
    try {
      const loadedSettings = await window.electronAPI.loadAlarmSettings()
      set({ settings: loadedSettings })
    } catch (error) {
      console.error('アラーム設定の読み込みに失敗しました:', error)
      set({ settings: defaultAlarmSettings })
    }
  },

  saveAlarmSettings: async () => {
    try {
      const { settings } = get()
      await window.electronAPI.saveAlarmSettings(settings)
    } catch (error) {
      console.error('アラーム設定の保存に失敗しました:', error)
    }
  },

  addAlarm: (alarm) => {
    const { settings } = get()
    const newAlarm: AlarmItem = {
      ...alarm,
      id: `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    set({
      settings: {
        ...settings,
        alarms: [...settings.alarms, newAlarm]
      }
    })
    
    get().saveAlarmSettings()
  },

  updateAlarm: (id, updates) => {
    const { settings } = get()
    const updatedAlarms = settings.alarms.map(alarm =>
      alarm.id === id ? { ...alarm, ...updates } : alarm
    )
    
    set({
      settings: {
        ...settings,
        alarms: updatedAlarms
      }
    })
    
    get().saveAlarmSettings()
  },

  deleteAlarm: (id) => {
    const { settings } = get()
    const filteredAlarms = settings.alarms.filter(alarm => alarm.id !== id)
    
    set({
      settings: {
        ...settings,
        alarms: filteredAlarms
      }
    })
    
    get().saveAlarmSettings()
  },

  deleteAllAlarms: () => {
    const { settings } = get()
    set({
      settings: {
        ...settings,
        alarms: []
      }
    })
    
    get().saveAlarmSettings()
  },

  updateGlobalSettings: (updates) => {
    const { settings } = get()
    set({
      settings: {
        ...settings,
        ...updates
      }
    })
    
    get().saveAlarmSettings()
  },

  setAlarmWindowOpen: (open) => {
    set({ isAlarmWindowOpen: open })
  },

  getSortedAlarms: () => {
    const { settings } = get()
    
    // 朝6時を基準にソート (6:00 -> 次の日の5:59)
    return [...settings.alarms].sort((a, b) => {
      const getMinutesFrom6AM = (hour: number, minute: number) => {
        let adjustedHour = hour
        if (hour < 6) {
          adjustedHour += 24 // 翌日扱い
        }
        return (adjustedHour - 6) * 60 + minute
      }
      
      const aMinutes = getMinutesFrom6AM(a.hour, a.minute)
      const bMinutes = getMinutesFrom6AM(b.hour, b.minute)
      
      return aMinutes - bMinutes
    })
  }
})) 