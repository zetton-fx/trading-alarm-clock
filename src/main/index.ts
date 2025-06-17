import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { AppSettings, defaultSettings, sizeMapping } from '../shared/types/settings'
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

// アラーム関連の変数
let alarmCheckInterval: NodeJS.Timeout | null = null
let activeAlarms: Set<string> = new Set() // 現在鳴っているアラーム
let recentAlarms: Map<string, number> = new Map() // 最近鳴ったアラーム（重複防止）

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
  // 設定を読み込み
  const settings = await loadSettings()
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

  // メインウィンドウが閉じられる前の処理
  mainWindow.on('close', () => {
    console.log('メインウィンドウが閉じられています')
    stopAlarmCheck()
  })

  // メインウィンドウが破棄される前の処理
  mainWindow.on('closed', () => {
    console.log('メインウィンドウが破棄されました')
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
    } else {
      console.log('ウィンドウサイズは変更されませんでした')
    }
    
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

  // デバッグ用：アラーム音テスト再生
  ipcMain.handle('test-alarm-sound', async (_, soundFile: string): Promise<void> => {
    console.log('アラーム音テスト再生開始:', soundFile)
    try {
      await playAlarmSound(soundFile)
      console.log('アラーム音テスト再生完了')
    } catch (error) {
      console.error('アラーム音テスト再生エラー:', error)
      throw error
    }
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

// アラーム音の再生（メインプロセス）
const playAlarmSound = async (soundFile: string): Promise<void> => {
  try {
    const path = require('path')
    const fs = require('fs')
    const { exec } = require('child_process')
    
    let soundPath: string
    if (process.env.NODE_ENV === 'development') {
      soundPath = path.join(__dirname, '../../src/assets/sounds', soundFile)
    } else {
      soundPath = path.join(process.resourcesPath, 'assets', 'sounds', soundFile)
    }
    
    console.log('アラーム音を再生開始:', soundPath)
    console.log('ファイルが存在するか:', fs.existsSync(soundPath))
    console.log('プラットフォーム:', process.platform)
    
    if (!fs.existsSync(soundPath)) {
      console.error('音声ファイルが見つかりません:', soundPath)
      
      // 代替パスを試してみる
      const alternativePaths = [
        path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'assets', 'sounds', soundFile),
        path.join(__dirname, '../assets/sounds', soundFile),
        path.join(__dirname, '../../assets/sounds', soundFile)
      ]
      
      for (const altPath of alternativePaths) {
        console.log('代替パスを試行:', altPath)
        if (fs.existsSync(altPath)) {
          console.log('代替パスでファイルを発見:', altPath)
          soundPath = altPath
          break
        }
      }
      
      if (!fs.existsSync(soundPath)) {
        console.error('すべての代替パスでファイルが見つかりませんでした')
        return
      }
    }
    
    // プラットフォーム別に音声再生
    return new Promise((resolve, reject) => {
      let command: string
      
      if (process.platform === 'win32') {
        // Windowsの場合、複数の方法を試す
        command = `powershell -c "try { (New-Object Media.SoundPlayer '${soundPath}').PlaySync(); Write-Host 'Sound played successfully' } catch { Write-Error $_.Exception.Message }"`
      } else if (process.platform === 'darwin') {
        // macOSの場合
        command = `afplay "${soundPath}"`
      } else {
        // Linuxの場合、複数の音声プレイヤーを試す
        command = `aplay "${soundPath}" || paplay "${soundPath}" || ffplay -nodisp -autoexit "${soundPath}" 2>/dev/null`
      }
      
      console.log('実行するコマンド:', command)
      
      exec(command, (error: any, stdout: any, stderr: any) => {
        if (error) {
          console.error('音声再生コマンドエラー:', error)
          console.error('stderr:', stderr)
          reject(error)
        } else {
          console.log('音声再生成功')
          if (stdout) console.log('stdout:', stdout)
          resolve()
        }
      })
    })
  } catch (error) {
    console.error('アラーム音の再生に失敗:', error)
    throw error
  }
}

// アラームの時間チェック
const checkAlarms = async (): Promise<void> => {
  try {
    // メインウィンドウが破棄されている場合はチェックを停止
    if (!mainWindow || mainWindow.isDestroyed()) {
      console.log('メインウィンドウが無効なため、アラームチェックを停止します')
      stopAlarmCheck()
      return
    }

    const alarmSettings = await loadAlarmSettings()
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentSeconds = now.getSeconds()
    const currentTime = now.getTime()
    
    // 有効なアラームをチェック
    for (const alarm of alarmSettings.alarms) {
      if (!alarm.enabled) continue
      
      const alarmKey = `${alarm.id}_${alarm.hour}_${alarm.minute}`
      
      // 先行アラームのチェック
      if (alarm.preAlarmEnabled && alarmSettings.globalPreAlarmEnabled) {
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
          
          console.log(`先行アラーム発動: ${alarm.name} (${alarm.hour}:${String(alarm.minute).padStart(2, '0')})`)
          activeAlarms.add(preAlarmKey)
          recentAlarms.set(preAlarmKey, currentTime)
          
          // 先行アラーム音を再生
          playAlarmSound(alarmSettings.globalPreAlarmSound).catch(err => {
            console.error('先行アラーム音の再生に失敗:', err)
          })
          
          // メインウィンドウに通知
          if (mainWindow && !mainWindow.isDestroyed()) {
            try {
              mainWindow.webContents.send('pre-alarm-triggered', {
                id: alarm.id,
                name: alarm.name,
                hour: alarm.hour,
                minute: alarm.minute
              })
            } catch (error) {
              console.error('先行アラーム通知送信エラー:', error)
            }
          }
          
          // 10秒後にアクティブリストから削除
          setTimeout(() => {
            activeAlarms.delete(preAlarmKey)
          }, 10000)
        }
      }
      
      // メインアラームのチェック
      const adjustedSeconds = alarmSettings.globalOffsetSeconds
      if (currentHour === alarm.hour && 
          currentMinute === alarm.minute && 
          currentSeconds < 10 && // 10秒以内
          !activeAlarms.has(alarmKey) &&
          (!recentAlarms.has(alarmKey) || currentTime - recentAlarms.get(alarmKey)! > 60000)) {
        
        console.log(`アラーム発動: ${alarm.name} (${alarm.hour}:${String(alarm.minute).padStart(2, '0')})`)
        activeAlarms.add(alarmKey)
        recentAlarms.set(alarmKey, currentTime)
        
        // アラーム音を再生
        playAlarmSound(alarmSettings.globalAlarmSound).catch(err => {
          console.error('アラーム音の再生に失敗:', err)
        })
        
        // メインウィンドウに通知
        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            mainWindow.webContents.send('alarm-triggered', {
              id: alarm.id,
              name: alarm.name,
              hour: alarm.hour,
              minute: alarm.minute
            })
          } catch (error) {
            console.error('アラーム通知送信エラー:', error)
          }
        }
        
        // 10秒後にアクティブリストから削除
        setTimeout(() => {
          activeAlarms.delete(alarmKey)
        }, 10000)
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
    console.error('アラームチェック中にエラー:', error)
  }
}

// アラームチェック開始
const startAlarmCheck = (): void => {
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval)
  }
  
  // 1秒ごとにアラームをチェック
  alarmCheckInterval = setInterval(checkAlarms, 1000)
  console.log('アラームチェック開始')
}

// アラームチェック停止
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

// このメソッドは、Electronが初期化を終えて、ブラウザウィンドウを作成する準備ができたときに呼び出されます
app.whenReady().then(async () => {
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