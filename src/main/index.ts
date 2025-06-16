import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { AppSettings, defaultSettings, sizeMapping } from '../shared/types/settings'
import { AlarmSettings, defaultAlarmSettings } from '../shared/types/alarm'

// 設定ファイルのパス
const getSettingsPath = (): string => {
  return join(app.getPath('userData'), 'settings.json')
}

// アラーム設定ファイルのパス
const getAlarmSettingsPath = (): string => {
  return join(app.getPath('userData'), 'alarms.json')
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

// アラーム設定の読み込み
const loadAlarmSettings = async (): Promise<AlarmSettings> => {
  try {
    const alarmSettingsPath = getAlarmSettingsPath()
    const data = await fs.readFile(alarmSettingsPath, 'utf-8')
    const parsedSettings = JSON.parse(data)
    // デフォルト設定とマージして、新しいプロパティがあっても対応
    return { ...defaultAlarmSettings, ...parsedSettings }
  } catch (error) {
    console.log('アラーム設定ファイルが見つからないかエラーが発生しました。デフォルト設定を使用します:', error)
    return defaultAlarmSettings
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

// アラーム設定の保存
const saveAlarmSettings = async (settings: AlarmSettings): Promise<void> => {
  try {
    const alarmSettingsPath = getAlarmSettingsPath()
    await fs.writeFile(alarmSettingsPath, JSON.stringify(settings, null, 2), 'utf-8')
    console.log('アラーム設定を保存しました:', alarmSettingsPath)
  } catch (error) {
    console.error('アラーム設定の保存に失敗しました:', error)
    throw error
  }
}

let mainWindow: BrowserWindow
let settingsWindow: BrowserWindow | null = null
let alarmWindow: BrowserWindow | null = null

// Windows用タイトルバー非表示処理
const applyWindowsTitleBarHiding = (window: BrowserWindow, delay: number = 0): void => {
  if (process.platform !== 'win32') return
  
  window.setMenuBarVisibility(false)
  window.setAutoHideMenuBar(true)
  
  setTimeout(() => {
    window.webContents.executeJavaScript(`
      // Windows用のタイトルバー完全非表示
      document.documentElement.style.setProperty('--titlebar-height', '0px');
      document.body.style.paddingTop = '0px';
      
      // タイトルバー関連要素を強制非表示
      const titlebarElements = document.querySelectorAll('.titlebar, .window-controls-overlay, [data-titlebar]');
      titlebarElements.forEach(el => {
        el.style.display = 'none';
        el.style.height = '0px';
        el.style.visibility = 'hidden';
      });
      
      console.log('Windows: タイトルバー非表示設定を適用しました');
    `).catch(err => {
      console.error('タイトルバー非表示設定の適用に失敗:', err)
    })
  }, delay)
}

async function createWindow(): Promise<void> {
  // 設定を読み込み
  const settings = await loadSettings()
  const { windowWidth, windowHeight } = sizeMapping[settings.size]

  // メインウィンドウを作成
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: windowWidth,
    height: windowHeight,
    show: false,
    autoHideMenuBar: true,
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
  }

  // Windows特有の設定
  if (process.platform === 'win32') {
    windowOptions.titleBarStyle = 'hidden'
    windowOptions.titleBarOverlay = false
    // Windows でのタイトルバー完全非表示
    windowOptions.frame = false
    windowOptions.transparent = true
    // Windows特有の追加設定
    windowOptions.skipTaskbar = false
    windowOptions.minimizable = true
    windowOptions.maximizable = false
    windowOptions.closable = true
  } else {
    windowOptions.titleBarStyle = 'hiddenInset'
  }

  mainWindow = new BrowserWindow(windowOptions)

  // Windows でのタイトルバー非表示を確実にする
  if (process.platform === 'win32') {
    // DOM読み込み完了時に初回適用
    mainWindow.webContents.once('dom-ready', () => {
      applyWindowsTitleBarHiding(mainWindow, 0)
    })
    
    // ウィンドウフォーカス時にも設定を再適用
    mainWindow.on('focus', () => {
      applyWindowsTitleBarHiding(mainWindow, 0)
    })
    
    // ウィンドウリサイズ時にも設定を再適用
    mainWindow.on('resize', () => {
      applyWindowsTitleBarHiding(mainWindow, 50)
    })
    
    // ウィンドウ移動時にも設定を再適用
    mainWindow.on('moved', () => {
      if (process.platform === 'win32') {
        mainWindow.setMenuBarVisibility(false)
      }
    })
  }

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

  ipcMain.on('open-alarm-window', () => {
    createAlarmWindow()
  })

  // 設定の保存・読み込み
  ipcMain.handle('load-settings', async (): Promise<AppSettings> => {
    return await loadSettings()
  })

  ipcMain.handle('save-settings', async (_, settings: AppSettings): Promise<void> => {
    await saveSettings(settings)
    
    // 現在のサイズを取得
    const currentSize = mainWindow.getSize()
    const { windowWidth, windowHeight } = sizeMapping[settings.size]
    
    // サイズが実際に変更された場合のみsetSize()を実行
    const sizeChanged = currentSize[0] !== windowWidth || currentSize[1] !== windowHeight
    
    if (sizeChanged) {
      console.log(`ウィンドウサイズを変更: ${windowWidth}x${windowHeight} (サイズ設定: ${settings.size})`)
      console.log(`変更前のウィンドウサイズ: ${currentSize[0]}x${currentSize[1]}`)
      
      // ウィンドウサイズを変更
      mainWindow.setSize(windowWidth, windowHeight)
      
      // ウィンドウを中央に配置
      mainWindow.center()
      
      // 変更後のサイズを確認
      const newSize = mainWindow.getSize()
      console.log(`変更後のウィンドウサイズ: ${newSize[0]}x${newSize[1]}`)
      
      // サイズ変更時のみWindows特有の設定を再適用
      applyWindowsTitleBarHiding(mainWindow, 100)
    } else {
      console.log('ウィンドウサイズは変更されませんでした')
    }
    
    // alwaysOnTop設定は常に適用
    mainWindow.setAlwaysOnTop(settings.alwaysOnTop)
    
    // メインウィンドウに設定変更を通知
    mainWindow.webContents.send('settings-updated', settings)
  })

  // アラーム設定の保存・読み込み
  ipcMain.handle('load-alarm-settings', async (): Promise<AlarmSettings> => {
    return await loadAlarmSettings()
  })

  ipcMain.handle('save-alarm-settings', async (_, settings: AlarmSettings): Promise<void> => {
    await saveAlarmSettings(settings)
  })

  // アセットファイルのパスを取得
  ipcMain.handle('get-asset-path', (_, assetPath: string): string => {
    const path = require('path')
    const fs = require('fs')
    
    let fullPath: string
    if (process.env.NODE_ENV === 'development') {
      fullPath = path.join(__dirname, '../../src/assets', assetPath)
    } else {
      fullPath = path.join(process.resourcesPath, 'assets', assetPath)
    }
    
    console.log('要求されたアセットパス:', assetPath)
    console.log('解決されたフルパス:', fullPath)
    console.log('ファイルが存在するか:', fs.existsSync(fullPath))
    
    if (!fs.existsSync(fullPath)) {
      console.error('アセットファイルが見つかりません:', fullPath)
      // 代替パスを試してみる
      const alternativePath = path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'assets', assetPath)
      console.log('代替パスを試行:', alternativePath)
      if (fs.existsSync(alternativePath)) {
        console.log('代替パスでファイルを発見')
        return alternativePath
      }
    }
    
    return fullPath
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
    height: 800,
    minWidth: 600,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    resizable: true,
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

// アラームウィンドウを作成
function createAlarmWindow(): void {
  // 既にアラームウィンドウが開いている場合はフォーカスする
  if (alarmWindow) {
    alarmWindow.focus()
    return
  }

  alarmWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    resizable: true,
    parent: mainWindow,
    modal: false,
    title: 'アラーム管理',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  alarmWindow.on('ready-to-show', () => {
    alarmWindow?.show()
  })

  alarmWindow.on('closed', () => {
    alarmWindow = null
  })

  // アラームウィンドウは同じアプリを読み込むが、URLフラグメントで区別
  if (process.env.NODE_ENV === 'development') {
    alarmWindow.loadURL('http://localhost:5173/#alarm')
  } else {
    alarmWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'alarm' })
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