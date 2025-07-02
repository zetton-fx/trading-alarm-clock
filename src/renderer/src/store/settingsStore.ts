import { create } from 'zustand'
import { AppSettings, defaultSettings } from '../../../shared/types/settings'

interface SettingsStore {
  // 状態
  settings: AppSettings
  isSettingsOpen: boolean
  isLoading: boolean
  
  // アクション
  setSettings: (settings: AppSettings) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  openSettings: () => void
  closeSettings: () => void
  loadSettings: () => Promise<void>
  saveSettings: (settings: AppSettings) => Promise<void>
  resetSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // 初期状態
  settings: defaultSettings,
  isSettingsOpen: false,
  isLoading: false,

  // アクション
  setSettings: (settings) => set({ settings }),
  
  updateSettings: (partial) => set((state) => ({
    settings: { ...state.settings, ...partial }
  })),
  
  openSettings: () => {
    console.log('openSettings アクションが呼ばれました')
    set({ isSettingsOpen: true })
    console.log('isSettingsOpen を true に設定しました')
  },
  
  closeSettings: () => set({ isSettingsOpen: false }),
  
  loadSettings: async () => {
    try {
      set({ isLoading: true })
      const loadedSettings = await window.electronAPI.loadSettings()
      // 古い設定ファイルとの互換性のため、デフォルト値でマージ
      const settings = { ...defaultSettings, ...loadedSettings }
      set({ settings, isLoading: false })
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error)
      set({ settings: defaultSettings, isLoading: false })
    }
  },
  
  saveSettings: async (settings) => {
    try {
      set({ isLoading: true })
      await window.electronAPI.saveSettings(settings)
      set({ settings, isLoading: false })
    } catch (error) {
      console.error('設定の保存に失敗しました:', error)
      set({ isLoading: false })
      throw error
    }
  },
  
  resetSettings: async () => {
    try {
      set({ isLoading: true })
      await window.electronAPI.saveSettings(defaultSettings)
      set({ settings: defaultSettings, isLoading: false })
    } catch (error) {
      console.error('設定のリセットに失敗しました:', error)
      set({ isLoading: false })
      throw error
    }
  }
})); 