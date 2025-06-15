import { AppSettings } from '../../shared/types/settings'
import { AlarmSettings } from '../../shared/types/alarm'

export interface ElectronAPI {
  platform: string
  closeApp: () => void
  openSettings: () => void
  openAlarmWindow: () => void
  loadSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<void>
  loadAlarmSettings: () => Promise<AlarmSettings>
  saveAlarmSettings: (settings: AlarmSettings) => Promise<void>
  onSettingsUpdated: (callback: (settings: AppSettings) => void) => void
  removeSettingsUpdatedListener: () => void
  expandWindowForButtons: () => void
  restoreWindowSize: () => void
  getAssetPath: (assetPath: string) => Promise<string>
}

declare global {
  interface Window {
    electronAPI: {
      platform: string
      closeApp: () => void
      openSettings: () => void
      openAlarmWindow: () => void
      loadSettings: () => Promise<AppSettings>
      saveSettings: (settings: AppSettings) => Promise<void>
      loadAlarmSettings: () => Promise<AlarmSettings>
      saveAlarmSettings: (settings: AlarmSettings) => Promise<void>
      onSettingsUpdated: (callback: (settings: AppSettings) => void) => void
      removeSettingsUpdatedListener: () => void
      expandWindowForButtons: () => void
      restoreWindowSize: () => void
      getAssetPath: (assetPath: string) => Promise<string>
    }
  }
} 