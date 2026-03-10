import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { AppSettings } from '../shared/types/settings'
import { AlarmSettings, AlarmItem } from '../shared/types/alarm'

// プリロードスクリプト：セキュアな通信のために使用
const api = {
  // 基本機能
  platform: process.platform,
  closeApp: () => ipcRenderer.send('app-close'),
  openSettings: () => ipcRenderer.send('open-settings'),
  openAlarmWindow: () => ipcRenderer.send('open-alarm-window'),
  
  // 設定関連
  loadSettings: (): Promise<AppSettings> => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: AppSettings): Promise<void> => ipcRenderer.invoke('save-settings', settings),
  onSettingsUpdated: (callback: (settings: AppSettings) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, settings: AppSettings) => callback(settings)
    ipcRenderer.on('settings-updated', handler)
    // リスナーを削除する関数を返す
    return () => {
      ipcRenderer.removeListener('settings-updated', handler)
    }
  },
  removeSettingsUpdatedListener: () => {
    ipcRenderer.removeAllListeners('settings-updated')
  },
  
  // アラーム設定関連
  loadAlarmSettings: (): Promise<AlarmSettings> => ipcRenderer.invoke('load-alarm-settings'),
  saveAlarmSettings: (settings: AlarmSettings): Promise<void> =>
    ipcRenderer.invoke('save-alarm-settings', settings),
  onAlarmSettingsUpdated: (callback: (settings: AlarmSettings) => void) => {
    ipcRenderer.on('alarm-settings-updated', (_, settings) => callback(settings))
  },
  removeAlarmSettingsUpdatedListener: () => {
    ipcRenderer.removeAllListeners('alarm-settings-updated')
  },
  
  // アラーム通知関連
  onAlarmTriggered: (callback: (alarm: any) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, alarm: any) => callback(alarm)
    ipcRenderer.on('alarm-triggered', handler)
    // リスナーを削除する関数を返す
    return () => {
      ipcRenderer.removeListener('alarm-triggered', handler)
    }
  },
  onPreAlarmTriggered: (callback: (alarm: any) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, alarm: any) => callback(alarm)
    ipcRenderer.on('pre-alarm-triggered', handler)
    // リスナーを削除する関数を返す
    return () => {
      ipcRenderer.removeListener('pre-alarm-triggered', handler)
    }
  },
  
  // アセットファイル関連
  getAssetPath: (assetPath: string): Promise<string> =>
    ipcRenderer.invoke('get-asset-path', assetPath),
  
  // デバッグ用関数
  debugGetMemorySettings: (): Promise<any> => ipcRenderer.invoke('debug-get-memory-settings'),
  debugGetMemoryAlarmSettings: (): Promise<any> => ipcRenderer.invoke('debug-get-memory-alarm-settings'),
  
  // 設定リセット
  deleteAllSettings: (): Promise<void> => ipcRenderer.invoke('delete-all-settings'),

  // コンテキストメニュー表示
  showContextMenu: (): void => ipcRenderer.send('show-context-menu'),

  // 音声アナウンス（espeak-ng経由）
  speakText: (text: string): void => ipcRenderer.send('speak-text', text)
}

contextBridge.exposeInMainWorld('electronAPI', api) 