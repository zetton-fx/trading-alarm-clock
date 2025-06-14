export interface ElectronAPI {
  platform: string
  closeApp: () => void
  openSettings: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
} 