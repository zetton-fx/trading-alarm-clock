import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { AppSettings, defaultSettings, sizeMapping } from '../shared/types/settings'

// 設定ファイルのパス
const getSettingsPath = (): string => {
  return join(app.getPath('userData'), 'settings.json')
}

// 設定の読み込み
const loadSettings = async (): Promise<AppSettings> => {
  try {
    const settingsPath = getSettingsPath()
    const data = await fs.readFile(settingsPath, 'utf-8')
    const parsedSettings = JSON.parse(data)
    // デフォルト設定とマージして、新しいプロパティがあっても対応
    return { ...defaultSettings, ...parsedSettings }
  } catch (error) {
    console.log('設定ファイルが見つからないかエラーが発生しました。デフォルト設定を使用します:', error)
    return defaultSettings
  }
}

// 設定の保存
const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    const settingsPath = getSettingsPath()
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
    console.log('設定を保存しました:', settingsPath)
  } catch (error) {
    console.error('設定の保存に失敗しました:', error)
    throw error
  }
}

let mainWindow: BrowserWindow
let settingsWindow: BrowserWindow | null = null

async function createWindow(): Promise<void> {
  // 設定を読み込み
  const settings = await loadSettings()
  const { windowWidth, windowHeight } = sizeMapping[settings.size]

  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    resizable: true,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: settings.alwaysOnTop,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 開発モードではlocalhost、本番モードではファイルを読み込み
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // IPCハンドラーの設定
  ipcMain.on('app-close', () => {
    mainWindow.close()
  })

  ipcMain.on('open-settings', () => {
    createSettingsWindow()
  })

  // 設定の保存・読み込み
  ipcMain.handle('load-settings', async (): Promise<AppSettings> => {
    return await loadSettings()
  })

  ipcMain.handle('save-settings', async (_, settings: AppSettings): Promise<void> => {
    await saveSettings(settings)
    // 設定変更時にウィンドウサイズを更新
    const { windowWidth, windowHeight } = sizeMapping[settings.size]
    console.log(`ウィンドウサイズを変更: ${windowWidth}x${windowHeight} (サイズ設定: ${settings.size})`)
    
    // 現在のサイズを取得してログ出力
    const currentSize = mainWindow.getSize()
    console.log(`変更前のウィンドウサイズ: ${currentSize[0]}x${currentSize[1]}`)
    
    // ウィンドウサイズを変更
    mainWindow.setSize(windowWidth, windowHeight)
    
    // ウィンドウを中央に配置
    mainWindow.center()
    
    mainWindow.setAlwaysOnTop(settings.alwaysOnTop)
    
    // 変更後のサイズを確認
    const newSize = mainWindow.getSize()
    console.log(`変更後のウィンドウサイズ: ${newSize[0]}x${newSize[1]}`)
    
    // メインウィンドウに設定変更を通知
    mainWindow.webContents.send('settings-updated', settings)
  })
}

// 設定ウィンドウを作成
function createSettingsWindow(): void {
  // 既に設定ウィンドウが開いている場合はフォーカスする
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 700,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    parent: mainWindow,
    modal: true,
    title: '設定',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  settingsWindow.on('ready-to-show', () => {
    settingsWindow?.show()
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  // 設定ウィンドウは同じアプリを読み込むが、URLフラグメントで区別
  if (process.env.NODE_ENV === 'development') {
    settingsWindow.loadURL('http://localhost:5173/#settings')
  } else {
    settingsWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'settings' })
  }
}

// このメソッドは、Electronが初期化を終えて、ブラウザウィンドウを作成する準備ができたときに呼び出されます
app.whenReady().then(async () => {
  await createWindow()

  app.on('activate', async function () {
    // macOSでは、通常、アプリケーションのアイコンがクリックされたときにウィンドウが開いていない場合、
    // ウィンドウを再作成します
    if (BrowserWindow.getAllWindows().length === 0) await createWindow()
  })
})

// Windowsおよび Linuxではすべてのウィンドウが閉じられたときにアプリを終了します
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}) 