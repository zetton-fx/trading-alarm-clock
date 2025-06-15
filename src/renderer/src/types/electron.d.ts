import { AppSettings } from '../../shared/types/settings'

export interface ElectronAPI {
  platform: string
  closeApp: () => void
  openSettings: () => void
  openAlarmWindow: () => void
  loadSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<void>
  onSettingsUpdated: (callback: (settings: AppSettings) => void) => void
  removeSettingsUpdatedListener: () => void
  expandWindowForButtons: () => void
  restoreWindowSize: () => void
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
      onSettingsUpdated: (callback: (settings: AppSettings) => void) => void
      removeSettingsUpdatedListener: () => void
      expandWindowForButtons: () => void
      restoreWindowSize: () => void
    }
  }
} 