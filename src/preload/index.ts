import { contextBridge, ipcRenderer } from 'electron'
import { AppSettings } from '../shared/types/settings'

// プリロードスクリプト：セキュアな通信のために使用
contextBridge.exposeInMainWorld('electronAPI', {
  // 基本機能
  platform: process.platform,
  closeApp: () => ipcRenderer.send('app-close'),
  openSettings: () => ipcRenderer.send('open-settings'),
  openAlarmWindow: () => ipcRenderer.send('open-alarm-window'),
  
  // ウィンドウサイズ調整
  expandWindowForButtons: () => ipcRenderer.send('expand-window-for-buttons'),
  restoreWindowSize: () => ipcRenderer.send('restore-window-size'),
  
  // 設定関連
  loadSettings: (): Promise<AppSettings> => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: AppSettings): Promise<void> => ipcRenderer.invoke('save-settings', settings),
  onSettingsUpdated: (callback: (settings: AppSettings) => void) => {
    ipcRenderer.on('settings-updated', (_, settings) => callback(settings))
  },
  removeSettingsUpdatedListener: () => {
    ipcRenderer.removeAllListeners('settings-updated')
  }
}) 