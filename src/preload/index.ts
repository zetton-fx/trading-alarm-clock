import { contextBridge, ipcRenderer } from 'electron'
import { AppSettings } from '../shared/types/settings'
import { AlarmSettings } from '../shared/types/alarm'

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
  },
  
  // アラーム設定関連
  loadAlarmSettings: (): Promise<AlarmSettings> => ipcRenderer.invoke('load-alarm-settings'),
  saveAlarmSettings: (settings: AlarmSettings): Promise<void> => ipcRenderer.invoke('save-alarm-settings', settings),
  
  // アラーム通知関連
  onAlarmTriggered: (callback: (alarmData: any) => void) => {
    ipcRenderer.on('alarm-triggered', (_, alarmData) => callback(alarmData))
  },
  onPreAlarmTriggered: (callback: (alarmData: any) => void) => {
    ipcRenderer.on('pre-alarm-triggered', (_, alarmData) => callback(alarmData))
  },
  
  // アセットファイル関連
  getAssetPath: (assetPath: string): Promise<string> => ipcRenderer.invoke('get-asset-path', assetPath),
  
  // デバッグ用
  testAlarmSound: (soundFile: string): Promise<void> => ipcRenderer.invoke('test-alarm-sound', soundFile),
  manualCheckAlarms: (): Promise<void> => ipcRenderer.invoke('manual-check-alarms')
}) 