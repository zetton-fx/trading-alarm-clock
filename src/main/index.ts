import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { AppSettings, defaultSettings, sizeMappingDateTime, sizeMappingTime } from '../shared/types/settings'
import { AlarmSettings, defaultAlarmSettings, AlarmItem } from '../shared/types/alarm'

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
    console.log('設定ファイルを読み込みました:', settingsPath)
    // デフォルト設定とマージして、新しいプロパティがあっても対応
    return { ...defaultSettings, ...parsedSettings }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('初回起動：設定ファイルを作成します')
      // 初回起動時に設定ファイルを作成
      await saveSettings(defaultSettings)
      return defaultSettings
    } else {
      console.log('設定ファイルの読み込み中にエラーが発生しました。デフォルト設定を使用します:', error.message)
      return defaultSettings
    }
  }
}

// アラーム設定の読み込み
const loadAlarmSettings = async (): Promise<AlarmSettings> => {
  try {
    const alarmSettingsPath = getAlarmSettingsPath()
    const data = await fs.readFile(alarmSettingsPath, 'utf-8')
    const parsedSettings = JSON.parse(data)
    console.log('アラーム設定ファイルを読み込みました:', alarmSettingsPath)
    // デフォルト設定とマージして、新しいプロパティがあっても対応
    return { ...defaultAlarmSettings, ...parsedSettings }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('初回起動：アラーム設定ファイルを作成します')
      // 初回起動時にアラーム設定ファイルを作成
      await saveAlarmSettings(defaultAlarmSettings)
      return defaultAlarmSettings
    } else {
      console.log('アラーム設定ファイルの読み込み中にエラーが発生しました。デフォルト設定を使用します:', error.message)
      return defaultAlarmSettings
    }
  }
}

// 設定の保存
const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    const settingsPath = getSettingsPath()
    
    // ディレクトリが存在しない場合は作成
    const path = require('path')
    const settingsDir = path.dirname(settingsPath)
    await fs.mkdir(settingsDir, { recursive: true })
    
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
    
    // ディレクトリが存在しない場合は作成
    const path = require('path')
    const settingsDir = path.dirname(alarmSettingsPath)
    await fs.mkdir(settingsDir, { recursive: true })
    
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

// アラーム関連の変数
let alarmCheckInterval: NodeJS.Timeout | null = null
let activeAlarms: Set<string> = new Set() // 現在鳴っているアラーム
let recentAlarms: Map<string, number> = new Map() // 最近鳴ったアラーム（重複防止）
let cachedAlarmSettings: AlarmSettings | null = null // メモリにロードされたアラーム設定
let cachedSettings: AppSettings | null = null // メモリにロードされたメイン設定

// アラーム設定をメモリから取得（必ずメモリにロードされている前提）
const getAlarmSettings = (): AlarmSettings => {
  if (!cachedAlarmSettings) {
    throw new Error('アラーム設定がメモリにロードされていません。アプリケーションの初期化エラーです。')
  }
  return cachedAlarmSettings
}

// アラーム設定をメモリに強制ロード
const loadAlarmSettingsToMemory = async (): Promise<void> => {
  try {
    cachedAlarmSettings = await loadAlarmSettings()
    console.log('アラーム設定をメモリにロードしました:', cachedAlarmSettings)
  } catch (error) {
    console.error('アラーム設定のメモリロードに失敗:', error)
    cachedAlarmSettings = defaultAlarmSettings
    console.log('デフォルトアラーム設定をメモリにロードしました')
  }
}

// アラーム設定をメモリに再ロード（設定変更時に呼び出す）
const reloadAlarmSettingsToMemory = async (): Promise<void> => {
  await loadAlarmSettingsToMemory()
  console.log('アラーム設定をメモリに再ロードしました')
}

// メイン設定をメモリから取得（必ずメモリにロードされている前提）
const getSettings = (): AppSettings => {
  if (!cachedSettings) {
    throw new Error('メイン設定がメモリにロードされていません。アプリケーションの初期化エラーです。')
  }
  return cachedSettings
}

// メイン設定をメモリに強制ロード
const loadSettingsToMemory = async (): Promise<void> => {
  try {
    cachedSettings = await loadSettings()
    console.log('メイン設定をメモリにロードしました:', cachedSettings)
  } catch (error) {
    console.error('メイン設定のメモリロードに失敗:', error)
    cachedSettings = defaultSettings
    console.log('デフォルトメイン設定をメモリにロードしました')
  }
}

// メイン設定をメモリに再ロード（設定変更時に呼び出す）
const reloadSettingsToMemory = async (): Promise<void> => {
  await loadSettingsToMemory()
  console.log('メイン設定をメモリに再ロードしました')
}

// アラームチェック停止（先に宣言）
const stopAlarmCheck = (): void => {
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval)
    alarmCheckInterval = null
    console.log('アラームチェック停止')
  }
  
  // アクティブなアラームもクリア
  activeAlarms.clear()
  console.log('アクティブアラームをクリア')
}

// Windows用タイトルバー非表示処理
const applyWindowsTitleBarHiding = (window: BrowserWindow, delay: number = 0): void => {
  if (process.platform !== 'win32') return
  
  // ウィンドウレベルでの設定
  window.setMenuBarVisibility(false)
  window.setAutoHideMenuBar(true)
  
  // より強力な設定を追加
  try {
    // @ts-ignore - Windows特有のAPIを使用
    if (window.setTitleBarOverlay) {
      window.setTitleBarOverlay({ color: '#00000000', symbolColor: '#00000000', height: 0 })
    }
  } catch (e) {
    // 無視
  }
  
  setTimeout(() => {
    window.webContents.executeJavaScript(`
      // Windows用のタイトルバー完全非表示
      document.documentElement.style.setProperty('--titlebar-height', '0px');
      document.body.style.paddingTop = '0px';
      document.body.style.marginTop = '0px';
      
      // より包括的なタイトルバー関連要素を検索
      const titlebarSelectors = [
        '.titlebar', 
        '.window-controls-overlay', 
        '[data-titlebar]',
        '.electron-titlebar',
        '.window-titlebar',
        '.app-titlebar',
        'header[role="banner"]',
        '.chrome-tabs',
        '.tab-strip'
      ];
      
      titlebarSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.style.display = 'none !important';
          el.style.height = '0px !important';
          el.style.visibility = 'hidden !important';
          el.style.opacity = '0 !important';
          el.style.position = 'absolute !important';
          el.style.top = '-9999px !important';
          el.style.left = '-9999px !important';
        });
      });
      
      // CSSでも強制的に非表示
      const style = document.createElement('style');
      style.textContent = \`
        .titlebar, .window-controls-overlay, [data-titlebar], .electron-titlebar {
          display: none !important;
          height: 0 !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
        
        body {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
        
        html {
          --titlebar-height: 0px !important;
        }
      \`;
      document.head.appendChild(style);
      
      console.log('Windows: 強化されたタイトルバー非表示設定を適用しました');
    `).catch(err => {
      console.error('タイトルバー非表示設定の適用に失敗:', err)
    })
  }, delay)
}

async function createWindow(): Promise<void> {
  // メモリにロードされた設定を取得
  const settings = getSettings()
  const sizeMapping = settings.displayFormat === 'time' ? sizeMappingTime : sizeMappingDateTime
  const { windowWidth, windowHeight } = sizeMapping[settings.size]

  // メインウィンドウを作成
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: windowWidth,
    height: windowHeight,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: settings.alwaysOnTop,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // 音声再生のためにwebSecurityを無効化
      allowRunningInsecureContent: true,
      experimentalFeatures: true
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

  // Windows でのタイトルバー非表示を即座に適用（DOM読み込み前）
  if (process.platform === 'win32') {
    applyWindowsTitleBarHiding(mainWindow, 0)
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // メインウィンドウが閉じられる前の処理
  mainWindow.on('close', () => {
    console.log('メインウィンドウが閉じられています')
    stopAlarmCheck()
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
    console.log('アプリ終了要求を受信')
    stopAlarmCheck()
    mainWindow.close()
  })

  ipcMain.on('open-settings', () => {
    createSettingsWindow()
  })

  ipcMain.on('open-alarm-window', () => {
    createAlarmWindow()
  })

  // ウィンドウ位置を動かすためのIPCハンドラ
  ipcMain.on('set-window-position', (_, { x, y }: { x: number; y: number }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setPosition(x, y)
    }
  })

  // ウィンドウ位置を取得するためのIPCハンドラ
  ipcMain.handle('get-window-position', (): { x: number; y: number } | null => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [x, y] = mainWindow.getPosition()
      return { x, y }
    }
    return null
  })

  // 設定の保存・読み込み
  ipcMain.handle('load-settings', async (): Promise<AppSettings> => {
    return getSettings()
  })

  ipcMain.handle('save-settings', async (_, settings: AppSettings): Promise<void> => {
    await saveSettings(settings)
    await reloadSettingsToMemory() // 設定変更時にメモリに再ロード
    
    // 現在のサイズを取得
    const currentSize = mainWindow.getSize()
    const sizeMapping = settings.displayFormat === 'time' ? sizeMappingTime : sizeMappingDateTime
    const { windowWidth, windowHeight } = sizeMapping[settings.size]
    
    // ウィンドウサイズを変更する前に Windows で最大化状態なら解除
    if (process.platform === 'win32' && mainWindow.isMaximized()) {
      console.log('Windows: ウィンドウが最大化状態のため unmaximize() を実行します')
      mainWindow.unmaximize()
    }

    // ウィンドウサイズを固定し、リサイズ不可に設定
    mainWindow.setMinimumSize(windowWidth, windowHeight)
    mainWindow.setMaximumSize(windowWidth, windowHeight)

    // ウィンドウサイズを変更
    // Windows では setBounds の方が確実に反映されるケースがある
    if (process.platform === 'win32') {
      mainWindow.setBounds({ width: windowWidth, height: windowHeight })
    } else {
      mainWindow.setSize(windowWidth, windowHeight)
    }

    // 変更後に resizable を false に設定（念のため）
    mainWindow.setResizable(false)

    // ウィンドウを中央に配置
    mainWindow.center()
    
    // 変更後のサイズを確認
    const newSize = mainWindow.getSize()
    console.log(`変更後のウィンドウサイズ: ${newSize[0]}x${newSize[1]}`)
    
    // alwaysOnTop設定は常に適用
    mainWindow.setAlwaysOnTop(settings.alwaysOnTop)
    
    // Windows特有の設定を強制的に再適用（全ての設定変更時）
    if (process.platform === 'win32') {
      console.log('Windows: タイトルバー非表示設定を強制再適用します')
      
      // 複数回、異なるタイミングで適用して確実にする
      applyWindowsTitleBarHiding(mainWindow, 0)   // 即座に
      applyWindowsTitleBarHiding(mainWindow, 50)  // 50ms後
      applyWindowsTitleBarHiding(mainWindow, 150) // 150ms後
      applyWindowsTitleBarHiding(mainWindow, 300) // 300ms後
      applyWindowsTitleBarHiding(mainWindow, 1000) // 1000ms後
      applyWindowsTitleBarHiding(mainWindow, 5000) // 5000ms後
      
      // さらに強力な方法：ウィンドウの再描画を強制
      setTimeout(() => {
        mainWindow.webContents.executeJavaScript(`
          // 強制的にウィンドウを再描画
          document.body.style.display = 'none';
          document.body.offsetHeight; // リフロー強制
          document.body.style.display = '';
          
          // タイトルバー関連要素を再度強制非表示
          const titlebarElements = document.querySelectorAll('.titlebar, .window-controls-overlay, [data-titlebar], .electron-titlebar');
          titlebarElements.forEach(el => {
            el.style.display = 'none !important';
            el.style.height = '0px !important';
            el.style.visibility = 'hidden !important';
            el.style.opacity = '0 !important';
            el.remove(); // 完全に削除
          });
          
          console.log('Windows: 強制再描画とタイトルバー削除を実行しました');
        `).catch(err => {
          console.error('強制再描画の実行に失敗:', err)
        })
      }, 100)
    }
    
    // メインウィンドウに設定変更を通知
    mainWindow.webContents.send('settings-updated', settings)
  })

  // アラーム設定の保存・読み込み
  ipcMain.handle('load-alarm-settings', async (): Promise<AlarmSettings> => {
    return getAlarmSettings()
  })

  ipcMain.handle('save-alarm-settings', async (_, settings: AlarmSettings): Promise<void> => {
    await saveAlarmSettings(settings)
    await reloadAlarmSettingsToMemory() // 設定変更時にメモリに再ロード
    
    // 全てのウィンドウにアラーム設定更新を通知
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('alarm-settings-updated', settings)
    }
    if (alarmWindow && !alarmWindow.isDestroyed()) {
      alarmWindow.webContents.send('alarm-settings-updated', settings)
    }
  })

  // デバッグ用：メモリ上の設定を取得
  ipcMain.handle('debug-get-memory-settings', (): AppSettings | null => {
    return cachedSettings
  })

  ipcMain.handle('debug-get-memory-alarm-settings', (): AlarmSettings | null => {
    return cachedAlarmSettings
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

// アラーム音の再生（メインプロセス）


// アラームの時間チェック
const checkAlarms = async (): Promise<void> => {
  try {
    // メインウィンドウが破棄されている場合はチェックを停止
    if (!mainWindow || mainWindow.isDestroyed()) {
      stopAlarmCheck()
      return
    }

    // メモリにロードされたアラーム設定を使用
    const alarmSettings = getAlarmSettings()
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentSeconds = now.getSeconds()
    const currentTime = now.getTime()
    
    for (const alarm of alarmSettings.alarms) {
      try {
        if (!alarm.enabled) continue
        
        const alarmKey = `${alarm.id}_${alarm.hour}_${alarm.minute}`
      
      // 先行アラームのチェック
      if (alarm.preAlarmEnabled) {
        const preAlarmTime = new Date()
        preAlarmTime.setHours(alarm.hour, alarm.minute - alarmSettings.globalPreAlarmMinutes, 0, 0)
        
        const preAlarmKey = `pre_${alarmKey}`
        const preAlarmHour = preAlarmTime.getHours()
        const preAlarmMinute = preAlarmTime.getMinutes()
        
        if (currentHour === preAlarmHour && 
            currentMinute === preAlarmMinute && 
            currentSeconds < 10 && // 10秒以内
            !activeAlarms.has(preAlarmKey) &&
            (!recentAlarms.has(preAlarmKey) || currentTime - recentAlarms.get(preAlarmKey)! > 60000)) {
          
          console.log(`先行アラーム発動: ${alarm.name}`)
          
          activeAlarms.add(preAlarmKey)
          recentAlarms.set(preAlarmKey, currentTime)
          
          // メインウィンドウに通知
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('pre-alarm-triggered', {
              id: alarm.id,
              name: alarm.name,
              hour: alarm.hour,
              minute: alarm.minute
            })
          }
          
          // 10秒後にアクティブリストから削除
          setTimeout(() => {
            activeAlarms.delete(preAlarmKey)
          }, 10000)
        }
      }
      
      // メインアラームのチェック（オフセット対応）
      const alarmTime = new Date()
      alarmTime.setHours(alarm.hour, alarm.minute, 0, 0)
      const offsetAlarmTime = new Date(alarmTime.getTime() - (alarmSettings.globalOffsetSeconds * 1000))
      const offsetHour = offsetAlarmTime.getHours()
      const offsetMinute = offsetAlarmTime.getMinutes()
      const offsetSeconds = offsetAlarmTime.getSeconds()
      
      if (currentHour === offsetHour && 
          currentMinute === offsetMinute && 
          currentSeconds === offsetSeconds &&
          !activeAlarms.has(alarmKey) &&
          (!recentAlarms.has(alarmKey) || currentTime - recentAlarms.get(alarmKey)! > 60000)) {
        
        console.log(`アラーム発動: ${alarm.name}`)
        
        activeAlarms.add(alarmKey)
        recentAlarms.set(alarmKey, currentTime)
        
        // メインウィンドウに通知
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('alarm-triggered', {
            id: alarm.id,
            name: alarm.name,
            hour: alarm.hour,
            minute: alarm.minute
          })
        }
        
        // 10秒後にアクティブリストから削除
        setTimeout(() => {
          activeAlarms.delete(alarmKey)
        }, 10000)
      }
      } catch (loopError) {
        console.error('アラームループエラー:', loopError)
      }
    }
    
    // 古いアラーム履歴を削除（1時間以上前）
    const oneHourAgo = currentTime - 3600000
    for (const [key, timestamp] of recentAlarms.entries()) {
      if (timestamp < oneHourAgo) {
        recentAlarms.delete(key)
      }
    }
  } catch (error) {
    console.error('checkAlarmsエラー:', error)
  }
}

// アラームチェック開始
const startAlarmCheck = (): void => {
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval)
  }
  
  // 1秒ごとにアラームをチェック（設定はメモリから取得）
  alarmCheckInterval = setInterval(checkAlarms, 1000)
  console.log('アラームチェック開始')
}



// このメソッドは、Electronが初期化を終えて、ブラウザウィンドウを作成する準備ができたときに呼び出されます
app.whenReady().then(async () => {
  console.log('Electron アプリケーション起動中...')
  console.log('設定ディレクトリ:', app.getPath('userData'))
  
  // 起動時に全ての設定をメモリにロード
  await loadSettingsToMemory()
  await loadAlarmSettingsToMemory()
  
  await createWindow()
  
  // アラームチェック開始
  startAlarmCheck()

  app.on('activate', async function () {
    // macOSでは、通常、アプリケーションのアイコンがクリックされたときにウィンドウが開いていない場合、
    // ウィンドウを再作成します
    if (BrowserWindow.getAllWindows().length === 0) await createWindow()
  })
})

// Windowsおよび Linuxではすべてのウィンドウが閉じられたときにアプリを終了します
app.on('window-all-closed', () => {
  // アラームチェック停止
  stopAlarmCheck()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// アプリケーション終了前の処理
app.on('before-quit', () => {
  stopAlarmCheck()
}) 